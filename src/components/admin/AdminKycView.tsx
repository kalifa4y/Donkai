import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'
import {
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

export interface VerificationRecord {
  id: string
  user_id: string
  document_type: string
  document_number?: string | null
  document_url?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  reviewed_at?: string | null
  created_at: string
}

interface AdminKycViewProps {
  kycRecords: VerificationRecord[]
  users: Profile[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminKycView: React.FC<AdminKycViewProps> = ({
  kycRecords,
  users,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [rejectingRecord, setRejectingRecord] = useState<VerificationRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<VerificationRecord | null>(null)
  const [inspectingRecord, setInspectingRecord] = useState<VerificationRecord | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredRecords = kycRecords.filter((k) => {
    const user = users.find((u) => u.id === k.user_id)
    const matchesSearch =
      (user && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (k.document_number && k.document_number.includes(searchTerm)) ||
      k.document_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Approuver KYC
  const handleApprove = async (k: VerificationRecord) => {
    setSaving(true)
    try {
      // 1. Mettre à jour le dossier KYC
      const { error: kycError } = await supabase
        .from('verification_records')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', k.id)

      if (kycError) throw kycError

      // 2. Mettre à jour le statut du profil utilisateur vers 'verified'
      await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', k.user_id)

      onNotify('Dossier KYC approuvé ! Le compte utilisateur est désormais Vérifié.')
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur approbation KYC : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Rejeter KYC
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingRecord) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('verification_records')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'Document illisible ou non conforme.',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', rejectingRecord.id)

      if (error) throw error

      onNotify('Dossier KYC rejeté avec notification du motif.')
      setRejectingRecord(null)
      setRejectionReason('')
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur rejet KYC : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Supprimer Dossier
  const handleDeleteSubmit = async () => {
    if (!deletingRecord) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('verification_records')
        .delete()
        .eq('id', deletingRecord.id)

      if (error) throw error

      onNotify('Dossier KYC supprimé.')
      setDeletingRecord(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur suppression KYC : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
          Vérification d'Identité (KYC Créateurs)
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Validation des pièces officielles (Passeport, CNI, NINA) exigées lors des demandes de retrait.
        </p>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titulaire, type de pièce ou numéro..."
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
          <option value="all">Tous les statuts KYC</option>
          <option value="pending">En attente de revue</option>
          <option value="approved">Approuvés</option>
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      {/* Tableau des KYC */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucun dossier KYC soumis dans cette catégorie.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Titulaire</th>
                  <th className="py-3.5 px-4">Type de Document</th>
                  <th className="py-3.5 px-4">Numéro de Pièce</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Soumis le</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredRecords.map((k) => {
                  const user = users.find((u) => u.id === k.user_id)

                  return (
                    <tr
                      key={k.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Utilisateur */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-950 dark:text-white">
                            {user ? user.display_name : 'Utilisateur'}
                          </p>
                          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">
                            {user ? `@${user.username}` : `#${k.user_id.slice(0, 8)}`}
                          </p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-zinc-200 uppercase">
                          {k.document_type}
                        </span>
                      </td>

                      {/* Numéro & Lien */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-gray-800 dark:text-zinc-200">
                            {k.document_number || 'Non renseigné'}
                          </span>
                          {k.document_url && (
                            <button
                              type="button"
                              onClick={() => setInspectingRecord(k)}
                              className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Inspecter le document
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            k.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                              : k.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {k.status === 'approved' ? 'Approuvé' : k.status === 'pending' ? 'En attente' : 'Rejeté'}
                        </span>
                        {k.rejection_reason && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            Motif : {k.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(k.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {k.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(k)}
                                title="Approuver le document"
                                disabled={saving}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approuver</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectingRecord(k)}
                                title="Rejeter la pièce"
                                className="p-1 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeletingRecord(k)}
                            title="Supprimer dossier"
                            className="p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
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

      {/* Modal Rejet KYC */}
      <AdminModal
        isOpen={Boolean(rejectingRecord)}
        onClose={() => setRejectingRecord(null)}
        title="Rejeter le Dossier KYC"
        subtitle="Indiquez à l'utilisateur pourquoi son document a été refusé."
        maxWidth="sm"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Motif du refus *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ex: La photo de la carte d'identité est floue ou expirée."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Refus en cours...' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Inspecter Document */}
      <AdminModal
        isOpen={Boolean(inspectingRecord)}
        onClose={() => setInspectingRecord(null)}
        title="Inspection du Document KYC"
        subtitle={inspectingRecord ? `Type : ${inspectingRecord.document_type} • N° ${inspectingRecord.document_number || 'N/A'}` : undefined}
      >
        <div className="space-y-4">
          {inspectingRecord?.document_url ? (
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-gray-50 dark:bg-zinc-900 max-h-[60vh] flex items-center justify-center p-2">
              <img
                src={inspectingRecord.document_url}
                alt="Document KYC"
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-6 text-center">Aucun fichier prévisualisable.</p>
          )}

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setInspectingRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-950 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Modal Confirmation Suppression */}
      <AdminModal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        title="Supprimer le Dossier KYC"
        subtitle="Cette action supprimera l'enregistrement de vérification."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Confirmer la suppression du dossier KYC ?</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingRecord(null)}
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
