import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Report, Payout, Campaign, Profile, Donation, AuditLog } from '../types'
import { Menu, CheckCircle2, AlertCircle } from 'lucide-react'
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
  const { profile, loading: authLoading } = useAuth()
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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

  // Détection et chargement automatique du panneau si l'utilisateur est administrateur
  useEffect(() => {
    if (profile?.is_admin) {
      loadAllAdminData()
    }
  }, [profile])

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
        .from('verification_records')
        .select('*')
        .order('created_at', { ascending: false })
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

  // Compteurs pour la sidebar
  const sidebarCounts = {
    campaigns: campaigns.length,
    users: users.length,
    donations: donations.length,
    pendingPayouts: payouts.filter((p) => p.status === 'requested' || p.status === 'under_review').length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    pendingKyc: kycRecords.filter((k) => k.status === 'pending').length,
  }

  // 1. Écran d'attente pendant la vérification de session Supabase
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 2. Sécurité Furtive (Stealth Mode) : Si l'utilisateur n'est pas connecté ou n'est pas administrateur Supabase,
  // la page affiche une erreur 404 standard identique à n'importe quelle URL inexistante.
  // Zéro indice pour les scanners ou attaquants qu'une console admin existe ici.
  if (!profile?.is_admin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800/80 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-heading mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mb-6">
          La ressource demandée n'existe pas, a été déplacée ou est temporairement indisponible.
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          Retourner à l'accueil
        </button>
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
        onLock={() => onNavigate?.('/dashboard')}
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
