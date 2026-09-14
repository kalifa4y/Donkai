WORKFLOW: payment

PURPOSE:
Gestion, sécurisation, tests et validation des flux de paiement Mobile Money Donkai (SasPay : Orange Money, Wave, Moov Money au Mali et zone UEMOA) et des procédures de retraits sécurisés.

WHEN TO USE:
Toute modification ou audit touchant aux Edge Functions de checkout (`create-checkout`), au traitement des webhooks (`saspay-webhook`), au calcul de commissions (5% + 100 FCFA), à la gestion des retraits ou aux mécanismes anti-fraude (verrou 30 jours).

WHEN NOT TO USE:
Tâches purement cosmétiques ou sans impact sur les flux transactionnels.

PREREQUISITES:
- Variables d'environnement configurées dans Supabase (`SASPAY_SECRET_KEY`, `SASPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).
- Spécifications de payload SasPay à jour (HMAC-SHA256, tolérance 600s).

MANDATORY SKILLS:
- mobile-money-gateway
- security-review
- tdd-workflow
- quality-gate-audit

MANDATORY MCP:
- filesystem
- playwright

ALLOWED ADDITIONAL TOOLS:
- run_command (pour tests locaux et vérification de build)

FORBIDDEN ACTIONS:
- Aucune transaction monétaire réelle sans accord formel de Kalf.
- Aucun calcul de frais ou mise à jour de statut validé côté frontend.
- Zéro fuite de clé secrète dans le code client.

PHASES:
1. Analyse du besoin et des schémas d'événements SasPay.
2. Revue du modèle de menaces (falsification de montant, rejeu de webhook, contournement de commission).
3. Contrôle de l'intégrité du calcul serveur (frais de 5% + 100 FCFA et net perçu).
4. Validation de la signature HMAC-SHA256 et vérification du timestamp (< 600s).
5. Vérification de l'idempotence (clé d'idempotence et statut initial 'pending').
6. Validation du verrou de sécurité 30 jours lors du changement de numéro de retrait.
7. Rédaction du plan d'implémentation détaillé.
8. VALIDATION DU PLAN PAR KALF (POINT D'ARRET OBLIGATOIRE).
9. Implémentation des modifications sur les Edge Functions Deno ou composants transactionnels.
10. Tests rigoureux en environnement sandbox / mock (succès, échec, annulation, doublons).
11. Audit de sécurité des logs (absence de PIN ou de données bancaires).
12. Validation du Quality Gate Payment et compte-rendu technique à Kalf.

VALIDATION GATE:
PLAN -> VALIDATION KALF (Aucune modification de code financier sans approbation préalable).

FINAL QUALITY GATE:
- Signature HMAC vérifiée.
- Frais 5% + 100 FCFA validés exclusivement côté serveur.
- Idempotence prouvée contre les doubles soumissions.
- Verrou 30 jours opérationnel.
- Zéro secret exposé côté client.
