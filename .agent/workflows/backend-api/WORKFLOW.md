WORKFLOW: backend-api

PURPOSE:
Développement, sécurisation et maintenance des API backend Donkai : Edge Functions Supabase (Deno/TypeScript), schémas PostgreSQL, politiques Row Level Security (RLS) et triggers d'agrégation.

WHEN TO USE:
Création ou modification d'Edge Functions, tables SQL (`campaigns`, `donations`, `profiles`, `payouts`, `reports`), triggers de calcul de solde ou procédures stockées (RPC).

WHEN NOT TO USE:
Tâches purement visuelles ou modifications de composants front React sans impact d'API.

PREREQUISITES:
Connaissance de l'environnement Supabase Deno, variables d'environnement locales et structure de `supabase/`.

MANDATORY SKILLS:
- backend-patterns
- api-design
- security-review
- tdd-workflow
- quality-gate-audit

MANDATORY MCP:
- filesystem

ALLOWED ADDITIONAL TOOLS:
- run_command (pour tests locaux et syntaxe Deno/TS)

PHASES:
1. Définition du contrat d'API (routes, inputs attendus, format des réponses JSON, codes HTTP).
2. Modélisation des données et vérification des contraintes relationnelles.
3. Analyse du modèle de menaces et conception des politiques Row Level Security (RLS).
4. Élaboration du plan d'implémentation.
5. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
6. Implémentation de la fonction Edge ou du script SQL de migration.
7. Validation stricte des inputs (types, montants minimaux >= 100 FCFA, présence d'identifiants).
8. Vérification de la gestion des erreurs (format standardisé, pas de stack traces exposées).
9. Validation du Quality Gate Backend-API et transmission à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Aucune modification structurelle sans accord préalable).

FINAL QUALITY GATE:
- RLS activée et testée sur chaque table.
- Validation des payloads côté serveur.
- Codes HTTP sémantiques (200, 400, 403, 404, 500).
- Zéro fuite de credentials.
