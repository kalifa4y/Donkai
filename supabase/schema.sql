-- DONKA Database Schema (Supabase Auth + SasPay)

-- 1. Table des profils créateurs (liée directement à auth.users)
CREATE TABLE creators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  wallet_provider TEXT NOT NULL CHECK (wallet_provider IN ('orange', 'wave', 'moov', 'mtn')),
  wallet_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des dons reçus
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 100),
  fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  saspay_session_id TEXT,
  saspay_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des demandes de retrait (payouts vers Mobile Money)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 5000),
  wallet_provider TEXT NOT NULL,
  wallet_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  saspay_payout_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_donations_creator_status ON donations(creator_id, status);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_payouts_creator_status ON payouts(creator_id, status);
