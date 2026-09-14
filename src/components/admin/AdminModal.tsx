import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop flouté */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Conteneur Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-left`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-heading">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
