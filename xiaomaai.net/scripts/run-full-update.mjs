#!/usr/bin/env node
/**
 * run-full-update.mjs
 * 一键执行完整自动化更新流程
 * 用法:
 *   node scripts/run-full-update.mjs                    # 默认各源限20条
 *   node scripts/run-full-update.mjs --limit=50        # 指定抓取上限
 *   node scripts/run-full-update.mjs --skip-import      # 跳过抓取,只做审计
 *   node scripts/run-full-update.mjs --auto-translate   # 自动翻译(需配置API)
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)
const LIMIT = args.limit || '20'
const SKIP_IMPORT = args['skip-import'] === 'true'

console.log('╔══════════════════════════════════════════════════╗')
console.log('║        🚀 一键自动化更新流程启动                  ║')
console.log('╚══════════════════════════════════════════════════╝')
console.log(`参数: --limit=${LIMIT} --skip-import=${SKIP_IMPORT}`)
console.log()

const steps = []
const failed = []

function runStep(name, cmd) {
  console.log(`\n━━━ ${name} ━━━`)
  try {
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] })
    const lines = output.trim().split('\n').slice(-5)
    console.log(lines.join('\n'))
    steps.push({ name, status: 'ok' })
  } catch (e) {
    const errOut = (e.stderr || e.stdout || '').trim().split('\n').slice(-3).join('\n')
    console.warn(`❌ ${name} 失败: ${errOut}`)
    steps.push({ name, status: 'fail', error: errOut })
    failed.push(name)
  }
}

// ========== 阶段1: 工具抓取 ==========
if (!SKIP_IMPORT) {
  console.log('\n📦 阶段1: 工具抓取')
  const importScripts = [
    'import-faxianai.mjs',
    'import-aibase.mjs',
    'import-ai-bot.mjs',
    'import-ai-nav.mjs',
    'import-aitaaft.mjs',
    'import-futurepedia.mjs',
    'import-toolify.mjs',
    'import-awesome-ai-tools.mjs',
  ]
  for (const script of importScripts) {
    runStep(`import ${script}`, `node scripts/${script} --limit=${LIMIT}`)
  }
} else {
  console.log('\n⏭️  跳过工具抓取 (--skip-import)')
}

// ========== 阶段2: 资讯与价格 ==========
console.log('\n📰 阶段2: 资讯与价格同步')
runStep('fetch-news', 'node scripts/fetch-news.mjs')
runStep('sync-pricing', 'node scripts/sync-pricing.mjs')

// ========== 阶段3: 质量审计 ==========
console.log('\n🔍 阶段3: 质量审计')
runStep('audit-tools --draft', 'node scripts/audit-tools.mjs --draft')
runStep('check-outdated', 'node scripts/check-outdated.mjs')

// ========== 汇总 ==========
console.log('\n╔══════════════════════════════════════════════════╗')
console.log('║              📊 更新汇总报告                      ║')
console.log('╚══════════════════════════════════════════════════╝')
for (const s of steps) {
  const icon = s.status === 'ok' ? '✅' : '❌'
  console.log(`${icon} ${s.name}`)
}
console.log(`\n总计: ${steps.length - failed.length} 成功 / ${failed.length} 失败`)

// ========== 输出草稿审计摘要 ==========
const reportPath = path.join(__dirname, 'draft-audit.report.md')
if (existsSync(reportPath)) {
  const report = readFileSync(reportPath, 'utf-8')
  // 提取分类统计行
  const match = report.match(/✅ 可直接入库 \| (\d+)/)
  const match2 = report.match(/🌐 需翻译 \| (\d+)/)
  const match3 = report.match(/✏️ 需重写 \| (\d+)/)
  const match4 = report.match(/❌ 建议丢弃 \| (\d+)/)
  console.log('\n📝 草稿质量:')
  console.log(`  ✅ 可直接入库: ${match?.[1] || '?'} 条`)
  console.log(`  🌐 需翻译: ${match2?.[1] || '?'} 条`)
  console.log(`  ✏️ 需重写: ${match3?.[1] || '?'} 条`)
  console.log(`  ❌ 建议丢弃: ${match4?.[1] || '?'} 条`)
  console.log(`\n📄 完整报告: scripts/draft-audit.report.md`)
  console.log(`   后台审核: /admin/tools`)
}

if (failed.length > 0) {
  console.log(`\n⚠️ 失败步骤: ${failed.join(', ')}`)
  console.log('   请检查网络连接或查看上方日志')
}

console.log('\n✨ 一键更新流程完成')
