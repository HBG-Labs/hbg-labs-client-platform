import { useQuery } from '@tanstack/react-query';
import { fetchPublicPlans, type PublicPlan } from '@/services/plans.service';
import { pricingKeys } from './pricing.keys';

/**
 * Charge la grille tarifaire publique.
 *
 * `staleTime` long : le catalogue ne change que lorsque HBG Labs le modifie,
 * soit quelques fois par an. Le recharger à chaque navigation serait du trafic
 * pur pour une donnée qui n'a pas bougé.
 */
export function usePublicPlans() {
  return useQuery<PublicPlan[]>({
    queryKey: pricingKeys.publicPlans(),
    queryFn: fetchPublicPlans,
    staleTime: 10 * 60_000,
  });
}
