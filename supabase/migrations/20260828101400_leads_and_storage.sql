-- =============================================================================
-- 15 — quote_requests, contact_messages, buckets Storage (§4, §5, §35)
-- =============================================================================
-- Deux tables absentes de la liste de §45, mais exigées par §4 et §5 : le
-- visiteur doit pouvoir « demander un devis » (/devis) et « contacter HBG
-- Labs » (/contact).
--
--
-- LES SEULES TABLES OÙ UN VISITEUR ANONYME ÉCRIT
--
-- C'est une surface d'attaque, et elle est traitée comme telle :
--
--   * INSERT seulement. Aucune policy SELECT pour `anon` : un formulaire de
--     contact dont on peut relire les soumissions expose les coordonnées de
--     tous les prospects — et de leurs projets.
--   * Contraintes de longueur strictes sur chaque champ.
--   * Limitation de débit par email (trigger ci-dessous).
--
-- LIMITE CONNUE, ASSUMÉE : sans adresse IP ni captcha, un robot déterminé
-- passe en changeant d'email à chaque envoi. Le durcissement réel — captcha,
-- limitation par IP — appartient à la phase 2, à travers une fonction Edge ;
-- la policy `anon` sera alors révoquée au profit de service_role. Ce qui est
-- ici bloque le spam opportuniste, pas une campagne ciblée. Mieux vaut le dire
-- que le laisser croire.
--
-- L'ADRESSE IP N'EST PAS COLLECTÉE sur ces tables : un prospect n'est pas un
-- utilisateur, il n'a accepté aucune condition, et conserver son IP pour
-- lutter contre le spam demanderait une base légale et une durée de
-- conservation que la V1 ne définit pas.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- quote_requests — /devis
-- -----------------------------------------------------------------------------
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),

  full_name text not null
    constraint quote_requests_full_name_length check (char_length(trim(full_name)) between 2 and 120),

  email text not null
    constraint quote_requests_email_lowercase check (email = lower(email))
    constraint quote_requests_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  phone text
    constraint quote_requests_phone_length check (char_length(trim(phone)) between 4 and 32),

  company_name text
    constraint quote_requests_company_length check (char_length(trim(company_name)) between 2 and 160),

  -- Offre à l'origine de la demande, si le visiteur est parti d'une carte de
  -- la grille tarifaire. RESTRICT : un plan cité par un devis en cours ne
  -- disparaît pas du dossier.
  plan_id uuid
    references public.plans (id) on delete restrict,

  -- Type de projet, texte libre : la typologie évoluera avec l'offre.
  project_type text
    constraint quote_requests_project_type_length check (char_length(trim(project_type)) between 2 and 80),

  budget_range text
    constraint quote_requests_budget_range_length check (char_length(trim(budget_range)) between 2 and 60),

  message text not null
    constraint quote_requests_message_length check (char_length(trim(message)) between 10 and 5000),

  status public.lead_status not null default 'NEW',

  -- Provenance ('website', 'landing_pricing', 'referral'…).
  source text not null default 'website'
    constraint quote_requests_source_format check (source ~ '^[a-z][a-z0-9_]{1,40}$'),

  -- Membre HBG Labs en charge du suivi.
  assigned_to uuid
    references public.profiles (id) on delete set null,

  -- Organisation créée à la conversion. Ferme la boucle : de la demande
  -- anonyme au client facturé.
  converted_organization_id uuid
    references public.organizations (id) on delete set null,

  -- Notes de qualification, réservées à HBG Labs. Sans risque de fuite ici :
  -- aucun utilisateur non-staff ne lit cette table.
  internal_notes text
    constraint quote_requests_internal_notes_length check (char_length(internal_notes) between 1 and 4000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quote_requests_converted_has_status check (
    converted_organization_id is null or status = 'CONVERTED'
  )
);

comment on table public.quote_requests is
  'Demandes de devis (/devis). INSERT anonyme autorisé, SELECT jamais. Lecture réservée au personnel.';

create index quote_requests_status_created_idx
  on public.quote_requests (status, created_at desc);

create index quote_requests_email_created_idx
  on public.quote_requests (email, created_at desc);

create index quote_requests_assigned_to_idx
  on public.quote_requests (assigned_to, created_at desc)
  where assigned_to is not null;

create trigger quote_requests_set_updated_at
  before update on public.quote_requests
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- contact_messages — /contact
-- -----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),

  full_name text not null
    constraint contact_messages_full_name_length check (char_length(trim(full_name)) between 2 and 120),

  email text not null
    constraint contact_messages_email_lowercase check (email = lower(email))
    constraint contact_messages_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  phone text
    constraint contact_messages_phone_length check (char_length(trim(phone)) between 4 and 32),

  subject text not null
    constraint contact_messages_subject_length check (char_length(trim(subject)) between 3 and 200),

  message text not null
    constraint contact_messages_message_length check (char_length(trim(message)) between 10 and 5000),

  status public.lead_status not null default 'NEW',

  source text not null default 'website'
    constraint contact_messages_source_format check (source ~ '^[a-z][a-z0-9_]{1,40}$'),

  -- Horodatage de la réponse apportée.
  responded_at timestamptz,

  responded_by uuid
    references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Messages du formulaire de contact (/contact). INSERT anonyme autorisé, SELECT jamais.';

create index contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

create index contact_messages_email_created_idx
  on public.contact_messages (email, created_at desc);

create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Limitation de débit par email
-- -----------------------------------------------------------------------------
-- Un visiteur légitime envoie une demande, éventuellement deux s'il corrige un
-- oubli. Au-delà de trois en une heure depuis le même email, il s'agit d'un
-- envoi automatisé ou d'une erreur de manipulation.
--
-- SECURITY DEFINER : `anon` n'a aucun droit de lecture sur ces tables, la
-- fonction doit donc compter sous une autre identité que la sienne.
create or replace function public.guard_lead_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recent integer;
begin
  -- Le personnel saisit parfois une demande reçue par téléphone.
  if public.is_trusted_backend() or public.is_platform_staff() then
    return new;
  end if;

  execute format(
    'select count(*) from public.%I where email = $1 and created_at > now() - interval ''1 hour''',
    tg_table_name
  )
  into v_recent
  using new.email;

  if v_recent >= 3 then
    raise exception
      'Trop de demandes envoyées depuis cette adresse. Réessayez dans une heure ou écrivez-nous directement.'
      using errcode = '54000';  -- program_limit_exceeded
  end if;

  return new;
end;
$$;

comment on function public.guard_lead_rate_limit is
  'Limite à 3 envois par email et par heure. Freine le spam opportuniste, pas une campagne ciblée : le durcissement réel (captcha, limite par IP) viendra d''une fonction Edge.';

create trigger quote_requests_rate_limit
  before insert on public.quote_requests
  for each row execute function public.guard_lead_rate_limit();

create trigger contact_messages_rate_limit
  before insert on public.contact_messages
  for each row execute function public.guard_lead_rate_limit();


-- -----------------------------------------------------------------------------
-- RLS : quote_requests
-- -----------------------------------------------------------------------------
alter table public.quote_requests enable row level security;
alter table public.quote_requests force row level security;

-- `anon` obtient INSERT et rien d'autre. Pas de SELECT : sans cette
-- restriction, l'ensemble des prospects de HBG Labs serait lisible depuis la
-- clé publique du site.
revoke all on table public.quote_requests from anon;
grant insert on table public.quote_requests to anon, authenticated;
grant select, update on table public.quote_requests to authenticated;

create policy quote_requests_insert_anon
  on public.quote_requests for insert to anon, authenticated
  with check (
    -- Un visiteur ne préqualifie pas sa propre demande.
    status = 'NEW'
    and assigned_to is null
    and converted_organization_id is null
    and internal_notes is null
  );

create policy quote_requests_select_staff
  on public.quote_requests for select to authenticated
  using (public.is_platform_staff());

create policy quote_requests_update_staff
  on public.quote_requests for update to authenticated
  using (public.is_platform_staff())
  with check (public.is_platform_staff());


-- -----------------------------------------------------------------------------
-- RLS : contact_messages
-- -----------------------------------------------------------------------------
alter table public.contact_messages enable row level security;
alter table public.contact_messages force row level security;

revoke all on table public.contact_messages from anon;
grant insert on table public.contact_messages to anon, authenticated;
grant select, update on table public.contact_messages to authenticated;

create policy contact_messages_insert_anon
  on public.contact_messages for insert to anon, authenticated
  with check (
    status = 'NEW'
    and responded_at is null
    and responded_by is null
  );

create policy contact_messages_select_staff
  on public.contact_messages for select to authenticated
  using (public.is_platform_staff());

create policy contact_messages_update_staff
  on public.contact_messages for update to authenticated
  using (public.is_platform_staff())
  with check (public.is_platform_staff());


-- =============================================================================
-- SUPABASE STORAGE (§35)
-- =============================================================================
-- « Créer des buckets privés lorsque nécessaire. Ne jamais rendre tous les
--   fichiers publics par défaut. Utiliser des signed URLs lorsque nécessaire. »
--
-- Les trois buckets sont PRIVÉS. Aucun n'est public, y compris les logos :
-- un logo d'entreprise cliente n'a pas à être servi par une URL devinable
-- avant même que le site du client ne soit en ligne.
--
--
-- L'ISOLATION REPOSE SUR LE PREMIER SEGMENT DU CHEMIN
--
-- Storage ne connaît ni `organization_id`, ni RLS applicative : il ne voit
-- qu'un chemin. La convention est donc :
--
--     org-logos/{organization_id}/logo-{uuid}.{ext}
--     ticket-attachments/{organization_id}/{ticket_id}/{uuid}-{nom}
--     avatars/{user_id}/avatar-{uuid}.{ext}
--
-- Les policies extraient le premier segment et le confrontent à
-- `is_org_member()`. Écrire hors de son préfixe est donc refusé, et le trigger
-- `stamp_attachment_organization` (migration 11) impose la même règle côté
-- métadonnées.
-- =============================================================================


-- Conversion sûre texte → uuid.
--
-- `(storage.foldername(name))[1]::uuid` échoue avec une erreur 22P02 si le
-- premier segment n'est pas un UUID. Dans une policy, cette erreur remonte à
-- l'utilisateur au lieu d'un simple refus : un objet mal nommé rendrait le
-- bucket entier illisible.
create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $$
begin
  return p_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

comment on function public.safe_uuid is
  'Conversion texte → uuid renvoyant NULL au lieu d''échouer. Utilisée par les policies Storage : un chemin mal formé doit être refusé, pas provoquer une erreur.';

revoke execute on function public.safe_uuid(text) from public;
grant execute on function public.safe_uuid(text) to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------------
-- ON CONFLICT DO NOTHING : la migration doit pouvoir être rejouée sur une base
-- où les buckets existent déjà.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'org-logos', 'org-logos', false,
    2097152,  -- 2 Mio
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'ticket-attachments', 'ticket-attachments', false,
    26214400,  -- 25 Mio — aligné sur ticket_attachments.size_bytes
    array[
      'image/png', 'image/jpeg', 'image/webp', 'image/gif',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'avatars', 'avatars', false,
    1048576,  -- 1 Mio
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- Policies Storage : org-logos
-- -----------------------------------------------------------------------------
create policy "org_logos_select_member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'org-logos'
    and public.is_org_member(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "org_logos_select_staff"
  on storage.objects for select to authenticated
  using (bucket_id = 'org-logos' and public.is_platform_staff());

-- Le dirigeant téléverse le logo de son entreprise, dans son préfixe.
create policy "org_logos_insert_owner"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and public.is_org_owner(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "org_logos_update_owner"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'org-logos'
    and public.is_org_owner(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'org-logos'
    and public.is_org_owner(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "org_logos_delete_owner"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and public.is_org_owner(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "org_logos_all_staff"
  on storage.objects for all to authenticated
  using (bucket_id = 'org-logos' and public.is_platform_admin())
  with check (bucket_id = 'org-logos' and public.is_platform_admin());


-- -----------------------------------------------------------------------------
-- Policies Storage : ticket-attachments
-- -----------------------------------------------------------------------------
-- Le préfixe est l'organisation, pas le ticket : un membre accède aux pièces
-- jointes des tickets de son entreprise, y compris ceux ouverts par un
-- collègue — ce que la RLS de `support_tickets` autorise déjà.
create policy "ticket_attachments_select_member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and public.is_org_member(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "ticket_attachments_select_staff"
  on storage.objects for select to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_platform_staff());

create policy "ticket_attachments_insert_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ticket-attachments'
    and public.is_org_member(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "ticket_attachments_insert_staff"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ticket-attachments' and public.is_platform_staff());

-- Ni UPDATE ni DELETE pour les membres : une pièce jointe versée à un dossier
-- de support ne se remplace pas discrètement. La suppression est une opération
-- d'administration.
create policy "ticket_attachments_modify_admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_platform_admin())
  with check (bucket_id = 'ticket-attachments' and public.is_platform_admin());

create policy "ticket_attachments_delete_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_platform_admin());


-- -----------------------------------------------------------------------------
-- Policies Storage : avatars
-- -----------------------------------------------------------------------------
-- Préfixé par l'identifiant utilisateur : chacun gère le sien.
create policy "avatars_select_authenticated"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      public.safe_uuid((storage.foldername(name))[1]) = (select auth.uid())
      or public.shares_organization_with(public.safe_uuid((storage.foldername(name))[1]))
      or public.is_platform_staff()
    )
  );

create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and public.safe_uuid((storage.foldername(name))[1]) = (select auth.uid())
  );

create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and public.safe_uuid((storage.foldername(name))[1]) = (select auth.uid())
  )
  with check (
    bucket_id = 'avatars'
    and public.safe_uuid((storage.foldername(name))[1]) = (select auth.uid())
  );

create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and public.safe_uuid((storage.foldername(name))[1]) = (select auth.uid())
  );
