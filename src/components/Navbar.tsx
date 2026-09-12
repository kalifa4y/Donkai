import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Wallet, LogOut, ArrowRight, Plus, Globe } from './Icons'

interface NavbarProps {
  onNavigate: (path: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth()
  const { language, setLanguage, t } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tighter">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-gray-950 group-hover:text-orange-600 transition-colors">
                DONKAI
              </span>
            </div>
          </button>

          {/* Navigation links desktop */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-950 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {t('nav.home')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/create')}
              className="px-3 py-1.5 rounded-lg hover:text-gray-950 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {t('nav.create')}
            </button>
          </nav>
        </div>

        {/* Actions de droite */}
        <div className="flex items-center gap-2.5">
          {/* Sélecteur de langue visible et volontaire */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span className="uppercase">{language}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/create')}
                className="hidden sm:inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle collecte</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-orange-600" />
                <span>{t('nav.dashboard')}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  onNavigate('/')
                }}
                title={t('nav.logout')}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
              >
                {t('nav.login')}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/create')}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>{t('nav.create')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
