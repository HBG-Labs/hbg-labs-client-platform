import { handleRequest, jsonResponse } from '../_shared/http.ts';
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { VercelApi, type VercelProjectDomain } from '../_shared/vercel.ts';

/**
 * État réel des sites et des domaines, lu chez Vercel (§17, §33).
 *
 *
 * CE QUE CETTE FONCTION REMPLACE
 *
 * Jusqu'ici, `verification_source` valait `NONE` partout, et l'interface
 * affichait « Vérification non configurée » — honnêtement, mais sans rien
 * apprendre au client. Les contraintes de la base l'imposaient : source `NONE`
 * ⇒ tous les statuts à `UNKNOWN`. C'était le seul état vrai.
 *
 * Passer à `VERCEL_API` est donc une AFFIRMATION : « cet état vient d'une API,
 * à telle heure ». Elle n'est écrite qu'après une réponse effective de Vercel.
 *
 *
 * TROIS CHOSES QUE CETTE FONCTION N'ÉCRIT PAS
 *
 *   * `websites.status` — déclaré par HBG Labs, et de nature différente. Un
 *     déploiement réussi ne signifie pas qu'un site est « en ligne » au sens
 *     commercial : il peut être en préproduction, ou suspendu.
 *   * `websites.production_url` — saisi par un opérateur. L'écraser avec l'URL
 *     technique d'un déploiement (`projet-a1b2.vercel.app`) remplacerait
 *     l'adresse que le client connaît par une qui change à chaque mise en ligne.
 *   * `domains.status` pour un domaine acheté ailleurs — Vercel ignore l'état
 *     d'enregistrement d'un domaine dont il n'est pas registrar. `UNKNOWN` reste
 *     la seule réponse vraie.
 *
 *
 * UNE PANNE DE NOTRE CÔTÉ N'EST PAS UN INCIDENT CLIENT
 *
 * Si l'API répond mal, la ligne n'est pas touchée. Écrire `ssl_status = ERROR`
 * parce que NOTRE appel a échoué afficherait une alerte rouge sur le site d'un
 * client dont le certificat va très bien.
 */

/** Nombre de sites traités par exécution. */
const BATCH_SIZE = 25;

interface WebsiteRow {
  id: string;
  vercel_project_id: string;
  vercel_team_id: string | null;
}

interface DomainRow {
  id: string;
  domain: string;
  website_id: string;
}

Deno.serve((request) =>
  handleRequest(request, async (req) => {
    requireServiceRole(req);

    const admin = adminClient();
    const vercel = new VercelApi();

    const { data, error } = await admin
      .from('websites')
      .select('id, vercel_project_id, vercel_team_id')
      .not('vercel_project_id', 'is', null)
      // Les moins récemment vérifiés d'abord : sur plusieurs exécutions, tous
      // finissent par passer, sans qu'un site reste indéfiniment en arrière.
      .order('checked_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Lecture des sites impossible :', error);
      throw error;
    }

    const websites = (data ?? []) as WebsiteRow[];
    const outcome = { sites: 0, domaines: 0, echecs: 0 };

    for (const website of websites) {
      try {
        // Les domaines du projet servent deux fois — état du certificat du
        // site, et rattachement de chaque domaine. Un seul appel.
        const projectDomains = await vercel.projectDomains(
          website.vercel_project_id,
          website.vercel_team_id,
        );

        await refreshWebsite(admin, vercel, website, projectDomains);
        outcome.sites += 1;
        outcome.domaines += await refreshDomains(admin, vercel, website, projectDomains);
      } catch (cause) {
        // Isolé par site : un projet supprimé chez Vercel ne doit pas empêcher
        // la vérification des autres.
        console.error(`Rafraîchissement de ${website.id} en échec :`, cause);
        outcome.echecs += 1;
      }
    }

    return jsonResponse(req, { ...outcome, examines: websites.length });
  }),
);

// -----------------------------------------------------------------------------
// Sites
// -----------------------------------------------------------------------------

async function refreshWebsite(
  admin: ReturnType<typeof adminClient>,
  vercel: VercelApi,
  website: WebsiteRow,
  projectDomains: VercelProjectDomain[] | null,
): Promise<void> {
  const deployment = await vercel.latestProductionDeployment(
    website.vercel_project_id,
    website.vercel_team_id,
  );

  // Projet introuvable : la référence en base ne désigne plus rien chez Vercel.
  // La ligne n'est pas touchée — l'identifiant est peut-être simplement erroné,
  // et un voyant rouge accuserait le site à la place de la configuration.
  if (deployment === null && projectDomains === null) {
    throw new Error(`Projet Vercel ${website.vercel_project_id} introuvable.`);
  }

  const patch: Record<string, unknown> = {
    verification_source: 'VERCEL_API',
    checked_at: new Date().toISOString(),
    ssl_status: sslFromDomains(projectDomains),
  };

  // `websites_deployment_id_with_date` exige l'identifiant dès qu'une date est
  // posée : les deux sont donc écrits ensemble, ou pas du tout.
  const deployedAt = deployment?.ready ?? deployment?.created;

  if (deployment?.uid && typeof deployedAt === 'number') {
    patch.last_deployment_id = deployment.uid;
    patch.last_deployed_at = new Date(deployedAt).toISOString();
  }

  const { error } = await admin.from('websites').update(patch).eq('id', website.id);
  if (error) throw error;
}

/**
 * État du certificat, déduit des domaines du projet.
 *
 * Vercel émet et renouvelle les certificats des domaines qu'il sert : un
 * domaine vérifié est un domaine servi en HTTPS. Un projet sans domaine
 * personnalisé reste servi sur `*.vercel.app`, également en HTTPS.
 *
 * `EXPIRING` et `EXPIRED` ne sont jamais écrits : l'API ne donne pas la date
 * d'expiration du certificat, et Vercel le renouvelle seul. Les affirmer
 * demanderait une information dont on ne dispose pas.
 */
function sslFromDomains(domains: VercelProjectDomain[] | null): string {
  if (domains === null) return 'UNKNOWN';
  if (domains.length === 0) return 'ACTIVE';
  return domains.some((domain) => domain.verified) ? 'ACTIVE' : 'PENDING';
}

// -----------------------------------------------------------------------------
// Domaines
// -----------------------------------------------------------------------------

async function refreshDomains(
  admin: ReturnType<typeof adminClient>,
  vercel: VercelApi,
  website: WebsiteRow,
  attached: VercelProjectDomain[] | null,
): Promise<number> {
  const { data, error } = await admin
    .from('domains')
    .select('id, domain, website_id')
    .eq('website_id', website.id);

  if (error) throw error;

  const domains = (data ?? []) as DomainRow[];
  let updated = 0;

  for (const row of domains) {
    const match = attached?.find(
      (candidate) => candidate.name.toLowerCase() === row.domain,
    );

    const patch: Record<string, unknown> = {
      verification_source: 'VERCEL_API',
      checked_at: new Date().toISOString(),
    };

    if (!match) {
      // Le domaine est déclaré chez nous mais pas rattaché au projet : rien
      // n'est encore en place, et c'est une information utile en soi.
      patch.dns_status = 'PENDING';
      patch.ssl_status = 'PENDING';
    } else {
      const config = await vercel.domainConfig(row.domain, website.vercel_team_id);

      // `misconfigured` absent (domaine inconnu de l'API de configuration) :
      // on ne conclut pas. `UNKNOWN` dit exactement cela.
      const misconfigured = config?.misconfigured;

      patch.dns_status =
        misconfigured === undefined
          ? 'UNKNOWN'
          : misconfigured
            ? 'MISCONFIGURED'
            : 'CONFIGURED';

      patch.ssl_status = match.verified && misconfigured === false ? 'ACTIVE' : 'PENDING';

      await applyRegistrarFacts(vercel, row, website.vercel_team_id, patch);
    }

    const { error: updateError } = await admin
      .from('domains')
      .update(patch)
      .eq('id', row.id);

    if (updateError) throw updateError;
    updated += 1;
  }

  return updated;
}

/**
 * Date d'expiration et renouvellement, uniquement si Vercel est le registrar.
 *
 * `domains.expires_at` porte le commentaire « NULL tant que la date réelle
 * n'est pas connue. Ne jamais estimer une expiration », et `auto_renew`
 * distingue `NULL` (réglage inconnu) de `false` (renouvellement désactivé).
 * Pour un domaine acheté ailleurs, ces deux colonnes restent donc intactes.
 */
async function applyRegistrarFacts(
  vercel: VercelApi,
  row: DomainRow,
  teamId: string | null,
  patch: Record<string, unknown>,
): Promise<void> {
  const registered = await vercel.registeredDomain(row.domain, teamId);

  if (!registered) return;

  if (typeof registered.expiresAt === 'number') {
    const expiresAt = new Date(registered.expiresAt);
    patch.expires_at = expiresAt.toISOString();

    // Le statut d'enregistrement se déduit alors d'une date connue, non d'une
    // supposition : expiré, proche de l'échéance, ou actif.
    const daysLeft = (expiresAt.getTime() - Date.now()) / 86_400_000;
    patch.status = daysLeft < 0 ? 'EXPIRED' : daysLeft <= 30 ? 'EXPIRING' : 'ACTIVE';
  }

  if (typeof registered.renew === 'boolean') {
    patch.auto_renew = registered.renew;
  }
}
