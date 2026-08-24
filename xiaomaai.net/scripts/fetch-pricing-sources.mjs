#!/usr/bin/env node
// 下载 LiteLLM 全量价格 JSON + OpenRouter /models
// 用于离线生成 modelPricing.ts
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data-source-cache')
mkdirSync(DATA_DIR, { recursive: true })

const SOURCES = [
  {
    name: 'litellm',
    url: 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
    file: 'litellm-prices.json',
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/models',
    file: 'openrouter-models.json',
  },
]

async function fetchOne({ name, url, file }) {
  const MAX_RETRY = 5
  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      console.log(`[${name}] fetching ${url} (attempt ${i + 1}/${MAX_RETRY})`)
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'xiaomaai-net-sync/1.0' } })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const dest = join(DATA_DIR, file)
      writeFileSync(dest, text, 'utf8')
      console.log(`[${name}] saved ${text.length.toLocaleString()} bytes → ${dest}`)
      return { name, size: text.length, ok: true }
    } catch (e) {
      console.warn(`[${name}] attempt ${i + 1} failed: ${e.message}`)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
  return { name, ok: false }
}

const results = await Promise.all(SOURCES.map(fetchOne))
console.log('\n=== Summary ===')
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.size ? ` (${r.size.toLocaleString()} bytes)` : ''}`)
}
process.exit(results.every(r => r.ok) ? 0 : 1)
