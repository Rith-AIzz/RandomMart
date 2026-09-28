-- Add scoped staff roles without granting them unrestricted administrator access.
alter type public.user_role add value if not exists 'SUPPORT';
alter type public.user_role add value if not exists 'MANAGER';

create or replace function public.can_manage_catalog()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('MANAGER','ADMIN')); $$;

create or replace function public.can_manage_orders()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('SUPPORT','MANAGER','ADMIN')); $$;

revoke all on function public.can_manage_catalog() from public;
revoke all on function public.can_manage_orders() from public;
grant execute on function public.can_manage_catalog() to anon, authenticated;
grant execute on function public.can_manage_orders() to anon, authenticated;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select
using (id = auth.uid() or public.can_manage_orders());

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders" on public.orders for select
using (profile_id = auth.uid() or public.can_manage_orders());

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items" on public.order_items for select
using (exists(select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.can_manage_orders())));

drop policy if exists "users read own payments" on public.payment_records;
create policy "users read own payments" on public.payment_records for select
using (exists(select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.can_manage_orders())));

drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "catalog staff manage categories" on public.categories;
create policy "catalog staff manage categories" on public.categories for all
using (public.can_manage_catalog()) with check (public.can_manage_catalog());

drop policy if exists "admins manage products" on public.products;
drop policy if exists "catalog staff manage products" on public.products;
create policy "catalog staff manage products" on public.products for all
using (public.can_manage_catalog()) with check (public.can_manage_catalog());

drop policy if exists "admins manage images" on public.product_images;
drop policy if exists "catalog staff manage images" on public.product_images;
create policy "catalog staff manage images" on public.product_images for all
using (public.can_manage_catalog()) with check (public.can_manage_catalog());

drop policy if exists "admins manage orders" on public.orders;
drop policy if exists "order staff manage orders" on public.orders;
create policy "order staff manage orders" on public.orders for update
using (public.can_manage_orders()) with check (public.can_manage_orders());

drop policy if exists "admins upload product images" on storage.objects;
drop policy if exists "catalog staff upload product images" on storage.objects;
create policy "catalog staff upload product images" on storage.objects for insert
with check (bucket_id = 'product-images' and public.can_manage_catalog() and (storage.foldername(name))[1] = 'products');

drop policy if exists "admins update product images" on storage.objects;
drop policy if exists "catalog staff update product images" on storage.objects;
create policy "catalog staff update product images" on storage.objects for update
using (bucket_id = 'product-images' and public.can_manage_catalog());

drop policy if exists "admins delete product images" on storage.objects;
drop policy if exists "catalog staff delete product images" on storage.objects;
create policy "catalog staff delete product images" on storage.objects for delete
using (bucket_id = 'product-images' and public.can_manage_catalog());
