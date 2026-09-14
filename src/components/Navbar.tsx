import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Wallet, LogOut, Compass, Globe } from './Icons'

interface NavbarProps {
  onNavigate: (path: string) => void
  currentPath?: string
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPath = '/' }) => {
  const { user, signOut } = useAuth()
  const { language, setLanguage, t } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr')
  }

  const isHome = currentPath === '/'
  const isExplore = currentPath === '/explore'

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-7">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="font-heading font-bold text-lg tracking-tighter">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-tight text-gray-950 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                DONKAI
              </span>
            </div>
          </button>

          {/* Onglets principaux : Accueil & Explorer uniquement */}
          <nav className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                isHome
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/40 font-extrabold'
                  : 'hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              {t('nav.home') || 'Accueil'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/explore')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                isExplore
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/40 font-extrabold'
                  : 'hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </button>
          </nav>
        </div>

        {/* Actions de droite */}
        <div className="flex items-center gap-2.5">
          {/* Sélecteur de langue */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
            <span className="uppercase">{language}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>{t('nav.dashboard') || 'Tableau de bord'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  onNavigate('/')
                }}
                title={t('nav.logout') || 'Déconnexion'}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              {t('nav.login') || 'Connexion'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
