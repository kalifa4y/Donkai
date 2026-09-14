import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Donation, DonationStatus, Campaign, WalletProvider } from '../../types'
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

interface AdminDonationsViewProps {
  donations: Donation[]
  campaigns: Campaign[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminDonationsView: React.FC<AdminDonationsViewProps> = ({
  donations,
  campaigns,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null)
  const [deletingDonation, setDeletingDonation] = useState<Donation | null>(null)
  const [saving, setSaving] = useState(false)

  // Formulaire Création Manuelle
  const [formCampaignId, setFormCampaignId] = useState(campaigns[0]?.id || '')
  const [formAmount, setFormAmount] = useState('5000')
  const [formDonorName, setFormDonorName] = useState('')
  const [formDonorEmail, setFormDonorEmail] = useState('')
  const [formIsAnonymous, setFormIsAnonymous] = useState(false)
  const [formPaymentMethod, setFormPaymentMethod] = useState<WalletProvider | 'card'>('orange')
  const [formStatus, setFormStatus] = useState<DonationStatus>('paid')
  const [formMessage, setFormMessage] = useState('')

  // Formulaire Édition Statut
  const [editStatus, setEditStatus] = useState<DonationStatus>('paid')

  // Filtrage
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      (d.donor_name && d.donor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.donor_email && d.donor_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.payment_transaction_id && d.payment_transaction_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    const matchesCampaign = campaignFilter === 'all' || d.campaign_id === campaignFilter
    return matchesSearch && matchesStatus && matchesCampaign
  })

  const formatFcfa = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Ouvrir modal création
  const handleOpenCreate = () => {
    setFormCampaignId(campaigns[0]?.id || '')
    setFormAmount('5000')
    setFormDonorName('')
    setFormDonorEmail('')
    setFormIsAnonymous(false)
    setFormPaymentMethod('orange')
    setFormStatus('paid')
    setFormMessage('')
    setIsCreateOpen(true)
  }

  // Ouvrir modal édition statut
  const handleOpenEdit = (d: Donation) => {
    setEditingDonation(d)
    setEditStatus(d.status)
  }

  // Soumission Création Manuelle
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCampaignId) {
      onNotify('Veuillez sélectionner une collecte.', true)
      return
    }

    const numAmount = Number(formAmount) || 0
    if (numAmount < 100) {
      onNotify('Montant minimum : 100 FCFA.', true)
      return
    }

    setSaving(true)
    try {
      const fee = Math.round(numAmount * 0.05)
      const netAmount = Math.max(0, numAmount - fee)

      const { error } = await supabase.from('donations').insert({
        campaign_id: formCampaignId,
        amount: numAmount,
        fee: fee,
        net_amount: netAmount,
        currency: 'XOF',
        donor_name: formIsAnonymous ? 'Anonyme' : formDonorName.trim() || 'Anonyme',
        donor_email: formDonorEmail.trim() || null,
        is_anonymous: formIsAnonymous,
        message: formMessage.trim() || null,
        payment_method: formPaymentMethod,
        status: formStatus,
        payment_transaction_id: `manual_${Date.now()}`,
        paid_at: formStatus === 'paid' ? new Date().toISOString() : null,
      })

      if (error) throw error

      // Mettre à jour le montant collecté sur la campagne si le don est paid
      if (formStatus === 'paid') {
        const targetCampaign = campaigns.find((c) => c.id === formCampaignId)
        if (targetCampaign) {
          await supabase
            .from('campaigns')
            .update({
              collected_amount: (targetCampaign.collected_amount || 0) + numAmount,
              contributions_count: (targetCampaign.contributions_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', formCampaignId)
        }
      }

      onNotify('Don enregistré avec succès !')
      setIsCreateOpen(false)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur enregistrement don : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Soumission Édition Statut
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDonation) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('donations')
        .update({
          status: editStatus,
          paid_at: editStatus === 'paid' ? new Date().toISOString() : editingDonation.paid_at,
        })
        .eq('id', editingDonation.id)

      if (error) throw error

      onNotify(`Statut du don mis à jour : ${editStatus}`)
      setEditingDonation(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur modification statut : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Suppression Don
  const handleDeleteSubmit = async () => {
    if (!deletingDonation) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', deletingDonation.id)

      if (error) throw error

      onNotify('Contribution supprimée de la base.')
      setDeletingDonation(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur suppression don : ${msg}`, true)
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
            Contributions & Dons Enregistrés
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Traçabilité intégrale des paiements par Mobile Money et cartes bancaires.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Don Manuel</span>
        </button>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom donateur, email, transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-2xl text-xs font-bold outline-none cursor-pointer max-w-xs"
        >
          <option value="all">Toutes les collectes</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 rounded-2xl text-xs font-bold outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="paid">Payés (Confirmés)</option>
          <option value="pending">En attente</option>
          <option value="refunded">Remboursés</option>
          <option value="failed">Échoués</option>
        </select>
      </div>

      {/* Tableau des Dons */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredDonations.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucun don ne correspond à votre filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Donateur</th>
                  <th className="py-3.5 px-4">Collecte Visée</th>
                  <th className="py-3.5 px-4">Montant</th>
                  <th className="py-3.5 px-4">Moyen de Paiement</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredDonations.map((d) => {
                  const campaign = campaigns.find((c) => c.id === d.campaign_id)

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Donateur */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-950 dark:text-white">
                            {d.is_anonymous ? 'Donateur Anonyme' : d.donor_name || 'Anonyme'}
                          </p>
                          {d.donor_email && (
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                              {d.donor_email}
                            </p>
                          )}
                          {d.message && (
                            <p className="text-[10px] text-gray-600 dark:text-zinc-300 italic flex items-center gap-1 mt-0.5">
                              <MessageSquare className="w-2.5 h-2.5 text-orange-500" />
                              "{d.message}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Collecte */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-gray-800 dark:text-zinc-200 truncate">
                          {campaign ? campaign.title : `Campagne #${d.campaign_id.slice(0, 8)}`}
                        </p>
                      </td>

                      {/* Montant */}
                      <td className="py-3.5 px-4 font-heading font-extrabold text-gray-950 dark:text-white">
                        {formatFcfa(d.amount)} FCFA
                      </td>

                      {/* Mode de Paiement */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                          {d.payment_method || 'Mobile Money'}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            d.status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                              : d.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              : d.status === 'refunded'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            title="Modifier statut"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingDonation(d)}
                            title="Supprimer don"
                            className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
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

      {/* Modal Création Don Manuel */}
      <AdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Enregistrer un Don Manuel"
        subtitle="Régularisation de don en espèces ou reçu hors ligne."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Collecte bénéficiaire *
            </label>
            <select
              value={formCampaignId}
              onChange={(e) => setFormCampaignId(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Méthode de paiement
              </label>
              <select
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value as WalletProvider | 'card')}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="orange">Orange Money</option>
                <option value="wave">Wave</option>
                <option value="moov">Moov Money</option>
                <option value="mtn">MTN Mobile</option>
                <option value="card">Carte bancaire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Nom du donateur
              </label>
              <input
                type="text"
                placeholder="ex: Fatoumata Traoré"
                disabled={formIsAnonymous}
                value={formDonorName}
                onChange={(e) => setFormDonorName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Email du donateur (optionnel)
              </label>
              <input
                type="email"
                placeholder="fatou@example.com"
                value={formDonorEmail}
                onChange={(e) => setFormDonorEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsAnonymous}
                onChange={(e) => setFormIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                Enregistrer comme Don Anonyme
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Message d'encouragement (optionnel)
            </label>
            <input
              type="text"
              placeholder="Que la bénédiction soit avec vous !"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
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
              {saving ? 'Enregistrement...' : 'Valider le don'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Édition Statut Don */}
      <AdminModal
        isOpen={Boolean(editingDonation)}
        onClose={() => setEditingDonation(null)}
        title="Modifier le Statut du Don"
        subtitle={editingDonation ? `ID : ${editingDonation.id}` : undefined}
        maxWidth="sm"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Statut du paiement
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as DonationStatus)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="paid">Payé (Confirmé)</option>
              <option value="pending">En attente</option>
              <option value="refunded">Remboursé</option>
              <option value="failed">Échoué</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingDonation(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Suppression Don */}
      <AdminModal
        isOpen={Boolean(deletingDonation)}
        onClose={() => setDeletingDonation(null)}
        title="Supprimer la Contribution"
        subtitle="Cette action supprimera l'enregistrement du don."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Êtes-vous sûr de vouloir supprimer le don de{' '}
              <strong>{formatFcfa(deletingDonation?.amount || 0)} FCFA</strong> ?
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingDonation(null)}
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
