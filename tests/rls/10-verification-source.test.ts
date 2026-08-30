import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Le contrat d'honnêteté des voyants (§17, §57, migrations 05 et 06).
 *
 * « Si l'intégration Vercel/Cloudflare n'est pas encore disponible, afficher
 *   clairement "Vérification non configurée" et non "actif". »
 *
 * Ce contrat n'est pas une convention d'affichage : ce sont des contraintes
 * CHECK. Tant que `verification_source` vaut `NONE`, la base REFUSE tout statut
 * affirmatif — et refuse aussi une date de vérification, qui laisserait croire
 * que quelque chose a été constaté.
 *
 * La fonction Edge `vercel-refresh` repose entièrement là-dessus : elle écrit
 * `VERCEL_API` et `checked_at` ensemble, après une réponse réelle de Vercel.
 * Si les contraintes cédaient, un voyant vert pourrait apparaître sans qu'aucun
 * appel n'ait eu lieu, et rien ne le signalerait.
 *
 * Le test est mené avec `service_role`, c'est-à-dire le rôle le PLUS permissif
 * de la plateforme, celui-là même qu'emploie la fonction Edge. Un contrôle qui
 * ne tiendrait que pour les rôles applicatifs ne protégerait pas du chemin par
 * lequel ces colonnes sont réellement écrites.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('Un site non vérifié ne peut pas afficher un état', () => {
  it('refuse un certificat « actif » sans source de vérification', async () => {
    const { error } = await f.admin
      .from('websites')
      .update({ ssl_status: 'ACTIVE' })
      .eq('id', f.websiteA);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('websites_unverified_status_is_unknown');
  });

  it('refuse une date de vérification sans source', async () => {
    const { error } = await f.admin
      .from('websites')
      .update({ checked_at: new Date().toISOString() })
      .eq('id', f.websiteA);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('websites_checked_at_matches_source');
  });

  it('refuse une source de vérification sans date', async () => {
    // L'inverse compte autant : « vérifié par Vercel » sans dire quand ne
    // permet pas de savoir si l'information date de dix minutes ou de six mois.
    const { error } = await f.admin
      .from('websites')
      .update({ verification_source: 'VERCEL_API' })
      .eq('id', f.websiteA);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('websites_checked_at_matches_source');
  });

  it('accepte l’écriture que fait la fonction Edge', async () => {
    // Source, date et statut ensemble : la forme exacte du patch écrit par
    // `vercel-refresh`.
    const { error } = await f.admin
      .from('websites')
      .update({
        verification_source: 'VERCEL_API',
        checked_at: new Date().toISOString(),
        ssl_status: 'ACTIVE',
      })
      .eq('id', f.websiteA);

    expect(error).toBeNull();

    const { data } = await f.admin
      .from('websites')
      .select('verification_source, ssl_status, checked_at')
      .eq('id', f.websiteA)
      .single();

    expect(data?.verification_source).toBe('VERCEL_API');
    expect(data?.ssl_status).toBe('ACTIVE');
    expect(data?.checked_at).not.toBeNull();
  });

  it('exige l’identifiant de déploiement avec sa date', async () => {
    // Une date de mise en ligne sans le déploiement qui la produit ne se
    // rattache à rien : impossible de retrouver ce qui a été déployé.
    const { error } = await f.admin
      .from('websites')
      .update({ last_deployed_at: new Date().toISOString() })
      .eq('id', f.websiteA);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('websites_deployment_id_with_date');
  });
});

describe('Un domaine non vérifié ne peut pas afficher un état', () => {
  it('refuse un DNS « configuré » sans source de vérification', async () => {
    const { error } = await f.admin
      .from('domains')
      .update({ dns_status: 'CONFIGURED' })
      .eq('id', f.domainA);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('domains_unverified_statuses_are_unknown');
  });

  it('accepte l’écriture que fait la fonction Edge', async () => {
    const { error } = await f.admin
      .from('domains')
      .update({
        verification_source: 'VERCEL_API',
        checked_at: new Date().toISOString(),
        dns_status: 'CONFIGURED',
        ssl_status: 'ACTIVE',
      })
      .eq('id', f.domainA);

    expect(error).toBeNull();
  });

  it('laisse l’expiration inconnue plutôt que de l’estimer', async () => {
    // `expires_at` reste NULL après vérification : Vercel ne connaît la date
    // d'expiration que des domaines dont il est registrar. La colonne dit
    // « inconnue », et l'interface n'affiche rien plutôt qu'une estimation.
    const { data } = await f.admin
      .from('domains')
      .select('expires_at, auto_renew')
      .eq('id', f.domainA)
      .single();

    expect(data?.expires_at).toBeNull();
    expect(data?.auto_renew).toBeNull();
  });
});
