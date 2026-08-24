// 草稿区: GitHub Actions 抓取热门 AI 工具后写入,人工在 /admin/tools 审核入库
// 本文件会被 scripts/fetch-trending.mjs 定时覆盖,请勿手工编辑数据

import type { Tool } from './tools'

export interface ToolDraft {
  source: 'github-trending' | 'producthunt' | 'submit' | 'faxianai' | 'toolify' | 'aitaaft' | 'futurepedia' | 'aibase' | 'ai-bot' | 'ai-nav'
  sourceUrl: string
  fetchedAt: string
  tool: Omit<Tool, 'id'> & { slug: string }
}

export const toolDrafts: ToolDraft[] = [
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/openclaw/openclaw",
    "tool": {
      "slug": "openclaw",
      "name": "openclaw",
      "description": "Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞 ",
      "url": "https://github.com/openclaw/openclaw",
      "logoUrl": "https://github.com/openclaw.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "assistant",
        "crustacean",
        "molty",
        "openclaw"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-11-24T10:16:47Z",
      "updatedAt": "2026-08-11T05:36:12Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/obra/superpowers",
    "tool": {
      "slug": "superpowers",
      "name": "superpowers",
      "description": "An agentic skills framework & software development methodology that works.",
      "url": "https://github.com/obra/superpowers",
      "logoUrl": "https://github.com/obra.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "brainstorming",
        "coding",
        "obra",
        "sdlc"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-10-09T19:45:18Z",
      "updatedAt": "2026-08-11T05:34:01Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/NousResearch/hermes-agent",
    "tool": {
      "slug": "hermes-agent",
      "name": "hermes-agent",
      "description": "The agent that grows with you",
      "url": "https://github.com/NousResearch/hermes-agent",
      "logoUrl": "https://github.com/NousResearch.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "ai-agent",
        "ai-agents",
        "anthropic",
        "chatgpt"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-07-22T22:22:28Z",
      "updatedAt": "2026-08-11T05:36:31Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/n8n-io/n8n",
    "tool": {
      "slug": "n8n",
      "name": "n8n",
      "description": "Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, self-host or cloud, 400+ integrations.",
      "url": "https://github.com/n8n-io/n8n",
      "logoUrl": "https://github.com/n8n-io.png?size=128",
      "category": "code",
      "tags": [
        "ai",
        "apis",
        "automation",
        "cli",
        "data-flow"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2019-06-22T09:24:21Z",
      "updatedAt": "2026-08-11T05:34:02Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/Significant-Gravitas/AutoGPT",
    "tool": {
      "slug": "AutoGPT",
      "name": "AutoGPT",
      "description": "AutoGPT is the vision of accessible AI for everyone, to use and to build on. Our mission is to provide the tools, so that you can focus on what matters.",
      "url": "https://github.com/Significant-Gravitas/AutoGPT",
      "logoUrl": "https://github.com/Significant-Gravitas.png?size=128",
      "category": "chat",
      "tags": [
        "agentic-ai",
        "agents",
        "ai",
        "artificial-intelligence",
        "autonomous-agents"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2023-03-16T09:21:07Z",
      "updatedAt": "2026-08-11T04:27:35Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/f/prompts.chat",
    "tool": {
      "slug": "prompts.chat",
      "name": "prompts.chat",
      "description": "f.k.a. Awesome ChatGPT Prompts. Share, discover, and collect prompts from the community. Free and open source — self-host for your organization with complete privacy.",
      "url": "https://github.com/f/prompts.chat",
      "logoUrl": "https://github.com/f.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "artificial-intelligence",
        "awesome-list",
        "chatgpt",
        "chatgpt-prompts"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2022-12-05T13:54:13Z",
      "updatedAt": "2026-08-11T05:04:58Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/firecrawl/firecrawl",
    "tool": {
      "slug": "firecrawl",
      "name": "firecrawl",
      "description": "The context API to search, scrape, and interact with the web at scale. 🔥",
      "url": "https://github.com/firecrawl/firecrawl",
      "logoUrl": "https://github.com/firecrawl.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "ai-agents",
        "ai-crawler",
        "ai-scraping",
        "ai-search"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2024-04-15T21:02:29Z",
      "updatedAt": "2026-08-11T05:37:11Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    "tool": {
      "slug": "stable-diffusion-webui",
      "name": "stable-diffusion-webui",
      "description": "Stable Diffusion web UI",
      "url": "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      "logoUrl": "https://github.com/AUTOMATIC1111.png?size=128",
      "category": "image",
      "tags": [
        "ai",
        "ai-art",
        "deep-learning",
        "diffusion",
        "gradio"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2022-08-22T14:05:26Z",
      "updatedAt": "2026-08-11T03:51:51Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/Snailclimb/JavaGuide",
    "tool": {
      "slug": "JavaGuide",
      "name": "JavaGuide",
      "description": "Java 面试 & 后端通用面试指南，覆盖计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发",
      "url": "https://github.com/Snailclimb/JavaGuide",
      "logoUrl": "https://github.com/Snailclimb.png?size=128",
      "category": "code",
      "tags": [
        "agent",
        "ai",
        "context-engineering",
        "deepseek",
        "interview"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2018-05-07T13:27:00Z",
      "updatedAt": "2026-08-11T05:34:43Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/langgenius/dify",
    "tool": {
      "slug": "dify",
      "name": "dify",
      "description": "Build Agentic workflows, RAG pipelines, with rich AI model and tool support on one collaborative workspace. Deploy on cloud, VPC, or self-hosted, so teams move from prototype to production without reb",
      "url": "https://github.com/langgenius/dify",
      "logoUrl": "https://github.com/langgenius.png?size=128",
      "category": "productivity",
      "tags": [
        "agent",
        "agentic-ai",
        "agentic-framework",
        "agentic-workflow",
        "ai"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2023-04-12T07:40:24Z",
      "updatedAt": "2026-08-11T05:31:56Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/open-webui/open-webui",
    "tool": {
      "slug": "open-webui",
      "name": "open-webui",
      "description": "User-friendly AI Interface (Supports Ollama, OpenAI API, ...)",
      "url": "https://github.com/open-webui/open-webui",
      "logoUrl": "https://github.com/open-webui.png?size=128",
      "category": "chat",
      "tags": [
        "ai",
        "llm",
        "llm-ui",
        "llm-webui",
        "llms"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2023-10-06T22:08:27Z",
      "updatedAt": "2026-08-11T05:18:51Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/affaan-m/ECC",
    "tool": {
      "slug": "ECC",
      "name": "ECC",
      "description": "The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.",
      "url": "https://github.com/affaan-m/ECC",
      "logoUrl": "https://github.com/affaan-m.png?size=128",
      "category": "code",
      "tags": [
        "ai-agents",
        "anthropic",
        "claude",
        "claude-code",
        "developer-tools"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-01-18T00:51:51Z",
      "updatedAt": "2026-08-11T05:36:35Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/huggingface/transformers",
    "tool": {
      "slug": "transformers",
      "name": "transformers",
      "description": "🤗 Transformers: the model-definition framework for state-of-the-art machine learning models in text, vision, audio, and multimodal models, for both inference and training. ",
      "url": "https://github.com/huggingface/transformers",
      "logoUrl": "https://github.com/huggingface.png?size=128",
      "category": "image",
      "tags": [
        "audio",
        "deep-learning",
        "deepseek",
        "gemma",
        "glm"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2018-10-29T13:56:00Z",
      "updatedAt": "2026-08-11T05:37:28Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/Graphify-Labs/graphify",
    "tool": {
      "slug": "graphify",
      "name": "graphify",
      "description": "Turn any codebase, with its docs, SQL schemas, configs, and PDFs, into a queryable knowledge graph. A /graphify skill for Claude Code, Cursor, Codex, and Gemini CLI: local deterministic AST parsing, e",
      "url": "https://github.com/Graphify-Labs/graphify",
      "logoUrl": "https://github.com/Graphify-Labs.png?size=128",
      "category": "code",
      "tags": [
        "ai-agents",
        "antigravity",
        "ast",
        "claude-code",
        "code-analysis"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-04-03T15:49:07Z",
      "updatedAt": "2026-08-11T05:36:49Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/TauricResearch/TradingAgents",
    "tool": {
      "slug": "TradingAgents",
      "name": "TradingAgents",
      "description": "TradingAgents: Multi-Agents LLM Financial Trading Framework",
      "url": "https://github.com/TauricResearch/TradingAgents",
      "logoUrl": "https://github.com/TauricResearch.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "finance",
        "llm",
        "multiagent",
        "trading"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2024-12-28T03:31:08Z",
      "updatedAt": "2026-08-11T05:35:29Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/OpenHands/OpenHands",
    "tool": {
      "slug": "OpenHands",
      "name": "OpenHands",
      "description": "🙌 OpenHands: AI-Driven Development",
      "url": "https://github.com/OpenHands/OpenHands",
      "logoUrl": "https://github.com/OpenHands.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "artificial-intelligence",
        "chatgpt",
        "claude-ai",
        "cli"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2024-03-13T03:33:31Z",
      "updatedAt": "2026-08-11T05:33:34Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/lobehub/lobehub",
    "tool": {
      "slug": "lobehub",
      "name": "lobehub",
      "description": "🤯 LobeHub is your Chief Agent Operator, organizing your agents into 7×24 operations by hiring, scheduling, and reporting on your entire AI team.",
      "url": "https://github.com/lobehub/lobehub",
      "logoUrl": "https://github.com/lobehub.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "agent-collaboration",
        "agent-harness",
        "ai",
        "cao"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2023-05-21T07:19:12Z",
      "updatedAt": "2026-08-11T05:33:27Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/koala73/worldmonitor",
    "tool": {
      "slug": "worldmonitor",
      "name": "worldmonitor",
      "description": "Real-time global intelligence dashboard. AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface",
      "url": "https://github.com/koala73/worldmonitor",
      "logoUrl": "https://github.com/koala73.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "ai",
        "dashboard",
        "geopolitics",
        "mcp"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-01-08T17:26:06Z",
      "updatedAt": "2026-08-11T05:37:12Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/bytedance/deer-flow",
    "tool": {
      "slug": "deer-flow",
      "name": "deer-flow",
      "description": "An open-source long-horizon SuperAgent harness that researches, codes, and creates. With the help of sandboxes, memories, tools, skill, subagents and message gateway, it handles different levels of ta",
      "url": "https://github.com/bytedance/deer-flow",
      "logoUrl": "https://github.com/bytedance.png?size=128",
      "category": "code",
      "tags": [
        "agent",
        "agentic",
        "agentic-framework",
        "agentic-workflow",
        "ai"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-05-07T02:50:19Z",
      "updatedAt": "2026-08-11T05:17:29Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/dair-ai/Prompt-Engineering-Guide",
    "tool": {
      "slug": "Prompt-Engineering-Guide",
      "name": "Prompt-Engineering-Guide",
      "description": "🐙 Guides, papers, lessons, notebooks and resources for prompt engineering, context engineering, RAG, and AI Agents.",
      "url": "https://github.com/dair-ai/Prompt-Engineering-Guide",
      "logoUrl": "https://github.com/dair-ai.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "agents",
        "ai-agents",
        "chatgpt",
        "deep-learning"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2022-12-16T16:04:50Z",
      "updatedAt": "2026-08-11T05:22:35Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/Leonxlnx/taste-skill",
    "tool": {
      "slug": "taste-skill",
      "name": "taste-skill",
      "description": "Taste-Skill - gives your AI good taste. stops the AI from generating boring, generic slop ",
      "url": "https://github.com/Leonxlnx/taste-skill",
      "logoUrl": "https://github.com/Leonxlnx.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "ai",
        "claude",
        "claude-code",
        "codex"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-02-19T21:44:05Z",
      "updatedAt": "2026-08-11T05:36:40Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/hiyouga/LlamaFactory",
    "tool": {
      "slug": "LlamaFactory",
      "name": "LlamaFactory",
      "description": "Unified Efficient Fine-Tuning of 100+ LLMs & VLMs (ACL 2024)",
      "url": "https://github.com/hiyouga/LlamaFactory",
      "logoUrl": "https://github.com/hiyouga.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "ai",
        "deepseek",
        "fine-tuning",
        "gemma"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2023-05-28T10:09:12Z",
      "updatedAt": "2026-08-11T05:11:24Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/shareAI-lab/learn-claude-code",
    "tool": {
      "slug": "learn-claude-code",
      "name": "learn-claude-code",
      "description": "Bash is all you need -  A nano claude code–like 「agent harness」, built from 0 to 1",
      "url": "https://github.com/shareAI-lab/learn-claude-code",
      "logoUrl": "https://github.com/shareAI-lab.png?size=128",
      "category": "code",
      "tags": [
        "agent",
        "agent-development",
        "ai-agent",
        "claude",
        "claude-code"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-06-29T15:34:15Z",
      "updatedAt": "2026-08-11T05:37:27Z"
    }
  },
  {
    "source": "github-trending",
    "sourceUrl": "https://github.com/datawhalechina/hello-agents",
    "tool": {
      "slug": "hello-agents",
      "name": "hello-agents",
      "description": "📚 《从零开始构建智能体》——从零开始的智能体原理与实践教程",
      "url": "https://github.com/datawhalechina/hello-agents",
      "logoUrl": "https://github.com/datawhalechina.png?size=128",
      "category": "chat",
      "tags": [
        "agent",
        "llm",
        "rag",
        "tutorial"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2025-09-07T09:50:24Z",
      "updatedAt": "2026-08-11T05:36:17Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/portfolio-lab",
    "tool": {
      "slug": "portfolio-lab",
      "name": "Portfolio Lab",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/portfolio-lab",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-07-29T14:22:05.000Z",
      "updatedAt": "2026-08-11T05:37:00.900Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/vidaya",
    "tool": {
      "slug": "vidaya",
      "name": "Vidaya",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/vidaya",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-06T07:21:22.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/remix-8",
    "tool": {
      "slug": "remix",
      "name": "Remix",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/remix-8",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-06T02:16:52.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/prime-intellect",
    "tool": {
      "slug": "prime-agent",
      "name": "Prime Agent",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/prime-intellect",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-10T04:13:06.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/oqoqo",
    "tool": {
      "slug": "oqoqo",
      "name": "oqoqo",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/oqoqo",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-07-17T21:16:17.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/genspark",
    "tool": {
      "slug": "secondbrain-note-by-genspark",
      "name": "SecondBrain Note by GenSpark",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/genspark",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-09T21:55:17.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/ai-group-call",
    "tool": {
      "slug": "ai-group-call",
      "name": "AI Group Call",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/ai-group-call",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-09T16:50:42.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/paritok",
    "tool": {
      "slug": "paritok",
      "name": "Paritok",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/paritok",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-07-20T08:39:12.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/argos-2",
    "tool": {
      "slug": "argos",
      "name": "Argos",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/argos-2",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-08T23:41:16.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/docsalot-2",
    "tool": {
      "slug": "docsalot-cli",
      "name": "DocsAlot CLI",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/docsalot-2",
      "logoUrl": "",
      "category": "productivity",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-07T19:43:09.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/omniwork-2",
    "tool": {
      "slug": "omniwork",
      "name": "Omniwork",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/omniwork-2",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-07-14T08:08:56.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/prompt-golf",
    "tool": {
      "slug": "prompt-golf",
      "name": "Prompt Golf",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/prompt-golf",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-07-30T15:38:50.000Z",
      "updatedAt": "2026-08-11T05:37:00.901Z"
    }
  },
  {
    "source": "producthunt",
    "sourceUrl": "https://www.producthunt.com/products/agentconnect",
    "tool": {
      "slug": "agentconnect",
      "name": "AgentConnect",
      "description": "Discussion\n            |\n            Link",
      "url": "https://www.producthunt.com/products/agentconnect",
      "logoUrl": "",
      "category": "chat",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-01T05:40:40.000Z",
      "updatedAt": "2026-08-11T05:24:41.517Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28030.html",
    "fetchedAt": "2026-08-12T07:35:56.768Z",
    "tool": {
      "slug": "偷师",
      "name": "偷师",
      "description": "提示词反推神器,偷师可以在网页图片上直接反推中文 / 英文 AI 提示词，识别主体、风格、光影、构图、比例与关键文字，并一键带到 PixPix 生成同款灵感图。 “偷师”来自中文里的“偷师学艺”：看到一张厉害的图，不只停在“好看”，而是拆开它的主体、构图、光影、文字、材质和风格方法。它像一个随身的视觉学习小助手，帮",
      "url": "https://prompts.pixpix.com/ts/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/07/1783590190-23976885915_228054974546_47e49b40-ac29-42a9-add7-1261a764e8b2.png",
      "category": "image",
      "tags": [
        "电商",
        "设计"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:56.768Z",
      "updatedAt": "2026-08-13T07:55:26.540Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27978.html",
    "fetchedAt": "2026-08-12T07:35:57.467Z",
    "tool": {
      "slug": "pixpix",
      "name": "PixPix",
      "description": "AI电商工具,一张产品原图，30s 生成全套套图及 A+详情 一张商品图，搞定全套图 省下布景、拍摄、修图的重复成本 一张图延展多套视觉，快速测试点击率 风格统一，适合店铺、广告、详情页同步使用 批量生成模特试穿套图 省下模特、场地、摄影的整条成本线 按目标市场调模特与场景，出海更贴近 风格统一，成套输出，直",
      "url": "https://www.pixpix.com?source=faxianai",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/06/1780882169-logo@2x.png",
      "category": "image",
      "tags": [
        "AI图像",
        "电商",
        "设计"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:57.467Z",
      "updatedAt": "2026-08-13T07:55:26.965Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27844.html",
    "fetchedAt": "2026-08-12T07:35:58.149Z",
    "tool": {
      "slug": "cocoloop",
      "name": "CoCoLoop",
      "description": "AI讨论社区,CoCoLoop是国内首个专为AI智能体（AI Agent）打造的一站式技能商店与开发者社区，旨在解决国内开发者在接入OpenClaw（俗称“小龙虾”）等智能体生态时面临的资源获取慢、安全风险高、本土化适配不足等核心痛点。以下是对该平台的综合介绍： --- 🚀 平台定位：安全+精品的本土化技能生态",
      "url": "https://www.cocoloop.cn/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/03/20260320131441-ca5f3.png",
      "category": "code",
      "tags": [
        "AI编程"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:58.149Z",
      "updatedAt": "2026-08-13T07:55:27.389Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27448.html",
    "fetchedAt": "2026-08-12T07:35:58.809Z",
    "tool": {
      "slug": "免费nano-banana-free",
      "name": "免费Nano Banana Free",
      "description": "免费不限次的Nano Banana,免费不限次的Nano Banana，提供有10多种Nano Banana的修图玩法，并且免登录、免费。用起来还是非常不错。不知道什么时候停止白嫖，大家可以自己试试。 关于Nano Banana： Nano Banana是一款 AI图像编辑神器，主打 “说话就能修图” ：无需专业技巧，直接对图片说需求",
      "url": "https://www.pixpix.com/ai-image-video-generator?source=faxianai-common",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/09/1757481292-nanobanana.png",
      "category": "image",
      "tags": [
        "AI"
      ],
      "pricing": "free",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:58.809Z",
      "updatedAt": "2026-08-13T05:21:35.068Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27421.html",
    "fetchedAt": "2026-08-12T07:35:59.344Z",
    "tool": {
      "slug": "nano-banana-2",
      "name": "Nano Banana 2",
      "description": "全网火爆的Nano Banana 2,AI图片王者，Nano Banana Pro太权威了，稳居第一。 最新的Nano Banana 2，又可以称之为Nano Banana Pro全新发布，相比上一代升级巨大，支持4K画质、图片质量更高、能理解更复杂的指令，生成速度更快... 等等。 目前火爆全网，超高质量的Nano Banana 2",
      "url": "https://www.pixpix.com/ai-image-video-generator?source=faxianai-common",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/09/1757333911-7885522480_193196437048_7669BB08-626F-45B9-BE02-2112A3FE5EF4.png",
      "category": "image",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:59.344Z",
      "updatedAt": "2026-08-13T05:21:35.493Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27880.html",
    "fetchedAt": "2026-08-12T07:35:59.768Z",
    "tool": {
      "slug": "gpt-image-2",
      "name": "GPT Image 2",
      "description": "AI作图工具,gptimg2由GPT Image 2驱动——这是OpenAI最先进的图像模型，可实现精准文本渲染、智能编辑和真实世界视觉理解。无论是营销创意、产品视觉、复杂版式、信息图表还是照片编辑，都能以无与伦比的准确度生成高质量图像。 作为一体化AI创意平台，gptimg2.io汇聚了全球领先模型，包括Nan",
      "url": "https://www.pixpix.com/ai-image-video-generator?source=faxianai-common",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/07/20250718132234-f3f8c.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:35:59.768Z",
      "updatedAt": "2026-08-13T07:51:03.158Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27841.html",
    "fetchedAt": "2026-08-12T07:36:00.360Z",
    "tool": {
      "slug": "skill商店",
      "name": "Skill商店",
      "description": "精品、安全的Skills商店,CoCoLoop是国内首个专为AI智能体（AI Agent）打造的一站式技能商店与开发者社区，旨在解决国内开发者在接入OpenClaw（俗称“小龙虾”）等智能体生态时面临的资源获取慢、安全风险高、本土化适配不足等核心痛点。以下是对该平台的综合介绍： --- 🚀 平台定位：安全+精品的本土化技能生态",
      "url": "https://hub.cocoloop.cn/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/03/20260320130614-20ddd.png",
      "category": "code",
      "tags": [
        "AI编程"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:00.360Z",
      "updatedAt": "2026-08-13T07:55:29.087Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28059.html",
    "fetchedAt": "2026-08-12T07:36:01.015Z",
    "tool": {
      "slug": "学术版codex",
      "name": "学术版Codex",
      "description": "复旦研发的0幻觉、真实文献的科研助手,程序员被 Codex 彻底改变了，不用一行行敲代码，把需求丢给 AI，让它自己写代码、跑测试、修 Bug、闭环交付。 那么问题来了：科研人员天天干的活，不也是\"配环境、跑实验、复现代码、查文献、写综述\"这些体力活吗？ 现在，复旦大学 NLP 团队把这套逻辑搬到了科研上，做出了一个真正意义上的学术版",
      "url": "https://qiewenpaper.com/zh?utm_source=faxianai",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/07/1784280083-49b86048fd659fb7bab778cfea9ca31d.png",
      "category": "code",
      "tags": [
        "AI助理"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:01.015Z",
      "updatedAt": "2026-08-13T07:55:29.504Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28056.html",
    "fetchedAt": "2026-08-12T07:36:01.691Z",
    "tool": {
      "slug": "lovart生图",
      "name": "Lovart生图",
      "description": "Create brand visuals, posters, product images, and cinematic artwork with text-to-image and image-to-image AI. 5 free images every day.",
      "url": "https://www.lovart.free/?lang=zh",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/08/20260812113346-773ad.jpeg",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "free",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:01.691Z",
      "updatedAt": "2026-08-13T07:51:06.281Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28122.html",
    "fetchedAt": "2026-08-12T07:36:02.346Z",
    "tool": {
      "slug": "libtv视频",
      "name": "Libtv视频",
      "description": "输入文字或上传参考图，在线生成高质量 AI 图片。",
      "url": "https://www.libtv.org/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/08/20260812113518-2fe85.jpeg",
      "category": "video",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:02.346Z",
      "updatedAt": "2026-08-13T05:21:40.815Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28143.html",
    "fetchedAt": "2026-08-12T07:36:03.013Z",
    "tool": {
      "slug": "liblib",
      "name": "LibLib",
      "description": "liblibai 是一个免费 AI 生图平台——输入提示词，秒出高质量图片；注册即享每日 5 张免费额度，无需安装、开箱即用。",
      "url": "https://www.liblib.im/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/08/20260812113548-52892.png",
      "category": "productivity",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:03.013Z",
      "updatedAt": "2026-08-13T07:51:09.427Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28144.html",
    "fetchedAt": "2026-08-12T07:36:03.687Z",
    "tool": {
      "slug": "tapnow视频",
      "name": "TapNow视频",
      "description": "Create connected text-to-image and image-to-image workflows on an intelligent visual canvas.",
      "url": "https://www.tapnow.free/?lang=zh",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/08/20260812113609-a2b3b.jpeg",
      "category": "video",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:03.687Z",
      "updatedAt": "2026-08-13T07:51:10.341Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/28145.html",
    "fetchedAt": "2026-08-12T07:36:04.375Z",
    "tool": {
      "slug": "minimax视频",
      "name": "MiniMax视频",
      "description": "免费体验 MiniMax H3 AI 视频生成器。支持文生视频、图生视频、最多 3 张参考图、2K 高清输出、4–15 秒时长、多种画面比例与原生立体声。",
      "url": "https://www.minimax.free/",
      "logoUrl": "https://t0.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=https://www.minimax.free/",
      "category": "video",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:04.375Z",
      "updatedAt": "2026-08-13T05:21:45.742Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27774.html",
    "fetchedAt": "2026-08-12T07:36:05.097Z",
    "tool": {
      "slug": "openclaw中文版",
      "name": "OpenClaw中文版",
      "description": "一个能真正做事情的AI Agents,OpenClaw一款火爆海外的AI智能体，一款长了“手”和“脚”真正能干活的AI智能体工具。目前国内平替中文版Molili（莫哩哩）已经上线。 解释：OpenClaw是海外版本，而Molili（莫哩哩）是中文版。 Molili能干啥？ 一键安装、一键部署，即可拥有一个能真正做事情的AI Agents",
      "url": "https://molili.dangbei.com/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/02/1770195462-Molili-Openclaw-Logo-128.png",
      "category": "chat",
      "tags": [
        "AI助理"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:05.097Z",
      "updatedAt": "2026-08-13T07:55:38.118Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/11598.html",
    "fetchedAt": "2026-08-12T07:36:05.521Z",
    "tool": {
      "slug": "trae编程",
      "name": "TRAE编程",
      "description": "AI辅助编程，代码自动修复,零基也能玩转的AI编程，普通用户也能开发一个优秀的游戏产品。新手比较友好。 Trae是字节跳动推出的国内首款AI原生IDE，集成Claude 3.5与GPT-4o两款顶尖AI模型，专为中文开发场景设计，将AI深度集成于IDE环境，带来更流畅、准确的开发体验。 字节跳动旗下热门AI产品： 1、Trae",
      "url": "https://www.trae.cn/?utm_source=advertising&utm_medium=faxianai_ug_cpa&utm_term=hw_trae_faxianai",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/07/1753087358-2524044ed886e5a5a1cb52133a5a74a1.png",
      "category": "code",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:05.521Z",
      "updatedAt": "2026-08-13T05:21:46.616Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/127.html",
    "fetchedAt": "2026-08-12T07:36:05.942Z",
    "tool": {
      "slug": "扣子",
      "name": "扣子",
      "description": "AI办公助手提升50%效率,AI办公助手，复杂任务高效处理。办公效率低？扣子空间AI助手支持播客生成、PPT制作、网页开发及报告写作，覆盖科研、商业、舆情等领域的专家Agent 7x24小时响应，生活工作无缝切换，提升50%效率！ 零基础开启 Agent 专业开发,无论你是否有编程基础，你都可以在扣子平台快速搭建一个AI智能体",
      "url": "https://dis.csqixiang.cn/unpo/faxianaicoze.html",
      "logoUrl": "http://www.faxianai.com/wp-content/uploads/2026/02/1771116425-20260215084418_8_114.png",
      "category": "code",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:05.942Z",
      "updatedAt": "2026-08-13T07:51:14.865Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27761.html",
    "fetchedAt": "2026-08-12T07:36:06.678Z",
    "tool": {
      "slug": "clawdbot-openclaw",
      "name": "Clawdbot(OpenClaw)",
      "description": "AI智能体,Clawdbot又名OpenClaw是一个开源的、本地运行的 AI Agent 自动化框架，核心目标是：让 AI 不只是“聊天”，而是真正“动手做事”。它支持本地大模型与多种工具调用，可自动完成任务拆解、决策与执行，适用于自动化、企业内网及二次开发场景。 OpenClaw 是做什么的？ 可以把 Op",
      "url": "https://openclaw.ai/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2026/01/20260129170222-1ed72.png",
      "category": "code",
      "tags": [
        "AI助理",
        "AI办公",
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:06.678Z",
      "updatedAt": "2026-08-13T07:55:39.358Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/5552.html",
    "fetchedAt": "2026-08-12T07:36:09.342Z",
    "tool": {
      "slug": "当贝ai",
      "name": "当贝AI",
      "description": "一站式AI体验，聚合全网优质大模型,8月05日，当贝AI更新，加入AI旅行规划师、和接入智谱清言GLM 4.5大模型，截止今天，当贝AI已经接入了国内15款最新的优质大模型。太疯狂了！ 7月15日，当贝AI再次新增重要更新，包括2点。 1、加入kimi K2最新大模型，更擅长代码写作，与通用Agentic任务。网上测试，性能\"封神",
      "url": "https://ai.dangbei.com/chat",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/03/1740989722-1740720967595.png",
      "category": "code",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:09.342Z",
      "updatedAt": "2026-08-13T05:21:47.958Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/123.html",
    "fetchedAt": "2026-08-12T07:36:09.780Z",
    "tool": {
      "slug": "绘蛙",
      "name": "绘蛙",
      "description": "阿里旗下制作商拍图的工具,绘蛙-是一款功能强大，简洁好用的智能图片、文案创作平台，并且拥有海量虚拟模特可选择。在绘蛙，你可训练自己的商品模型和模特模型，可通过AI生成商拍图和种草文案，可以创作小红书图片,电商商品主图,跨境电商主图,小红书种草文案,穿搭文案，视频口播文案，可在线一键美图,输入口令修改图片内容,一键换装,一键去",
      "url": "https://www.ihuiwa.com/invite?huiwaInviteCode=ZRSVGL",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737025951.png",
      "category": "image",
      "tags": [
        "AI图像",
        "电商"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:09.780Z",
      "updatedAt": "2026-08-13T07:51:16.460Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/11955.html",
    "fetchedAt": "2026-08-12T07:36:10.206Z",
    "tool": {
      "slug": "gpt-5",
      "name": "GPT-5",
      "description": "OpenAI旗下GPT-5最新大模型 ,8月7日美国开放人工智能研究中心（OpenAI）7日发布其最新人工智能模型GPT-5。 据OpenAI官网介绍，这是迄今为止该机构推出的最强大的人工智能系统，在各类基准测试中超越了先前的模型，在编程、数学、写作、健康、视觉感知等方面都具备业界领先的性能，在减少幻觉（错误生成）、提升指令执行能力、降低",
      "url": "https://chatgpt.com/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/03/20250328130645-a1f09.png",
      "category": "code",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:10.206Z",
      "updatedAt": "2026-08-13T07:55:40.591Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/342.html",
    "fetchedAt": "2026-08-12T07:36:10.614Z",
    "tool": {
      "slug": "即梦ai",
      "name": "即梦AI",
      "description": "字节推出的强大AI创作工具,即梦AI，由字节跳动推出，是一款集文字绘图、文字生成视频、图片生成视频于一体的一站式生成式人工智能创作平台。用户可以通过自然语言或图片输入，轻松生成高质量的图像和视频内容，将想象变为现实。 字节跳动旗下热门AI产品： 即梦AI提示词海报生成 提示词： C4D渲染，一个未来城市景观，曲线及几何形状",
      "url": "https://dis.csqixiang.cn/unpo/jmfaxianai.html",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737029327558.png",
      "category": "image",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:10.614Z",
      "updatedAt": "2026-08-13T07:55:41.006Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27297.html",
    "fetchedAt": "2026-08-12T07:36:11.933Z",
    "tool": {
      "slug": "imini-ai",
      "name": "imini AI",
      "description": "简单、易用的AI图片和AI视频工具,imini AI一款极其简单、易用的AI图片和AI视频制作平台，简单易用，无需专业知识，也能做出令人惊叹的图片和视频。 imini AI拥有全球最先进的图片大模型、视频大模型，并提供大量精致的模板，用户不用记繁琐的指令词，就能做出令人惊叹的高质量作品。 imini AI特点： 1、简单易用：界面简单",
      "url": "https://www.pixpix.com/video-editing?source=faxianai",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/08/20250818141012-a211f.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:11.933Z",
      "updatedAt": "2026-08-13T07:51:18.086Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/183.html",
    "fetchedAt": "2026-08-12T07:36:12.583Z",
    "tool": {
      "slug": "稿定ai",
      "name": "稿定AI",
      "description": "一站式AI绘图和设计工具集,小白也能轻松做出好看的图片，上手很简单。稿定AI包括了AI抠图、海报制作、AI设计等，非常适合自媒体用户，有轻度做图需求的用户。 稿定AI是一款智能化的设计工具，旨在为用户提供便捷、高效、富有创意的设计体验。它通过集成多种AI技术，如ControlNet模型等，实现了图片编辑、绘画、文案生成、素材搜",
      "url": "https://www.gaoding.com/utms/0de1f585488b46039d4840b07bc259c9",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737027636442.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:12.583Z",
      "updatedAt": "2026-08-13T07:51:19.328Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/222.html",
    "fetchedAt": "2026-08-12T07:36:14.092Z",
    "tool": {
      "slug": "adobe-firefly",
      "name": "Adobe Firefly",
      "description": "adobe出品超强AI图像工具,Adobe Firefly的概述 Adobe Firefly是Adobe公司推出的一款基于人工智能（AI）技术的创意工具，旨在为设计师、艺术家和内容创作者提供智能生成、编辑和优化视觉内容的能力，从而提升创作效率和创意表达能力。Firefly集成了生成式AI、深度学习等先进技术，特别适用于图像生成、图",
      "url": "https://firefly.adobe.com/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737028512287.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:14.092Z",
      "updatedAt": "2026-08-13T07:51:20.496Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/4407.html",
    "fetchedAt": "2026-08-12T07:36:15.190Z",
    "tool": {
      "slug": "美图whee",
      "name": "美图Whee",
      "description": "美团出品在线AI图片生成工具,美图Whee是美图公司推出的一款基于人工智能技术的图片和绘画创作平台。以下是其概述、功能及使用过程中可能遇到的问题介绍： 概述 美图Whee以美图自研的视觉大模型MiracleVision为基础，为大众用户及专业视觉创作者提供服务，以“工作流”作为核心功能串联，提供多种AIGC图像服务。用户可通过网",
      "url": "https://www.whee.com",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1738923316307.png",
      "category": "image",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:15.190Z",
      "updatedAt": "2026-08-13T05:21:50.975Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/199.html",
    "fetchedAt": "2026-08-12T07:36:15.867Z",
    "tool": {
      "slug": "文心一格",
      "name": "文心一格",
      "description": "百度旗下AI创意图片平台,文心一格，AI艺术和创意辅助平台，依托飞桨、文心大模型的技术创新推出的“AI作画”产品，可轻松驾驭多种风格，人人皆可“一语成画” 文心一格概述 文心一格是百度依托飞桨、文心大模型的技术创新，推出的AI艺术和创意辅助平台。它定位为面向有设计需求和创意的人群，旨在辅助创意设计，打破创意瓶颈。用户只需输入",
      "url": "https://yige.baidu.com",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737027647130.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:15.867Z",
      "updatedAt": "2026-08-13T07:51:22.064Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/8167.html",
    "fetchedAt": "2026-08-12T07:36:16.553Z",
    "tool": {
      "slug": "可画",
      "name": "可画",
      "description": "一流的中文在线设计平台,Canva可画打造了一流的中文在线设计平台，整合了数以千万计的高清图片、中英文字体、原创模板、插画等视觉元素。Canva可画降低，在某些领域甚至消除了专业设计的门槛。即使是没有任何基础的用户，也可以通过运用Canva可画的中文模板，轻松完成包括社交媒体插图、海报、电商用图、演示文稿、信息图、小视频等",
      "url": "https://www.canva.cn/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1740655966617.png",
      "category": "image",
      "tags": [
        "AI"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:16.553Z",
      "updatedAt": "2026-08-13T07:55:43.432Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/8284.html",
    "fetchedAt": "2026-08-12T07:36:17.302Z",
    "tool": {
      "slug": "nijijourney",
      "name": "NijiJourney",
      "description": "用于生成定制动漫插图的AI工具，专注于动漫美学,AI tool for generating custom anime illustrations with a focus on anime aesthetics. 什么是Niji・Journey？ NijiJourney AI是为动漫粉丝设计的。新的niji模型经过精心调整，能够生成动漫和插图风",
      "url": "https://nijijourney.com/zh",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/02/20250227212104-ee60b.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:17.302Z",
      "updatedAt": "2026-08-13T07:51:23.185Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/193.html",
    "fetchedAt": "2026-08-12T07:36:17.979Z",
    "tool": {
      "slug": "liblibai-哩布哩布ai",
      "name": "LiblibAI·哩布哩布AI",
      "description": "AI图像创作平台,AI绘画原创模型分享社区，10万+模型免费下载;原汁原味的webUI、comfyUI，在线AI绘图工具免费使用;还可在线进行模型训练。欢迎每一位创作者加入，共同探索AI绘画 LiblibAI·哩布哩布AI概述 LiblibAI·哩布哩布AI是一个基于Stable Diffusion的AI绘画模型资源",
      "url": "https://www.liblib.art",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/01/1737027643271.png",
      "category": "image",
      "tags": [
        "AI图像"
      ],
      "pricing": "free",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:17.979Z",
      "updatedAt": "2026-08-13T07:51:23.611Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27199.html",
    "fetchedAt": "2026-08-12T07:36:19.083Z",
    "tool": {
      "slug": "ai旅行规划师",
      "name": "AI旅行规划师",
      "description": "一键生成旅行攻略,当贝AI -- 超级智能体《AI旅行规划师》重磅上线！带娃亲子游、情侣打卡旅游、徒步旅游、小众景点...一键生成！ 一、简介： 首款旅行AI超级智能体，极简易用，3屏设计，简单直观，小白也能轻松做旅游攻略！ 通过AI超级智能体，可DIY个性化定制旅行路线，如带娃亲子游、情侣打卡旅游、徒步旅游、小众景",
      "url": "https://ai.dangbei.com/tourism",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/03/1740989722-1740720967595.png",
      "category": "chat",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:19.083Z",
      "updatedAt": "2026-08-13T07:55:44.654Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27132.html",
    "fetchedAt": "2026-08-12T07:36:20.154Z",
    "tool": {
      "slug": "roboneo-美图旗下",
      "name": "RoboNeo 美图旗下",
      "description": "帮你修图、设计、做视频,专注影像生产力的AI Agent RoboNeo 网页版是厦门美图网科技有限公司倾情推出的一款智能创作工具，软件拥有修图、设计、做视频等等丰富功能，可以帮助用户更好的智能创作，功能强大，使用简单，RoboNeo，专属于你的影像与设计助手。RoboNeo 网页版 RoboNeo 网页版介绍： 你好，我",
      "url": "https://www.roboneo.com/home",
      "logoUrl": "http://www.faxianai.com/wp-content/uploads/2025/07/20250725095547-e21fe.png",
      "category": "image",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:20.154Z",
      "updatedAt": "2026-08-13T07:55:45.050Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27072.html",
    "fetchedAt": "2026-08-12T07:36:21.313Z",
    "tool": {
      "slug": "chatgpt-agent",
      "name": "ChatGPT Agent",
      "description": "ChatGPT Agent智能体,2025年7月18日，OpenAI旗下ChatGPT Agent重磅发布，能上网搜、会做PPT、精通Excel。 ChatGPT Agent具备自主思考和行动的能力，能够主动从其技能库中选择合适的工具，包括Operator、 Deep Research和ChatGPT来完成各种超复杂任务。 例如，用",
      "url": "https://chatgpt.com/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/07/20250718132234-f3f8c.png",
      "category": "chat",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:21.313Z",
      "updatedAt": "2026-08-13T07:55:45.459Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/27047.html",
    "fetchedAt": "2026-08-12T07:36:21.988Z",
    "tool": {
      "slug": "grok-4-ai虚拟女友",
      "name": "Grok 4 AI虚拟女友",
      "description": "AI虚拟女友,xAI旗下的Grok于iOS APP 推出全新功能，新增互动 AI 伴侣，并以动漫风格的虚拟形象呈现，为用户带来更生动有趣的互动体验。用户可使用语音 (英文) 或文字跟她沟通，暂时提供两款 AI 伴侣供使用，这些 AI 伴侣不仅能回答用户的问题，还能透过动漫风格的虚拟角色与用户进行更具个性化的对话",
      "url": "https://play.google.com/store/apps/details?id=ai.x.grok&hl=en_US&pli=1",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/07/1752645061-unnamed.webp",
      "category": "audio",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:21.988Z",
      "updatedAt": "2026-08-13T07:55:45.866Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/18655.html",
    "fetchedAt": "2026-08-12T07:36:23.076Z",
    "tool": {
      "slug": "minimax",
      "name": "MiniMax",
      "description": "强大通用智能体,MiniMax Agent是一个能完成长程（Long Horizon）复杂任务的通用智能体，也就是能多步规划出专家级解决方案、能灵活拆解任务需求、并能执行多个子任务从而交付最终结果。 chat和Agent有什么不同？ AI对话chat：能完成一个具体问题解答。 超级智能体Agent：能完成具体一件事",
      "url": "https://agent.minimaxi.com/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/06/20250630163733-5fbcc.png",
      "category": "chat",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:23.076Z",
      "updatedAt": "2026-08-13T07:55:46.276Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/18658.html",
    "fetchedAt": "2026-08-12T07:36:23.708Z",
    "tool": {
      "slug": "genspark",
      "name": "Genspark",
      "description": "前百度高管创立AI Agent,Genspark它就是由前百度高管创立的。需要注意的是，很多假冒网站，大家需要辨别。发现AI提供的为Genspark的官网地址。 Genspark超级代理（Super Agent），一款快速且可靠的通用AI Agent，是一个真正能够自主思考、规划、行动并使用工具来处理你所有日常任务的终极人工智能助",
      "url": "https://www.genspark.ai/",
      "logoUrl": "http://www.faxianai.com/wp-content/uploads/2025/06/20250630164106-6785f.png",
      "category": "chat",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:23.708Z",
      "updatedAt": "2026-08-13T07:55:46.685Z"
    }
  },
  {
    "source": "faxianai",
    "sourceUrl": "https://www.faxianai.com/ai/18672.html",
    "fetchedAt": "2026-08-12T07:36:24.423Z",
    "tool": {
      "slug": "lovart",
      "name": "Lovart",
      "description": "最强设计智能体,最近海外有一款Design Agent彻底火了，北美设计圈大佬都在用，它就是Lovart，经过几天的实测，我已经掌握了5种生猛用法，每一个都让我惊掉下巴！只要输入好提示词，Agent就会自动开始设计，还能用嘴改图，言出法随，设计师又又又要失业啦！ Lovart 真的比想象中强太多太多了，真的，设计师",
      "url": "https://www.lovart.ai/",
      "logoUrl": "https://www.faxianai.com/wp-content/uploads/2025/06/20250630173403-2778e.png",
      "category": "chat",
      "tags": [
        "智能体"
      ],
      "pricing": "freemium",
      "rating": 0,
      "views": 0,
      "createdAt": "2026-08-12T07:36:24.423Z",
      "updatedAt": "2026-08-13T07:55:47.097Z"
    }
  }
,  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28167.html","fetchedAt":"2026-08-24T08:16:49.903Z","tool":{"slug":"davinci-ai","name":"DaVinci AI","description":"免费在线生成 AI 图片和 AI 视频，输入一句话即可出图出片。支持文生图、图生图、文生视频、图生视频，打开网页就能用，无需下载安装，新用户注册即送生成额度。","url":"https://www.davinci.best/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260814164535-93059.jpeg","category":"image","tags":["AI视频"],"pricing":"free","rating":0,"views":0,"createdAt":"2026-08-24T08:16:49.903Z","updatedAt":"2026-08-24T08:16:49.903Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28282.html","fetchedAt":"2026-08-24T08:17:02.368Z","tool":{"slug":"prized","name":"Prized","description":"AI搭建企业内部工具,Prized 让运营、客服、财务这些不写代码的团队用 AI 搭出自己的内部工具，重点在后半句：搭出来的东西是安全的。三条约束是它区别于普通“AI 生成应用”的地方。一是公司数据预先接好，管理员一次性批准每个连接器并划定它能看到的范围，之后所有工具复用这套授权。二是每一次数据访问都有审计记录。三是一键","url":"https://prized.dev/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-dba87.jpeg","category":"code","tags":["智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:02.368Z","updatedAt":"2026-08-24T08:17:02.368Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28281.html","fetchedAt":"2026-08-24T08:17:02.982Z","tool":{"slug":"wizstar","name":"Wizstar","description":"AI数字人商品视频生成,Wizstar 是一个偏电商和营销场景的 AI 创作平台，输入可以是一段文字、一张图片，也可以直接丢一个商品链接，输出是视频、数字人口播或者商品广告片。商品链接直接转视频这条路径是它比较讨巧的设计。跑通之后，从选品到出片中间的素材整理、脚本撰写、画面生成几步被压成了一步，对需要给大量 SKU 铺视频","url":"https://wizstar.com/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-77be0.jpeg","category":"image","tags":["AI图像"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:02.982Z","updatedAt":"2026-08-24T08:17:02.982Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28280.html","fetchedAt":"2026-08-24T08:17:03.585Z","tool":{"slug":"meetstream-ai","name":"MeetStream AI","description":"会议机器人统一API,MeetStream 提供的是一套统一的会议机器人 API，用一个接口同时对接 Zoom、Google Meet 和 Microsoft Teams，让机器人加入会议并完成录制、实时推流和转写。它想省掉的是集成这件苦差事。三家会议平台各有各的接入规则、各有各的坑，一个做 AI 会议助手的团队往往要先","url":"https://meetstream.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-aa11a.jpeg","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:03.585Z","updatedAt":"2026-08-24T08:17:03.585Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28279.html","fetchedAt":"2026-08-24T08:17:04.176Z","tool":{"slug":"bitdrift","name":"bitdrift","description":"AI智能体移动可观测平台,bitdrift 做的是移动端可观测性，但切入角度和传统 APM 不一样——它把数据开放给 AI 智能体，让 Agent 自己去查崩溃、性能问题和用户路径。关键词是“无采样”。传统方案为了控制成本会对日志和指标做采样，结果是排查具体问题时经常缺关键那一段。bitdrift 的说法是能覆盖 100%","url":"https://bitdrift.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-dfb94.jpeg","category":"chat","tags":["智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:04.176Z","updatedAt":"2026-08-24T08:17:04.176Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28278.html","fetchedAt":"2026-08-24T08:17:04.769Z","tool":{"slug":"nobodywho","name":"NobodyWho","description":"端侧本地大模型推理引擎,NobodyWho 是一个开源推理引擎，目标是让大模型跑在任意设备上——手机、桌面、嵌入式都算在内，文本、视觉、语音三类模型都支持。模型来源直接对接 Hugging Face，Mistral、OpenAI 开源模型、Liquid、Qwen、DeepSeek、Gemma 这些都能挑来用，格式是 ggu","url":"https://www.nobodywho.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-124e6.jpeg","category":"audio","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:04.769Z","updatedAt":"2026-08-24T08:17:04.769Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28277.html","fetchedAt":"2026-08-24T08:17:05.449Z","tool":{"slug":"hynote","name":"HyNote","description":"AI会议录音笔记工具,HyNote 是一款 AI 笔记工具，输入端铺得很宽：现场录音、电话通话、上传音频、文本与 PDF、图片截图 OCR、YouTube 或视频链接、网页，甚至 Apple Watch 都能作为采集入口。输出端则围绕“能直接用”来设计。会议方向有纪要、讨论记录、待办跟进、邮件草稿和说话人识别；学习方向有","url":"https://hynote.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-de9ca.jpeg","category":"image","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:05.449Z","updatedAt":"2026-08-24T08:17:05.449Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28276.html","fetchedAt":"2026-08-24T08:17:06.032Z","tool":{"slug":"checksum-ai","name":"Checksum AI","description":"AI自动生成端到端测试,Checksum 把自己定位成“编程智能体的测试搭子”，做的事是自动生成并维护 Playwright 端到端测试。它的判断很直接：AI 写代码的速度上来之后，测试覆盖率跟不上就成了新瓶颈。所以它给了三个协作的智能体——End-to-end Agent 生成可用的 Playwright 测试，应用改动","url":"https://checksum.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-259fb.jpeg","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:06.032Z","updatedAt":"2026-08-24T08:17:06.032Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28275.html","fetchedAt":"2026-08-24T08:17:06.657Z","tool":{"slug":"actx0","name":"Actx0","description":"AI智能体记忆基础设施,Actx0 是给 AI 智能体和应用做记忆层的托管服务，解决的是“每开一个新会话就失忆”这个老问题。它把记忆分成两类：会话记忆（session memories）保存单次交互过程中攒下来的上下文，工作区知识（workspace knowledge）保存跨会话长期有效的信息。检索延迟做到毫秒级，官方明","url":"https://actx0.com/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-b0683.jpeg","category":"chat","tags":["智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:06.657Z","updatedAt":"2026-08-24T08:17:06.657Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28274.html","fetchedAt":"2026-08-24T08:17:07.251Z","tool":{"slug":"loomi","name":"Loomi","description":"社媒AI图文视频创作平台,Loomi 对外的定位是社交媒体内容智能体，实际打开产品会发现它做的比这句话宽——Explore、Agent、AI Image、AI Video、LoomiTV、AI Chat 几个模块并列，是一个把多家模型聚到一起的创作平台。模型这一层铺得比较全，视频侧接了 Seedance 2 和 Seedan","url":"https://loomi.live/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-531fb.jpeg","category":"video","tags":["AI助理","AI图像","智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:07.251Z","updatedAt":"2026-08-24T08:17:07.251Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28273.html","fetchedAt":"2026-08-24T08:17:07.848Z","tool":{"slug":"lawbot脱敏猫","name":"Lawbot脱敏猫","description":"法律文档离线脱敏工具,Lawbot 脱敏猫解决的是一个很具体的矛盾：律师想用 AI 处理合同、诉状、判决书，但这些材料里的当事人信息不能上传。它的做法是把脱敏这一步前置到本机。纯离线桌面软件，Windows 和 macOS 都有，识别模型和 OCR 模型随安装包一次性下载到本地，处理过程不调用任何外部 API，也不上传文","url":"https://www.lawbotai.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-acd06.jpeg","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:07.848Z","updatedAt":"2026-08-24T08:17:07.848Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28272.html","fetchedAt":"2026-08-24T08:17:08.461Z","tool":{"slug":"cline","name":"Cline","description":"开源AI编程智能体,Cline 是一个开源的 AI 编程智能体，Apache 2.0 协议，全平台安装量超过 800 万，GitHub 星标 6.6 万以上。它不绑定任何模型厂商，你想接哪家就接哪家。形态给了三种：IDE 扩展、CLI 和 SDK。官方目前主推 CLI，一条 npm i -g cline 装完就能在终端","url":"https://cline.bot/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-c7d72.jpeg","category":"code","tags":["智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:08.461Z","updatedAt":"2026-08-24T08:17:08.461Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28271.html","fetchedAt":"2026-08-24T08:17:09.048Z","tool":{"slug":"renoise","name":"Renoise","description":"多模型AI视频图像套件,Renoise 把市面上主流的生成模型集中到了一个界面里，视频侧有 Seedance 2.5 / 2.0、可灵 3.0、MiniMax H3、Omni、Grok Video，图像侧有 Midjourney V7、GPT Image 2、Nano Banana Pro、Grok Image。同一个工作","url":"https://renoise.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-2d694.jpeg","category":"image","tags":["AI图像"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:09.048Z","updatedAt":"2026-08-24T08:17:09.048Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28270.html","fetchedAt":"2026-08-24T08:17:10.125Z","tool":{"slug":"qwenpaw","name":"QwenPaw","description":"个人AI智能体工作站,QwenPaw 是 AgentScope 团队做的个人 AI 智能体工作站，特点是跑在你自己的环境里——本地部署或者自己的云都可以，不必把数据交给第三方托管。它最实用的地方在渠道接入。钉钉、飞书、QQ、Discord、Telegram 等十多个渠道都能连，也就是说你可以在日常已经在用的聊天软件里直接","url":"https://qwenpaw.agentscope.io/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-943fd.jpeg","category":"chat","tags":["AI助理"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:10.125Z","updatedAt":"2026-08-24T08:17:10.125Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28269.html","fetchedAt":"2026-08-24T08:17:10.776Z","tool":{"slug":"laper-ai","name":"Laper AI","description":"免费AI编剧剧本工具,Laper 是一款面向影视编剧的 AI 写作工具，定位很克制——它自己的宣传语是“没有 AI 味的 AI 编剧软件”，意思是只在编剧真正需要帮忙的环节介入，不替你写整个故事。核心功能有三块。一是剧本格式自动维护，行业标准的场景标题、动作、角色、对白、转场这些排版规则由工具兜住，编剧不用再手动调格式","url":"https://laper.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260822144234-56094.jpeg","category":"video","tags":["AI"],"pricing":"free","rating":0,"views":0,"createdAt":"2026-08-24T08:17:10.776Z","updatedAt":"2026-08-24T08:17:10.776Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28231.html","fetchedAt":"2026-08-24T08:17:11.455Z","tool":{"slug":"tipkay","name":"TipKay","description":"面向小团队的按需AI员工平台,TipKay 是一个面向经营者和小团队的 AI 员工平台，思路是「按岗位找人」而不是按功能找工具。平台上列着小红书运营、抖音运营、公众号编辑、知乎博主、闲鱼运营、视频制作这些岗位，每个 AI 员工都预先配好了对应的岗位经验、工作流程和所需工具，打开就能上岗。 它跟普通 AI 助手的区别在于交付粒度","url":"https://www.tipkay.com/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821101049-7373f.jpeg","category":"video","tags":["AI助理","智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:11.455Z","updatedAt":"2026-08-24T08:17:11.455Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28230.html","fetchedAt":"2026-08-24T08:17:12.181Z","tool":{"slug":"atoms","name":"Atoms","description":"AI建站与应用生成工具,Atoms 定位是「你团队的网站和应用创造者」，用一组 AI 员工帮你验证想法、做出产品、再去获取用户，整个过程不用写代码。它把自己包装成一支完整的 AI 团队而不是单个工具——你负责做决定，Agent 负责执行。 上手可以从模板开始，官方给的分类有 SaaS 应用、电商、内部工具和个人项目，站上能","url":"https://atoms.dev/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100910-9cdd9.jpeg","category":"image","tags":["AI助理","智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:12.181Z","updatedAt":"2026-08-24T08:17:12.181Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28229.html","fetchedAt":"2026-08-24T08:17:12.784Z","tool":{"slug":"loomy","name":"Loomy","description":"讯飞出品的桌面AI智能助理,Loomy 是科大讯飞推出的桌面级 AI 智能助理，装上就能用，不需要配置。官方给的适用场景包括自媒体运营、远程办公、日程管理、文件整理和电商运营，属于那种「什么杂活都能接一点」的通用型助手。 比较值得说的一点是它兼容 Openclaw 技能体系。这意味着社区已经写好的那些技能包可以直接拿来用，不用","url":"https://loomy.xunfei.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100845-60659.jpeg","category":"image","tags":["AI助理","智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:12.784Z","updatedAt":"2026-08-24T08:17:12.784Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28228.html","fetchedAt":"2026-08-24T08:17:13.390Z","tool":{"slug":"catpaw","name":"CatPaw","description":"美团的全场景AI Agent平台,CatPaw 是美团推出的 AI Agent 平台，一个产品覆盖两类用户：普通用户能拿到一个开箱即用的 AI 智能工作台，企业则能用它来开发和托管自己的 Agent。 对个人来说，它就是一个能接手具体任务的智能工作台，不用配置就能开始用。对企业来说，价值在后半段——构建「AI 数字员工」，把原本靠人","url":"https://catpaw.meituan.com/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100714-7d7e9.jpeg","category":"code","tags":["AI助理","智能体"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:13.390Z","updatedAt":"2026-08-24T08:17:13.390Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28227.html","fetchedAt":"2026-08-24T08:17:19.501Z","tool":{"slug":"百度搭子","name":"百度搭子","description":"百度出品的桌面端AI办公助手,百度搭子（DuMate）是百度智能云做的桌面端 AI 助手，主打「真干活」——你说需求，它跨应用、跨文件地把事执行完，而不是只给你一段回答。提供 macOS（M 系列芯片）和 Windows（win10 及以上）客户端，也有手机 App。 从官方给的场景看，重点押在办公自动化上：文件夹智能分类归档","url":"https://www.dumate.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821192534-1acd0.jpeg","category":"chat","tags":["AI助理"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:19.501Z","updatedAt":"2026-08-24T08:17:19.501Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28222.html","fetchedAt":"2026-08-24T08:17:20.108Z","tool":{"slug":"floatboat","name":"Floatboat","description":"日历驱动的AI Agent桌面工具,Floatboat 的思路跟大多数 AI 助手不太一样：它不等你开口，而是盯着你的日历干活。你把 Google Calendar、Notion Calendar、飞书、Outlook、iCloud 或者任意 ICS 订阅接进来，日历上的每一个时间块就变成一个触发器——会议开始前它自动帮你准备资料，到","url":"https://floatboat.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100127-dd594.jpeg","category":"chat","tags":["AI助理"],"pricing":"paid","rating":0,"views":0,"createdAt":"2026-08-24T08:17:20.108Z","updatedAt":"2026-08-24T08:17:20.108Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28226.html","fetchedAt":"2026-08-24T08:17:23.791Z","tool":{"slug":"meituhub","name":"MeituHub","description":"美图的企业级AI影像工作流平台,MeituHub 是美图推出的 AI 影像能力平台，把美图这些年积累的图片和视频 AI 能力做成了可以编排、可以调用的工作流。跟面向普通用户的修图 App 不同，它面向的是需要批量出图的团队——电商、品牌方和开发者。 核心用法是用自然语言编排一条可视化工作流，然后一键生成一个可复用的 Web 应用","url":"https://meituhub.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100522-b0298.jpeg","category":"image","tags":["AI图像"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:23.791Z","updatedAt":"2026-08-24T08:17:23.791Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28225.html","fetchedAt":"2026-08-24T08:17:24.399Z","tool":{"slug":"happyshrimp","name":"HappyShrimp","description":"阿里出品的AI音乐生成平台,HappyShrimp（快乐虾米）是阿里巴巴 ATH 事业群做的 AI 音乐创作平台，国内和海外双站同步开了 Beta 公测。用法很简单：用大白话描述你想要什么样的歌，它一次性把作词、作曲、编曲和人声演唱全做完，不需要你懂乐理。 它主打的技术点是「整曲一体化生成」。市面上不少 AI 音乐工具是分步来","url":"https://www.happyshrimp.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100455-32027.jpeg","category":"audio","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:24.399Z","updatedAt":"2026-08-24T08:17:24.399Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28224.html","fetchedAt":"2026-08-24T08:17:25.004Z","tool":{"slug":"onsolo","name":"OnSolo","description":"腾讯出品的AI短剧创作平台,OnSolo 是腾讯推出的 AI 原生短剧创作平台，从创意或参考素材出发，帮你把剧本、角色和可直接用于成片的故事线做出来。它的特点是背后跑的是针对 IP 内容训练过的 Agent 和 Skill，也就是说它对「短剧应该怎么写」这件事有预设的理解，不是纯靠通用大模型硬编。 对创作者来说，这类工具解决的","url":"https://onsolo.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100314-325f3.jpeg","category":"image","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:25.004Z","updatedAt":"2026-08-24T08:17:25.004Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/28223.html","fetchedAt":"2026-08-24T08:17:25.614Z","tool":{"slug":"preview","name":"Preview","description":"AI视频分镜与制作平台,Preview 定位是 AI 视频的「制作平台」而不是又一个生成器，它把分镜、生成、导演这三件事放在同一个界面里做完。核心是一块无限画布，参考图、不同版本的镜头、场景素材都摊在上面并排放着，团队成员实时在同一个画面上协作，调整镜头顺序、对比不同版本。 工作流是这样的：先写或导入剧本，然后自动拆解成场","url":"https://preview.io/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2026/08/20260821100219-aee3e.jpeg","category":"image","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:25.614Z","updatedAt":"2026-08-24T08:17:25.614Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/27563.html","fetchedAt":"2026-08-24T08:17:26.143Z","tool":{"slug":"gemini-3","name":"Gemini 3","description":"迄今最强的AI模型,全球最强Gemini 3深夜炸场，谷歌开启了AI下一个新纪元！这是迄今最强的AI模型，可能没有之一，推理最强，多模态理解最强，以及「智能体」+「氛围编程」最强。 目前可以直接通过PixPix来体验最新的Gemini 3 Pro的模型。 当然如果你懂上网，也可直接直达谷歌的入口：https://gem","url":"https://www.pixpix.com/zh-CN","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/03/20250313162148-8e51d.png","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:26.143Z","updatedAt":"2026-08-24T08:17:26.143Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/8917.html","fetchedAt":"2026-08-24T08:17:28.027Z","tool":{"slug":"trae-英文版","name":"Trae（英文版）","description":"字节旗下，国内首款AI IDE,Trae大模型是什么？ Trae隶属于字节跳动旗下，它作为国内首款AI IDE，集成了Claude 3.5与GPT-4o两款顶尖AI，中文输入需求，秒变代码大师！无论是简单函数还是复杂应用，它都能搞定，效率翻倍！ Trae为什么这么火？Trae的7大爆火理由 1.原生中文，简单上手 打破技术壁垒","url":"https://www.trae.ai/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/07/1753087358-2524044ed886e5a5a1cb52133a5a74a1.png","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:28.027Z","updatedAt":"2026-08-24T08:17:28.027Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/6039.html","fetchedAt":"2026-08-24T08:17:28.671Z","tool":{"slug":"deepseek满血版","name":"DeepSeek满血版","description":"DeepSeek R1 671B满血版，免费，不卡顿,DeepSeek-R1 671B满血版，免费！不卡顿！ 真正采用DeepSeek-R1 671B满血版！这是系列模型中能力最完整、效果最优的版本。性能是一般版本的400倍！ 这个当贝AI整合DeepSeek-R1 671B满血版，免费、极速、不用登录注册，非常方便！ 包括： 1、DeepSeek-R","url":"https://ai.dangbei.com/chat","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/02/20250205134524-1febd.png","category":"chat","tags":["AI"],"pricing":"free","rating":0,"views":0,"createdAt":"2026-08-24T08:17:28.671Z","updatedAt":"2026-08-24T08:17:28.671Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/715.html","fetchedAt":"2026-08-24T08:17:29.919Z","tool":{"slug":"魔搭社区","name":"魔搭社区","description":"各领域先进的机器学习模型,魔搭社区（ModelScope）是由阿里达摩院推出的AI模型社区，致力于为用户提供一站式的模型服务。它聚集了大量高质量的预训练模型，涵盖计算机视觉、自然语言处理、语音识别等领域，适用于广泛的行业应用。魔搭社区不仅是一个简单的模型获取平台，更是一个开放式的机器学习社区，用户可以在这里下载、交流与完善各","url":"https://www.modelscope.cn","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/01/1737030581655.png","category":"audio","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:29.919Z","updatedAt":"2026-08-24T08:17:29.919Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/124.html","fetchedAt":"2026-08-24T08:17:31.143Z","tool":{"slug":"豆包","name":"豆包","description":"字节跳动开发的AI问答助手,豆包，一款由字节跳动精心打造的AI助手，它不仅是你的私人问答专家，更是写作、翻译、情感陪伴、编程等多面手。无论是Web端还是iOS/安卓，一键登录（手机号、抖音号、Apple ID任选），即刻开启智能生活新篇章！ 字节跳动旗下热门AI产品： 豆包主要功能清单 聊天互动：用户可以通过豆包进行对话","url":"https://dis.csqixiang.cn/unpo/dbfaxianai.html","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/01/1737026039.png","category":"code","tags":["AI图像"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:31.143Z","updatedAt":"2026-08-24T08:17:31.143Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/8139.html","fetchedAt":"2026-08-24T08:17:31.782Z","tool":{"slug":"讯飞星火认知大模型","name":"讯飞星火认知大模型","description":"科大讯飞打造的AI多面手，对话、办公、学习样样行,简介 讯飞星火是科大讯飞推出的AI对话工具，集成了文本生成、语言理解、知识问答等多种功能。它支持74种语言和方言的无缝对话，还能提供智能批阅、数字健康管理等个性化服务。 功能特点 多语言支持：支持74种语言和方言，方便跨语言交流。 智能对话：能够理解并生成自然语言，提供流畅的对话体验。 知识问答：整","url":"https://xinghuo.xfyun.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/01/1740655769203.png","category":"chat","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:31.782Z","updatedAt":"2026-08-24T08:17:31.782Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/197.html","fetchedAt":"2026-08-24T08:17:33.625Z","tool":{"slug":"可灵ai","name":"可灵AI","description":"快手推出的视频工具,KLING AI, tools for creating imaginative images and videos, based on state-of-art generative AI methods. 可灵AI概述 可灵AI（Kling AI）是由快手团队开发的一款先进的人工智能视频生成工具","url":"https://klingai.kuaishou.com","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/01/1737027646115.png","category":"video","tags":["AI图像"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:33.625Z","updatedAt":"2026-08-24T08:17:33.625Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/11946.html","fetchedAt":"2026-08-24T08:17:34.233Z","tool":{"slug":"vscode","name":"VSCode","description":"微软旗下跨平台源代码编辑器,Visual Studio Code（简称VS Code）是微软Microsoft推出一款运行于 Mac OS X、Windows和 Linux 之上的，针对于编写现代Web和云应用的跨平台源代码编辑器，可在桌面上运行，并且可用于Windows，macOS和Linux。 它具有对JavaScript","url":"https://code.visualstudio.com/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/03/20250327110551-aed87.png","category":"code","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:34.233Z","updatedAt":"2026-08-24T08:17:34.233Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/147.html","fetchedAt":"2026-08-24T08:17:35.456Z","tool":{"slug":"绘蛙ai文案","name":"绘蛙AI文案","description":"种草文案写作工具,绘蛙-是一款功能强大，简洁好用的智能图片、文案创作平台，并且拥有海量虚拟模特可选择。在绘蛙，你可训练自己的商品模型和模特模型，可通过AI生成商拍图和种草文案，可以创作小红书图片,电商商品主图,跨境电商主图,小红书种草文案,穿搭文案，视频口播文案，可在线一键美图,输入口令修改图片内容,一键换装,一键去","url":"https://www.ihuiwa.com/invite?huiwaInviteCode=ZRSVGL","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/01/20250122090825-d9fd5.png","category":"image","tags":["AI"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:35.456Z","updatedAt":"2026-08-24T08:17:35.456Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/11551.html","fetchedAt":"2026-08-24T08:17:36.051Z","tool":{"slug":"智标领航","name":"智标领航","description":"招投标AI助手,网站介绍： （一）AI写标书 AI辅助完成80%编标工作。支持AI解析招标文件、AI生成标书目录、AI生成投标方案、AI生成偏离表，简单高效。 （二）AI标讯 全网标讯实时更新，每日新增10000+招标信息，信息更新延迟≤1分钟。 （三）私有化服务 为企业提供安全可控的智能化招投标系统部署方案，安全","url":"https://www.intellibid.cn/","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/05/1747897844-图片3.png","category":"chat","tags":["AI办公"],"pricing":"freemium","rating":0,"views":0,"createdAt":"2026-08-24T08:17:36.051Z","updatedAt":"2026-08-24T08:17:36.051Z"}},
  {"source":"faxianai","sourceUrl":"https://www.faxianai.com/ai/8154.html","fetchedAt":"2026-08-24T08:17:37.242Z","tool":{"slug":"ai一键写论文","name":"AI一键写论文","description":"全能论文助手，优质AI论文平台千字大纲免费生成,笔灵AI，是一款毕业论文、千字大纲免费生成，几万字专业初稿，答辩PPT一键生成，更可根据导师要求无限改稿！ 笔灵AI论文5大特点： 1、覆盖所有专业和论文类型 2、免费千字大纲生成 3、速成万字低查重率论文 4、一键降低论文查重率 5、强力去除论文AIGC痕迹 一、笔灵AI论文功能介绍 1、覆盖所有","url":"https://ibiling.cn/paper?from=fxaipaper&ref=www.faxianai.com","logoUrl":"https://www.faxianai.com/wp-content/uploads/2025/03/1742449235-1280X1280-1.png","category":"chat","tags":["AI"],"pricing":"free","rating":0,"views":0,"createdAt":"2026-08-24T08:17:37.242Z","updatedAt":"2026-08-24T08:17:37.242Z"}}
]
