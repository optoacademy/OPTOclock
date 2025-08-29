import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hashPin } from '@/lib/security/pin'

const setPinSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits."),
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

export async function POST(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { organizationId, role, error: authError } = await getOrganizationAndRole(supabase);

    if (authError || !organizationId) {
        return new NextResponse(authError || 'Unauthorized', { status: 401 });
    }

    if (role !== 'ORG_ADMIN') {
        return new NextResponse('Forbidden: Only Organization Admins can set PINs.', { status: 403 });
    }

    // Check if the employee belongs to the admin's organization
    const employee = await db.employee.findFirst({
        where: {
            id: params.employeeId,
            organizationId: organizationId,
        }
    });

    if (!employee) {
        return new NextResponse('Employee not found in this organization.', { status: 404 });
    }

    const json = await req.json()
    const body = setPinSchema.parse(json)

    const newPinHash = await hashPin(body.pin);

    await db.employee.update({
        where: {
            id: params.employeeId,
        },
        data: {
            pinHash: newPinHash,
        }
    });

    return NextResponse.json({ message: "PIN updated successfully." }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[SET_PIN_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
