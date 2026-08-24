'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Search, Star } from 'lucide-react'
import { getFavorites } from '@/lib/storage'

export type SearchTab = 'search' | 'image' | 'site' | 'deepseek'

interface SearchBarProps {
  defaultTab?: SearchTab
  onSearch?: (q: string, tab: SearchTab) => void
  placeholder?: string
}

interface TabConfig {
  key: SearchTab
  label: string
  placeholder: string
}

const TABS: readonly TabConfig[] = [
  { key: 'search', label: '搜索', placeholder: '百度一下' },
  { key: 'image', label: '图片', placeholder: '搜索 AI 图片工具' },
  { key: 'site', label: '站内', placeholder: '站内搜索' },
  { key: 'deepseek', label: 'DeepSeek 搜索', placeholder: '试试 DeepSeek 搜索' },
] as const

const DEFAULT_FAV_COUNT = '已收藏 0 个'

export function SearchBar({
  defaultTab = 'search',
  onSearch,
  placeholder,
}: SearchBarProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>(defaultTab)
  const [query, setQuery] = useState<string>('')
  const [favLabel, setFavLabel] = useState<string>(DEFAULT_FAV_COUNT)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    try {
      const count = getFavorites().length
      setFavLabel(`已收藏 ${count} 个`)
    } catch {
      setFavLabel(DEFAULT_FAV_COUNT)
    }
  }, [])

  const activeConfig: TabConfig =
    TABS.find((t) => t.key === activeTab) ?? TABS[0]

  const resolvedPlaceholder: string = placeholder ?? activeConfig.placeholder

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSearch?.(query.trim(), activeTab)
  }

  return (
    <div className="relative w-full">
      {/* 右上角收藏数量 */}
      <div className="absolute right-0 top-0 z-10 hidden sm:block">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          <Star className="h-3.5 w-3.5 fill-gray-400 text-gray-400" />
          <span>{mounted ? favLabel : DEFAULT_FAV_COUNT}</span>
        </div>
      </div>

      {/* Tabs 居中 */}
      <div className="flex justify-center pt-2 sm:pt-6">
        <div className="inline-flex items-center gap-6">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-pressed={isActive}
              >
                <span>{tab.label}</span>
                <span
                  className={`absolute -bottom-px left-0 right-0 h-[3px] rounded-sm bg-red-500 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* 搜索条 */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-4 flex w-full max-w-4xl items-center gap-2 px-2 sm:gap-3 sm:px-0"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={resolvedPlaceholder}
            aria-label={activeConfig.label}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600 active:bg-red-700"
        >
          搜索
        </button>
      </form>
    </div>
  )
}

export default SearchBar
