/**
 * Gabarit des courriels transactionnels (§26).
 *
 *
 * LE CONTENU VIENT D'UTILISATEURS : IL EST ÉCHAPPÉ
 *
 * Le corps d'une notification reprend le message écrit par un client ou par
 * HBG Labs. Inséré tel quel dans du HTML, `<img onerror=...>` s'exécuterait
 * chez le destinataire, et un `</div>` mal placé casserait la mise en page.
 *
 * Les clients de messagerie filtrent beaucoup, mais pas tout, et pas de la
 * même façon. L'échappement est fait ici, une fois, sur toute valeur qui n'est
 * pas écrite dans ce fichier.
 *
 *
 * PAS DE FEUILLE DE STYLE, PAS D'IMAGE, PAS DE SUIVI
 *
 * Les styles sont en ligne : Gmail supprime les balises `<style>` dans
 * certains contextes, et une mise en page qui dépend d'elles s'effondre. Aucune
 * image distante n'est chargée — elle serait bloquée par défaut chez la plupart
 * des destinataires, et un pixel de suivi n'a rien à faire dans un courriel de
 * service.
 */

const BRAND = '#1d4ed8';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Compose le courriel d'une notification.
 *
 * `actionUrl` est un chemin interne (`/dashboard/demandes/…`) : la contrainte
 * `notifications_action_url_relative` l'impose, précisément pour que le domaine
 * soit choisi ici, à l'envoi, et non figé en base où il survivrait à un
 * changement d'environnement.
 */
export function renderNotificationEmail(input: {
  title: string;
  body: string | null;
  actionUrl: string | null;
  appUrl: string;
}): EmailContent {
  const title = escapeHtml(input.title);
  const paragraphs = (input.body ?? '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT}">${escapeHtml(
          block,
        ).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

  // L'URL est construite depuis `appUrl`, dont la fonction Edge est seule
  // dépositaire. Un chemin qui ne commencerait pas par « / » produirait une URL
  // pointant ailleurs : la contrainte en base l'interdit déjà, on n'ajoute pas
  // ici une seconde règle qui donnerait l'illusion que c'est elle qui protège.
  const link = input.actionUrl ? `${input.appUrl}${input.actionUrl}` : null;

  const button = link
    ? `<p style="margin:24px 0 0">
         <a href="${escapeHtml(link)}"
            style="display:inline-block;padding:12px 20px;border-radius:8px;background:${BRAND};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">
           Ouvrir dans mon espace
         </a>
       </p>`
    : '';

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px">
      <tr>
        <td style="padding:28px 28px 8px">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND}">HBG Labs</p>
          <h1 style="margin:0 0 20px;font-size:19px;line-height:1.4;color:${TEXT}">${title}</h1>
          ${paragraphs}
          ${button}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 28px">
          <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${BORDER};font-size:12px;line-height:1.6;color:${MUTED}">
            Ce message vous est adressé parce qu'une demande vous concernant a évolué
            dans votre espace client HBG Labs. Répondez depuis votre espace plutôt qu'à
            ce courriel : les réponses y sont conservées avec la demande.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // Version texte : certains clients ne rendent que celle-ci, et elle sert de
  // repli quand le HTML est bloqué. La produire à partir des mêmes valeurs
  // évite qu'un courriel dise deux choses différentes selon le lecteur.
  const text = [
    input.title,
    '',
    input.body ?? '',
    link ? `\nOuvrir dans mon espace : ${link}` : '',
    '',
    '— HBG Labs. Répondez depuis votre espace client, non à ce courriel.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { subject: input.title, html, text };
}
