import React, { useState } from 'react'
import { useI18n } from '../lib/i18n'
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Target,
  Share2,
  CheckCircle2,
  Lock,
} from '../components/Icons'

interface HomePageProps {
  onNavigate: (path: string) => void
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t } = useI18n()

  // Simulateur interactif dans le Hero (montre le produit réel)
  const [demoAmount, setDemoAmount] = useState(250000)
  const demoGoal = 500000
  const demoProgress = Math.min(100, Math.round((demoAmount / demoGoal) * 100))

  return (
    <div className="flex flex-col items-center bg-[#faf9f6] text-gray-900 overflow-hidden">
      {/* 1. HERO SECTION (Atmosphère immersive inspirée de l'élégance architecturale) */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center">
        {/* Badge d'introduction discret */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-bold mb-8">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>{t('hero.badge')}</span>
        </div>

        {/* Grand Titre Display */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-gray-950 tracking-tight max-w-4xl mx-auto leading-[1.08] mb-8">
          {t('hero.title_1')}{' '}
          <span className="text-orange-600">
            {t('hero.title_2')}
          </span>{' '}
          <br className="hidden sm:inline" />
          {t('hero.title_3')}
        </h1>

        {/* Paragraphe d'explication sans jargon */}
        <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {t('hero.subtitle')}
        </p>

        {/* Boutons d'appel à l'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-20">
          <button
            type="button"
            onClick={() => onNavigate('/create')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all text-sm sm:text-base cursor-pointer"
          >
            <span>{t('hero.cta_primary')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-bold py-4 px-8 rounded-2xl shadow-xs hover:bg-gray-50 transition-all text-sm sm:text-base cursor-pointer"
          >
            {t('hero.cta_secondary')}
          </a>
        </div>

        {/* APERÇU INTERACTIF DU PRODUIT DONKAI EN DIRECT */}
        <div className="relative max-w-3xl mx-auto">
          {/* Lueur subtile en arrière-plan */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-400/20 via-amber-300/20 to-orange-500/20 rounded-[32px] blur-xl opacity-70 pointer-events-none" />

          <div className="relative bg-white rounded-3xl border border-orange-100 shadow-xl p-6 sm:p-8 text-left space-y-6">
            {/* Barre d'état de l'aperçu */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-sm">
                  KG
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-gray-950">Projet Eau pour Gao</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('campaign.verified_badge')}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">donkai.app/@kalifa/eau-pour-gao</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/@kalifa/eau-pour-gao')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Voir la collecte démo
                </button>
              </div>
            </div>

            {/* Progression dynamique de la collecte */}
            <div className="space-y-2.5">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                    {demoAmount.toLocaleString()} FCFA
                  </span>
                  <span className="text-xs text-gray-500 ml-1.5 font-medium">
                    sur {demoGoal.toLocaleString()} FCFA
                  </span>
                </div>
                <span className="text-base font-extrabold text-orange-600">
                  {demoProgress}%
                </span>
              </div>

              {/* Jauge de progression */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                <span>124 donateurs</span>
                <span>Paliers atteints : 25%, 50%</span>
                <span>28 jours restants</span>
              </div>
            </div>

            {/* Simulateur tactile pour le visiteur */}
            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 font-medium">
                Simulez une contribution sur cette démo :
              </span>
              <div className="flex items-center gap-2">
                {[1000, 5000, 10000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setDemoAmount((prev) => Math.min(demoGoal, prev + inc))}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold px-3 py-1.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                  >
                    +{inc.toLocaleString()} FCFA
                  </button>
                ))}
                {demoAmount > 250000 && (
                  <button
                    type="button"
                    onClick={() => setDemoAmount(250000)}
                    className="text-gray-400 hover:text-gray-600 text-[11px] underline ml-1 cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE */}
      <section id="how-it-works" className="w-full bg-white py-24 px-4 sm:px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              {t('how.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              {t('how.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Étape 1 */}
            <div className="p-8 rounded-3xl bg-[#faf9f6] border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-extrabold text-lg">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-950">
                {t('how.step1_title')}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('how.step1_desc')}
              </p>
            </div>

            {/* Étape 2 */}
            <div className="p-8 rounded-3xl bg-[#faf9f6] border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-extrabold text-lg">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-950">
                {t('how.step2_title')}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('how.step2_desc')}
              </p>
            </div>

            {/* Étape 3 */}
            <div className="p-8 rounded-3xl bg-[#faf9f6] border border-gray-200/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-950">
                {t('how.step3_title')}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('how.step3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POUR QUI ? */}
      <section className="w-full py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              {t('audience.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
              {t('audience.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <div className="p-8 bg-white rounded-3xl border border-orange-100/70 shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <span>{t('audience.creators')}</span>
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('audience.creators_desc')}
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-orange-100/70 shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>{t('audience.artists')}</span>
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('audience.artists_desc')}
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-orange-100/70 shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{t('audience.associations')}</span>
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('audience.associations_desc')}
              </p>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-orange-100/70 shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>{t('audience.projects')}</span>
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('audience.projects_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOYENS DE PAIEMENT LOCAUX RÉELS */}
      <section className="w-full bg-white py-20 px-4 sm:px-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {t('payment.title')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('payment.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#faf9f6] border border-gray-200/70 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-base">Orange Money</h4>
              <p className="text-xs text-gray-500">Mali, Sénégal, Côte d'Ivoire, Guinée</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf9f6] border border-gray-200/70 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-base">Wave</h4>
              <p className="text-xs text-gray-500">Mali, Sénégal, Côte d'Ivoire</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf9f6] border border-gray-200/70 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-gray-900 text-base">Moov Money</h4>
              <p className="text-xs text-gray-500">Mali, Bénin, Togo, Côte d'Ivoire</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SÉCURITÉ & CONFIANCE (Sans fausse promesse) */}
      <section className="w-full py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              {t('security.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-2xl border border-gray-200/70 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-950 text-sm">Vérification d'identité</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('security.point1')}
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/70 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-950 text-sm">Protection des bénéficiaires</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('security.point2')}
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/70 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-950 text-sm">Verrouillage anti-fraude</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t('security.point3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="w-full bg-gradient-to-b from-[#faf9f6] to-white py-24 px-4 sm:px-6 border-t border-gray-100 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-950 tracking-tight">
            {t('cta_final.title')}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            {t('cta_final.desc')}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/create')}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/25 transition-all text-base cursor-pointer"
            >
              <span>{t('cta_final.button')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
