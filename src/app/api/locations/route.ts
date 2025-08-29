import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const locationCreateSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(5),
  lat: z.number().optional(),
  lng: z.number().optional(),
  geofenceRadiusM: z.number().positive().optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
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

    const locations = await db.location.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('[LOCATIONS_GET]', error)
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
        return new NextResponse('Forbidden: Only Organization Admins can create locations.', { status: 403 });
    }

    const json = await req.json()
    const body = locationCreateSchema.parse(json)

    const location = await db.location.create({
      data: {
        organizationId: organizationId,
        name: body.name,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        geofenceRadiusM: body.geofenceRadiusM,
        ipWhitelist: body.ipWhitelist,
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }
    console.error('[LOCATIONS_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
