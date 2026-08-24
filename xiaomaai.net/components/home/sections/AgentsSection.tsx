'use client'

import Link from 'next/link'
import { Bot, ExternalLink, ChevronRight } from 'lucide-react'

const AGENTS = [
  {
    name: 'OpenClaw 中文版',
    desc: '能真正做事情的 AI Agents',
    icon: '🤖',
    url: '/tools/openclaw',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: '扣子 Coze',
    desc: 'AI 办公助手提升 50% 效率',
    icon: '🪄',
    url: '/tools/coze',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Clawdbot',
    desc: 'OpenClaw 智能体',
    icon: '🦾',
    url: '/tools/clawdbot',
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'n8n',
    desc: '强大的开源工作流程自动化',
    icon: '⚙️',
    url: '/tools/n8n',
    color: 'from-rose-500 to-pink-500',
  },
  {
    name: 'Dify',
    desc: '开源 LLM 应用开发平台',
    icon: '🧠',
    url: '/tools/dify',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'CoCoLoop',
    desc: 'AI 讨论社区',
    icon: '💬',
    url: '/tools/cocoloop',
    color: 'from-amber-500 to-yellow-500',
  },
]

export function AgentsSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
              <Bot className="size-4 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">超级智能体</h2>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
              Agent 时代
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            能自主完成复杂任务的 AI 智能体,代表下一代生产力
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {AGENTS.map((agent) => (
          <Link
            key={agent.name}
            href={agent.url}
            className="group flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-card-hover"
          >
            <div
              className={`mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${agent.color} text-2xl shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
            >
              {agent.icon}
            </div>
            <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
              {agent.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
              {agent.desc}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
