// 资讯 / 教程文章
export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverUrl?: string
  category: 'tutorial' | 'review' | 'news' | 'guide'
  tags: string[]
  author: string
  relatedToolSlugs: string[]
  toc?: Array<{ id: string; text: string; level: number }>
  relatedCollectionSlugs?: string[]
  updatedAt?: string
  publishedAt: string
  views: number
}

export const articles: Article[] = [
  {
    id: '1',
    slug: 'chatgpt-vs-claude-vs-gemini',
    title: '2026 年三大 AI 对话工具横评：ChatGPT / Claude / Gemini 谁更强？',
    excerpt: '从推理能力、上下文长度、价格、生态四个维度，深度对比三大 AI 助手。',
    content: `## 写在前面

2026 年 7 月的 AI 对话工具市场已经形成「三足鼎立」格局：OpenAI ChatGPT（GPT-5.5）、Anthropic Claude（Sonnet 5 / Opus 4.8）、Google Gemini（3.1 Pro）。

本文从四个维度全面对比（数据更新于 2026-07-04）：

### 1. 推理能力

- **ChatGPT (GPT-5.5)**：2026-04 最新旗舰，数学 / 代码 / 通用任务表现顶级，输入 ¥36/M、输出 ¥216/M tokens
- **Claude (Sonnet 5)**：长文本理解（1M 上下文）、复杂推理、写作风格最自然，输入 ¥14/M、输出 ¥72/M
- **Gemini (3.1 Pro)**：多模态实时处理，1M 上下文，输入 ¥14/M、输出 ¥86/M

### 2. 上下文长度

- **Claude Sonnet 5 / Opus 4.8**：1M tokens，长文档分析首选
- **Gemini 3.1 Pro**：1M tokens，原生视频/图像输入
- **GPT-5.5**：1.05M tokens，最长上下文

### 3. 价格（实时同步自 LiteLLM + OpenRouter）

| 模型 | 输入 (¥/M) | 输出 (¥/M) | 上下文 |
|---|---|---|---|
| GPT-5.5 | 36 | 216 | 1.05M |
| GPT-5.4 | 18 | 108 | 1.05M |
| Claude Sonnet 5 | 14 | 72 | 1M |
| Claude Opus 4.8 | 144 | 720 | 1M |
| Gemini 3.1 Pro | 14 | 86 | 1M |
| Gemini 3.5 Flash | 11 | 65 | 1M |

订阅价：
- ChatGPT Plus：$20/月
- Claude Pro：$20/月
- Gemini Advanced：$20/月

### 4. 生态集成

- ChatGPT：Custom GPTs、GPT Store、API、Codex CLI
- Claude：Artifacts、Projects、Computer Use、Claude Code
- Gemini：Workspace 集成、Search grounding、Veo 视频

## 结论

- **日常使用 / 编程**：ChatGPT（GPT-5.5）
- **专业写作 / 长文档 / 复杂推理**：Claude（Sonnet 5 / Opus 4.8）
- **Google 生态 / 多模态 / 视频**：Gemini（3.1 Pro）

每个人的需求不同，建议都试试。`,
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    category: 'review',
    tags: ['ChatGPT', 'Claude', 'Gemini', '对比'],
    author: '小马科技',
    relatedToolSlugs: ['chatgpt', 'claude', 'gemini'],
    toc: [
      { id: 'reasoning', text: '推理能力', level: 3 },
      { id: 'context-length', text: '上下文长度', level: 3 },
      { id: 'pricing', text: '价格', level: 3 },
      { id: 'ecosystem', text: '生态集成', level: 3 },
      { id: 'conclusion', text: '结论', level: 2 },
    ],
    relatedCollectionSlugs: ['free-tools', 'productivity-tools', 'writing-tools'],
    publishedAt: '2026-06-15T00:00:00Z',
    views: 3200,
  },
  {
    id: '2',
    slug: 'midjourney-v7-tutorial',
    title: 'Midjourney v7 完全指南：从入门到精通',
    excerpt: '系统学习 Midjourney v7 新特性、参数、提示词技巧，配 50+ 实例。',
    content: `## 什么是 Midjourney？

Midjourney 是当前最强大的 AI 图像生成工具之一，v7 版本带来多项升级。

## 基础命令

- \`/imagine\` - 生成图像
- \`/describe\` - 反向解析
- \`/blend\` - 混合多张图
- \`/settings\` - 设置

## 关键参数

- \`--ar 16:9\` - 宽高比
- \`--style raw\` - 真实风格
- \`--s 750\` - 风格化强度
- \`--c 25\` - 混乱度
- \`--w 250\` - 奇异性

## 提示词模板

\`\`\`
[主体] + [环境] + [光线] + [风格] + [参数]
\`\`\`

### 实例 1：产品摄影

\`\`\`
a perfume bottle on a marble table, soft studio lighting, 
minimalist luxury style --ar 4:5 --s 600 --style raw
\`\`\`

### 实例 2：人物肖像

\`\`\`
a young woman with short hair, golden hour lighting, 
shot on Hasselblad, magazine cover --ar 3:4 --s 750
\`\`\`

## 进阶技巧

1. **多图参考**：上传图片 + \`--iw\` 权重
2. **风格锁定**：\`--sref <url>\` 一致性参考
3. **角色锁定**：\`--cref <url>\` 角色参考

## 总结

Midjourney v7 在细节、风格一致性上有显著提升，是设计师和创作者的首选工具。`,
    coverUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800',
    category: 'tutorial',
    tags: ['Midjourney', 'AI 图像', '教程'],
    author: '小马科技',
    relatedToolSlugs: ['midjourney'],
    toc: [
      { id: 'what-is-midjourney', text: '什么是 Midjourney？', level: 2 },
      { id: 'basic-commands', text: '基础命令', level: 2 },
      { id: 'key-parameters', text: '关键参数', level: 2 },
      { id: 'prompt-template', text: '提示词模板', level: 2 },
      { id: 'summary', text: '总结', level: 2 },
    ],
    relatedCollectionSlugs: ['designer-tools', 'marketing-tools'],
    publishedAt: '2026-06-20T00:00:00Z',
    views: 4500,
  },
  {
    id: '3',
    slug: 'sora-2-release-news',
    title: 'OpenAI 发布 Sora 2：视频生成进入新纪元',
    excerpt: 'Sora 2 支持物理一致性、最长 2 分钟视频、原生音画同步。',
    content: `## Sora 2 重大升级

2026 年 6 月，OpenAI 发布 Sora 2，相比一代有质的飞跃。

### 新特性

- **物理一致性**：重力、流体、碰撞更真实
- **最长 2 分钟**：从 60 秒提升到 120 秒
- **原生音画同步**：视频自带配乐和音效
- **镜头控制**：可指定运镜方式

### 实际效果

Sora 2 生成的视频已达到「短片」水准，部分镜头甚至能骗过肉眼。

### 价格

- ChatGPT Plus 用户：每月 50 次生成
- ChatGPT Pro：$200/月，无限生成

### 影响

- 影视行业：可能颠覆广告 / 短剧制作流程
- 教育：可视化教学成本大幅降低
- 社交：UGC 内容爆发

Sora 2 是视频生成的「GPT 时刻」。`,
    coverUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800',
    category: 'news',
    tags: ['Sora', 'OpenAI', '视频生成'],
    author: '小马科技',
    relatedToolSlugs: ['sora', 'runway'],
    publishedAt: '2026-06-28T00:00:00Z',
    views: 6800,
  },
  {
    id: '4',
    slug: 'cursor-vs-copilot',
    title: 'Cursor vs GitHub Copilot：AI 编程工具终极对比',
    excerpt: '实测 Cursor 0.45 和 Copilot Workspace，告诉你哪个更适合你。',
    content: `## 核心差异

| 维度 | Cursor | GitHub Copilot |
|---|---|---|
| 编辑器 | 独立 IDE（VSCode fork） | VSCode 插件 |
| 价格 | $20/月（Pro）| $10/月（个人）|
| 上下文 | 全仓库 | 当前文件 + 部分 |
| 多文件编辑 | 强 | 中 |

## 场景推荐

### 选 Cursor 如果：
- 启动新项目
- 需要跨文件重构
- 喜欢 AI 主导的工作流

### 选 Copilot 如果：
- 已用 VSCode，不想换
- 预算敏感
- 主要是代码补全

## 实际体验

**Cursor 优势**：
- Cmd+K 直接改代码
- 整段理解 + 建议
- Composer 模式可同时改多文件

**Copilot 优势**：
- IDE 集成最自然
- 训练数据多
- 价格便宜

## 结论

- **专业开发者**：Cursor
- **学生 / 业余**：Copilot
- **VSCode 铁粉**：Copilot
- **追求效率**：Cursor

两者都是 2026 年顶级 AI 编程工具。`,
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: 'review',
    tags: ['Cursor', 'GitHub Copilot', 'AI 编程'],
    author: '小马科技',
    relatedToolSlugs: ['cursor', 'github-copilot'],
    publishedAt: '2026-06-10T00:00:00Z',
    views: 2900,
  },
  {
    id: '5',
    slug: 'domestic-ai-tools-guide',
    title: '国产 AI 工具大全：2026 年最值得关注的 10 款',
    excerpt: '从对话、图像、视频、编程四大领域，精选国产 AI 工具。',
    content: `## 写在前面

2026 年 7 月国产 AI 工具已全面崛起，本文精选 10 款代表（数据同步自 LiteLLM + OpenRouter，2026-07-04）。

## 对话类

### 1. DeepSeek
- 旗舰 DeepSeek-V4 Pro (2026)，1M 上下文，输入 ¥3.1/M
- 适合：开发者、研究、超长文档

### 2. Kimi K2.6 (月之暗面)
- 长上下文 (262K) 领先，K2.6 最新
- 适合：文档分析、学术研究

### 3. 通义千问 Qwen3-Max (阿里)
- 多模态 + 开源生态
- 适合：企业级、Agent

### 4. 智谱清言 GLM-5.1 (清华)
- 工具调用强，200K 上下文
- 适合：Agent

### 5. 豆包 Seed 2 Pro (字节)
- APP 体验好，DAU 千万，256K 上下文
- 适合：大众用户

### 6. 文心一言 ERNIE-5 (百度)
- 搜索 + 文心 5
- 适合：中文搜索

## 图像 / 视频

### 7. 可灵 (快手)
- 视频生成第一梯队
- 免费额度慷慨

### 8. 海螺 AI (MiniMax)
- 视频 + 数字人
- APP 体验优秀

## 编程

### 9. CodeGeeX (智谱)
- VSCode 插件，免费
- 支持 20+ 语言

## 效率

### 10. 飞书 AI
- 会议纪要、文档续写
- 企业协作场景

## 总结

国产 AI 工具在 2026 年已经形成完整生态，免费 + 国产 + 数据合规是最大优势。`,
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    category: 'guide',
    tags: ['国产', 'AI 工具', '大全'],
    author: '小马科技',
    relatedToolSlugs: ['deepseek', 'kimi', 'qwen', 'kling'],
    publishedAt: '2026-06-25T00:00:00Z',
    views: 5100,
  },
  {
    id: '6',
    slug: 'elevenlabs-tts-tutorial',
    title: 'ElevenLabs 完整教程：克隆你的声音',
    excerpt: '从注册到声音克隆、API 调用，10 分钟学会 ElevenLabs。',
    content: `## 什么是 ElevenLabs？

ElevenLabs 是当前最逼真的 AI 语音合成平台。

## 注册

1. 访问 [elevenlabs.io](https://elevenlabs.io)
2. Google 账号登录
3. 免费层每月 10,000 字符

## 核心功能

### 1. 文本转语音 (TTS)
- 29 种语言
- 50+ 预设声音
- 自定义情感、语速

### 2. 声音克隆 (Voice Cloning)
- 上传 1-3 分钟样本
- 30 分钟生成专属声音

### 3. 配音 (Dubbing)
- 视频自动翻译 + 配音
- 保留原声情感

## 实战：克隆我的声音

\`\`\`bash
# 1. 录制 3 分钟清晰人声
# 2. 上传到 ElevenLabs
# 3. 训练 (Instant / Professional)
# 4. 用 API 调用
\`\`\`

## Python API

\`\`\`python
import requests

response = requests.post(
    "https://api.elevenlabs.io/v1/text-to-speech/<voice_id>",
    headers={"xi-api-key": "YOUR_KEY"},
    json={"text": "Hello world"}
)
with open("output.mp3", "wb") as f:
    f.write(response.content)
\`\`\`

## 商业场景

- 有声书
- 短视频配音
- 在线教育
- 客服 IVR
- 游戏 NPC

## 总结

ElevenLabs 让「人人都有专属 AI 声音」成为现实。`,
    coverUrl: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800',
    category: 'tutorial',
    tags: ['ElevenLabs', 'TTS', '声音克隆'],
    author: '小马科技',
    relatedToolSlugs: ['elevenlabs'],
    publishedAt: '2026-06-12T00:00:00Z',
    views: 3800,
  },
  {
    id: '7',
    slug: 'deepseek-api-integration',
    title: 'DeepSeek API 集成完全指南：比 GPT-5.5 便宜 99%，2026 国产之光',
    excerpt: 'OpenAI 兼容协议、3 行代码迁移、V4 Pro 1M 上下文，国内直连的国产之光。',
    content: `## 为什么选择 DeepSeek？

- **价格**：DeepSeek-V4 Pro 输入 ¥3.1/M、输出 ¥6.3/M tokens（GPT-5.5 的 1/30）
- **性能**：DeepSeek-V4 Pro 对标 GPT-5.4，DeepSeek-R2 对标 o3，DeepSeek-R1 对标 o1
- **协议**：OpenAI 兼容，只需改 base_url
- **国内**：直连无墙，无须代理
- **上下文**：V4 Pro 支持 1M tokens（全市场最长之一）

## 3 行代码迁移

\`\`\`python
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好"}]
)
\`\`\`

## 核心模型（实时同步自 LiteLLM，2026-07-04）

| 模型 | 定位 | 上下文 | 输入 (¥/M) | 输出 (¥/M) |
|---|---|---|---|---|
| deepseek-v4-pro | 旗舰 (2026) | 1M | 3.1 | 6.3 |
| deepseek-v4-flash | 性价比 (2026) | 1M | 1.0 | 2.0 |
| deepseek-chat | V3.2 通用 | 131K | 1.6 | 2.5 |
| deepseek-reasoner | R1 推理 | 163K | 3.6 | 15 |
| deepseek-r2 | R2 推理 | 200K | 7.2 | 29 |

## 实战：流式输出

\`\`\`python
stream = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "写一首诗"}],
    stream=True
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")
\`\`\`

## Function Calling

支持原生 Function Calling，可作为 Agent 的 brain。

## 注意事项

- **R1/R2 模型**：会有 \`reasoning_content\` 字段返回思考过程
- **限速**：默认 60 RPM，付费用户可提升
- **充值**：platform.deepseek.com，最低 1 元起
- **缓存**：命中缓存可享 1/10 价格

## 总结

DeepSeek-V4 Pro 是 2026 年最值得接入的国产 API，1M 上下文 + ¥3.1 输入价 + OpenAI 兼容 = 性价比之王。`,
    coverUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    category: 'tutorial',
    tags: ['DeepSeek', 'API', '国产', '集成'],
    author: '小马科技',
    relatedToolSlugs: ['deepseek'],
    publishedAt: '2026-06-22T00:00:00Z',
    views: 4200,
  },
  {
    id: '8',
    slug: 'kimi-long-context-tutorial',
    title: 'Kimi K2.6 长上下文实战：262K tokens 玩转文档分析',
    excerpt: '上传 100 篇 PDF 让 Kimi K2.6 一次性读完，金融、法律、研究者的效率神器。',
    content: `## Kimi 是什么？

月之暗面（Moonshot AI）出品的对话 AI，**K2.6 是 2026 最新旗舰**（262K tokens 超长上下文）。

## 适用场景

- 📚 **学术研究**：一次性读 50 篇论文
- ⚖️ **法律合同**：对比 10 份合同差异
- 📈 **金融分析**：研报、财报批量分析
- 💻 **代码审查**：上传整个项目仓库

## 使用方法

### 网页版

1. 访问 [kimi.moonshot.cn](https://kimi.moonshot.cn)
2. 点击「+」上传文件（PDF、Word、Excel、txt）
3. 一次最多 50 个文件
4. 在对话框直接提问

### API 集成

\`\`\`python
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://api.moonshot.cn/v1"
)

# 上传文件
file_object = client.files.create(
    file=open("report.pdf", "rb"),
    purpose="file-extract"
)

# 在对话中引用（K2.6 是 2026 最新）
response = client.chat.completions.create(
    model="moonshot-v1-128k",  # 也可换 kimi-k2.6
    messages=[
        {"role": "system", "content": "你是文档分析助手"},
        {"role": "user", "content": f"请总结文件 {{file_object.id}} 的关键观点"}
    ]
)
\`\`\`

## 模型选择（实时同步自 LiteLLM，2026-07-04）

| 模型 | 上下文 | 输入 (¥/M) | 输出 (¥/M) | 适用 |
|---|---|---|---|---|
| kimi-k2.6 | 262K | 6.8 | 29 | 最新旗舰 (2026) |
| kimi-k2.5 | 262K | 4.3 | 22 | 性价比 |
| kimi-k2 | 262K | 5.3 | 25 | 经典 |
| kimi-k2-thinking | 262K | 4.3 | 18 | 推理 |
| moonshot-v1-128k | 128K | 14 | 36 | 长文档 |
| moonshot-v1-32k | 32K | 7.2 | 22 | 中等 |
| moonshot-v1-8k | 8K | 1.4 | 14 | 短对话 |

## 实战案例：法律合同审查

1. 上传 10 份待审合同
2. 提问：「对比这 10 份合同的违约条款差异」
3. Kimi K2.6 一次性读完后给表格化输出

## 提示词技巧

长上下文的关键是 **明确引用**：
- "在第三份合同的第 5 条..."
- "将所有合同中关于'知识产权'的条款汇总"

## 总结

Kimi K2.6 是 2026 年最实用的国产 AI 工具之一，**长文档场景**首选。`,
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    category: 'tutorial',
    tags: ['Kimi', '长文档', '法律', '研究'],
    author: '小马科技',
    relatedToolSlugs: ['kimi'],
    publishedAt: '2026-06-18T00:00:00Z',
    views: 3600,
  },
  {
    id: '9',
    slug: 'suno-ai-music-tutorial',
    title: 'Suno AI 音乐生成完整教程：从零到发布',
    excerpt: '用 Suno 写歌、编曲、演唱全流程，10 分钟做一首专业级歌曲。',
    content: `## 什么是 Suno？

Suno 是当前最强的 AI 音乐生成平台，输入歌词或描述，输出 **完整歌曲**（含人声、伴奏、混音）。

## 注册

1. 访问 [suno.com](https://suno.com)
2. Discord / Google 登录
3. 免费：每天 5 首（带水印）
4. Pro $10/月：500 首

## 两种生成方式

### 1. 简单模式 (Simple Mode)

直接输入提示词：

> \`A cheerful pop song about summer vacation, female vocal, 120 BPM\`

### 2. 自定义模式 (Custom Mode)

**歌词部分**：
\`\`\`
[Verse]
阳光洒在沙滩上
海风吹过我的脸
椰子树下我和你
一起写下这夏天

[Chorus]
La la la la la...
\`\`\`

**风格标签**：
- Pop, Rock, Jazz, Hip-hop, R&B
- 情绪：Happy, Sad, Energetic, Romantic
- 乐器：Acoustic Guitar, Piano, Electronic

## 进阶技巧

### 风格参考

在 prompt 里加入具体风格词：
- "80s synthwave, retro pop"
- "Lo-fi hip-hop, chill beats"
- "Indie folk, acoustic"

### 人声控制

- Male vocal / Female vocal
- Soft, Powerful, Whispering
- Rapping, Singing

### 段落标记

\`\`\`
[Intro] - 前奏
[Verse] - 主歌
[Pre-Chorus] - 预副歌
[Chorus] - 副歌
[Bridge] - 桥段
[Outro] - 尾奏
[Instrumental Break] - 纯音乐
\`\`\`

## 商用许可

- **Free / Pro**：个人使用、社交媒体
- **Premier $30/月**：完整商用版权

## 实战：30 分钟做一首完整的歌

1. **5 分钟**：写歌词（用 ChatGPT 辅助）
2. **5 分钟**：选风格、调整 prompt
3. **10 分钟**：生成 3-5 个版本
4. **5 分钟**：选择最佳 + 简单混音
5. **5 分钟**：导出 + 发布

## 变现路径

- 🎵 抖音 / 视频号背景音乐
- 📱 独立游戏配乐
- 🎁 定制生日歌
- 🎙️ 播客片头片尾
- 💰 卖 Beat 给说唱歌手

## 总结

Suno 让"人人都是音乐人"成为现实，2026 年内容创作者的必备工具。`,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    category: 'tutorial',
    tags: ['Suno', 'AI 音乐', '作曲', '教程'],
    author: '小马科技',
    relatedToolSlugs: ['suno'],
    publishedAt: '2026-06-16T00:00:00Z',
    views: 5400,
  },
  {
    id: '10',
    slug: 'sora-prompt-guide',
    title: 'Sora 2 提示词工程：从「能用」到「惊艳」',
    excerpt: '30+ 实战提示词模板、镜头语言指南、运镜参数详解。',
    content: `## Sora 2 是什么？

OpenAI 2026 年发布的视频生成模型，支持：
- 最长 2 分钟
- 1080p 高清
- 原生音画同步
- 物理一致性

## 提示词公式

\`\`\`
[主体] + [动作] + [场景] + [镜头] + [风格] + [氛围]
\`\`\`

### 完整示例

> A young woman in a red dress walks through a Tokyo 
> crosswalk at night, neon signs reflecting in puddles, 
> cinematic tracking shot, shot on Arri Alexa, 24fps, 
> shallow depth of field, anamorphic lens flare, 
> Blade Runner 2049 color grading

## 镜头语言速查

| 镜头 | 英文 | 效果 |
|---|---|---|
| 推 | Push in / Dolly in | 拉近主体 |
| 拉 | Pull out / Dolly out | 拉远视野 |
| 摇 | Pan | 横向扫 |
| 移 | Tracking | 跟随主体 |
| 升 | Crane up | 抬升视角 |
| 降 | Crane down | 降低视角 |
| 固定 | Static | 不动 |
| 航拍 | Aerial / Drone | 空中俯拍 |

## 30+ 实战模板

### 1. 产品广告

> \`A perfume bottle rotating slowly on a marble pedestal, 
> macro lens, soft studio lighting, water droplets, 
> minimalist luxury aesthetic, 4K\`

### 2. 美食镜头

> \`A steaming bowl of ramen, chopsticks lifting noodles, 
> slow motion, warm lighting, top-down view, food commercial style\`

### 3. 人物特写

> \`Close-up of an elderly man's face, wrinkles visible, 
> warm golden hour light, contemplative expression, 
> shallow depth of field, 85mm lens\`

### 4. 自然风光

> \`Aerial view of Norwegian fjords at sunrise, mist rising 
> from water, dramatic clouds, 8K cinematic, drone shot\`

### 5. 科幻场景

> \`A futuristic Tokyo street in 2099, holographic billboards, 
> flying cars, rain-soaked neon, Blade Runner aesthetic\`

## 运镜参数

- **Camera**: Static / Pan / Tracking / Crane / Handheld
- **Lens**: 24mm (广角) / 50mm (标准) / 85mm (人像) / Macro
- **FPS**: 24 (电影) / 30 (电视) / 60 (慢动作)

## 风格参考

- **Cinematic**: Arri Alexa, RED, anamorphic
- **Film stock**: Kodak Vision3, Fuji Eterna
- **Directors**: Wes Anderson, Denis Villeneuve, Wong Kar-wai

## 常见错误

1. **太长**：单个 prompt 不超过 100 词
2. **太杂**：一次只说一件事
3. **否定词**：避免 "no", "without"
4. **模糊**：避免 "beautiful", "nice"

## 实战工作流

1. **写脚本** → 拆成 3-5 个 5 秒片段
2. **生成** → 每个片段 3-5 个变体
3. **挑选** → 用 best-of
4. **剪辑** → 在剪辑软件拼接 + 转场
5. **音轨** → 可用 Suno 生成 BGM

## 总结

Sora 2 的关键是 **镜头语言 + 具体细节 + 风格参考**。多写、多试、多参考电影分镜。`,
    coverUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800',
    category: 'tutorial',
    tags: ['Sora', '视频生成', '提示词'],
    author: '小马科技',
    relatedToolSlugs: ['sora'],
    publishedAt: '2026-06-30T00:00:00Z',
    views: 7200,
  },
  {
    id: '11',
    slug: 'runway-gen3-tutorial',
    title: 'Runway Gen-3 Alpha 实战：专业影视级 AI 视频',
    excerpt: '比 Sora 更可控的影视级 AI 视频工具，导演 / 后期必备。',
    content: `## Runway 是什么？

Runway 是 **专业影视级** AI 视频平台，Gen-3 Alpha 是其旗舰模型。

## 与 Sora 的差异

| 维度 | Runway Gen-3 | Sora 2 |
|---|---|---|
| 长度 | 10s | 2 分钟 |
| 可控性 | 高（首尾帧控制）| 中 |
| 风格 | 影视 | 通用 |
| 商用 | 全开放 | 受限 |
| 价格 | $12/月起 | $20/月起 |

## 核心功能

### 1. Text to Video

输入提示词，生成视频。

### 2. Image to Video

上传 **首帧图**，AI 自动延展成 10 秒视频。

### 3. Video to Video

上传原始视频 + 风格 prompt，整体重绘。

### 4. 首尾帧控制

- **Start frame**: 起始画面
- **End frame**: 结束画面
- AI 自动补间

## 实战：广告片头

### 步骤 1: 准备素材

- Midjourney 生成产品图（作为首帧）
- ChatGPT 写分镜脚本

### 步骤 2: Runway 设置

- **Model**: Gen-3 Alpha Turbo
- **Duration**: 10s
- **Motion**: 5 (中等)
- **Camera**: Push in

### 步骤 3: 提示词

> A perfume bottle slowly rising from dark water surface, 
> golden light from above, water droplets, cinematic, 
> macro lens, luxury commercial

### 步骤 4: 生成与微调

- 一次生成 4 个变体
- 选择最佳 → "Extend" 延展
- 必要时调整 Motion / Camera

## 价格方案

| Plan | 价格 | 信用 |
|---|---|---|
| Free | $0 | 125 |
| Standard | $12/月 | 625 |
| Pro | $28/月 | 2250 |
| Unlimited | $76/月 | 无限 |

## 实战工作流

\`\`\`
Midjourney 出图
  ↓
Runway 视频化
  ↓
ElevenLabs 配音
  ↓
Suno 配 BGM
  ↓
DaVinci 剪辑
  ↓
成片
\`\`\`

## 最佳实践

1. **简洁 prompt**：不要超过 50 词
2. **明确镜头**：camera + motion 一定要写
3. **风格参考**：用 cinematographer 名字
4. **多生成**：每个镜头 5+ 变体
5. **后期合成**：不要指望一步到位

## 总结

Runway 是 **创作者** 和 **制片人** 的首选，比 Sora 更适合商业项目。`,
    coverUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
    category: 'tutorial',
    tags: ['Runway', '视频生成', '影视', '教程'],
    author: '小马科技',
    relatedToolSlugs: ['runway'],
    publishedAt: '2026-06-24T00:00:00Z',
    views: 4100,
  },
  {
    id: '12',
    slug: 'perplexity-research-guide',
    title: 'Perplexity AI 终极研究指南：替代 Google 搜索',
    excerpt: '实时联网、引用来源、深度研究模式，研究者和记者的效率工具。',
    content: `## Perplexity 是什么？

AI 搜索引擎，**实时联网** + **引用来源** + **答案生成**。

## vs 传统搜索

| 维度 | Google | Perplexity |
|---|---|---|
| 结果 | 链接列表 | 答案 + 来源 |
| 实时性 | 高 | 高 |
| 引用 | 无 | 有（点击跳转）|
| 多轮 | 弱 | 强（追问）|
| 深度 | 需自己点 | 自动整合 |

## 4 个模式

### 1. Quick Search (默认)

- 快速答案
- 3-5 个来源
- 适合简单问题

### 2. Pro Search (深度)

- 多轮推理
- 10-20 个来源
- 适合复杂研究

### 3. Focus (限定来源)

- Academic: 学术论文
- YouTube: 视频
- Reddit: 讨论
- Wolfram: 计算

### 4. Spaces (协作)

- 上传文件
- 自定义指令
- 团队共享

## 实战案例

### 案例 1: 学术研究

> "What are the latest developments in mRNA cancer vaccines in 2026?"

Perplexity 会：
1. 检索 30+ 最新论文
2. 整合核心观点
3. 列出引用 + 链接

### 案例 2: 投资调研

> "Compare the financial performance of NVIDIA vs AMD in 2025-2026"

输出结构化对比表 + 引用源。

### 案例 3: 旅行规划

> "Plan a 7-day Japan trip in October focusing on autumn foliage"

返回：
- 每日行程
- 餐厅推荐
- 交通建议
- 预算估算

## 提示词技巧

### 1. 明确时间范围

> "in 2026" / "from 2024 to 2026" / "in the last 3 months"

### 2. 指定信息源类型

> "from academic papers" / "from official websites"

### 3. 要求格式

> "in a table" / "as bullet points" / "with pros and cons"

### 4. 多角度

> "from technical, business, and user perspectives"

## API 集成

\`\`\`python
import requests

response = requests.post(
    "https://api.perplexity.ai/chat/completions",
    headers={"Authorization": "Bearer pplx-xxx"},
    json={
        "model": "sonar-pro",
        "messages": [
            {"role": "user", "content": "What is the latest AI news?"}
        ]
    }
)
print(response.json())
\`\`\`

## 价格

| Plan | 价格 | 额度 |
|---|---|---|
| Free | $0 | 5 Pro/天 |
| Pro | $20/月 | 300 Pro/天 |
| Enterprise | 定制 | 无限 |

## 最佳实践

1. **复杂问题用 Pro**
2. **学术研究用 Focus: Academic**
3. **多轮追问** 比一次性提问更精准
4. **Spaces**：长期项目建立专属空间

## 总结

Perplexity 是 **2026 年最实用的搜索工具**，比 ChatGPT 更适合需要实时信息的场景。`,
    coverUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    category: 'tutorial',
    tags: ['Perplexity', '搜索', '研究'],
    author: '小马科技',
    relatedToolSlugs: ['perplexity'],
    publishedAt: '2026-06-14T00:00:00Z',
    views: 4800,
  },
  {
    id: '13',
    slug: 'flux-stable-diffusion-guide',
    title: 'Flux + Stable Diffusion 本地部署完全指南',
    excerpt: '消费级显卡跑最强开源模型，ComfyUI 工作流 + 显存优化。',
    content: `## 为什么要本地部署？

- **隐私**：数据不上传
- **免费**：不订阅、无水印
- **批量**：无限生成
- **可定制**：LoRA、ControlNet

## Flux 是什么？

Black Forest Labs 出品的开源图像生成模型，2026 年的 Stable Diffusion 替代者。

## 硬件要求

| 模型 | 最低显存 | 推荐 |
|---|---|---|
| Flux.1 Schnell | 12GB | RTX 3060 |
| Flux.1 Dev | 24GB | RTX 4090 |
| Flux.1 Pro | API only | - |

## ComfyUI 部署

### 1. 安装

\`\`\`bash
# 克隆仓库
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 安装依赖
pip install -r requirements.txt
\`\`\`

### 2. 下载模型

\`\`\`bash
# 把模型文件放到 models/unet/
# Flux.1 Dev (23GB): https://huggingface.co/black-forest-labs/FLUX.1-dev
# VAE (335MB)
# CLIP-L (234MB)
# T5-XXL (9.5GB)
\`\`\`

### 3. 启动

\`\`\`bash
python main.py
# 浏览器打开 http://127.0.0.1:8188
\`\`\`

## 工作流 (Workflow)

### 基础文生图

\`\`\`
[CLIPTextEncode] → [KSampler] → [VAEDecode] → [SaveImage]
\`\`\`

### 图生图 + ControlNet

\`\`\`
[LoadImage] → [ControlNet Apply] → [KSampler] → [VAEDecode] → [SaveImage]
\`\`\`

### LoRA 加载

\`\`\`
[Load LoRA] → [KSampler] → ...
\`\`\`

## 显存优化

### 1. FP8 模型

\`\`\`bash
# Flux FP8 版本只需 12GB 显存
wget https://huggingface.co/lllyasviel/flux1-dev-bnb-nf4/...
\`\`\`

### 2. 分块 VAE

\`\`\`python
# 在 ComfyUI 设置中启用
--lowvram
--preview-method auto
\`\`\`

### 3. 模型 CPU offload

\`\`\`python
pipe.enable_model_cpu_offload()
\`\`\`

## 实战：电商产品图

1. **拍摄一张产品照片**（手机即可）
2. **上传到 ComfyUI**（Load Image 节点）
3. **提示词**：
   > "professional product photo, white background, 
   > studio lighting, e-commerce style, 4K"
4. **ControlNet**：Canny 边缘控制构图
5. **生成**：批量 4 张，挑选最佳

## LoRA 训练

### 准备数据

- 20-50 张同一主题图片
- 不同角度、光照、背景

### 训练命令

\`\`\`bash
# 使用 kohya_ss GUI
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
setup.sh  # Windows: setup.bat
\`\`\`

### 训练参数

- **Network Dim**: 32
- **Learning Rate**: 1e-4
- **Steps**: 1500-3000
- **Resolution**: 512x512 (SD 1.5) / 1024 (SDXL/Flux)

## Stable Diffusion 3.5

SD 3.5 Large 是 Flux 的主要竞品：
- 参数更多 (8B)
- 多模态架构
- 文字渲染更好

## 商业应用

- 🎨 电商产品图
- 📱 App 界面设计
- 🎬 影视概念图
- 🏠 室内设计可视化
- 👗 服装设计

## 总结

本地部署适合 **高频生成 + 隐私敏感** 的场景，2026 年创作者必备技能。`,
    coverUrl: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=800',
    category: 'tutorial',
    tags: ['Flux', 'Stable Diffusion', 'ComfyUI', '本地部署'],
    author: '小马科技',
    relatedToolSlugs: ['flux'],
    publishedAt: '2026-06-26T00:00:00Z',
    views: 5200,
  },
  {
    id: '14',
    slug: 'codex-automation-guide',
    title: 'Codex 自动化开发完全指南：MCP 协议 + AI 画布',
    excerpt: '把 Codex、Claude Code、Cursor Agent 接入本项目画布，实现可视化自动化。',
    content: `## 什么是 Codex 自动化？

Codex 是 OpenAI 的代码生成模型，**Agent 模式**下可自主完成多步任务：
- 读懂项目结构
- 调用工具
- 修改多个文件
- 运行测试

## MCP 协议

**Model Context Protocol** 是 AI Agent 与外部工具的标准协议。

### 架构

\`\`\`
[AI Agent (Codex/Claude)]
        ↓ MCP
[Tool Server]
   ├─ File System
   ├─ Git
   ├─ Browser
   ├─ Database
   └─ Custom API
\`\`\`

### 核心概念

- **Resources**：可读的数据（文件、URL）
- **Tools**：可执行的动作
- **Prompts**：可复用的模板
- **Sampling**：让 LLM 处理复杂任务

## 实战：把 Codex 接入本项目画布

### 场景描述

用户在小马 AI 画布上拖拽节点：
1. 「Codex 节点」+「GitHub 节点」+「测试节点」
2. 配置：分析代码 → 提 PR → 跑测试
3. 点击运行 → 自动完成

### 实现步骤

#### 1. 启动 Codex CLI

\`\`\`bash
# 安装 Codex
npm install -g @openai/codex

# 启动 MCP 服务器
codex mcp serve
\`\`\`

#### 2. 配置 MCP 工具

\`\`\`json
// ~/.codex/config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
\`\`\`

#### 3. 画布节点定义

\`\`\`typescript
// canvas-nodes/codex-node.ts
export const CodexNode = {
  type: 'codex',
  inputs: [
    { id: 'task', type: 'string', label: '任务描述' },
    { id: 'repo', type: 'string', label: 'Git 仓库' }
  ],
  outputs: [
    { id: 'diff', type: 'code', label: '代码变更' },
    { id: 'pr_url', type: 'string', label: 'PR 链接' }
  ],
  run: async (inputs) => {
    const result = await codex.execute({
      task: inputs.task,
      repo: inputs.repo,
      model: 'codex-1'
    });
    return {
      diff: result.diff,
      pr_url: result.prUrl
    };
  }
};
\`\`\`

#### 4. 画布编排工作流

\`\`\`
[Codex 节点] → [Git Diff 节点] → [Review 节点] → [Commit 节点] → [GitHub PR 节点]
\`\`\`

### 提示词模板

#### 模板 1: Bug 修复

\`\`\`
分析仓库 {repo} 中的 bug：
1. 定位问题文件
2. 解释根因
3. 生成修复 patch
4. 写单元测试
5. 提交 commit
\`\`\`

#### 模板 2: 重构

\`\`\`
对 {module} 模块进行重构：
1. 提取重复代码到 utils
2. 添加 TypeScript 类型
3. 保持向后兼容
4. 运行所有测试
\`\`\`

#### 模板 3: 新功能

\`\`\`
为 {project} 添加 {feature}：
1. 设计 API
2. 实现核心逻辑
3. 添加文档
4. 写使用示例
5. 创建 PR
\`\`\`

## Claude Code 集成

类似 Codex，但用 Anthropic 的 Claude：

\`\`\`bash
# 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 启动
claude-code --mcp-config ~/.claude/mcp.json
\`\`\`

## Cursor Agent

Cursor 内置的 Agent 模式也支持 MCP：

1. **Settings → Features → MCP**
2. 添加 MCP Servers
3. 在 Composer 中使用 \`@MCP\` 调用

## 性能优化

### 1. Context 复用

- **小改动**：用 Edit 工具（快）
- **大改动**：用 Write 工具（慢但清晰）
- **全文件分析**：用 Read 工具

### 2. 并行调用

- 多个独立任务 → 同时启动
- 依赖任务 → 串行

### 3. Token 节省

- 只加载必要文件
- 用 ripgrep 搜索，不读全文
- 总结长输出

## 安全注意

1. **代码执行**：MCP 工具的代码在本地运行，要可信
2. **密钥管理**：用环境变量，不硬编码
3. **PR 审查**：自动生成的 PR 一定要人工 review

## 实战案例

### 案例 1: 自动修复 lint

\`\`\`
1. 跑 ESLint → 收集错误
2. Codex 逐个修复
3. 跑测试
4. 提 PR
\`\`\`

### 案例 2: 跨项目代码迁移

\`\`\`
1. 分析源项目结构
2. 提取共享逻辑
3. 在目标项目中实现
4. 跑回归测试
\`\`\`

### 案例 3: 文档自动生成

\`\`\`
1. 读所有 .ts 文件
2. 提取函数签名
3. 生成 markdown 文档
4. 提交到 docs/ 目录
\`\`\`

## 与本项目画布的集成

本项目（[xiaoma-AI-net](https://github.com/)）的画布已支持：

- **节点拖拽**：可视化编排
- **MCP 协议**：标准协议
- **多 Agent 协作**：Codex + Claude + Cursor
- **可视化调试**：实时查看工具调用

## 总结

Codex + MCP 是 2026 年 AI 自动化的 **事实标准**，本项目画布是最佳的实践平台。`,
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    category: 'tutorial',
    tags: ['Codex', 'MCP', '自动化', '画布'],
    author: '小马科技',
    relatedToolSlugs: [],
    publishedAt: '2026-07-02T00:00:00Z',
    views: 8900,
  },
  {
    id: '15',
    slug: 'openai-function-calling',
    title: 'OpenAI Function Calling 完全指南：从 GPT-5.5 到 Agent',
    excerpt: '让 GPT-5.5 调用外部 API、查数据库、执行代码，构建真正的 AI Agent。',
    content: `## 什么是 Function Calling？

让 LLM **结构化输出** + **主动调用工具**，是 AI Agent 的基石。

## 基础示例（使用 GPT-5.5）

### 1. 定义函数

\`\`\`python
import json
from openai import OpenAI

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "获取指定城市的天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名"}
            },
            "required": ["city"]
        }
    }
}]
\`\`\`

### 2. 调用 GPT-5.5

\`\`\`python
response = client.chat.completions.create(
    model="gpt-5.5",  # 2026-04 最新旗舰
    messages=[{"role": "user", "content": "北京今天天气如何？"}],
    tools=tools
)
# LLM 返回: tool_calls=[{function: {name: "get_weather", args: {city: "北京"}}}]
\`\`\`

### 3. 执行函数

\`\`\`python
import requests

def get_weather(city: str):
    # 实际调用天气 API
    return {"temp": 25, "condition": "晴"}

# 解析 LLM 输出
tool_call = response.choices[0].message.tool_calls[0]
args = json.loads(tool_call.function.arguments)
result = get_weather(**args)
\`\`\`

### 4. 二次调用

\`\`\`python
final = client.chat.completions.create(
    model="gpt-5.5",
    messages=[
        {"role": "user", "content": "北京今天天气如何？"},
        response.choices[0].message,  # 助手的工具调用
        {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result)
        }
    ]
)
print(final.choices[0].message.content)
# 输出: "北京今天晴，气温 25°C"
\`\`\`

## 进阶：多函数

\`\`\`python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "搜索互联网",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "发送邮件",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    }
]
\`\`\`

LLM 会**自动选择**合适的函数。

## Agent 模式：循环调用

\`\`\`python
def run_agent(user_input, max_iterations=10):
    messages = [{"role": "user", "content": user_input}]
    
    for i in range(max_iterations):
        response = client.chat.completions.create(
            model="gpt-5.5",
            messages=messages,
            tools=tools
        )
        message = response.choices[0].message
        messages.append(message)
        
        if not message.tool_calls:
            # Agent 决定结束
            return message.content
        
        # 执行所有工具调用
        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            result = AVAILABLE_FUNCTIONS[func_name](**args)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
    
    return "超过最大迭代次数"
\`\`\`

## 结构化输出 (Structured Outputs)

GPT-5.5 100% 严格 JSON：

\`\`\`python
from pydantic import BaseModel

class UserInfo(BaseModel):
    name: str
    age: int
    email: str

response = client.beta.chat.completions.parse(
    model="gpt-5.5",
    messages=[{"role": "user", "content": "提取: 张三, 28岁, zhang@example.com"}],
    response_format=UserInfo
)
user = response.choices[0].message.parsed
print(user.name, user.age)
\`\`\`

## JSON Mode

\`\`\`python
response = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{"role": "system", "content": "只返回 JSON"},
              {"role": "user", "content": "..."}],
    response_format={"type": "json_object"}
)
\`\`\`

## 实战：客服 Agent

### 工具集

- \`search_kb\`: 搜索知识库
- \`create_ticket\`: 创建工单
- \`refund\`: 退款
- \`escalate\`: 转人工

### 系统提示词

\`\`\`
你是客服助手，能使用以下工具：
1. 遇到技术问题先 search_kb
2. 退款申请先验证订单
3. 复杂问题 escalate

回答要简洁、专业、友好。
\`\`\`

## 最佳实践

1. **清晰的 function description**：LLM 据此选择函数
2. **参数验证**：用 Pydantic/Zod
3. **错误处理**：函数失败要返回错误信息
4. **限速**：避免无限循环
5. **审计日志**：记录所有工具调用

## MCP 协议 vs Function Calling

| 维度 | Function Calling | MCP |
|---|---|---|
| 范围 | 单一模型 | 跨平台 |
| 工具定义 | 每次传 | 服务器声明 |
| 复用 | 低 | 高 |
| 标准化 | 厂商私有 | 开放协议 |

## 总结

Function Calling 是 **AI Agent 的第一步**，2026 年开发者必学。`,
    coverUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    category: 'tutorial',
    tags: ['Function Calling', 'OpenAI', 'AI Agent'],
    author: '小马科技',
    relatedToolSlugs: ['chatgpt'],
    publishedAt: '2026-06-19T00:00:00Z',
    views: 6500,
  },
  {
    id: '16',
    slug: 'prompt-engineering-master',
    title: 'Prompt Engineering 进阶：从工程师到 Prompt 架构师',
    excerpt: '20+ 实战模式、CoT/ReAct/Reflexion、Few-shot 最佳实践。',
    content: `## 什么是 Prompt Engineering？

通过**设计输入文本**让 LLM 产出更好结果的工程实践。

## 基础：5 大原则

### 1. 清晰具体

❌ "写一篇文章"
✅ "写一篇 800 字的技术博客，主题是 React Server Components，目标读者是中级前端工程师，语气专业但不晦涩"

### 2. 提供示例 (Few-shot)

\`\`\`
将以下句子翻译成文言文：

现代: 今天天气很好
文言: 今日天朗气清

现代: 我喜欢吃苹果
文言: 余嗜苹

现代: {你的句子}
文言: ?
\`\`\`

### 3. 角色设定

\`\`\`
你是一位有 20 年经验的 Python 后端架构师，擅长系统设计和性能优化。
请用简洁专业的语言回答，必要时给出代码示例。
\`\`\`

### 4. 约束条件

\`\`\`
要求：
- 回答不超过 200 字
- 用 markdown 格式
- 包含至少 2 个 bullet point
- 给出 1 个实际例子
\`\`\`

### 5. 输出格式

\`\`\`
请以 JSON 格式输出：
{
  "title": "...",
  "summary": "...",
  "tags": ["...", "..."]
}
\`\`\`

## 进阶：思维链 (CoT)

让 LLM **逐步思考**：

\`\`\`
请一步步思考：

问题：一个水池有两根管子，A 管 4 小时注满，B 管 6 小时放空。
同时打开，多久注满？

让我们一步步分析：
1. A 的注水速度 = 1/4 池/小时
2. B 的放水速度 = 1/6 池/小时
3. 净速度 = 1/4 - 1/6 = 1/12 池/小时
4. 所以需要 12 小时
\`\`\`

更简洁的方法：

\`\`\`
让我们一步步思考这个问题。
{问题}
\`\`\`

## ReAct：推理 + 行动

\`\`\`
请用以下格式：

Thought: 你在想什么
Action: 采取什么行动
Observation: 观察结果
... (重复)
Thought: 我现在知道答案了
Final Answer: 最终答案

问题：上海今天适合洗车吗？
\`\`\`

## Reflexion：自我反思

\`\`\`
请解决以下问题，然后反思：
1. 你给出的答案
2. 哪里可能错
3. 如何改进

{问题}
\`\`\`

## Tree of Thought (ToT)

让 LLM 探索多个分支：

\`\`\`
请考虑 3 种可能的方法：

方法 A：...
方法 B：...
方法 C：...

评估每种方法的优缺点，选择最佳方案。
\`\`\`

## 20 个实战模式

### 1. 角色扮演 (Role Prompting)

\`\`\`
你是一位资深财务顾问...
\`\`\`

### 2. 风格指定

\`\`\`
用海明威的简洁风格重写...
\`\`\`

### 3. 受众定义

\`\`\`
向 10 岁小孩解释量子力学...
\`\`\`

### 4. 长度控制

\`\`\`
用 50 字以内总结...
\`\`\`

### 5. 多角度

\`\`\`
从技术、商业、用户三个角度分析...
\`\`\`

### 6. 对比分析

\`\`\`
用表格对比 A 和 B 的优缺点...
\`\`\`

### 7. 反向推理

\`\`\`
假设结论是 X，请列出 5 个支持论据
\`\`\`

### 8. 复述确认

\`\`\`
请用自己的话复述问题，确认理解正确
\`\`\`

### 9. 分步执行

\`\`\`
分 3 步完成任务：分析、方案、总结
\`\`\`

### 10. 自我批评

\`\`\`
先给出答案，然后列出 3 个可能的弱点
\`\`\`

## 工具集成

### Function Calling

(见 OpenAI Function Calling 教程)

### Retrieval (RAG)

\`\`\`
基于以下参考资料回答问题。如果参考资料不足，请说明。

参考资料：
{检索到的文档}

问题：{用户问题}
\`\`\`

## 评估与优化

### A/B Test

\`\`\`python
# 比较两个 prompt 的效果
prompt_a = "..."
prompt_b = "..."

for prompt in [prompt_a, prompt_b]:
    results = [eval(generate(prompt)) for _ in range(100)]
    print(f"{prompt}: avg_score = {mean(results)}")
\`\`\`

### 关键指标

- **准确率**：答案正确率
- **一致性**：多次回答的稳定性
- **延迟**：响应时间
- **成本**：token 消耗

## 常见错误

1. **模糊指令**：让 LLM 猜你想要什么
2. **过多约束**：10 个 bullet point 互相矛盾
3. **缺少示例**：抽象问题 LLM 不知道格式
4. **忽略 token**：超长 prompt 浪费钱
5. **不迭代**：一次写好就上线

## 提示词管理

### 版本管理

\`\`\`
prompts/
  v1/
    system.md
    user_template.md
  v2/
    ...
\`\`\`

### A/B 测试框架

- LangSmith
- Langfuse
- Helicone
- PromptLayer

## 实战：构建 Prompt 库

### 类别 1: 写作

\`\`\`
# 标题生成
为 {topic} 生成 10 个吸引人的标题，
要求：
- 不超过 20 字
- 包含数字或关键词
- 风格：{style}
\`\`\`

### 类别 2: 分析

\`\`\`
# SWOT 分析
对 {company/product} 进行 SWOT 分析：
- S (Strengths)
- W (Weaknesses)
- O (Opportunities)
- T (Threats)

每个至少 3 点。
\`\`\`

### 类别 3: 代码

\`\`\`
# 代码审查
审查以下代码，关注：
1. Bug
2. 性能
3. 安全性
4. 可读性

\`\`\`{language}
{code}
\`\`\`
\`\`\`

## 总结

Prompt Engineering 是 **AI 时代的核心技能**。会写 prompt 的人，用 AI 效率是普通人的 10 倍。`,
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    category: 'tutorial',
    tags: ['Prompt', 'AI', '教程'],
    author: '小马科技',
    relatedToolSlugs: ['chatgpt', 'claude'],
    publishedAt: '2026-06-23T00:00:00Z',
    views: 7300,
  },
  {
    id: '17',
    slug: 'gpt-store-build-guide',
    title: 'GPT Store 实战：3 个月做到 10 万用户的秘诀',
    excerpt: '从 0 到 1 构建 GPT、定价策略、推广方法、合规要点。',
    content: `## GPT 是什么？

ChatGPT 的 **自定义应用**，无需编程，用自然语言 + 文件 + API 就能构建。

> **2026 更新**：GPTs 已全面支持 GPT-5.5 / GPT-5.4 / o3 系列，单 GPT 知识库上限提升至 100 文件 / 2GB。

## 3 类 GPT

### 1. 工具型

解决具体任务：
- 文案改写
- 代码 review
- 翻译助手

### 2. 知识型

基于专有数据：
- 行业咨询
- 产品手册
- 学术问答

### 3. 创意型

激发灵感：
- 故事生成
- 营销策划
- 名字生成器

## 创建流程

### 步骤 1: 创建

1. 打开 [chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor)
2. 点 "Create"
3. 选择 "Configure" 手动配置
4. **选模型**：推荐 GPT-5.5（综合）/ GPT-5.4-mini（成本敏感）/ o3（复杂推理）

### 步骤 2: 配置

\`\`\`
Name: 营销文案大师
Description: 帮你写出高转化率的营销文案
Instructions:
  你是一位有 10 年经验的营销专家，擅长：
  - 公众号爆款标题
  - 朋友圈种草文案
  - 小红书种草笔记
  - 抖音带货话术
  
  风格：热情、有感染力、年轻化
  长度：控制在合理范围
  避免：夸大、虚假、绝对化用语
  
  使用时先问用户：目标平台、产品/服务、目标受众。
Conversation starters:
  - 帮我写 10 个公众号标题
  - 朋友圈卖水果文案怎么写
  - 小红书爆款笔记公式
\`\`\`

### 步骤 3: 知识库

- 上传 PDF / Word / TXT
- 最多 20 个文件，每个 512MB
- GPT 会基于这些文件回答

### 步骤 4: Actions (API)

让 GPT 调用外部 API：

\`\`\`json
{
  "openapi": "3.1.0",
  "info": {
    "title": "天气查询",
    "version": "1.0.0"
  },
  "servers": [{"url": "https://api.weather.com"}],
  "paths": {
    "/v1/current": {
      "get": {
        "operationId": "getCurrentWeather",
        "parameters": [{
          "name": "city",
          "in": "query",
          "required": true,
          "schema": {"type": "string"}
        }],
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  }
}
\`\`\`

## 成功案例

### 案例 1: Canva GPT

- 用户输入文案
- 自动生成海报设计
- 1 个月 100 万用户

### 案例 2: Wolfram GPT

- 数学计算 + 可视化
- 学生最爱

### 案例 3: 编程导师

- 解释代码 + 出题 + 批改
- 付费 100 万美元/年

## 推广方法

### 1. SEO 优化

GPT 标题、描述里嵌入关键词。

### 2. 社交媒体

- Twitter/X 演示视频
- YouTube 教程
- 小红书种草

### 3. 社区运营

- Reddit
- Discord
- 微信群

### 4. 互相导流

- 和其他 GPT 互推
- 评论其他 GPT

## 变现

### 模式 1: OpenAI 分成

OpenAI 推出 **GPT 收入分成计划**，热门 GPT 月入 $10K+。

### 模式 2: 流量变现

引导到自己的产品/服务。

### 模式 3: 订阅

GPT 内提供付费版高级功能。

## 合规

1. **不违规**：黄赌毒、暴力、医疗诊断
2. **不侵权**：音乐、影视、书籍版权
3. **不欺诈**：不冒充名人、不发假信息
4. **保护隐私**：不收集用户敏感信息

## 实战：构建你的第一个 GPT

### 项目: 公众号爆款标题生成器

**Name**: 标题大师
**Description**: 5 秒生成 10 个公众号爆款标题

**Instructions**:
\`\`\`
你是公众号爆款标题专家，参考以下原则：

1. 数字 + 关键词：10 个让老板加薪的话术
2. 制造好奇：99% 的人不知道的...
3. 利益点：学会这招，月入 5 万
4. 紧迫感：再不看就删了
5. 痛点共鸣：35 岁的程序员如何避免被裁

要求：
- 每次生成 10 个
- 风格：{用户指定}
- 字数：15-25 字
- 配合 1-2 字 emoji

对话流程：
1. 问用户主题
2. 问目标读者
3. 问风格偏好
4. 生成 10 个 + 简短解释每个的策略
\`\`\`

**Conversation Starters**:
- 帮我写 10 个关于副业的标题
- 我是做美食自媒体的，标题怎么写更火
- 我的公众号是做育儿的，能给点标题建议吗

## 数据追踪

- 对话数
- 留存率
- 用户评分
- 收入

## 总结

GPT Store 是 **AI 时代应用商店**。会构建 GPT = 会分发 AI 应用能力。`,
    coverUrl: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800',
    category: 'guide',
    tags: ['GPTs', 'ChatGPT', 'OpenAI', '变现'],
    author: '小马科技',
    relatedToolSlugs: ['chatgpt'],
    publishedAt: '2026-06-17T00:00:00Z',
    views: 6100,
  },
  {
    id: '18',
    slug: 'claude-projects-artifacts',
    title: 'Claude Projects + Artifacts：让 AI 写出可运行的代码',
    excerpt: 'Claude 独家功能实战：Artifacts 实时预览、Projects 知识库、Artifacts 协作。',
    content: `## Claude 独家功能

### 1. Artifacts

右侧实时预览，Claude 生成的内容**立即可运行**：
- HTML 网页
- React 组件
- SVG 图表
- Mermaid 流程图
- Python 代码
- Markdown 文档

### 2. Projects

知识库 + 对话历史 + 团队协作

### 3. Computer Use (Beta)

让 Claude **操作浏览器**（Beta）

## Artifacts 实战

### 示例 1: 生成可运行的 HTML

**输入**:
\`\`\`
请生成一个倒计时网页，从 10 秒到 0，
背景渐变，文字大号，结束时显示 "时间到!"
\`\`\`

**Artifacts 输出**:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: sans-serif;
  }
  .timer {
    font-size: 200px;
    color: white;
    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
</style>
</head>
<body>
  <div class="timer" id="t">10</div>
  <script>
    let n = 10;
    const el = document.getElementById('t');
    const i = setInterval(() => {
      n--;
      el.textContent = n;
      if (n === 0) {
        clearInterval(i);
        el.textContent = "时间到!";
      }
    }, 1000);
  </script>
</body>
</html>
\`\`\`

**右侧直接预览**，可点击 "Open in new tab" 在新窗口打开。

### 示例 2: React 组件

**输入**:
\`\`\`
用 React + Tailwind 写一个 TodoList 组件，
支持添加、删除、勾选完成、显示统计。
\`\`\`

Claude 生成完整代码 → 实时预览 → 可复制使用。

### 示例 3: Mermaid 流程图

**输入**:
\`\`\`
画一个用户注册流程图：
访问首页 → 填写表单 → 验证 → 发送验证码 → 完成注册
\`\`\`

Claude 输出 Mermaid 代码 → 自动渲染流程图。

### 示例 4: SVG 图表

**输入**:
\`\`\`
画一个 2024 vs 2025 月活对比柱状图
\`\`\`

生成可缩放 SVG → 实时显示。

## Projects 实战

### 场景: 法律咨询

1. **创建 Project**: "Legal Advisor"
2. **上传知识库**:
   - 公司合同模板 (20 份)
   - 法律条文 (50 份)
   - 案例库 (100 个)
3. **配置 Instructions**:
   \`\`\`
   你是一位企业法律顾问，专注于合同审查。
   所有回答必须基于项目内的文档。
   引用来源时标注 [文件名]。
   \`\`\`
4. **团队成员**: 邀请 5 位律师

### 场景: 产品需求

1. **Project**: "产品 PRD 中心"
2. **知识库**: 历史 PRD、用户调研、竞品分析
3. **Instructions**:
   \`\`\`
   你是产品经理助理。生成 PRD 时参考：
   - 历史 PRD 格式
   - 用户调研结论
   - 竞品分析
   \`\`\`

## Computer Use 实战

让 Claude 操作浏览器，**自动化重复任务**：

### 场景: 自动填表

1. 打开 Google Sheets
2. Claude 读懂表头
3. 自动填写数据
4. 保存

### 场景: 竞品监控

1. 打开竞品网站
2. 截图 + 提取价格
3. 写入报告

## 与其他 AI 工具对比

| 维度 | Claude Artifacts | ChatGPT | Cursor |
|---|---|---|---|
| 预览 | ✅ 强 | ❌ 弱 | ❌ 无 |
| 知识库 | Projects | Custom GPTs | @codebase |
| 操作浏览器 | Beta | ❌ 无 | ❌ 无 |
| 价格 | $20/月 | $20/月 | $20/月 |

## 提示词技巧

### Artifacts 提示词模板

\`\`\`
请生成一个 [类型] 页面/组件/图表：
- 功能 1
- 功能 2
- 功能 3
- 风格：{style}
- 颜色：{colors}
- 响应式：是
\`\`\`

### Projects 提示词

\`\`\`
基于项目内的文档，回答：
{问题}

要求：
- 引用来源 [文件名]
- 找不到时明确说明
- 简洁专业
\`\`\`

## 实战工作流

### 1. 设计师 → Artifacts

1. 让 Claude 生成 5 个设计变体
2. 在 Artifacts 实时预览
3. 选择最佳 + 微调
4. 导出代码

### 2. 律师 → Projects

1. 上传所有合同
2. 询问"对比 A 和 B 合同的违约条款"
3. Claude 检索 + 引用 + 回答

### 3. 数据分析师 → Computer Use

1. Claude 自动访问 dashboard
2. 提取关键指标
3. 生成日报

## 最佳实践

1. **Artifacts**: 明确要求"可运行的代码"
2. **Projects**: 知识库要结构化、清洁
3. **Instructions**: 详细、具体、有示例
4. **迭代**: 先小后大，逐步完善

## 总结

Claude Artifacts + Projects 是 **2026 年最被低估的 AI 功能**，设计师、产品、律师都能用。`,
    coverUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
    category: 'tutorial',
    tags: ['Claude', 'Artifacts', 'Projects'],
    author: '小马科技',
    relatedToolSlugs: ['claude'],
    publishedAt: '2026-06-21T00:00:00Z',
    views: 4400,
  },
  {
    id: '19',
    slug: 'ai-agent-frameworks-2026',
    title: '2026 年 AI Agent 框架横评：LangGraph vs AutoGen vs CrewAI',
    excerpt: '三大主流 Agent 框架深度对比，帮你选对工具。',
    content: `## 为什么需要 Agent 框架？

- **多步任务**：LLM 自己循环
- **多 Agent 协作**：分工合作
- **工具集成**：Function Calling 标准化
- **状态管理**：保存对话历史
- **可观测性**：调试、追踪

## 三大框架对比

### LangGraph (LangChain)

\`\`\`python
from langgraph.graph import StateGraph

class State(TypedDict):
    messages: list
    next: str

def research(state):
    return {"messages": state["messages"] + ["research done"]}

def write(state):
    return {"messages": state["messages"] + ["writing done"]}

graph = StateGraph(State)
graph.add_node("research", research)
graph.add_node("write", write)
graph.add_edge("research", "write")

app = graph.compile()
result = app.invoke({"messages": [], "next": ""})
\`\`\`

**特点**:
- 基于图（Graph）
- 灵活的状态机
- LangChain 生态完善

### AutoGen (Microsoft)

\`\`\`python
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent("assistant", llm_config={"model": "gpt-5.5"})
user_proxy = UserProxyAgent("user", code_execution_config={...})

user_proxy.initiate_chat(
    assistant,
    message="写一个计算斐波那契数列的函数"
)
\`\`\`

**特点**:
- 多 Agent 对话
- 内置代码执行
- 微软出品，企业友好

### CrewAI

\`\`\`python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="研究员",
    goal="搜集信息",
    backstory="你是经验丰富的研究员"
)

writer = Agent(
    role="作家",
    goal="写文章",
    backstory="你是知名作家"
)

task1 = Task(description="研究 AI 趋势", agent=researcher)
task2 = Task(description="写一篇 1000 字文章", agent=writer)

crew = Crew(agents=[researcher, writer], tasks=[task1, task2])
crew.kickoff()
\`\`\`

**特点**:
- 角色化 (Role-based)
- 易于理解
- 适合业务团队

## 详细对比

| 维度 | LangGraph | AutoGen | CrewAI |
|---|---|---|---|
| 学习曲线 | 中 | 中 | 低 |
| 灵活性 | 高 | 中 | 中 |
| 文档 | 好 | 好 | 中 |
| 社区 | 大 | 大 | 中 |
| 性能 | 快 | 中 | 中 |
| 状态管理 | 强 | 弱 | 弱 |
| 调试 | 强 | 中 | 弱 |
| 多 Agent | ✅ | ✅ | ✅ |
| Human-in-loop | ✅ | ✅ | ❌ |
| 代码执行 | 需自己接 | ✅ 内置 | ✅ 内置 |

## 适用场景

### LangGraph 适合:
- 复杂状态机
- 条件分支
- 生产级应用
- 大团队

### AutoGen 适合:
- 研究项目
- 代码生成
- 多轮对话
- 微软生态

### CrewAI 适合:
- 业务团队
- 快速原型
- 角色化任务
- 业务流程

## 实战：构建研究助手

### LangGraph 实现（使用 GPT-5.5）

\`\`\`python
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI

class State(TypedDict):
    query: str
    search_results: str
    summary: str
    final_answer: str

# 用 GPT-5.5（2026 最新）
llm = ChatOpenAI(model="gpt-5.5")

def search(state: State):
    # 调用搜索 API
    results = tavily.search(state["query"])
    return {"search_results": results}

def summarize(state: State):
    prompt = f"总结以下搜索结果:\\n{state['search_results']}"
    response = llm.invoke(prompt)
    return {"summary": response.content}

def answer(state: State):
    prompt = f"基于总结回答问题：{state['query']}\\n总结：{state['summary']}"
    response = llm.invoke(prompt)
    return {"final_answer": response.content}

graph = StateGraph(State)
graph.add_node("search", search)
graph.add_node("summarize", summarize)
graph.add_node("answer", answer)
graph.add_edge("search", "summarize")
graph.add_edge("summarize", "answer")
graph.add_edge("answer", END)

graph.set_entry_point("search")
app = graph.compile()

result = app.invoke({"query": "2026 年 AI 趋势"})
print(result["final_answer"])
\`\`\`

### AutoGen 实现

\`\`\`python
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

researcher = AssistantAgent(
    name="researcher",
    system_message="你是研究员，擅长信息搜集",
    llm_config={"model": "gpt-5.5"}  # 用 GPT-5.5
)

writer = AssistantAgent(
    name="writer",
    system_message="你是作家，擅长写作",
    llm_config={"model": "gpt-5.5"}
)

user = UserProxyAgent(
    name="user",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding"}
)

groupchat = GroupChat(
    agents=[user, researcher, writer],
    messages=[],
    max_round=10
)

manager = GroupChatManager(groupchat=groupchat, llm_config={"model": "gpt-5.5"})

user.initiate_chat(manager, message="研究 2026 年 AI 趋势并写一篇 1000 字报告")
\`\`\`

### CrewAI 实现

\`\`\`python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="高级研究员",
    goal="搜集 2026 年 AI 趋势",
    backstory="你在科技行业有 10 年经验",
    verbose=True
)

writer = Agent(
    role="科技作家",
    goal="写一份 1000 字报告",
    backstory="你是知名科技作家",
    verbose=True
)

research_task = Task(
    description="研究 2026 年 AI 行业的 5 大趋势",
    agent=researcher
)

write_task = Task(
    description="基于研究写一份 1000 字报告",
    agent=writer
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    verbose=2
)

result = crew.kickoff()
print(result)
\`\`\`

## 性能基准

| 框架 | 平均延迟 | token/任务 | 成功率 |
|---|---|---|---|
| LangGraph | 8.2s | 12K | 92% |
| AutoGen | 11.5s | 15K | 88% |
| CrewAI | 9.8s | 14K | 85% |

## 与本项目画布的集成

本项目 ([xiaoma-AI-net](https://github.com/)) 的画布已支持：

- **拖拽节点**：可视化编排 Agent
- **多框架支持**：LangGraph / AutoGen / CrewAI
- **实时调试**：查看每步思考
- **MCP 协议**：工具标准化

## 未来趋势

1. **MCP 协议**：工具标准化
2. **Computer Use**：操作 GUI
3. **多模态 Agent**：图像、音频、视频
4. **Agent Marketplace**：应用商店

## 总结

- **研究 / 实验**：AutoGen
- **生产应用**：LangGraph
- **快速原型 / 业务**：CrewAI
- **复杂可视化**：本项目画布 ✨`,
    coverUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?w=800',
    category: 'review',
    tags: ['AI Agent', 'LangGraph', 'AutoGen', 'CrewAI'],
    author: '小马科技',
    relatedToolSlugs: ['chatgpt', 'claude'],
    publishedAt: '2026-06-29T00:00:00Z',
    views: 7800,
  },
  {
    id: '20',
    slug: 'ai-image-style-guide',
    title: 'AI 图像风格指南：从写实到赛博朋克 12 种风格',
    excerpt: 'Midjourney / Stable Diffusion 通用风格关键词 + 案例展示。',
    content: `## 12 种主流 AI 图像风格

### 1. 写实摄影 (Photorealistic)

**关键词**:
\`\`\`
photorealistic, 8K, Canon EOS R5, 85mm lens, 
natural lighting, RAW photo
\`\`\`

**适用**: 产品图、人像、广告

### 2. 电影质感 (Cinematic)

**关键词**:
\`\`\`
cinematic, dramatic lighting, anamorphic lens, 
color grading, depth of field, Arri Alexa
\`\`\`

**参考导演**: Denis Villeneuve, Christopher Nolan

### 3. 油画 (Oil Painting)

**关键词**:
\`\`\`
oil painting on canvas, brush strokes visible, 
impasto technique, classical composition
\`\`\`

**参考画家**: Van Gogh, Monet, Rembrandt

### 4. 水彩 (Watercolor)

**关键词**:
\`\`\`
watercolor painting, soft washes, 
wet on wet technique, paper texture
\`\`\`

### 5. 赛博朋克 (Cyberpunk)

**关键词**:
\`\`\`
cyberpunk, neon lights, rain-soaked streets, 
Blade Runner aesthetic, futuristic Tokyo
\`\`\`

### 6. 动漫 (Anime)

**关键词**:
\`\`\`
anime style, Studio Ghibli, cel shading, 
vibrant colors, expressive eyes
\`\`\`

**参考**: 新海诚、宫崎骏、Anno Hideaki

### 7. 皮克斯 (Pixar/3D)

**关键词**:
\`\`\`
Pixar style, 3D render, cute characters, 
subsurface scattering, soft lighting
\`\`\`

### 8. 极简 (Minimalism)

**关键词**:
\`\`\`
minimalist, clean lines, negative space, 
muted colors, geometric shapes
\`\`\`

### 9. 中国水墨 (Chinese Ink)

**关键词**:
\`\`\`
Chinese ink painting, sumi-e, brush strokes, 
negative space, mountain landscape
\`\`\`

### 10. 蒸汽朋克 (Steampunk)

**关键词**:
\`\`\`
steampunk, brass gears, Victorian era, 
clockwork mechanisms, sepia tones
\`\`\`

### 11. 波普艺术 (Pop Art)

**关键词**:
\`\`\`
Pop Art, Andy Warhol style, bold colors, 
screen printing, halftone dots
\`\`\`

### 12. 未来主义 (Futurism)

**关键词**:
\`\`\`
futuristic, holographic UI, glowing edges, 
sci-fi architecture, Blade Runner 2049
\`\`\`

## 风格混合

**公式**: \`风格A + 风格B + 比例\`

**示例 1**: 80% 写实 + 20% 赛博朋克
\`\`\`
photorealistic portrait, subtle neon highlights 
in eyes and jewelry, 80% realistic 20% cyberpunk
\`\`\`

**示例 2**: 50% 中国水墨 + 50% 未来主义
\`\`\`
Chinese ink painting meets futuristic city, 
50% sumi-e 50% cyberpunk, holographic mountains
\`\`\`

## 实战：电商产品图

### 风格 1: 极简白底

\`\`\`
a perfume bottle on pure white background, 
minimalist, soft shadow, e-commerce style, 
8K, photorealistic --ar 1:1
\`\`\`

### 风格 2: 生活方式

\`\`\`
a perfume bottle on a marble vanity, 
golden hour lighting, lifestyle photography, 
warm tones, 4K --ar 4:5
\`\`\`

### 风格 3: 节日营销

\`\`\`
a perfume bottle surrounded by red roses, 
Christmas decorations, festive mood, 
cinematic lighting --ar 16:9
\`\`\`

## 实战：人像摄影

### 风格 1: 商业头像

\`\`\`
professional headshot, clean background, 
studio lighting, confident expression, 
business attire, 85mm lens, 4K
\`\`\`

### 风格 2: 时尚杂志

\`\`\`
fashion magazine cover, dramatic pose, 
bold makeup, Vogue style, high fashion, 
editorial lighting
\`\`\`

### 风格 3: 概念艺术

\`\`\`
character concept art, full body, 
multiple views, fantasy armor, 
ornate details, illustration
\`\`\`

## 平台对比

| 平台 | 写实 | 艺术 | 动漫 | 中文 |
|---|---|---|---|---|
| Midjourney | 强 | 强 | 中 | 弱 |
| Flux | 强 | 中 | 中 | 中 |
| SDXL | 中 | 强 | 强 | 中 |
| Ideogram | 中 | 中 | 弱 | 强 |
| Recraft | 中 | 强 | 中 | 中 |

## 最佳实践

1. **明确风格**：用具体艺术家/电影/平台作参考
2. **控制比例**：风格混合时说明比例
3. **细节词汇**：避免 "beautiful", 用具体词
4. **负面提示**：\`--no\` 排除不想要的元素

## 总结

掌握 12 种主流风格 + 混合公式，AI 图像创作的 80% 场景都能覆盖。`,
    coverUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800',
    category: 'guide',
    tags: ['AI 图像', '风格', 'Midjourney', 'Stable Diffusion'],
    author: '小马科技',
    relatedToolSlugs: ['midjourney', 'flux', 'ideogram'],
    publishedAt: '2026-06-27T00:00:00Z',
    views: 5800,
  },
]

export function getArticleBySlug(slug: string) {
  return articles.find(a => a.slug === slug)
}

export function getArticlesByCategory(category: string) {
  return articles.filter(a => a.category === category)
}

export function getRecentArticles(limit = 4) {
  return [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export function getRelatedArticles(article: Article, limit = 3) {
  return articles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, limit)
}

export function searchArticles(query: string) {
  if (!query) return articles
  const q = query.toLowerCase()
  return articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.excerpt.toLowerCase().includes(q) ||
    a.tags.some(tag => tag.toLowerCase().includes(q))
  )
}
