// 操作手册元数据索引
// 详情内容在 data/manuals/[slug].md
// 列表页直接 import 此处元数据,详情页 fs.readFile 读 md

export interface ManualMeta {
  slug: string
  title: string
  category: string
  cover: string
  author: string
  publishedAt: string
  updatedAt: string
  views: number
  tags: string[]
  excerpt: string
  relatedTools: string[]
  /** 在线使用入口:关联工具的 slug 或直链 */
  toolUrl?: string
  /** 工具使用按钮文案 */
  toolCta?: string
}

export const manuals: ManualMeta[] = [
  {
    slug: 'gpt-4o-handbook',
    title: 'GPT-4o 图像生成完全手册',
    category: 'GPT',
    cover: '/manuals/gpt-4o-handbook.png',
    author: '小马 AI 编辑部',
    publishedAt: '2026-05-15',
    updatedAt: '2026-08-01',
    views: 12580,
    tags: ['GPT-4o', '图像生成', '提示词'],
    excerpt: 'GPT-4o 原生图像生成,5 个实战案例 + 进阶玩法 + 提示词合集',
    relatedTools: ['chatgpt', 'midjourney', 'dall-e'],
    toolUrl: 'https://chatgpt.com',
    toolCta: '立即使用 ChatGPT',
  },
  {
    slug: 'midjourney-v7-guide',
    title: 'Midjourney v7 完全指南',
    category: 'Midjourney',
    cover: '/manuals/midjourney-v7-guide.png',
    author: '小马 AI 编辑部',
    publishedAt: '2026-06-20',
    updatedAt: '2026-08-05',
    views: 9820,
    tags: ['Midjourney', 'AI 绘画', '提示词'],
    excerpt: 'Midjourney v7 艺术感最强,5 个商业级案例 + 风格/角色参考技巧',
    relatedTools: ['midjourney', 'dalle', 'stable-diffusion'],
    toolUrl: 'https://www.midjourney.com',
    toolCta: '立即使用 Midjourney',
  },
  {
    slug: 'suno-music',
    title: 'Suno AI 音乐创作教程',
    category: 'Suno',
    cover: '/manuals/suno-music.png',
    author: '小马 AI 编辑部',
    publishedAt: '2026-04-10',
    updatedAt: '2026-07-28',
    views: 6230,
    tags: ['Suno', 'AI 音乐', '创作'],
    excerpt: '30 秒生成完整歌曲,5 个风格案例 + 歌词结构 + 提示词合集',
    relatedTools: ['suno', 'udio'],
    toolUrl: 'https://suno.com',
    toolCta: '立即使用 Suno',
  },
  {
    slug: 'dall-e-tips',
    title: 'DALL·E 3 提示词技巧',
    category: 'DALL·E',
    cover: '/manuals/dall-e-tips.png',
    author: '小马 AI 编辑部',
    publishedAt: '2026-05-30',
    updatedAt: '2026-07-30',
    views: 4820,
    tags: ['DALL·E', 'AI 绘画', '提示词'],
    excerpt: 'DALL·E 3 自然语言理解强,5 个 UI/插图/漫画案例 + 构图技巧',
    relatedTools: ['dall-e', 'chatgpt', 'midjourney'],
    toolUrl: 'https://chatgpt.com',
    toolCta: '立即使用 DALL·E',
  },
  {
    slug: 'notebooklm-podcast',
    title: 'NotebookLM 播客生成',
    category: 'NotebookLM',
    cover: '/manuals/notebooklm-podcast.png',
    author: '小马 AI 编辑部',
    publishedAt: '2026-07-10',
    updatedAt: '2026-08-08',
    views: 3240,
    tags: ['NotebookLM', '播客', 'AI 音频'],
    excerpt: '上传文档自动生成双人播客,5 个学习/总结/对比场景',
    relatedTools: ['notebooklm', 'suno'],
    toolUrl: 'https://notebooklm.google.com',
    toolCta: '立即使用 NotebookLM',
  },
]

export const manualCategories = ['全部', 'GPT', 'Claude', 'Gemini', 'Midjourney', 'Suno', 'DALL·E', 'NotebookLM', '开源']
