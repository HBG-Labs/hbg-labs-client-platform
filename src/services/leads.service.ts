import { supabase } from '@/lib/supabase';
import type { ContactMessageValues, QuoteRequestValues } from '@/schemas/lead.schema';

/**
 * Écriture des formulaires publics (§4, §5).
 *
 * Ces deux fonctions sont les seules du site à écrire en base sans
 * authentification. La policy `quote_requests_insert_anon` autorise
 * l'insertion et refuse la lecture : un visiteur dépose une demande, il ne peut
 * pas consulter celles des autres.
 *
 * Trois champs sont volontairement absents des données envoyées : `status`,
 * `assigned_to` et `internal_notes`. La policy exige `status = 'NEW'` et les
 * autres à NULL. Les transmettre depuis le navigateur ferait échouer
 * l'insertion, et surtout laisserait croire qu'un visiteur peut qualifier sa
 * propre demande.
 */

/** Erreur métier lisible, distincte d'une panne technique. */
export class LeadRateLimitError extends Error {
  constructor() {
    super(
      'Vous avez déjà envoyé plusieurs demandes récemment. Réessayez dans une heure ou écrivez-nous directement.',
    );
    this.name = 'LeadRateLimitError';
  }
}

/** Code PostgreSQL levé par `guard_lead_rate_limit` (program_limit_exceeded). */
const RATE_LIMIT_CODE = '54000';

function translate(error: { code?: string; message: string }): Error {
  if (error.code === RATE_LIMIT_CODE) return new LeadRateLimitError();
  return new Error(error.message);
}

export async function submitQuoteRequest(values: QuoteRequestValues): Promise<void> {
  // `plan_code` sert à retrouver l'offre correspondante. La colonne stockée est
  // `plan_id` : la correspondance se fait ici, sur une table lisible par anon.
  let planId: string | null = null;

  if (values.plan_code) {
    const { data } = await supabase
      .from('plans')
      .select('id')
      .eq('code', values.plan_code)
      .maybeSingle();

    planId = data?.id ?? null;
  }

  const { error } = await supabase.from('quote_requests').insert({
    full_name: values.full_name,
    email: values.email,
    phone: values.phone ?? null,
    company_name: values.company_name ?? null,
    project_type: values.project_type ?? null,
    budget_range: values.budget_range ?? null,
    message: values.message,
    plan_id: planId,
    source: values.plan_code ? 'landing_pricing' : 'website',
  });

  if (error) throw translate(error);
}

export async function submitContactMessage(values: ContactMessageValues): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    full_name: values.full_name,
    email: values.email,
    phone: values.phone ?? null,
    subject: values.subject,
    message: values.message,
    source: 'website',
  });

  if (error) throw translate(error);
}
