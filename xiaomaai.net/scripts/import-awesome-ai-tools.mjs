/**
 * import-awesome-ai-tools.mjs
 *
 * 全量导入 mahseema/awesome-ai-tools 到 data/tools.ts
 * 数据源：https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md
 * 协议：CC0 (Public Domain)
 *
 * 用法：
 *   node scripts/import-awesome-ai-tools.mjs              # 全量导入
 *   node scripts/import-awesome-ai-tools.mjs --dry-run    # 只统计不写入
 *   node scripts/import-awesome-ai-tools.mjs --append     # 追加到现有 tools.ts
 *
 * 输出：data/tools.ts（覆盖或追加）
 */

import https from 'node:https'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const TOOLS_FILE = path.join(PROJECT_ROOT, 'data', 'tools.ts')
const README_URL = 'https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md'

// ===== 板块 → 我们的 6 大分类映射 =====
// 基于 mahseema/awesome-ai-tools 实际 h2/h3 结构
const SECTION_TO_CATEGORY = {
  // h2 主板块
  'text': 'chat',
  'code': 'code',
  'image': 'image',
  'video': 'video',
  'audio': 'audio',
  'other': 'productivity',
  'other ai tools': 'productivity',
  'learning resources': 'productivity',
  'learn ai free': 'productivity',
  'nvidia platform extensions': 'productivity',
  'related awesome lists': 'productivity',

  // h3 子板块（## Text 下）
  'models': 'chat',                     // LLM 模型
  'chatbots': 'chat',
  'search engines': 'chat',
  'local search engines': 'chat',
  'writing assistants': 'chat',
  'chatgpt extensions': 'chat',
  'productivity': 'productivity',
  'meeting assistants': 'productivity',
  'academia': 'productivity',
  'customer support': 'productivity',
  'other text generators': 'chat',
  'developer tools': 'code',

  // h3 子板块（## Image 下）
  'services': 'image',
  'graphic design': 'image',
  'image libraries': 'image',
  'model libraries': 'image',
  'stable diffusion resources': 'image',

  // h3 子板块（## Video 下）
  'animation': 'video',

  // h3 子板块（## Audio 下）
  'ai voice cloning': 'audio',
  'ai music generators': 'audio',
  'speech': 'audio',
  'music': 'audio',
  'marketing ai tools': 'productivity',
  'phone calls': 'productivity',

  // 学习资源
  'machine learning': 'productivity',
  'deep learning': 'productivity',
}

// 板块包含关键词 → 分类（用于子分类 h3 和模糊匹配）
const KEYWORD_CATEGORY = [
  // chat 优先
  { keywords: ['chatgpt', 'chatbot', 'chat bot', 'gpt-4', 'gpt-3', 'gpt-4o', 'gemini', 'claude', 'llama', 'llama 2', 'llama 3', 'mistral', 'deepseek', 'kimi', 'qwen', 'wenxin', 'doubao', 'chatglm', 'character.ai', 'pi.ai', 'phind', 'jasper', 'rytr', 'quillbot', 'writesonic', 'perplexity', 'you.com', 'komo', 'metaphor', 'mem ai', 'taskade', 'notion ai', 'writing assistant', 'copy.ai', 'lex page', 'wordtune', 'hyperwrite', 'moonbeam', 'compose ai', 'yomu', 'elephas', 'leonardo.ai', 'tunnel', 'chatpdf', 'chatpdf.com', 'chatsonic', 'forefront', 'editgpt', 'merlin', 'chatgpt writer', 'tiledesk', 'aicamp', 'gali chat', 'dmwithme', 'memfree', 'refinder', 'agentset', 'private', 'quivr', 'gpt for', 'youtube summary', 'chatgpt for jupyter', 'sharegpt', 'elephas', 'recall', 'merlin', 'wappalyzer', 'monica', 'merlin', 'elicit', 'consensus', 'scite', 'scisummary', 'scholarcy', 'scispace', 'chatpdf', 'pdf', 'tldv', 'notta', 'fireflies', 'read.ai', 'fathom', 'krisp', 'equal time', 'tl;dv', 'sembly', 'airgram', 'meetgeek', 'sanebox', 'superhuman', 'mailmeteor', 'mailshake', 'mailtrack', 'hubspot', 'mailchimp', 'lavender', 'reply.io', 'instantly', 'smartwriter', 'warmer.ai', 'quickcept', 'anyword', 'contenda', 'hypotenuse', 'dittto', 'pulsepost', 'shy editor', 'deepl write', 'headlines', 'gptlocalhost', 'gali chat', 'galichat', 'gpt for sheets', 'webchatgpt', 'youtube summary with chatgpt', 'chatgpt prompt genius', 'merlin', 'chatgpt writer', 'editgpt', 'forefront', 'chatbot ui', 'pi', 'dmwithme'], category: 'chat' },

  // code
  { keywords: ['copilot', 'cursor', 'replit', 'codeium', 'tabnine', 'cody', 'codestral', 'blackbox', 'codepal', 'v0.dev', 'ghostwriter', 'continue', 'aider', 'codium', 'devin', 'devika', 'open interpreter', 'autogen', 'crewai', 'langgraph', 'metagpt', 'gpt engineer', 'smol developer', 'devlooper', 'mentat', 'gpt-migrate', 'swe-agent', 'appmap', 'codiga', 'deepsource', 'sourcery', 'refraction', 'codereviewer', 'codereview', 'what-the-diff', 'greptile', 'qodanaa', 'bugspotting', 'useapi', 'ai code', 'programming', 'developer', 'coding', 'code review', 'commit', 'pull request', 'cli', 'ide', 'vscode', 'jetbrains', 'intellij', 'vim', 'neovim', 'emacs', 'shell', 'bash', 'zsh', 'git', 'github', 'gitlab', 'sourcegraph', 'codeball', 'codestatus', 'fine', 'codeium', 'cursor', 'replit', 'phind', 'codepal', 'blackbox', 'codeconvert', 'ai code translator'], category: 'code' },

  // image
  { keywords: ['midjourney', 'dall-e', 'dalle', 'stable diffusion', 'ideogram', 'leonardo', 'playground', 'flux', 'recraft', 'firefly', 'imagen', 'krea', 'magnific', 'lensa', 'imglarger', 'artbreeder', 'bing image', 'lexica', 'picsart', 'photoroom', 'remove bg', 'canva ai', 'figma ai', 'designer', 'image generator', 'image generation', 'image ai', 'text to image', 'image to image', 'ai art', 'ai image', 'ai drawing', 'logo', 'icon', 'illustration', 'comic', 'manga', 'avatar', 'portrait', 'headshot', 'photo editor', 'photo enhancer', 'background remover', 'ai photo', 'generative fill', 'outpaint', 'inpaint', 'upscaler', 'upscale', 'image upscale', 'vector', 'sketch', 'anime', 'realistic', 'photorealistic'], category: 'image' },

  // video
  { keywords: ['sora', 'runway', 'pika', 'luma', 'kling', 'heygen', 'synthesia', 'invideo', 'veed', 'suno', 'udio', 'aiva', 'mubert', 'soundraw', 'rime', 'descript', 'kaiber', 'wondershare', 'pictory', 'flixier', 'opus clip', 'd-id', 'tavus', 'colossyan', 'deepbrain', 'hour one', 'elai', 'veed', 'vizard', 'veed', 'gpt engineer', 'video generator', 'video ai', 'text to video', 'ai video', 'video editor', 'video editing', 'video clip', 'short video', 'tiktok', 'reel', 'shorts', 'youtube short', 'animation', 'avatar video', 'talking head', 'lip sync', 'subtitles', 'caption', 'transcript video'], category: 'video' },

  // audio
  { keywords: ['elevenlabs', 'murf', 'play.ht', 'wellsaid', 'speechify', 'speechelo', 'speechki', 'naturalreader', 'voicemaker', 'wideo', 'voice ai', 'voice generator', 'voice clone', 'text to speech', 'tts', 'voice over', 'voiceover', 'speech synthesis', 'voice changer', 'ai voice', 'speech to text', 'stt', 'transcription', 'podcast', 'podcastle', 'riverside', 'alitu', 'spreaker', 'buzzsprout', 'transistor', 'suno', 'udio', 'aiva', 'mubert', 'soundraw', 'music generator', 'ai music', 'text to music', 'music ai', 'song generator', 'lyrics', 'beat', 'melody', 'audio', 'sound', 'voice'], category: 'audio' },
]

// ===== 工具函数 =====
function fetchText(url, retries = 5) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = https.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // redirect
          fetchText(res.headers.location, retries).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => resolve(data))
        res.on('error', reject)
      })
      req.on('error', (err) => {
        if (n > 0) {
          setTimeout(() => attempt(n - 1), 1000 * (6 - n))
        } else {
          reject(err)
        }
      })
      req.on('timeout', () => {
        req.destroy()
        if (n > 0) attempt(n - 1)
        else reject(new Error('Timeout'))
      })
    }
    attempt(retries)
  })
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function urlToDomain(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function urlToFavicon(url) {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}/favicon.ico`
  } catch {
    return ''
  }
}

function inferCategory(name, section, description, parentH2) {
  // 1. 板块直接匹配（精确）
  const sectionLower = (section || '').toLowerCase().trim()
  if (SECTION_TO_CATEGORY[sectionLower]) {
    return SECTION_TO_CATEGORY[sectionLower]
  }

  // 2. 父 h2 匹配
  const parentLower = (parentH2 || '').toLowerCase().trim()
  if (SECTION_TO_CATEGORY[parentLower]) {
    return SECTION_TO_CATEGORY[parentLower]
  }

  // 3. 描述包含关键词
  const descLower = (description || '').toLowerCase()
  const nameLower = name.toLowerCase()
  const combined = `${nameLower} ${descLower} ${sectionLower} ${parentLower}`

  for (const m of KEYWORD_CATEGORY) {
    if (m.keywords.some(k => combined.includes(k))) {
      return m.category
    }
  }

  // 4. 父板块推断（"ai text" → chat, "ai tools for marketing" → productivity）
  if (parentLower.includes('text') || parentLower.includes('chat')) return 'chat'
  if (parentLower.includes('code')) return 'code'
  if (parentLower.includes('image')) return 'image'
  if (parentLower.includes('video')) return 'video'
  if (parentLower.includes('audio')) return 'audio'
  if (parentLower.includes('marketing')) return 'productivity'
  if (parentLower.includes('productivity')) return 'productivity'
  if (parentLower.includes('phone')) return 'productivity'

  return 'productivity' // fallback
}

function inferPricing(name, description) {
  const text = `${name} ${description}`.toLowerCase()
  if (text.includes('free') && !text.includes('free trial') && !text.includes('freemium')) {
    if (text.includes('open source') || text.includes('open-source') || text.includes('#opensource')) {
      return 'free'
    }
  }
  if (text.includes('freemium') || text.includes('free tier') || text.includes('free plan')) return 'freemium'
  if (text.includes('enterprise') || text.includes('business plan')) return 'enterprise'
  return 'freemium' // 默认 freemium（最常见）
}

function extractTags(name, description, section) {
  const tags = []
  const text = `${name} ${description}`.toLowerCase()
  if (text.includes('open source') || text.includes('#opensource')) tags.push('开源')
  if (text.includes('free')) tags.push('免费')
  if (text.includes('chatgpt') || text.includes('gpt')) tags.push('GPT')
  if (text.includes('claude')) tags.push('Claude')
  if (text.includes('llama')) tags.push('Llama')
  if (text.includes('gemini')) tags.push('Gemini')
  if (text.includes('midjourney')) tags.push('Midjourney')
  if (text.includes('stable diffusion')) tags.push('SD')
  if (text.includes('dall-e') || text.includes('dalle')) tags.push('DALL·E')
  if (text.includes('国产') || /deepseek|kimi|qwen|wenxin|doubao|chatglm/.test(text)) tags.push('国产')
  if (text.includes('search')) tags.push('搜索')
  if (text.includes('voice')) tags.push('语音')
  if (text.includes('video')) tags.push('视频')
  if (text.includes('image')) tags.push('图像')
  if (text.includes('code')) tags.push('代码')
  if (text.includes('writing') || text.includes('writer')) tags.push('写作')
  if (text.includes('productivity')) tags.push('效率')
  // 板块作为 tag
  if (section) {
    const secClean = section.replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim()
    if (secClean && secClean.length < 12) tags.push(secClean)
  }
  // 去重
  return [...new Set(tags)].slice(0, 4)
}

// ===== 解析 README =====
function parseReadme(markdown) {
  const lines = markdown.split('\n')
  const tools = []
  let currentSection = ''

  // 跳过目录和编辑器推荐，从 "## Editor's Choice" 后或 ## Contents 后开始
  let inContent = false
  let skippedSections = new Set(["editor's choice", "contents"])

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 板块标题
    const h2 = line.match(/^##\s+(.+?)$/)
    if (h2) {
      currentSection = h2[1].replace(/\[(.+?)\]\(#.+?\)/, '$1').trim()
      if (skippedSections.has(currentSection.toLowerCase())) {
        inContent = false
      } else {
        inContent = true
      }
      continue
    }
    // 跳过 h3 子标题（也是板块，但用 h2 兼容更细的分类）

    if (!inContent) continue
    if (!currentSection) continue

    // 工具条目: - [Name](url) - description
    const toolMatch = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)\s*-?\s*(.*)$/)
    if (toolMatch) {
      const [, name, url, descRaw] = toolMatch
      const description = (descRaw || '')
        .replace(/\*\[reviews?\]\([^)]+\)\*/g, '')
        .replace(/\[reviews?\]\([^)]+\)/g, '')
        .replace(/#opensource/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      const category = inferCategory(name, currentSection)
      const pricing = inferPricing(name, description)
      const tags = extractTags(name, description, currentSection)
      const slug = slugify(name)
      const logoUrl = urlToFavicon(url)

      tools.push({
        id: slug,
        slug,
        name: name.trim(),
        description: description || `${name.trim()} - AI 工具`,
        url: url.trim(),
        logoUrl,
        category,
        tags,
        pricing,
        featured: false,
        rating: 0,
        views: 0,
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      })
    }
  }

  // 去重（按 slug）
  const seen = new Set()
  return tools.filter(t => {
    if (seen.has(t.slug)) return false
    seen.add(t.slug)
    return true
  })
}

// ===== 读取已有 tools.ts，提取所有 slug =====
async function getExistingSlugs() {
  try {
    const content = await fs.readFile(TOOLS_FILE, 'utf-8')
    const matches = content.matchAll(/^\s+slug:\s*'([^']+)'/gm)
    return new Set([...matches].map(m => m[1]))
  } catch {
    return new Set()
  }
}

// ===== 生成 TypeScript 文件 =====
function generateToolsTS(tools) {
  const header = `// 工具元数据 - AI 工具市场数据库
// 数据源：mahseema/awesome-ai-tools (CC0) + 自研补充
// 自动生成于 ${new Date().toISOString().split('T')[0]}
// 总数：${tools.length} 个工具
export type Tool = {
  id: string
  slug: string
  name: string
  description: string
  url: string
  logoUrl?: string
  category: string
  tags: string[]
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise'
  featured?: boolean
  rating?: number
  views?: number
  createdAt: string
  updatedAt: string
}

export const tools: Tool[] = [
`

  const body = tools.map(t => {
    const escDesc = t.description.replace(/'/g, "\\'").replace(/\n/g, ' ')
    return `  {
    id: '${t.id}',
    slug: '${t.slug}',
    name: '${t.name.replace(/'/g, "\\'")}',
    description: '${escDesc.slice(0, 200)}',
    url: '${t.url}',
    logoUrl: '${t.logoUrl}',
    category: '${t.category}',
    tags: ${JSON.stringify(t.tags)},
    pricing: '${t.pricing}',
    featured: ${t.featured},
    rating: ${t.rating},
    views: ${t.views},
    createdAt: '${t.createdAt}',
    updatedAt: '${t.updatedAt}',
  },`
  }).join('\n')

  const footer = `
]

export function getToolsByCategory(category: string) {
  return tools.filter(t => t.category === category)
}

export function getFeaturedTools() {
  return tools.filter(t => t.featured)
}

export function getToolBySlug(slug: string) {
  return tools.find(t => t.slug === slug)
}

export function getRelatedTools(tool: Tool, limit = 4) {
  return tools
    .filter(t => t.id !== tool.id && t.category === tool.category)
    .slice(0, limit)
}

export function getCategories(): Record<string, { label: string; icon: string; count: number }> {
  const cats: Record<string, { label: string; icon: string; count: number }> = {
    chat: { label: 'AI 对话', icon: '💬', count: 0 },
    image: { label: 'AI 图像', icon: '🎨', count: 0 },
    video: { label: 'AI 视频', icon: '🎬', count: 0 },
    audio: { label: 'AI 音频', icon: '🎵', count: 0 },
    code: { label: 'AI 编程', icon: '💻', count: 0 },
    productivity: { label: 'AI 效率', icon: '⚡', count: 0 },
  }
  for (const t of tools) {
    if (cats[t.category]) cats[t.category].count++
  }
  return cats
}

export function searchTools(query: string) {
  if (!query) return tools
  const q = query.toLowerCase()
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  )
}
`

  return header + body + footer
}

// ===== 主流程 =====
async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isAppend = args.includes('--append')

  console.log('🚀 开始全量导入 mahseema/awesome-ai-tools')
  console.log(`📥 正在拉取 README（${README_URL}）...`)

  const start = Date.now()
  const markdown = await fetchText(README_URL)
  console.log(`✅ README 拉取完成，${(markdown.length / 1024).toFixed(1)} KB（${Date.now() - start}ms）`)

  console.log('🔍 正在解析工具条目...')
  const newTools = parseReadme(markdown)
  console.log(`✅ 解析到 ${newTools.length} 个工具（去重后）`)

  // 分类统计
  const catCount = {}
  for (const t of newTools) {
    catCount[t.category] = (catCount[t.category] || 0) + 1
  }
  console.log('📊 分类分布:')
  for (const [cat, n] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat.padEnd(15)} ${n}`)
  }

  let finalTools = newTools
  if (isAppend) {
    console.log('🔗 --append 模式：与已有 tools.ts 合并')
    const existing = await getExistingSlugs()
    const fresh = newTools.filter(t => !existing.has(t.slug))
    console.log(`   已有 ${existing.size} 个，新增 ${fresh.length} 个（跳过 ${newTools.length - fresh.length} 个重复）`)
    finalTools = fresh
  }

  if (isDryRun) {
    console.log('🧪 --dry-run：不写入文件')
    console.log('📝 前 5 个工具预览：')
    finalTools.slice(0, 5).forEach(t => {
      console.log(`   - ${t.name} (${t.category}) ${t.url}`)
    })
    return
  }

  if (isAppend && finalTools.length === 0) {
    console.log('⚠️  没有新工具可追加，退出')
    return
  }

  if (isAppend) {
    // 追加模式：读取现有文件，在 tools 数组末尾插入
    const content = await fs.readFile(TOOLS_FILE, 'utf-8')
    const insertEntries = finalTools.map(t => {
      const escDesc = t.description.replace(/'/g, "\\'").replace(/\n/g, ' ')
      return `  {
    id: '${t.id}',
    slug: '${t.slug}',
    name: '${t.name.replace(/'/g, "\\'")}',
    description: '${escDesc.slice(0, 200)}',
    url: '${t.url}',
    logoUrl: '${t.logoUrl}',
    category: '${t.category}',
    tags: ${JSON.stringify(t.tags)},
    pricing: '${t.pricing}',
    featured: ${t.featured},
    rating: ${t.rating},
    views: ${t.views},
    createdAt: '${t.createdAt}',
    updatedAt: '${t.updatedAt}',
  },`
    }).join('\n')

    // 在 `]\n\nexport function getToolsByCategory` 前插入
    const updated = content.replace(
      /(export const tools: Tool\[\] = \[\n)/,
      `$1${insertEntries}\n`
    )
    await fs.writeFile(TOOLS_FILE, updated, 'utf-8')
    console.log(`✅ 追加 ${finalTools.length} 个工具到 ${TOOLS_FILE}`)
  } else {
    // 全量覆盖
    const ts = generateToolsTS(finalTools)
    await fs.writeFile(TOOLS_FILE, ts, 'utf-8')
    console.log(`✅ 写入 ${finalTools.length} 个工具到 ${TOOLS_FILE}`)
  }

  console.log('\n🎉 完成！')
}

main().catch(err => {
  console.error('❌ 错误:', err.message)
  process.exit(1)
})
