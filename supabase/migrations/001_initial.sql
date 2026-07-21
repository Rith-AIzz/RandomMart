create extension if not exists pgcrypto;
create type public.user_role as enum ('CUSTOMER','ADMIN');
create type public.order_status as enum ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED');
create type public.payment_status as enum ('PENDING','APPROVED','DECLINED','REFUNDED');
create type public.payment_method as enum ('CASH_ON_DELIVERY','DEMO_CARD');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email varchar(254) unique not null, full_name varchar(120) not null, phone varchar(30), role public.user_role not null default 'CUSTOMER', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.addresses (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade, label varchar(50) not null, recipient varchar(120) not null, line1 varchar(180) not null, line2 varchar(180), city varchar(100) not null, region varchar(100), postal_code varchar(30), country varchar(100) not null, is_default boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name varchar(80) not null, slug varchar(90) unique not null, description varchar(500), image_path varchar(500), is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id) on delete restrict, name varchar(140) not null, slug varchar(160) unique not null, short_description varchar(240) not null, description text not null, price_cents integer not null check (price_cents > 0), discount_cents integer check (discount_cents >= 0 and discount_cents < price_cents), sku varchar(60) unique not null, stock_quantity integer not null default 0 check (stock_quantity >= 0), is_active boolean not null default true, is_featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, path varchar(500) not null, alt_text varchar(180) not null, mime_type varchar(80) not null, size_bytes integer not null check (size_bytes > 0), sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.carts (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index one_active_cart_per_profile on public.carts(profile_id) where is_active;
create table public.cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade, product_id uuid not null references public.products(id) on delete restrict, quantity integer not null check (quantity > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(cart_id, product_id));
create table public.orders (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete restrict, order_number varchar(40) unique not null, idempotency_key varchar(100) unique not null, status public.order_status not null default 'PENDING', subtotal_cents integer not null check (subtotal_cents >= 0), discount_cents integer not null check (discount_cents >= 0), shipping_cents integer not null check (shipping_cents >= 0), total_cents integer not null check (total_cents >= 0), shipping_name varchar(120) not null, shipping_address jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id) on delete set null, product_name varchar(140) not null, product_sku varchar(60) not null, product_image varchar(500), unit_price_cents integer not null check (unit_price_cents >= 0), quantity integer not null check (quantity > 0), line_total_cents integer not null check (line_total_cents >= 0));
create table public.payment_records (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, method public.payment_method not null, status public.payment_status not null, amount_cents integer not null check (amount_cents >= 0), demo_reference varchar(100), created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action varchar(100) not null, entity_type varchar(80) not null, entity_id varchar(100), metadata jsonb, created_at timestamptz not null default now());

create index products_category_idx on public.products(category_id);
create index products_active_created_idx on public.products(is_active, created_at desc);
create index orders_owner_created_idx on public.orders(profile_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index addresses_owner_idx on public.addresses(profile_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Customer')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'); $$;

alter table public.profiles enable row level security; alter table public.addresses enable row level security; alter table public.categories enable row level security; alter table public.products enable row level security; alter table public.product_images enable row level security; alter table public.carts enable row level security; alter table public.cart_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.payment_records enable row level security; alter table public.audit_logs enable row level security;

create policy "public reads active categories" on public.categories for select using (is_active or public.is_admin());
create policy "public reads active products" on public.products for select using (is_active or public.is_admin());
create policy "public reads images for active products" on public.product_images for select using (exists(select 1 from public.products p where p.id=product_id and p.is_active) or public.is_admin());
create policy "users read own profile" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "users update safe own profile" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=(select p.role from public.profiles p where p.id=auth.uid()));
create policy "users manage own addresses" on public.addresses for all using (profile_id=auth.uid() or public.is_admin()) with check (profile_id=auth.uid() or public.is_admin());
create policy "users manage own carts" on public.carts for all using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy "users manage own cart items" on public.cart_items for all using (exists(select 1 from public.carts c where c.id=cart_id and c.profile_id=auth.uid())) with check (exists(select 1 from public.carts c where c.id=cart_id and c.profile_id=auth.uid()));
create policy "users read own orders" on public.orders for select using (profile_id=auth.uid() or public.is_admin());
create policy "users read own order items" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and (o.profile_id=auth.uid() or public.is_admin())));
create policy "users read own payments" on public.payment_records for select using (exists(select 1 from public.orders o where o.id=order_id and (o.profile_id=auth.uid() or public.is_admin())));
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
create policy "public reads product images" on storage.objects for select using (bucket_id='product-images');
create policy "admins upload product images" on storage.objects for insert with check (bucket_id='product-images' and public.is_admin() and (storage.foldername(name))[1]='products');
create policy "admins update product images" on storage.objects for update using (bucket_id='product-images' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete using (bucket_id='product-images' and public.is_admin());
