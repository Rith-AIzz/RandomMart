-- Enforce one default address per customer and avoid self-referencing RLS checks.
create unique index if not exists one_default_address_per_profile
  on public.addresses(profile_id)
  where is_default;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "users update safe own profile" on public.profiles;
create policy "users update safe own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());
