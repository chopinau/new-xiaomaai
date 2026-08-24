#!/usr/bin/env node
// 扫描项目源码中的过时模型引用
// 用法：
//   node scripts/check-outdated.mjs                    # 人类可读输出
//   node scripts/check-outdated.mjs --output=json      # JSON 输出
//   node scripts/check-outdated.mjs --output=github    # GitHub Actions 警告格式
//   node scripts/check-outdated.mjs --strict           # 任何发现都返回非零退出码
//
// 检测范围：app/、components/、data/articles.ts、CANVAS_USER_GUIDE.md
// 白名单：data/modelPricing.ts（合法保留旧版模型作为降级选项）、data/tools.ts（第三方工具条目）
// 退出码：0 = 无问题；1 = 发现高严重度问题；2 = 仅低严重度问题

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const args = new Set(process.argv.slice(2))
const OUTPUT = args.has('--output=json') ? 'json' : args.has('--output=github') ? 'github' : 'human'
const STRICT = args.has('--strict')

// ====== 过时模式定义 ======
// severity: 'high' = 必须修 | 'medium' = 建议修 | 'low' = 边缘案例
// 排序：按"严重度"和"出现频率"预估
const PATTERNS = [
  // ===== 高严重度：用户最常看到的过时模型 =====
  { pattern: /\bGPT-?4o\b(?!\s*mini)/g, replacement: 'GPT-5.5', severity: 'high', note: 'GPT-4o 已被 GPT-5.5 替代（2026-04）' },
  { pattern: /\bGPT-?3\.5\b/g, replacement: 'GPT-5.4 mini', severity: 'high', note: 'GPT-3.5 早已退役' },
  { pattern: /\bClaude\s*3\.5\s*Sonnet\b/g, replacement: 'Claude Sonnet 5', severity: 'high', note: 'Claude 3.5 Sonnet 已被 Sonnet 5 替代' },
  { pattern: /\bClaude\s*3\s*Opus\b/g, replacement: 'Claude Opus 4.8', severity: 'high', note: 'Claude 3 Opus 已被 Opus 4.8 替代' },
  { pattern: /\bGemini\s*2\.0\b/g, replacement: 'Gemini 3.5', severity: 'high', note: 'Gemini 2.0 已被 3.5 替代' },
  { pattern: /\bGPT-?4\s*Turbo\b/g, replacement: 'GPT-5.5', severity: 'high', note: 'GPT-4 Turbo 早已退役' },
  { pattern: /\bgpt-4o\b/g, replacement: 'gpt-5.5', severity: 'high', note: 'API slug 需更新' },
  { pattern: /\bclaude-3-5-sonnet-?\d*\b/g, replacement: 'claude-sonnet-5', severity: 'high', note: 'API slug 需更新' },
  { pattern: /\bgemini-2\.?0\b/g, replacement: 'gemini-3.5', severity: 'high', note: 'API slug 需更新' },

  // ===== 中严重度：常见但可能有意保留 =====
  { pattern: /\bGPT-?3\b(?!\.\d)/g, replacement: 'GPT-5.4 mini', severity: 'medium', note: 'GPT-3 基础模型已退役' },
  { pattern: /\bDALL·?E\s*2\b/g, replacement: 'GPT Image 1.5 / Sora 2', severity: 'medium', note: 'DALL·E 2 已被 GPT Image 1.5 替代' },
  { pattern: /\bo1-?preview\b/g, replacement: 'o3 / o3-mini', severity: 'medium', note: 'o1-preview 已被 o3 替代' },
  { pattern: /\bGPT-?4\s*Vision\b/g, replacement: 'GPT-5.5 (multimodal)', severity: 'medium', note: 'GPT-4V 已被 GPT-5.5 多模态替代' },

  // ===== 低严重度：边缘情况，可能合法 =====
  { pattern: /\bClaude\s*3\b(?!\.\d)/g, replacement: 'Claude Sonnet 5', severity: 'low', note: 'Claude 3 已过时，但 Claude 3.5/3.7 等是合法的' },
  { pattern: /\bGemini\s*1\.5\b/g, replacement: 'Gemini 3.5', severity: 'low', note: 'Gemini 1.5 已过时（除非对比历史）' },
]

// 允许保留过时引用的白名单文件/路径
const WHITELIST = [
  'data/modelPricing.ts',          // 合法保留旧版模型作为降级选项
  'data/tools.ts',                 // 第三方工具导入条目
  'data-source-cache/',            // 真实数据源缓存
  'scripts/sync-pricing.mjs',      // 同步脚本内含旧版 slug 兼容
  'scripts/check-outdated.mjs',    // 本脚本自身
  'out/',                          // 构建输出
  'node_modules/',
  '.next/',
  'public/old-home.html',          // 旧版入口
  'public/old-manage.html',
  'public/manage-links.html',      // 旧版管理页面
]

// 扫描的目录
const SCAN_DIRS = ['app', 'components', 'data']
// 扫描的单独文件
const SCAN_FILES = ['CANVAS_USER_GUIDE.md']
// 排除的目录
const EXCLUDE_DIRS = ['node_modules', '.next', 'out', '.git']

// 限制单文件大小（避免误扫描大文件）
const MAX_FILE_SIZE = 500 * 1024  // 500KB

// ====== 工具函数 ======
function isWhitelisted(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/')
  return WHITELIST.some(w => rel === w || rel.startsWith(w))
}

function walkDir(dir, files = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch (e) {
    return files  // 目录不存在
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    if (EXCLUDE_DIRS.includes(entry)) continue
    let stat
    try {
      stat = statSync(fullPath)
    } catch (e) {
      continue
    }
    if (stat.isDirectory()) {
      walkDir(fullPath, files)
    } else if (stat.isFile() && stat.size <= MAX_FILE_SIZE) {
      const ext = extname(entry).toLowerCase()
      // 只扫描文本文件
      if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.md', '.mdx', '.html'].includes(ext)) {
        files.push(fullPath)
      }
    }
  }
  return files
}

function findOutdated(content, filePath) {
  const findings = []
  for (const { pattern, replacement, severity, note } of PATTERNS) {
    // 重置 regex 的 lastIndex
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length
      const lineStart = content.lastIndexOf('\n', match.index - 1) + 1
      const lineEnd = content.indexOf('\n', match.index)
      const lineContent = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim()

      // 跳过纯注释行（除非是 TODO 注释）
      if (lineContent.startsWith('//') || lineContent.startsWith('*') || lineContent.startsWith('/*')) {
        // 例外：注释里明确说要更新
        if (!lineContent.includes('TODO') && !lineContent.includes('FIXME') && !lineContent.includes('更新')) {
          continue
        }
      }

      findings.push({
        file: relative(ROOT, filePath).replace(/\\/g, '/'),
        line: lineNum,
        match: match[0],
        replacement,
        severity,
        note,
        context: lineContent.length > 100 ? lineContent.slice(0, 100) + '...' : lineContent,
      })
    }
  }
  return findings
}

// ====== 主流程 ======
const allFiles = []
for (const dir of SCAN_DIRS) {
  walkDir(join(ROOT, dir), allFiles)
}
for (const file of SCAN_FILES) {
  const fullPath = join(ROOT, file)
  try {
    if (statSync(fullPath).isFile() && statSync(fullPath).size <= MAX_FILE_SIZE) {
      allFiles.push(fullPath)
    }
  } catch (e) {
    // 文件不存在
  }
}

const allFindings = []
for (const file of allFiles) {
  if (isWhitelisted(file)) continue
  const content = readFileSync(file, 'utf8')
  const findings = findOutdated(content, file)
  allFindings.push(...findings)
}

// 按严重度排序：high > medium > low
const severityOrder = { high: 0, medium: 1, low: 2 }
allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

// ====== 输出 ======
if (OUTPUT === 'json') {
  console.log(JSON.stringify({
    scannedFiles: allFiles.length,
    totalFindings: allFindings.length,
    bySeverity: {
      high: allFindings.filter(f => f.severity === 'high').length,
      medium: allFindings.filter(f => f.severity === 'medium').length,
      low: allFindings.filter(f => f.severity === 'low').length,
    },
    findings: allFindings,
  }, null, 2))
} else if (OUTPUT === 'github') {
  if (allFindings.length === 0) {
    console.log('✅ 未发现过时引用')
  } else {
    console.log(`::group::发现 ${allFindings.length} 个过时引用`)
    for (const f of allFindings) {
      const icon = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '⚪'
      console.log(`${icon} [${f.severity}] ${f.file}:${f.line}`)
      console.log(`   匹配: "${f.match}" → 建议: "${f.replacement}"`)
      console.log(`   说明: ${f.note}`)
    }
    console.log('::endgroup::')
  }
} else {
  // 人类可读
  console.log(`\n🔍 扫描了 ${allFiles.length} 个文件`)
  console.log(`📊 发现 ${allFindings.length} 个过时引用\n`)

  if (allFindings.length === 0) {
    console.log('✅ 太棒了！所有内容都是最新的。\n')
  } else {
    const bySeverity = {
      high: allFindings.filter(f => f.severity === 'high'),
      medium: allFindings.filter(f => f.severity === 'medium'),
      low: allFindings.filter(f => f.severity === 'low'),
    }

    if (bySeverity.high.length > 0) {
      console.log(`🔴 高严重度（必须修）: ${bySeverity.high.length} 个`)
      for (const f of bySeverity.high) {
        console.log(`   ${f.file}:${f.line}`)
        console.log(`   "${f.match}" → 建议替换为 "${f.replacement}"`)
        console.log(`   ${f.note}`)
        console.log()
      }
    }

    if (bySeverity.medium.length > 0) {
      console.log(`🟡 中严重度（建议修）: ${bySeverity.medium.length} 个`)
      for (const f of bySeverity.medium.slice(0, 5)) {
        console.log(`   ${f.file}:${f.line}: "${f.match}"`)
      }
      if (bySeverity.medium.length > 5) {
        console.log(`   ... 还有 ${bySeverity.medium.length - 5} 个`)
      }
      console.log()
    }

    if (bySeverity.low.length > 0) {
      console.log(`⚪ 低严重度（边缘情况）: ${bySeverity.low.length} 个`)
      for (const f of bySeverity.low.slice(0, 3)) {
        console.log(`   ${f.file}:${f.line}: "${f.match}"`)
      }
      if (bySeverity.low.length > 3) {
        console.log(`   ... 还有 ${bySeverity.low.length - 3} 个`)
      }
      console.log()
    }
  }
}

// ====== 退出码 ======
const hasHigh = allFindings.some(f => f.severity === 'high')
const hasAny = allFindings.length > 0
if (STRICT && hasAny) {
  process.exit(1)
} else if (hasHigh) {
  process.exit(1)
} else {
  process.exit(0)
}
