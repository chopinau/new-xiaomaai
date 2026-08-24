// 工作流模板元数据索引
// 详情内容在 data/workflows/[slug].md
// 列表页直接 import 此处元数据,详情页 fs.readFile 读 md

export interface WorkflowMeta {
  slug: string
  name: string
  price: string
  originalPrice?: string
  category: string
  cover: string
  externalUrl: string
  author: string
  sales: number
  rating: number
  tags: string[]
  description: string
  models?: string[]
  estimatedCost?: string
}

export const workflows: WorkflowMeta[] = [
  {
    slug: 'writer-xiaohongshu',
    name: '小红书爆款写手',
    price: '¥19.9',
    originalPrice: '¥39.9',
    category: '写手',
    cover: '/workflows/writer-xiaohongshu.png',
    externalUrl: 'https://dify.ai/templates/writer-xiaohongshu',
    author: '小马 AI',
    sales: 128,
    rating: 4.8,
    tags: ['小红书', '内容创作', '营销'],
    description: '输入产品卖点,自动生成 5 篇小红书爆款图文,带 emoji 和热门话题标签',
    models: ['GPT-5.4-mini', 'Claude-Haiku-4.5'],
    estimatedCost: '¥0.05/篇',
  },
  {
    slug: 'dev-codereview',
    name: '代码审查助手',
    price: '¥29.9',
    originalPrice: '¥59.9',
    category: '程序员',
    cover: '/workflows/dev-codereview.png',
    externalUrl: 'https://dify.ai/templates/dev-codereview',
    author: '小马 AI',
    sales: 86,
    rating: 4.9,
    tags: ['代码审查', 'Git', 'CI/CD'],
    description: '自动审查 PR 代码,识别 bug、安全漏洞、性能问题,生成审查报告',
    models: ['Claude-Sonnet-5', 'GPT-5.5'],
    estimatedCost: '¥0.3/次',
  },
  {
    slug: 'ops-weekly',
    name: '周报自动生成',
    price: '¥9.9',
    originalPrice: '¥19.9',
    category: '运营',
    cover: '/workflows/ops-weekly.png',
    externalUrl: 'https://dify.ai/templates/ops-weekly',
    author: '小马 AI',
    sales: 256,
    rating: 4.7,
    tags: ['周报', '自动化', '效率'],
    description: '汇总一周工作内容,自动生成结构化周报,支持飞书/钉钉/企业微信',
    models: ['GPT-5.4-mini'],
    estimatedCost: '¥0.02/份',
  },
  {
    slug: 'marketing-competitor',
    name: '竞品分析报告',
    price: '¥39.9',
    originalPrice: '¥79.9',
    category: '营销',
    cover: '/workflows/marketing-competitor.png',
    externalUrl: 'https://dify.ai/templates/marketing-competitor',
    author: '小马 AI',
    sales: 64,
    rating: 4.9,
    tags: ['竞品分析', '市场调研', '报告'],
    description: '输入 3-5 个竞品网址,自动生成深度竞品分析报告(PDF + 思维导图)',
    models: ['Claude-Sonnet-5', 'GPT-5.5'],
    estimatedCost: '¥2/份',
  },
  {
    slug: 'cs-faq',
    name: '客服常见问题',
    price: '¥49.9',
    originalPrice: '¥99.9',
    category: '客服',
    cover: '/workflows/cs-faq.png',
    externalUrl: 'https://dify.ai/templates/cs-faq',
    author: '小马 AI',
    sales: 42,
    rating: 4.8,
    tags: ['客服', 'RAG', '知识库'],
    description: '上传产品文档,7×24 智能客服,自动回答 80% 常见问题',
    models: ['Claude-Haiku-4.5', 'text-embedding-3-small'],
    estimatedCost: '¥0.01/次',
  },
]

export const workflowCategories = ['全部', '写手', '程序员', '运营', '营销', '客服', '通用']

// 列表页筛选用(与 WorkflowMeta.category 对应)
export const WORKFLOW_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '写手', label: '写手' },
  { key: '程序员', label: '程序员' },
  { key: '运营', label: '运营' },
  { key: '营销', label: '营销' },
  { key: '客服', label: '客服' },
  { key: '通用', label: '通用' },
]

// 详情/画布页按 slug 查找
export function getWorkflowBySlug(slug: string): (WorkflowMeta & { title: string }) | undefined {
  const found = workflows.find((w) => w.slug === slug)
  if (!found) return undefined
  return { ...found, title: found.name }
}
