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
