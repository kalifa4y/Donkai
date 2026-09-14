import React, { useState } from 'react'
import { X, FileText, Loader2, AlertCircle } from './Icons'
import { ImageUploadField } from './ImageUploadField'
import { supabase } from '../lib/supabase'

export interface CampaignUpdate {
  id: string
  campaign_id: string
  title: string
  content: string
  image_url: string | null
  created_at: string
}

interface CampaignUpdatesModalProps {
  campaignId: string
  campaignTitle: string
  onClose: () => void
  onUpdateCreated: (newUpdate: CampaignUpdate) => void
}

export const CampaignUpdatesModal: React.FC<CampaignUpdatesModalProps> = ({
  campaignId,
  campaignTitle,
  onClose,
  onUpdateCreated,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Veuillez donner un titre à cette actualité.')
      return
    }

    if (!content.trim() || content.trim().length < 10) {
      setError('Veuillez détailler l’avancement du projet (au moins 10 caractères).')
      return
    }

    setSubmitting(true)

    const newUpdate: CampaignUpdate = {
      id: `update-${Date.now()}`,
      campaign_id: campaignId,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl || null,
      created_at: new Date().toISOString(),
    }

    try {
      // 1. Tenter l'insertion dans Supabase
      const { data, error: sbError } = await supabase
        .from('campaign_updates')
        .insert({
          campaign_id: campaignId,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl || null,
        })
        .select('*')
        .maybeSingle()

      if (!sbError && data) {
        onUpdateCreated(data)
      } else {
        // Fallback local transparent
        const stored = JSON.parse(localStorage.getItem(`donkai_updates_${campaignId}`) || '[]')
        localStorage.setItem(`donkai_updates_${campaignId}`, JSON.stringify([newUpdate, ...stored]))
        onUpdateCreated(newUpdate)
      }

      onClose()
    } catch {
      // Fallback local en cas d'erreur réseau
      const stored = JSON.parse(localStorage.getItem(`donkai_updates_${campaignId}`) || '[]')
      localStorage.setItem(`donkai_updates_${campaignId}`, JSON.stringify([newUpdate, ...stored]))
      onUpdateCreated(newUpdate)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl max-w-lg w-full p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
              Publier une nouvelle du terrain
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 max-w-[280px]">
              {campaignTitle}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-zinc-400 mb-5 leading-relaxed">
          Partagez les étapes franchies et les photos réelles des avancées. La transparence est ce qui incite le plus les donateurs à se mobiliser et à renouveler leur soutien.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Titre de l’actualité *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Réception des 12 panneaux solaires et début du forage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Description de l’avancement *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Racontez à vos donateurs ce qui a été accompli grâce à leurs fonds..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <ImageUploadField
              label="Photo de terrain ou preuve d’achat (Recommandé)"
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio="banner"
              maxDimension={1200}
              quality={0.82}
              helperText="Une vraie photo du chantier, du matériel reçu ou de l'équipe apporte une preuve incontestable à vos soutiens."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs shadow-orange-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Publier l’actualité</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
