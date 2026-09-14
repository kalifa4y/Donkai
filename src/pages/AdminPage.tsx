import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Report, Payout, Campaign, Profile, Donation, AuditLog } from '../types'
import { Lock, Menu, CheckCircle2, AlertCircle } from 'lucide-react'
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

export const AdminPage: React.FC<AdminPageProps> = () => {
  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode === 'donkai_admin_2026' || passcode === 'admin') {
      setIsAuthenticated(true)
      loadAllAdminData()
    } else {
      alert('Code administrateur invalide.')
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

      // 2. Profils Utilisateurs
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(usersData || [])

      // 3. Contributions / Dons
      const { data: donData } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
      setDonations(donData || [])

      // 4. Retraits
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
      const localReports = JSON.parse(localStorage.getItem('donkai_local_reports') || '[]')
      setReports([...(repData || []), ...localReports])

      // 6. KYC
      const { data: kycData } = await supabase
        .from('verification_records')
        .select('*')
        .order('created_at', { ascending: false })
      setKycRecords((kycData as VerificationRecord[]) || [])

      // 7. Audit Logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setAuditLogs((auditData as AuditLog[]) || [])
    } catch (err) {
      console.error('Erreur chargement back-office Donkai:', err)
      showToast('Impossible de charger toutes les données.', true)
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

  // Écran de verrouillage / Déverrouillage par mot de passe
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-[#12141f] p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 max-w-sm w-full space-y-4 shadow-sm text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-600/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-950 dark:text-white text-center font-heading">
            Espace d'Administration Donkai
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
            Accès strictement réservé aux gestionnaires et modérateurs Donkai.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Code d'accès
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-orange-600/20"
          >
            Déverrouiller le Panneau
          </button>
        </form>
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
