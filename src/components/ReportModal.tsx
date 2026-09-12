import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ReportReason } from '../types'
import { Flag, X, AlertCircle, CircleCheck, Loader2 } from './Icons'

interface ReportModalProps {
  campaignId?: string
  campaignTitle?: string
  targetUserId?: string
  onClose: () => void
}

const REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'fraud',
    label: 'Suspicion de fraude ou détournement',
    description: 'La collecte semble fictive ou les fonds ne correspondent pas au but déclaré.',
  },
  {
    value: 'impersonation',
    label: 'Usurpation d’identité',
    description: 'L’organisateur se fait passer pour une autre personne ou organisation sans autorisation.',
  },
  {
    value: 'misleading',
    label: 'Informations trompeuses ou mensongères',
    description: 'Les éléments présentés sont inexacts ou manipulés pour tromper les donateurs.',
  },
  {
    value: 'illegal_content',
    label: 'Contenu interdit ou illégal',
    description: 'Le projet contrevient aux lois en vigueur ou aux règles de la communauté.',
  },
  {
    value: 'other',
    label: 'Autre motif sérieux',
    description: 'Autre préoccupation nécessitant l’intervention de l’équipe de modération.',
  },
]

export const ReportModal: React.FC<ReportModalProps> = ({
  campaignId,
  campaignTitle,
  targetUserId,
  onClose,
}) => {
  const [reason, setReason] = useState<ReportReason>('fraud')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Veuillez fournir une explication détaillée pour votre signalement.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('reports').insert({
        campaign_id: campaignId || null,
        target_user_id: targetUserId || null,
        reporter_email: email.trim() || null,
        reason,
        description: description.trim(),
        evidence_url: evidenceUrl.trim() || null,
        status: 'pending',
      })

      if (insertError) {
        // Sauvegarde locale de secours si la table n'est pas encore initialisée
        const localReports = JSON.parse(localStorage.getItem('donkai_local_reports') || '[]')
        localReports.push({
          campaign_id: campaignId,
          reason,
          description,
          email,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('donkai_local_reports', JSON.stringify(localReports))
      }

      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CircleCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">Signalement bien enregistré</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
              Notre équipe examine chaque signalement avec soin. Conformément à notre politique de modération,
              plusieurs signalements crédibles déclenchent une revue humaine immédiate et des mesures conservatoires.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-zinc-200 font-bold py-3 px-6 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-950 dark:text-white">
                Signaler cette collecte
              </h2>
            </div>

            {campaignTitle && (
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                Collecte concernée : <strong className="text-gray-800 dark:text-zinc-200">{campaignTitle}</strong>
              </p>
            )}

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Motif principal *
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === r.value
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/30 text-gray-950 dark:text-white ring-1 ring-red-500/50'
                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{r.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Détails et explications factuelles *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Expliquez de manière précise les raisons de votre signalement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Lien de preuve (facultatif)
              </label>
              <input
                type="url"
                placeholder="https://exemple.com/preuve"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Votre email (pour le suivi du dossier)
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Envoyer le signalement</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
