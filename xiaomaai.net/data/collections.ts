export type Collection = {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  toolSlugs: string[]
  category: string
  coverImage?: string
  introContent?: string
  sections?: Array<{ title: string; desc: string; toolSlugs: string[] }>
  summaryContent?: string
  relatedCollectionSlugs?: string[]
  relatedArticleSlugs?: string[]
  publishedAt?: string
  updatedAt?: string
  keywords?: string[]
}

export const collections: Collection[] = [
  {
    id: 'dev-tools',
    slug: 'dev-tools',
    title: '开发者必备',
    description: '精选 AI 编程与开发工具，覆盖代码生成、自动补全、代码审查、文档生成等全流程，让 AI 成为你的编程搭档。',
    icon: 'Code2',
    toolSlugs: [
      'deepseek-r1', 'phind', 'gpt4all', 'codiumai', 'coderabbit',
      'pieces', 'langchain', 'llamaindex', 'ollama', 'codeflash',
      'plandex', 'amazon-q-developer', 'metagpt', 'gpt-code-ui', 'keploy',
    ],
    category: 'dev',
  },
  {
    id: 'designer-tools',
    slug: 'designer-tools',
    title: '设计师工具箱',
    description: 'AI 驱动的设计工具合集，涵盖图像生成、背景移除、品牌设计、矢量图生成等，让你的创意工作事半功倍。',
    icon: 'Palette',
    toolSlugs: [
      'canva', 'clipdrop', 'photoroom', 'runwayml', 'microsoft-designer',
      'brandmark', 'lexica', 'openart', 'krea', 'civitai',
      'playground-ai', 'magic-eraser', 'svgstud-io', 'stockphotoai-net', 'artbreeder',
    ],
    category: 'design',
  },
  {
    id: 'free-tools',
    slug: 'free-tools',
    title: '免费 AI 工具 Top 20',
    description: '完全免费或提供慷慨免费额度的 AI 工具精选，涵盖聊天、搜索、设计、开发等多个领域，零成本体验 AI 魅力。',
    icon: 'Gift',
    toolSlugs: [
      'bing-chat', 'gpt4all', 'ollama', 'chatpdf', 'phind',
      'craiyon', 'stable-diffusion-models', 'playground-ai', 'civitai', 'publicprompts',
      'whisper-api', 'smmry', 'mintlify', 'ai2sql', 'mutableai',
      'chatgpt-for-search-engines', 'sharegpt', 'chatbot-ui', 'forefront', 'elephas',
    ],
    category: 'free',
  },
  {
    id: 'writing-tools',
    slug: 'writing-tools',
    title: '写作助手精选',
    description: 'AI 写作工具大全，从文案生成、语法校对到长篇创作，覆盖中英文写作场景，助你下笔如有神。',
    icon: 'PenLine',
    toolSlugs: [
      'jasper', 'rytr', 'copy-ai', 'quillbot', 'wordtune',
      'hyperwrite', 'jenni', 'lex', 'deepl-write', 'compose-ai',
      'anyword', 'moonbeam', 'hypotenuse-ai', 'lavender', 'copysmith',
    ],
    category: 'writing',
  },
  {
    id: 'video-tools',
    slug: 'video-tools',
    title: '视频创作利器',
    description: 'AI 视频生成与编辑工具合集，支持数字人播报、视频剪辑、特效生成、语音合成等，让视频创作从未如此简单。',
    icon: 'Video',
    toolSlugs: [
      'synthesia', 'runwayml', 'd-id', 'shortvideogen', 'klingai',
      'descript-overdub', 'rephrase-ai', 'hour-one', 'clipwing', 'recast-studio',
      'based-ai', 'sisif', 'respeecher', 'resemble-ai', 'murf-ai',
    ],
    category: 'video',
  },
  {
    id: 'productivity-tools',
    slug: 'productivity-tools',
    title: '效率提升神器',
    description: 'AI 效率工具精选，从会议记录、邮件管理到知识管理，帮你解放双手，专注高价值工作。',
    icon: 'Zap',
    toolSlugs: [
      'taskade', 'fabric', 'otter-ai', 'sybill', 'loopin-ai',
      'cogram', 'excelmatic', 'tailortask', 'mindpal', 'brainsoup',
      'scribbl', 'recall', 'farsite', 'elephas', 'createeasily',
    ],
    category: 'productivity',
  },
  {
    id: 'enterprise-tools',
    slug: 'enterprise-tools',
    title: '企业级 AI 方案',
    description: '面向企业客户的 AI 平台与解决方案，涵盖客服机器人、内部知识库、数据分析、安全合规等场景。',
    icon: 'Building2',
    toolSlugs: [
      'tiledesk', 'aicamp', 'sitegpt', 'sitespeakai', 'singlebasecloud',
      'agentset-ai', 'privategpt', 'quivr', 'aidbase', 'firmos',
      'chatwithcloud', 'maxim-ai', 'pagerly', 'callstack-ai-pr-reviewer', 'cleanlab',
    ],
    category: 'enterprise',
  },
  {
    id: 'academic-tools',
    slug: 'academic-tools',
    title: '学术研究助手',
    description: 'AI 学术研究工具合集，支持文献检索、论文解读、引用管理、数据分析等，助力学术研究更高效。',
    icon: 'GraduationCap',
    toolSlugs: [
      'elicit', 'genei', 'consensus', 'scispace', 'notebooklm',
      'explainpaper', 'sourcely', 'galactica', 'mathos-ai', 'chatpdf',
      'perplexity-ai', 'metaphor', 'you-com', 'komo-ai', 'gist-ai',
    ],
    category: 'academic',
  },
  {
    id: 'marketing-tools',
    slug: 'marketing-tools',
    title: '营销增长黑客',
    description: 'AI 营销工具大全，从 SEO 优化、社交媒体管理到广告文案生成，用 AI 驱动你的营销增长飞轮。',
    icon: 'TrendingUp',
    toolSlugs: [
      'jasper', 'copy-ai', 'anyword', 'postwise', 'lavender',
      'headlinesai-pro', 'dittto-ai', 'pulsepost', 'trolly-ai', 'rapidtextai',
      'contenda', 'qurate', 'nudge-ai', 'salesagent-chat', 'sybill',
    ],
    category: 'marketing',
  },
  {
    id: 'cross-border-ai-tools',
    slug: 'cross-border-ai-tools',
    title: '跨境电商 AI 工具大全',
    description: '覆盖选品调研、智能客服、邮件营销、广告素材等跨境电商全链路场景的 AI 工具精选，助力出海卖家降本增效。',
    icon: 'Globe',
    toolSlugs: [
      'chatgpt', 'claude', 'deepseek', 'perplexity', 'chatpdf',
      'kimi', 'jasper', 'lavender', 'copy-ai', 'anyword',
      'midjourney', 'dall-e-2', 'photoroom', 'recraft', 'ideogram',
    ],
    category: '跨境电商',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    introContent: '跨境电商早已不是单纯的价格战，选品、客服、内容与广告的精细化运营才是利润的关键。本合集从选品调研、多语言客服、邮件与社媒营销、商品图与广告素材四个维度，为你筛选出真正能落地的 AI 工具。无论你是亚马逊、TikTok Shop 还是独立站卖家，都可以按需组合，用更低的人力成本完成以往需要整个团队才能交付的工作。',
    sections: [
      {
        title: 'AI 选品与市场调研',
        desc: '用大模型分析市场趋势、竞品评价与用户需求，辅助你更快做出选品决策。',
        toolSlugs: ['chatgpt', 'claude', 'deepseek', 'perplexity', 'chatpdf'],
      },
      {
        title: 'AI 客服与邮件',
        desc: '多语言客服回复、售后邮件与站内信撰写，让沟通更专业高效。',
        toolSlugs: ['chatgpt', 'kimi', 'jasper', 'lavender', 'copy-ai'],
      },
      {
        title: 'AI 图片与广告素材',
        desc: '生成商品图、主图与广告素材，一键去背景、换场景，降低设计成本。',
        toolSlugs: ['midjourney', 'dall-e-2', 'photoroom', 'recraft', 'ideogram'],
      },
    ],
    summaryContent: '工欲善其事，必先利其器。将上述工具嵌入日常运营流，你就能把更多时间留给选品判断与供应链，让 AI 真正成为跨境电商团队的隐形合伙人。建议先从智能客服与选品调研入手，再逐步扩展到内容与广告素材，稳步提升整体运营效率。',
    relatedCollectionSlugs: ['marketing-tools', 'writing-tools', 'designer-tools'],
    relatedArticleSlugs: ['cross-border-ai-selection-guide', 'amazon-ai-customer-service'],
    publishedAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
    keywords: ['跨境电商AI工具', '选品工具', '亚马逊AI', 'AI客服', 'AI邮件营销'],
  },
  {
    id: 'ai-video-tools',
    slug: 'ai-video-tools',
    title: 'AI 视频创作工具精选',
    description: '从文生视频、智能剪辑到数字人播报，一站集齐创作者高频使用的 AI 视频工具，让短视频生产效率翻倍。',
    icon: 'Clapperboard',
    toolSlugs: [
      'sora', 'runway', 'kling', 'pika', 'luma',
      'heygen', 'minimax', 'synthesia', 'clipwing', 'descript-overdub',
      'elevenlabs', 'murf-ai', 'suno',
    ],
    category: 'AI视频',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    introContent: '短视频时代，创意到成片的距离被 AI 无限拉近。从一句话生成完整镜头的文生视频，到一键智能剪辑、再到口型同步的数字人播报，本合集覆盖视频创作最核心的三个环节。无论你是内容创作者、电商卖家还是品牌营销团队，都能在这里找到合适的生产工具，把灵感快速变成可发布的高质量视频。',
    sections: [
      {
        title: 'AI 视频生成',
        desc: '从文字或图片直接生成高质量视频，快速产出创意素材与宣传片。',
        toolSlugs: ['sora', 'runway', 'kling', 'pika', 'luma'],
      },
      {
        title: 'AI 剪辑与后期',
        desc: '智能剪辑、去噪降噪、语音转字幕，让后期处理自动化、规模化。',
        toolSlugs: ['runway', 'luma', 'clipwing', 'descript-overdub'],
      },
      {
        title: 'AI 数字人与配音',
        desc: '数字人播报与高质量配音配乐，让视频内容更生动、更易量产。',
        toolSlugs: ['heygen', 'minimax', 'synthesia', 'elevenlabs', 'murf-ai', 'suno'],
      },
    ],
    summaryContent: 'AI 视频工具正在改变内容生产的速度与成本。建议创作者先明确自己的内容形态，再按生成、剪辑、数字人三条主线选型搭配，让 AI 负责重复劳动，把精力留给创意本身，从而持续稳定地产出优质视频。',
    relatedCollectionSlugs: ['video-tools', 'designer-tools', 'marketing-tools'],
    relatedArticleSlugs: ['ai-video-generation-guide', 'digital-human-avatar-tools'],
    publishedAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-03-05T00:00:00Z',
    keywords: ['AI视频生成', '视频剪辑工具', '数字人', '文生视频', 'AI短视频'],
  },
]

export function getCollections(): Collection[] {
  const dated = collections.filter((c) => c.updatedAt)
  const undated = collections.filter((c) => !c.updatedAt)
  return [...dated.sort((a, b) => b.updatedAt!.localeCompare(a.updatedAt!)), ...undated]
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug)
}