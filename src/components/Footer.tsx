import React from 'react'
import { Smartphone, ShieldCheck, Globe } from './Icons'
import { useI18n } from '../lib/i18n'

interface FooterProps {
  onNavigate?: (path: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useI18n()

  return (
    <footer className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] py-12 px-4 sm:px-6 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white text-xs font-heading font-bold">
                D
              </div>
              <span className="font-heading font-bold text-gray-950 dark:text-white tracking-tight text-base">DONKAI</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Créer, partager, recevoir le soutien de votre communauté. Conçu pour le Mali et l'Afrique de l'Ouest.
            </p>
          </div>

          {/* Opérateurs réels */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-zinc-800">
              <Smartphone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Orange Money</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-zinc-800">
              <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Wave</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-zinc-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Moov Money</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-700 dark:text-zinc-400" />
              <span>Contrôles de sécurité</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} DONKAI. Tous droits réservés.</p>

          <div className="flex items-center gap-4">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
              >
                Espace modération
              </button>
            )}
            <button
              type="button"
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors uppercase font-bold"
            >
              <Globe className="w-3 h-3" />
              <span>{language}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
