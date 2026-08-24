#!/usr/bin/env node
// =====================================================
// 从 Futurepedia (futurepedia.io) 抓取工具到草稿区
// 用法:
//   node scripts/import-futurepedia.mjs             # 默认抓取 50 条
//   node scripts/import-futurepedia.mjs --limit=30  # 指定抓取数量上限
// 说明:
//   - 从 sitemap.xml 解析工具详情页 URL(限速 3 并发 + 350ms 间隔)
//   - 只提取 og:title / og:image / og:description / og:url 事实性字段(低版权风险)
//   - 不调用 LLM; 英文简介末尾追加 [待翻译] 标记
//   - 自动与 data/tools.ts + data/tools-draft.ts 三重去重(官网域名 + 工具名 + slug)
//   - 结果写入 data/tools-draft.ts 的 source='futurepedia' 条目,后台审核入库
// =====================================================
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const HOME = 'https://www.futurepedia.io/'
const SITEMAP_URL = 'https://www.futurepedia.io/sitemap.xml'
const SOURCE = 'futurepedia'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const args = process.argv.slice(2)
const limitArg = args.find((a) => a.startsWith('--limit='))
const MAX = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50
const DELAY = 350          // 礼貌限速 ms
const CONCURRENCY = 3      // 并发数

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en,zh-CN;q=0.9' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}

// 无 CJK 即视为英文(用于追加 [待翻译] 标记)
function isMostlyEnglish(s) {
  return !/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(s || '')
}

// 简单分类推断(基于名称 + 简介关键词)
function inferCategory(name, desc) {
  const t = `${name} ${desc}`.toLowerCase()
  const has = (kws) => kws.some((k) => t.includes(k))
  if (has(['code', 'coding', 'programming', 'developer', 'ide', 'editor', 'git', 'api', 'backend', 'frontend', '编程', '代码', '开发'])) return 'code'
  if (has(['video', 'digital human', 'avatar', 'clip', 'movie', 'animation', '视频', '数字人', '剪辑'])) return 'video'
  if (has(['image', 'picture', 'draw', 'paint', 'art', 'photo', 'illustration', 'design', 'logo', 'poster', '图像', '绘图', '设计'])) return 'image'
  if (has(['audio', 'music', 'voice', 'speech', 'tts', 'asr', 'podcast', 'song', '音频', '音乐', '语音'])) return 'audio'
  if (has(['chat', 'gpt', 'llm', 'assistant', 'bot', 'agent', 'conversation', '对话', '聊天', '助手', '大模型', '智能体'])) return 'chat'
  return 'productivity'
}

function inferPricing(desc) {
  const d = (desc || '').toLowerCase()
  if (d.includes('paid') || d.includes('subscription') || d.includes('premium') || d.includes('付费') || d.includes('订阅')) return 'paid'
  if (d.includes('free') && !d.includes('free trial')) return 'free'
  return 'freemium'
}

function slugify(name) {
  let s = (name || '').toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')
  if (!s) s = 'tool-' + Date.now().toString(36)
  return s
}

// sitemap URL 过滤: 保留工具详情页,排除榜单/分类/分页等噪声
const NOISE_RE = /\/(category|categories|tag|tags|page|blog|news|topic|topics|author|search|feed|rss|collection|collections|c)\//i
// futurepedia 工具详情页路径形如 /tool/<slug>
const TOOL_RE = /\/tool\/[^/?#]/i
function isToolUrl(u) {
  if (!u.startsWith('http')) return false
  if (NOISE_RE.test(u)) return false
  return TOOL_RE.test(u)
}

// 从 sitemap.xml 解析工具详情页 URL 列表
// 同时兼容 sitemap index(嵌套 <sitemap><loc>) 与 urlset(<url><loc>)
async function fetchSitemapToolUrls() {
  const xml = await fetchText(SITEMAP_URL)
  const $ = cheerio.load(xml, { xml: true })
  const pageUrls = []
  const subSitemaps = []
  $('sitemap').each((i, el) => {
    const loc = $(el).find('loc').text().trim()
    if (loc) subSitemaps.push(loc)
  })
  $('url loc').each((i, el) => {
    const t = $(el).text().trim()
    if (t) pageUrls.push(t)
  })
  // sitemap index: 抓取前 5 个子 sitemap(避免过度请求)
  if (subSitemaps.length > 0 && pageUrls.length === 0) {
    console.log(`    sitemap index: 共 ${subSitemaps.length} 个子 sitemap,抓取前 5 个`)
    for (const s of subSitemaps.slice(0, 5)) {
      try {
        const sx = await fetchText(s)
        const $s = cheerio.load(sx, { xml: true })
        $s('url loc').each((i, el) => {
          const t = $s(el).text().trim()
          if (t) pageUrls.push(t)
        })
      } catch (e) {
        console.log(`    子 sitemap ${s} 抓取失败: ${e.message}`)
      }
      await sleep(DELAY)
    }
  }
  // 过滤 + 去重
  const seen = new Set()
  const toolUrls = []
  for (const u of pageUrls) {
    if (!isToolUrl(u)) continue
    if (seen.has(u)) continue
    seen.add(u)
    toolUrls.push(u)
  }
  return toolUrls
}

// 在页面中寻找工具官网链接(og:url 多指向导航站自身,需从正文外链提取真实官网)
const SOCIAL_RE = /facebook\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|instagram\.com|tiktok\.com|pinterest\.com|github\.com|medium\.com|reddit\.com|discord\.|t\.me|wechat|weibo|qq\.com|bilibili\.com|schema\.org|w3\.org|google\.com\/search|bing\.com\/search|apple\.com/i
function findOfficialLink($, homeHost) {
  let best = ''
  const visitRe = /visit|try|go|website|official|打开|访问|前往|官网|立即|体验|进入/i
  $('a[href]').each((i, el) => {
    if (best) return
    const h = $(el).attr('href') || ''
    if (!h.startsWith('http')) return
    if (hostOf(h) === homeHost || SOCIAL_RE.test(h)) return
    const meta = `${$(el).attr('class') || ''} ${$(el).attr('rel') || ''} ${$(el).attr('title') || ''} ${$(el).text()}`
    if (visitRe.test(meta)) best = h
  })
  if (!best) {
    $('a[href]').each((i, el) => {
      if (best) return
      const h = $(el).attr('href') || ''
      if (!h.startsWith('http')) return
      if (hostOf(h) === homeHost || SOCIAL_RE.test(h)) return
      best = h
    })
  }
  return best
}

async function extractTool(pageUrl) {
  const html = await fetchText(pageUrl)
  const $ = cheerio.load(html)
  const name = ($('meta[property="og:title"]').attr('content') || $('title').first().text() || '').replace(/\s+/g, ' ').trim()
  if (!name) return null
  let desc = ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').replace(/\s+/g, ' ').trim()
  const logo = $('meta[property="og:image"]').attr('content') || ''
  const ogUrl = $('meta[property="og:url"]').attr('content') || $('link[rel="canonical"]').attr('href') || ''
  let official = findOfficialLink($, hostOf(HOME))
  if (!official) official = ogUrl
  // 英文简介末尾追加 [待翻译] 标记
  if (desc && isMostlyEnglish(desc) && !desc.includes('[待翻译]')) desc += ' [待翻译]'
  return { name, desc: desc || name, logo, official, sourceUrl: pageUrl }
}

// 简单 Promise 池: concurrency 并发,每个任务后 sleep(DELAY)
async function pool(items, concurrency, worker) {
  let i = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      try {
        await worker(items[idx], idx)
      } catch (e) { /* 单条失败不影响整体 */ }
      await sleep(DELAY)
    }
  })
  await Promise.all(runners)
}

async function main() {
  console.log(`[1/3] 解析 ${SOURCE} sitemap…`)
  let sitemapUrls = []
  try {
    sitemapUrls = await fetchSitemapToolUrls()
  } catch (e) {
    console.warn(`⚠️ sitemap 不可用,跳过 (${e.message})`)
    process.exit(0)
  }
  if (sitemapUrls.length === 0) {
    console.warn('⚠️ sitemap 不可用,跳过 (未发现工具详情页 URL)')
    process.exit(0)
  }
  console.log(`    sitemap 共发现 ${sitemapUrls.length} 个工具详情页(将抓取前 ${Math.min(sitemapUrls.length, MAX)} 个)`)

  console.log('[2/3] 读取现有库用于去重…')
  const toolsRaw = readFileSync(path.join(DATA_DIR, 'tools.ts'), 'utf-8')
  const draftRaw = readFileSync(path.join(DATA_DIR, 'tools-draft.ts'), 'utf-8')
  const existingHosts = new Set()
  for (const m of toolsRaw.matchAll(/url:\s*'([^']+)'/g)) existingHosts.add(hostOf(m[1]))
  const draftSlugs = new Set()
  for (const m of draftRaw.matchAll(/slug:\s*"([^"]+)"/g)) draftSlugs.add(m[1])
  const draftNames = new Set()
  for (const m of draftRaw.matchAll(/"name":\s*"([^"]+)"/g)) draftNames.add(m[1])
  console.log(`    已有工具官网域名 ${existingHosts.size} 个,草稿 ${draftSlugs.size} 条`)

  console.log('[3/3] 抓取详情并去重…')
  const picked = sitemapUrls.slice(0, MAX)
  const newDrafts = []
  const usedSlugs = new Set(draftSlugs)
  let dedupCount = 0
  await pool(picked, CONCURRENCY, async (u, idx) => {
    try {
      const t = await extractTool(u)
      if (!t || !t.name) return
      if (!t.official) { dedupCount++; return }
      if (existingHosts.has(hostOf(t.official))) { dedupCount++; return }
      if (draftNames.has(t.name) || usedSlugs.has(slugify(t.name))) { dedupCount++; return }
      const slug = slugify(t.name)
      usedSlugs.add(slug)
      const now = new Date().toISOString()
      const category = inferCategory(t.name, t.desc)
      newDrafts.push({
        source: SOURCE,
        sourceUrl: u,
        fetchedAt: now,
        tool: {
          slug,
          name: t.name,
          description: t.desc,
          url: t.official,
          logoUrl: t.logo || undefined,
          category,
          tags: ['AI'],
          pricing: inferPricing(t.desc),
          rating: 0,
          views: 0,
          createdAt: now,
          updatedAt: now,
        },
      })
      console.log(`  [${idx + 1}/${picked.length}] ✓ ${t.name} -> ${category}`)
    } catch (e) {
      console.log(`  [${idx + 1}/${picked.length}] ✗ ${u} (${e.message})`)
    }
  })

  console.log(`\n抓取 ${picked.length} 条 / 去重 ${dedupCount} 条 / 新增 ${newDrafts.length} 条`)

  if (newDrafts.length === 0) {
    console.log('无新增,退出。')
    return
  }

  // 写入 data/tools-draft.ts (在数组结尾前插入; 首条前补逗号以衔接原末条)
  const insert = ',' + newDrafts.map((d) => '  ' + JSON.stringify(d)).join(',\n')
  const closeIdx = draftRaw.lastIndexOf(']')
  const newContent = draftRaw.slice(0, closeIdx) + insert + '\n' + draftRaw.slice(closeIdx)
  writeFileSync(path.join(DATA_DIR, 'tools-draft.ts'), newContent, 'utf-8')
  console.log(`已写入 data/tools-draft.ts,请在 /admin/tools 审核入库。`)
}

main().catch((e) => { console.error(e); process.exit(1) })
