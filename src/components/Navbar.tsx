import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Wallet, LogOut, User, ArrowRight } from './Icons'

interface NavbarProps {
  onNavigate: (path: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, creator, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-lg tracking-tighter">D</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-950 group-hover:text-orange-600 transition-colors">
            Donkai
          </span>
        </button>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {creator ? (
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50/60 rounded-xl transition-all"
                >
                  <Wallet className="w-4 h-4 text-orange-500" />
                  <span>Tableau de bord</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('/onboarding')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Finaliser mon profil</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  onNavigate('/')
                }}
                title="Se déconnecter"
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-950 transition-colors"
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
              >
                <span>Créer ma page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
