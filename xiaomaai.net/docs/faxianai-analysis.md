# faxianai.com 视觉骨架分析

## 站点定位
faxianai.com 是一个中文 AI 工具聚合导航站，UI 信息密度高，强调"卡片瀑布流 + 分梯队曝光"。

## 5 个核心分区（首页）

| 顺序 | 分区名 | 形态 | 卡片数量 | 数据特征 |
|------|--------|------|----------|----------|
| 1 | 大热门 AI | 4 大卡横向 | 4 | featured=true, 强视觉 |
| 2 | 热门 AI | 8 中卡瀑布流 | 8 | 按 views 排序 |
| 3 | TOP 10 分榜 | 7 横向 tab | 7×10 | 7 赛道各自 TOP 10 |
| 4 | AI 操作手册 | 3 列卡片 | 6-9 | 教程类内容 |
| 5 | 超级智能体 | 6 小卡 | 6 | Agent 类产品 |

## 7 个赛道分类

| 中文 | 英文 | 现有 data/tools.ts 分类 |
|------|------|------------------------|
| 图像 AI | image | image |
| 对话 AI | chat | chat |
| 视频 AI | video | video |
| 办公 AI | productivity | productivity |
| 音频 AI | audio | audio |
| 开发 AI | code | code |
| 论文 AI | research | research |

## 改造映射表

| faxianai 元素 | 小马 AI 对应 |
|---------------|--------------|
| 顶部导航 | `components/TopNav.tsx`（已有） |
| 大热门 AI 4 大卡 | 新增 `components/home/sections/BigHotSection.tsx` |
| 热门 AI 8 中卡 | 新增 `components/home/sections/HotSection.tsx` |
| TOP 10 横向 tab | 新增 `components/home/sections/CategoryTopSection.tsx` |
| AI 操作手册 | 新增路由 `/manuals` + `data/manuals/*.md` |
| 超级智能体 | 新增 `components/home/sections/AgentsSection.tsx` |
| 我的收藏 | 新增路由 `/bookmarks` |

## 不抄什么

- 不抄"AI 操作手册"的硬广风格 → 改为"产品介绍 + 5 案例 + 进阶玩法 + 提示词合集"四段式，更实用
- 不抄"Skill 商店"二级页面 → 简化合并到工作流市场
- 不抄大色块背景图 → 保持小马 AI 的极简卡片风格

## 视觉一致性原则

- 颜色：小马 AI 品牌色（brand-purple 紫）+ faxianai 的"信息密度"组合
- 卡片：保持 2xl 圆角 + shadow-card 阴影
- 网格：响应式 1/2/3/4 列
- 悬停：上浮 -translate-y-1 + 阴影增强

## 落地优先级

1. 首页 5 分区（必做）—— Task 3-4
2. AI 资讯半自动（必做）—— Task 5-8
3. 工具半自动收录（必做）—— Task 9-12
4. 工作流市场（必做）—— Task 13-17
5. 操作手册（必做）—— Task 18-20
6. TOP 10 升级（必做）—— Task 21
7. 收藏 + 自定义网址（必做）—— Task 22-24
