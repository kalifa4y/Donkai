import React from 'react'
import type { Campaign, Profile, Donation, Payout, Report } from '../../types'
import {
  Target,
  Users,
  Coins,
  Wallet,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react'
import type { AdminSection } from './AdminSidebar'

interface AdminDashboardViewProps {
  campaigns: Campaign[]
  users: Profile[]
  donations: Donation[]
  payouts: Payout[]
  reports: Report[]
  onNavigateSection: (section: AdminSection) => void
  onOpenCreateCampaign: () => void
  onOpenCreateUser: () => void
  onOpenCreateDonation: () => void
  onRefreshData: () => void
  loading: boolean
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  campaigns,
  users,
  donations,
  payouts,
  reports,
  onNavigateSection,
  onOpenCreateCampaign,
  onOpenCreateUser,
  onOpenCreateDonation,
  onRefreshData,
  loading,
}) => {
  // Calculs statistiques
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
  const suspendedCampaigns = campaigns.filter((c) => c.status === 'suspended').length
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length
  const draftCampaigns = campaigns.filter((c) => c.status === 'draft').length

  const totalRaisedAmount = campaigns.reduce((acc, c) => acc + (c.collected_amount || 0), 0)
  const totalDonationsCount = donations.length

  const totalUsers = users.length
  const verifiedUsers = users.filter((u) => u.verification_status === 'verified').length
  const pendingUsers = users.filter((u) => u.verification_status === 'pending').length

  const pendingPayouts = payouts.filter((p) => p.status === 'requested' || p.status === 'under_review')
  const completedPayouts = payouts.filter((p) => p.status === 'completed')
  const totalPaidOutAmount = completedPayouts.reduce((acc, p) => acc + (p.amount || 0), 0)
  const totalPendingPayoutAmount = pendingPayouts.reduce((acc, p) => acc + (p.amount || 0), 0)

  const pendingReports = reports.filter((r) => r.status === 'pending')

  const formatFcfa = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header avec bouton rafraîchir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white font-heading">
            Tableau de Bord & Métriques Clés
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Surveillance en temps réel de l'activité financière et communautaire de Donkai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Raccourcis d'action rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onOpenCreateCampaign}
          className="p-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-between transition-all shadow-sm shadow-orange-600/20 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold">Nouvelle Collecte</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
        </button>

        <button
          type="button"
          onClick={onOpenCreateUser}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 text-gray-800 dark:text-zinc-200 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold">Créer Utilisateur</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={onOpenCreateDonation}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 text-gray-800 dark:text-zinc-200 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold">Ajouter un Don</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('payouts')}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 text-gray-800 dark:text-zinc-200 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold">Gérer Retraits</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            {pendingPayouts.length}
          </span>
        </button>
      </div>

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Collectes créées */}
        <div
          onClick={() => onNavigateSection('campaigns')}
          className="p-5 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-800 transition-all cursor-pointer space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Collectes Créées
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-950 dark:text-white font-heading">
              {totalCampaigns}
            </span>
            <span className="text-xs text-gray-400">au total</span>
          </div>

          {/* Décomposition statuts */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {activeCampaigns} actives
            </span>
            <span className="text-red-600 dark:text-red-400 font-bold">
              {suspendedCampaigns} suspendues
            </span>
            <span className="text-gray-400">
              {completedCampaigns} closes
            </span>
          </div>
        </div>

        {/* 2. Total Collecté */}
        <div
          onClick={() => onNavigateSection('donations')}
          className="p-5 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Volume Collecté
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
              {formatFcfa(totalRaisedAmount)}
            </span>
            <span className="text-xs text-gray-400">FCFA</span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
            <span>{totalDonationsCount} contributions</span>
            <span className="font-bold text-gray-900 dark:text-white">Dons réels</span>
          </div>
        </div>

        {/* 3. Utilisateurs & Créateurs */}
        <div
          onClick={() => onNavigateSection('users')}
          className="p-5 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Utilisateurs & Créateurs
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-950 dark:text-white font-heading">
              {totalUsers}
            </span>
            <span className="text-xs text-gray-400">inscrits</span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {verifiedUsers} vérifiés
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {pendingUsers} en attente
            </span>
          </div>
        </div>

        {/* 3. Retraits & Versements */}
        <div
          onClick={() => onNavigateSection('payouts')}
          className="p-5 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Versements Demandés
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-heading">
              {formatFcfa(totalPendingPayoutAmount)}
            </span>
            <span className="text-xs text-gray-400">FCFA</span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {pendingPayouts.length} en attente
            </span>
            <span className="text-gray-400">
              {formatFcfa(totalPaidOutAmount)} payés
            </span>
          </div>
        </div>

        {/* 4. Alertes & Signalements */}
        <div
          onClick={() => onNavigateSection('reports')}
          className={`p-5 rounded-3xl bg-white dark:bg-[#12141f] border transition-all cursor-pointer space-y-3 shadow-xs ${
            pendingReports.length > 0
              ? 'border-red-300 dark:border-red-800/80 hover:border-red-400'
              : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Alertes & Signalements
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                pendingReports.length > 0
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold font-heading ${
                pendingReports.length > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-950 dark:text-white'
              }`}
            >
              {pendingReports.length}
            </span>
            <span className="text-xs text-gray-400">à traiter</span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 dark:text-zinc-400">
              {reports.length} total reçus
            </span>
            {pendingReports.length > 0 ? (
              <span className="font-bold text-red-600 dark:text-red-400">Action requise</span>
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zéro alerte
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barre de répartition des statuts de collectes */}
      {totalCampaigns > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-900 dark:text-white">Répartition de santé des collectes</span>
            <span className="text-gray-400">{totalCampaigns} enregistrées</span>
          </div>

          {/* Barre segmentée */}
          <div className="h-3 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            {activeCampaigns > 0 && (
              <div
                style={{ width: `${(activeCampaigns / totalCampaigns) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`${activeCampaigns} Actives`}
              />
            )}
            {suspendedCampaigns > 0 && (
              <div
                style={{ width: `${(suspendedCampaigns / totalCampaigns) * 100}%` }}
                className="bg-red-500 h-full transition-all"
                title={`${suspendedCampaigns} Suspendues`}
              />
            )}
            {completedCampaigns > 0 && (
              <div
                style={{ width: `${(completedCampaigns / totalCampaigns) * 100}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`${completedCampaigns} Complétées`}
              />
            )}
            {draftCampaigns > 0 && (
              <div
                style={{ width: `${(draftCampaigns / totalCampaigns) * 100}%` }}
                className="bg-zinc-400 h-full transition-all"
                title={`${draftCampaigns} Brouillons`}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Actives ({activeCampaigns})
            </span>
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Suspendues ({suspendedCampaigns})
            </span>
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Closes ({completedCampaigns})
            </span>
            {draftCampaigns > 0 && (
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                Brouillons ({draftCampaigns})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Colonnes d'activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières Collectes */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-950 dark:text-white font-heading flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              Dernières Collectes Créées
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('campaigns')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          {campaigns.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-500 py-6 text-center">
              Aucune collecte pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {campaigns.slice(0, 5).map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                      {formatFcfa(c.collected_amount)} / {formatFcfa(c.goal_amount)} FCFA
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      c.status === 'suspended'
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        : c.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières Contributions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-950 dark:text-white font-heading flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              Derniers Dons Enregistrés
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('donations')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          {donations.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-zinc-500 py-6 text-center">
              Aucune contribution enregistrée.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {donations.slice(0, 5).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {d.donor_name || 'Anonyme'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      Via {(d.payment_method || 'Mobile Money').toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatFcfa(d.amount)} FCFA
                    </span>
                    <p className="text-[10px] text-gray-400">{d.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
