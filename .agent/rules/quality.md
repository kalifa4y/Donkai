# RÈGLE : QUALITY GATE ABSOLU DONKAI

## 1. Principe de Clôture
Aucune tâche n'est déclarée terminée tant que tous les points de conformité applicables n'ont pas été vérifiés.

---

## 2. Grille de Contrôle Finale Donkai (Checklist)
Avant de considérer une intervention comme achevée :

- [ ] **Plan approuvé par Kalf** : Validation explicite préalable obtenue avant toute modification.
- [ ] **Fonctionnalité réelle** : Zéro fausse fonctionnalité, simulation ou mock masqué. Tout fallback de test est clairement documenté.
- [ ] **Règles métier Donkai respectées** :
  - Frais de 5% + 100 FCFA déduits et vérifiés côté serveur.
  - Calcul de net perçu transparent.
  - Verrou de sécurité 30 jours opérationnel sur le numéro de paiement.
  - Seuil de contrôle KYC à 500 000 FCFA pris en compte.
  - Seuil de modération à 3 signalements fonctionnel.
- [ ] **Compilation & Typage** : Exécution réussie de `pnpm build` (`tsc && vite build`) sans aucune erreur TypeScript bloquante.
- [ ] **Sécurité & Secrets** : Aucune fuite de clé secrète (`SUPABASE_SERVICE_ROLE_KEY`, `SASPAY_SECRET_KEY`, `SASPAY_WEBHOOK_SECRET`) côté frontend.
- [ ] **Respect du Design System Donkai** :
  - Typographie conforme : `Cal Sans` (titres, chiffres de collecte, logo) et `Google Sans Flex` (corps, formulaires).
  - Palette tellurique respectée (obsidienne, ivoire, ocre, émeraude).
  - Cibles tactiles mobiles d'au moins 44x44px.
  - Navigation au pavé numérique optimisée (`inputMode="numeric"` pour les montants).
- [ ] **Bannissement des Emojis** : Strictement zéro emoji dans les interfaces, composants, messages et commits. Utilisation exclusive de `lucide-react`.
- [ ] **Responsive Mobile-First** : Affichage sans débordement horizontal testé sur résolutions mobiles (360px+).
- [ ] **Accessibilité** : Contrastes de texte conformes WCAG AAA, focus visible sur les champs et boutons de contribution.
- [ ] **Nettoyage & Git** : Code mort supprimé, git diff propre et ciblé.
