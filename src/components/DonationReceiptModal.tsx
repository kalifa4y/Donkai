import React, { useRef, useState } from 'react'
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Check,
  Copy,
} from './Icons'

export interface DonationReceiptData {
  id: string
  amount: number
  donorName?: string
  donorEmail?: string
  isAnonymous?: boolean
  message?: string
  createdAt: string
  campaignTitle: string
  campaignSlug?: string
  creatorName?: string
  paymentMethod?: string
  transactionRef?: string
}

interface DonationReceiptModalProps {
  receipt: DonationReceiptData | null
  onClose: () => void
}

export const DonationReceiptModal: React.FC<DonationReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const [downloadingImage, setDownloadingImage] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const receiptCardRef = useRef<HTMLDivElement | null>(null)

  if (!receipt) return null

  const dateObj = new Date(receipt.createdAt || Date.now())
  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Référence certifiée unique
  const cleanId = receipt.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
  const receiptNumber = `DONKAI-REC-${dateObj.getFullYear()}-${cleanId || 'M9X8K2'}`

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipt/${receipt.id}`
    : `https://donkai.app/receipt/${receipt.id}`

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    verificationUrl
  )}&margin=10&format=png`

  const formatFcfa = (val: number): string => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyReference = () => {
    navigator.clipboard.writeText(receiptNumber)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  // Export Image PNG via Canvas HD
  const handleDownloadImage = async () => {
    setDownloadingImage(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 900
      canvas.height = 1200

      // Fond blanc officiel
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 900, 1200)

      // Bordure extérieure avec filet orange
      ctx.strokeStyle = '#ea580c'
      ctx.lineWidth = 6
      ctx.strokeRect(30, 30, 840, 1140)

      // Cadre intérieur fin
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 1.5
      ctx.strokeRect(45, 45, 810, 1110)

      // Header DONKAI
      ctx.fillStyle = '#ea580c'
      ctx.font = '900 38px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('DONKAI', 70, 105)

      ctx.fillStyle = '#64748b'
      ctx.font = '600 13px sans-serif'
      ctx.fillText('PLATEFORME DE FINANCEMENT PARTICIPATIF & SOLIDARITÉ', 70, 130)
      ctx.fillText('Éditée & sécurisée par Oshun Web Studio (Bamako, Mali)', 70, 148)

      // Titre document
      ctx.fillStyle = '#0f172a'
      ctx.font = '800 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ATTESTATION OFFICIELLE DE CONTRIBUTION', 450, 220)

      // Référence & Date
      ctx.fillStyle = '#475569'
      ctx.font = '600 15px monospace'
      ctx.fillText(`RÉF : ${receiptNumber}`, 450, 252)
      ctx.font = '500 14px sans-serif'
      ctx.fillText(`Émis le ${formattedDate} à ${formattedTime}`, 450, 276)

      // Ligne séparatrice
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(70, 305)
      ctx.lineTo(830, 305)
      ctx.stroke()

      // Tableau des informations
      const startY = 350
      const rowGap = 55

      // Bénéficiaire
      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748b'
      ctx.font = '600 14px sans-serif'
      ctx.fillText('Projet / Collecte bénéficiaire :', 80, startY)
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 16px sans-serif'
      const titleTruncated = receipt.campaignTitle.length > 42
        ? receipt.campaignTitle.substring(0, 40) + '...'
        : receipt.campaignTitle
      ctx.fillText(titleTruncated, 400, startY)

      // Porteur
      if (receipt.creatorName) {
        ctx.fillStyle = '#64748b'
        ctx.font = '600 14px sans-serif'
        ctx.fillText('Porteur de projet certifié :', 80, startY + rowGap)
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText(receipt.creatorName, 400, startY + rowGap)
      }

      // Donateur
      ctx.fillStyle = '#64748b'
      ctx.font = '600 14px sans-serif'
      ctx.fillText('Donateur enregistré :', 80, startY + rowGap * 2)
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 16px sans-serif'
      const donorLabel = receipt.isAnonymous
        ? 'Contributeur Anonyme'
        : (receipt.donorName || 'Contributeur Bienveillant')
      ctx.fillText(donorLabel, 400, startY + rowGap * 2)

      // Opérateur
      ctx.fillStyle = '#64748b'
      ctx.font = '600 14px sans-serif'
      ctx.fillText('Mode de règlement sécurisé :', 80, startY + rowGap * 3)
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 16px sans-serif'
      const payLabel = receipt.paymentMethod
        ? receipt.paymentMethod.toUpperCase() + ' (Mobile Money)'
        : 'Mobile Money (Orange / Wave / Moov)'
      ctx.fillText(payLabel, 400, startY + rowGap * 3)

      // Frais
      ctx.fillStyle = '#64748b'
      ctx.font = '600 14px sans-serif'
      ctx.fillText('Frais de plateforme appliqués :', 80, startY + rowGap * 4)
      ctx.fillStyle = '#16a34a'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('0 FCFA (100% reversé au projet)', 400, startY + rowGap * 4)

      // Bloc Montant Mis en avant
      ctx.fillStyle = '#fff7ed'
      ctx.fillRect(70, startY + rowGap * 5 - 15, 760, 90)
      ctx.strokeStyle = '#fed7aa'
      ctx.strokeRect(70, startY + rowGap * 5 - 15, 760, 90)

      ctx.fillStyle = '#9a3412'
      ctx.font = 'bold 15px sans-serif'
      ctx.fillText('MONTANT NET DE LA CONTRIBUTION', 100, startY + rowGap * 5 + 25)

      ctx.fillStyle = '#ea580c'
      ctx.font = '900 36px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${formatFcfa(receipt.amount)} FCFA`, 790, startY + rowGap * 5 + 40)

      // Cachet officiel & QR code
      const footerY = 850
      ctx.textAlign = 'left'

      // Bloc Cachet Donkai
      ctx.strokeStyle = '#16a34a'
      ctx.lineWidth = 2
      ctx.strokeRect(80, footerY, 340, 140)

      ctx.fillStyle = '#16a34a'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('CERTIFIÉ CONFORME PAR DONKAI', 100, footerY + 40)
      ctx.fillStyle = '#475569'
      ctx.font = '12px sans-serif'
      ctx.fillText('Transaction validée par passerelle Mobile Money.', 100, footerY + 68)
      ctx.fillText(`Réf Transaction : ${receipt.transactionRef || cleanId}`, 100, footerY + 92)
      ctx.fillText('Signature électronique valide.', 100, footerY + 116)

      // Charger le QR code sur le canvas
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = qrImageUrl
      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 650, footerY - 10, 150, 150)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#64748b'
          ctx.font = '11px sans-serif'
          ctx.fillText('Scanner pour vérifier', 725, footerY + 155)
          resolve(true)
        }
        qrImg.onerror = () => resolve(false)
      })

      // Bas de page
      ctx.textAlign = 'center'
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px sans-serif'
      ctx.fillText(
        'Ce reçu numérique fait foi de contribution solidaire. Donkai est une initiative propulsée par Oshun Web Studio.',
        450,
        1130
      )

      // Téléchargement
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `recu-${receiptNumber}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Erreur export image reçu:', err)
    } finally {
      setDownloadingImage(false)
    }
  }

  const donorDisplayName = receipt.isAnonymous
    ? 'Contributeur anonyme'
    : (receipt.donorName || 'Contributeur solidaire')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Conteneur de la Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1015] rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 my-6 overflow-hidden flex flex-col max-h-[92vh] print:max-w-none print:max-h-none print:shadow-none print:border-none print:my-0 print:rounded-none">
        {/* Barre d'outils supérieure (Masquée à l'impression) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-gray-900 dark:text-white leading-tight">
                Reçu Officiel de Contribution
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                Attestation certifiée Donkai • Format A4 officiel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Imprimer ou enregistrer au format PDF via votre navigateur"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloadingImage}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Télécharger l'attestation en image PNG haute résolution"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Image PNG</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200/80 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps du reçu : Prévisualisation écran & Cible d'impression A4 */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6 print:p-0 print:overflow-visible">
          <div
            id="donation-receipt-print"
            ref={receiptCardRef}
            className="bg-white text-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs relative space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Ligne En-tête : Logo & Identification */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-orange-500">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-heading font-black text-xl">
                    D
                  </div>
                  <span className="font-heading font-black text-2xl tracking-tight text-gray-950">
                    DONKAI
                  </span>
                </div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Financement Participatif Solidaire • Afrique de l'Ouest
                </p>
                <p className="text-[10px] text-gray-400">
                  Développé et certifié par <strong>Oshun Web Studio</strong> (Bamako, Mali)
                </p>
              </div>

              {/* Badge de certification */}
              <div className="sm:text-right flex flex-col sm:items-end">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CONTRIBUTION VÉRIFIÉE</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="font-mono text-xs font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1 group cursor-pointer print:pointer-events-none"
                  title="Cliquer pour copier la référence"
                >
                  <span>{receiptNumber}</span>
                  {copiedRef ? (
                    <Check className="w-3 h-3 text-emerald-600 print:hidden" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400 group-hover:text-orange-500 print:hidden" />
                  )}
                </button>
                <span className="text-[10px] text-gray-400">
                  Émis le {formattedDate} à {formattedTime}
                </span>
              </div>
            </div>

            {/* Titre du document */}
            <div className="text-center py-2">
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-gray-900 uppercase tracking-wide">
                Attestation Officielle de Don
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Reçu justificatif de versement participatif sans contrepartie commerciale
              </p>
            </div>

            {/* Encadré principal des détails */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-gray-200/60 gap-1">
                <span className="text-gray-500 font-medium">Projet bénéficiaire :</span>
                <span className="font-bold text-gray-900 sm:text-right max-w-sm">
                  {receipt.campaignTitle}
                </span>
              </div>

              {receipt.creatorName && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-gray-200/60 gap-1">
                  <span className="text-gray-500 font-medium">Porteur de projet / Créateur :</span>
                  <span className="font-bold text-gray-900 sm:text-right">
                    {receipt.creatorName}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-gray-200/60 gap-1">
                <span className="text-gray-500 font-medium">Donateur :</span>
                <span className="font-bold text-gray-900">
                  {donorDisplayName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-gray-200/60 gap-1">
                <span className="text-gray-500 font-medium">Moyen de règlement :</span>
                <span className="font-bold text-gray-900 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{receipt.paymentMethod || 'Mobile Money'} (Orange / Wave / Moov)</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <span className="text-gray-500 font-medium">Frais de plateforme :</span>
                <span className="font-bold text-emerald-600">
                  0 FCFA (100% de la contribution allouée au projet)
                </span>
              </div>
            </div>

            {/* Bloc Montant Mis en Avant */}
            <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                  Montant Net Versé
                </span>
                <span className="text-xs text-orange-800/80">
                  Transaction irréversible enregistrée avec succès
                </span>
              </div>
              <div className="font-heading font-black text-3xl sm:text-4xl text-orange-600">
                {formatFcfa(receipt.amount)} <span className="text-xl font-bold">FCFA</span>
              </div>
            </div>

            {/* Mot d'encouragement éventuel */}
            {receipt.message && (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs italic text-gray-700">
                <span className="font-bold not-italic text-gray-500 block text-[10px] uppercase mb-1">
                  Message d'accompagnement :
                </span>
                "{receipt.message}"
              </div>
            )}

            {/* Pied du reçu : Cachet & QR Code de Vérification */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Cachet numérique */}
              <div className="border-2 border-dashed border-emerald-600/60 rounded-xl p-3.5 text-left max-w-xs bg-emerald-50/30">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sceau Numérique Donkai</span>
                </div>
                <p className="text-[10px] text-gray-600 leading-tight">
                  Transaction certifiée conforme. Donkai garantit la traçabilité intégrale des fonds versés aux porteurs de projet.
                </p>
                <p className="text-[9px] font-mono text-gray-400 mt-1">
                  ID: {cleanId} • Oshun Trust Protocol
                </p>
              </div>

              {/* QR Code de vérification */}
              <div className="flex items-center gap-3 text-left">
                <img
                  src={qrImageUrl}
                  alt="QR Code de vérification"
                  className="w-20 h-20 rounded-lg border border-gray-200 bg-white p-1"
                />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-gray-800 block">
                    Vérifier l'authenticité
                  </span>
                  <p className="text-[10px] text-gray-500 max-w-[140px] leading-tight">
                    Scannez pour confirmer la validité de ce reçu sur Donkai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de modal avec rappel utile (Masqué à l'impression) */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-zinc-400 print:hidden">
          <p className="text-[11px] text-center sm:text-left">
            Astuce : Utilisez <strong>"Imprimer / PDF"</strong> puis choisissez <em>"Enregistrer au format PDF"</em> pour sauvegarder ce document.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-white font-bold transition-colors cursor-pointer text-center"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
