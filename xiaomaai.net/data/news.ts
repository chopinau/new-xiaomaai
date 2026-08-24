export interface NewsItem {
  id: string
  date: string // YYYY-MM-DD
  title: string
  summary: string
  category: 'llm' | 'opensource' | 'business' | 'funding'
  source: string
  url: string
}

export const NEWS_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'llm', label: '大模型' },
  { key: 'opensource', label: '开源' },
  { key: 'business', label: '商业' },
  { key: 'funding', label: '融资' },
] as const

export const newsItems: NewsItem[] = [
  {
    id: '1',
    date: '2026-07-21',
    title: 'OpenAI 正式发布 GPT-5.5，上下文窗口扩展至 256K',
    summary: 'GPT-5.5 在推理、数学和代码能力上全面超越 GPT-5，推理速度提升 2.5 倍，输入价格 ¥36/M tokens，输出 ¥216/M tokens，支持 256K 上下文窗口和原生多模态。',
    category: 'llm',
    source: 'OpenAI Blog',
    url: 'https://openai.com/blog',
  },
  {
    id: '2',
    date: '2026-07-20',
    title: 'Anthropic 推出 Claude Sonnet 5，长文本理解再创新高',
    summary: 'Claude Sonnet 5 支持 1M tokens 上下文，在复杂推理、专业写作和代码生成方面表现优异，输入 ¥14/M tokens，输出 ¥72/M tokens，Artifacts 功能全面升级。',
    category: 'llm',
    source: 'Anthropic Blog',
    url: 'https://www.anthropic.com/blog',
  },
  {
    id: '3',
    date: '2026-07-18',
    title: 'DeepSeek V4 Pro 正式开源，MIT 协议 + 1M 上下文',
    summary: 'DeepSeek V4 Pro 采用 MIT 开源协议发布，1M 上下文窗口，输入 ¥3.1/M tokens，输出 ¥6.3/M tokens。在 MMLU-Pro、HumanEval 等基准测试中与 GPT-5.4 持平，成为性价比最高的开源模型。',
    category: 'opensource',
    source: 'DeepSeek Blog',
    url: 'https://api-docs.deepseek.com',
  },
  {
    id: '4',
    date: '2026-07-17',
    title: 'Google 发布 Gemini 3.5 Flash，速度提升 3 倍',
    summary: 'Gemini 3.5 Flash 在保持 1M 上下文的同时，推理速度提升 3 倍，输入价格仅 ¥11/M tokens，输出 ¥65/M tokens。原生支持视频、音频、图像多模态输入，Search Grounding 功能全面升级。',
    category: 'llm',
    source: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/',
  },
  {
    id: '5',
    date: '2026-07-15',
    title: 'Meta 发布 Llama 4 系列，开源模型再添劲旅',
    summary: 'Meta Llama 4 包含 8B、70B、405B 三个版本，全部开源。405B 版本在多项基准测试中接近 GPT-5.4 水平，支持多语言和代码生成，采用 Apache 2.0 协议。',
    category: 'opensource',
    source: 'Meta AI Blog',
    url: 'https://ai.meta.com/blog',
  },
  {
    id: '6',
    date: '2026-07-14',
    title: 'xAI 发布 Grok 4，Elon Musk 称其为「最强推理模型」',
    summary: 'Grok 4 在数学、科学和代码推理方面表现突出，支持 1M 上下文，集成 X 平台实时数据。xAI 宣布 Grok 4 已向 X Premium+ 用户全面开放。',
    category: 'llm',
    source: 'xAI Blog',
    url: 'https://x.ai/blog',
  },
  {
    id: '7',
    date: '2026-07-12',
    title: '月之暗面 Kimi K2.6 发布，262K 上下文 + 多模态',
    summary: 'Kimi K2.6 在长文档理解、多轮对话和工具调用方面大幅提升，支持 262K 上下文，输入 ¥6.8/M tokens，输出 ¥29/M tokens。新增原生图片理解和代码解释器，API 已全面开放。',
    category: 'business',
    source: 'Moonshot AI',
    url: 'https://kimi.moonshot.cn',
  },
  {
    id: '8',
    date: '2026-07-10',
    title: '智谱发布 GLM-5.1，200K 上下文 + 工具调用能力跃升',
    summary: 'GLM-5.1 在 Agent 任务和工具调用方面大幅增强，支持 200K 上下文，性能对标 GPT-5.4。同步开源 GLM-5.1-9B 和 32B 版本，推动国产开源生态发展。',
    category: 'opensource',
    source: '智谱 AI Blog',
    url: 'https://open.bigmodel.cn',
  },
  {
    id: '9',
    date: '2026-07-09',
    title: '阿里通义千问 Qwen3-Max 发布，多模态能力全面领先',
    summary: 'Qwen3-Max 在图像理解、视频分析和文档识别方面达到新高度，支持 1M 上下文。阿里云宣布 Qwen3-Max API 价格下调 60%，输入 ¥1.4/M tokens，输出 ¥5.6/M tokens，成为最具性价比的多模态模型。',
    category: 'business',
    source: '阿里云通义千问',
    url: 'https://tongyi.aliyun.com',
  },
  {
    id: '10',
    date: '2026-07-07',
    title: 'Mistral AI 发布 Large 3，欧洲最强开源大模型',
    summary: 'Mistral Large 3 采用 123B 参数 MoE 架构，在代码生成、多语言和长文本任务上表现优异，输入 ¥7.2/M tokens，输出 ¥22/M tokens。同步开源 Mistral 3 Small 24B，推动欧洲 AI 生态。',
    category: 'opensource',
    source: 'Mistral AI Blog',
    url: 'https://mistral.ai/news',
  },
  {
    id: '11',
    date: '2026-07-05',
    title: 'AI 基础设施融资再创新高：CoreWeave 获 86 亿美元融资',
    summary: 'AI 云服务商 CoreWeave 完成 86 亿美元新一轮融资，估值超过 350 亿美元。此次融资将用于扩建数据中心和采购 NVIDIA B200 GPU，满足全球 AI 推理需求激增。',
    category: 'funding',
    source: 'TechCrunch',
    url: 'https://techcrunch.com',
  },
  {
    id: '12',
    date: '2026-07-02',
    title: '字节跳动 Seed 2 Pro 发布，豆包 DAU 突破 8000 万',
    summary: 'Seed 2 Pro 支持 256K 上下文，在中文理解和创意写作方面保持领先。字节跳动宣布豆包 App 日活突破 8000 万，成为中国用户量最大的 AI 助手，同步开放 Seed 2 Pro API 内测。',
    category: 'business',
    source: '字节跳动技术博客',
    url: 'https://www.volcengine.com',
  },
  {
    id: '13',
    date: '2026-07-01',
    title: 'Anthropic 完成 75 亿美元 E 轮融资，估值突破 600 亿',
    summary: 'Anthropic 完成由 Google、Salesforce 等领投的 75 亿美元 E 轮融资，估值达 615 亿美元。资金将用于 Claude 模型研发、全球扩张和安全研究，进一步挑战 OpenAI 的市场地位。',
    category: 'funding',
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com',
  },
]

export function getNewsByDate(): Map<string, NewsItem[]> {
  const grouped = new Map<string, NewsItem[]>()
  const sorted = [...newsItems].sort((a, b) => b.date.localeCompare(a.date))
  for (const item of sorted) {
    const existing = grouped.get(item.date) || []
    existing.push(item)
    grouped.set(item.date, existing)
  }
  return grouped
}

export function getNewsByCategory(category: string): NewsItem[] {
  if (category === 'all') return [...newsItems].sort((a, b) => b.date.localeCompare(a.date))
  return newsItems.filter((n) => n.category === category).sort((a, b) => b.date.localeCompare(a.date))
}

export function getRecentNews(limit = 5): NewsItem[] {
  return [...newsItems].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}