# RÈGLE : STANDARDS DE SÉCURITÉ FINTECH DONKAI

## 1. Principe Zéro Confiance Client (Zero Trust Client)
Le frontend est par définition sous le contrôle de l'utilisateur et ne doit jamais être considéré comme une source de vérité sécurisée :
- Ne jamais faire confiance à un montant calculé ou transmis unilatéralement par le client.
- Ne jamais valider le statut de succès d'un don via une simple redirection d'URL de retour (`return_url`).
- Seul l'événement webhook signé ou une requête serveur à serveur valide le paiement d'une contribution.

---

## 2. Sécurité des Passerelles de Paiement (SasPay / Mobile Money)
- **Signature HMAC-SHA256 obligatoire** : Vérification stricte de l'empreinte cryptographique des webhooks avec `SASPAY_WEBHOOK_SECRET`.
- **Tolérance d'horodatage (Anti-rejeu)** : Contrôle du décalage d'horodatage avec un seuil strict de 600 secondes (`TOLERANCE_SECONDS`).
- **Idempotence native** : Utilisation d'une clé d'idempotence (`idempotency_key`) et contrôle d'état préalable (`status !== 'paid'`) pour interdire tout double crédit.
- **Isolation des secrets** : Les clés `SASPAY_SECRET_KEY` et `SUPABASE_SERVICE_ROLE_KEY` restent cantonnées aux Edge Functions et ne sont jamais exposées dans les variables publiques `VITE_*`.

---

## 3. Sécurité de la Base de Données (Supabase & RLS)
- **Row Level Security (RLS) activée par défaut** sur toutes les tables (`campaigns`, `donations`, `profiles`, `payouts`, `reports`).
- **Isolation des utilisateurs** : Les mutations sur une collecte ou un profil exigent l'authentification Clerk associée à l'UID Supabase.
- **Accès restreint aux dons** : Les donateurs non authentifiés peuvent insérer une contribution via l'Edge Function, mais ne peuvent ni modifier ni supprimer un enregistrement en direct.
- **Contrôle d'intégrité des retraits** : Application au niveau de la base de données du verrou de 30 jours calendaires lors du changement de numéro de réception.
