import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const employeeCreateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
  externalCode: z.string().optional(),
  // In a real scenario, you'd invite the user and they would set their own password/profile
  // Or you would generate a secure PIN and a way to communicate it.
  // For now, we'll keep it simple.
})

async function getOrganizationAndRole(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { user: null, organizationId: null, role: null, error: 'User not authenticated' };
    }

    const { data: membership, error: membershipError } = await db.membership.findFirst({
        where: { userId: user.id, isActive: true },
        select: { organizationId: true, role: true },
    });

    if (membershipError || !membership) {
        return { user, organizationId: null, role: null, error: 'User is not an active member of any organization.' };
    }

    return { user, organizationId: membership.organizationId, role: membership.role, error: null };
}


export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { organizationId, role, error } = await getOrganizationAndRole(supabase);

    if (error || !organizationId) {
        return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    if (role !== 'ORG_ADMIN' && role !== 'MANAGER') {
        return new NextResponse('Forbidden: Insufficient permissions', { status: 403 });
    }

    const employees = await db.employee.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: {
            select: {
                fullName: true,
                email: true,
            }
        },
        defaultLocation: true,
        defaultShift: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('[EMPLOYEES_GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { organizationId, role, error: authError } = await getOrganizationAndRole(supabase);

    if (authError || !organizationId) {
        return new NextResponse(authError || 'Unauthorized', { status: 401 });
    }

    if (role !== 'ORG_ADMIN') {
        return new NextResponse('Forbidden: Only Organization Admins can create employees.', { status: 403 });
    }

    const json = await req.json()
    const body = employeeCreateSchema.parse(json)

    // This is a simplified flow. A real app should:
    // 1. Check if a user_profile with this email already exists.
    // 2. If not, maybe invite them via Supabase Auth.
    // 3. Create the employee record and link it to the user_profile.
    const employee = await db.employee.create({
      data: {
        organizationId: organizationId,
        externalCode: body.externalCode,
        // This assumes a user_profile is created separately or doesn't exist yet.
        // For simplicity, we are not creating/linking a user here. We'll just use the email for now.
        // A more robust implementation is needed.
        // For now, we are creating an employee record without a linked user.
        // The user can be linked later.
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[EMPLOYEES_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
