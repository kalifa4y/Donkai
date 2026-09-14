WORKFLOW: refactoring

PURPOSE:
Assainissement de la codebase Donkai, élimination du code mort, simplification d'architecture, allègement du bundle et renforcement de la maintenabilité sans altération du comportement fonctionnel.

WHEN TO USE:
Nettoyage post-fonctionnalité, factorisation de logique dupliquée, suppression de dépendances orphelines, optimisation de requêtes Supabase.

WHEN NOT TO USE:
Ajout de nouvelles fonctionnalités ou résolution de bugs urgents.

MANDATORY SKILLS:
- orch-refine-code
- codebase-design
- quality-gate-audit

MANDATORY MCP:
- filesystem

ALLOWED ADDITIONAL TOOLS:
- run_command (contrôle de compilation et suite de tests)

OBJECTIF CLÉ :
Moins de fichiers, moins de dépendances, moins de code, complexité minimale, même comportement métier, meilleure lisibilité.

PHASES:
1. Cartographie des modules ciblés et vérification que les tests sont au vert.
2. Détection du code mort, doublons et abstractions inutiles.
3. Élaboration du plan de simplification pas-à-pas.
4. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
5. Refactorisation progressive en préservant le comportement observable.
6. Validation du build (`tsc && vite build`).
7. Contrôle du Quality Gate Refactoring et compte-rendu à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Point d'arrêt obligatoire).

FINAL QUALITY GATE:
- Build sans erreur.
- Comportement fonctionnel inchangé.
- Volume de code et complexité réduits.
