// 模型 token 单价数据（人民币元/M tokens）
// 数据源: LiteLLM (https://github.com/BerriAI/litellm) + OpenRouter (https://openrouter.ai/api/v1/models)
// 同步时间: 2026-08-30
// USD→CNY 汇率: 7.2
// 用于 ModelCard 显示"输入/输出 token 单价"

export type ModelPricing = {
  slug: string
  inputYuan: number
  outputYuan: number
  contextWindow?: number
  note?: string
  cachedInputYuan?: number
  cachedOutputYuan?: number
}

export const modelPricing: Record<string, ModelPricing> = {
  // ===== OpenAI =====
  'gpt-5':           { slug: 'gpt-5', inputYuan: 216, outputYuan: 1296, contextWindow: 1050000, note: '最新旗舰' },
  'gpt-5-mini':           { slug: 'gpt-5-mini', inputYuan: 1.8, outputYuan: 14, contextWindow: 400000, note: '性价比旗舰', cachedInputYuan: 0.18 },
  'gpt-5-nano':           { slug: 'gpt-5-nano', inputYuan: 0.36, outputYuan: 2.9, contextWindow: 400000, note: '最便宜', cachedInputYuan: 0.07 },
  'gpt-5.1':           { slug: 'gpt-5.1', inputYuan: 9.0, outputYuan: 72, contextWindow: 400000, note: '推理增强', cachedInputYuan: 0.90 },
  'gpt-4.1':           { slug: 'gpt-4.1', inputYuan: 14, outputYuan: 58, contextWindow: 1047576, note: '上一代旗舰', cachedInputYuan: 3.6 },
  'gpt-4.1-mini':           { slug: 'gpt-4.1-mini', inputYuan: 2.9, outputYuan: 12, contextWindow: 1047576, note: '便宜', cachedInputYuan: 0.72 },
  'gpt-4.1-nano':           { slug: 'gpt-4.1-nano', inputYuan: 0.72, outputYuan: 2.9, contextWindow: 1047576, note: '超便宜', cachedInputYuan: 0.18 },
  'gpt-4o':           { slug: 'gpt-4o', inputYuan: 1.1, outputYuan: 4.3, contextWindow: 128000, note: '综合强' },
  'gpt-4o-mini':           { slug: 'gpt-4o-mini', inputYuan: 1.1, outputYuan: 4.3, contextWindow: 128000, note: '便宜快' },
  'o1':           { slug: 'o1', inputYuan: 1080, outputYuan: 4320, contextWindow: 200000, note: '推理模型' },
  'o3':           { slug: 'o3', inputYuan: 72, outputYuan: 288, contextWindow: 200000, note: '推理旗舰', cachedInputYuan: 18 },
  'o3-mini':           { slug: 'o3-mini', inputYuan: 7.9, outputYuan: 32, contextWindow: 200000, note: '轻量推理', cachedInputYuan: 4.0 },
  'o4-mini':           { slug: 'o4-mini', inputYuan: 14, outputYuan: 58, contextWindow: 200000, note: '推理轻量', cachedInputYuan: 3.6 },
  'gpt-image-1':           { slug: 'gpt-image-1', inputYuan: 36, outputYuan: 0, note: '图像', cachedInputYuan: 9.0 },
  'gpt-image-1.5':           { slug: 'gpt-image-1.5', inputYuan: 36, outputYuan: 72, note: '图像旗舰', cachedInputYuan: 9.0 },
  'sora-2':           { slug: 'sora-2', inputYuan: 0, outputYuan: 0.50, note: '按次（10s 视频）' },
  'dall-e-3':           { slug: 'dall-e-3', inputYuan: 0, outputYuan: 0, note: '图像' },
  // ===== Anthropic Claude =====
  'claude-sonnet-5':           { slug: 'claude-sonnet-5', inputYuan: 14, outputYuan: 72, contextWindow: 1000000, note: '最新旗舰', cachedInputYuan: 1.4, cachedOutputYuan: 18 },
  'claude-sonnet-4.5':           { slug: 'claude-sonnet-4.5', inputYuan: 22, outputYuan: 108, contextWindow: 1000000, note: '上一代旗舰', cachedInputYuan: 2.2, cachedOutputYuan: 27 },
  'claude-opus-4.1':           { slug: 'claude-opus-4.1', inputYuan: 108, outputYuan: 540, contextWindow: 200000, note: '最强大', cachedInputYuan: 11, cachedOutputYuan: 135 },
  'claude-opus-4':           { slug: 'claude-opus-4', inputYuan: 72, outputYuan: 360, contextWindow: 1000000, note: '上一代最强大', cachedInputYuan: 7.2, cachedOutputYuan: 90 },
  'claude-haiku-4':           { slug: 'claude-haiku-4', inputYuan: 7.2, outputYuan: 36, contextWindow: 200000, note: '轻量', cachedInputYuan: 0.72, cachedOutputYuan: 9.0 },
  'claude-3-5-sonnet':           { slug: 'claude-3-5-sonnet', inputYuan: 22, outputYuan: 108, contextWindow: 200000, note: '经典款' },
  'claude-3-5-haiku':           { slug: 'claude-3-5-haiku', inputYuan: 7.2, outputYuan: 36, contextWindow: 200000, note: '便宜' },
  'claude-3-opus':           { slug: 'claude-3-opus', inputYuan: 108, outputYuan: 540, contextWindow: 200000, note: '上一代顶配' },
  // ===== Google Gemini =====
  'gemini-3.1-pro':           { slug: 'gemini-3.1-pro', inputYuan: 14, outputYuan: 86, contextWindow: 1048756, note: '最新旗舰', cachedInputYuan: 1.4, cachedOutputYuan: 2.7 },
  'gemini-3-pro':           { slug: 'gemini-3-pro', inputYuan: 14, outputYuan: 86, contextWindow: 65536, note: '上一代旗舰', cachedInputYuan: 1.4, cachedOutputYuan: 2.7 },
  'gemini-3.1-flash':           { slug: 'gemini-3.1-flash', inputYuan: 1.8, outputYuan: 11, contextWindow: 65536, note: '快' },
  'gemini-2.5-pro':           { slug: 'gemini-2.5-pro', inputYuan: 9.0, outputYuan: 72, contextWindow: 1048576, note: '2.5 旗舰', cachedInputYuan: 0.90, cachedOutputYuan: 2.7 },
  'gemini-2.5-flash':           { slug: 'gemini-2.5-flash', inputYuan: 2.2, outputYuan: 18, contextWindow: 32768, note: '便宜快', cachedInputYuan: 0.22, cachedOutputYuan: 0.60 },
  // ===== DeepSeek =====
  'deepseek-v3.2':           { slug: 'deepseek-v3.2', inputYuan: 1.6, outputYuan: 2.5, contextWindow: 131072, note: '国产旗舰', cachedInputYuan: 0.16 },
  'deepseek-v3.1':           { slug: 'deepseek-v3.1', inputYuan: 1.9, outputYuan: 6.8, contextWindow: 163840, note: '上代', cachedInputYuan: 0.94 },
  'deepseek-v3':           { slug: 'deepseek-v3', inputYuan: 1.6, outputYuan: 2.5, contextWindow: 131072, note: '经典', cachedInputYuan: 0.16 },
  'deepseek-r1':           { slug: 'deepseek-r1', inputYuan: 3.6, outputYuan: 15, contextWindow: 163840, note: '推理经典', cachedInputYuan: 2.5 },
  // ===== xAI Grok =====
  'grok-4':           { slug: 'grok-4', inputYuan: 9.0, outputYuan: 18, contextWindow: 1000000, note: '最新', cachedInputYuan: 1.4 },
  // ===== Mistral =====
  'mistral-large-2':           { slug: 'mistral-large-2', inputYuan: 3.6, outputYuan: 11, contextWindow: 262144, note: '上代', cachedInputYuan: 0.36 },
  'codestral-2':           { slug: 'codestral-2', inputYuan: 2.2, outputYuan: 6.5, contextWindow: 256000, note: '代码', cachedInputYuan: 0.22 },
  'codestral':           { slug: 'codestral', inputYuan: 2.2, outputYuan: 6.5, contextWindow: 256000, note: '代码经典', cachedInputYuan: 0.22 },
  'mistral':           { slug: 'mistral', inputYuan: 11, outputYuan: 54, contextWindow: 262144, note: '通用' },
  // ===== Meta Llama =====
  'llama-4':           { slug: 'llama-4', inputYuan: 1.1, outputYuan: 4.3, contextWindow: 1048576, note: '开源旗舰' },
  'llama-3.3':           { slug: 'llama-3.3', inputYuan: 2.9, outputYuan: 2.9, contextWindow: 131072, note: '开源' },
  // ===== 阿里 Qwen =====
  'qwen-2.5':           { slug: 'qwen-2.5', inputYuan: 4.8, outputYuan: 7.2, contextWindow: 128000, note: '上代' },
  // ===== 智谱 GLM =====
  'glm-5':           { slug: 'glm-5', inputYuan: 6.5, outputYuan: 21, contextWindow: 1048576, note: '智谱', cachedInputYuan: 1.2 },
  'glm-4.5':           { slug: 'glm-4.5', inputYuan: 4.3, outputYuan: 13, contextWindow: 65536, note: '上代', cachedInputYuan: 0.79 },
  // ===== 月之暗面 Kimi =====
  'kimi-k2':           { slug: 'kimi-k2', inputYuan: 5.3, outputYuan: 25, contextWindow: 262144, note: '月之暗面', cachedInputYuan: 1.1 },
  // ===== 百度文心 =====
  'ernie-4':           { slug: 'ernie-4', inputYuan: 3.0, outputYuan: 9.0, contextWindow: 131072, note: '文心' },
  // ===== 腾讯混元 =====
  'hunyuan':           { slug: 'hunyuan', inputYuan: 1.0, outputYuan: 4.1, contextWindow: 131072, note: '腾讯' },
  // ===== 其他 =====
  'midjourney':           { slug: 'midjourney', inputYuan: 0, outputYuan: 0.30, note: '按次（1 张）' },
  'runway':           { slug: 'runway', inputYuan: 0, outputYuan: 1.5, note: '按次（5s 视频）' },
  'pika':           { slug: 'pika', inputYuan: 0, outputYuan: 0.50, note: '按次（3s 视频）' },
  'elevenlabs':           { slug: 'elevenlabs', inputYuan: 0, outputYuan: 1.0, note: '按字符' },
  'suno':           { slug: 'suno', inputYuan: 0, outputYuan: 1.0, note: '按首' },
  'stability':           { slug: 'stability', inputYuan: 0, outputYuan: 0.10, note: '按次（1 张）' },
  'leonardo':           { slug: 'leonardo', inputYuan: 0, outputYuan: 0.15, note: '按次（1 张）' },
  'synthesia':           { slug: 'synthesia', inputYuan: 0, outputYuan: 7.0, note: '按分钟' },
  'heygen':           { slug: 'heygen', inputYuan: 0, outputYuan: 4.0, note: '按分钟' },
  'murf':           { slug: 'murf', inputYuan: 0, outputYuan: 0.50, note: '按次（语音）' },
  'play-ht':           { slug: 'play-ht', inputYuan: 0, outputYuan: 0.50, note: '按次（语音）' },
  'speechify':           { slug: 'speechify', inputYuan: 0, outputYuan: 0.30, note: '按次（语音）' },
  'gpt-5.5':           { slug: 'gpt-5.5', inputYuan: 36, outputYuan: 216, contextWindow: 1050000, note: 'manual override', cachedInputYuan: 3.6 },
  'gpt-5.5-pro':           { slug: 'gpt-5.5-pro', inputYuan: 216, outputYuan: 1296, contextWindow: 1050000, note: 'manual override' },
}

// 兜底函数：根据 slug 查找价格
export function getModelPricing(slug: string): ModelPricing | null {
  return modelPricing[slug] || null
}

// 工具 -> 变体模型 slug 列表（用于详情页"同模型变体对比"）
export const pricingVariants: Record<string, string[]> = {
  chatgpt:        ['gpt-5', 'gpt-5-mini', 'gpt-4o'],
  'gpt-5':        ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'],
  'gpt-4o':       ['gpt-5', 'gpt-4o', 'gpt-4o-mini'],
  claude:         ['claude-sonnet-5', 'claude-sonnet-4.5', 'claude-haiku-4'],
  'claude-sonnet-5': ['claude-sonnet-5', 'claude-sonnet-4.5', 'claude-haiku-4'],
  gemini:         ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  'gemini-3-pro': ['gemini-3.1-pro', 'gemini-3-pro', 'gemini-2.5-pro'],
  deepseek:       ['deepseek-v3.2', 'deepseek-r2', 'deepseek-v3'],
  'deepseek-v3':  ['deepseek-v3.2', 'deepseek-r2', 'deepseek-r1'],
}

// 获取变体列表（去重，限定前 3 个有效变体）
export function getPricingVariants(slug: string): ModelPricing[] {
  const variantSlugs = pricingVariants[slug] || []
  const variants: ModelPricing[] = []
  for (const vs of variantSlugs) {
    if (vs === slug) continue
    const p = getModelPricing(vs)
    if (p) variants.push(p)
    if (variants.length >= 3) break
  }
  return variants
}

// 展示列：根据 ModelPricing 返回 4 列（输入 / 输出 / 缓存读 / 缓存写）
export function getPricingColumns(pricing: ModelPricing) {
  return [
    { label: '输入', yuan: pricing.inputYuan, hasCache: pricing.cachedInputYuan !== undefined },
    { label: '输出', yuan: pricing.outputYuan, hasCache: pricing.cachedOutputYuan !== undefined },
    { label: '缓存读', yuan: pricing.cachedInputYuan ?? null },
    { label: '缓存写', yuan: pricing.cachedOutputYuan ?? null },
  ]
}

// 格式化价格显示
export function formatPrice(yuan: number): string {
  if (yuan === 0) return '免费'
  if (yuan < 1) return yuan.toFixed(2)
  if (yuan < 10) return yuan.toFixed(1)
  return yuan.toFixed(0)
}

// 工具 slug -> 默认显示模型 slug 列表（按优先级回退）
// getToolPricing 按顺序尝试，第一个能找到的就用
// 这样即使未来模型不在本次同步数据中，仍能回退到最新真实模型
export const toolDefaultModel: Record<string, string[]> = {
  chatgpt:           ['gpt-5.5', 'gpt-5.4', 'gpt-5.2', 'gpt-5', 'gpt-4.1', 'gpt-4o'],
  claude:            ['claude-sonnet-5', 'claude-sonnet-4.6', 'claude-sonnet-4.5', 'claude-3-5-sonnet'],
  gemini:            ['gemini-3.5-flash', 'gemini-3.1-pro', 'gemini-3-pro', 'gemini-2.5-pro'],
  deepseek:          ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-v3'],
  kimi:              ['kimi-k2.6', 'kimi-k2.5', 'kimi-k2', 'moonshot-v1-128k'],
  qwen:              ['qwen3-max', 'qwen3-coder', 'qwen-plus', 'qwen-turbo'],
  glm:               ['glm-5.1', 'glm-5', 'glm-4.7', 'glm-4.5'],
  doubao:            ['doubao-seed-2-pro'],
  wenxin:            ['ernie-5', 'ernie-4'],
  grok:              ['grok-4', 'grok-4-fast', 'grok-3'],
  mistral:           ['mistral-large-3', 'mistral-large-2', 'mistral'],
  llama:             ['llama-4', 'llama-3.3'],
  perplexity:        ['gpt-5.5', 'gpt-5.4', 'gpt-4o'],
  you:               ['claude-sonnet-5', 'claude-sonnet-4.6'],
  pi:                ['gpt-5.4-mini', 'gpt-5-mini', 'gpt-4o-mini'],
  copilot:           ['gpt-5.5', 'gpt-5.4'],
  midjourney:        ['midjourney'],
  dalle:             ['dall-e-3', 'gpt-image-1.5'],
  'dall-e-3':        ['dall-e-3'],
  sora:              ['sora-2'],
  'sora-2':          ['sora-2'],
  runway:            ['runway'],
  pika:              ['pika'],
  kling:             ['kling'],
  hailuo:            ['hailuo'],
  elevenlabs:        ['elevenlabs'],
  suno:              ['suno'],
  cursor:            ['gpt-5.5', 'gpt-5.4', 'gpt-4o'],
  'github-copilot':  ['gpt-5.5', 'gpt-5.4'],
  codeium:           ['gpt-5.4-mini', 'gpt-4o-mini'],
  notion:            ['gpt-5.4-mini'],
  replit:            ['gpt-5.5', 'gpt-5.4'],
}

// 工具级查价函数：按 toolDefaultModel 优先级数组，依次尝试找到第一个有效价格
export function getToolPricing(toolSlug: string): ModelPricing | null {
  const candidates = toolDefaultModel[toolSlug]
  if (candidates) {
    for (const slug of candidates) {
      const p = getModelPricing(slug)
      if (p) return p
    }
  }
  const direct = getModelPricing(toolSlug)
  if (direct) return direct
  const normalized = toolSlug.replace(/_/g, "-")
  return getModelPricing(normalized)
}