import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Campaign, CampaignStatus, Profile } from '../../types'
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

interface AdminCampaignsViewProps {
  campaigns: Campaign[]
  users: Profile[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminCampaignsView: React.FC<AdminCampaignsViewProps> = ({
  campaigns,
  users,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modales d'action
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)

  // Formulaire Création / Édition
  const [formUserId, setFormUserId] = useState(users[0]?.id || '')
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formGoal, setFormGoal] = useState('500000')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formStatus, setFormStatus] = useState<CampaignStatus>('active')

  // Filtrage
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Formatage
  const formatFcfa = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Ouvrir modal création
  const handleOpenCreate = () => {
    setFormUserId(users[0]?.id || '')
    setFormTitle('')
    setFormSlug('')
    setFormGoal('500000')
    setFormDescription('')
    setFormImageUrl('')
    setFormStatus('active')
    setIsCreateOpen(true)
  }

  // Générer slug auto
  const handleTitleChange = (val: string) => {
    setFormTitle(val)
    if (!editingCampaign) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setFormSlug(generatedSlug)
    }
  }

  // Ouvrir modal édition
  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c)
    setFormTitle(c.title)
    setFormSlug(c.slug)
    setFormGoal(c.goal_amount.toString())
    setFormDescription(c.description)
    setFormImageUrl(c.cover_image_url || '')
    setFormStatus(c.status)
  }

  // 1-Clic Bascule Suspendre / Réactiver
  const handleToggleStatus = async (c: Campaign) => {
    const nextStatus: CampaignStatus = c.status === 'suspended' ? 'active' : 'suspended'
    const { error } = await supabase
      .from('campaigns')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', c.id)

    if (error) {
      onNotify(`Erreur lors du changement de statut : ${error.message}`, true)
    } else {
      onNotify(`Collecte "${c.title}" passée au statut : ${nextStatus}`)
      onRefresh()
    }
  }

  // Soumission Création
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formSlug.trim() || !formUserId) {
      onNotify('Veuillez renseigner les champs obligatoires (Titre, Slug, Créateur).', true)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        user_id: formUserId,
        title: formTitle.trim(),
        slug: formSlug.trim(),
        goal_amount: Number(formGoal) || 50000,
        description: formDescription.trim() || 'Description de la collecte',
        cover_image_url: formImageUrl.trim() || null,
        status: formStatus,
        currency: 'XOF',
      })

      if (error) throw error

      onNotify('Collecte créée avec succès !')
      setIsCreateOpen(false)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur création : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Soumission Édition
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          title: formTitle.trim(),
          slug: formSlug.trim(),
          goal_amount: Number(formGoal) || editingCampaign.goal_amount,
          description: formDescription.trim(),
          cover_image_url: formImageUrl.trim() || null,
          status: formStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCampaign.id)

      if (error) throw error

      onNotify('Collecte mise à jour avec succès !')
      setEditingCampaign(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur modification : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Suppression
  const handleDeleteSubmit = async () => {
    if (!deletingCampaign) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', deletingCampaign.id)

      if (error) throw error

      onNotify(`Collecte "${deletingCampaign.title}" supprimée.`)
      setDeletingCampaign(null)
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
      {/* Entête & Bouton Création */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
            Gestion des Collectes & Campagnes
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Créer, inspecter, suspendre ou supprimer les collectes hébergées sur la plateforme.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Collecte</span>
        </button>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, slug ou identifiant..."
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
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="suspended">Suspendues</option>
          <option value="completed">Closes / Atteintes</option>
          <option value="draft">Brouillons</option>
        </select>
      </div>

      {/* Tableau des collectes */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucune collecte ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Collecte & Porteur</th>
                  <th className="py-3.5 px-4">Progression (FCFA)</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Date de création</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredCampaigns.map((c) => {
                  const creator = users.find((u) => u.id === c.user_id)
                  const progressPct = Math.min(
                    100,
                    Math.round(((c.collected_amount || 0) / (c.goal_amount || 1)) * 100)
                  )

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Titre & Porteur */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-950 dark:text-white line-clamp-1">
                            {c.title}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                            Slug : <span className="font-mono text-orange-600 dark:text-orange-400">/{c.slug}</span>
                            {creator && ` • Par @${creator.username}`}
                          </p>
                        </div>
                      </td>

                      {/* Progression */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900 dark:text-zinc-200">
                            {formatFcfa(c.collected_amount)} / {formatFcfa(c.goal_amount)}
                          </div>
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className="bg-orange-500 h-full rounded-full"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Statut Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            c.status === 'suspended'
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50'
                              : c.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                              : c.status === 'completed'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Clic Suspendre / Réactiver */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(c)}
                            title={c.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                            className={`p-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                              c.status === 'suspended'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {c.status === 'suspended' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Éditer */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Modifier"
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => setDeletingCampaign(c)}
                            title="Supprimer"
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

      {/* Modal Création Collecte */}
      <AdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer une nouvelle Collecte"
        subtitle="Ajoutez une campagne de don directement sur la plateforme."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Porteur de la collecte (Utilisateur) *
            </label>
            <select
              value={formUserId}
              onChange={(e) => setFormUserId(e.target.value)}
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

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Titre de la collecte *
            </label>
            <input
              type="text"
              required
              placeholder="Ex : Forage d'eau potable à Siby"
              value={formTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
            </input>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Slug URL *
              </label>
              <input
                type="text"
                required
                placeholder="forage-eau-siby"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Objectif (FCFA) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Statut initial
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as CampaignStatus)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="active">Active (Publique)</option>
              <option value="draft">Brouillon</option>
              <option value="suspended">Suspendue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              URL Image de couverture (optionnel)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Description de la collecte
            </label>
            <textarea
              rows={3}
              placeholder="Expliquez l'impact du projet..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              {saving ? 'Création en cours...' : 'Créer la collecte'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Édition Collecte */}
      <AdminModal
        isOpen={Boolean(editingCampaign)}
        onClose={() => setEditingCampaign(null)}
        title="Modifier la Collecte"
        subtitle={editingCampaign ? `ID : ${editingCampaign.id}` : undefined}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Titre de la collecte
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Slug URL
              </label>
              <input
                type="text"
                required
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Objectif (FCFA)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Statut
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as CampaignStatus)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspendue</option>
              <option value="completed">Complétée</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingCampaign(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Confirmation Suppression */}
      <AdminModal
        isOpen={Boolean(deletingCampaign)}
        onClose={() => setDeletingCampaign(null)}
        title="Supprimer la Collecte"
        subtitle="Cette action est irréversible et supprimera la collecte et ses liens."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Êtes-vous sûr de vouloir supprimer définitivement la collecte{' '}
              <strong>"{deletingCampaign?.title}"</strong> ?
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingCampaign(null)}
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
              {saving ? 'Suppression...' : 'Confirmer la suppression'}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
