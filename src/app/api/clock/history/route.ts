import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

    const clockEvents = await db.clockEvent.findMany({
        where: { employeeId: employee.id },
        orderBy: { timestampUtc: 'desc' },
        take: 100, // Limit to the last 100 events for performance
    });

    return NextResponse.json(clockEvents);
  } catch (error) {
    console.error('[CLOCK_HISTORY_GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
