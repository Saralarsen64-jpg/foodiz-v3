insert into storage.buckets (id, name, public)
values ('partner-documents-private', 'partner-documents-private', false)
on conflict (id) do nothing;

create policy partner_documents_storage_select_owner_or_admin
on storage.objects
for select
using (
  bucket_id = 'partner-documents-private'
  and public.storage_partner_document_path_is_valid(name)
  and (
    public.is_admin()
    or (
      public.is_partner()
      and public.storage_partner_id_from_object_name(name) is not null
      and public.owns_partner(public.storage_partner_id_from_object_name(name))
    )
  )
);

create policy partner_documents_storage_insert_owner_or_admin
on storage.objects
for insert
with check (
  bucket_id = 'partner-documents-private'
  and public.storage_partner_document_path_is_valid(name)
  and (
    public.is_admin()
    or (
      public.is_partner()
      and public.storage_partner_id_from_object_name(name) is not null
      and public.owns_partner(public.storage_partner_id_from_object_name(name))
    )
  )
);

create policy partner_documents_storage_update_owner_or_admin
on storage.objects
for update
using (
  bucket_id = 'partner-documents-private'
  and public.storage_partner_document_path_is_valid(name)
  and (
    public.is_admin()
    or (
      public.is_partner()
      and public.storage_partner_id_from_object_name(name) is not null
      and public.owns_partner(public.storage_partner_id_from_object_name(name))
    )
  )
)
with check (
  bucket_id = 'partner-documents-private'
  and public.storage_partner_document_path_is_valid(name)
  and (
    public.is_admin()
    or (
      public.is_partner()
      and public.storage_partner_id_from_object_name(name) is not null
      and public.owns_partner(public.storage_partner_id_from_object_name(name))
    )
  )
);

create policy partner_documents_storage_delete_owner_or_admin
on storage.objects
for delete
using (
  bucket_id = 'partner-documents-private'
  and public.storage_partner_document_path_is_valid(name)
  and (
    public.is_admin()
    or (
      public.is_partner()
      and public.storage_partner_id_from_object_name(name) is not null
      and public.owns_partner(public.storage_partner_id_from_object_name(name))
    )
  )
);
