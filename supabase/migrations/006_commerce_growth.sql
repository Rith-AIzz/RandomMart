-- Persistent wishlists, genuine reviews, product variants, and inventory history.
create table if not exists public.wishlist_items (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);
create index if not exists wishlist_items_profile_created_idx on public.wishlist_items(profile_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title varchar(120),
  body varchar(2000) not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, product_id)
);
create index if not exists reviews_product_approved_created_idx on public.reviews(product_id, is_approved, created_at desc);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name varchar(120) not null,
  sku varchar(60) not null unique,
  attributes jsonb not null default '{}'::jsonb,
  price_cents integer check (price_cents is null or price_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_active_idx on public.product_variants(product_id, is_active);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason varchar(80) not null,
  reference varchar(120),
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);

alter table public.wishlist_items enable row level security;
alter table public.reviews enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_movements enable row level security;

create policy "users manage own wishlist" on public.wishlist_items for all
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "anyone reads approved reviews" on public.reviews for select using (is_approved or profile_id = auth.uid());
create policy "verified buyers create reviews" on public.reviews for insert with check (
  profile_id = auth.uid() and exists (
    select 1 from public.orders o join public.order_items oi on oi.order_id = o.id
    where o.profile_id = auth.uid() and oi.product_id = reviews.product_id and o.status = 'DELIVERED'
  )
);
create policy "users update own pending reviews" on public.reviews for update
using (profile_id = auth.uid() and not is_approved) with check (profile_id = auth.uid() and not is_approved);

create policy "anyone reads active variants" on public.product_variants for select using (is_active);
