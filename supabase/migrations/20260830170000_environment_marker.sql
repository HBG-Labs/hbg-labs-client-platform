-- =============================================================================
-- 22 — La base dit à quel environnement elle appartient (§48)
-- =============================================================================
-- La suite d'isolation crée des comptes, des organisations et des demandes,
-- puis les détruit. Lancée contre la base de production, elle détruirait des
-- données clients.
--
--
-- LE GARDE-FOU EXISTANT NE SUFFIT PAS
--
-- `tests/rls/global-setup.ts` refuse déjà de démarrer si `VITE_APP_ENV` vaut
-- « production ». Cette variable vit dans le fichier `.env` LOCAL, et décrit
-- l'intention du poste — pas l'identité de la base visée.
--
-- Le scénario dangereux tient en une ligne : quelqu'un copie l'URL et la clé
-- de service du projet de production dans un `.env` resté en
-- « development », pour inspecter une donnée. Le garde-fou ne voit rien
-- d'anormal, et la suite balaie la production.
--
-- Le marqueur est donc posé DANS la base. Il voyage avec elle : quelle que
-- soit la machine, quel que soit le `.env`, une base marquée « production »
-- refuse la suite de tests.
--
--
-- VALEUR PAR DÉFAUT : development
--
-- Une base neuve n'est pas de production tant que personne ne l'a déclarée
-- telle. L'inverse — tout marquer « production » par prudence — bloquerait la
-- suite partout et pousserait à contourner le garde-fou, ce qui reviendrait à
-- ne pas en avoir.
--
-- Le passage en production est un geste explicite, documenté dans
-- docs/SETUP.md §7.5, et volontairement laissé à une instruction SQL plutôt
-- qu'à un script : marquer une base « production » verrouille des outils, et
-- ce n'est pas un geste que l'on veut voir lancé par erreur en tapant une
-- commande npm.
-- =============================================================================

insert into public.platform_settings (key, value, description)
values (
  'environment',
  'development',
  'development | staging | production. Une base marquée production refuse la suite de tests d''isolation, qui crée et détruit des comptes.'
)
on conflict (key) do nothing;
