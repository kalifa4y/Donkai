import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { WalletProvider } from '../types'
import { Loader2, AlertCircle, CircleCheck } from '../components/Icons'

interface SettingsPageProps {
  onNavigate: (path: string) => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, creator, refreshProfile, loading: authLoading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('orange')
  const [walletNumber, setWalletNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('/login')
    } else if (!authLoading && user && !creator) {
      onNavigate('/onboarding')
    } else if (creator) {
      setDisplayName(creator.display_name || '')
      setBio(creator.bio || '')
      setWalletProvider(creator.wallet_provider || 'orange')
      setWalletNumber(creator.wallet_number || '')
    }
  }, [user, creator, authLoading, onNavigate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!creator) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          display_name: displayName.trim() || creator.username,
          bio: bio.trim() || null,
          wallet_provider: walletProvider,
          wallet_number: walletNumber.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', creator.id)

      if (updateError) throw updateError

      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !creator) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight mb-1">
          Paramètres du compte
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Modifiez vos informations publiques et votre numéro de versement Mobile Money.
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Identifiant (Username)
            </label>
            <input
              type="text"
              disabled
              value={`@${creator.username}`}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              L'identifiant unique ne peut pas être modifié.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nom affiché
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Bio / Description
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Opérateur Mobile Money de versement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(['orange', 'wave', 'moov', 'mtn'] as WalletProvider[]).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setWalletProvider(provider)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    walletProvider === provider
                      ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>

            <input
              type="tel"
              required
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Modifications enregistrées avec succès.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>Enregistrer les modifications</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
