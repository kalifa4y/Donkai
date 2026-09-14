import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Report, ReportStatus, Campaign, Profile } from '../../types'
import {
  Search,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

interface AdminReportsViewProps {
  reports: Report[]
  campaigns: Campaign[]
  users: Profile[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  reports,
  campaigns,
  users,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingReport, setDeletingReport] = useState<Report | null>(null)
  const [saving, setSaving] = useState(false)

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reporter_email && r.reporter_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Changer statut
  const handleUpdateStatus = async (r: Report, newStatus: ReportStatus) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', r.id)

      if (error) throw error

      onNotify(`Signalement mis à jour : ${newStatus}`)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur statut signalement : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Suppression
  const handleDeleteSubmit = async () => {
    if (!deletingReport) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', deletingReport.id)

      if (error) throw error

      onNotify('Signalement supprimé de la file.')
      setDeletingReport(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur suppression signalement : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
          Signalements Communautaires & Modération
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Surveillance anti-fraude, usurpation d'identité et vérification de conformité des collectes.
        </p>
      </div>

      {/* Règle Donkai alerte */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong>Règle de sécurité Donkai :</strong> Dès que 3 signalements crédibles sont enregistrés sur une même collecte, les retraits sont préventivement suspendus en attendant l'inspection administrative.
        </div>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par description, email déclarant, motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-2xl text-xs font-bold outline-none cursor-pointer"
        >
          <option value="all">Tous les signalements</option>
          <option value="pending">En attente de revue</option>
          <option value="reviewed">Vérifiés / Conformes</option>
          <option value="action_taken">Sanctionnés / Bloqués</option>
          <option value="dismissed">Rejetés / Sans suite</option>
        </select>
      </div>

      {/* Tableau des Signalements */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucun signalement en attente. La communauté est saine.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Motif & Déclarant</th>
                  <th className="py-3.5 px-4">Détails & Description</th>
                  <th className="py-3.5 px-4">Cible</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredReports.map((r) => {
                  const campaign = campaigns.find((c) => c.id === r.campaign_id)
                  const targetUser = users.find((u) => u.id === r.target_user_id)

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Motif */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
                            {r.reason}
                          </span>
                          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                            {r.reporter_email || 'Déclarant anonyme'}
                          </p>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-gray-900 dark:text-zinc-200 font-medium line-clamp-2">
                          {r.description}
                        </p>
                        {r.evidence_url && (
                          <a
                            href={r.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1 hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Voir la preuve fournie
                          </a>
                        )}
                      </td>

                      {/* Cible */}
                      <td className="py-3.5 px-4">
                        {campaign ? (
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {campaign.title}
                          </span>
                        ) : targetUser ? (
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            @{targetUser.username}
                          </span>
                        ) : (
                          <span className="text-gray-400">Général</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            r.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              : r.status === 'reviewed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r, 'reviewed')}
                                title="Marquer vérifié / Conforme"
                                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-bold transition-colors cursor-pointer border border-emerald-200/50 dark:border-emerald-800/50"
                              >
                                Vérifié
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r, 'dismissed')}
                                title="Classer sans suite / Rejeter"
                                className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Rejeter
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeletingReport(r)}
                            title="Supprimer signalement"
                            className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmation Suppression */}
      <AdminModal
        isOpen={Boolean(deletingReport)}
        onClose={() => setDeletingReport(null)}
        title="Supprimer le Signalement"
        subtitle="Cette alerte sera retirée des listes de surveillance."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Confirmer la suppression de ce signalement ?</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingReport(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDeleteSubmit}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
