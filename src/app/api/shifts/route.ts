import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const shiftCreateSchema = z.object({
  name: z.string().min(3),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
  breakMinutesDefault: z.coerce.number().int().min(0).default(0),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, "At least one day must be selected"),
  tz: z.string().optional().default('UTC'),
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

    const shifts = await db.workShift.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('[SHIFTS_GET]', error)
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
        return new NextResponse('Forbidden: Only Organization Admins can create shifts.', { status: 403 });
    }

    const json = await req.json()
    const body = shiftCreateSchema.parse(json)

    const shift = await db.workShift.create({
      data: {
        organizationId: organizationId,
        name: body.name,
        startTime: `${body.startTime}:00`, // Add seconds for consistency
        endTime: `${body.endTime}:00`,
        breakMinutesDefault: body.breakMinutesDefault,
        daysOfWeek: body.daysOfWeek,
        tz: body.tz,
      },
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[SHIFTS_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
