'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Share2, Copy, Check, X, Link2 } from 'lucide-react'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
}

// ---- 纯 Canvas 二维码生成器 ----

function generateQRCode(text: string, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // 版本 2 (25x25), L 级纠错
  const N = 25
  const moduleSize = Math.floor(size / (N + 8))
  const offset = 4 * moduleSize

  // 创建矩阵
  const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0))

  // 查找器图案 (7x7)
  function placeFinder(r: number, c: number) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6) matrix[r + i][c + j] = 1
        else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) matrix[r + i][c + j] = 1
      }
    }
    // 分隔符
    for (let i = -1; i <= 7; i++) {
      if (r + i >= 0 && r + i < N) {
        if (c - 1 >= 0) matrix[r + i][c - 1] = 0
        if (c + 7 < N) matrix[r + i][c + 7] = 0
      }
    }
    for (let j = -1; j <= 7; j++) {
      if (c + j >= 0 && c + j < N) {
        if (r - 1 >= 0) matrix[r - 1][c + j] = 0
        if (r + 7 < N) matrix[r + 7][c + j] = 0
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, N - 7)
  placeFinder(N - 7, 0)

  // 时序图案
  for (let i = 8; i < N - 8; i++) {
    matrix[6][i] = (i % 2 === 0) ? 1 : 0
    matrix[i][6] = (i % 2 === 0) ? 1 : 0
  }

  // 对齐图案 (版本 2: 位置 18)
  function placeAlignment(r: number, c: number) {
    if (matrix[r][c] !== 0) return
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const rr = r + i; const cc = c + j
        if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
          if (matrix[rr][cc] === 0) {
            matrix[rr][cc] = (i === -2 || i === 2 || j === -2 || j === 2 || (i === 0 && j === 0)) ? 1 : 0
          }
        }
      }
    }
  }
  placeAlignment(18, 18)

  // 格式信息区域 (保留为 0，后续填充)
  // 暗模块
  matrix[N - 8][8] = 1

  // ---- 数据编码 (字节模式) ----
  const dataBytes: number[] = []
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)

  // 字节模式指示符: 0100
  // 字符计数: 版本 2 字节模式用 8 位
  const charCount = textBytes.length
  if (charCount > 255) {
    // 数据太长，截断到 255 字节
    const truncated = text.slice(0, Math.floor(255 * 0.8))
    const truncatedBytes = encoder.encode(truncated)
    dataBytes.push(...truncatedBytes)
  } else {
    dataBytes.push(...textBytes)
  }

  const actualCount = Math.min(dataBytes.length, 255)
  // 模式指示符 0100 (4 bits) + 计数 (8 bits) = 12 bits
  let bits = ''
  bits += '0100'
  bits += actualCount.toString(2).padStart(8, '0')

  for (let i = 0; i < actualCount; i++) {
    bits += dataBytes[i].toString(2).padStart(8, '0')
  }

  // 终止符 (最多 4 个 0)
  const terminatorLen = Math.min(4, 22 * 8 - bits.length)
  bits += '0'.repeat(Math.max(0, terminatorLen))

  // 补齐到 8 的倍数
  while (bits.length % 8 !== 0) bits += '0'

  // 填充字节
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (bits.length < 22 * 8) {
    bits += padBytes[padIdx % 2].toString(2).padStart(8, '0')
    padIdx++
  }

  bits = bits.slice(0, 22 * 8)

  // 将数据位放置到矩阵中 (从右下角开始，向上蛇形)
  let bitIdx = 0
  let goingUp = true
  let col = N - 1

  while (col >= 0) {
    if (col === 6) col-- // 跳过时序图案列
    if (col < 0) break

    if (goingUp) {
      for (let row = N - 1; row >= 0; row--) {
        for (let c = col; c >= col - 1 && c >= 0; c--) {
          if (matrix[row][c] === 0 && c !== 6) {
            if (bitIdx < bits.length) {
              matrix[row][c] = parseInt(bits[bitIdx])
              bitIdx++
            }
          }
        }
      }
    } else {
      for (let row = 0; row < N; row++) {
        for (let c = col; c >= col - 1 && c >= 0; c--) {
          if (matrix[row][c] === 0 && c !== 6) {
            if (bitIdx < bits.length) {
              matrix[row][c] = parseInt(bits[bitIdx])
              bitIdx++
            }
          }
        }
      }
    }
    goingUp = !goingUp
    col -= 2
  }

  // 掩码: 模式 0 (row + col) % 2 === 0
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] >= 0 && (r + c) % 2 === 0) {
        // 跳过功能图案区域
        const isFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= N - 8) || (r >= N - 8 && c <= 8)
        const isTiming = r === 6 || c === 6
        if (!isFinder && !isTiming) {
          matrix[r][c] = matrix[r][c] === 0 ? 1 : 0
        }
      }
    }
  }

  // ---- 绘制 ----
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#000000'
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(
          offset + c * moduleSize,
          offset + r * moduleSize,
          moduleSize,
          moduleSize
        )
      }
    }
  }

  return canvas
}

// ---- 组件 ----

export default function ShareButton({ url, title, description }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wechatOpen, setWechatOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const encodedUrl = typeof window !== 'undefined' ? encodeURIComponent(url) : ''
  const encodedTitle = typeof window !== 'undefined' ? encodeURIComponent(title) : ''

  // 点击外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
        setWechatOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // 生成二维码
  useEffect(() => {
    if (wechatOpen && canvasRef.current) {
      const qrCanvas = generateQRCode(url, 200)
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        canvasRef.current.width = 200
        canvasRef.current.height = 200
        ctx.drawImage(qrCanvas, 0, 0)
      }
    }
  }, [wechatOpen, url])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWeibo = () => {
    const shareUrl = `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`
    window.open(shareUrl, '_blank', 'width=600,height=500')
  }

  const handleTwitter = () => {
    const text = description ? `${title} - ${description}` : title
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition hover:border-ink-900 hover:text-ink-900"
      >
        <Share2 className="h-3.5 w-3.5" />
        分享
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md border border-ink-100 bg-white p-2 shadow-lg z-50">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-ink-500">分享到</span>
            <button
              onClick={() => { setOpen(false); setWechatOpen(false) }}
              aria-label="关闭分享面板"
              className="text-ink-400 hover:text-ink-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 复制链接 */}
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-ink-100 bg-ink-50">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4 text-ink-500" />}
            </span>
            <span className="flex-1 text-left">{copied ? '已复制链接' : '复制链接'}</span>
          </button>

          {/* 微信 */}
          <button
            onClick={() => setWechatOpen(!wechatOpen)}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-ink-100 bg-green-50">
              <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm2.814 3.935c-2.826 0-5.117 2.115-5.117 4.724 0 2.61 2.29 4.724 5.117 4.724.418 0 .823-.04 1.221-.117a.548.548 0 0 1 .394.058l1.331.779a.22.22 0 0 0 .114.037c.111 0 .2-.09.2-.2a.278.278 0 0 0-.033-.145l-.273-1.035a.414.414 0 0 1 .146-.464c1.253-.942 2.017-2.26 2.017-3.637 0-2.61-2.29-4.724-5.117-4.724zm-2.421 2.714c.444 0 .804.364.804.813 0 .45-.36.814-.804.814-.445 0-.804-.365-.804-.814 0-.45.36-.813.804-.813zm4.84 0c.445 0 .804.364.804.813 0 .45-.36.814-.804.814-.444 0-.804-.365-.804-.814 0-.45.36-.813.804-.813z"/>
              </svg>
            </span>
            <span className="flex-1 text-left">微信</span>
            <svg className="h-3 w-3 text-ink-400 transition-transform" style={{ transform: wechatOpen ? 'rotate(180deg)' : '' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 微信二维码弹窗 */}
          {wechatOpen && (
            <div className="mt-1 rounded border border-ink-100 bg-ink-50 p-3 text-center">
              <p className="mb-2 text-xs text-ink-500">微信扫一扫分享</p>
              <div ref={qrRef} className="mx-auto inline-block rounded border border-ink-100 bg-white p-1">
                <canvas ref={canvasRef} width={200} height={200} className="block" />
              </div>
            </div>
          )}

          <div className="my-1 border-t border-ink-100" />

          {/* 微博 */}
          <button
            onClick={handleWeibo}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-ink-100 bg-red-50">
              <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zm-2.172-8.446c-1.452.18-2.323.878-2.023 1.615.3.737 1.575 1.202 2.898 1.044 1.323-.158 2.194-.855 1.893-1.592-.3-.736-1.575-1.202-2.898-1.044.07-.018.087-.03.13-.023zm.84 3.413c-.33.162-.708.19-.848.066-.14-.125-.092-.379.098-.587.19-.208.487-.341.817-.303.33.038.428.232.288.487-.14.255-.487.393-.697.293.076-.018.246-.032.342.044zm4.563-5.388c-1.338.141-2.693.702-3.465 1.598-.771.896-1.155 2.011-.995 2.916.16.905.921 1.512 1.992 1.706 1.07.194 2.208-.309 2.99-1.215.782-.906 1.166-2.035.998-2.915-.168-.88-.93-1.497-2.001-1.706.076-.018.295-.046.479.038zm.56 2.878c-.44.694-1.092 1.095-1.457.895-.365-.2-.305-.917.135-1.611.44-.694 1.092-1.095 1.457-.895.365.2.305.917-.135 1.611zm5.367-6.691c-.156-.314-.594-.452-.984-.308-.39.144-.58.528-.424.842.156.314.594.452.984.308.39-.144.58-.528.424-.842zm-.424 2.508c-.156-.314-.594-.452-.984-.308-.39.144-.58.528-.424.842.156.314.594.452.984.308.39-.144.58-.528.424-.842z"/>
              </svg>
            </span>
            <span className="flex-1 text-left">微博</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleTwitter}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-ink-100 bg-ink-50">
              <svg className="h-4 w-4 text-ink-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            <span className="flex-1 text-left">Twitter / X</span>
          </button>
        </div>
      )}
    </div>
  )
}