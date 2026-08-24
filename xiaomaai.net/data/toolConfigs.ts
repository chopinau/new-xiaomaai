// 工具 API 配置教程数据
// 为每个工具提供：API endpoint、认证方式、价格、限速、代码示例、SDK 链接

export type ToolConfig = {
  toolSlug: string
  apiBase?: string
  authMethod?: 'api_key' | 'oauth' | 'bearer' | 'none'
  signupUrl?: string
  pricingTiers?: { name: string; price: string; quota: string; features: string[] }[]
  rateLimit?: string
  sdkLanguages?: string[]
  codeExamples?: { language: string; label: string; code: string }[]
  notes?: string
}

export const toolConfigs: Record<string, ToolConfig> = {
  chatgpt: {
    toolSlug: 'chatgpt',
    apiBase: 'https://api.openai.com/v1',
    authMethod: 'bearer',
    signupUrl: 'https://platform.openai.com/signup',
    pricingTiers: [
      { name: 'Free', price: '$0/月', quota: 'GPT-5.4 mini 无限', features: ['基础对话', 'GPT-5.4 mini'] },
      { name: 'Plus', price: '$20/月', quota: 'GPT-5.5 80条/3h', features: ['GPT-5.5', 'GPTs', 'GPT Image 1.5', '数据分析'] },
      { name: 'Pro', price: '$200/月', quota: '无限 GPT-5.5 Pro + o3 Pro', features: ['o3 Pro', 'Sora 2 无限', '优先访问'] },
    ],
    rateLimit: 'Tier 1: 500 RPM / 30K TPM',
    sdkLanguages: ['Python', 'Node.js', 'Go', 'Java', 'curl'],
    codeExamples: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "你好"}]
  }'`,
      },
      {
        language: 'python',
        label: 'Python',
        code: `from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5.5",  # 2026-04 最新旗舰
    messages=[{"role": "user", "content": "你好"}]
)
print(response.choices[0].message.content)`,
      },
    ],
    notes: '国内访问需用代理；推荐用环境变量管理密钥；GPT-5.5 输入 ¥36/M、输出 ¥216/M tokens',
  },
  claude: {
    toolSlug: 'claude',
    apiBase: 'https://api.anthropic.com/v1',
    authMethod: 'api_key',
    signupUrl: 'https://console.anthropic.com/',
    pricingTiers: [
      { name: 'Free', price: '$0', quota: 'claude.ai 网页', features: ['基础对话', 'Sonnet 5'] },
      { name: 'Pro', price: '$20/月', quota: '5x 用量', features: ['Claude Sonnet 5', 'Projects', 'Artifacts', 'Computer Use'] },
      { name: 'Team', price: '$25/人/月', quota: '团队协作', features: ['协作', '管理后台', 'Opus 4.8'] },
    ],
    rateLimit: 'Tier 1: 50 RPM / 40K TPM',
    sdkLanguages: ['Python', 'TypeScript', 'Java', 'Go', 'curl'],
    codeExamples: [
      {
        language: 'curl',
        label: 'cURL',
        code: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-5-20260401",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "你好"}]
  }'`,
      },
    ],
    notes: '支持 1M tokens 上下文；Sonnet 5 输入 ¥14/M、输出 ¥72/M；长文档分析首选',
  },
  midjourney: {
    toolSlug: 'midjourney',
    authMethod: 'none',
    signupUrl: 'https://discord.gg/midjourney',
    pricingTiers: [
      { name: 'Basic', price: '$10/月', quota: '3.3 GPU 小时', features: ['基础生成', '会员画廊'] },
      { name: 'Standard', price: '$30/月', quota: '15 GPU 小时', features: ['快速模式', '私密生成'] },
      { name: 'Pro', price: '$60/月', quota: '30 GPU 小时', features: ['快速模式 12h', 'Stealth'] },
      { name: 'Mega', price: '$120/月', quota: '60 GPU 小时', features: ['极速 30h', 'Stealth'] },
    ],
    sdkLanguages: ['Discord 命令行'],
    codeExamples: [
      {
        language: 'markdown',
        label: 'Discord',
        code: `/imagine prompt: a beautiful sunset over mountains, 
vibrant colors, oil painting style --ar 16:9 --s 750 --v 7`,
      },
    ],
    notes: '通过 Discord 使用；参数详见教程',
  },
  elevenlabs: {
    toolSlug: 'elevenlabs',
    apiBase: 'https://api.elevenlabs.io/v1',
    authMethod: 'api_key',
    signupUrl: 'https://elevenlabs.io/',
    pricingTiers: [
      { name: 'Free', price: '$0', quota: '10K 字符/月', features: ['基础声音', '3 声音克隆'] },
      { name: 'Starter', price: '$5/月', quota: '30K 字符/月', features: ['商用许可', '更多声音'] },
      { name: 'Creator', price: '$22/月', quota: '100K 字符/月', features: ['专业克隆', 'API 访问'] },
      { name: 'Pro', price: '$99/月', quota: '500K 字符/月', features: ['优先队列', '高级支持'] },
    ],
    rateLimit: '默认: 10 RPS，可申请提高',
    sdkLanguages: ['Python', 'Node.js', 'cURL'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
    headers={"xi-api-key": "YOUR_KEY"},
    json={"text": "Hello world"}
)
with open("output.mp3", "wb") as f:
    f.write(response.content)`,
      },
    ],
    notes: '支持 29 种语言；Instant/Professional 两种克隆模式',
  },
  github_copilot: {
    toolSlug: 'github-copilot',
    authMethod: 'oauth',
    signupUrl: 'https://github.com/features/copilot',
    pricingTiers: [
      { name: 'Free', price: '$0', quota: '2K 补全/月', features: ['基础补全', '50 聊天消息'] },
      { name: 'Individual', price: '$10/月', quota: '无限补全', features: ['完整功能', 'Copilot Chat'] },
      { name: 'Business', price: '$19/用户/月', quota: '无限', features: ['企业管理', '隐私保护', 'PR 审查'] },
      { name: 'Enterprise', price: '$39/用户/月', quota: '无限', features: ['知识库集成', '微调模型'] },
    ],
    sdkLanguages: ['VSCode', 'JetBrains', 'Visual Studio', 'Neovim'],
    codeExamples: [
      {
        language: 'markdown',
        label: 'VSCode',
        code: `// 在 VSCode 中安装 GitHub Copilot 扩展
// 登录 GitHub 账号授权
// 开始在代码中看到灰色补全建议
// 按 Tab 接受补全

// 示例: 函数注释驱动代码
// 1. 输入函数注释
// 2. Copilot 自动建议实现
// 3. 按 Tab 接受`,
      },
    ],
    notes: '支持 IDE：VSCode、JetBrains、Visual Studio、Neovim 等',
  },
  deepseek: {
    toolSlug: 'deepseek',
    apiBase: 'https://api.deepseek.com',
    authMethod: 'bearer',
    signupUrl: 'https://platform.deepseek.com/',
    pricingTiers: [
      { name: 'API 充值', price: '¥1 / 1M tokens', quota: '按量付费', features: ['DeepSeek-V4 Pro', 'DeepSeek-V4 Flash', 'DeepSeek-R2'] },
      { name: '网页', price: '免费', quota: '无限', features: ['基础对话', '联网搜索', '深度思考'] },
    ],
    rateLimit: '默认: 60 RPM，付费用户更高',
    sdkLanguages: ['Python', 'Node.js', 'OpenAI 兼容'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python (OpenAI 兼容)',
        code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",  # 2026 默认 V3.2；可用 deepseek-v4-pro 升级
    messages=[{"role": "user", "content": "你好"}]
)
print(response.choices[0].message.content)`,
      },
    ],
    notes: 'OpenAI 兼容协议，可直接换 base_url；国内直连；V4 Pro 1M 上下文，输入 ¥3.1/M',
  },
  kimi: {
    toolSlug: 'kimi',
    apiBase: 'https://api.moonshot.cn/v1',
    authMethod: 'bearer',
    signupUrl: 'https://platform.moonshot.cn/',
    pricingTiers: [
      { name: '按量付费', price: '¥12 / 1M tokens', quota: '按 token 计费', features: ['moonshot-v1-8k', '32k', '128k'] },
    ],
    rateLimit: '默认: 200 RPM',
    sdkLanguages: ['Python', 'Node.js', 'OpenAI 兼容'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python',
        code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://api.moonshot.cn/v1"
)

response = client.chat.completions.create(
    model="moonshot-v1-128k",
    messages=[{"role": "user", "content": "你好"}]
)`,
      },
    ],
    notes: 'OpenAI 兼容；128K 长上下文',
  },
  qwen: {
    toolSlug: 'qwen',
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    authMethod: 'bearer',
    signupUrl: 'https://dashscope.console.aliyun.com/',
    pricingTiers: [
      { name: '免费额度', price: '¥0', quota: '1M tokens (3个月)', features: ['qwen-turbo', 'qwen-plus', 'qwen3-max'] },
      { name: '按量付费', price: '¥0.4-12 / 1M tokens', quota: '按模型阶梯', features: ['全模型', '更长上下文', 'Qwen3-Coder'] },
    ],
    sdkLanguages: ['Python', 'Java', 'Node.js', 'OpenAI 兼容'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python (OpenAI 兼容)',
        code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

response = client.chat.completions.create(
    model="qwen3-max",  # 2026 最新 Qwen3-Max
    messages=[{"role": "user", "content": "你好"}]
)`,
      },
    ],
    notes: '阿里云百炼；OpenAI 兼容；Qwen3-Max 262K 上下文，输入 ¥12/M、输出 ¥46/M',
  },
  sora: {
    toolSlug: 'sora',
    authMethod: 'none',
    signupUrl: 'https://openai.com/sora',
    pricingTiers: [
      { name: 'ChatGPT Plus', price: '$20/月', quota: '50 次 720p', features: ['基础视频生成'] },
      { name: 'ChatGPT Pro', price: '$200/月', quota: '无限 1080p', features: ['Sora 2', '高分辨率'] },
    ],
    sdkLanguages: ['ChatGPT Web', 'Sora iOS App'],
    codeExamples: [
      {
        language: 'markdown',
        label: 'ChatGPT',
        code: `# 在 ChatGPT 中:
1. 选择 Sora 模型
2. 输入提示词: "A cat walking through a garden, cinematic"
3. 选择分辨率: 720p / 1080p
4. 选择时长: 5s / 10s / 20s
5. 生成`,
      },
    ],
    notes: 'Sora 2 支持物理一致性、音画同步、最长 2 分钟',
  },
  heygen: {
    toolSlug: 'heygen',
    apiBase: 'https://api.heygen.com/v2',
    authMethod: 'bearer',
    signupUrl: 'https://heygen.com/',
    pricingTiers: [
      { name: 'Free', price: '$0', quota: '10 credits', features: ['1 视频', '试用水印'] },
      { name: 'Creator', price: '$29/月', quota: '100 credits', features: ['高清视频', '商用许可'] },
      { name: 'Business', price: '$99/月', quota: '660 credits', features: ['品牌定制', 'API'] },
    ],
    sdkLanguages: ['Python', 'Node.js', 'Webhook'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python',
        code: `import requests

response = requests.post(
    "https://api.heygen.com/v2/video/generate",
    headers={"X-Api-Key": "YOUR_KEY"},
    json={
        "video_inputs": [{
            "character": {
                "type": "avatar",
                "avatar_id": "Daisy-inskirt-20220818",
                "avatar_style": "normal"
            },
            "voice": {
                "type": "text",
                "input_text": "你好世界",
                "voice_id": "2d5b0e6cf36f460aa7fc47e3eee4ba54"
            }
        }],
        "dimension": {"width": 1280, "height": 720}
    }
)
print(response.json())`,
      },
    ],
    notes: '支持 40+ 语种、API 调用、批量生成',
  },
  gemini: {
    toolSlug: 'gemini',
    apiBase: 'https://generativelanguage.googleapis.com/v1',
    authMethod: 'api_key',
    signupUrl: 'https://aistudio.google.com/',
    pricingTiers: [
      { name: 'Free', price: '$0', quota: '60 RPM', features: ['Gemini 3.5 Flash', '1M context'] },
      { name: 'Pay-as-you-go', price: '$0.075/1M input', quota: '按量付费', features: ['全模型', '高限额'] },
    ],
    rateLimit: '免费: 60 RPM / 1M TPM',
    sdkLanguages: ['Python', 'Node.js', 'Go', 'Java', 'REST'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python',
        code: `import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel('gemini-3.5-flash')  # 2026 最新 Flash

response = model.generate_content("你好")
print(response.text)`,
      },
    ],
    notes: '免费层即可使用 3.5 Flash；多模态 + 长上下文；3.1 Pro 输入 ¥14/M、输出 ¥86/M',
  },
  grok: {
    toolSlug: 'grok',
    apiBase: 'https://api.x.ai/v1',
    authMethod: 'bearer',
    signupUrl: 'https://console.x.ai/',
    pricingTiers: [
      { name: 'Grok 网页', price: '$0 / $8/月', quota: '有限/无限', features: ['Grok 4', 'X 平台集成', '实时联网'] },
      { name: 'API', price: '$3 / 1M input', quota: '按量付费', features: ['grok-4', 'grok-4-fast', 'grok-4-vision'] },
    ],
    rateLimit: 'API 默认: 60 RPM',
    sdkLanguages: ['Python', 'Node.js', 'OpenAI 兼容'],
    codeExamples: [
      {
        language: 'python',
        label: 'Python (OpenAI 兼容)',
        code: `from openai import OpenAI

client = OpenAI(
    api_key="xai-xxx",
    base_url="https://api.x.ai/v1"
)

response = client.chat.completions.create(
    model="grok-4-latest",  # 2026 最新 Grok 4
    messages=[{"role": "user", "content": "你好"}]
)`,
      },
    ],
    notes: 'X 平台内置；OpenAI 兼容；Grok 4 输入 ¥22/M、输出 ¥108/M；2M context（Fast 版）',
  },
}

export function getToolConfig(slug: string): ToolConfig | undefined {
  return toolConfigs[slug]
}

export function hasToolConfig(slug: string): boolean {
  return slug in toolConfigs
}
