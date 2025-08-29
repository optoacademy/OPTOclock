import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClockEventType } from '@prisma/client'

const clockSchema = z.object({
  type: z.nativeEnum(ClockEventType),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
})

// Helper to get the employee record for the currently authenticated user
async function getAuthenticatedEmployee(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { employee: null, error: 'User not authenticated' };
    }

    const employee = await db.employee.findFirst({
        where: { userId: user.id, isActive: true },
    });

    if (!employee) {
        return { employee: null, error: 'No active employee record found for this user.' };
    }

    return { employee, error: null };
}

// Helper to get the last clock event for an employee
async function getLastEvent(employeeId: string) {
    return db.clockEvent.findFirst({
        where: { employeeId },
        orderBy: { timestampUtc: 'desc' },
    });
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { employee, error: authError } = await getAuthenticatedEmployee(supabase);

    if (authError || !employee) {
        return new NextResponse(authError || 'Unauthorized', { status: 401 });
    }

    const body = await req.json()
    const { type, lat, lng, notes } = clockSchema.parse(body)

    const lastEvent = await getLastEvent(employee.id);
    const lastEventType = lastEvent?.type;

    // State validation logic
    const invalidTransitions: Record<string, ClockEventType[]> = {
        'null': [ClockEventType.OUT, ClockEventType.BREAK_START, ClockEventType.BREAK_END], // Can only clock IN if no prior events
        [ClockEventType.IN]: [ClockEventType.IN, ClockEventType.BREAK_END],
        [ClockEventType.OUT]: [ClockEventType.IN, ClockEventType.OUT, ClockEventType.BREAK_START, ClockEventType.BREAK_END],
        [ClockEventType.BREAK_START]: [ClockEventType.IN, ClockEventType.BREAK_START],
        [ClockEventType.BREAK_END]: [ClockEventType.IN, ClockEventType.BREAK_END],
    }

    const transitions = invalidTransitions[String(lastEventType)] || [];
    if (transitions.includes(type)) {
        return new NextResponse(`Invalid action. Cannot clock ${type} after ${lastEventType}.`, { status: 409 }); // 409 Conflict
    }

    // TODO: Add geofence and IP whitelist validation from organization settings

    const clockEvent = await db.clockEvent.create({
        data: {
            organizationId: employee.organizationId,
            employeeId: employee.id,
            type: type,
            timestampUtc: new Date(),
            source: 'WEB',
            lat,
            lng,
            notes,
            ip: req.headers.get('x-forwarded-for') ?? req.headers.get('remote-addr'),
            userAgent: req.headers.get('user-agent'),
        }
    });

    return NextResponse.json(clockEvent, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[CLOCK_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// GET endpoint to fetch current status and last event
export async function GET() {
    try {
        const supabase = createServerSupabaseClient();
        const { employee, error: authError } = await getAuthenticatedEmployee(supabase);

        if (authError || !employee) {
            return new NextResponse(authError || 'Unauthorized', { status: 401 });
        }

        const lastEvent = await getLastEvent(employee.id);

        return NextResponse.json({
            isClockedIn: lastEvent?.type === ClockEventType.IN || lastEvent?.type === ClockEventType.BREAK_END,
            isOnBreak: lastEvent?.type === ClockEventType.BREAK_START,
            lastEvent: lastEvent,
        });

    } catch (error) {
        console.error('[CLOCK_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
