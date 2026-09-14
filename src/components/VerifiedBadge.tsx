import React from 'react'
import { Check } from './Icons'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

/**
 * Badge Vérifié Officiel Donkai
 * 100% Gratuit & Mérité (attribué après validation des pièces d'identité CNI/Passeport/NINA par l'équipe).
 * Style certifié bleu officiel (#0284c7 / sky-500) avec coche blanche.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  showText = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Compte certifié Donkai • Identité contrôlée par l'équipe (100% mérité, zéro frais)"
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-sky-500 text-white shadow-xs shrink-0 ring-2 ring-white dark:ring-[#12141f] ${sizeClasses[size]}`}
      >
        <Check className={`${iconSizes[size]} stroke-[3.5]`} />
      </span>
      {showText && (
        <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">
          Vérifié officiel
        </span>
      )}
    </div>
  )
}
