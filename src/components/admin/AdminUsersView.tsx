import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile, VerificationStatus, WalletProvider } from '../../types'
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react'
import { AdminModal } from './AdminModal'

interface AdminUsersViewProps {
  users: Profile[]
  onRefresh: () => void
  onNotify: (msg: string, isError?: boolean) => void
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  onRefresh,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  // Formulaire Création / Édition
  const [formUsername, setFormUsername] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formVerification, setFormVerification] = useState<VerificationStatus>('verified')
  const [formIsAdmin, setFormIsAdmin] = useState(false)
  const [formWalletProvider, setFormWalletProvider] = useState<WalletProvider>('orange')
  const [formWalletNumber, setFormWalletNumber] = useState('')

  // Filtrage
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.verification_status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Ouvrir modal création
  const handleOpenCreate = () => {
    setFormUsername('')
    setFormDisplayName('')
    setFormEmail('')
    setFormVerification('verified')
    setFormIsAdmin(false)
    setFormWalletProvider('orange')
    setFormWalletNumber('+223 ')
    setIsCreateOpen(true)
  }

  // Ouvrir modal édition
  const handleOpenEdit = (u: Profile) => {
    setEditingUser(u)
    setFormUsername(u.username)
    setFormDisplayName(u.display_name)
    setFormEmail(u.email || '')
    setFormVerification(u.verification_status)
    setFormIsAdmin(u.is_admin)
    setFormWalletProvider(u.wallet_provider || 'orange')
    setFormWalletNumber(u.wallet_number || '')
  }

  // 1-Clic Bascule Rôle Admin
  const handleToggleAdmin = async (u: Profile) => {
    const nextAdmin = !u.is_admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: nextAdmin, updated_at: new Date().toISOString() })
      .eq('id', u.id)

    if (error) {
      onNotify(`Erreur modification rôle admin : ${error.message}`, true)
    } else {
      onNotify(`Rôle administrateur de @${u.username} : ${nextAdmin ? 'Activé' : 'Désactivé'}`)
      onRefresh()
    }
  }

  // 1-Clic Bascule Vérification (Vérifié / Suspendu)
  const handleToggleVerification = async (u: Profile) => {
    const nextStatus: VerificationStatus = u.verification_status === 'verified' ? 'suspended' : 'verified'
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', u.id)

    if (error) {
      onNotify(`Erreur statut vérification : ${error.message}`, true)
    } else {
      onNotify(`Statut de @${u.username} passé à : ${nextStatus}`)
      onRefresh()
    }
  }

  // Soumission Création
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = formUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!cleanUsername || !formDisplayName.trim()) {
      onNotify('Username et Nom affiché obligatoires.', true)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').insert({
        username: cleanUsername,
        display_name: formDisplayName.trim(),
        email: formEmail.trim() || null,
        verification_status: formVerification,
        is_admin: formIsAdmin,
        wallet_provider: formWalletProvider,
        wallet_number: formWalletNumber.trim() || null,
        clerk_user_id: `user_${Date.now()}`,
      })

      if (error) throw error

      onNotify(`Utilisateur @${cleanUsername} créé avec succès !`)
      setIsCreateOpen(false)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur création utilisateur : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Soumission Édition
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formDisplayName.trim(),
          email: formEmail.trim() || null,
          verification_status: formVerification,
          is_admin: formIsAdmin,
          wallet_provider: formWalletProvider,
          wallet_number: formWalletNumber.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id)

      if (error) throw error

      onNotify(`Profil @${editingUser.username} mis à jour avec succès !`)
      setEditingUser(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur modification profil : ${msg}`, true)
    } finally {
      setSaving(false)
    }
  }

  // Suppression
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id)

      if (error) throw error

      onNotify(`Profil @${deletingUser.username} supprimé.`)
      setDeletingUser(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      onNotify(`Erreur suppression profil : ${msg}`, true)
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
            Utilisateurs & Profils Créateurs
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Gérer les comptes, les privilèges administrateur et les statuts de vérification KYC.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, username, email ou ID..."
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
          <option value="verified">Vérifiés</option>
          <option value="pending">En attente KYC</option>
          <option value="unverified">Non vérifiés</option>
          <option value="suspended">Suspendus</option>
          <option value="restricted">Restreints</option>
        </select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucun utilisateur ne correspond à vos critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Utilisateur</th>
                  <th className="py-3.5 px-4">Coordonnées / Email</th>
                  <th className="py-3.5 px-4">Rôle</th>
                  <th className="py-3.5 px-4">Vérification KYC</th>
                  <th className="py-3.5 px-4">Portefeuille Retrait</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Nom & Pseudo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-700 dark:text-zinc-300 shrink-0">
                          {u.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-950 dark:text-white">
                            {u.display_name}
                          </p>
                          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">
                      {u.email || 'Aucun email renseigné'}
                    </td>

                    {/* Rôle */}
                    <td className="py-3.5 px-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Membre</span>
                      )}
                    </td>

                    {/* Statut KYC */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          u.verification_status === 'verified'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                            : u.verification_status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : u.verification_status === 'suspended'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                        }`}
                      >
                        {u.verification_status}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="py-3.5 px-4 text-gray-600 dark:text-zinc-300 text-[11px]">
                      {u.wallet_provider ? (
                        <span className="font-medium">
                          {u.wallet_provider.toUpperCase()} : {u.wallet_number || 'Non configuré'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Aucun</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Clic Bascule Admin */}
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(u)}
                          title={u.is_admin ? 'Retirer droits admin' : 'Passer administrateur'}
                          className={`p-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                            u.is_admin
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* 1-Clic Bascule Vérification */}
                        <button
                          type="button"
                          onClick={() => handleToggleVerification(u)}
                          title={u.verification_status === 'verified' ? 'Suspendre' : 'Valider vérification'}
                          className={`p-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                            u.verification_status === 'verified'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                          }`}
                        >
                          {u.verification_status === 'verified' ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Éditer */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Modifier profil"
                          className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          title="Supprimer utilisateur"
                          className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création Utilisateur */}
      <AdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un Nouvel Utilisateur"
        subtitle="Ajoutez un créateur ou un gestionnaire sur la plateforme."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Nom d'utilisateur (Pseudo) *
              </label>
              <input
                type="text"
                required
                placeholder="ex: amadou"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Nom complet affiché *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Amadou Diallo"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Email (optionnel)
            </label>
            <input
              type="email"
              placeholder="amadou@example.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Statut KYC
              </label>
              <select
                value={formVerification}
                onChange={(e) => setFormVerification(e.target.value as VerificationStatus)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="verified">Vérifié</option>
                <option value="pending">En attente</option>
                <option value="unverified">Non vérifié</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Opérateur Mobile Money
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
              Numéro Mobile Money
            </label>
            <input
              type="text"
              placeholder="+223 70 00 00 00"
              value={formWalletNumber}
              onChange={(e) => setFormWalletNumber(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsAdmin}
                onChange={(e) => setFormIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                Accorder les privilèges Administrateur Donkai
              </span>
            </label>
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
              {saving ? 'Création...' : 'Créer le profil'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Édition Utilisateur */}
      <AdminModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Modifier le Profil Utilisateur"
        subtitle={editingUser ? `@${editingUser.username} • ID: ${editingUser.id}` : undefined}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Nom complet affiché
            </label>
            <input
              type="text"
              required
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Statut KYC
              </label>
              <select
                value={formVerification}
                onChange={(e) => setFormVerification(e.target.value as VerificationStatus)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="verified">Vérifié</option>
                <option value="pending">En attente KYC</option>
                <option value="unverified">Non vérifié</option>
                <option value="suspended">Suspendu</option>
                <option value="restricted">Restreint</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                Opérateur Mobile Money
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
              Numéro de retrait
            </label>
            <input
              type="text"
              value={formWalletNumber}
              onChange={(e) => setFormWalletNumber(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsAdmin}
                onChange={(e) => setFormIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                Privilèges Administrateur actifs
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Confirmation Suppression Utilisateur */}
      <AdminModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Supprimer l'Utilisateur"
        subtitle="Cette action supprimera le profil et les données associées."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Êtes-vous certain de vouloir supprimer le compte de{' '}
              <strong>{deletingUser?.display_name} (@{deletingUser?.username})</strong> ?
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
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
              {saving ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
