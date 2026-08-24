'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Clock } from 'lucide-react'
import { getFavorites, getRecentTools, type FavoriteTool, type RecentTool } from '@/lib/storage'
import type { Tool } from '@/data/tools'
import { ToolCard } from '@/components/ModelCard'

interface FavoritesRecentProps {
  allTools: Tool[]
}

export function FavoritesRecent({ allTools }: FavoritesRecentProps) {
  const [mounted, setMounted] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteTool[]>([])
  const [recentTools, setRecentTools] = useState<RecentTool[]>([])
  const favsLenRef = useRef(0)
  const recsLenRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    const favs = getFavorites()
    const recs = getRecentTools()
    setFavorites(favs)
    setRecentTools(recs)
    favsLenRef.current = favs.length
    recsLenRef.current = recs.length

    const handleStorageChange = () => {
      const newFavs = getFavorites()
      const newRecs = getRecentTools()
      setFavorites(newFavs)
      setRecentTools(newRecs)
      favsLenRef.current = newFavs.length
      recsLenRef.current = newRecs.length
    }

    window.addEventListener('storage', handleStorageChange)

    const interval = setInterval(() => {
      const newFavs = getFavorites()
      const newRecs = getRecentTools()
      if (newFavs.length !== favsLenRef.current || newRecs.length !== recsLenRef.current) {
        favsLenRef.current = newFavs.length
        recsLenRef.current = newRecs.length
        setFavorites(newFavs)
        setRecentTools(newRecs)
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // 根据 slug 匹配完整工具数据
  const favoriteTools = favorites
    .map(f => allTools.find(t => t.slug === f.slug))
    .filter((t): t is Tool => t !== undefined)

  const recentToolData = recentTools
    .map(r => allTools.find(t => t.slug === r.slug))
    .filter((t): t is Tool => t !== undefined)

  if (!mounted) return null
  if (favoriteTools.length === 0 && recentToolData.length === 0) return null

  return (
    <div className="space-y-5">
      {/* 我的收藏 */}
      {favoriteTools.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            <h2 className="text-lg font-bold text-ink-900">我的收藏</h2>
            <span className="text-xs text-ink-400">({favoriteTools.length})</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {favoriteTools.map((tool, i) => (
              <div key={tool.slug} className="w-[260px] shrink-0">
                <ToolCard tool={tool} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 最近浏览 */}
      {recentToolData.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-ink-900">最近浏览</h2>
            <span className="text-xs text-ink-400">({recentToolData.length})</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentToolData.map((tool, i) => (
              <div key={tool.slug} className="w-[260px] shrink-0">
                <ToolCard tool={tool} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}