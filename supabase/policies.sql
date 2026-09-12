-- DONKA RLS Policies (Row Level Security)

-- Activation du RLS sur toutes les tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 1. POLITIQUES SUR LA TABLE CREATORS
-- Tout le monde peut voir les profils publics des créateurs
CREATE POLICY "creators_select_public" ON creators
  FOR SELECT USING (true);

-- Un utilisateur authentifié peut créer son propre profil créateur
CREATE POLICY "creators_insert_own" ON creators
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Un créateur ne peut modifier que son propre profil
CREATE POLICY "creators_update_own" ON creators
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. POLITIQUES SUR LA TABLE DONATIONS
-- Les dons validés sont publics (mur des soutiens), et les créateurs voient tous leurs dons
CREATE POLICY "donations_select" ON donations
  FOR SELECT USING (
    status = 'paid' OR auth.uid() = creator_id
  );

-- Tout visiteur peut initier un don en statut 'pending'
CREATE POLICY "donations_insert_public" ON donations
  FOR INSERT WITH CHECK (status = 'pending');

-- 3. POLITIQUES SUR LA TABLE PAYOUTS
-- Un créateur ne peut consulter que ses propres demandes de retrait
CREATE POLICY "payouts_select_own" ON payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- Un créateur peut initier une demande de retrait pour son compte
CREATE POLICY "payouts_insert_own" ON payouts
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND status = 'pending'
  );
