import React from 'react'
import { Globe, ExternalLink } from './Icons'
import { useI18n } from '../lib/i18n'

interface FooterProps {
  onNavigate?: (path: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useI18n()

  return (
    <footer className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] py-14 px-4 sm:px-6 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo Donkai TRÈS GRAND & Marque Oshun Web Studio */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="flex items-center gap-3.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white text-2xl font-heading font-black shadow-lg shadow-orange-600/30 group-hover:scale-105 transition-transform">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-gray-950 dark:text-white tracking-tight text-3xl leading-none group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  DONKAI
                </span>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mt-1">
                  Soutien Participatif & Collecte
                </span>
              </div>
            </button>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-md leading-relaxed">
              Plateforme mobile-first de solidarité et de financement communautaire en Afrique de l'Ouest.
            </p>

            {/* Mention de Propriété Oshun Web Studio avec lien vers le site officiel */}
            <a
              href="https://oshunwebstudio.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-orange-50/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/90 border border-gray-200/70 hover:border-orange-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-[11px] font-semibold text-gray-700 hover:text-orange-600 dark:text-zinc-300 dark:hover:text-orange-400 transition-all duration-200 group shadow-xs"
              title="Visiter le site officiel d'Oshun Web Studio"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Un produit conçu, développé et détenu par{' '}
                <strong className="font-bold underline decoration-gray-300 dark:decoration-zinc-700 group-hover:decoration-orange-500 transition-colors">
                  Oshun Web Studio
                </strong>
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-orange-500 transition-colors shrink-0" />
            </a>
          </div>

          {/* Vrais logos officiels des opérateurs de paiement */}
          <div className="flex flex-col items-center md:items-end gap-2.5">
            <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Opérateurs Mobile Money supportés
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Orange Money */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2 rounded-2xl border border-gray-200/60 dark:border-zinc-800">
                <img src="/icons/orange-money.svg" alt="Orange Money" className="h-5 w-auto object-contain" />
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Orange Money</span>
              </div>

              {/* Wave */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2 rounded-2xl border border-gray-200/60 dark:border-zinc-800">
                <img src="/icons/wave.png" alt="Wave" className="h-5 w-auto object-contain" />
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Wave</span>
              </div>

              {/* Moov Money */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-3.5 py-2 rounded-2xl border border-gray-200/60 dark:border-zinc-800">
                <img src="/icons/moov-money.png" alt="Moov Money" className="h-5 w-auto object-contain" />
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Moov Money</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne inférieure : Droits réservés & Langue (Pas de lien modération public) */}
        <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 dark:text-zinc-500">
          <p>
            © {new Date().getFullYear()} DONKAI • Tous droits réservés •{' '}
            <a
              href="https://oshunwebstudio.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 underline decoration-gray-300 dark:decoration-zinc-700 hover:decoration-orange-500 transition-colors"
            >
              Oshun Web Studio
            </a>
          </p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors uppercase font-bold"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
