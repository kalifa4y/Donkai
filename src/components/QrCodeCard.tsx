import React, { useState, useRef } from 'react'
import { Download, Copy, Check, QrCode as QrIcon, Smartphone } from 'lucide-react'

interface QrCodeCardProps {
  url: string
  title: string
  subtitle?: string
  showDownloadButton?: boolean
  size?: number
}

export const QrCodeCard: React.FC<QrCodeCardProps> = ({
  url,
  title,
  subtitle = 'Scannez avec votre smartphone pour soutenir',
  showDownloadButton = true,
  size = 200,
}) => {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // URL du QR Code haute définition (généré via service CDN HTTPS performant)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    url
  )}&margin=10&format=png`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Génération d'une carte image PNG stylée Donkai pour story/live
  const handleDownloadImage = async () => {
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 800
      canvas.height = 1000

      // Fond dégradé élégant
      const grad = ctx.createLinearGradient(0, 0, 800, 1000)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(1, '#fff7ed') // Teinte orange très douce
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 1000)

      // Bordure extérieure
      ctx.strokeStyle = '#fed7aa'
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, 760, 960)

      // Header DONKAI
      ctx.fillStyle = '#ea580c' // Orange Donkai
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('DONKAI', 400, 100)

      ctx.fillStyle = '#78716c'
      ctx.font = '500 20px sans-serif'
      ctx.fillText('Plateforme de soutien communautaire', 400, 140)

      // Titre de la collecte
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 32px sans-serif'
      const words = title.split(' ')
      let line1 = ''
      let line2 = ''
      words.forEach((w) => {
        if ((line1 + w).length < 28) {
          line1 += `${w} `
        } else {
          line2 += `${w} `
        }
      })
      ctx.fillText(line1.trim(), 400, 220)
      if (line2) {
        ctx.fillText(line2.trim(), 400, 265)
      }

      // Charger l'image du QR Code
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = qrImageUrl

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Erreur chargement QR'))
      })

      // Cadre blanc pour le QR Code
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.08)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetY = 10
      ctx.fillRect(175, 330, 450, 450)
      ctx.shadowColor = 'transparent'

      ctx.drawImage(img, 200, 355, 400, 400)

      // Instructions en bas
      ctx.fillStyle = '#ea580c'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('Scannez pour contribuer directement', 400, 840)

      ctx.fillStyle = '#57534e'
      ctx.font = '600 18px sans-serif'
      ctx.fillText('Orange Money  •  Wave  •  Moov Money', 400, 880)

      ctx.fillStyle = '#a8a29e'
      ctx.font = '500 16px sans-serif'
      ctx.fillText(url.replace(/^https?:\/\//, ''), 400, 925)

      // Téléchargement du fichier PNG
      const link = document.createElement('a')
      link.download = `donkai-qr-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.warn('Erreur génération image PNG personnalisée, fallback vers QR brut :', err)
      // Fallback direct
      const link = document.createElement('a')
      link.download = 'donkai-qr.png'
      link.href = qrImageUrl
      link.target = '_blank'
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#12141f] border border-orange-100/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 text-center shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <QrIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-gray-900 dark:text-white font-heading">
            QR Code Donkai
          </span>
        </div>
        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
          Prêt pour Live
        </span>
      </div>

      {/* Rendu du QR Code avec cadre blanc */}
      <div className="flex flex-col items-center justify-center p-3 bg-gray-50/70 dark:bg-zinc-900/60 rounded-2xl border border-gray-100 dark:border-zinc-800">
        <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-100">
          <img
            src={qrImageUrl}
            alt={`QR Code pour ${title}`}
            style={{ width: size, height: size }}
            className="rounded-lg object-contain"
            loading="lazy"
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-2.5 flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-orange-500" />
          <span>{subtitle}</span>
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Copier le lien</span>
            </>
          )}
        </button>

        {showDownloadButton && (
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs shadow-orange-600/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Export...' : 'Télécharger PNG'}</span>
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
