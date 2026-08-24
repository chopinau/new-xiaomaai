// =====================================================
// 视频提示词抓取脚本 (不调用 LLM,纯规则解析)
// 抓取公开 GitHub 仓库中的视频 AI 提示词(Sora / Veo / Kling / 可灵 / 即梦 / 海螺 / 豆包)
// 写入 prompts-raw.json 的 videoPrompts 字段
// 用法: node scripts/update-prompts-video.mjs
// =====================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const RAW_FILE = path.join(ROOT, '..', 'prompts-raw.json')
const VIDEO_PROMPTS_FILE = path.join(ROOT, 'data', 'prompts-video.ts')

const VIDEO_REPOS = [
  { repo: 'songguoxs/awesome-video-prompts', source: 'songguoxs' },
  { repo: 'zhangchenchen/awesome_sora2_prompt', source: 'zhangchenchen' },
  { repo: 'akirakai/awesome-veo3-videos', source: 'akirakai' },
  { repo: 'Fuuuuuji/awesome_sora', source: 'Fuuuuuji' },
  { repo: 'ai-boost/awesome-prompts', source: 'ai-boost' },
]

async function fetchReadme(repo) {
  const url = `https://api.github.com/repos/${repo}/readme`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3.raw',
      'User-Agent': 'xiaomaai-video-prompt-fetcher',
    },
  })
  if (!res.ok) {
    console.error(`  [skip] ${repo}: HTTP ${res.status}`)
    return null
  }
  return res.text()
}

// 解析 Markdown 风格的"案例 N：标题" → 提取 prompt
// 支持格式:
// ## 案例 1：监控摄像头写实风格
// **Prompt:**
// ```
// 实际内容
// ```
function parseVideoPromptsFromReadme(md, source, sourceUrl) {
  const prompts = []
  // 匹配形如 "## 案例 1：标题" 或 "### 1.1. Subtitle" 或 "## 1. Cinematic..."
  // 然后往下找到 ``` 代码块作为 prompt
  const sectionRe = /^(#{1,4})\s+(.+)$/gm
  const sections = []
  let m
  while ((m = sectionRe.exec(md)) !== null) {
    sections.push({ level: m[1].length, title: m[2].trim(), start: m.index + m[0].length })
  }
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]
    const body = md.slice(s.start, sections[i + 1]?.start || md.length)
    // 提取第一个 ``` 代码块
    const codeMatch = body.match(/```[\s\S]*?\n([\s\S]*?)```/)
    if (!codeMatch) continue
    let prompt = codeMatch[1].trim()
    if (prompt.length < 20) continue // 太短跳过
    // 标题去掉前导编号
    const title = s.title.replace(/^案例\s*\d+[：:.]\s*/, '').replace(/^\d+(\.\d+)*\.?\s*/, '').trim()
    if (!title) continue
    // 推断风格分类
    let category = '其他'
    if (/电影|写实|cinematic|镜头/i.test(title)) category = '电影感'
    else if (/动漫|动画|anime|animation|黏土/i.test(title)) category = '动漫'
    else if (/广告|commercial|品牌/i.test(title)) category = '广告'
    else if (/ASMR|asmr/i.test(title)) category = 'ASMR'
    else if (/开箱|unbox/i.test(title)) category = '开箱'
    else if (/游戏|gaming/i.test(title)) category = '游戏'
    else if (/Vlog|vlog|纪录/i.test(title)) category = '纪录'
    prompts.push({
      title: title.slice(0, 100),
      category,
      style: s.title.slice(0, 50),
      prompt: prompt.slice(0, 3000),
      source,
      sourceUrl,
    })
  }
  return prompts
}

async function main() {
  console.log('视频提示词抓取 - 启动\n')
  let allPrompts = []
  let id = 1
  for (const { repo, source } of VIDEO_REPOS) {
    console.log(`[fetch] ${repo}...`)
    const md = await fetchReadme(repo)
    if (!md) continue
    const sourceUrl = `https://github.com/${repo}`
    const list = parseVideoPromptsFromReadme(md, source, sourceUrl)
    console.log(`  → ${list.length} 条提示词`)
    for (const p of list) {
      p.id = id++
      allPrompts.push(p)
    }
  }

  console.log(`\n[summary] 共抓取 ${allPrompts.length} 条视频提示词`)

  if (allPrompts.length === 0) {
    console.log('[warn] 抓取结果为空,跳过写入')
    return
  }

  // 写入 prompts-raw.json
  let raw = { prompts: [], videoPrompts: [] }
  if (existsSync(RAW_FILE)) {
    try {
      raw = JSON.parse(readFileSync(RAW_FILE, 'utf-8'))
    } catch {}
  }
  // 去重(按 title + source)
  const seen = new Set()
  const merged = [...(raw.videoPrompts || []), ...allPrompts].filter((p) => {
    const k = `${p.title}|${p.source}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  raw.videoPrompts = merged
  writeFileSync(RAW_FILE, JSON.stringify(raw, null, 2), 'utf-8')
  console.log(`[write] prompts-raw.json → videoPrompts: ${merged.length} 条`)

  // 生成 data/prompts-video.ts
  const categories = Array.from(new Set(merged.map((p) => p.category))).sort()
  const js = `// =====================================================
// 视频提示词库 - ${merged.length} 条精选
// 数据来源: GitHub 公开仓库
//   - songguoxs/awesome-video-prompts
//   - zhangchenchen/awesome_sora2_prompt
//   - akirakai/awesome-veo3-videos
//   - Fuuuuuji/awesome_sora
//   - ai-boost/awesome-prompts
// 生成时间: ${new Date().toISOString()}
// 更新命令: node scripts/update-prompts-video.mjs
// =====================================================
export interface VideoPrompt {
  id: number
  category: string
  style: string
  title: string
  prompt: string
  source: string
  sourceUrl: string
  author: string
}

export const VIDEO_PROMPT_CATEGORIES: string[] = ['全部', ${categories.map((c) => `'${c}'`).join(', ')}]

export const videoPrompts: VideoPrompt[] = ${JSON.stringify(merged.map((p) => ({ ...p, author: '@community' })), null, 2)}
`
  writeFileSync(VIDEO_PROMPTS_FILE, js, 'utf-8')
  console.log(`[write] ${VIDEO_PROMPTS_FILE}`)
  console.log('\n[done]')
}

main().catch((e) => {
  console.error('[error]', e)
  process.exit(1)
})
