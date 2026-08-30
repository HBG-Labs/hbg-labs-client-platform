import { requireEnv } from './env.ts';

/**
 * Client de l'API Vercel (§33).
 *
 *
 * LECTURE SEULE
 *
 * Aucune méthode d'écriture n'est exposée. Ce module sert à CONSTATER l'état
 * d'un déploiement ou d'un domaine, jamais à le modifier : un jeton Vercel
 * ouvre le droit de supprimer un projet client, et une plateforme
 * d'administration n'a pas besoin de ce pouvoir pour afficher un voyant.
 *
 *
 * 404 N'EST PAS UNE PANNE
 *
 * « Ce domaine n'appartient pas au compte » est une réponse, pas un incident.
 * Elle est rendue comme `null`, à charge de l'appelant d'en tirer la
 * conclusion juste — le plus souvent « non vérifiable », et surtout pas
 * « en erreur ».
 */

export interface VercelDeployment {
  uid: string;
  state?: string;
  created?: number;
  ready?: number;
}

export interface VercelProjectDomain {
  name: string;
  verified?: boolean;
}

export interface VercelDomainConfig {
  misconfigured?: boolean;
}

/** Domaine enregistré CHEZ Vercel. Absent si le registrar est un tiers. */
export interface VercelRegisteredDomain {
  name: string;
  expiresAt?: number | null;
  renew?: boolean | null;
}

export class VercelApi {
  private readonly token: string;
  private readonly defaultTeamId: string | undefined;

  constructor() {
    this.token = requireEnv('VERCEL_TOKEN');
    this.defaultTeamId = Deno.env.get('VERCEL_TEAM_ID') || undefined;
  }

  /**
   * Dernier déploiement de production abouti.
   *
   * `state=READY` écarte les déploiements en cours et ceux en échec : la date
   * affichée au client est celle de la dernière mise en ligne RÉUSSIE, non
   * celle de la dernière tentative.
   */
  async latestProductionDeployment(
    projectId: string,
    teamId?: string | null,
  ): Promise<VercelDeployment | null> {
    const result = await this.get<{ deployments?: VercelDeployment[] }>(
      `/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=production&state=READY&limit=1`,
      teamId,
    );

    return result?.deployments?.[0] ?? null;
  }

  /** Domaines rattachés au projet. */
  async projectDomains(
    projectId: string,
    teamId?: string | null,
  ): Promise<VercelProjectDomain[] | null> {
    const result = await this.get<{ domains?: VercelProjectDomain[] }>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains`,
      teamId,
    );

    return result?.domains ?? null;
  }

  /** Les enregistrements DNS pointent-ils correctement vers Vercel ? */
  async domainConfig(
    domain: string,
    teamId?: string | null,
  ): Promise<VercelDomainConfig | null> {
    return await this.get<VercelDomainConfig>(
      `/v6/domains/${encodeURIComponent(domain)}/config`,
      teamId,
    );
  }

  /**
   * Le domaine est-il enregistré chez Vercel ?
   *
   * Seul ce cas donne une date d'expiration et un renouvellement automatique
   * fiables. Pour un domaine acheté ailleurs, Vercel n'en sait rien — et la
   * plateforme non plus, ce que `expires_at IS NULL` exprime déjà.
   */
  async registeredDomain(
    domain: string,
    teamId?: string | null,
  ): Promise<VercelRegisteredDomain | null> {
    const result = await this.get<{ domain?: VercelRegisteredDomain }>(
      `/v5/domains/${encodeURIComponent(domain)}`,
      teamId,
    );

    return result?.domain ?? null;
  }

  private async get<T>(path: string, teamId?: string | null): Promise<T | null> {
    const team = teamId ?? this.defaultTeamId;
    const separator = path.includes('?') ? '&' : '?';
    const url = `https://api.vercel.com${path}${team ? `${separator}teamId=${encodeURIComponent(team)}` : ''}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    // 404 et 403 : l'objet n'existe pas, ou n'appartient pas à ce compte. Les
    // deux se lisent « inconnu », pas « en panne ».
    if (response.status === 404 || response.status === 403) return null;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Vercel a répondu ${response.status} sur ${path}. ${body.slice(0, 200)}`);
    }

    return (await response.json()) as T;
  }
}
