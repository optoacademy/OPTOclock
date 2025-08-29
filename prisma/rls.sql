-- This script contains the Row Level Security (RLS) policies for the application.
-- It is designed to be run in the Supabase SQL Editor.
-- These policies are essential for the multi-tenant architecture.

-- Helper function to get the role of the current user in a specific organization.
-- This is a simplified version. A real implementation might need to handle multiple memberships.
create or replace function get_my_role(org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select role
    from memberships
    where user_id = auth.uid() and organization_id = org_id and is_active = true
    limit 1
  );
end;
$$;


-- =============================================
-- Table: organizations
-- =============================================
alter table public.organizations enable row level security;

create policy "users_see_own_orgs"
on public.organizations for select
using (
  id in (select organization_id from memberships where user_id = auth.uid() and is_active = true)
);

-- Org admins can update their own organization's settings.
create policy "org_admins_update_own_org"
on public.organizations for update
using (
  id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
);


-- =============================================
-- Table: users_profile
-- =============================================
alter table public.users_profile enable row level security;

-- Users can see and edit their own profile.
create policy "users_manage_own_profile"
on public.users_profile for all
using (
  id = auth.uid()
);

-- Users can see the profiles of other members of their organization.
create policy "users_see_org_members_profiles"
on public.users_profile for select
using (
  exists (
    select 1 from memberships m1
    where m1.user_id = auth.uid() and m1.is_active = true
      and exists (
        select 1 from memberships m2
        where m2.organization_id = m1.organization_id and m2.user_id = public.users_profile.id
      )
  )
);


-- =============================================
-- Table: memberships
-- =============================================
alter table public.memberships enable row level security;

-- Users can see their own membership.
create policy "users_see_own_membership"
on public.memberships for select
using (
  user_id = auth.uid()
);

-- Org admins can see all memberships in their organization.
create policy "org_admins_see_org_memberships"
on public.memberships for select
using (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
);

-- Org admins can add/remove users from their organization.
create policy "org_admins_manage_org_memberships"
on public.memberships for all
using (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
) with check (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
);


-- =============================================
-- Table: clock_events
-- =============================================
alter table public.clock_events enable row level security;

-- Employees can see their own clock events.
create policy "employee_sees_own_clock_events"
on public.clock_events for select
using (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.is_active)
  and exists (
    select 1 from employees e
    where e.id = clock_events.employee_id
      and e.organization_id = clock_events.organization_id
      and e.user_id = auth.uid()
  )
);

-- Employees can create their own clock events.
create policy "employee_creates_own_clock_events"
on public.clock_events for insert
with check (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.is_active)
  and exists (
    select 1 from employees e
    where e.id = clock_events.employee_id
      and e.organization_id = clock_events.organization_id
      and e.user_id = auth.uid()
  )
);

-- Org admins and managers have full access to clock events in their organization.
create policy "org_admins_full_crud_clock_events"
on public.clock_events for all
using (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.role in ('ORG_ADMIN','MANAGER') and m.is_active)
)
with check (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.role in ('ORG_ADMIN','MANAGER') and m.is_active)
);


-- =============================================
-- Table: employees
-- =============================================
alter table public.employees enable row level security;

-- Employees can see their own employee record.
create policy "employee_sees_own_record"
on public.employees for select
using (
  user_id = auth.uid()
);

-- Org admins and managers can see all employee records in their organization.
create policy "org_admins_see_all_employees"
on public.employees for select
using (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role in ('ORG_ADMIN', 'MANAGER') and is_active = true)
);

-- Org admins can manage all employee records in their organization.
create policy "org_admins_manage_all_employees"
on public.employees for all
using (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
) with check (
  organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true)
);


-- =============================================
-- Table: leave_requests
-- =============================================
alter table public.leave_requests enable row level security;

-- Employees can manage their own leave requests.
create policy "employee_manages_own_leave_requests"
on public.leave_requests for all
using (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.is_active)
  and exists (
    select 1 from employees e
    where e.id = leave_requests.employee_id
      and e.organization_id = leave_requests.organization_id
      and e.user_id = auth.uid()
  )
) with check (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.is_active)
  and exists (
    select 1 from employees e
    where e.id = leave_requests.employee_id
      and e.organization_id = leave_requests.organization_id
      and e.user_id = auth.uid()
  )
);

-- Org admins and managers have full access to leave requests in their organization.
create policy "org_admins_full_crud_leave_requests"
on public.leave_requests for all
using (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.role in ('ORG_ADMIN','MANAGER') and m.is_active)
)
with check (
  organization_id in (select organization_id from memberships m where m.user_id = auth.uid() and m.role in ('ORG_ADMIN','MANAGER') and m.is_active)
);


-- =============================================
-- Apply RLS to all other relevant tables
-- =============================================

-- Locations
alter table public.locations enable row level security;
create policy "org_members_see_locations" on public.locations for select using (organization_id in (select organization_id from memberships where user_id = auth.uid() and is_active = true));
create policy "org_admins_manage_locations" on public.locations for all using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true));

-- Work Shifts
alter table public.work_shifts enable row level security;
create policy "org_members_see_work_shifts" on public.work_shifts for select using (organization_id in (select organization_id from memberships where user_id = auth.uid() and is_active = true));
create policy "org_admins_manage_work_shifts" on public.work_shifts for all using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true));

-- Incidents
alter table public.incidents enable row level security;
create policy "employee_sees_own_incidents" on public.incidents for select using (exists (select 1 from employees e where e.id = incidents.employee_id and e.user_id = auth.uid()));
create policy "org_admins_manage_incidents" on public.incidents for all using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role in ('ORG_ADMIN', 'MANAGER') and is_active = true));

-- Audit Logs
alter table public.audit_logs enable row level security;
create policy "org_admins_see_audit_logs" on public.audit_logs for select using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true));

-- Webhooks
alter table public.webhooks enable row level security;
create policy "org_admins_manage_webhooks" on public.webhooks for all using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'ORG_ADMIN' and is_active = true));
