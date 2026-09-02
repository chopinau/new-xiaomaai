#!/usr/bin/env node
/**
 * 每日抓取 AI 资讯 → 写入 data/news-draft.ts 草稿区
 * 由 .github/workflows/daily-news-draft.yml 触发
 * 只抓取不 commit,人工在 /admin/news 后台 review 后再发布
 */
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import Parser from 'rss-parser'
import https from 'node:https'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 11 个高质 RSS 源（maxItems: 每个源最多取多少条，默认 15）
const SOURCES = [
  { name: '36kr AI', url: 'https://36kr.com/feed', lang: 'zh' },
  { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', lang: 'zh' },
  { name: '量子位', url: 'https://www.qbitai.com/feed', lang: 'zh' },
  { name: 'Cocoloop', url: 'https://news.cocoloop.cn/atom.xml', lang: 'zh', maxItems: 30 },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI&points=100', lang: 'en' },
  { name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed?category=artificial-intelligence', lang: 'en' },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', lang: 'en' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/rss.xml', lang: 'en' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', lang: 'en' },
  { name: '新智元', url: 'https://www.xinship.cn/feed', lang: 'zh' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en' },
]

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

/**
 * 从 HTML 字符串中提取指定标签的内容，正确处理嵌套标签
 */
function extractNestedTag(html, openTag, closeTag) {
  const openRegex = new RegExp(`<${openTag}[^>]*>`, 'i')
  const closeRegex = new RegExp(`</${closeTag}>`, 'i')
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

/**
 * 从原文 URL 抓取网页 HTML，提取正文内容
 * 使用浏览器 User-Agent 避免被反爬
 */
async function fetchFullContent(url) {
  if (!url || !url.startsWith('http')) return ''

  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        timeout: 15000,
      },
      (res) => {
        // 跟随重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchFullContent(res.headers.location).then(resolve).catch(() => resolve(''))
          return
        }

        if (res.statusCode !== 200) {
          resolve('')
          return
        }

        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          try {
            const html = Buffer.concat(chunks).toString('utf-8')

            // 策略0：优先提取 class="post-content"/"entry-content" 的 div（Cocoloop 等）
            let body = ''
            const contentDivPatterns = [
              /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>/i,
              /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>/i,
              /<div[^>]*itemprop="articleBody"[^>]*>/i,
            ]
            for (const pattern of contentDivPatterns) {
              const m = html.match(pattern)
              if (m) {
                const startIdx = m.index + m[0].length
                let depth = 1
                let pos = startIdx
                while (depth > 0 && pos < html.length) {
                  const nextOpen = html.indexOf('<div', pos)
                  const nextClose = html.indexOf('</div>', pos)
                  if (nextClose === -1) break
                  if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++
                    pos = nextOpen + 4
                  } else {
                    depth--
                    if (depth === 0) {
                      body = html.slice(startIdx, nextClose)
                      break
                    }
                    pos = nextClose + 6
                  }
                }
                if (body) break
              }
            }

            // 策略1：提取 <article> 内容（带嵌套深度计数）
            if (!body) {
              body = extractNestedTag(html, 'article', 'article')
            }

            // 策略2：提取 class="article" 的 div（WordPress 常见结构）
            if (!body) {
              const articleDivMatch = html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>/i)
              if (articleDivMatch) {
                const startIdx = articleDivMatch.index + articleDivMatch[0].length
                let depth = 1
                let pos = startIdx
                while (depth > 0 && pos < html.length) {
                  const nextOpen = html.indexOf('<div', pos)
                  const nextClose = html.indexOf('</div>', pos)
                  if (nextClose === -1) break
                  if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++
                    pos = nextOpen + 4
                  } else {
                    depth--
                    if (depth === 0) {
                      body = html.slice(startIdx, nextClose)
                      break
                    }
                    pos = nextClose + 6
                  }
                }
              }
            }

            // 策略3：提取 class="content" 的 div（带嵌套深度计数）
            if (!body) {
              const contentDivMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>/i)
              if (contentDivMatch) {
                const startIdx = contentDivMatch.index + contentDivMatch[0].length
                let depth = 1
                let pos = startIdx
                while (depth > 0 && pos < html.length) {
                  const nextOpen = html.indexOf('<div', pos)
                  const nextClose = html.indexOf('</div>', pos)
                  if (nextClose === -1) break
                  if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++
                    pos = nextOpen + 4
                  } else {
                    depth--
                    if (depth === 0) {
                      body = html.slice(startIdx, nextClose)
                      break
                    }
                    pos = nextClose + 6
                  }
                }
              }
            }

            // 策略4：提取 <main> 内容
            if (!body) {
              body = extractNestedTag(html, 'main', 'main')
            }

            // 策略5：提取 <body> 内容
            if (!body) {
              body = extractNestedTag(html, 'body', 'body')
            }

            // 清理：移除 script/style/nav/header/footer/aside/meta
            body = body
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<nav[\s\S]*?<\/nav>/gi, '')
              .replace(/<header[\s\S]*?<\/header>/gi, '')
              .replace(/<footer[\s\S]*?<\/footer>/gi, '')
              .replace(/<aside[\s\S]*?<\/aside>/gi, '')
              .replace(/<meta[^>]*>/gi, '')
              // 清理 WordPress 常见非正文元素
              .replace(/<div class="tags"[^>]*>[\s\S]*?<\/div>/gi, '')
              .replace(/<div class="person_box"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
              .replace(/<div class="share_[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
              .replace(/<div class="xiangguan"[^>]*>[\s\S]*?<\/div>/gi, '')
              .replace(/<div class="line_font"[^>]*>[\s\S]*?<\/div>/gi, '')
              .replace(/<div class="zhaiyao"[^>]*>[\s\S]*?<\/div>/gi, '')
              .replace(/<!--[\s\S]*?-->/g, '')

            resolve(body.trim())
          } catch {
            resolve('')
          }
        })
        res.on('error', () => resolve(''))
      }
    )
    req.on('error', () => resolve(''))
    req.on('timeout', () => {
      req.destroy()
      resolve('')
    })
  })
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

// 从 TS 文件中提取 export const xxx: Type[] = [...] 数组(括号匹配,忽略字符串内括号)
// 注意: 数组内容由 JSON.stringify 生成,字符串统一用双引号,故只识别双引号边界
function extractArray(raw, marker) {
  const start = raw.indexOf(marker)
  if (start === -1) return []
  const arrStart = start + marker.length
  let depth = 1 // marker 以 '[' 结尾
  let inStr = false
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
      if (depth === 0) {
        return JSON.parse(raw.slice(arrStart - 1, i + 1))
      }
    }
  }
  return []
}

async function main() {
  const seen = new Set()
  const items = []

  // 读取已有草稿做去重
  const draftPath = path.join(__dirname, '..', 'data', 'news-draft.ts')
  const newsPath = path.join(__dirname, '..', 'data', 'news.ts')

  const existingTitles = new Set()
  const titlePattern = /title[: ]*['"]([^'"]+)['"]/g
  for (const file of [draftPath, newsPath]) {
    if (!existsSync(file)) continue
    const raw = readFileSync(file, 'utf-8')
    const matches = raw.matchAll(titlePattern)
    for (const m of matches) existingTitles.add(m[1])
  }

  // 读取 skip-list（连续失败的源自动跳过）
  const skipListPath = path.join(__dirname, 'skip-list.json')
  let skipList = {}
  if (existsSync(skipListPath)) {
    try { skipList = JSON.parse(readFileSync(skipListPath, 'utf-8')) } catch {}
  }

  // 并行抓取所有源，每个源独立超时8秒，互不阻塞
  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      // 跳过连续失败3次的源
      if (skipList[source.name] >= 3) {
        console.log(`[SKIP] ${source.name}: 连续失败 ${skipList[source.name]} 次,跳过`)
        return { source, items: [], skipped: true }
      }

      const parser = new Parser({
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; xiaomaai-bot/1.0; +https://xiaomaai.net)',
          Accept: 'application/rss+xml,application/xml,text/xml',
        },
      })
      const feed = await parser.parseURL(source.url)
      const maxItems = source.maxItems || 15
      const list = (feed.items || []).slice(0, maxItems)
      return { source, items: list, skipped: false }
    })
  )

  // 处理结果
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const source = SOURCES[i]

    if (r.status === 'rejected') {
      // 失败源增加失败计数
      skipList[source.name] = (skipList[source.name] || 0) + 1
      console.warn(`[FAIL] ${source.name}: ${r.reason?.message || r.reason} (累计失败 ${skipList[source.name]} 次)`)
      continue
    }

    const { items: feedItems, skipped } = r.value
    if (skipped) continue

    // 成功源重置失败计数
    if (skipList[source.name]) skipList[source.name] = 0

    // 先收集所有需要抓取全文的条目
    const toFetch = []
    for (const item of feedItems) {
      const title = (item.title || '').trim().slice(0, 80)
      if (!title) continue
      const h = hash(title)
      if (seen.has(h)) continue
      seen.add(h)
      if (existingTitles.has(title)) continue

      const rawContent = item.content || item.contentSnippet || item.summary || ''
      const plainLen = rawContent.replace(/<[^>]+>/g, '').length

      // RSS 内容 < 300 字符（纯文本），说明只有摘要，需要从原文 URL 抓取全文
      if (plainLen < 300 && item.link) {
        toFetch.push({ item, title, h, source })
      } else {
        // RSS 已有全文，直接使用
        const summary = rawContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
        const coverMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i)
        items.push({
          id: h,
          title,
          source: source.name,
          lang: source.lang,
          url: item.link || source.url,
          summary: summary || title,
          content: rawContent,
          coverImage: coverMatch ? coverMatch[1] : '',
          category: guessCategory(title + ' ' + summary),
          publishedAt: item.pubDate || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          status: 'draft',
        })
      }
    }

    // 批量抓取全文（每次最多 3 个并发，间隔 500ms 避免被封）
    for (let i = 0; i < toFetch.length; i += 3) {
      const batch = toFetch.slice(i, i + 3)
      const results = await Promise.allSettled(
        batch.map(async ({ item, title, h, source }) => {
          const fullContent = await fetchFullContent(item.link)
          if (fullContent) {
            const summary = fullContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
            const coverMatch = fullContent.match(/<img[^>]+src=["']([^"']+)["']/i)
            return {
              id: h,
              title,
              source: source.name,
              lang: source.lang,
              url: item.link,
              summary: summary || title,
              content: fullContent,
              coverImage: coverMatch ? coverMatch[1] : '',
              category: guessCategory(title + ' ' + summary),
              publishedAt: item.pubDate || new Date().toISOString(),
              fetchedAt: new Date().toISOString(),
              status: 'draft',
            }
          }
          // 抓取失败，回退到 RSS 摘要
          const rssContent = item.content || item.contentSnippet || item.summary || ''
          const summary = rssContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
          const coverMatch = rssContent.match(/<img[^>]+src=["']([^"']+)["']/i)
          return {
            id: h,
            title,
            source: source.name,
            lang: source.lang,
            url: item.link,
            summary: summary || title,
            content: rssContent,
            coverImage: coverMatch ? coverMatch[1] : '',
            category: guessCategory(title + ' ' + summary),
            publishedAt: item.pubDate || new Date().toISOString(),
            fetchedAt: new Date().toISOString(),
            status: 'draft',
          }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') items.push(r.value)
      }

      // 批次间间隔 500ms
      if (i + 3 < toFetch.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    console.log(`[OK] ${source.name}: +${feedItems.length} items`)
  }

  // 保存更新后的 skip-list
  writeFileSync(skipListPath, JSON.stringify(skipList, null, 2), 'utf-8')

  // 保留已有草稿(从上次生成的文件中解析),新条目追加到最前
  let existingDrafts = extractArray(
    existsSync(draftPath) ? readFileSync(draftPath, 'utf-8') : '',
    'export const newsDrafts: NewsDraft[] = ['
  )

  const merged = [...items, ...existingDrafts].slice(0, 50)

  const output = `// 草稿区: GitHub Actions 自动抓取写入,人工在 /admin/news 审核发布
// 抓取时间: ${new Date().toISOString()}

export interface NewsDraft {
  id: string
  title: string
  source: string
  lang?: 'zh' | 'en'
  url: string
  summary: string
  content: string
  coverImage?: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  publishedAt: string
  fetchedAt: string
  status: 'draft'
}

export const newsDrafts: NewsDraft[] = ${JSON.stringify(merged, null, 2)}

export function getNewsDrafts(): NewsDraft[] {
  return newsDrafts
}
`

  writeFileSync(draftPath, output, 'utf-8')
  console.log(`\n✅ 本次新增 ${items.length} 条,草稿区共 ${merged.length} 条 → ${draftPath}`)
  console.log('⚠️ 仅写入草稿,未自动 commit。请在 /admin/news 或本地 review 后手动发布。')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
