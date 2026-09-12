# Donkai

Plateforme de donation mobile-first pour l'Afrique de l'Ouest.
Recevez des dons via Orange Money, Wave, Moov Money et MTN MoMo — sans carte bancaire, sans compte PayPal étranger.

Lien de production : https://donkai.vercel.app/

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styles & Icônes | Tailwind CSS 4 + Lucide React |
| Backend & DB | Supabase (PostgreSQL + RLS + Edge Functions) |
| Authentification | Supabase Auth (Email + Mot de passe + Magic Link) |
| Paiement | SasPay.me (Orange Money, Wave, Moov Money, MTN) |
| Hébergement | Vercel |
| Package manager | pnpm |

## Architecture

```
React Frontend (donateur ou créateur)
   ↓
Supabase Auth & PostgreSQL (RLS natif)
   ↓
Edge Function "create-checkout" (appel API serveur SasPay)
   ↓
SasPay Hosted Checkout (paiement Mobile Money par l'opérateur local)
   ↓
SasPay Webhook (notification signée HMAC-SHA256)
   ↓
Edge Function "saspay-webhook" (vérification signature et mise à jour 'paid')
   ↓
Partage des fonds (5% commission plateforme / 95% pour le créateur)
```

## Structure du projet

```
donkai/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Barre de navigation
│   │   ├── Footer.tsx                # Pied de page
│   │   ├── DonationCard.tsx          # Formulaire de don + session SasPay
│   │   └── Icons.tsx                 # Bibliothèque d'icônes Lucide
│   ├── context/
│   │   └── AuthContext.tsx           # Contexte d'authentification Supabase
│   ├── lib/
│   │   └── supabase.ts               # Client Supabase typé
│   ├── pages/
│   │   ├── HomePage.tsx              # Landing page
│   │   ├── CreatorPage.tsx           # Page publique /@username
│   │   ├── LoginPage.tsx             # Connexion / Inscription Supabase
│   │   ├── OnboardingPage.tsx        # Configuration profil & wallet
│   │   ├── DashboardPage.tsx         # Dashboard créateur & retraits
│   │   └── SettingsPage.tsx          # Paramètres créateur
│   ├── types/
│   │   └── index.ts                  # Définitions TypeScript
│   ├── App.tsx                       # Routeur SPA
│   ├── index.css                     # Styles Tailwind
│   ├── main.tsx                      # Point d'entrée React 19
│   └── vite-env.d.ts                 # Déclarations Vite
├── supabase/
│   ├── schema.sql                    # Schéma SQL (creators, donations, payouts)
│   ├── policies.sql                  # Politiques de sécurité RLS
│   └── functions/
│       ├── create-checkout/
│       │   └── index.ts              # Edge Function création checkout SasPay
│       └── saspay-webhook/
│           └── index.ts              # Edge Function webhook sécurisé HMAC
├── index.html                        # Template HTML principal
├── vite.config.ts                    # Config Vite + React + Tailwind
├── tsconfig.json                     # Configuration TypeScript
├── vercel.json                       # Règles de réécriture Vercel SPA
└── package.json
```

## Base de données Supabase

3 tables principales définies dans `supabase/schema.sql` :

- **creators** — profil lié directement à `auth.users(id)` (username, display_name, bio, wallet_provider, wallet_number)
- **donations** — dons reçus (montant brut, fee 5%, montant net 95%, status, donor_name, donor_email, message, saspay_session_id)
- **payouts** — historique et demandes de retraits manuels vers le wallet Mobile Money (montant, statut, wallet_provider, wallet_number)

## Core Flow (Don)

1. Le donateur ouvre `donkai.app/@createur`
2. Il visualise le profil et le formulaire de don
3. Il choisit un montant prédéfini (500, 1 000, 2 000, 5 000 XOF) ou un montant libre (minimum 100 XOF)
4. Il renseigne son nom (ou reste anonyme), son email et un message optionnel
5. Il clique sur "Soutenir" -> l'Edge Function crée le don `pending` et génère la session SasPay
6. Le donateur est redirigé vers la page sécurisée SasPay pour payer avec son opérateur (Orange Money, Wave, Moov)
7. SasPay valide la transaction et déclenche le webhook vers Supabase
8. L'Edge Function vérifie la signature HMAC-SHA256 et passe le don à `paid`
9. Le donateur est redirigé vers la page de succès

## Payout Flow (Retrait créateur)

1. Le créateur consulte son tableau de bord et son solde disponible
2. Dès 5 000 XOF cumulés, il peut cliquer sur "Demander un retrait"
3. La demande est enregistrée en base (`pending`) et validée vers son numéro Mobile Money configuré

## Installation et démarrage

```bash
# Cloner le projet
git clone https://github.com/kalifa4y/Donkai.git
cd donkai

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env

# Lancer en développement
pnpm dev

# Compiler pour la production
pnpm build
```

## Configuration des variables d'environnement

| Variable | Où la trouver |
|---|---|
| `VITE_SUPABASE_URL` | Supabase -> Settings -> API -> Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase -> Settings -> API -> Anon public key |
| `VITE_APP_URL` | URL de votre application (ex: https://donkai.app ou http://localhost:5173) |

### Variables secrètes (Supabase Secrets / Edge Functions)

| Secret | Utilité |
|---|---|
| `SASPAY_SECRET_KEY` | Clé API secrète marchande (`sk_live_...` ou `sk_test_...`) |
| `SASPAY_WEBHOOK_SECRET` | Secret de signature du webhook SasPay (pour contrôle HMAC) |
