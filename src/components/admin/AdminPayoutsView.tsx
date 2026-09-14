import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Payout, Profile, WalletProvider } from '../../types'
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

interface AdminPayoutsViewProps {
  payouts: Payout[]
  users: Profile[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminPayoutsView: React.FC<AdminPayoutsViewProps> = ({
  payouts,
  users,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [rejectingPayout, setRejectingPayout] = useState<Payout | null>(null)
  const [deletingPayout, setDeletingPayout] = useState<Payout | null>(null)
  const [saving, setSaving] = useState(false)

  // Formulaire Création Manuelle
  const [formUserId, setFormUserId] = useState(users[0]?.id || '')
  const [formAmount, setFormAmount] = useState('25000')
  const [formWalletProvider, setFormWalletProvider] = useState<WalletProvider>('orange')
  const [formWalletNumber, setFormWalletNumber] = useState('')

  // Formulaire Rejet
  const [rejectionReason, setRejectionReason] = useState('')

  // Filtrage
  const filteredPayouts = payouts.filter((p) => {
    const user = users.find((u) => u.id === p.user_id)
    const matchesSearch =
      (user && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.wallet_number.includes(searchTerm) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatFcfa = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Ouvrir modal création
  const handleOpenCreate = () => {
    const initialUser = users[0]
    setFormUserId(initialUser?.id || '')
    setFormAmount('25000')
    setFormWalletProvider(initialUser?.wallet_provider || 'orange')
    setFormWalletNumber(initialUser?.wallet_number || '+223 ')
    setIsCreateOpen(true)
  }

  // Changement d'utilisateur sélectionné
  const handleUserChange = (uId: string) => {
    setFormUserId(uId)
    const u = users.find((x) => x.id === uId)
    if (u) {
      if (u.wallet_provider) setFormWalletProvider(u.wallet_provider)
      if (u.wallet_number) setFormWalletNumber(u.wallet_number)
    }
  }

  // 1-Clic Valider Versement
  const handleApprove = async (p: Payout) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', p.id)

      if (error) throw error

      onNotify(`Versement de ${formatFcfa(p.amount)} FCFA validé avec succès !`)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur validation versement : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Rejeter Versement
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingPayout) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim() || 'Coordonnées de versement incorrectes ou alerte conformité.',
          processed_at: new Date().toISOString(),
        })
        .eq('id', rejectingPayout.id)

      if (error) throw error

      onNotify('Demande de versement rejetée.')
      setRejectingPayout(null)
      setRejectionReason('')
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur rejet : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Création Manuelle de Retrait
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formUserId || !formWalletNumber.trim()) {
      onNotify('Veuillez renseigner le bénéficiaire et le numéro Mobile Money.', true)
      return
    }

    const numAmount = Number(formAmount) || 0
    if (numAmount < 5000) {
      onNotify('Le montant minimum de retrait est de 5 000 FCFA.', true)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('payouts').insert({
        user_id: formUserId,
        amount: numAmount,
        wallet_provider: formWalletProvider,
        wallet_number: formWalletNumber.trim(),
        status: 'requested',
      })

      if (error) throw error

      onNotify('Demande de versement créée avec succès !')
      setIsCreateOpen(false)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur création versement : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Suppression
  const handleDeleteSubmit = async () => {
    if (!deletingPayout) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('payouts')
        .delete()
        .eq('id', deletingPayout.id)

      if (error) throw error

      onNotify('Demande de retrait supprimée.')
      setDeletingPayout(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur suppression : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header & Bouton Création */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
            Retraits & Déboursements Mobile Money
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Contrôle humain, validation des versements vers Orange, Wave et Moov Money.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Versement</span>
        </button>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par bénéficiaire, numéro de retrait ou ID..."
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
          <option value="all">Tous les statuts de retrait</option>
          <option value="requested">En attente (Demandés)</option>
          <option value="under_review">En revue de conformité</option>
          <option value="completed">Effectués (Payés)</option>
          <option value="rejected">Rejetés</option>
          <option value="failed">Échoués</option>
        </select>
      </div>

      {/* Tableau des Retraits */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredPayouts.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucune demande de versement enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Bénéficiaire</th>
                  <th className="py-3.5 px-4">Montant Déboursé</th>
                  <th className="py-3.5 px-4">Destination Mobile Money</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Demandé le</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredPayouts.map((p) => {
                  const user = users.find((u) => u.id === p.user_id)
                  const isPending = p.status === 'requested' || p.status === 'under_review'

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Bénéficiaire */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-950 dark:text-white">
                            {user ? user.display_name : 'Bénéficiaire'}
                          </p>
                          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">
                            {user ? `@${user.username}` : `#${p.user_id.slice(0, 8)}`}
                          </p>
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 font-heading font-extrabold text-base text-gray-950 dark:text-white">
                        {formatFcfa(p.amount)} FCFA
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold uppercase text-gray-900 dark:text-white">
                            {p.wallet_provider}
                          </span>
                          <p className="text-[11px] font-mono text-gray-500 dark:text-zinc-400">
                            {p.wallet_number}
                          </p>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            p.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                              : isPending
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {p.status === 'completed' ? 'Effectué' : p.status === 'requested' ? 'En attente' : p.status}
                        </span>
                        {p.rejection_reason && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-xs">
                            Motif : {p.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Valider si en attente */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(p)}
                                title="Valider le transfert"
                                disabled={saving}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-600/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valider</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectingPayout(p)}
                                title="Rejeter"
                                className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => setDeletingPayout(p)}
                            title="Supprimer la ligne"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
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

      {/* Modal Rejet Payout */}
      <AdminModal
        isOpen={Boolean(rejectingPayout)}
        onClose={() => setRejectingPayout(null)}
        title="Rejeter la Demande de Versement"
        subtitle={rejectingPayout ? `Montant : ${formatFcfa(rejectingPayout.amount)} FCFA` : undefined}
        maxWidth="sm"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Motif du rejet (visible par l'organisateur) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ex: Le numéro Wave est inactif ou n'appartient pas au titulaire de la collecte."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingPayout(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Rejet en cours...' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Création Versement Manuel */}
      <AdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un Versement Manuel"
        subtitle="Enregistrement d'un déboursement vers un créateur."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Bénéficiaire (Créateur) *
            </label>
            <select
              value={formUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Montant à verser (FCFA) *
              </label>
              <input
                type="number"
                min="5000"
                step="1000"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Opérateur Mobile
              </label>
              <select
                value={formWalletProvider}
                onChange={(e) => setFormWalletProvider(e.target.value as WalletProvider)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="orange">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="moov">Moov Money</option>
                <option value="mtn">MTN Mobile</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Numéro Mobile Money de réception *
            </label>
            <input
              type="text"
              required
              placeholder="+223 70 00 00 00"
              value={formWalletNumber}
              onChange={(e) => setFormWalletNumber(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Création...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Confirmation Suppression */}
      <AdminModal
        isOpen={Boolean(deletingPayout)}
        onClose={() => setDeletingPayout(null)}
        title="Supprimer la Demande de Retrait"
        subtitle="Cette action retirera la demande de la base."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Supprimer la demande de versement de{' '}
              <strong>{formatFcfa(deletingPayout?.amount || 0)} FCFA</strong> ?
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingPayout(null)}
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
