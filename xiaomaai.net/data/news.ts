export interface NewsItem {
  id: string
  date: string // YYYY-MM-DD
  title: string
  summary: string
  content: string // 全文 HTML（1:1 原文）
  coverImage?: string // 封面图 URL
  category: 'llm' | 'opensource' | 'business' | 'funding'
  source: string
  url: string
}

export const NEWS_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'llm', label: '大模型' },
  { key: 'opensource', label: '开源' },
  { key: 'business', label: '商业' },
  { key: 'funding', label: '融资' },
] as const

// 空数组：所有资讯必须从 news-draft.ts 审核发布
export const newsItems: NewsItem[] = [
  {
    id: "f1l916",
    date: "2026-05-01",
    title: "Anthropic向华尔街推出10个AI金融Agent",
    summary: "Anthropic昨天放了一招直奔金融业的牌。 10个开箱即用的Claude agent模板，配套Microsoft 365深度集成，目标客户名单里写着Citadel、纽约梅隆、Carlyle、瑞穗——这不是PR稿里的”潜在意向客户”，是已",
    content: "<p>Anthropic昨天放了一招直奔金融业的牌。</p>\n<p>10个开箱即用的Claude agent模板，配套Microsoft 365深度集成，目标客户名单里写着Citadel、纽约梅隆、Carlyle、瑞穗——这不是PR稿里的”潜在意向客户”，是已经在生产环境里用的。</p>\n<p>说白了，Anthropic想让分析师从写PPT和过KYC里脱身。</p>\n<h2 id=\"10个模板都是干什么的\">10个模板都是干什么的</h2>\n<p>按场景分两组。</p>\n<p><strong>面向研究和客户覆盖：</strong></p>\n<ul>\n<li>Pitch builder（路演材料生成）</li>\n<li>Meeting preparer（会前准备）</li>\n<li>Earnings reviewer（财报分析）</li>\n<li>Model builder（财务建模）</li>\n<li>Market researcher（市场研究）</li>\n</ul>\n<p><strong>面向财务和运营：</strong></p>\n<ul>\n<li>Valuation reviewer（估值审查）</li>\n<li>General ledger reconciler（总账对账）</li>\n<li>Month-end closer（月末结账）</li>\n<li>Statement auditor（报表审计）</li>\n<li>KYC screener（KYC筛查）</li>\n</ul>\n<p>每个模板都是一个”参考架构”，里面打包了三样东西：</p>\n<blockquote>\n<p>Skills（任务指令和领域知识）+ Connectors（受治理的数据访问）+ Subagents（处理特定子任务的Claude小弟）</p>\n</blockquote>\n<p>部署方式三选一：作为Claude Cowork和Claude Code的插件、作为Claude Managed Agents的cookbook、或者直接调用。Managed Agents这条路比较关键——支持长时间会话、按工具粒度的权限控制、托管的凭证保险柜、完整审计日志。</p>\n<h2 id=\"已经在用的客户名单\">已经在用的客户名单</h2>\n<p>这是Anthropic这次最有杀伤力的部分——客户引语全是真名实姓的高管：</p>\n<ul>\n<li><strong>Citadel核心工程负责人 Atte Lahtiranta</strong>：“Claude for Excel让分析师在他们最熟悉的工具里建模型、做信号分离、压力测试。”</li>\n<li><strong>FIS CEO Stephanie Ferris</strong>：“反洗钱调查从几天压缩到几分钟。”</li>\n<li><strong>纽约梅隆 CIO Leigh-Ann Russell</strong>：“数字员工现在能端到端处理整个case。”</li>\n<li><strong>Walleye Capital CEO Will England</strong>：“400人团队100%在用Claude Code。”</li>\n<li><strong>Carlyle 首席数字官 Matt Anderson</strong>：“Claude在投资、运营、组合管理全链条上创造价值。”</li>\n</ul>\n<p>注意Walleye那条——一家400人对冲基金，全员用Claude Code写代码。这种”全员渗透”的数字，过去通常出现在科技公司，不是华尔街。</p>\n<h2 id=\"excel这次是认真的\">Excel这次是认真的</h2>\n<p>金融民工的命根子在Excel。Anthropic这次把Claude塞进去的方式，比过去那种”AI助手”插件激进得多：</p>\n<ul>\n<li>从SEC文件和数据源<strong>自动构建财务模型</strong></li>\n<li>跨链接工作簿<strong>审计公式</strong></li>\n<li>跑<strong>敏感性分析</strong></li>\n</ul>\n<p>更关键的是上下文跨应用流转：你在Excel里搭好的模型，切到PowerPoint做汇报，Claude能直接接着用，不用重新解释你想干什么。Outlook目前还在路上，但加进来之后基本就是”开个会前帮你查清楚客户、准备好材料、会后写跟进邮件”一条龙。</p>\n<h2 id=\"数据连接器和底层模型\">数据连接器和底层模型</h2>\n<p>光有工具没有数据等于没用。Anthropic这次同步发布了8个新连接器：Dun &#x26; Bradstreet、Fiscal AI、Financial Modeling Prep、Guidepoint、IBISWorld、SS&#x26;C IntraLinks、Third Bridge、Verisk。</p>\n<p>外加一条重磅：<strong>Moody’s上线了MCP app</strong>，覆盖6亿+实体的信用评级和数据。</p>\n<p>底层模型用的是Claude Opus 4.7——在Vals AI的Finance Agent benchmark上拿了<strong>64.37%</strong>，目前行业第一。</p>\n<h2 id=\"这一仗在和谁打\">这一仗在和谁打</h2>\n<p>明摆着，对面是OpenAI。OpenAI一周前刚和Novo Nordisk签了大单进药厂、和高盛系的几个对冲基金谈合作。Anthropic这次直接掏出已经签了名的客户清单，节奏感很强。</p>\n<p>但更值得注意的是结构变化。模板+连接器+企业级权限管理的组合，意味着Anthropic不再卖”模型API”了，它卖的是<strong>一套能直接进合规审查的金融工作流</strong>。</p>\n<p>下一步该看的是定价。Claude Cowork和Managed Agents的具体收费方式如果走”按座位+按用量”的混合套路，对Bloomberg Terminal这种4天工作日$2400的传统工具是直接威胁。</p>\n<p>这场仗才刚开始。</p>\n<p class=\"source-ref\">参考来源：<a class=\"source-ref-cocoloop\" href=\"https://www.cocoloop.cn/\" target=\"_blank\">CocoLoop</a>、Agents for financial services and insurance（Anthropic官方博客）；Anthropic unleashes finance agents for Claude（The Register）；Anthropic launches 10 AI agents for banks and insurers（Yahoo Finance）；Anthropic Launches 10 Claude Agent Templates for Financial Services, Expands Microsoft 365 Integration（How2Shout）</p>",
    coverImage: "",
    category: "llm",
    source: "Cocoloop",
    url: "https://news.cocoloop.cn/2026/05/anthropic-finance-agents/",
  },

]

export function getRecentNews(limit: number = 5): NewsItem[] {
  return [...newsItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}
