import React from 'react'
import { ShieldCheck, Smartphone, Heart } from './Icons'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-orange-100/70 bg-white py-12 px-4 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
              D
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Donkai</span>
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            La solution de monétisation et de soutien direct pour les créateurs d'Afrique de l'Ouest.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
            <Smartphone className="w-3.5 h-3.5 text-orange-600" />
            <span>Orange Money</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Wave</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Moov Money</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-700" />
            <span>Paiements sécurisés SasPay</span>
          </div>
        </div>

        <div className="text-center md:text-right text-xs text-gray-400">
          <p className="flex items-center justify-center md:justify-end gap-1">
            <span>Fait pour les créateurs</span>
            <Heart className="w-3 h-3 text-orange-500 fill-orange-500" />
          </p>
          <p className="mt-1">Tous droits réservés</p>
        </div>
      </div>
    </footer>
  )
}
