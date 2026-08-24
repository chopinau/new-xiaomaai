const FAVORITES_KEY = 'xiaoma_favorites'
const RECENT_KEY = 'xiaoma_recent_tools'
const SUBMITTED_TOOLS_KEY = 'xiaoma_submitted_tools'

export interface FavoriteTool {
  slug: string
  name: string
  addedAt: string
}

export interface RecentTool {
  slug: string
  name: string
  visitedAt: string
}

export interface SubmittedTool {
  name: string
  url: string
  description: string
  category: string
  tags: string
  submittedAt: string
}

export function getFavorites(): FavoriteTool[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch { return [] }
}

export function addFavorite(slug: string, name: string) {
  if (typeof window === 'undefined') return
  const favs = getFavorites().filter(f => f.slug !== slug)
  favs.unshift({ slug, name, addedAt: new Date().toISOString() })
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.slice(0, 50)))
}

export function removeFavorite(slug: string) {
  if (typeof window === 'undefined') return
  const favs = getFavorites().filter(f => f.slug !== slug)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

export function isFavorite(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return getFavorites().some(f => f.slug === slug)
}

export function getRecentTools(): RecentTool[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

export function addRecentTool(slug: string, name: string) {
  if (typeof window === 'undefined') return
  const recent = getRecentTools().filter(r => r.slug !== slug)
  recent.unshift({ slug, name, visitedAt: new Date().toISOString() })
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 12)))
}

export function getSubmittedTools(): SubmittedTool[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SUBMITTED_TOOLS_KEY) || '[]')
  } catch { return [] }
}

export function addSubmittedTool(tool: Omit<SubmittedTool, 'submittedAt'>) {
  if (typeof window === 'undefined') return
  const items = getSubmittedTools()
  items.unshift({ ...tool, submittedAt: new Date().toISOString() })
  localStorage.setItem(SUBMITTED_TOOLS_KEY, JSON.stringify(items.slice(0, 100)))
}

// ---- 工具对比 ----
const COMPARE_KEY = 'xiaoma_compare_tools'
const MAX_COMPARE = 4

export function getCompareList(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]')
  } catch { return [] }
}

export function addToCompare(slug: string): string[] {
  if (typeof window === 'undefined') return []
  const list = getCompareList().filter(s => s !== slug)
  if (list.length >= MAX_COMPARE) return list
  list.push(slug)
  localStorage.setItem(COMPARE_KEY, JSON.stringify(list))
  return list
}

export function removeFromCompare(slug: string): string[] {
  if (typeof window === 'undefined') return []
  const list = getCompareList().filter(s => s !== slug)
  localStorage.setItem(COMPARE_KEY, JSON.stringify(list))
  return list
}

export function clearCompare() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COMPARE_KEY)
}

// ---- 自定义网址 (仿 faxianai.com) ----
const CUSTOM_LINKS_KEY = 'xiaoma_custom_links'

export interface CustomLink {
  id: string
  name: string
  url: string
  emoji: string
  note: string
  createdAt: string
}

export function getCustomLinks(): CustomLink[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_LINKS_KEY) || '[]')
  } catch { return [] }
}

export function addCustomLink(item: Omit<CustomLink, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return
  const list = getCustomLinks()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  list.unshift({ ...item, id, createdAt: new Date().toISOString() })
  localStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(list.slice(0, 100)))
  return id
}

export function removeCustomLink(id: string) {
  if (typeof window === 'undefined') return
  const list = getCustomLinks().filter((l) => l.id !== id)
  localStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(list))
}

export function updateCustomLink(id: string, patch: Partial<Omit<CustomLink, 'id' | 'createdAt'>>) {
  if (typeof window === 'undefined') return
  const list = getCustomLinks().map((l) => (l.id === id ? { ...l, ...patch } : l))
  localStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(list))
}