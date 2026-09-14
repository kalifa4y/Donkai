WORKFLOW: web-app

PURPOSE:
Développement, optimisation et maintenance de l'interface utilisateur web et mobile-first de Donkai (React 19, Vite, TypeScript, Tailwind CSS v4, Clerk Auth).

WHEN TO USE:
Création ou modification de pages, composants, navigation (`/@username/:slug`), carte de don, dashboard organisateur, formulaires ou intégration client de l'authentification Clerk.

WHEN NOT TO USE:
Tâches purement backend, migrations de base de données ou logique transactionnelle isolée.

PREREQUISITES:
Node.js/pnpm configuré, packages installés, types TypeScript à jour.

MANDATORY SKILLS:
- design-system
- tdd-workflow
- quality-gate-audit

MANDATORY MCP:
- filesystem
- playwright

ALLOWED ADDITIONAL TOOLS:
- run_command (compilation, linter, tests E2E)

FORBIDDEN ACTIONS:
- Aucun emoji dans les interfaces ou composants.
- Aucune zone de clic inférieure à 44x44px sur mobile.
- Pas de jargon technique dans les messages affichés au public.

PHASES:
1. Cadrage du composant ou de la page et revue des exigences produit (`PRODUCT.md`, `DESIGN.md`).
2. Vérification de la cohérence avec le design system (typographies `Cal Sans` / `Google Sans Flex`, palette tellurique).
3. Conception de l'arborescence des composants et gestion des états locaux.
4. Élaboration du plan d'implémentation.
5. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
6. Implémentation en respectant la fluidité mobile et les critères WCAG AAA.
7. Validation responsive (écrans 360px à desktop large).
8. Vérification des temps de réponse et absence de re-renderings superflus.
9. Validation du Quality Gate Web-App et présentation du résultat à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Point d'arrêt obligatoire).

FINAL QUALITY GATE:
- Build `pnpm build` sans warning ni erreur.
- Parcours donateur fluide (< 45s).
- Zéro emoji.
- Contraste WCAG AAA et navigation accessible.
