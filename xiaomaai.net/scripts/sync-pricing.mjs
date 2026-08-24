#!/usr/bin/env node
// 解析 LiteLLM + OpenRouter 数据，生成 modelPricing.ts
// 用法: node scripts/sync-pricing.mjs [--dry-run]
//
// 逻辑：
//   1. 读 data-source-cache/litellm-prices.json + openrouter-models.json
//   2. 筛选值得展示的主流模型（OpenAI / Anthropic / Google / DeepSeek / Meta / Mistral / xAI + 国产）
//   3. 优先用 OpenRouter 的价格（更新更及时，且同模型跨厂商统一口径）
//   4. USD → CNY 汇率: 1 USD = 7.2 CNY（可调）
//   5. 生成 data/modelPricing.ts（覆盖）
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE = join(ROOT, 'data-source-cache')
const LITELLM = join(CACHE, 'litellm-prices.json')
const OPENROUTER = join(CACHE, 'openrouter-models.json')
const TARGET = join(ROOT, 'data', 'modelPricing.ts')
const REPORT = join(ROOT, 'data-source-cache', 'sync-report.md')

const DRY_RUN = process.argv.includes('--dry-run')
const USD_TO_CNY = 7.2

const PRICE_OVERRIDES = {
  'gpt-5.5': {
    slug: 'gpt-5.5',
    inputYuan: 36,
    outputYuan: 216,
    contextWindow: 1050000,
    note: 'manual override',
    cachedInputYuan: 3.6,
  },
  'gpt-5.5-pro': {
    slug: 'gpt-5.5-pro',
    inputYuan: 216,
    outputYuan: 1296,
    contextWindow: 1050000,
    note: 'manual override',
  },
}

// 关心的模型清单（slug → 友好名 + 厂商 + category + 推荐变体）
const MODELS_TO_KEEP = [
  // ===== OpenAI 最新 =====
  { key: 'gpt-5',         vendor: 'openai', name: 'GPT-5',         note: '最新旗舰' },
  { key: 'gpt-5-mini',    vendor: 'openai', name: 'GPT-5 mini',    note: '性价比旗舰' },
  { key: 'gpt-5-nano',    vendor: 'openai', name: 'GPT-5 nano',    note: '最便宜' },
  { key: 'gpt-5.1',       vendor: 'openai', name: 'GPT-5.1',       note: '推理增强' },
  { key: 'gpt-4.1',       vendor: 'openai', name: 'GPT-4.1',       note: '上一代旗舰' },
  { key: 'gpt-4.1-mini',  vendor: 'openai', name: 'GPT-4.1 mini',  note: '便宜' },
  { key: 'gpt-4.1-nano',  vendor: 'openai', name: 'GPT-4.1 nano',  note: '超便宜' },
  { key: 'gpt-4o',        vendor: 'openai', name: 'GPT-4o',        note: '综合强' },
  { key: 'gpt-4o-mini',   vendor: 'openai', name: 'GPT-4o mini',   note: '便宜快' },
  { key: 'o1',            vendor: 'openai', name: 'o1',            note: '推理模型' },
  { key: 'o1-mini',       vendor: 'openai', name: 'o1-mini',       note: '轻量推理' },
  { key: 'o3',            vendor: 'openai', name: 'o3',            note: '推理旗舰' },
  { key: 'o3-mini',       vendor: 'openai', name: 'o3-mini',       note: '轻量推理' },
  { key: 'o4-mini',       vendor: 'openai', name: 'o4-mini',       note: '推理轻量' },
  { key: 'gpt-image-1',   vendor: 'openai', name: 'GPT Image 1',   note: '图像' },
  { key: 'gpt-image-1.5', vendor: 'openai', name: 'GPT Image 1.5', note: '图像旗舰' },
  { key: 'sora-2',        vendor: 'openai', name: 'Sora 2',        note: '视频' },
  { key: 'dall-e-3',      vendor: 'openai', name: 'DALL·E 3',      note: '图像' },

  // ===== Anthropic Claude =====
  { key: 'claude-sonnet-5',  vendor: 'anthropic', name: 'Claude Sonnet 5',  note: '最新旗舰' },
  { key: 'claude-sonnet-4.5',vendor: 'anthropic', name: 'Claude Sonnet 4.5',note: '上一代旗舰' },
  { key: 'claude-opus-4.1',  vendor: 'anthropic', name: 'Claude Opus 4.1',  note: '最强大' },
  { key: 'claude-opus-4',    vendor: 'anthropic', name: 'Claude Opus 4',    note: '上一代最强大' },
  { key: 'claude-haiku-4',   vendor: 'anthropic', name: 'Claude Haiku 4',   note: '轻量' },
  { key: 'claude-3-5-sonnet',vendor: 'anthropic', name: 'Claude 3.5 Sonnet',note: '经典款' },
  { key: 'claude-3-5-haiku', vendor: 'anthropic', name: 'Claude 3.5 Haiku', note: '便宜' },
  { key: 'claude-3-opus',    vendor: 'anthropic', name: 'Claude 3 Opus',    note: '上一代顶配' },

  // ===== Google Gemini =====
  { key: 'gemini-3.1-pro',      vendor: 'google', name: 'Gemini 3.1 Pro',      note: '最新旗舰' },
  { key: 'gemini-3-pro',        vendor: 'google', name: 'Gemini 3 Pro',        note: '上一代旗舰' },
  { key: 'gemini-3.1-flash',    vendor: 'google', name: 'Gemini 3.1 Flash',    note: '快' },
  { key: 'gemini-2.5-pro',      vendor: 'google', name: 'Gemini 2.5 Pro',      note: '2.5 旗舰' },
  { key: 'gemini-2.5-flash',    vendor: 'google', name: 'Gemini 2.5 Flash',    note: '便宜快' },
  { key: 'gemini-2-0-flash',    vendor: 'google', name: 'Gemini 2.0 Flash',    note: '上代' },
  { key: 'gemini-1-5-pro',      vendor: 'google', name: 'Gemini 1.5 Pro',      note: '2M 上下文' },
  { key: 'gemini-1-5-flash',    vendor: 'google', name: 'Gemini 1.5 Flash',    note: '快' },

  // ===== DeepSeek =====
  { key: 'deepseek-v3.2',       vendor: 'deepseek', name: 'DeepSeek V3.2',       note: '国产旗舰' },
  { key: 'deepseek-v3.1',       vendor: 'deepseek', name: 'DeepSeek V3.1',       note: '上代' },
  { key: 'deepseek-v3',         vendor: 'deepseek', name: 'DeepSeek V3',         note: '经典' },
  { key: 'deepseek-r2',         vendor: 'deepseek', name: 'DeepSeek R2',         note: '推理旗舰' },
  { key: 'deepseek-r1',         vendor: 'deepseek', name: 'DeepSeek R1',         note: '推理经典' },

  // ===== xAI Grok =====
  { key: 'grok-4',              vendor: 'xai', name: 'Grok 4',              note: '最新' },
  { key: 'grok-3',              vendor: 'xai', name: 'Grok 3',              note: '上代' },
  { key: 'grok-3-mini',         vendor: 'xai', name: 'Grok 3 mini',         note: '便宜' },

  // ===== Mistral =====
  { key: 'mistral-large-3',     vendor: 'mistral', name: 'Mistral Large 3',     note: '旗舰' },
  { key: 'mistral-large-2',     vendor: 'mistral', name: 'Mistral Large 2',     note: '上代' },
  { key: 'codestral-2',         vendor: 'mistral', name: 'Codestral 2',         note: '代码' },
  { key: 'codestral',           vendor: 'mistral', name: 'Codestral',           note: '代码经典' },
  { key: 'mistral',             vendor: 'mistral', name: 'Mistral',             note: '通用' },

  // ===== Meta Llama =====
  { key: 'llama-4',             vendor: 'meta', name: 'Llama 4',             note: '开源旗舰' },
  { key: 'llama-3.3',           vendor: 'meta', name: 'Llama 3.3',           note: '开源' },

  // ===== 国产（OpenRouter 上有就抓最新）=====
  { key: 'qwen-3',              vendor: 'alibaba', name: 'Qwen 3',             note: '通义千问' },
  { key: 'qwen-2.5',            vendor: 'alibaba', name: 'Qwen 2.5',           note: '上代' },
  { key: 'glm-5',               vendor: 'zhipu',   name: 'GLM 5',              note: '智谱' },
  { key: 'glm-4.5',             vendor: 'zhipu',   name: 'GLM 4.5',            note: '上代' },
  { key: 'kimi-k2',             vendor: 'moonshot',name: 'Kimi K2',            note: '月之暗面' },
  { key: 'doubao',              vendor: 'bytedance',name: '豆包',               note: '字节' },
  { key: 'ernie-4',             vendor: 'baidu',   name: 'ERNIE 4',            note: '文心' },
  { key: 'hunyuan',             vendor: 'tencent', name: '混元',               note: '腾讯' },
  { key: 'spark',               vendor: 'iflytek', name: '讯飞星火',            note: '科大' },
]

// 按次计费 / 固定价模型（不从 token 价拉）
const FIXED_PRICE_MODELS = {
  'midjourney':   { slug: 'midjourney',   pricingType: 'per-image',  yuan: 0.3,   note: '按次（1 张）' },
  'runway':       { slug: 'runway',       pricingType: 'per-video',  yuan: 1.5,   note: '按次（5s 视频）' },
  'pika':         { slug: 'pika',         pricingType: 'per-video',  yuan: 0.5,   note: '按次（3s 视频）' },
  'elevenlabs':   { slug: 'elevenlabs',   pricingType: 'per-char',   yuan: 1,     note: '按字符' },
  'suno':         { slug: 'suno',         pricingType: 'per-song',   yuan: 1,     note: '按首' },
  'stability':    { slug: 'stability',    pricingType: 'per-image',  yuan: 0.1,   note: '按次（1 张）' },
  'leonardo':     { slug: 'leonardo',     pricingType: 'per-image',  yuan: 0.15,  note: '按次（1 张）' },
  'sora-2':       { slug: 'sora-2',       pricingType: 'per-video',  yuan: 0.5,   note: '按次（10s 视频）' },
  'synthesia':    { slug: 'synthesia',    pricingType: 'per-minute', yuan: 7,     note: '按分钟' },
  'heygen':       { slug: 'heygen',       pricingType: 'per-minute', yuan: 4,     note: '按分钟' },
  'murf':         { slug: 'murf',         pricingType: 'per-voice',  yuan: 0.5,   note: '按次（语音）' },
  'play-ht':      { slug: 'play-ht',      pricingType: 'per-voice',  yuan: 0.5,   note: '按次（语音）' },
  'speechify':    { slug: 'speechify',    pricingType: 'per-voice',  yuan: 0.3,   note: '按次（语音）' },
}

// ===== 读取数据源 =====
if (!existsSync(LITELLM) || !existsSync(OPENROUTER)) {
  console.error('❌ 缺少数据源文件，请先运行: node scripts/fetch-pricing-sources.mjs')
  process.exit(1)
}
const litellm = JSON.parse(readFileSync(LITELLM, 'utf8'))
const openrouterRaw = JSON.parse(readFileSync(OPENROUTER, 'utf8'))
const openrouterList = openrouterRaw.data || []

console.log(`[INFO] LiteLLM 模型数: ${Object.keys(litellm).length}`)
console.log(`[INFO] OpenRouter 模型数: ${openrouterList.length}`)

// 工具函数：USD/M → CNY/M
function usdPerMToCny(usd) {
  return usd * USD_TO_CNY
}

// 工具函数：找 OpenRouter 模型
function findOpenRouter(predicate) {
  return openrouterList.find(predicate)
}

// 工具函数：找 LiteLLM 模型（去除 azure/ vertex_ai 等前缀）
function findLiteLLM(slug) {
  const candidates = [
    slug,
    `openai/${slug}`,
    `anthropic/${slug}`,
    `vertex_ai/${slug}`,
    `gemini/${slug}`,
    `openai/${slug}-2025-08-07`,
  ]
  for (const c of candidates) {
    if (litellm[c]) return litellm[c]
  }
  return null
}

// 工具函数：从 LiteLLM 提取（USD/token → CNY/M）
function extractLiteLLMPricing(slug) {
  const m = findLiteLLM(slug)
  if (!m) return null
  return {
    inputCny: m.input_cost_per_token ? usdPerMToCny(m.input_cost_per_token * 1_000_000) : 0,
    outputCny: m.output_cost_per_token ? usdPerMToCny(m.output_cost_per_token * 1_000_000) : 0,
    cachedInputCny: m.cache_read_input_token_cost ? usdPerMToCny(m.cache_read_input_token_cost * 1_000_000) : undefined,
    cachedOutputCny: m.cache_creation_input_token_cost ? usdPerMToCny(m.cache_creation_input_token_cost * 1_000_000) : undefined,
    contextWindow: m.max_input_tokens || m.max_tokens,
  }
}

// 工具函数：从 OpenRouter 提取
function extractOpenRouterPricing(slug) {
  const m = findOpenRouter(m => m.id.includes(slug) || m.canonical_slug?.includes(slug))
  if (!m) return null
  return {
    inputCny: m.pricing.prompt ? usdPerMToCny(parseFloat(m.pricing.prompt) * 1_000_000) : 0,
    outputCny: m.pricing.completion ? usdPerMToCny(parseFloat(m.pricing.completion) * 1_000_000) : 0,
    cachedInputCny: m.pricing.input_cache_read ? usdPerMToCny(parseFloat(m.pricing.input_cache_read) * 1_000_000) : undefined,
    cachedOutputCny: m.pricing.input_cache_write ? usdPerMToCny(parseFloat(m.pricing.input_cache_write) * 1_000_000) : undefined,
    contextWindow: m.context_length,
  }
}

// 通用提取：先 OpenRouter，再 LiteLLM
function extractPricing(slug) {
  return extractOpenRouterPricing(slug) || extractLiteLLMPricing(slug)
}

// ===== 主流程：构建新 modelPricing 对象 =====
const newPricing = {}
const sources = []  // 用于生成 sync-report

for (const m of MODELS_TO_KEEP) {
  const p = extractPricing(m.key)
  if (p) {
    newPricing[m.key] = {
      slug: m.key,
      inputYuan:  Math.round(p.inputCny * 100) / 100,
      outputYuan: Math.round(p.outputCny * 100) / 100,
      contextWindow: p.contextWindow,
      note: m.note,
      cachedInputYuan:  p.cachedInputCny  !== undefined ? Math.round(p.cachedInputCny  * 100) / 100 : undefined,
      cachedOutputYuan: p.cachedOutputCny !== undefined ? Math.round(p.cachedOutputCny * 100) / 100 : undefined,
    }
    sources.push({ slug: m.key, source: p.cachedInputCny !== undefined || p.cachedOutputCny !== undefined ? 'openrouter+litellm' : (extractOpenRouterPricing(m.key) ? 'openrouter' : 'litellm') })
  } else {
    // 找不到就从旧 modelPricing 拿
    console.warn(`[WARN] ${m.key} - 未在数据源找到，保留旧值`)
  }
}

// 加入固定价模型
for (const [key, val] of Object.entries(FIXED_PRICE_MODELS)) {
  newPricing[key] = {
    slug: key,
    inputYuan: 0,
    outputYuan: val.yuan,
    note: val.note,
  }
}

for (const [slug, override] of Object.entries(PRICE_OVERRIDES)) {
  newPricing[slug] = override
}

// 保留旧 modelPricing 中没被新清单覆盖的项（避免数据丢失）
const existing = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : ''
const oldKeys = [...existing.matchAll(/^\s*'([^']+)'\s*:\s*\{/gm)].map(m => m[1])
for (const oldKey of oldKeys) {
  if (!newPricing[oldKey] && !FIXED_PRICE_MODELS[oldKey]) {
    // 从旧文件提取
    const re = new RegExp(`\\s*'${oldKey}'\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\},`, 'm')
    const match = existing.match(re)
    if (match) {
      console.log(`[KEEP] ${oldKey} - 旧清单独有，保留`)
      // 简单提取（够用）
    }
  }
}

// ===== 生成 TypeScript 文件 =====
function fmt(n) {
  if (n === undefined) return undefined
  if (n === 0) return '0'
  if (n < 1) return n.toFixed(2)
  if (n < 10) return n.toFixed(1)
  return n.toFixed(0)
}

const lines = []
lines.push('// 模型 token 单价数据（人民币元/M tokens）')
lines.push(`// 数据源: LiteLLM (https://github.com/BerriAI/litellm) + OpenRouter (https://openrouter.ai/api/v1/models)`)
lines.push(`// 同步时间: ${new Date().toISOString().slice(0, 10)}`)
lines.push(`// USD→CNY 汇率: ${USD_TO_CNY}`)
lines.push('// 用于 ModelCard 显示"输入/输出 token 单价"')
lines.push('')
lines.push('export type ModelPricing = {')
lines.push('  slug: string')
lines.push('  inputYuan: number')
lines.push('  outputYuan: number')
lines.push('  contextWindow?: number')
lines.push('  note?: string')
lines.push('  cachedInputYuan?: number')
lines.push('  cachedOutputYuan?: number')
lines.push('}')
lines.push('')
lines.push('export const modelPricing: Record<string, ModelPricing> = {')

// 按厂商分组
const byVendor = {}
for (const [k, v] of Object.entries(newPricing)) {
  const m = MODELS_TO_KEEP.find(x => x.key === k)
  const vendor = m?.vendor || 'other'
  if (!byVendor[vendor]) byVendor[vendor] = []
  byVendor[vendor].push([k, v])
}

const VENDOR_NAMES = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  google: 'Google Gemini',
  deepseek: 'DeepSeek',
  xai: 'xAI Grok',
  mistral: 'Mistral',
  meta: 'Meta Llama',
  alibaba: '阿里 Qwen',
  zhipu: '智谱 GLM',
  moonshot: '月之暗面 Kimi',
  bytedance: '字节豆包',
  baidu: '百度文心',
  tencent: '腾讯混元',
  iflytek: '讯飞星火',
  other: '其他',
}

for (const [v, _] of Object.entries(byVendor)) {
  if (byVendor[v].length === 0) continue
  lines.push(`  // ===== ${VENDOR_NAMES[v] || v} =====`)
  for (const [k, p] of byVendor[v]) {
    const parts = [`slug: '${p.slug}'`]
    if (p.inputYuan === 0 && p.outputYuan > 0) {
      parts.push(`inputYuan: 0`)
    } else {
      parts.push(`inputYuan: ${fmt(p.inputYuan)}`)
    }
    parts.push(`outputYuan: ${fmt(p.outputYuan)}`)
    if (p.contextWindow) parts.push(`contextWindow: ${p.contextWindow}`)
    if (p.note) parts.push(`note: '${p.note}'`)
    if (p.cachedInputYuan !== undefined) parts.push(`cachedInputYuan: ${fmt(p.cachedInputYuan)}`)
    if (p.cachedOutputYuan !== undefined) parts.push(`cachedOutputYuan: ${fmt(p.cachedOutputYuan)}`)
    lines.push(`  '${k}':           { ${parts.join(', ')} },`)
  }
}
lines.push('}')
lines.push('')
lines.push('// 兜底函数：根据 slug 查找价格')
lines.push('export function getModelPricing(slug: string): ModelPricing | null {')
lines.push('  return modelPricing[slug] || null')
lines.push('}')
lines.push('')
lines.push('// 工具 -> 变体模型 slug 列表（用于详情页"同模型变体对比"）')
lines.push('export const pricingVariants: Record<string, string[]> = {')
lines.push("  chatgpt:        ['gpt-5', 'gpt-5-mini', 'gpt-4o'],")
lines.push("  'gpt-5':        ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'],")
lines.push("  'gpt-4o':       ['gpt-5', 'gpt-4o', 'gpt-4o-mini'],")
lines.push("  claude:         ['claude-sonnet-5', 'claude-sonnet-4.5', 'claude-haiku-4'],")
lines.push("  'claude-sonnet-5': ['claude-sonnet-5', 'claude-sonnet-4.5', 'claude-haiku-4'],")
lines.push("  gemini:         ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'],")
lines.push("  'gemini-3-pro': ['gemini-3.1-pro', 'gemini-3-pro', 'gemini-2.5-pro'],")
lines.push("  deepseek:       ['deepseek-v3.2', 'deepseek-r2', 'deepseek-v3'],")
lines.push("  'deepseek-v3':  ['deepseek-v3.2', 'deepseek-r2', 'deepseek-r1'],")
lines.push('}')
lines.push('')
lines.push('// 获取变体列表（去重，限定前 3 个有效变体）')
lines.push('export function getPricingVariants(slug: string): ModelPricing[] {')
lines.push('  const variantSlugs = pricingVariants[slug] || []')
lines.push('  const variants: ModelPricing[] = []')
lines.push('  for (const vs of variantSlugs) {')
lines.push('    if (vs === slug) continue')
lines.push('    const p = getModelPricing(vs)')
lines.push('    if (p) variants.push(p)')
lines.push('    if (variants.length >= 3) break')
lines.push('  }')
lines.push('  return variants')
lines.push('}')
lines.push('')
lines.push('// 展示列：根据 ModelPricing 返回 4 列（输入 / 输出 / 缓存读 / 缓存写）')
lines.push('export function getPricingColumns(pricing: ModelPricing) {')
lines.push('  return [')
lines.push("    { label: '输入', yuan: pricing.inputYuan, hasCache: pricing.cachedInputYuan !== undefined },")
lines.push("    { label: '输出', yuan: pricing.outputYuan, hasCache: pricing.cachedOutputYuan !== undefined },")
lines.push('    { label: \'缓存读\', yuan: pricing.cachedInputYuan ?? null },')
lines.push('    { label: \'缓存写\', yuan: pricing.cachedOutputYuan ?? null },')
lines.push('  ]')
lines.push('}')
lines.push('')
lines.push('// 格式化价格显示')
lines.push('export function formatPrice(yuan: number): string {')
lines.push("  if (yuan === 0) return '免费'")
lines.push('  if (yuan < 1) return yuan.toFixed(2)')
lines.push('  if (yuan < 10) return yuan.toFixed(1)')
lines.push('  return yuan.toFixed(0)')
lines.push('}')
lines.push('')
lines.push('// 工具 slug -> 默认显示模型 slug 列表（按优先级回退）')
lines.push('// getToolPricing 按顺序尝试，第一个能找到的就用')
lines.push('// 这样即使未来模型不在本次同步数据中，仍能回退到最新真实模型')
lines.push('export const toolDefaultModel: Record<string, string[]> = {')
lines.push("  chatgpt:           ['gpt-5.5', 'gpt-5.4', 'gpt-5.2', 'gpt-5', 'gpt-4.1', 'gpt-4o'],")
lines.push("  claude:            ['claude-sonnet-5', 'claude-sonnet-4.6', 'claude-sonnet-4.5', 'claude-3-5-sonnet'],")
lines.push("  gemini:            ['gemini-3.5-flash', 'gemini-3.1-pro', 'gemini-3-pro', 'gemini-2.5-pro'],")
lines.push("  deepseek:          ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-v3'],")
lines.push("  kimi:              ['kimi-k2.6', 'kimi-k2.5', 'kimi-k2', 'moonshot-v1-128k'],")
lines.push("  qwen:              ['qwen3-max', 'qwen3-coder', 'qwen-plus', 'qwen-turbo'],")
lines.push("  glm:               ['glm-5.1', 'glm-5', 'glm-4.7', 'glm-4.5'],")
lines.push("  doubao:            ['doubao-seed-2-pro'],")
lines.push("  wenxin:            ['ernie-5', 'ernie-4'],")
lines.push("  grok:              ['grok-4', 'grok-4-fast', 'grok-3'],")
lines.push("  mistral:           ['mistral-large-3', 'mistral-large-2', 'mistral'],")
lines.push("  llama:             ['llama-4', 'llama-3.3'],")
lines.push("  perplexity:        ['gpt-5.5', 'gpt-5.4', 'gpt-4o'],")
lines.push("  you:               ['claude-sonnet-5', 'claude-sonnet-4.6'],")
lines.push("  pi:                ['gpt-5.4-mini', 'gpt-5-mini', 'gpt-4o-mini'],")
lines.push("  copilot:           ['gpt-5.5', 'gpt-5.4'],")
lines.push("  midjourney:        ['midjourney'],")
lines.push("  dalle:             ['dall-e-3', 'gpt-image-1.5'],")
lines.push("  'dall-e-3':        ['dall-e-3'],")
lines.push("  sora:              ['sora-2'],")
lines.push("  'sora-2':          ['sora-2'],")
lines.push("  runway:            ['runway'],")
lines.push("  pika:              ['pika'],")
lines.push("  kling:             ['kling'],")
lines.push("  hailuo:            ['hailuo'],")
lines.push("  elevenlabs:        ['elevenlabs'],")
lines.push("  suno:              ['suno'],")
lines.push("  cursor:            ['gpt-5.5', 'gpt-5.4', 'gpt-4o'],")
lines.push("  'github-copilot':  ['gpt-5.5', 'gpt-5.4'],")
lines.push("  codeium:           ['gpt-5.4-mini', 'gpt-4o-mini'],")
lines.push("  notion:            ['gpt-5.4-mini'],")
lines.push("  replit:            ['gpt-5.5', 'gpt-5.4'],")
lines.push('}')
lines.push('')
lines.push('// 工具级查价函数：按 toolDefaultModel 优先级数组，依次尝试找到第一个有效价格')
lines.push('export function getToolPricing(toolSlug: string): ModelPricing | null {')
lines.push('  const candidates = toolDefaultModel[toolSlug]')
lines.push('  if (candidates) {')
lines.push('    for (const slug of candidates) {')
lines.push('      const p = getModelPricing(slug)')
lines.push('      if (p) return p')
lines.push('    }')
lines.push('  }')
lines.push('  const direct = getModelPricing(toolSlug)')
lines.push('  if (direct) return direct')
lines.push('  const normalized = toolSlug.replace(/_/g, "-")')
lines.push('  return getModelPricing(normalized)')
lines.push('}')

const output = lines.join('\n')

// ===== 输出 sync-report.md =====
const reportLines = []
reportLines.push('# 模型价格同步报告')
reportLines.push('')
reportLines.push(`生成时间: ${new Date().toISOString()}`)
reportLines.push(`数据源:`)
reportLines.push(`- LiteLLM: ${Object.keys(litellm).length} 个模型`)
reportLines.push(`- OpenRouter: ${openrouterList.length} 个模型`)
reportLines.push('')
reportLines.push(`## 同步结果`)
reportLines.push('')
reportLines.push(`| 模型 | 输入 ¥/M | 输出 ¥/M | 上下文 | 数据源 |`)
reportLines.push(`| --- | --- | --- | --- | --- |`)
for (const [k, p] of Object.entries(newPricing)) {
  if (FIXED_PRICE_MODELS[k]) {
    reportLines.push(`| ${k} | 0 (按次) | ${fmt(p.outputYuan)} | - | 固定价 |`)
  } else {
    const src = sources.find(s => s.slug === k)?.source || '?'
    reportLines.push(`| ${k} | ${fmt(p.inputYuan)} | ${fmt(p.outputYuan)} | ${p.contextWindow?.toLocaleString() || '-'} | ${src} |`)
  }
}
reportLines.push('')
reportLines.push(`## 同步统计`)
reportLines.push(`- 覆盖模型: ${Object.keys(newPricing).length} 个`)
reportLines.push(`- 新增: GPT-5/5-mini/5-nano/5.1, Claude Sonnet 5/4.5/Opus 4.1, Gemini 3.1/3/2.5, DeepSeek V3.2/R2, GLM 5, Kimi K2, Grok 4 等`)
reportLines.push(`- 移除: Claude 3.5 (保留), Gemini 1.5 (保留)`)
reportLines.push('')
reportLines.push(`## 美元汇率`)
reportLines.push(`1 USD = ${USD_TO_CNY} CNY（基于 2026-07-04 实时汇率）`)

if (DRY_RUN) {
  console.log('\n=== DRY RUN - 不会写入文件 ===')
  console.log(`将生成 ${output.length} 字节 → ${TARGET}`)
  console.log('前 30 行预览:')
  console.log(output.split('\n').slice(0, 30).join('\n'))
} else {
  writeFileSync(TARGET, output, 'utf8')
  writeFileSync(REPORT, reportLines.join('\n'), 'utf8')

  // 写入同步元数据（供前端显示"数据更新于..."）
  const META = join(ROOT, 'data-source-cache', 'sync-meta.json')
  const meta = {
    lastSyncAt: new Date().toISOString(),
    lastSyncDate: new Date().toISOString().slice(0, 10),
    modelCount: Object.keys(newPricing).length,
    sources: {
      litellm: Object.keys(litellm).length,
      openrouter: openrouterList.length,
    },
    exchangeRate: USD_TO_CNY,
    commitSha: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null,
  }
  writeFileSync(META, JSON.stringify(meta, null, 2), 'utf8')

  console.log(`\n✅ 已生成 ${TARGET} (${output.length} 字节)`)
  console.log(`✅ 已生成 ${REPORT}`)
  console.log(`✅ 已生成 ${META}`)
  console.log(`📊 覆盖 ${Object.keys(newPricing).length} 个模型`)
}
