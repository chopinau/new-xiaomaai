/**
 * _browser-headers.mjs
 * 共享浏览器级请求头,所有 import 脚本统一引用
 * 用法: import { browserHeaders, fetchWithRetry } from './_browser-headers.mjs'
 */

// 完整浏览器请求头(模拟 Chrome 124)
export const browserHeaders = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'cache-control': 'no-cache',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
}

// 带重试的 fetch(5次指数退避)
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const merged = {
    ...options,
    headers: { ...browserHeaders, ...(options.headers || {}) },
    redirect: 'follow',
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, { ...merged, signal: controller.signal })
      clearTimeout(timeout)

      if (res.status === 403 || res.status === 429) {
        // 403/429: 等待后重试
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
      }
      return res
    } catch (e) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw e
    }
  }
}
