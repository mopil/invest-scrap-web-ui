alter table public.scrapped_document enable row level security;

grant usage on schema public to anon, authenticated;
grant select, update on public.scrapped_document to authenticated;

create policy "scrapped_document_select_admin_only"
on public.scrapped_document
for select
to authenticated
using (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
);

create policy "scrapped_document_update_admin_only"
on public.scrapped_document
for update
to authenticated
using (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
)
with check (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
);
