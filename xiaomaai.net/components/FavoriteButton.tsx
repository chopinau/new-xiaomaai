'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage'
import { useToast } from '@/components/ui/toast'

interface FavoriteButtonProps {
  slug: string
  name: string
  className?: string
}

export function FavoriteButton({ slug, name, className = '' }: FavoriteButtonProps) {
  const [fav, setFav] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    setFav(isFavorite(slug))
  }, [slug])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const next = !fav
    setFav(next)
    if (next) {
      addFavorite(slug, name)
      toast({ variant: 'success', title: '已收藏', description: `「${name}」已加入收藏` })
    } else {
      removeFavorite(slug)
      toast({ variant: 'default', title: '已取消收藏', description: `「${name}」已从收藏中移除` })
    }
  }, [fav, slug, name, toast])

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-red-50 ${className}`}
        aria-label="收藏"
      >
        <Heart className="h-4 w-4 text-ink-300" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all hover:scale-110 ${fav ? 'text-red-500 hover:bg-red-50' : 'text-ink-300 hover:bg-red-50 hover:text-red-400'} ${className}`}
      aria-label={fav ? '取消收藏' : '收藏'}
      title={fav ? '取消收藏' : '收藏'}
    >
      <Heart className={`h-4 w-4 transition-all ${fav ? 'fill-red-500' : ''}`} />
    </button>
  )
}