export interface Announcement {
  id: string
  type: 'news' | 'tool' | 'event'
  text: string
  link?: string
}

export const announcements: Announcement[] = [
  { id: '1', type: 'news', text: '🎉 GPT-5.5 正式发布，上下文窗口扩展至 256K', link: '/news' },
  { id: '2', type: 'tool', text: '🆕 新增 DeepSeek V4 Flash、Kimi K2.6 等 12 个模型', link: '/pricing' },
  { id: '3', type: 'event', text: '⚡ 小马 AI OpenAPI 代理站即将上线，敬请期待', link: '/api' },
  { id: '4', type: 'news', text: '📢 Claude Sonnet 5 发布，1M 上下文 + 复杂推理全面升级', link: '/news' },
  { id: '5', type: 'tool', text: '🛠️ 小马 AI 客户端 Codex x MCP 公测即将开放', link: '/codex' },
  { id: '6', type: 'event', text: '🔥 限时充值送 10% 额度，活动进行中', link: '/pricing' },
]