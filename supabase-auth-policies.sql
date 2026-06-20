alter table public.messages enable row level security;

drop policy if exists "Anyone can read messages" on public.messages;
drop policy if exists "Anyone can create messages" on public.messages;
drop policy if exists "Authenticated users can read messages" on public.messages;
drop policy if exists "Authenticated users can create messages" on public.messages;

create policy "Authenticated users can read messages"
on public.messages
for select
to authenticated
using (true);

create policy "Authenticated users can create messages"
on public.messages
for insert
to authenticated
with check (true);
