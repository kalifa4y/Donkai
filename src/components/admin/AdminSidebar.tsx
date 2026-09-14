import React from 'react'
import {
  LayoutDashboard,
  Target,
  Users,
  Coins,
  Wallet,
  ShieldAlert,
  FileCheck,
  ScrollText,
  Lock,
  X,
  ShieldCheck,
} from 'lucide-react'

export type AdminSection =
  | 'dashboard'
  | 'campaigns'
  | 'users'
  | 'donations'
  | 'payouts'
  | 'reports'
  | 'kyc'
  | 'audit'

interface AdminSidebarProps {
  activeSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  counts: {
    campaigns: number
    users: number
    donations: number
    pendingPayouts: number
    pendingReports: number
    pendingKyc: number
  }
  onLock: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  counts,
  onLock,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems: {
    id: AdminSection
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
    badgeColor?: string
  }[] = [
    {
      id: 'dashboard',
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
    },
    {
      id: 'campaigns',
      label: 'Collectes & Projets',
      icon: Target,
      badge: counts.campaigns,
    },
    {
      id: 'users',
      label: 'Utilisateurs & Profils',
      icon: Users,
      badge: counts.users,
    },
    {
      id: 'donations',
      label: 'Contributions & Dons',
      icon: Coins,
      badge: counts.donations,
    },
    {
      id: 'payouts',
      label: 'Retraits & Versements',
      icon: Wallet,
      badge: counts.pendingPayouts,
      badgeColor: counts.pendingPayouts > 0 ? 'bg-amber-500 text-white' : undefined,
    },
    {
      id: 'reports',
      label: 'Signalements',
      icon: ShieldAlert,
      badge: counts.pendingReports,
      badgeColor: counts.pendingReports > 0 ? 'bg-red-500 text-white' : undefined,
    },
    {
      id: 'kyc',
      label: 'Vérifications KYC',
      icon: FileCheck,
      badge: counts.pendingKyc,
      badgeColor: counts.pendingKyc > 0 ? 'bg-orange-500 text-white' : undefined,
    },
    {
      id: 'audit',
      label: "Journal d'Audit",
      icon: ScrollText,
    },
  ]

  const handleSelect = (section: AdminSection) => {
    onSelectSection(section)
    setIsMobileOpen(false)
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#10121a] border-r border-gray-200 dark:border-zinc-800 text-left">
      {/* Header Sidebar */}
      <div>
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base text-gray-950 dark:text-white tracking-tight">
                DONKAI
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50">
                Admin
              </span>
            </div>
          </div>
          {/* Fermer sur mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5" aria-label="Menu d'administration">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer / Déconnexion */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={onLock}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors border border-gray-200/80 dark:border-zinc-800 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Verrouiller l'accès</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar Desktop (statique à gauche) */}
      <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-30 pt-16">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile (Tiroir coulissant) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
