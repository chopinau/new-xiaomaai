'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Sparkles,
  Bot,
  Zap,
  Code2,
  Terminal,
  Copy,
  Check,
  Boxes,
  Workflow,
  FileCode,
  Layers,
  Cpu,
  Rocket,
  Wrench,
  BookOpen,
  GitBranch,
  Wand2,
  Image as ImageIcon,
  Type,
  ExternalLink,
  ArrowRight,
  PlayCircle,
  Server,
  CircuitBoard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TopNav } from '@/components/TopNav'

const MCP_TOOLS = [
  {
    name: 'canvas_get_state',
    desc: '获取画布当前状态（节点 + 连线 + 选中节点）',
    icon: Boxes,
    params: [{ name: '无', type: 'void', desc: '返回完整 state 快照' }],
  },
  {
    name: 'canvas_apply_ops',
    desc: '原子化应用操作：add/remove/update 节点与连线',
    icon: GitBranch,
    params: [
      { name: 'ops', type: 'Op[]', desc: '操作队列：add_node / remove_node / add_edge / update_node' },
    ],
  },
  {
    name: 'canvas_create_prompt_node',
    desc: '创建提示词节点（自动定位 / 智能连线）',
    icon: Type,
    params: [
      { name: 'text', type: 'string', desc: '提示词内容' },
      { name: 'x?', type: 'number', desc: '可选 X 坐标' },
      { name: 'y?', type: 'number', desc: '可选 Y 坐标' },
    ],
  },
  {
    name: 'canvas_create_image_node',
    desc: '创建图片生成节点（自动触发 / 加入队列）',
    icon: ImageIcon,
    params: [
      { name: 'promptNodeId', type: 'string', desc: '上游提示词节点 ID' },
      { name: 'model?', type: 'string', desc: '模型选择：sora / midjourney / flux 等' },
    ],
  },
  {
    name: 'canvas_export_snapshot',
    desc: '导出画布快照（PNG / JSON / 压缩包）',
    icon: Layers,
    params: [
      { name: 'format', type: "'png' | 'json'", desc: '导出格式' },
    ],
  },
]

const WORKFLOWS = [
  {
    title: '批量反推 + 生图流水线',
    desc: '上传 50 张产品图 → 反推提示词 → 套用模板批量生图',
    icon: Workflow,
    steps: [
      '遍历输入目录，调用 canvas_create_image_node 创建反推节点',
      '监听每个反推节点完成事件，调用 canvas_create_prompt_node 写回提示词',
      '自动连线 prompt → generate 节点，触发批量生图',
      '导出快照到 ./output/{date}/',
    ],
    code: `请在画布上创建 5 个图片反推任务，分别对应 ./input/ 下的 1.png ~ 5.png，
每个反推节点完成后再创建对应的提示词节点，提示词模板：
"专业产品摄影，{subject}，{background}，{lighting}，白底"
最后把每个反推节点和它对应的提示词节点用线连起来。`,
  },
  {
    title: '提示词 → 视频 → 详情页',
    desc: '一条自然语言 → 多镜视频 → 落地页三件套',
    icon: PlayCircle,
    steps: [
      '用户输入：「为夏季新品『海风椰子水』生成 3 段短视频 + 详情页」',
      'Codex 解析意图，调用 canvas_apply_ops 创建 1 个 prompt 节点 + 3 个 image 节点',
      '每个 image 节点配置 Sora 2 + 不同镜头（推/拉/摇）',
      '完成后创建 1 个 detailPage 节点汇总视频 + 文案',
    ],
    code: `为新品"海风椰子水"在画布上创建：
- 1 个中央提示词节点，写入核心 brief
- 3 个 Sora 2 视频节点，分别用推/拉/摇镜头
- 1 个详情页节点，把 3 段视频拼成主图 + 文案

每个视频节点从中央提示词节点连线过来。`,
  },
  {
    title: 'A/B 变体批量生成',
    desc: '一个母版 → 100 个变体 → 自动化筛选',
    icon: CircuitBoard,
    steps: [
      '从母版提示词复制 100 份，注入随机变量（背景/光/角度/风格）',
      '并行触发 100 个 generate 节点（每帧 10 个，避免压力）',
      '采集所有变体的 result_url，写入 ./variants.csv',
      'Codex 自动按 prompt 相似度聚类，输出 Top-10 供人工挑选',
    ],
    code: `基于画布上名为"主图模板"的提示词节点，
复制 100 份并随机替换：
- 背景（白/灰/木/大理石/户外）
- 光线（柔光/硬光/逆光/自然光）
- 角度（俯拍/平拍/45度）
- 风格（极简/国潮/赛博/复古）
每份独立连到一个 generate 节点，模型选 Flux。`,
  },
]

const PROMPT_TEMPLATES = [
  {
    title: '反推节点 → 提示词节点',
    when: '上传一张参考图想要扩写为多张变体',
    template: `读取画布中所有 image 节点（type=text），
为每个反推节点创建一个 prompt 节点，
提示词 = "{反推结果}，{用户给的风格修饰}，{用户给的画幅参数}"，
两个节点用 line 连起来。`,
  },
  {
    title: '批量压缩画布',
    when: '画布塞满，需要归档',
    template: `调用 canvas_export_snapshot 导出当前画布：
- format: json
- 同时调用 canvas_apply_ops 清空所有节点和边
- 但保留节点标题和最后更新时间到 archive.json`,
  },
  {
    title: 'Codex 内部 + 画布联动',
    when: '在 Codex 会话中操作画布',
    template: `我现在要在画布上做一个分层渲染流程：
1. 创建 1 个 detail 节点写"椰子水详情页"
2. 创建 1 个 sketch 节点，连接到 detail
3. 在 sketch 节点上创建 4 个子节点：背景层、产品层、文字层、Logo 层
4. 每个子节点都连回 detail

每一步用 canvas_apply_ops 提交，不要直接改 state。`,
  },
  {
    title: '一键快照发周报',
    when: '每周五自动把本周创作画布打包',
    template: `执行画布快照：
1. canvas_get_state 检查节点总数
2. canvas_export_snapshot 输出 PNG + JSON 到 ./weekly/{日期}/
3. 把 PNG 上传到 imgur 或 COS，返回 URL
4. 把 URL 发到飞书 #ai-创作 周报频道`,
  },
]

const QUICK_START_CODEX = `# 1. 安装 MCP server（小马画布）
codex mcp add xiaoma-canvas -- npx -y @xiaoma-ai/canvas-mcp mcp

# 2. 启动画布（确保 127.0.0.1:17371 可达）
cd mcp-server && node index.js

# 3. 在 Codex 中直接说人话
codex "在画布上创建一个反推节点，提示词是'海边日落'"

# 4. 或显式调用
codex /tool xiaoma-canvas:canvas_create_prompt_node --text "海边日落" --x 400 --y 300`

const QUICK_START_CLAUDE = `claude mcp add --scope user --transport stdio xiaoma-canvas \\
  -- npx -y @xiaoma-ai/canvas-mcp mcp

# 然后在 Claude Code 里直接说
> "把当前画布所有节点导出成 JSON，路径 ./backup-{date}.json"`

const QUICK_START_HTTP = `# 画布 MCP 同时提供 HTTP 接口（前端或脚本直接调）
curl -X POST http://127.0.0.1:17371/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "canvas_create_prompt_node",
      "arguments": { "text": "海边日落", "x": 400, "y": 300 }
    }
  }'`

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="group relative overflow-hidden rounded-lg border border-ink-200 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-1000 px-3 py-1.5">
        <span className="text-xs text-ink-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-ink-400 hover:bg-ink-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function CodexPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <TopNav />

      {/* Hero */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-10 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded border border-ink-100 px-3 py-1 text-xs text-ink-700">
            <Bot className="h-3.5 w-3.5" />
            <span>Codex 自动化 · MCP 协议</span>
          </div>
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-ink-900 md:text-5xl">
            让 Codex 直接操作你的画布
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-base text-ink-600">
            基于 <span className="font-semibold text-ink-900">MCP (Model Context Protocol)</span> 协议，
            把 AI 工具链的 <span className="font-semibold text-ink-900">批量反推 / 生图 / 拼版 / 导出</span> 全部交给 Codex / Claude Code 自动化。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild className="h-9 bg-ink-900 px-4 text-white hover:bg-ink-800">
              <Link href="#quick-start">
                <Rocket className="mr-2 h-3.5 w-3.5" />
                5 分钟接入
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9 border-ink-200 bg-white px-4 text-ink-700 hover:border-ink-900">
              <Link href="#tools">
                <Wrench className="mr-2 h-3.5 w-3.5" />
                查看 5 个工具
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-9 px-4 text-ink-600 hover:text-ink-900">
              <Link href="/canvas">
                <CircuitBoard className="mr-2 h-3.5 w-3.5" />
                打开画布
              </Link>
            </Button>
          </div>

          {/* 能力速览 */}
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, label: '批量化', desc: '一次操作 100+ 节点' },
              { icon: Workflow, label: '可编排', desc: 'AI 写流程，人审结果' },
              { icon: Cpu, label: '零后端', desc: 'MCP stdio 直连本地' },
              { icon: Sparkles, label: '可复用', desc: '提示词模板即工作流' },
            ].map((it) => (
              <div key={it.label} className="rounded border border-ink-100 bg-white p-4 text-left">
                <it.icon className="mb-2 h-5 w-5 text-ink-700" />
                <div className="text-sm font-semibold text-ink-900">{it.label}</div>
                <div className="mt-0.5 text-xs text-ink-500">{it.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 什么是 MCP */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              基础概念
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">什么是 MCP？</h2>
            <p className="mt-2 text-sm text-ink-500">Model Context Protocol · 让 LLM 工具调用的标准协议</p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {[
              {
                icon: Server,
                title: 'Server',
                desc: '我们的小马画布 MCP Server 暴露了 5 个工具（创建节点、连线、导出等），运行在 127.0.0.1:17371。',
              },
              {
                icon: Bot,
                title: 'Client',
                desc: 'Codex / Claude Code 作为 MCP Client，通过 stdio 或 HTTP 与 Server 通信，把你的自然语言翻译成工具调用。',
              },
              {
                icon: Wand2,
                title: '效果',
                desc: '你说"反推 50 张图"，Codex 自动循环调用 50 次 canvas_create_image_node，你只需坐着等结果。',
              },
            ].map((it) => (
              <div key={it.title} className="rounded border border-ink-100 bg-white p-4">
                <it.icon className="mb-3 h-6 w-6 text-ink-700" />
                <h3 className="mb-1 text-base font-bold text-ink-900">{it.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600">{it.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded border border-ink-100 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Sparkles className="h-3.5 w-3.5" />
              为什么选择 MCP 而不是 Function Call？
            </div>
            <ul className="space-y-1 text-xs text-ink-700">
              <li>✓ <span className="font-medium text-ink-900">通用协议</span>：Claude / Codex / Gemini CLI 都支持，一次接入多端通用</li>
              <li>✓ <span className="font-medium text-ink-900">本地优先</span>：stdio 模式零延迟，状态在你机器上</li>
              <li>✓ <span className="font-medium text-ink-900">可观测</span>：所有调用都进 mcp.log，调试方便</li>
              <li>✓ <span className="font-medium text-ink-900">可中断</span>：Ctrl-C 即停，状态回滚有 history 栈</li>
              <li>✓ <span className="font-medium text-ink-900">MIT 协议</span>：不基于任何 AGPL 项目，商业可用</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5 个工具 */}
      <section id="tools" className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              工具列表
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">5 个原子工具</h2>
            <p className="mt-2 text-sm text-ink-500">组合使用可以完成 90% 的画布操作</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="rounded border border-ink-100 bg-white p-4">
                <div className="mb-2 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-ink-100">
                    <tool.icon className="h-4 w-4 text-ink-700" />
                  </div>
                  <div className="flex-1">
                    <code className="text-sm font-semibold text-ink-900">{tool.name}</code>
                    <p className="mt-0.5 text-xs text-ink-500">{tool.desc}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 border-t border-ink-100 pt-2">
                  {tool.params.map(p => (
                    <div key={p.name} className="flex items-baseline gap-2 text-[11px]">
                      <code className="rounded border border-ink-100 px-1.5 py-0.5 font-mono text-ink-900">
                        {p.name}
                      </code>
                      <span className="text-ink-400">:</span>
                      <code className="font-mono text-ink-700">{p.type}</code>
                      <span className="flex-1 text-ink-500">— {p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 分钟接入 */}
      <section id="quick-start" className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              Quick Start
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">5 分钟接入</h2>
            <p className="mt-2 text-sm text-ink-500">三种客户端：Codex CLI / Claude Code / 任意 HTTP 客户端</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Terminal className="h-4 w-4 text-ink-700" />
                方式一：Codex CLI（推荐）
              </div>
              <CodeBlock code={QUICK_START_CODEX} language="bash" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Terminal className="h-4 w-4 text-ink-700" />
                方式二：Claude Code
              </div>
              <CodeBlock code={QUICK_START_CLAUDE} language="bash" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-base font-semibold text-ink-900">
                <Code2 className="h-4 w-4 text-ink-700" />
                方式三：HTTP 直调
              </div>
              <CodeBlock code={QUICK_START_HTTP} language="bash" />
            </div>
          </div>
        </div>
      </section>

      {/* 实战工作流 */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              实战模板
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">3 个生产级工作流</h2>
            <p className="mt-2 text-sm text-ink-500">复制提示词 → 粘贴到 Codex → 见证自动化</p>
          </div>

          <div className="space-y-4">
            {WORKFLOWS.map((wf) => (
              <div key={wf.title} className="rounded border border-ink-100 bg-white p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-ink-100">
                    <wf.icon className="h-4 w-4 text-ink-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">{wf.title}</h3>
                    <p className="text-xs text-ink-500">{wf.desc}</p>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {wf.steps.map((s, j) => (
                    <div key={j} className="rounded border border-ink-100 p-2.5 text-xs text-ink-700">
                      <span className="mr-1 font-mono text-ink-900">{j + 1}.</span>
                      {s}
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-semibold text-ink-500">提示词（直接发给 Codex）：</div>
                <div className="mt-1.5">
                  <CodeBlock code={wf.code} language="natural language" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 提示词模板 */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              提示词库
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">可复用提示词模板</h2>
            <p className="mt-2 text-sm text-ink-500">拷走就用，越用越顺手</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {PROMPT_TEMPLATES.map((p) => (
              <div key={p.title} className="rounded border border-ink-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-ink-700" />
                  <h3 className="text-sm font-semibold text-ink-900">{p.title}</h3>
                </div>
                <p className="mb-2 text-xs text-ink-500">
                  <span className="font-semibold text-ink-700">场景：</span>
                  {p.when}
                </p>
                <CodeBlock code={p.template} language="natural language" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 架构图 */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              架构
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">数据流</h2>
            <p className="mt-2 text-sm text-ink-500">从自然语言到画布像素，完整链路</p>
          </div>

          <div className="rounded border border-ink-100 bg-white p-6">
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-5">
              {[
                { icon: Type, label: '自然语言', sub: '「反推 50 张图」' },
                { icon: Bot, label: 'Codex / Claude', sub: '解析意图' },
                { icon: Server, label: 'MCP Server', sub: '5 个原子工具' },
                { icon: CircuitBoard, label: '画布状态', sub: 'in-memory + JSON' },
                { icon: ImageIcon, label: '渲染输出', sub: 'PNG / 视频 / HTML' },
              ].map((step, i) => (
                <div key={step.label} className="relative">
                  <div className="rounded border border-ink-100 p-3 text-center">
                    <step.icon className="mx-auto mb-1.5 h-6 w-6 text-ink-700" />
                    <div className="text-sm font-semibold text-ink-900">{step.label}</div>
                    <div className="mt-0.5 text-[11px] text-ink-500">{step.sub}</div>
                  </div>
                  {i < 4 && (
                    <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-ink-400 md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 路线图 */}
      <section className="border-b border-ink-100">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded border border-ink-100 px-2.5 py-0.5 text-xs text-ink-700">
              Roadmap
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">路线图</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                ver: 'v0.1（已上线）',
                title: '5 个原子工具 + HTTP / stdio',
                desc: '基础 CRUD + 创建提示词/图片节点 + 导出快照',
              },
              {
                ver: 'v0.2（计划中）',
                title: '流式事件 + 进度回调',
                desc: '支持 SSE，Codex 可以实时显示每个节点的生成进度',
              },
              {
                ver: 'v0.3（构想中）',
                title: '多画布协同 + 权限',
                desc: '团队共享画布，Codex 按角色操作不同工作区',
              },
            ].map((r) => (
              <div key={r.ver} className="rounded border border-ink-100 bg-white p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-ink-900" />
                  <span className="text-[11px] font-mono text-ink-500">{r.ver}</span>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-ink-900">{r.title}</h3>
                <p className="text-xs text-ink-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container mx-auto px-4 py-12">
          <div className="rounded border border-ink-100 p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-ink-700" />
            <h2 className="mb-2 text-2xl font-bold text-ink-900">开始你的第一次自动化</h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-ink-600">
              打开画布，在 Codex 里说一句"帮我创建 5 个反推节点"，体验 AI 编排画布的乐趣。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild className="h-9 bg-ink-900 px-4 text-white hover:bg-ink-800">
                <Link href="/canvas">
                  <CircuitBoard className="mr-2 h-3.5 w-3.5" />
                  打开画布
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9 border-ink-200 bg-white px-4 text-ink-700 hover:border-ink-900">
                <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  MCP 官方文档
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 bg-white py-6 text-center text-[11px] text-ink-400">
        <p>小马 AI 工具中心 · Codex 自动化 · MIT 协议 · 独立实现，不基于 AGPL 项目</p>
      </footer>
    </div>
  )
}
