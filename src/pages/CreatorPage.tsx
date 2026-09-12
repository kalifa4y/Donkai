import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Creator, Donation } from '../types'
import { DonationCard } from '../components/DonationCard'
import { Copy, Check, Share2, AlertCircle, Heart, CircleCheck } from '../components/Icons'

interface CreatorPageProps {
  username: string
  onNavigate: (path: string) => void
}

export const CreatorPage: React.FC<CreatorPageProps> = ({ username, onNavigate }) => {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    // Verifier si retour apres paiement reussi
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      setPaymentSuccess(true)
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: creatorData, error: creatorErr } = await supabase
          .from('creators')
          .select('*')
          .eq('username', username.toLowerCase().trim())
          .maybeSingle()

        if (creatorErr || !creatorData) {
          setError('Ce créateur est introuvable.')
          setCreator(null)
          return
        }

        setCreator(creatorData)

        // Charger les derniers dons confirmes pour le mur des soutiens
        const { data: donationsData } = await supabase
          .from('donations')
          .select('*')
          .eq('creator_id', creatorData.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(10)

        setDonations(donationsData || [])
      } catch (err) {
        setError((err as Error).message || 'Erreur lors du chargement.')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadData()
    }
  }, [username])

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href.split('?')[0])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!creator) return
    const text = encodeURIComponent(
      `Soutenez ${creator.display_name} sur Donkai : ${window.location.href.split('?')[0]}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400 font-medium text-sm">Chargement du profil...</p>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profil introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">
            L'identifiant @{username} ne correspond à aucun créateur actif.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Banniere remerciement apres paiement */}
      {paymentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Merci pour votre soutien !</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Votre don est en cours de traitement via SasPay. {creator.display_name} vous remercie.
            </p>
          </div>
        </div>
      )}

      {/* Carte de profil */}
      <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 sm:p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-1 mx-auto mb-4 shadow-sm">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-extrabold text-orange-600">
                {(creator.display_name || creator.username).slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
          {creator.display_name}
        </h1>
        <p className="text-sm font-semibold text-orange-600 mb-3">@{creator.username}</p>

        {creator.bio && (
          <p className="text-sm text-gray-600 max-w-sm mx-auto mb-5 leading-relaxed">
            {creator.bio}
          </p>
        )}

        {/* Boutons de partage */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={copyProfileLink}
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Lien copié' : 'Copier le lien'}</span>
          </button>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <DonationCard creatorId={creator.id} creatorName={creator.display_name} />
        </div>
      </div>

      {/* Mur des soutiens */}
      {donations.length > 0 && (
        <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 text-left">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-950 flex items-center gap-2">
              <Heart className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>Derniers soutiens</span>
            </h2>
            <span className="text-xs font-semibold text-gray-400">
              {donations.length} don{donations.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {donations.map((d) => (
              <div key={d.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">
                    {d.donor_name || 'Anonyme'}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    +{d.amount.toLocaleString()} XOF
                  </span>
                </div>
                {d.message && (
                  <p className="text-xs text-gray-600 italic mt-1 leading-relaxed">
                    "{d.message}"
                  </p>
                )}
                <span className="text-[10px] text-gray-400 font-medium block mt-1">
                  {formatDate(d.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Propulsé par{' '}
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-orange-600 font-bold hover:underline"
          >
            Donkai
          </button>{' '}
          — Créez votre page gratuite
        </p>
      </div>
    </div>
  )
}
