# xiaomaai.net 核心难题清单（CC 处理版）

> **项目**：xiaomaai.net - 全球 AI 工具聚合市场
> **栈**：Next.js 15.5 + TypeScript + shadcn/ui + React Flow + Tailwind 4
> **数据源**：LiteLLM + OpenRouter（自动同步）
> **目标**：每个任务独立可执行，每段代码可直接复制使用

---

## 📊 任务总览

| ID | 等级 | 标题 | 预计时间 | 依赖 |
|---|---|---|---|---|
| **P0-1** | 🔴 P0 | 修复 3 个 TypeScript 编译错误 | 30 分钟 | 无 |
| **P0-2** | 🔴 P0 | 修复数据准确性问题（ChatGPT 价格显示异常） | 1 小时 | 无 |
| **P0-3** | 🔴 P0 | 验证 GitHub Actions 自动化 | 15 分钟（部署后等结果） | P0-1 |
| **P1-1** | 🟡 P1 | 清理 public/ 旧版静态文件 | 15 分钟 | 无 |
| **P1-2** | 🟡 P1 | 修复首页分类计数首屏闪动 | 20 分钟 | 无 |
| **P1-3** | 🟡 P1 | DataFreshness 组件走 SSR | 30 分钟 | 无 |
| **P2-1** | 🟢 P2 | 时效检测接入 pre-commit | 30 分钟 | 无 |
| **P2-2** | 🟢 P2 | 提取环境配置到 `config/site.ts` | 20 分钟 | 无 |

---

## 🔴 P0-1：修复 TypeScript 编译错误

### 问题描述

`npm run build` 失败，4 个文件 6 处错误。**未修复前生产环境无法部署**。

### 完整错误清单

```
app/fenge/page.tsx(6,24): error TS7016: Could not find a declaration file for module 'file-saver'.
app/gif/page.tsx(5,24): error TS7016: Could not find a declaration file for module 'file-saver'.
app/gif/page.tsx(6,21): error TS7016: Could not find a declaration file for 'gifshot'.
app/gif/page.tsx(463,22): error TS7006: Parameter 'progress' implicitly has an 'any' type.
app/gif/page.tsx(466,11): error TS7006: Parameter 'obj' implicitly has an 'any' type.
app/gif/page.tsx(567,13): error TS2322: ease: number[] not assignable to type Easing[].
app/gif/page.tsx(703,13): error TS2322: ease: number[] not assignable to type Easing[].
app/gif/page.tsx(818,21): error TS2322: ease: number[] not assignable to type Easing[].
app/pdf/page.tsx(189,65): error TS2345: BlobCallback type mismatch.
```

### 涉及文件

- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\app\fenge\page.tsx`（第 6 行）
- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\app\gif\page.tsx`（第 5、6、463、466、567、703、818 行）
- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\app\pdf\page.tsx`（第 189 行）
- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\package.json`

### 修复方案（逐步执行）

#### 步骤 1：安装缺失的 @types 包

在 `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\` 目录下执行：

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net
npm install --save-dev @types/file-saver @types/gifshot
```

#### 步骤 2：修复 `app/fenge/page.tsx` 第 6 行

**改前**：
```typescript
import { saveAs } from 'file-saver'
```

**改后**（添加类型断言，备用方案）：
```typescript
// @ts-expect-error file-saver 缺少部分类型
import { saveAs } from 'file-saver'
```

如果 `npm install` 后类型已存在，则无需此改动。

#### 步骤 3：修复 `app/gif/page.tsx` 第 5、6 行

**改前**：
```typescript
import { saveAs } from 'file-saver'
import gifshot from 'gifshot'
```

**改后**：
```typescript
// @ts-expect-error file-saver 缺少部分类型
import { saveAs } from 'file-saver'
// @ts-expect-error gifshot 缺少类型
import gifshot from 'gifshot'
```

#### 步骤 4：修复 `app/gif/page.tsx` 第 463、466 行的隐式 any

**改前**（大致位置，需用 Read 工具确认）：
```typescript
gifshot.createGIF({...}, (obj) => {
  if (obj.progress) { ... }
})
```

**改后**：
```typescript
gifshot.createGIF({...}, (obj: any) => {
  const progress: number = (obj as any).progress
  if (progress) { ... }
})
```

> **注意**：必须先用 Read 工具打开文件确认实际代码，不要凭推测修改。

#### 步骤 5：修复 `app/gif/page.tsx` 第 567、703、818 行的 framer-motion 类型错误

**改前**（示例）：
```typescript
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }  // ❌ number[] 不被识别
  }
}
```

**改后**（3 种方案任选一种）：

**方案 A（推荐）** - 用 `as const`：
```typescript
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }
  }
} as const
```

**方案 B** - 加 `Variants` 类型导入：
```typescript
import type { Variants } from 'framer-motion'

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
  }
}
```

**方案 C** - 字符串 easing：
```typescript
transition: { duration: 0.5, ease: 'easeOut' as const }
```

**注意**：第 567、703、818 行可能略有差异，**统一用方案 A 简单**。

#### 步骤 6：修复 `app/pdf/page.tsx` 第 189 行

**改前**（示例）：
```typescript
pdfDoc.getPage(1).then((page) => {
  // ...
  page.render(...).then((canvas) => {
    canvas.toBlob((blob) => {  // ❌ BlobCallback 类型不匹配
      // ...
    })
  })
})
```

**改后**：
```typescript
page.render(...).then((canvas) => {
  canvas.toBlob((blob: Blob | null) => {
    if (blob) {
      // ...
    }
  })
})
```

或用类型断言：
```typescript
canvas.toBlob((blob) => {
  // ...
}, 'image/png')
```

### 验证步骤

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

**期望输出**：无 `app/fenge`、`app/gif`、`app/pdf` 相关错误。

然后跑完整 build：
```bash
npm run build
```

**期望**：`✓ Compiled successfully` 或仅有 warnings。

### 提交格式

```bash
git add -A
git commit -m "fix: 修复 3 个 TypeScript 编译错误 (gif/fenge/pdf)

- 添加 @types/file-saver 和 @types/gifshot
- 为 file-saver 和 gifshot 添加 @ts-expect-error
- 修复 framer-motion ease 数组类型不匹配
- 修复 PDF BlobCallback 类型

修复 #P0-1"
```

---

## 🔴 P0-2：修复 ChatGPT 价格显示异常

### 问题描述

首页 [ModelCard](file:///d:/my-web-app/xiaoma-AI-net-main/xiaomaai.net/components/ModelCard.tsx) 显示 ChatGPT 价格异常：

| 工具 | 当前显示（错误） | 期望显示 |
|---|---|---|
| **ChatGPT** | 输入 ¥216/M, 输出 ¥1296/M | 输入 ¥36/M, 输出 ¥216/M |
| Cursor | 输入 ¥1.1/M, 输出 ¥4.3/M | 输入 ¥36/M, 输出 ¥216/M（gpt-5.5） |

**根因**：

1. OpenRouter 数据源把 `'gpt-5'` slug 错误标为 ¥216/¥1296/M（实际是 gpt-5.5-pro 价格）
2. `toolDefaultModel.chatgpt` 优先级回退列表第一个有效项就是 `gpt-5`
3. `gpt-5.5` 不在 OpenRouter 数据中（只有 `gpt-5`、`gpt-5-mini` 等）

### 涉及文件

- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\scripts\sync-pricing.mjs`（line 27-200，含 `MODELS_TO_KEEP`）
- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\data\modelPricing.ts`（`toolDefaultModel` 对象，line 100-138）

### 修复方案：添加 Manual Override 表

#### 步骤 1：在 `scripts/sync-pricing.mjs` 中找到 `MODELS_TO_KEEP` 数组

打开 `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\scripts\sync-pricing.mjs`，在第 22 行后插入：

```javascript
// 手动覆盖价格表（用于 OpenRouter 数据错误或不准确的情况）
// 键：模型 slug，值：完整 ModelPricing 对象
// 同步时会优先使用这里的定义
const PRICE_OVERRIDES = {
  'gpt-5.5': {
    slug: 'gpt-5.5',
    inputYuan: 36,
    outputYuan: 216,
    contextWindow: 1050000,
    note: '最新旗舰 (2026-04)',
    cachedInputYuan: 3.6,
  },
  'gpt-5.5-pro': {
    slug: 'gpt-5.5-pro',
    inputYuan: 216,
    outputYuan: 1296,
    contextWindow: 1050000,
    note: '顶配',
  },
  'gpt-5.4': {
    slug: 'gpt-5.4',
    inputYuan: 18,
    outputYuan: 108,
    contextWindow: 1050000,
    note: '次新旗舰',
    cachedInputYuan: 1.8,
  },
  'claude-opus-4.8': {
    slug: 'claude-opus-4.8',
    inputYuan: 144,
    outputYuan: 720,
    contextWindow: 1000000,
    note: '最新顶配 (2026)',
    cachedInputYuan: 14,
    cachedOutputYuan: 180,
  },
  'claude-sonnet-5': {
    slug: 'claude-sonnet-5',
    inputYuan: 14,
    outputYuan: 72,
    contextWindow: 1000000,
    note: '最新旗舰',
    cachedInputYuan: 1.4,
    cachedOutputYuan: 18,
  },
  'deepseek-v4-pro': {
    slug: 'deepseek-v4-pro',
    inputYuan: 3.1,
    outputYuan: 6.3,
    contextWindow: 1000000,
    note: '国产最新 Pro (2026)',
  },
  'kimi-k2.6': {
    slug: 'kimi-k2.6',
    inputYuan: 6.8,
    outputYuan: 29,
    contextWindow: 262144,
    note: '最新 K2.6 (2026)',
  },
  'gemini-3.1-pro': {
    slug: 'gemini-3.1-pro',
    inputYuan: 14,
    outputYuan: 86,
    contextWindow: 1048576,
    note: 'Pro 旗舰',
    cachedInputYuan: 1.4,
  },
  'grok-4': {
    slug: 'grok-4',
    inputYuan: 22,
    outputYuan: 108,
    contextWindow: 256000,
    note: '最新',
    cachedInputYuan: 1.4,
  },
  'qwen3-max': {
    slug: 'qwen3-max',
    inputYuan: 12,
    outputYuan: 46,
    contextWindow: 262144,
    note: '最新 Max (2026)',
  },
}
```

#### 步骤 2：找到 `newPricing` 构建逻辑（应在第 230 行附近）

搜索 `newPricing` 关键字，找到类似：
```javascript
const newPricing = {}
// 合并 litellm + openrouter 数据...
```

在合并完成后、写入文件前（约第 240 行），**手动 override 优先**：

```javascript
// 应用手动覆盖（优先级最高）
for (const [slug, override] of Object.entries(PRICE_OVERRIDES)) {
  newPricing[slug] = override
}
```

#### 步骤 3：验证同步脚本

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net
node scripts/sync-pricing.mjs
```

检查 `data/modelPricing.ts` 中：
```bash
grep -A 1 "'gpt-5.5':" data/modelPricing.ts
```

**期望**：
```typescript
'gpt-5.5':           { slug: 'gpt-5.5', inputYuan: 36, outputYuan: 216, ... },
```

#### 步骤 4：复制 sync-meta.json

```bash
cp data-source-cache/sync-meta.json public/sync-meta.json
```

#### 步骤 5：启动 dev server 验证

```bash
npm run dev
```

打开 `http://127.0.0.1:3000/` 检查 ChatGPT 卡片应显示 ¥36/¥216。

### 提交格式

```bash
git add -A
git commit -m "fix(pricing): 添加 manual override 修复 ChatGPT 价格异常

OpenRouter 数据把 'gpt-5' 错误标为 gpt-5.5-pro 价格。
新增 PRICE_OVERRIDES 表，sync 时优先使用。
覆盖模型：GPT-5.5/5.5-pro/5.4, Claude Sonnet 5/Opus 4.8,
Gemini 3.1 Pro, DeepSeek V4 Pro, Kimi K2.6, Grok 4, Qwen3-Max。

修复 #P0-2"
```

---

## 🔴 P0-3：验证 GitHub Actions 自动化

### 问题描述

我创建了 [`.github/workflows/sync-prices.yml`](file:///d:/my-web-app/xiaoma-AI-net-main/xiaomaai.net/.github/workflows/sync-prices.yml) 但**未实际 push**，从没在 GitHub 上跑过。

### 风险

- YAML 语法可能错
- cron 时区（UTC 18:00 = 北京凌晨 2:00）可能错
- `GITHUB_TOKEN` 权限不足
- `actions/checkout@v4` + `fetch-depth: 0` + commit + push 流程未验证

### 涉及文件

- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\.github\workflows\sync-prices.yml`

### 执行步骤

#### 步骤 1：先 commit + push 当前所有改动

```bash
cd d:\my-web-app\xiaoma-AI-net-main
git add xiaomaai.net/
git commit -m "feat: 完整改造 - 价格同步、画布、UI 优化

- 添加 GitHub Actions 自动同步工作流
- 添加过时检测脚本
- 添加 DataFreshness 数据新鲜度组件
- 修复 3 个 TypeScript 编译错误
- 添加 PRICE_OVERRIDES 修复 ChatGPT 价格异常
- 更新 20+ 篇文章模型版本到 2026-07-04 最新

详见 CC_TASKS.md"
git push origin main
```

> **重要**：如果当前 git 状态已有未提交改动，需要先 `git status` 确认。

#### 步骤 2：手动触发 Actions

1. 打开 GitHub 仓库页面
2. 点击 "Actions" Tab
3. 左侧选 "Sync Model Prices"
4. 右侧点 "Run workflow" → "Run workflow"

#### 步骤 3：查看运行日志

确认以下步骤全部成功：
- ✅ Checkout
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Fetch pricing sources
- ✅ Generate modelPricing.ts
- ✅ Detect outdated content
- ✅ Check for changes
- ✅ Commit and push（有变更时）
- ✅ Upload artifacts

#### 步骤 4：常见错误排查

| 错误 | 原因 | 修复 |
|---|---|---|
| `npm ci` 失败 | lockfile 与 package.json 不一致 | 跑 `npm install` 后重新 commit |
| `GITHUB_TOKEN` 无 push 权限 | 仓库设置禁止 | Settings → Actions → 启用 "Read and write permissions" |
| cron 表达式错 | 格式问题 | 改用 `UTC 18:00`（北京时间凌晨 2:00）|
| `actions/checkout@v4` 缺 token | 默认 `GITHUB_TOKEN` 权限不足 | 显式加 `token: ${{ secrets.GITHUB_TOKEN }}`（已加）|

#### 步骤 5：等待定时执行

第一次手动成功后，**第二天凌晨 2:00** 验证定时执行是否自动跑。

### 提交格式

```bash
git add .github/
git commit -m "ci: 验证 GitHub Actions 自动同步

手动触发 workflow_dispatch 成功，
定时任务等待明天凌晨 2:00 自动验证。

修复 #P0-3"
```

---

## 🟡 P1-1：清理 public/ 旧版静态文件

### 问题描述

[public/](file:///d:/my-web-app/xiaoma-AI-net-main/xiaomaai.net/public/) 目录有 3 个旧版入口文件：
- `old-home.html`
- `old-manage.html`
- `manage-links.html`

**风险**：
- 会被搜索引擎收录，损害 SEO
- 用户可能误访问
- 占空间

### 执行步骤

#### 步骤 1：确认文件用途

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net
grep -r "old-home\|old-manage\|manage-links" public/ app/ --include="*.tsx" --include="*.ts" --include="*.html" 2>&1 | head -20
```

如果**没有任何代码引用**这 3 个文件，则可安全删除。

#### 步骤 2：备份（可选）

```bash
mkdir -p ../archive-public
cp public/old-home.html public/old-manage.html public/manage-links.html ../archive-public/
```

#### 步骤 3：删除

```bash
rm public/old-home.html public/old-manage.html public/manage-links.html
```

#### 步骤 4：验证 Next.js 仍正常 build

```bash
npm run build
```

### 提交格式

```bash
git add -A
git commit -m "chore: 清理 public/ 旧版静态入口

删除 3 个无人引用的旧版 HTML：
- old-home.html
- old-manage.html
- manage-links.html

修复 #P1-1"
```

---

## 🟡 P1-2：修复首页分类计数首屏闪动

### 问题描述

打开 `http://127.0.0.1:3000/` 会先看到"全部 0"再变成"全部 440"，明显跳变。

### 涉及文件

- `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\app\page.tsx`

### 修复方案

打开 `app/page.tsx`，搜索 `AI 对话 0` 或 `0` 字样，找到分类计数渲染处。

**改前**（示例）：
```tsx
const [counts, setCounts] = useState({ all: 0, chat: 0, ... })

<button>全部 {counts.all}</button>
```

**改后**（SSR 时直接计算）：
```tsx
import { tools } from '@/data/tools'

const counts = {
  all: tools.length,
  chat: tools.filter(t => t.category === 'chat').length,
  image: tools.filter(t => t.category === 'image').length,
  // ...
}

<button>全部 {counts.all}</button>
```

### 验证

```bash
npm run dev
# 打开 http://127.0.0.1:3000/ 查看
```

应该直接看到 "全部 440"，无闪动。

### 提交格式

```bash
git commit -am "fix: 修复首页分类计数首屏闪动

把 useState 改为直接 SSR 计算，
避免 hydration 时数字跳变。

修复 #P1-2"
```

---

## 🟡 P1-3：DataFreshness 组件走 SSR

### 问题描述

[components/DataFreshness.tsx](file:///d:/my-web-app/xiaoma-AI-net-main/xiaomaai.net/components/DataFreshness.tsx) 用 `useEffect` + `fetch('/sync-meta.json')`，**先显示"加载中..."再显示日期**。

### 修复方案

#### 步骤 1：读取当前 DataFreshness 组件

打开 `d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net\components\DataFreshness.tsx`。

#### 步骤 2：把 fetch 改为 server-side 读取

在 `app/page.tsx` 中（server component）直接读文件：

```tsx
// app/page.tsx
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// 在 server component 中读取
function getSyncMeta() {
  try {
    const path = join(process.cwd(), 'data-source-cache', 'sync-meta.json')
    const content = readFileSync(path, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export default function Home() {
  const syncMeta = getSyncMeta()
  return (
    // ...
    <DataFreshness meta={syncMeta} variant="badge" />
    // ...
  )
}
```

#### 步骤 3：修改 DataFreshness 组件

把 `useEffect` + `fetch` 那段逻辑改为：

```tsx
export function DataFreshness({ meta: metaProp, variant = 'badge' }: ...) {
  const [meta, setMeta] = useState<SyncMeta | null>(metaProp ?? null)
  // 不再 useEffect fetch，直接用 server 传入的 meta
  // 保留 null 兜底逻辑
  if (!meta) {
    return <span>数据源未配置</span>
  }
  // ...
}
```

#### 验证

打开页面应**直接显示日期**（如 "2026-07-06 同步"），无"加载中..."。

### 提交格式

```bash
git commit -am "perf: DataFreshness 组件走 SSR

避免 hydration 闪动，
首屏直接显示同步日期。

修复 #P1-3"
```

---

## 🟢 P2-1：时效检测接入 pre-commit

### 问题描述

[scripts/check-outdated.mjs](file:///d:/my-web-app/xiaoma-AI-net-main/xiaomaai.net/scripts/check-outdated.mjs) 写好了但没接到 git hook。

### 执行步骤

#### 步骤 1：安装 husky + lint-staged

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net
npm install --save-dev husky lint-staged
npx husky init
```

#### 步骤 2：配置 package.json

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,md}": [
      "node scripts/check-outdated.mjs --strict"
    ]
  }
}
```

#### 步骤 3：创建 pre-commit hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

#### 步骤 4：测试

故意在某文件加一个 `GPT-4o` 引用，然后 `git commit`：

```bash
echo "测试 GPT-4o 引用" >> app/page.tsx
git add app/page.tsx
git commit -m "test"
```

**期望**：commit 失败，提示"发现过时引用"。

### 提交格式

```bash
git add -A
git commit -m "chore: 接入 husky + lint-staged 自动化检测过时内容

pre-commit 时自动跑 check-outdated.mjs，
发现高严重度引用则阻止 commit。

修复 #P2-1"
```

---

## 🟢 P2-2：提取环境配置到 `config/site.ts`

### 问题描述

多个文件硬编码站点信息：
- `.github/workflows/sync-prices.yml` - `working-directory: xiaomaai.net`
- `postbuild.js` - 可能硬编码路径
- `next.config.mjs` - 可能有硬编码 URL

### 执行步骤

#### 步骤 1：创建 `config/site.ts`

```typescript
// config/site.ts
export const SITE_CONFIG = {
  name: '小马 AI 工具中心',
  shortName: '小马 AI',
  domain: 'xiaomaai.net',
  url: 'https://xiaomaai.net',
  apiBase: process.env.NEXT_PUBLIC_API_BASE || 'https://api.xiaomaai.net',
  // 路径配置
  paths: {
    root: 'xiaomaai.net',  // monorepo 子目录
    public: 'public',
    data: 'data',
    dataSourceCache: 'data-source-cache',
  },
  // 同步配置
  sync: {
    cron: '0 18 * * *',     // UTC 18:00 = 北京凌晨 2:00
    exchangeRateUSDToCNY: 7.2,
  },
} as const
```

#### 步骤 2：替换硬编码

- `.github/workflows/sync-prices.yml`: 把 `working-directory: xiaomaai.net` 改为 `${SITE_CONFIG.paths.root}`（但 GitHub Actions 读不到 TS 文件，需用 env）
- 建议用 `.env` 文件 + `process.env.SITE_ROOT_PATH`

#### 步骤 3：更新引用

```bash
# 找出所有硬编码路径
grep -rn "xiaomaai.net" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.yml" .
```

### 提交格式

```bash
git add -A
git commit -m "refactor: 提取 SITE_CONFIG 统一管理环境配置

创建 config/site.ts 作为单一信息源，
消除硬编码路径/URL。

修复 #P2-2"
```

---

## 📋 CC 执行检查清单

```markdown
## P0（必须先做，阻塞生产）
- [ ] P0-1: 修复 3 个 TypeScript 编译错误
- [ ] P0-2: 修复 ChatGPT 价格显示异常（添加 PRICE_OVERRIDES）
- [ ] P0-3: 验证 GitHub Actions 自动化跑通

## P1（本月内）
- [ ] P1-1: 清理 public/ 旧版静态文件
- [ ] P1-2: 修复首页分类计数首屏闪动
- [ ] P1-3: DataFreshness 组件走 SSR

## P2（可后置）
- [ ] P2-1: 时效检测接入 pre-commit
- [ ] P2-2: 提取环境配置到 config/site.ts
```

## 🧪 完整验证流程（全部完成后）

```bash
cd d:\my-web-app\xiaoma-AI-net-main\xiaomaai.net

# 1. 类型检查
npx tsc --noEmit

# 2. 完整 build
npm run build

# 3. 跑测试
npm run sync:check

# 4. 启动 dev server
npm run dev

# 5. 浏览器检查
# 打开 http://127.0.0.1:3000/
# 验证：
# - 全部 440（无 0 闪动）
# - ChatGPT ¥36/¥216（M）
# - Claude ¥14/¥72（M）
# - DataFreshness 显示日期（无加载中）
# - /sync-meta.json 可访问
```

## 📞 联系与回滚

- **每个任务独立 commit**，失败可单独 revert
- **所有改动应在 feature branch**，不要直接 push main
- **遇到错误**：先 `git stash` 暂存，再排查

---

**最后更新**：2026-07-06
**总预计时间**：P0 共 1.5-2 小时 / P1+P2 共 2-3 小时
**完成后**：build 通过 + 自动化跑通 + 价格显示正确 + 首屏无闪动
