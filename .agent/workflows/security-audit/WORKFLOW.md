WORKFLOW: security-audit

PURPOSE:
Audit systématique de sécurité fintech, conformité des accès aux données, détection de fuite de secrets et vérification de robustesse cryptographique pour Donkai.

WHEN TO USE:
Avant tout déploiement majeur, modification des politiques Supabase RLS, mise à jour des jetons d'authentification Clerk, révision des flux de paiement SasPay ou suspicion de faille.

WHEN NOT TO USE:
Développement fonctionnel standard ou tâches stylistiques ordinaires.

PREREQUISITES:
Accès aux schémas SQL, politiques RLS, Edge Functions et variables d'environnement locales.

MANDATORY SKILLS:
- security-review
- review-security
- quality-gate-audit

MANDATORY MCP:
- filesystem

ALLOWED ADDITIONAL TOOLS:
- run_command (scans de secrets et vérification de dépendances)

PÉRILLES DE CONTRÔLE CRITIQUES :
1. Intégrité des politiques Supabase Row Level Security (RLS) sur `donations`, `campaigns`, `profiles`, `payouts`.
2. Étanchéité de la validation HMAC-SHA256 sur `saspay-webhook`.
3. Absence d'exposition de secrets d'infrastructure (`SUPABASE_SERVICE_ROLE_KEY`, `SASPAY_SECRET_KEY`) dans le code frontend ou le bundle généré.
4. Respect du verrou de sécurité 30 jours sur le changement de numéro de paiement.
5. Protection contre les attaques par force brute ou répétition d'idempotence.

PHASES:
1. Cartographie de la surface d'attaque et des flux de données sensibles.
2. Revue du code des Edge Functions et politiques RLS.
3. Scan de présence de secrets dans l'historique et l'arbre de travail.
4. Élaboration du plan d'audit et de remédiation.
5. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
6. Application des correctifs de sécurité approuvés.
7. Validation du Quality Gate Security-Audit et rapport détaillé à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Point d'arrêt obligatoire).

FINAL QUALITY GATE:
- Zéro secret dans le frontend.
- RLS hermétique testée.
- Webhooks cryptographiquement inviolables.
- Verrou 30 jours actif.
