alter table public.messages enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', policy_record.policyname);
  end loop;
end $$;

revoke select, insert, update, delete on table public.messages from anon;
grant select, insert on table public.messages to authenticated;

create policy "Authenticated users can read messages"
on public.messages
for select
to authenticated
using (auth.role() = 'authenticated');

create policy "Authenticated users can create messages"
on public.messages
for insert
to authenticated
with check (auth.role() = 'authenticated');
