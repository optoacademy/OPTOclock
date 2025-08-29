import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LeaveRequestType } from '@prisma/client'

const leaveRequestCreateSchema = z.object({
  type: z.nativeEnum(LeaveRequestType),
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  reason: z.string().min(10, 'Reason must be at least 10 characters.'),
  attachmentUrl: z.string().url().optional(),
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


export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { employee, error: authError } = await getAuthenticatedEmployee(supabase);

    if (authError || !employee) {
        return new NextResponse(authError || 'Unauthorized', { status: 401 });
    }

    const leaveRequests = await db.leaveRequest.findMany({
        where: { employeeId: employee.id },
        orderBy: { startUtc: 'desc' },
    });

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('[LEAVE_REQUESTS_GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { employee, error: authError } = await getAuthenticatedEmployee(supabase);

    if (authError || !employee) {
        return new NextResponse(authError || 'Unauthorized', { status: 401 });
    }

    const body = await req.json()
    const { type, startUtc, endUtc, reason, attachmentUrl } = leaveRequestCreateSchema.parse(body);

    const leaveRequest = await db.leaveRequest.create({
        data: {
            organizationId: employee.organizationId,
            employeeId: employee.id,
            type,
            startUtc: new Date(startUtc),
            endUtc: new Date(endUtc),
            reason,
            attachmentUrl,
            status: 'PENDING', // Default status
        }
    });

    // TODO: Trigger a notification to the organization's admin/manager

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[LEAVE_REQUESTS_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
