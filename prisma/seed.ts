import { PrismaClient, Role, ClockEventType } from '@prisma/client'
import { hashPin } from '../src/lib/security/pin' // Adjust path as needed

const db = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Clean up existing data
  await db.clockEvent.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.employee.deleteMany();
  await db.workShift.deleteMany();
  await db.location.deleteMany();
  await db.membership.deleteMany();
  await db.organization.deleteMany();
  // Note: We are not deleting users_profile as they are tied to Supabase Auth
  // and are harder to recreate. We'll assume the users exist.

  // 1. Create Organization
  const organization = await db.organization.create({
    data: {
      name: 'Demo Corp',
      settings: {
        requireGeofence: false,
        requirePhoto: false,
        ipWhitelist: [],
      },
    },
  })
  console.log(`Created organization: ${organization.name}`)

  // We assume these user IDs correspond to users created in Supabase Auth
  // You MUST create these users in your Supabase project for the seed to work.
  // Email: admin@demo.com, Password: password123
  const adminUserId = 'YOUR_ADMIN_USER_ID_FROM_SUPABASE';
  // Email: employee1@demo.com, Password: password123
  const employeeUserId = 'YOUR_EMPLOYEE_USER_ID_FROM_SUPABASE';

  // 2. Create Memberships
  await db.membership.create({
    data: {
      organizationId: organization.id,
      userId: adminUserId,
      role: Role.ORG_ADMIN,
    },
  })
  await db.membership.create({
    data: {
      organizationId: organization.id,
      userId: employeeUserId,
      role: Role.EMPLOYEE,
    },
  })
  console.log('Created memberships for admin and employee users.')

  // 3. Create Locations
  const location1 = await db.location.create({
    data: {
      organizationId: organization.id,
      name: 'Main Office',
      address: '123 Main St, Anytown, USA',
    },
  })
  const location2 = await db.location.create({
    data: {
      organizationId: organization.id,
      name: 'Warehouse',
      address: '456 Industrial Ave, Anytown, USA',
    },
  })
  console.log('Created locations.')

  // 4. Create Work Shifts
  const morningShift = await db.workShift.create({
    data: {
      organizationId: organization.id,
      name: 'Morning Shift',
      startTime: '09:00:00',
      endTime: '17:00:00',
      breakMinutesDefault: 60,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
  })
  console.log('Created work shifts.')

  // 5. Create Employees
  const adminEmployee = await db.employee.create({
    data: {
      organizationId: organization.id,
      userId: adminUserId,
      pinHash: await hashPin('1234'),
      defaultLocationId: location1.id,
      defaultShiftId: morningShift.id,
    },
  });
  const employee1 = await db.employee.create({
    data: {
      organizationId: organization.id,
      userId: employeeUserId,
      pinHash: await hashPin('1111'),
      defaultLocationId: location1.id,
      defaultShiftId: morningShift.id,
    },
  })
  const employee2 = await db.employee.create({
    data: {
      organizationId: organization.id,
      pinHash: await hashPin('2222'),
      externalCode: 'E1002',
      defaultLocationId: location2.id,
      defaultShiftId: morningShift.id,
    },
  })
  console.log('Created employees.')

  // 6. Generate Clock Events for the past week for employee1
  const today = new Date();
  for (let i = 7; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayOfWeek = date.getDay();

    if (morningShift.daysOfWeek.includes(dayOfWeek)) { // Only seed for working days
      const clockInTime = new Date(date);
      clockInTime.setHours(9, Math.floor(Math.random() * 10), 0, 0); // 09:00-09:09

      const breakStartTime = new Date(clockInTime);
      breakStartTime.setHours(12, 30 + Math.floor(Math.random() * 10), 0, 0);

      const breakEndTime = new Date(breakStartTime);
      breakEndTime.setMinutes(breakStartTime.getMinutes() + 60);

      const clockOutTime = new Date(clockInTime);
      clockOutTime.setHours(17, 0 + Math.floor(Math.random() * 10), 0, 0); // 17:00-17:09

      await db.clockEvent.createMany({
        data: [
          { employeeId: employee1.id, organizationId: organization.id, type: ClockEventType.IN, timestampUtc: clockInTime },
          { employeeId: employee1.id, organizationId: organization.id, type: ClockEventType.BREAK_START, timestampUtc: breakStartTime },
          { employeeId: employee1.id, organizationId: organization.id, type: ClockEventType.BREAK_END, timestampUtc: breakEndTime },
          { employeeId: employee1.id, organizationId: organization.id, type: ClockEventType.OUT, timestampUtc: clockOutTime },
        ]
      })
    }
  }
  console.log(`Seeded clock events for ${employee1.id}`);

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
