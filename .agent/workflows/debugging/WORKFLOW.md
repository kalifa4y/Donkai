WORKFLOW: debugging

PURPOSE:
Investigation méthodique, isolement et résolution des anomalies, régressions, blocages de paiement, rejets de webhooks ou erreurs d'authentification sur Donkai.

WHEN TO USE:
Comportement inattendu, transaction bloquée à l'état 'pending', erreur de signature webhook, problème de synchronisation du jeton Clerk-Supabase, erreur de compilation ou de routage.

WHEN NOT TO USE:
Création planifiée de nouvelles fonctionnalités ou refonte globale.

PREREQUISITES:
Scénario de reproduction fiable ou logs d'erreurs (console navigateur, Edge Functions Deno, base Supabase).

MANDATORY SKILLS:
- diagnosing-bugs
- error-handling
- quality-gate-audit

MANDATORY MCP:
- filesystem
- playwright

ALLOWED ADDITIONAL TOOLS:
- run_command (reproduction de tests, inspection de logs)

PHASES:
1. Reproduction rigoureuse de l'anomalie sans modifier le code.
2. Isolement de la cause racine (front React, Edge Function, DB RLS, ou API tierce SasPay).
3. Formulation d'hypothèses techniques vérifiables.
4. Élaboration du plan d'intervention correctif.
5. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
6. Correction ciblée à la racine (interdiction des try/catch masquants ou timeouts artificiels).
7. Vérification des non-régressions.
8. Validation du Quality Gate Debugging et rapport à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Point d'arrêt obligatoire).

FINAL QUALITY GATE:
- Cause racine éradiquée.
- Aucune régression introduite.
- Zéro try/catch silencieux ou masquage de bug.
