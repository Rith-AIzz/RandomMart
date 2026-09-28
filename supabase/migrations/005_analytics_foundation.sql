-- Profitability snapshots, order outcomes, saved reports, and in-app notifications.
alter table public.products add column if not exists cost_cents integer not null default 0 check (cost_cents >= 0);
alter table public.orders add column if not exists tax_cents integer not null default 0 check (tax_cents >= 0);
alter table public.orders add column if not exists refunded_cents integer not null default 0 check (refunded_cents >= 0);
alter table public.orders add column if not exists cancellation_reason varchar(500);
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.order_items add column if not exists unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0);
alter table public.order_items add column if not exists line_cost_cents integer not null default 0 check (line_cost_cents >= 0);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(80) not null,
  filters jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, name)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind varchar(50) not null,
  title varchar(140) not null,
  message varchar(500) not null,
  href varchar(500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists saved_reports_profile_updated_idx on public.saved_reports(profile_id, updated_at desc);
create index if not exists notifications_profile_read_created_idx on public.notifications(profile_id, read_at, created_at desc);

alter table public.saved_reports enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "users manage own saved reports" on public.saved_reports;
create policy "users manage own saved reports" on public.saved_reports for all
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select
using (profile_id = auth.uid());

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update
using (profile_id = auth.uid()) with check (profile_id = auth.uid());
