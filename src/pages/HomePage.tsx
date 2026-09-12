import React from 'react'
import { Smartphone, Sparkles, TrendingUp, ArrowRight, ShieldCheck, Heart } from '../components/Icons'

interface HomePageProps {
  onNavigate: (path: string) => void
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200/60 text-orange-800 text-xs font-bold mb-8">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Mobile Money natif en Afrique de l'Ouest</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-950 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none mb-6">
          Recevez le soutien de votre communauté,{' '}
          <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            sans friction
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Donkai permet aux créateurs de contenu de recevoir des dons par{' '}
          <strong className="text-gray-900 font-semibold">Orange Money</strong>,{' '}
          <strong className="text-gray-900 font-semibold">Wave</strong> et{' '}
          <strong className="text-gray-900 font-semibold">Moov Money</strong>. Sans carte bancaire, sans compte PayPal étranger.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all text-base"
          >
            <span>Créer ma page gratuite</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-semibold py-4 px-8 rounded-2xl shadow-sm hover:bg-gray-50 transition-all text-base"
          >
            Espace créateur
          </button>
        </div>

        {/* Product Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="bg-white p-7 rounded-3xl border border-orange-100 shadow-sm">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-5">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">100% Mobile Money</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Vos abonnés paient en 30 secondes avec leur solde Orange Money, Wave ou Moov depuis leur smartphone.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-orange-100 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">95% pour le créateur</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Seulement 5% de commission plateforme tout inclus. Aucun abonnement mensuel, aucun frais caché.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-orange-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Retraits simples</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Demandez le versement de vos fonds directement sur votre numéro Mobile Money dès 5 000 XOF de gains.
            </p>
          </div>
        </div>
      </section>

      {/* Social / Trust Section */}
      <section className="w-full bg-gradient-to-b from-orange-50/50 to-white py-16 px-4 border-t border-orange-100/60 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4">
            <Heart className="w-6 h-6 fill-orange-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 mb-3">
            Un lien unique dans votre bio
          </h2>
          <p className="text-gray-600 text-base mb-6">
            Partagez simplement votre lien personnalisé sur TikTok, YouTube, WhatsApp ou Instagram.
          </p>
          <div className="inline-block bg-white border border-orange-200 px-6 py-3 rounded-2xl shadow-sm text-orange-600 font-mono font-bold text-sm">
            donkai.app/@votre_pseudo
          </div>
        </div>
      </section>
    </div>
  )
}
