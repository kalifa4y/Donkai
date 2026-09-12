import React, { useState } from 'react'
import { Share2, Copy, Check, X, ExternalLink } from './Icons'

interface ShareModalProps {
  title: string
  url: string
  onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ title, url, onClose }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Soutenez cette collecte sur Donkai : ${title}`,
          url,
        })
      } catch {
        // Annulation utilisateur ignorée
      }
    } else {
      handleCopy()
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Soutenez la collecte "${title}" sur Donkai : ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const shareX = () => {
    const text = encodeURIComponent(`Découvrez et soutenez la collecte "${title}" sur Donkai`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#12141f] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Partager cette collecte</h3>
        </div>

        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 line-clamp-2">
          {title}
        </p>

        {/* Lien direct et bouton copier */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl mb-4">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-xs text-gray-700 dark:text-zinc-300 font-mono outline-none truncate px-1"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-800 dark:text-zinc-200 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>

        {/* Boutons réseaux sociaux */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200/50 dark:border-emerald-900/50"
          >
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={shareFacebook}
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-900/50"
          >
            <span>Facebook</span>
          </button>
          <button
            type="button"
            onClick={shareX}
            className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-gray-200 dark:border-zinc-700"
          >
            <span>X (Twitter)</span>
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-800 dark:text-orange-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-orange-200/50 dark:border-orange-900/50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Partage natif</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-zinc-500 text-center leading-relaxed">
          Pour TikTok et Instagram, collez simplement ce lien dans votre bio ou vos stories.
        </p>
      </div>
    </div>
  )
}
