import { readFileSync } from 'fs'
const raw = readFileSync('data/tools-draft.ts', 'utf-8')
const marker = 'export const toolDrafts: ToolDraft[] = ['
const start = raw.indexOf(marker)
const arrStart = start + marker.length
let depth = 1, inStr = false, closeAt = -1
for (let i = arrStart; i < raw.length; i++) {
  const c = raw[i]
  if (inStr) {
    if (c === '\\') { i++; continue }
    if (c === '"') inStr = false
    continue
  }
  if (c === '"') { inStr = true; continue }
  if (c === '[') depth++
  else if (c === ']') { depth--; if (depth === 0) { closeAt = i; break } }
}
console.log('arrStart:', arrStart, 'closeAt:', closeAt)
console.log('char at closeAt:', JSON.stringify(raw[closeAt]))
console.log('chars before closeAt:', JSON.stringify(raw.slice(closeAt - 20, closeAt)))
console.log('chars after closeAt:', JSON.stringify(raw.slice(closeAt, closeAt + 30)))
const slice = raw.slice(arrStart - 1, closeAt + 1)
console.log('slice length:', slice.length, 'last char:', JSON.stringify(slice[slice.length - 1]))
try {
  const arr = JSON.parse(slice)
  console.log('parsed ok, count:', arr.length)
} catch (e) {
  console.log('parse err:', e.message)
  console.log('slice tail:', JSON.stringify(slice.slice(-80)))
}
