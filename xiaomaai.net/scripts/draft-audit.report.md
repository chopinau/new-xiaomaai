# 草稿内容质量核查报告

> 生成时间: 2026-08-31T09:17:35.722Z
> 数据源: `data/tools-draft.ts` (96 条草稿)
>
> ## 分类统计
>
> | 类别 | 数量 | 说明 |
> |------|------|------|
> | ✅ 可直接入库 | 72 | 已有中文简介且长度≥20字符 |
> | 🌐 需翻译 | 22 | 全英文简介,需人工翻译为中文 |
> | ✏️ 需重写 | 2 | 简介过短或无价值感,需人工重写 |
> | ❌ 建议丢弃 | 0 | 重复/失效/与AI无关 |
>
> ## 按来源统计
>
> | 来源 | 总数 | 可入库 | 入库率 |
> |------|------|--------|--------|
| github-trending | 24 | 2 | 8% |
| faxianai | 72 | 70 | 97% |

## ✅ 可直接入库 (72 条)

> 这些草稿已有中文简介且长度足够,可直接合并到 `data/tools.ts`

| # | slug | name | source | 描述字符数 | 简介(前80字) | 语言 |
|---|------|------|--------|------------|-------------|------|
| 1 | `JavaGuide` | JavaGuide | `github-trending` | 52 | Java 面试 & 后端通用面试指南，覆盖计算机基础、数据库、分布式、高并发、系统设计与 AI 应用开发 | 中文 |
| 2 | `hello-agents` | hello-agents | `github-trending` | 31 | 📚 《从零开始构建智能体》——从零开始的智能体原理与实践教程 | 中文 |
| 3 | `偷师` | 偷师 | `faxianai` | 80 | 提示词反推神器,偷师可以在网页图片上直接反推中文 / 英文 AI 提示词，识别主体、风格、光影、构图、比例与关键文字，并一键带到 PixPix 生成同款灵感图。 | 中文 |
| 4 | `pixpix` | PixPix | `faxianai` | 80 | AI电商工具,一张产品原图，30s 生成全套套图及 A+详情 一张商品图，搞定全套图 省下布景、拍摄、修图的重复成本 一张图延展多套视觉，快速测试点击率 风格统 | 中文 |
| 5 | `cocoloop` | CoCoLoop | `faxianai` | 80 | AI讨论社区,CoCoLoop是国内首个专为AI智能体（AI Agent）打造的一站式技能商店与开发者社区，旨在解决国内开发者在接入OpenClaw（俗称“小龙 | 中文 |
| 6 | `免费nano-banana-free` | 免费Nano Banana Free | `faxianai` | 80 | 免费不限次的Nano Banana,免费不限次的Nano Banana，提供有10多种Nano Banana的修图玩法，并且免登录、免费。用起来还是非常不错。不 | 中文 |
| 7 | `nano-banana-2` | Nano Banana 2 | `faxianai` | 80 | 全网火爆的Nano Banana 2,AI图片王者，Nano Banana Pro太权威了，稳居第一。 最新的Nano Banana 2，又可以称之为Nano  | 中文 |
| 8 | `gpt-image-2` | GPT Image 2 | `faxianai` | 80 | AI作图工具,gptimg2由GPT Image 2驱动——这是OpenAI最先进的图像模型，可实现精准文本渲染、智能编辑和真实世界视觉理解。无论是营销创意、产 | 中文 |
| 9 | `skill商店` | Skill商店 | `faxianai` | 80 | 精品、安全的Skills商店,CoCoLoop是国内首个专为AI智能体（AI Agent）打造的一站式技能商店与开发者社区，旨在解决国内开发者在接入OpenCl | 中文 |
| 10 | `学术版codex` | 学术版Codex | `faxianai` | 80 | 复旦研发的0幻觉、真实文献的科研助手,程序员被 Codex 彻底改变了，不用一行行敲代码，把需求丢给 AI，让它自己写代码、跑测试、修 Bug、闭环交付。 那么 | 中文 |
| 11 | `libtv视频` | Libtv视频 | `faxianai` | 25 | 输入文字或上传参考图，在线生成高质量 AI 图片。 | 中文 |
| 12 | `liblib` | LibLib | `faxianai` | 63 | liblibai 是一个免费 AI 生图平台——输入提示词，秒出高质量图片；注册即享每日 5 张免费额度，无需安装、开箱即用。 | 中文 |
| 13 | `minimax视频` | MiniMax视频 | `faxianai` | 77 | 免费体验 MiniMax H3 AI 视频生成器。支持文生视频、图生视频、最多 3 张参考图、2K 高清输出、4–15 秒时长、多种画面比例与原生立体声。 | 中文 |
| 14 | `openclaw中文版` | OpenClaw中文版 | `faxianai` | 80 | 一个能真正做事情的AI Agents,OpenClaw一款火爆海外的AI智能体，一款长了“手”和“脚”真正能干活的AI智能体工具。目前国内平替中文版Molili | 中文 |
| 15 | `trae编程` | TRAE编程 | `faxianai` | 80 | AI辅助编程，代码自动修复,零基也能玩转的AI编程，普通用户也能开发一个优秀的游戏产品。新手比较友好。 Trae是字节跳动推出的国内首款AI原生IDE，集成Cl | 中文 |
| 16 | `扣子` | 扣子 | `faxianai` | 80 | AI办公助手提升50%效率,AI办公助手，复杂任务高效处理。办公效率低？扣子空间AI助手支持播客生成、PPT制作、网页开发及报告写作，覆盖科研、商业、舆情等领域 | 中文 |
| 17 | `clawdbot-openclaw` | Clawdbot(OpenClaw) | `faxianai` | 80 | AI智能体,Clawdbot又名OpenClaw是一个开源的、本地运行的 AI Agent 自动化框架，核心目标是：让 AI 不只是“聊天”，而是真正“动手做事 | 中文 |
| 18 | `当贝ai` | 当贝AI | `faxianai` | 80 | 一站式AI体验，聚合全网优质大模型,8月05日，当贝AI更新，加入AI旅行规划师、和接入智谱清言GLM 4.5大模型，截止今天，当贝AI已经接入了国内15款最新 | 中文 |
| 19 | `绘蛙` | 绘蛙 | `faxianai` | 80 | 阿里旗下制作商拍图的工具,绘蛙-是一款功能强大，简洁好用的智能图片、文案创作平台，并且拥有海量虚拟模特可选择。在绘蛙，你可训练自己的商品模型和模特模型，可通过A | 中文 |
| 20 | `gpt-5` | GPT-5 | `faxianai` | 80 | OpenAI旗下GPT-5最新大模型 ,8月7日美国开放人工智能研究中心（OpenAI）7日发布其最新人工智能模型GPT-5。 据OpenAI官网介绍，这是迄今 | 中文 |
| 21 | `即梦ai` | 即梦AI | `faxianai` | 80 | 字节推出的强大AI创作工具,即梦AI，由字节跳动推出，是一款集文字绘图、文字生成视频、图片生成视频于一体的一站式生成式人工智能创作平台。用户可以通过自然语言或图 | 中文 |
| 22 | `imini-ai` | imini AI | `faxianai` | 80 | 简单、易用的AI图片和AI视频工具,imini AI一款极其简单、易用的AI图片和AI视频制作平台，简单易用，无需专业知识，也能做出令人惊叹的图片和视频。 im | 中文 |
| 23 | `稿定ai` | 稿定AI | `faxianai` | 80 | 一站式AI绘图和设计工具集,小白也能轻松做出好看的图片，上手很简单。稿定AI包括了AI抠图、海报制作、AI设计等，非常适合自媒体用户，有轻度做图需求的用户。 稿 | 中文 |
| 24 | `adobe-firefly` | Adobe Firefly | `faxianai` | 80 | adobe出品超强AI图像工具,Adobe Firefly的概述 Adobe Firefly是Adobe公司推出的一款基于人工智能（AI）技术的创意工具，旨在为 | 中文 |
| 25 | `美图whee` | 美图Whee | `faxianai` | 80 | 美团出品在线AI图片生成工具,美图Whee是美图公司推出的一款基于人工智能技术的图片和绘画创作平台。以下是其概述、功能及使用过程中可能遇到的问题介绍： 概述 美 | 中文 |
| 26 | `文心一格` | 文心一格 | `faxianai` | 80 | 百度旗下AI创意图片平台,文心一格，AI艺术和创意辅助平台，依托飞桨、文心大模型的技术创新推出的“AI作画”产品，可轻松驾驭多种风格，人人皆可“一语成画” 文心 | 中文 |
| 27 | `可画` | 可画 | `faxianai` | 80 | 一流的中文在线设计平台,Canva可画打造了一流的中文在线设计平台，整合了数以千万计的高清图片、中英文字体、原创模板、插画等视觉元素。Canva可画降低，在某些 | 中文 |
| 28 | `nijijourney` | NijiJourney | `faxianai` | 80 | 用于生成定制动漫插图的AI工具，专注于动漫美学,AI tool for generating custom anime illustrations with a | 中文 |
| 29 | `liblibai-哩布哩布ai` | LiblibAI·哩布哩布AI | `faxianai` | 80 | AI图像创作平台,AI绘画原创模型分享社区，10万+模型免费下载;原汁原味的webUI、comfyUI，在线AI绘图工具免费使用;还可在线进行模型训练。欢迎每一 | 中文 |
| 30 | `ai旅行规划师` | AI旅行规划师 | `faxianai` | 80 | 一键生成旅行攻略,当贝AI -- 超级智能体《AI旅行规划师》重磅上线！带娃亲子游、情侣打卡旅游、徒步旅游、小众景点...一键生成！ 一、简介： 首款旅行AI超 | 中文 |
| 31 | `roboneo-美图旗下` | RoboNeo 美图旗下 | `faxianai` | 80 | 帮你修图、设计、做视频,专注影像生产力的AI Agent RoboNeo 网页版是厦门美图网科技有限公司倾情推出的一款智能创作工具，软件拥有修图、设计、做视频等 | 中文 |
| 32 | `chatgpt-agent` | ChatGPT Agent | `faxianai` | 80 | ChatGPT Agent智能体,2025年7月18日，OpenAI旗下ChatGPT Agent重磅发布，能上网搜、会做PPT、精通Excel。 ChatGP | 中文 |
| 33 | `grok-4-ai虚拟女友` | Grok 4 AI虚拟女友 | `faxianai` | 80 | AI虚拟女友,xAI旗下的Grok于iOS APP 推出全新功能，新增互动 AI 伴侣，并以动漫风格的虚拟形象呈现，为用户带来更生动有趣的互动体验。用户可使用语 | 中文 |
| 34 | `minimax` | MiniMax | `faxianai` | 80 | 强大通用智能体,MiniMax Agent是一个能完成长程（Long Horizon）复杂任务的通用智能体，也就是能多步规划出专家级解决方案、能灵活拆解任务需求 | 中文 |
| 35 | `genspark` | Genspark | `faxianai` | 80 | 前百度高管创立AI Agent,Genspark它就是由前百度高管创立的。需要注意的是，很多假冒网站，大家需要辨别。发现AI提供的为Genspark的官网地址。 | 中文 |
| 36 | `lovart` | Lovart | `faxianai` | 80 | 最强设计智能体,最近海外有一款Design Agent彻底火了，北美设计圈大佬都在用，它就是Lovart，经过几天的实测，我已经掌握了5种生猛用法，每一个都让我 | 中文 |
| 37 | `davinci-ai` | DaVinci AI | `faxianai` | 79 | 免费在线生成 AI 图片和 AI 视频，输入一句话即可出图出片。支持文生图、图生图、文生视频、图生视频，打开网页就能用，无需下载安装，新用户注册即送生成额度。 | 中文 |
| 38 | `prized` | Prized | `faxianai` | 80 | AI搭建企业内部工具,Prized 让运营、客服、财务这些不写代码的团队用 AI 搭出自己的内部工具，重点在后半句：搭出来的东西是安全的。三条约束是它区别于普通 | 中文 |
| 39 | `wizstar` | Wizstar | `faxianai` | 80 | AI数字人商品视频生成,Wizstar 是一个偏电商和营销场景的 AI 创作平台，输入可以是一段文字、一张图片，也可以直接丢一个商品链接，输出是视频、数字人口播 | 中文 |
| 40 | `meetstream-ai` | MeetStream AI | `faxianai` | 80 | 会议机器人统一API,MeetStream 提供的是一套统一的会议机器人 API，用一个接口同时对接 Zoom、Google Meet 和 Microsoft  | 中文 |
| 41 | `bitdrift` | bitdrift | `faxianai` | 80 | AI智能体移动可观测平台,bitdrift 做的是移动端可观测性，但切入角度和传统 APM 不一样——它把数据开放给 AI 智能体，让 Agent 自己去查崩溃 | 中文 |
| 42 | `nobodywho` | NobodyWho | `faxianai` | 80 | 端侧本地大模型推理引擎,NobodyWho 是一个开源推理引擎，目标是让大模型跑在任意设备上——手机、桌面、嵌入式都算在内，文本、视觉、语音三类模型都支持。模型 | 中文 |
| 43 | `hynote` | HyNote | `faxianai` | 80 | AI会议录音笔记工具,HyNote 是一款 AI 笔记工具，输入端铺得很宽：现场录音、电话通话、上传音频、文本与 PDF、图片截图 OCR、YouTube 或视 | 中文 |
| 44 | `checksum-ai` | Checksum AI | `faxianai` | 80 | AI自动生成端到端测试,Checksum 把自己定位成“编程智能体的测试搭子”，做的事是自动生成并维护 Playwright 端到端测试。它的判断很直接：AI  | 中文 |
| 45 | `actx0` | Actx0 | `faxianai` | 80 | AI智能体记忆基础设施,Actx0 是给 AI 智能体和应用做记忆层的托管服务，解决的是“每开一个新会话就失忆”这个老问题。它把记忆分成两类：会话记忆（sess | 中文 |
| 46 | `loomi` | Loomi | `faxianai` | 80 | 社媒AI图文视频创作平台,Loomi 对外的定位是社交媒体内容智能体，实际打开产品会发现它做的比这句话宽——Explore、Agent、AI Image、AI  | 中文 |
| 47 | `lawbot脱敏猫` | Lawbot脱敏猫 | `faxianai` | 80 | 法律文档离线脱敏工具,Lawbot 脱敏猫解决的是一个很具体的矛盾：律师想用 AI 处理合同、诉状、判决书，但这些材料里的当事人信息不能上传。它的做法是把脱敏这 | 中文 |
| 48 | `cline` | Cline | `faxianai` | 80 | 开源AI编程智能体,Cline 是一个开源的 AI 编程智能体，Apache 2.0 协议，全平台安装量超过 800 万，GitHub 星标 6.6 万以上。它 | 中文 |
| 49 | `renoise` | Renoise | `faxianai` | 80 | 多模型AI视频图像套件,Renoise 把市面上主流的生成模型集中到了一个界面里，视频侧有 Seedance 2.5 / 2.0、可灵 3.0、MiniMax  | 中文 |
| 50 | `qwenpaw` | QwenPaw | `faxianai` | 80 | 个人AI智能体工作站,QwenPaw 是 AgentScope 团队做的个人 AI 智能体工作站，特点是跑在你自己的环境里——本地部署或者自己的云都可以，不必把 | 中文 |
| ... | | | | | _(共 72 条,仅显示前50条)_ | | | |

## 🌐 需翻译 (22 条)

> 全英文简介,需人工翻译为中文后方可入库

| # | slug | name | source | 描述字符数 | 简介(前80字) | 语言 |
|---|------|------|--------|------------|-------------|------|
| 1 | `openclaw` | openclaw | `github-trending` | 74 | Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞  | 英文 |
| 2 | `superpowers` | superpowers | `github-trending` | 74 | An agentic skills framework & software development methodology that works. | 英文 |
| 3 | `n8n` | n8n | `github-trending` | 80 | Fair-code workflow automation platform with native AI capabilities. Combine visu | 英文 |
| 4 | `AutoGPT` | AutoGPT | `github-trending` | 80 | AutoGPT is the vision of accessible AI for everyone, to use and to build on. Our | 英文 |
| 5 | `prompts.chat` | prompts.chat | `github-trending` | 80 | f.k.a. Awesome ChatGPT Prompts. Share, discover, and collect prompts from the co | 英文 |
| 6 | `firecrawl` | firecrawl | `github-trending` | 73 | The context API to search, scrape, and interact with the web at scale. 🔥 | 英文 |
| 7 | `dify` | dify | `github-trending` | 80 | Build Agentic workflows, RAG pipelines, with rich AI model and tool support on o | 英文 |
| 8 | `open-webui` | open-webui | `github-trending` | 61 | User-friendly AI Interface (Supports Ollama, OpenAI API, ...) | 英文 |
| 9 | `ECC` | ECC | `github-trending` | 80 | The agent harness performance optimization system. Skills, instincts, memory, se | 英文 |
| 10 | `transformers` | transformers | `github-trending` | 80 | 🤗 Transformers: the model-definition framework for state-of-the-art machine lea | 英文 |
| 11 | `graphify` | graphify | `github-trending` | 80 | Turn any codebase, with its docs, SQL schemas, configs, and PDFs, into a queryab | 英文 |
| 12 | `TradingAgents` | TradingAgents | `github-trending` | 59 | TradingAgents: Multi-Agents LLM Financial Trading Framework | 英文 |
| 13 | `OpenHands` | OpenHands | `github-trending` | 35 | 🙌 OpenHands: AI-Driven Development | 英文 |
| 14 | `lobehub` | lobehub | `github-trending` | 80 | 🤯 LobeHub is your Chief Agent Operator, organizing your agents into 7×24 operat | 英文 |
| 15 | `worldmonitor` | worldmonitor | `github-trending` | 80 | Real-time global intelligence dashboard. AI-powered news aggregation, geopolitic | 英文 |
| 16 | `deer-flow` | deer-flow | `github-trending` | 80 | An open-source long-horizon SuperAgent harness that researches, codes, and creat | 英文 |
| 17 | `Prompt-Engineering-Guide` | Prompt-Engineering-Guide | `github-trending` | 80 | 🐙 Guides, papers, lessons, notebooks and resources for prompt engineering, cont | 英文 |
| 18 | `taste-skill` | taste-skill | `github-trending` | 80 | Taste-Skill - gives your AI good taste. stops the AI from generating boring, gen | 英文 |
| 19 | `LlamaFactory` | LlamaFactory | `github-trending` | 60 | Unified Efficient Fine-Tuning of 100+ LLMs & VLMs (ACL 2024) | 英文 |
| 20 | `learn-claude-code` | learn-claude-code | `github-trending` | 80 | Bash is all you need -  A nano claude code–like 「agent harness」, built from 0 to | 英文 |
| 21 | `lovart生图` | Lovart生图 | `faxianai` | 80 | Create brand visuals, posters, product images, and cinematic artwork with text-t | 英文 |
| 22 | `tapnow视频` | TapNow视频 | `faxianai` | 80 | Create connected text-to-image and image-to-image workflows on an intelligent vi | 英文 |

## ✏️ 需重写 (2 条)

> 简介过短或无价值感,需人工重写中文简介

| # | slug | name | source | 描述字符数 | 当前简介 | 语言 |
|---|------|------|--------|------------|----------|------|
| 1 | `hermes-agent` | hermes-agent | `github-trending` | 29 | The agent that grows with you | 英文 |
| 2 | `stable-diffusion-webui` | stable-diffusion-webui | `github-trending` | 23 | Stable Diffusion web UI | 英文 |

## ❌ 建议丢弃 (0 条)

> 无URL/无名称/与AI无关,建议从草稿区删除

| # | slug | name | source | 原因 |
|---|------|------|--------|------|

## 处理建议

1. **✅ 可直接入库** (72 条): 可批量合并到 `data/tools.ts`
2. **🌐 需翻译** (22 条): 需人工翻译英文简介为中文后入库
3. **✏️ 需重写** (2 条): 简介质量不足,需人工重写
4. **❌ 建议丢弃** (0 条): 可从草稿区清理

### 入库操作
```bash
# 仅入库"可直接入库"类别的草稿
# 在 admin 后台勾选对应条目,点击"批量入库"
```

## 边界
- 不调用任何 LLM
- 不抓取 og:meta (草稿已有抓取数据)
- 仅基于现有 description/slug/name 字段做质量判断
