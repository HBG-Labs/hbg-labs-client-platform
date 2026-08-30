import { supabase } from '@/lib/supabase';

/**
 * Pièces jointes des demandes (§35).
 *
 *
 * DEUX ÉCRITURES, UN SEUL ORDRE POSSIBLE
 *
 * Une pièce jointe existe à deux endroits : les octets dans le bucket privé
 * `ticket-attachments`, la fiche dans `ticket_attachments`. Rien ne rend les
 * deux écritures atomiques.
 *
 * L'ordre retenu est donc : **l'objet d'abord, la fiche ensuite**. Si la fiche
 * échoue, il reste un objet que rien ne référence — invisible dans
 * l'interface, sans conséquence pour le client. L'ordre inverse produirait une
 * fiche sans objet : une pièce jointe affichée dont le téléchargement échoue,
 * ce qui est bien pire.
 *
 * Le client ne peut pas effacer l'objet orphelin, et c'est voulu : la policy
 * Storage réserve la suppression à l'administration (migration 15 — « une pièce
 * jointe versée à un dossier de support ne se remplace pas discrètement »).
 *
 *
 * LE CHEMIN PORTE L'ISOLATION
 *
 * `{organization_id}/{ticket_id}/{uuid}-{nom}`. Storage ne connaît pas la RLS
 * applicative : il ne voit qu'un chemin, dont il extrait le premier segment
 * pour le confronter à `is_org_member`. Écrire hors de son préfixe est refusé
 * deux fois — par la policy Storage, et par le trigger
 * `stamp_attachment_organization`, qui recalcule l'organisation depuis le
 * ticket au lieu de croire la valeur transmise.
 */

const BUCKET = 'ticket-attachments';

/** Aligné sur le plafond du bucket et sur `ticket_attachments_size_range`. */
export const MAX_ATTACHMENT_BYTES = 26_214_400;

/**
 * Types acceptés, pour l'attribut `accept` du champ de fichier.
 *
 * C'est une COMMODITÉ, pas une règle : le bucket porte sa propre liste
 * (migration 15) et refuse tout le reste, quoi qu'annonce le navigateur. Un
 * fichier écarté par le bucket voit son message d'erreur remonté tel quel
 * plutôt que reformulé — c'est lui qui a tranché.
 */
export const ACCEPTED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string | null;
  author: { full_name: string | null; email: string } | null;
}

/**
 * Pièces jointes d'une demande.
 *
 * Aucun filtre sur l'organisation : `ticket_attachments_select_member` s'appuie
 * sur `can_read_ticket`, la même fonction qui gouverne la lecture des messages.
 * Un utilisateur qui demanderait les pièces d'une demande qui n'est pas la
 * sienne reçoit une liste vide.
 */
export async function fetchTicketAttachments(
  ticketId: string,
): Promise<TicketAttachment[]> {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .select(
      `id, ticket_id, storage_path, file_name, mime_type, size_bytes,
       created_at, uploaded_by,
       author:profiles ( full_name, email )`,
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const author = row.author;
    return {
      ...row,
      author: Array.isArray(author) ? (author[0] ?? null) : (author ?? null),
    } as TicketAttachment;
  });
}

export interface UploadAttachmentInput {
  ticketId: string;
  organizationId: string;
  file: File;
}

export async function uploadTicketAttachment({
  ticketId,
  organizationId,
  file,
}: UploadAttachmentInput): Promise<void> {
  if (file.size === 0) {
    throw new Error('Ce fichier est vide.');
  }

  // Le plafond est vérifié ici pour éviter de téléverser vingt-cinq mégaoctets
  // avant d'apprendre qu'ils sont refusés. Le bucket le vérifie aussi, et c'est
  // lui qui fait autorité.
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `Ce fichier dépasse ${Math.round(MAX_ATTACHMENT_BYTES / 1_048_576)} Mo.`,
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Session expirée. Reconnectez-vous.');

  const fileName = sanitizeFileName(file.name);
  const path = `${organizationId}/${ticketId}/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      // Jamais d'écrasement : le chemin porte un identifiant unique, et un
      // `upsert` masquerait une collision au lieu de la signaler.
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { error: metadataError } = await supabase.from('ticket_attachments').insert({
    ticket_id: ticketId,
    // `organization_id` est transmis parce que la colonne est NOT NULL, mais le
    // trigger le remplace par celui du ticket : c'est la base qui tranche, pas
    // le navigateur.
    organization_id: organizationId,
    storage_path: path,
    file_name: fileName,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    uploaded_by: auth.user.id,
  });

  if (metadataError) throw metadataError;
}

/**
 * URL de téléchargement, valable une minute.
 *
 * Le bucket est privé : aucune URL publique n'existe. Le lien est signé à la
 * demande et n'est jamais conservé — une URL signée mise en cache continuerait
 * d'ouvrir le document après la révocation de l'accès de son porteur.
 */
export async function createAttachmentDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60, { download: true });

  if (error) throw error;
  if (!data?.signedUrl) throw new Error('Le lien de téléchargement n’a pas pu être créé.');

  return data.signedUrl;
}

/**
 * Supprime une pièce jointe. Réservé à l'administration plateforme.
 *
 * L'objet part avant la fiche. Si la seconde suppression échoue, l'interface
 * affiche encore la pièce jointe et l'administrateur peut relancer :
 * `remove` sur un objet déjà absent n'est pas une erreur, la reprise aboutit.
 * L'ordre inverse laisserait une fiche disparue et des octets orphelins que
 * plus rien ne désigne.
 */
export async function deleteTicketAttachment(attachment: TicketAttachment): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([attachment.storage_path]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from('ticket_attachments')
    .delete()
    .eq('id', attachment.id);

  if (error) throw error;
}

/**
 * Nom de fichier réduit à ce qu'un chemin Storage accepte.
 *
 * Les séparateurs sont écartés en premier : un nom contenant « ../ » sortirait
 * du préfixe d'organisation, c'est-à-dire du périmètre que la policy Storage
 * vérifie. Le reste — accents, espaces, caractères de contrôle — est réduit
 * pour que le chemin reste lisible dans le tableau de bord Supabase.
 *
 * La longueur est bornée à 180 caractères : `storage_path` en accepte 512, et
 * le préfixe (deux UUID, un UUID de fichier, trois séparateurs) en consomme une
 * centaine.
 */
function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    // `\p{Diacritic}` plutôt qu'une plage de points de code : « facture-été.pdf »
    // devient « facture-ete.pdf », et l'intention se lit dans le motif au lieu
    // de se deviner derrière des caractères combinants invisibles.
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);

  return cleaned || 'fichier';
}
