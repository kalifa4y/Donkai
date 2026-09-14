import React, { useState, useRef } from 'react'
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadFieldProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  helperText?: string
  aspectRatio?: 'banner' | 'square'
  maxDimension?: number
  quality?: number
}

/**
 * ImageUploadField : Composant d'upload d'image client-side sans coût de stockage
 * Compresse automatiquement l'image via HTML5 Canvas (taille < 120 Ko)
 * Supporte également la saisie d'un lien d'image externe direct.
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  aspectRatio = 'banner',
  maxDimension = 1200,
  quality = 0.82,
}) => {
  const [loading, setLoading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Compression automatique côté client via Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).')
      return
    }

    setLoading(true)
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Redimensionnement proportionnel
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setLoading(false)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compression en JPEG optimisé ou WebP
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        onChange(compressedDataUrl)
        setLoading(false)
      }

      img.onerror = () => {
        setLoading(false)
        alert("Impossible de charger l'image sélectionnée.")
      }

      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (customUrl.trim()) {
      onChange(customUrl.trim())
      setShowUrlInput(false)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setCustomUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isSquare = aspectRatio === 'square'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
          {label}
        </label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Importer un fichier' : 'Saisir une URL'}</span>
          </button>
        )}
      </div>

      {value ? (
        // Aperçu de l'image avec bouton de suppression
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 group shadow-xs">
          <div className={isSquare ? 'w-32 h-32 mx-auto sm:mx-0' : 'w-full h-44 sm:h-52'}>
            <img
              src={value}
              alt="Aperçu"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
            title="Supprimer l'image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showUrlInput ? (
        // Saisie d'une URL d'image
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://exemple.com/mon-image.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Appliquer
            </button>
          </div>
        </div>
      ) : (
        // Zone de drag & drop / sélection de fichier
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-500/60 rounded-2xl p-4 text-center cursor-pointer bg-gray-50/50 dark:bg-zinc-900/40 transition-colors flex flex-col items-center justify-center gap-2 ${
            isSquare ? 'w-32 h-32' : 'h-36 sm:h-40'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
              <span className="text-[11px] font-bold">Optimisation...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                {isSquare ? <ImageIcon className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                  {isSquare ? 'Ajouter une photo' : 'Importer une affiche ou photo'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  JPG, PNG ou WebP (max 5 Mo)
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  )
}
