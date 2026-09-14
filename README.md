# DONKAI

**Plateforme de collecte communautaire et de micro-dons mobile-first pour l'Afrique de l'Ouest.**  
Permet aux créateurs, porteurs de projet et associations de recevoir des contributions directes via **Orange Money**, **Wave** et **Moov Money** en FCFA (XOF) — sans carte bancaire, sans compte PayPal étranger.

🔗 **Production officielle :** [https://donkai.vercel.app](https://donkai.vercel.app)  
🏢 **Conçu et développé par :** [Oshun Web Studio](https://oshunwebstudio.netlify.app) (Bamako, Mali)

---

## 🚀 Stack Technique

| Couche | Technologie | Rôle |
|---|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript | Interface client SPA ultra-rapide (<500 ms de build) |
| **Styles** | Tailwind CSS 4 + Lucide React (SVG) | Design system moderne, dark mode natif, zéro emoji |
| **Typographie** | Cal Sans + Google Sans Flex (Latin) | Polices vectorielles optimisées (<100 Ko CSS) |
| **Backend & Base** | Supabase (PostgreSQL 15 + RLS) | Gestion des profils, collectes, dons, KYC et modération |
| **Authentification** | Supabase Auth (Email / Mot de passe) | Sessions JWT sécurisées avec RBAC (`is_admin`) |
| **Passerelle Paiement**| SasPay (Orange Money, Wave, Moov) | Encaissement direct Mobile Money et webhooks signés HMAC |
| **Télémétrie** | @vercel/analytics | Statistiques d'audience et fréquentation en temps réel |
| **Hébergement** | Vercel | Déploiement continu lié à `donkai.vercel.app` |
| **Gestionnaire** | pnpm v10 | Gestion stricte et optimisée des dépendances |

---

## 🏗️ Architecture des Flux

```text
               DONATEUR / CONTRIBUTEUR
                         ↓
               Landing Page / Page Collecte / Profil Créateur
                         ↓
               Formulaire de Don (Montants prédéfinis ou libres en FCFA)
                         ↓
               Edge Function Supabase "create-checkout"
                         ↓
               SasPay Hosted Checkout (Orange Money, Wave, Moov)
                         ↓
               Validation Transaction Mobile Money
                         ↓
               Webhook SasPay signé HMAC-SHA256
                         ↓
               Edge Function Supabase "saspay-webhook"
                         ↓
               Mise à jour don ('paid') + solde collecte + journal d'audit
                         ↓
               Partage des fonds (95% porteur de projet / 5% plateforme)
```

---

## 📂 Structure Réelle du Projet

```text
donkai/
├── public/
│   ├── favicon.svg                   # Favicon SVG officiel
│   ├── og-image.png                  # Image OpenGraph réseaux sociaux
│   ├── robots.txt                    # Directives d'indexation SEO
│   ├── sitemap.xml                   # Sitemap canonique pour les moteurs
│   └── icons/                        # Logos officiels des opérateurs
│       ├── orange-money.svg
│       ├── wave.png
│       └── moov-money.png
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # Barre de navigation responsive avec dark mode
│   │   ├── Footer.tsx                # Pied de page avec mentions et crédits Oshun
│   │   ├── DonationCard.tsx          # Formulaire de contribution et checkout
│   │   ├── BuyTeaCard.tsx            # Widget de soutien micro-dons ("Offrir un thé")
│   │   ├── CampaignUpdatesModal.tsx  # Mises à jour et actualités d'une collecte
│   │   ├── ShareModal.tsx            # Partage social et QR code
│   │   ├── ReportModal.tsx           # Formulaire de signalement communautaire
│   │   ├── VerifiedBadge.tsx         # Badge de certification d'identité KYC
│   │   ├── Icons.tsx                 # Bibliothèque centralisée d'icônes Lucide
│   │   └── admin/                    # Composants de la console d'administration
│   │       ├── AdminSidebar.tsx
│   │       ├── AdminDashboardView.tsx
│   │       ├── AdminCampaignsView.tsx
│   │       ├── AdminUsersView.tsx
│   │       ├── AdminDonationsView.tsx
│   │       ├── AdminPayoutsView.tsx
│   │       ├── AdminReportsView.tsx
│   │       ├── AdminKycView.tsx
│   │       ├── AdminAuditLogsView.tsx
│   │       └── AdminModal.tsx
│   ├── context/
│   │   └── AuthContext.tsx           # Gestion de session Supabase Auth & profil RBAC
│   ├── lib/
│   │   ├── supabase.ts               # Client Supabase connecté
│   │   └── i18n.tsx                  # Système bilingue Français / Anglais
│   ├── pages/
│   │   ├── HomePage.tsx              # Landing page (héros, collectes, FAQ, stats)
│   │   ├── ExplorePage.tsx           # Moteur de recherche et filtres de collectes
│   │   ├── CampaignPage.tsx          # Page dédiée d'une collecte (/@username/:slug)
│   │   ├── CreatorProfilePage.tsx    # Profil public de l'organisateur (/@username)
│   │   ├── CreateCampaignPage.tsx    # Assistant de création de collecte multi-étapes
│   │   ├── DashboardPage.tsx         # Tableau de bord organisateur, solde et retraits
│   │   ├── SettingsPage.tsx          # Configuration compte, profil et wallet Mobile Money
│   │   ├── LoginPage.tsx             # Authentification email / mot de passe
│   │   ├── OnboardingPage.tsx        # Parcours initial de configuration du compte
│   │   ├── AdminPage.tsx             # Console d'administration (sécurisée en mode Stealth)
│   │   └── LiveStreamView.tsx        # Mode immersif pour streams TikTok/YouTube (/@username/:slug/live)
│   ├── types/
│   │   └── index.ts                  # Schémas et interfaces TypeScript
│   ├── App.tsx                       # Routeur SPA dynamique + injection Vercel Analytics
│   ├── index.css                     # Design system Tailwind v4 + imports polices Latin
│   └── main.tsx                      # Montage racine React 19
├── supabase/
│   ├── schema.sql                    # Schéma DDL complet des 7 tables PostgreSQL
│   ├── policies.sql                  # Politiques RLS (Row Level Security)
│   ├── init_all.sql                  # Script d'initialisation global
│   └── functions/
│       ├── create-checkout/          # Edge Function création session SasPay
│       └── saspay-webhook/           # Edge Function traitement webhook sécurisé
├── index.html                        # Métadonnées SEO, OpenGraph et Schema.org JSON-LD
├── vite.config.ts                    # Configuration Vite + React + Tailwind
├── vercel.json                       # Réécritures SPA et proxies API
└── package.json
```

---

## 🗄️ Schéma de Base de Données (Supabase)

Toutes les tables sont protégées par **Row Level Security (RLS)** :

1. **`profiles`** : Identité, pseudonyme unique, statut de vérification KYC (`unverified`, `pending`, `verified`, `restricted`), wallet Mobile Money (`orange`, `wave`, `moov`), verrouillage anti-fraude de 30 jours, rôle `is_admin`.
2. **`campaigns`** : Multi-collectes par créateur, titre, slug unique, description, objectif financier en FCFA, montants collectés, statut (`active`, `completed`, `expired`), bénéficiaire (soi-même ou un tiers).
3. **`donations`** : Dons enregistrés avec statut (`pending`, `paid`, `failed`), montant brut, commission plateforme 5 %, montant net 95 %, opérateur utilisé et message d'encouragement.
4. **`payouts`** : Demandes de retraits vers le numéro Mobile Money vérifié, soumises à validation KYC à partir de 500 000 FCFA.
5. **`reports`** : Signalements pour suspicion de fraude ou contenu inapproprié, gérés par l'équipe de modération.
6. **`verification_records`** : Documents d'identité (CNI, passeport) chiffrés pour validation KYC.
7. **`audit_logs`** : Traçabilité des actions d'administration et de sécurité.

---

## 🔒 Sécurité et Administration Furtive (Stealth Mode)

- **Route `/admin` furtive** : Toute personne non authentifiée ou ne possédant pas les droits `is_admin: true` dans Supabase reçoit une véritable erreur **404 — Page introuvable**. Aucun écran d'identification ni formulaire de mot de passe n'est exposé publiquement.
- **Accès administrateur** : Une fois connecté avec le compte administrateur autorisé, un raccourci exclusif **Console Système** apparaît dans le tableau de bord pour ouvrir le panneau d'administration.
- **Contrôle d'intégrité financier** : Les calculs de montants, de commissions et de statuts sont tous validés côté serveur (Edge Functions Supabase) ; le frontend ne dicte jamais le statut d'un paiement.
- **Signatures HMAC-SHA256** : Chaque notification de paiement SasPay est cryptographiquement vérifiée par l'Edge Function avant validation des fonds.

---

## 💻 Démarrage Local

```bash
# 1. Cloner le dépôt
git clone https://github.com/kalifa4y/Donkai.git
cd donkai

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer le serveur de développement
pnpm dev

# 5. Compiler et tester le bundle de production
pnpm build
```

---

## 🌐 Déploiement

Le projet est hébergé sur **Vercel** et synchronisé automatiquement sur la branche `main` :

- **URL de production :** `https://donkai.vercel.app`
- **Règles de routage :** Réécritures SPA complètes via [`vercel.json`](file:///c:/Users/legion/Documents/Projet%20APP/donkai/vercel.json) pour assurer le bon fonctionnement des URLs profondes (`/@username`, `/@username/:slug`, `/admin`, etc.).

---

## 📄 Licence & Propriété

Produit conçu, développé et détenu par **Oshun Web Studio** (Bamako, Mali). Tous droits réservés.
