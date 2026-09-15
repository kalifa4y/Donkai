-- ========================================================
-- DONKAI — Database Schema (Supabase PostgreSQL + Native Auth)
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

-- 1. Table des profils utilisateurs (Liée à l'identifiant d'authentification Supabase)
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
