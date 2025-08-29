import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPin } from '@/lib/security/pin'
import { ClockEventType } from '@prisma/client'

const kioskClockSchema = z.object({
  // In a real-world scenario, you would likely use an employee's unique, public code
  // and then their PIN, to avoid having to search all employees by PIN.
  // This is a simplified approach.
  pin: z.string().length(4),
  type: z.nativeEnum(ClockEventType),
  organizationId: z.string().cuid(), // Kiosk needs to know which org it belongs to
  locationId: z.string().cuid().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { pin, type, organizationId, locationId } = kioskClockSchema.parse(body)

    // This is inefficient. A real implementation would have a way to identify the employee first
    // (e.g., by an external code) before accepting a PIN.
    // Searching all employees is not scalable.
    const employees = await db.employee.findMany({
      where: {
        organizationId: organizationId,
        isActive: true,
        pinHash: {
          not: null,
        },
      },
    })

    let validEmployee = null;
    for (const employee of employees) {
      const isPinValid = await verifyPin(pin, employee.pinHash!);
      if (isPinValid) {
        validEmployee = employee;
        break;
      }
    }

    if (!validEmployee) {
      return new NextResponse('Invalid PIN or employee not found.', { status: 401 })
    }

    // TODO: Add validation logic here to prevent invalid state transitions
    // (e.g., clocking in twice, clocking out without being clocked in).
    // This would create an "incident" instead of a clock event.

    const clockEvent = await db.clockEvent.create({
      data: {
        organizationId: validEmployee.organizationId,
        employeeId: validEmployee.id,
        type: type,
        timestampUtc: new Date(),
        source: 'KIOSK',
        // In a real kiosk, you might get location data from the device
        // lat: kioskDevice.lat,
        // lng: kioskDevice.lng,
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('remote-addr'),
        userAgent: req.headers.get('user-agent'),
      }
    })

    return NextResponse.json({
        message: `Successfully clocked ${type.toLowerCase()} for ${validEmployee.id}`,
        event: clockEvent,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[KIOSK_CLOCK_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
