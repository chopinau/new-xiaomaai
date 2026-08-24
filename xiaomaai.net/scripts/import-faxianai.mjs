#!/usr/bin/env node
// =====================================================
// 从发现AI (faxianai.com) 抓取"精选子集"工具到草稿区
// 用法:
//   node scripts/import-faxianai.mjs            # 抓首页精选(约50-70条)
//   node scripts/import-faxianai.mjs --limit 40 # 指定抓取数量上限
// 说明:
//   - 只提取"名称/官网链接/简介/logo"等事实性信息(低版权风险)
//   - 自动与 data/tools.ts 去重(按官网域名)并避免与草稿区重复
//   - 结果写入 data/tools-draft.ts 的 source='faxianai' 条目,后台审核入库
// =====================================================
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const HOME = 'https://www.faxianai.com/'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const args = process.argv.slice(2)
const limitArg = args.find((a) => a.startsWith('--limit='))
const MAX = limitArg ? parseInt(limitArg.split('=')[1], 10) : 80
const REFRESH = args.includes('--refresh') // 刷新已有 faxianai 草稿简介
const DELAY = 350 // 礼貌限速 ms

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'zh-CN,zh;q=0.9' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

// 分类推断(基于名称+简介关键词)
function inferCategory(name, desc) {
  const t = `${name} ${desc}`.toLowerCase()
  const has = (kws) => kws.some((k) => t.includes(k))
  if (has(['编程', '代码', '开发', '程序员', 'ide', '编辑器', 'code', 'dev', 'git', 'api 开发', '前端', '后端'])) return 'code'
  if (has(['视频', '视频生成', '数字人', '剪辑', '影视', '短片', '直播', 'video', '动画片'])) return 'video'
  if (has(['图像', '图片', '绘图', '生图', '作画', '摄影', '插画', '设计', '照片', 'logo', '海报', '素材', 'image', '修图'])) return 'image'
  if (has(['音频', '音乐', '配音', '语音', '声音', '播客', '唱歌', '歌曲', 'audio', 'tts', 'asr', '声乐', '音效'])) return 'audio'
  if (has(['对话', '聊天', '问答', '助理', '助手', 'gpt', '大模型', '模型', '机器人', 'chat', 'llm', 'agent', '智能体', 'deepseek', 'claude'])) return 'chat'
  return 'productivity'
}

function inferPricing(desc) {
  const d = (desc || '').toLowerCase()
  if (d.includes('付费') || d.includes('会员') || d.includes('订阅') || d.includes('收费')) return 'paid'
  if (d.includes('免费') && !d.includes('限时免费')) return 'free'
  return 'freemium'
}

// faxianai 工具页专题标签 → 我们的 {标签, 分类}
const TOPIC_MAP = {
  'AI助理': { tag: 'AI助理', category: 'chat' },
  '对话': { tag: 'AI对话', category: 'chat' },
  '聊天': { tag: '聊天', category: 'chat' },
  '聊天机器人': { tag: '聊天机器人', category: 'chat' },
  '智能体': { tag: '智能体', category: 'productivity' },
  '超级智能体': { tag: '智能体', category: 'productivity' },
  '代码': { tag: 'AI编程', category: 'code' },
  '开发': { tag: 'AI编程', category: 'code' },
  '开源': { tag: '开源', category: 'code' },
  '办公': { tag: 'AI办公', category: 'productivity' },
  '图像AI': { tag: 'AI图像', category: 'image' },
  '图片': { tag: 'AI图像', category: 'image' },
  '绘图': { tag: 'AI图像', category: 'image' },
  '设计': { tag: '设计', category: 'image' },
  '电商必备': { tag: '电商', category: 'image' },
  '电商': { tag: '电商', category: 'image' },
  '视频': { tag: 'AI视频', category: 'video' },
  '数字人': { tag: '数字人', category: 'video' },
  '音频': { tag: 'AI音频', category: 'audio' },
  '音乐': { tag: '音乐', category: 'audio' },
  '写作': { tag: '写作', category: 'productivity' },
  '文案': { tag: '写作', category: 'productivity' },
  '翻译': { tag: '翻译', category: 'productivity' },
  '教育': { tag: '教育', category: 'productivity' },
  '学习': { tag: '教育', category: 'productivity' },
  '营销': { tag: '营销', category: 'productivity' },
  '客服': { tag: '客服', category: 'chat' },
  '搜索': { tag: '搜索', category: 'productivity' },
  '3D': { tag: '3D', category: 'image' },
  '提示词': { tag: '提示词', category: 'productivity' },
  '模型': { tag: 'AI模型', category: 'chat' },
  '大模型': { tag: 'AI模型', category: 'chat' },
  '多模态': { tag: '多模态', category: 'productivity' },
  'API': { tag: 'API', category: 'code' },
}

// 提取工具页上的专题标签(过滤榜单/编辑栏目等噪声)
function extractTopics($) {
  const set = new Set()
  $('a[href*="/news/topic/"]').each((i, el) => {
    const label = $(el).text().trim()
    if (!label) return
    if (/TOP10|榜单|热门|大厂|新上|新出|精选|排行/i.test(label)) return
    set.add(label)
  })
  return Array.from(set)
}

// 从 meta 简介取副标题/分类标签(第1段常为工具名,第2段为分类,如 "AI电商工具")
function metaCategoryLabel(desc) {
  const segs = (desc || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  return segs[1] || ''
}

// 分类: 优先用页面副标题(分类标签)映射,无则回退关键词推断
function mapCategory(label, name, desc) {
  const t = `${label || ''} ${name} ${desc || ''}`.toLowerCase()
  const has = (kws) => kws.some((k) => t.includes(k))
  if (has(['电商', '图像', '图片', '绘图', '生图', '绘画', '摄影', '插画', '海报', '素材', '修图', '3d'])) return 'image'
  if (has(['视频', '数字人', '剪辑', '影视', '短片', '直播', '动画'])) return 'video'
  if (has(['编程', '代码', '开发', '编辑器', 'api', '前端', '后端', '开发者'])) return 'code'
  if (has(['音频', '音乐', '配音', '语音', '声音', '播客', '歌曲'])) return 'audio'
  if (has(['对话', '聊天', '助手', '助理', '问答', '大模型', '机器人', '智能体'])) return 'chat'
  return inferCategory(name, desc)
}

// 专题标签 → 分类 + 标签列表
// 分类取自页面副标题; 标签只保留与主分类一致的专题(过滤噪声), 最多 4 个
function topicsToInfo(topics, label, name, desc) {
  const category = mapCategory(label, name, desc)
  const tags = []
  const seen = new Set()
  for (const t of topics) {
    const m = TOPIC_MAP[t]
    if (!m || !m.tag) continue
    if (m.category && m.category !== category) continue // 只保留与主分类一致的标签
    if (!seen.has(m.tag)) { seen.add(m.tag); tags.push(m.tag) }
  }
  // 兜底: 无分类一致标签时,退而取任一已映射专题
  if (tags.length === 0) {
    for (const t of topics) {
      const m = TOPIC_MAP[t]
      if (m && m.tag && !seen.has(m.tag)) { seen.add(m.tag); tags.push(m.tag) }
    }
  }
  return { category, tags: tags.slice(0, 4) }
}

function slugify(name) {
  let s = name.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')
  if (!s) s = 'tool-' + Date.now().toString(36)
  return s
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}

// 完整简介: 去掉"名称,"前缀并压缩空白; 不截断句子,保留完整介绍(兜底 500 字符)
function cleanDesc(name, desc) {
  let d = (desc || '').replace(/\s+/g, ' ').trim()
  const prefix = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  d = d.replace(new RegExp('^\\s*' + prefix + '[,，:]?\\s*'), '')
  return d.slice(0, 500) || name
}

// 从工具页正文组装简介(meta 简介缺失/过短时的兜底)
function extractBodyDesc($) {
  const article = $('article').first()
  const container = article.length ? article : $('.panel, .article-content').first()
  if (!container.length) return ''
  const parts = []
  container.find('h2, h3, p, li').each((i, el) => {
    const txt = $(el).text().replace(/\s+/g, ' ').trim()
    if (txt && txt.length > 1 && !txt.includes('相关导航')) parts.push(txt)
  })
  const seen = new Set()
  return parts.filter((p) => (seen.has(p) ? false : (seen.add(p), true))).join(' ').slice(0, 500)
}

// 抓官方站点的 meta/og 简介(来源页内容过短时的兜底)
async function fetchOfficialDesc(url) {
  try {
    const html = await fetchHtml(url)
    const $ = cheerio.load(html)
    let d = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
    return d.replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

// 完整简介: 来源简介 >=20 字直接用; 过短则回退到官网简介
async function enrichDesc(name, faxDesc, official) {
  const d = cleanDesc(name, faxDesc)
  if (d.length >= 20) return d
  if (!official) return d || name
  const od = await fetchOfficialDesc(official)
  return cleanDesc(name, od) || d || name
}

async function extractTool(faxUrl) {
  const html = await fetchHtml(faxUrl)
  const $ = cheerio.load(html)
  const name = $('h1').first().text().trim()
  if (!name) return null
  let desc = $('meta[name="description"]').attr('content') || ''
  if (desc.replace(/\s+/g, ' ').trim().length < 20) desc = extractBodyDesc($) // meta 缺失/过短时用正文组装
  const logo = $('meta[property="og:image"]').attr('content') || ''
  // 官网链接: 优先"打开网站"按钮,其次"立即体验"主题按钮
  let official = ''
  $('a.btn.preview-btn').each((i, el) => {
    const h = $(el).attr('href')
    if (!official && h && h.startsWith('http')) official = h
  })
  if (!official) {
    $('a[rel="nofollow"]').each((i, el) => {
      const h = $(el).attr('href')
      const cls = $(el).attr('class') || ''
      if (!official && h && h.startsWith('http') && cls.includes('vc-l-theme')) official = h
    })
  }
  if (!official) {
    // 兜底: 正文中第一个外部链接
    $('article a[href], .panel a[href]').each((i, el) => {
      const h = $(el).attr('href')
      if (!official && h && h.startsWith('http') && !h.includes('faxianai.com')) official = h
    })
  }
  return { name, desc, logo, official, faxUrl, topics: extractTopics($), label: metaCategoryLabel(desc) }
}

// 解析 data/tools-draft.ts 中的数组(与后台 publish 路由同逻辑)
function readDrafts() {
  const raw = readFileSync(path.join(DATA_DIR, 'tools-draft.ts'), 'utf-8')
  const marker = 'export const toolDrafts: ToolDraft[] = ['
  const start = raw.indexOf(marker)
  const arrStart = start + marker.length
  let depth = 1
  let inStr = false
  let end = -1
  for (let i = arrStart; i < raw.length; i++) {
    const c = raw[i]
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; continue }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) return []
  return JSON.parse(raw.slice(arrStart - 1, end + 1))
}

// 重新抓取已有 faxianai 草稿,补齐完整简介(不新增、不改动 url/slug/category)
async function runRefresh() {
  console.log('[refresh] 解析现有草稿…')
  const drafts = readDrafts()
  const fax = drafts.filter((d) => d.source === 'faxianai')
  console.log(`[refresh] 共 ${fax.length} 条 faxianai 草稿待刷新`)
  let updated = 0
  for (let i = 0; i < fax.length; i++) {
    const d = fax[i]
    try {
      const t = await extractTool(d.sourceUrl)
      if (t && t.name) {
        const newDesc = await enrichDesc(d.tool.name, t.desc, d.tool.url)
        const { category, tags } = topicsToInfo(t.topics, t.label, d.tool.name, t.desc)
        let changed = false
        if (newDesc && newDesc !== d.tool.description) { d.tool.description = newDesc; changed = true }
        if (category && category !== d.tool.category) { d.tool.category = category; changed = true }
        if (tags.length && JSON.stringify(tags) !== JSON.stringify(d.tool.tags || [])) { d.tool.tags = tags; changed = true }
        const pr = inferPricing(t.desc)
        if (pr && pr !== d.tool.pricing) { d.tool.pricing = pr; changed = true }
        if (t.logo && t.logo !== d.tool.logoUrl) { d.tool.logoUrl = t.logo; changed = true }
        if (changed) {
          d.tool.updatedAt = new Date().toISOString()
          updated++
          console.log(`  [${i + 1}/${fax.length}] ✓ ${d.tool.name} | ${d.tool.category} | 简介${String(d.tool.description.length)}字 | ${(d.tool.tags || []).join(',') || '无标签'}`)
        } else {
          console.log(`  [${i + 1}/${fax.length}] - ${d.tool.name} 无变化`)
        }
      } else {
        console.log(`  [${i + 1}/${fax.length}] ✗ ${d.sourceUrl} 抓取失败`)
      }
    } catch (e) {
      console.log(`  [${i + 1}/${fax.length}] ✗ ${d.sourceUrl} (${e.message})`)
    }
    await sleep(DELAY)
  }
  if (updated > 0) {
    writeDrafts(drafts)
    console.log(`\n已刷新 ${updated} 条(简介/标签/分类),写入 data/tools-draft.ts`)
  } else {
    console.log('无更新。')
  }
}

// 按后台 publish 路由的格式整文件重写草稿区
function writeDrafts(drafts) {
  const output = `// 草稿区: GitHub Actions 抓取热门 AI 工具后写入,人工在 /admin/tools 审核入库
// 本文件会被 scripts/fetch-trending.mjs 定时覆盖,请勿手工编辑数据

import type { Tool } from './tools'

export interface ToolDraft {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: Omit<Tool, 'id'> & { slug: string }
}

export const toolDrafts: ToolDraft[] = ${JSON.stringify(drafts, null, 2)}
`
  writeFileSync(path.join(DATA_DIR, 'tools-draft.ts'), output, 'utf-8')
}

async function main() {
  if (REFRESH) {
    await runRefresh()
    return
  }
  console.log('[1/3] 读取首页精选工具清单…')
  const homeHtml = await fetchHtml(HOME)
  const $h = cheerio.load(homeHtml)
  const seen = new Set()
  const faxUrls = []
  $h('a[href]').each((i, el) => {
    const href = $h(el).attr('href') || ''
    const m = href.match(/\/ai\/(\d+)\.html$/)
    if (m && !seen.has(m[1])) {
      seen.add(m[1])
      faxUrls.push('https://www.faxianai.com/ai/' + m[1] + '.html')
    }
  })
  console.log(`    首页共发现 ${faxUrls.length} 个去重工具链接(将抓取前 ${Math.min(faxUrls.length, MAX)} 个)`)

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
  const picked = faxUrls.slice(0, MAX)
  const newDrafts = []
  const usedSlugs = new Set(draftSlugs)
  for (let i = 0; i < picked.length; i++) {
    const u = picked[i]
    try {
      const t = await extractTool(u)
      if (!t || !t.official) { await sleep(DELAY); continue }
      if (existingHosts.has(hostOf(t.official))) { await sleep(DELAY); continue } // 库里已有
      if (draftNames.has(t.name) || usedSlugs.has(slugify(t.name))) { await sleep(DELAY); continue }
      const slug = slugify(t.name)
      usedSlugs.add(slug)
      const now = new Date().toISOString()
      const { category, tags } = topicsToInfo(t.topics, t.label, t.name, t.desc)
      newDrafts.push({
        source: 'faxianai',
        sourceUrl: u,
        fetchedAt: now,
        tool: {
          slug,
          name: t.name,
          description: await enrichDesc(t.name, t.desc, t.official),
          url: t.official,
          logoUrl: t.logo || undefined,
          category,
          tags: tags.length ? tags : ['AI'],
          pricing: inferPricing(t.desc),
          rating: 0,
          views: 0,
          createdAt: now,
          updatedAt: now,
        },
      })
      console.log(`  [${i + 1}/${picked.length}] ✓ ${t.name} -> ${category} | ${tags.join(',') || '无标签'}`)
    } catch (e) {
      console.log(`  [${i + 1}/${picked.length}] ✗ ${u} (${e.message})`)
    }
    await sleep(DELAY)
  }

  console.log(`\n共新增 ${newDrafts.length} 条(其余为库中已有或抓取失败)`)

  if (newDrafts.length === 0) {
    console.log('无新增,退出。')
    return
  }

  // 写入 data/tools-draft.ts (在数组结尾前插入; 首条前补逗号以衔接原末条)
  const insert = ',' + newDrafts.map((d) => '  ' + JSON.stringify(d)).join(',\n')
  const marker = ']'
  const idx = draftRaw.lastIndexOf(marker)
  const newContent = draftRaw.slice(0, idx) + insert + '\n' + draftRaw.slice(idx)
  writeFileSync(path.join(DATA_DIR, 'tools-draft.ts'), newContent, 'utf-8')
  console.log(`已写入 data/tools-draft.ts,请在 /admin/tools 审核入库。`)
}

main().catch((e) => { console.error(e); process.exit(1) })
