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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-gray-950">Partager cette collecte</h3>
        </div>

        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
          {title}
        </p>

        {/* Lien direct et bouton copier */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl mb-4">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-xs text-gray-700 font-mono outline-none truncate px-1"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>

        {/* Boutons réseaux sociaux */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors"
          >
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={shareFacebook}
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition-colors"
          >
            <span>Facebook</span>
          </button>
          <button
            type="button"
            onClick={shareX}
            className="flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-xs font-bold transition-colors"
          >
            <span>X (Twitter)</span>
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-bold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Partage natif</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          Pour TikTok et Instagram, collez simplement ce lien dans votre bio ou vos stories.
        </p>
      </div>
    </div>
  )
}
