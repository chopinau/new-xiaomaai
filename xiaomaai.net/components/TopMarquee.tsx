'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { announcements } from '@/data/announcements'

const TYPE_ICONS: Record<string, string> = {
  news: '📢',
  tool: '🛠️',
  event: '⚡',
}

export function TopMarquee() {
  const [current, setCurrent] = useState(0)
  const total = announcements.length

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total)
  }, [total])

  useEffect(() => {
    const timer = setInterval(goNext, 4000)
    return () => clearInterval(timer)
  }, [goNext])

  const item = announcements[current]

  return (
    <div className="w-full bg-gradient-brand py-2 text-center text-xs text-white shadow-[0_1px_8px_rgba(124,58,237,0.25)]">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <button
          onClick={goPrev}
          className="shrink-0 rounded-full p-1 text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-90"
          aria-label="上一条"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <span className="shrink-0 text-sm">{TYPE_ICONS[item.type] || '📢'}</span>

        {item.link ? (
          <Link
            href={item.link}
            className="truncate font-medium text-white/95 transition-colors hover:text-white hover:underline decoration-white/50 underline-offset-2"
          >
            {item.text}
          </Link>
        ) : (
          <span className="truncate font-medium text-white/95">{item.text}</span>
        )}

        <button
          onClick={goNext}
          className="shrink-0 rounded-full p-1 text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-90"
          aria-label="下一条"
        >
          <ChevronRight className="size-3.5" />
        </button>

        {/* 指示器 */}
        <div className="hidden sm:flex items-center gap-1">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? 'h-1.5 w-4 bg-white' : 'h-1.5 w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`第 ${i + 1} 条`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}