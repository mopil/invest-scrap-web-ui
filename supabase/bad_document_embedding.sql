create extension if not exists vector;

create table if not exists public.bad_document_embedding (
  scrapped_document_id bigint primary key
    references public.scrapped_document(id) on delete cascade,
  embedding_input text not null,
  embedding_vector vector(1536) not null,
  updated_at timestamptz not null default now()
);

create index if not exists bad_document_embedding_vector_idx
  on public.bad_document_embedding
  using hnsw (embedding_vector vector_cosine_ops);

alter table public.bad_document_embedding enable row level security;

grant select, insert, update on public.bad_document_embedding to authenticated;

create policy "bad_document_embedding_select_admin_only"
on public.bad_document_embedding
for select
to authenticated
using (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
);

create policy "bad_document_embedding_insert_admin_only"
on public.bad_document_embedding
for insert
to authenticated
with check (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
);

create policy "bad_document_embedding_update_admin_only"
on public.bad_document_embedding
for update
to authenticated
using (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
)
with check (
  auth.jwt()->>'email' = 'mopil1102@gmail.com'
);
