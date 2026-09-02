#!/usr/bin/env node
/**
 * Cocoloop 全量抓取脚本
 * 从 all-sitemap.xml 获取所有文章 URL，逐页抓取全文
 * 用法: node scripts/fetch-cocoloop-full.mjs [--limit N] [--skip-existing]
 */

import { writeFileSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import https from 'node:https'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

// 标题关键词 → 分类
const CATEGORY_RULES = [
  { cat: 'llm', keywords: ['gpt', 'claude', 'gemini', 'llama', 'deepseek', '模型', '大模型', 'openai', 'anthropic', 'google'] },
  { cat: 'opensource', keywords: ['开源', 'open source', 'mit', 'apache', 'huggingface', 'github'] },
  { cat: 'funding', keywords: ['融资', '收购', '估值', '投资', 'funding', 'acquisition'] },
  { cat: 'business', keywords: ['发布', '上线', '合作', '报告', '新闻', 'launch'] },
]

function guessCategory(text) {
  const t = (text || '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.cat
  }
  return 'business'
}

function extractNestedTag(html, openTag, closeTag) {
  const openRegex = new RegExp(`<${openTag}[^>]*>`, 'i')
  const startMatch = openRegex.exec(html)
  if (!startMatch) return ''
  let depth = 1
  let pos = startMatch.index + startMatch[0].length
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf(`<${openTag}`, pos)
    const nextClose = html.indexOf(`</${closeTag}>`, pos)
    if (nextClose === -1) break
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++
      pos = nextOpen + `<${openTag}`.length
    } else {
      depth--
      if (depth === 0) {
        return html.slice(startMatch.index + startMatch[0].length, nextClose)
      }
      pos = nextClose + `</${closeTag}>`.length
    }
  }
  return ''
}

async function fetchPage(url) {
  if (!url || !url.startsWith('http')) return { title: '', content: '' }
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(() => resolve({ title: '', content: '' }))
        return
      }
      if (res.statusCode !== 200) { resolve({ title: '', content: '' }); return }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        try {
          const html = Buffer.concat(chunks).toString('utf-8')

          // 提取真实标题：<title> 标签，去掉尾部的 " - News - Cocoloop"
          let title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || ''
          title = title.replace(/ - News - Cocoloop$/, '').trim()

          // 提取正文（策略0：post-content / entry-content / articleBody）
          let body = ''
          const patterns = [
            /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>/i,
            /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>/i,
            /<div[^>]*itemprop="articleBody"[^>]*>/i,
          ]
          for (const p of patterns) {
            const m = html.match(p)
            if (m) {
              const startIdx = m.index + m[0].length
              let depth = 1
              let pos = startIdx
              while (depth > 0 && pos < html.length) {
                const nO = html.indexOf('<div', pos)
                const nC = html.indexOf('</div>', pos)
                if (nC === -1) break
                if (nO !== -1 && nO < nC) { depth++; pos = nO + 4 }
                else { depth--; if (depth === 0) { body = html.slice(startIdx, nC); break } pos = nC + 6 }
              }
              if (body) break
            }
          }
          // 策略1：article 标签
          if (!body) body = extractNestedTag(html, 'article', 'article')
          // 清理
          body = (body || html)
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<aside[\s\S]*?<\/aside>/gi, '')
            .replace(/<meta[^>]*>/gi, '')

          resolve({ title, content: body.trim() })
        } catch { resolve({ title: '', content: '' }) }
      })
      res.on('error', () => resolve({ title: '', content: '' }))
    })
    req.on('error', () => resolve({ title: '', content: '' }))
    req.on('timeout', () => { req.destroy(); resolve({ title: '', content: '' }) })
  })
}

async function fetchSitemap() {
  return new Promise((resolve, reject) => {
    https.get('https://news.cocoloop.cn/all-sitemap.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const xml = Buffer.concat(chunks).toString('utf-8')
        const urls = [...xml.matchAll(/<loc>(https:\/\/news\.cocoloop\.cn\/\d{4}\/\d{2}\/[^<]+)<\/loc>/g)]
          .map(m => m[1])
        resolve(urls)
      })
      res.on('error', reject)
    })
  })
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36).slice(0, 6)
}

function extractTitleFromUrl(url) {
  const match = url.match(/\/\d{4}\/\d{2}\/([^/]+)\/?$/)
  if (!match) return ''
  return match[1].replace(/-/g, ' ')
}

function extractDateFromUrl(url) {
  const match = url.match(/\/(\d{4})\/(\d{2})\//)
  if (!match) return ''
  return `${match[1]}-${match[2]}-01`
}

async function loadExistingTitles() {
  const titles = new Set()
  const files = ['news-draft.ts', 'news.ts']
  for (const file of files) {
    const filePath = path.join(dataDir, file)
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8')
      const titlePattern = /title[: ]*['"]([^'"]+)['"]/g
      let m
      while ((m = titlePattern.exec(raw)) !== null) {
        titles.add(m[1])
      }
    }
  }
  return titles
}

async function loadDrafts() {
  const filePath = path.join(dataDir, 'news-draft.ts')
  if (!existsSync(filePath)) return []
  const raw = readFileSync(filePath, 'utf-8')
  const match = raw.match(/export const newsDrafts: NewsDraft\[\] = (\[[\s\S]*?\])/)
  if (!match) return []
  try {
    return JSON.parse(match[1])
  } catch {
    return []
  }
}

async function saveDrafts(drafts) {
  const filePath = path.join(dataDir, 'news-draft.ts')
  const output = `// 草稿区: GitHub Actions 自动抓取写入,人工在 /admin/news 审核发布
// 本文件会被 scripts/fetch-news.mjs 定时覆盖,请勿手工编辑数据

export interface NewsDraft {
  id: string
  title: string
  source: string
  url: string
  summary: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

export const newsDrafts: NewsDraft[] = ${JSON.stringify(drafts, null, 2)}

export function getNewsDrafts(): NewsDraft[] {
  return newsDrafts
}
`
  writeFileSync(filePath, output, 'utf-8')
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity
  const skipExisting = args.includes('--skip-existing')

  console.log('📡 正在获取 Cocoloop 全量 sitemap...')
  const allUrls = await fetchSitemap()
  console.log(`📰 共发现 ${allUrls.length} 篇文章`)

  // 过滤多语言版本（只保留中文）
  const zhUrls = allUrls.filter(url => !url.match(/\/(en|ja|ko|zh-tw|id|vi|de|pt|es|fr)\//))
  console.log(`🇨🇳 中文文章: ${zhUrls.length} 篇`)

  const urlsToFetch = zhUrls.slice(0, limit)
  console.log(`🎯 本次抓取: ${urlsToFetch.length} 篇`)

  const existingTitles = skipExisting ? await loadExistingTitles() : new Set()
  const existingDrafts = await loadDrafts()
  const existingDraftTitles = new Set(existingDrafts.map(d => d.title))

  const newDrafts = []
  let successCount = 0
  let failCount = 0
  let skipCount = 0

  // 并发抓取（每次 5 个）
  const concurrency = 5
  for (let i = 0; i < urlsToFetch.length; i += concurrency) {
    const batch = urlsToFetch.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        // 从 HTML 提取真实标题和正文
        const { title, content } = await fetchPage(url)
        const titleFromUrl = extractTitleFromUrl(url)
        // 如果提取不到真实标题，退回到 URL 提取
        const finalTitle = title || titleFromUrl
        if (!finalTitle) return null
        if (existingTitles.has(finalTitle) || existingDraftTitles.has(finalTitle)) {
          skipCount++
          return null
        }
        if (!content) {
          failCount++
          return null
        }

        const summary = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
        const coverMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)

        return {
          id: hash(finalTitle + url),
          title: finalTitle,
          source: 'Cocoloop',
          url,
          summary: summary || finalTitle,
          content,
          coverImage: coverMatch ? coverMatch[1] : '',
          category: guessCategory(finalTitle + ' ' + summary),
          publishedAt: extractDateFromUrl(url),
          fetchedAt: new Date().toISOString(),
          status: 'draft',
        }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        newDrafts.push(result.value)
        successCount++
      }
    }

    // 进度显示
    const progress = Math.min(i + concurrency, urlsToFetch.length)
    if (progress % 50 === 0 || progress === urlsToFetch.length) {
      console.log(` 进度: ${progress}/${urlsToFetch.length} (成功: ${successCount}, 失败: ${failCount}, 跳过: ${skipCount})`)
    }

    // 间隔 200ms 避免被封
    if (i + concurrency < urlsToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // 合并并保存
  const allDrafts = [...existingDrafts, ...newDrafts]
  await saveDrafts(allDrafts)

  console.log('\n✅ 抓取完成!')
  console.log(`   新增: ${successCount} 条`)
  console.log(`   失败: ${failCount} 条`)
  console.log(`   跳过: ${skipCount} 条`)
  console.log(`   草稿区总计: ${allDrafts.length} 条`)
  console.log(`   已写入: data/news-draft.ts`)
}

main().catch(err => {
  console.error('❌ 抓取失败:', err.message)
  process.exit(1)
})
