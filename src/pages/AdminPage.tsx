import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Report, Payout, Campaign, Profile, Donation, AuditLog } from '../types'
import { Lock, Menu, CheckCircle2, AlertCircle, ShieldCheck, User, ArrowRight } from 'lucide-react'
import { AdminSidebar, type AdminSection } from '../components/admin/AdminSidebar'
import { AdminDashboardView } from '../components/admin/AdminDashboardView'
import { AdminCampaignsView } from '../components/admin/AdminCampaignsView'
import { AdminUsersView } from '../components/admin/AdminUsersView'
import { AdminDonationsView } from '../components/admin/AdminDonationsView'
import { AdminPayoutsView } from '../components/admin/AdminPayoutsView'
import { AdminReportsView } from '../components/admin/AdminReportsView'
import { AdminKycView, type VerificationRecord } from '../components/admin/AdminKycView'
import { AdminAuditLogsView } from '../components/admin/AdminAuditLogsView'

interface AdminPageProps {
  onNavigate?: (path: string) => void
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile } = useAuth()
  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [elevating, setElevating] = useState(false)

  // Données d'administration
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [kycRecords, setKycRecords] = useState<VerificationRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null)

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 4000)
  }

  // Détection automatique du statut Administrateur Supabase
  useEffect(() => {
    if (profile?.is_admin) {
      setIsAuthenticated(true)
      loadAllAdminData()
    }
  }, [profile])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode === 'donkai_admin_2026' || passcode === 'admin') {
      // Si l'utilisateur est connecté dans Supabase mais n'a pas encore is_admin: true, on l'élève automatiquement dans Supabase !
      if (profile && !profile.is_admin) {
        setElevating(true)
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true, updated_at: new Date().toISOString() })
            .eq('id', profile.id)

          if (!updateError) {
            await refreshProfile()
            showToast(`Privilèges Administrateur Supabase activés pour ${profile.email || profile.username} !`)
          }
        } catch (err) {
          console.error("Erreur lors de l'élévation admin :", err)
        } finally {
          setElevating(false)
        }
      }
      setIsAuthenticated(true)
      loadAllAdminData()
    } else {
      showToast('Code administrateur invalide.', true)
    }
  }

  const loadAllAdminData = async () => {
    setLoading(true)
    try {
      // 1. Collectes
      const { data: campData } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      setCampaigns(campData || [])

      // 2. Utilisateurs / Profils
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(userData || [])

      // 3. Dons
      const { data: donData } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
      setDonations(donData || [])

      // 4. Demandes de retrait
      const { data: payData } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false })
      setPayouts(payData || [])

      // 5. Signalements
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      setReports(repData || [])

      // 6. Dossiers KYC
      const { data: kycData } = await supabase
        .from('verifications')
        .select('*')
        .order('submitted_at', { ascending: false })
      setKycRecords(kycData || [])

      // 7. Journaux d'audit
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
      setAuditLogs(auditData || [])
    } catch (err) {
      console.error('Erreur chargement données admin :', err)
      showToast('Erreur lors du chargement des données.', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAllAdminData()
    }
  }, [isAuthenticated])

  // Compteurs pour la sidebar
  const sidebarCounts = {
    campaigns: campaigns.length,
    users: users.length,
    donations: donations.length,
    pendingPayouts: payouts.filter((p) => p.status === 'requested' || p.status === 'under_review').length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    pendingKyc: kycRecords.filter((k) => k.status === 'pending').length,
  }

  // Écran de verrouillage / Authentification Supabase Admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white dark:bg-[#12141f] p-7 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 max-w-md w-full space-y-5 shadow-sm text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
              Console d'Administration Donkai
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Gestionnaire des collectes, modération et contrôle de sécurité
            </p>
          </div>

          {/* État du compte connecté dans Supabase */}
          {user ? (
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-zinc-400">Compte Supabase :</span>
                <span className="font-bold text-gray-900 dark:text-white">{user.email || user.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-zinc-400">Rôle dans Supabase :</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50">
                  Utilisateur standard
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 pt-1 border-t border-gray-200/60 dark:border-zinc-700 leading-relaxed">
                Entrez le code maître ci-dessous pour accorder définitivement le rôle <strong>Admin Supabase</strong> à ce compte.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-xs space-y-2.5">
              <p className="text-orange-900 dark:text-orange-300 font-medium">
                Vous n'êtes pas connecté à votre compte Supabase.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.('/login')}
                className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Se connecter avec mon compte</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                {user ? "Clé d'activation Admin Supabase" : "Ou code d'accès maître"}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={elevating}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{user ? "Promouvoir Admin & Ouvrir le Panneau" : "Déverrouiller le Panneau"}</span>
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0c0d12] transition-colors">
      {/* Sidebar latérale */}
      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        counts={sidebarCounts}
        onLock={() => setIsAuthenticated(false)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Contenu Principal (Décalé à droite pour faire de la place à la Sidebar sur Desktop) */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Barre d'en-tête de section */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#10121a]/90 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-gray-600 dark:text-zinc-300 p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                Back-Office
              </span>
              <span className="text-gray-300 dark:text-zinc-600">/</span>
              <span className="font-extrabold text-gray-900 dark:text-white capitalize">
                {activeSection === 'dashboard'
                  ? "Vue d'ensemble"
                  : activeSection === 'campaigns'
                  ? 'Collectes'
                  : activeSection === 'users'
                  ? 'Utilisateurs'
                  : activeSection === 'donations'
                  ? 'Contributions'
                  : activeSection === 'payouts'
                  ? 'Retraits'
                  : activeSection === 'reports'
                  ? 'Signalements'
                  : activeSection === 'kyc'
                  ? 'KYC'
                  : 'Audit'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Système En Ligne
            </span>
          </div>
        </header>

        {/* Notifications Toast Flottantes */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-in slide-in-from-bottom-4 duration-200 ${
              toast.isError
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Zone de Contenu Principale */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {loading && (
            <div className="py-2 text-center text-xs text-orange-600 dark:text-orange-400 animate-pulse font-medium mb-4">
              Synchronisation avec la base de données...
            </div>
          )}

          {activeSection === 'dashboard' && (
            <AdminDashboardView
              campaigns={campaigns}
              users={users}
              donations={donations}
              payouts={payouts}
              reports={reports}
              onNavigateSection={(sec) => setActiveSection(sec)}
              onOpenCreateCampaign={() => setActiveSection('campaigns')}
              onOpenCreateUser={() => setActiveSection('users')}
              onOpenCreateDonation={() => setActiveSection('donations')}
              onRefreshData={loadAllAdminData}
              loading={loading}
            />
          )}

          {activeSection === 'campaigns' && (
            <AdminCampaignsView
              campaigns={campaigns}
              users={users}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'users' && (
            <AdminUsersView
              users={users}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'donations' && (
            <AdminDonationsView
              donations={donations}
              campaigns={campaigns}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'payouts' && (
            <AdminPayoutsView
              payouts={payouts}
              users={users}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'reports' && (
            <AdminReportsView
              reports={reports}
              campaigns={campaigns}
              users={users}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'kyc' && (
            <AdminKycView
              kycRecords={kycRecords}
              users={users}
              onRefresh={loadAllAdminData}
              onNotify={showToast}
            />
          )}

          {activeSection === 'audit' && (
            <AdminAuditLogsView
              auditLogs={auditLogs}
              users={users}
              onRefresh={loadAllAdminData}
            />
          )}
        </main>
      </div>
    </div>
  )
}
export default AdminPage
