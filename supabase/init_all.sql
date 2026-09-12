-- ========================================================
-- DONKAI — Database Schema (Supabase PostgreSQL + Clerk ID)
-- ========================================================

-- 0. Nettoyage préventif des tables de l'ancien prototype (creators, donations avec creator_id)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS verification_records CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS creators CASCADE;

-- 1. Table des profils utilisateurs (Liée à l'identifiant Clerk)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  avatar_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'monitoring', 'restricted', 'suspended')),
  wallet_provider TEXT CHECK (wallet_provider IN ('orange', 'wave', 'moov', 'mtn')),
  wallet_number TEXT,
  wallet_last_updated_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des collectes / objectifs (Multi-campagnes par utilisateur)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  goal_amount INTEGER NOT NULL CHECK (goal_amount >= 1000),
  collected_amount INTEGER NOT NULL DEFAULT 0,
  contributions_count INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('draft', 'active', 'completed', 'expired', 'suspended', 'archived')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  beneficiary_type TEXT NOT NULL DEFAULT 'self' CHECK (beneficiary_type IN ('self', 'other')),
  beneficiary_name TEXT,
  beneficiary_email TEXT,
  beneficiary_phone TEXT,
  beneficiary_claimed BOOLEAN NOT NULL DEFAULT true,
  beneficiary_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_campaign_slug UNIQUE (user_id, slug)
);

-- 3. Table des contributions / donations reçues
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 100),
  fee INTEGER NOT NULL, -- 5% + 100 FCFA
  net_amount INTEGER NOT NULL, -- amount - fee
  currency TEXT NOT NULL DEFAULT 'XOF',
  donor_name TEXT,
  donor_email TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  payment_method TEXT CHECK (payment_method IN ('orange', 'wave', 'moov', 'mtn', 'card')),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  idempotency_key TEXT UNIQUE,
  payment_session_id TEXT,
  payment_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- 4. Table des demandes de retrait (Payouts)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount >= 5000),
  wallet_provider TEXT NOT NULL CHECK (wallet_provider IN ('orange', 'wave', 'moov', 'mtn')),
  wallet_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' 
    CHECK (status IN ('requested', 'under_review', 'approved', 'processing', 'completed', 'failed', 'rejected')),
  review_notes TEXT,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table des signalements communautaires (Reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_email TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('fraud', 'impersonation', 'misleading', 'illegal_content', 'other')),
  description TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table de vérification d'identité (KYC)
CREATE TABLE IF NOT EXISTS verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_number TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Table des logs d'audit sensibles
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index de performance et d'intégrité
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_slug ON campaigns(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_status ON donations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_user_status ON payouts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_campaign ON reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);


-- ============================================================================
-- DONKAI — Row Level Security (RLS) Policies for Supabase + Clerk Authentication
-- Matches supabase/schema.sql (profiles, campaigns, donations, payouts, reports, verification_records, audit_logs)
-- ============================================================================

-- 1. Activer RLS sur toutes les tables du schéma
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Fonctions auxiliaires pour extraire l'identifiant Clerk et vérifier le rôle admin
CREATE OR REPLACE FUNCTION requesting_clerk_id()
RETURNS text AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = requesting_clerk_id()
      AND is_admin = true
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 3. POLITIQUES : PROFILES
-- ============================================================================

-- Lecture publique des profils (afficher organisateur, bio, badges de vérification)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- Insertion de son propre profil à l'onboarding
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (
    clerk_user_id = requesting_clerk_id()
    OR auth.role() = 'service_role'
  );

-- Mise à jour réservée au titulaire du compte ou administrateur
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    clerk_user_id = requesting_clerk_id()
    OR is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    clerk_user_id = requesting_clerk_id()
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Suppression réservée aux administrateurs
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 4. POLITIQUES : CAMPAIGNS (Multi-collectes)
-- ============================================================================

-- Lecture publique des collectes actives, expirées ou terminées ; brouillons visibles par le créateur
CREATE POLICY "campaigns_select_public" ON campaigns
  FOR SELECT USING (
    status IN ('active', 'completed', 'expired')
    OR user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Création de collecte par son propriétaire
CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR auth.role() = 'service_role'
  );

-- Mise à jour par le créateur ou administrateur
CREATE POLICY "campaigns_update_own" ON campaigns
  FOR UPDATE USING (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Suppression réservée au créateur ou administrateur
CREATE POLICY "campaigns_delete_own" ON campaigns
  FOR DELETE USING (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 5. POLITIQUES : DONATIONS
-- ============================================================================

-- Lecture : les dons validés (paid) sont publics (mur des soutiens). Les dons d'une campagne sont visibles par son créateur
CREATE POLICY "donations_select" ON donations
  FOR SELECT USING (
    status = 'paid'
    OR campaign_id IN (
      SELECT id FROM campaigns
      WHERE user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    )
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Tout visiteur peut initier une contribution (statut initial 'pending')
CREATE POLICY "donations_insert_public" ON donations
  FOR INSERT WITH CHECK (
    status = 'pending'
    OR auth.role() = 'service_role'
  );

-- Seul le serveur / webhook (service_role) ou un administrateur peut modifier le statut d'un don
CREATE POLICY "donations_update_service" ON donations
  FOR UPDATE USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 6. POLITIQUES : PAYOUTS (Demandes de versement Mobile Money)
-- ============================================================================

-- Un créateur ne peut consulter que ses propres demandes de retrait
CREATE POLICY "payouts_select_own" ON payouts
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Un créateur peut soumettre une demande de retrait pour son compte
CREATE POLICY "payouts_insert_own" ON payouts
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    AND status IN ('requested', 'under_review')
  );

-- Seul un administrateur ou le service role peut valider ou rejeter un versement
CREATE POLICY "payouts_update_admin" ON payouts
  FOR UPDATE USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 7. POLITIQUES : REPORTS (Signalements d'abus)
-- ============================================================================

-- Tout utilisateur ou visiteur peut soumettre un signalement
CREATE POLICY "reports_insert_public" ON reports
  FOR INSERT WITH CHECK (true);

-- Seuls les administrateurs ont accès à la liste des signalements pour modération
CREATE POLICY "reports_select_admin" ON reports
  FOR SELECT USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Seuls les administrateurs peuvent mettre à jour le statut d'un signalement
CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 8. POLITIQUES : VERIFICATION_RECORDS (KYC)
-- ============================================================================

-- L'utilisateur peut voir son propre dossier KYC ; les administrateurs peuvent tous les voir
CREATE POLICY "verification_select_own" ON verification_records
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
    OR is_admin_user()
    OR auth.role() = 'service_role'
  );

-- L'utilisateur peut soumettre son dossier KYC
CREATE POLICY "verification_insert_own" ON verification_records
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_id())
  );

-- Seuls les administrateurs peuvent approuver ou rejeter une vérification KYC
CREATE POLICY "verification_update_admin" ON verification_records
  FOR UPDATE USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- 9. POLITIQUES : AUDIT_LOGS
-- ============================================================================

-- Lecture strictement réservée aux administrateurs et service role
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (
    is_admin_user()
    OR auth.role() = 'service_role'
  );

-- Insertion automatique autorisée pour le système
CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR is_admin_user()
  );
