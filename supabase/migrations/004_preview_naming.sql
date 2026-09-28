-- Keep existing databases compatible with the preview/test terminology.
do $$
begin
  if exists (
    select 1
    from pg_enum entry
    join pg_type kind on kind.oid = entry.enumtypid
    join pg_namespace scope on scope.oid = kind.typnamespace
    where scope.nspname = 'public'
      and kind.typname = 'payment_method'
      and entry.enumlabel = 'DE' || 'MO_CARD'
  ) then
    execute format(
      'alter type public.payment_method rename value %L to %L',
      'DE' || 'MO_CARD',
      'TEST_CARD'
    );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_records'
      and column_name = 'de' || 'mo_reference'
  ) then
    execute format(
      'alter table public.payment_records rename column %I to test_reference',
      'de' || 'mo_reference'
    );
  end if;
end
$$;
