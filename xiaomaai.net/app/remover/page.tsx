"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, Loader2, Cpu, CheckCircle2, ImageIcon, Home, RefreshCw } from "lucide-react"
import { TopNav } from "@/components/TopNav"

type ProcessStatus = "idle" | "processing" | "done" | "error"

export default function AIBackgroundRemover() {
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle")
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [threshold, setThreshold] = useState(30)

  const removeBackground = useCallback(async (imageUrl: string) => {
    setProcessStatus("processing")
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = imageUrl
      })

      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not found")
      
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context not found")

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      const sampleColor = { r: pixels[0], g: pixels[1], b: pixels[2] }

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        
        const distance = Math.sqrt(
          Math.pow(r - sampleColor.r, 2) +
          Math.pow(g - sampleColor.g, 2) +
          Math.pow(b - sampleColor.b, 2)
        )

        if (distance < threshold) {
          pixels[i + 3] = 0
        } else {
          const alpha = Math.min(255, Math.max(0, (distance - threshold) * 3))
          pixels[i + 3] = alpha
        }
      }

      ctx.putImageData(imageData, 0, 0)
      setProcessedImage(canvas.toDataURL("image/png"))
      setProcessStatus("done")
    } catch (error) {
      console.error("Processing error:", error)
      setProcessStatus("error")
    }
  }, [threshold])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setOriginalImage(url)
      setProcessedImage(null)
      removeBackground(url)
    }
    reader.readAsDataURL(file)
  }, [removeBackground])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setOriginalImage(url)
      setProcessedImage(null)
      removeBackground(url)
    }
    reader.readAsDataURL(file)
  }, [removeBackground])

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    setSliderPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  const handleMouseDown = useCallback(() => setIsDragging(true), [])
  const handleMouseUp = useCallback(() => setIsDragging(false), [])
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (isDragging) handleSliderMove(e.clientX) }, [isDragging, handleSliderMove])
  const handleTouchMove = useCallback((e: React.TouchEvent) => { handleSliderMove(e.touches[0].clientX) }, [handleSliderMove])

  const downloadImage = useCallback(() => {
    if (!processedImage) return
    const link = document.createElement("a")
    link.download = "removed-bg.png"
    link.href = processedImage
    link.click()
  }, [processedImage])

  const retryProcessing = useCallback(() => {
    if (originalImage) {
      setProcessedImage(null)
      removeBackground(originalImage)
    }
  }, [originalImage, removeBackground])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-14">
      <TopNav />
      
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex-1 text-center">
          {processStatus === "processing" && <div className="flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /><span>AI 正在分析...</span></div>}
          {processStatus === "done" && <div className="flex items-center justify-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /><span>处理完成</span></div>}
          {processStatus === "error" && <div className="flex items-center justify-center gap-2 text-sm text-red-400"><span>处理失败</span></div>}
        </div>
      </div>
      <div className="text-center pt-4 mb-6">
        <p className="text-sm text-slate-500">小马科技自研AI提供</p>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400"><Upload className="h-4 w-4" />上传图片</h2>
            <div className={`relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${processStatus !== "processing" ? "border-slate-700 hover:border-purple-500/50 hover:bg-slate-900/50" : "cursor-not-allowed border-slate-800 opacity-50"}`} onClick={() => processStatus !== "processing" && fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={processStatus !== "processing" ? handleDrop : undefined}>
              {originalImage ? (
                <div className="relative h-full w-full p-4">
                  <img src={originalImage} alt="Original" className="h-full max-h-[360px] w-full rounded object-contain" />
                  {processStatus === "processing" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-slate-950/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                        <span className="text-sm text-slate-300">AI 正在分析图像...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="rounded-full bg-slate-800/50 p-6"><ImageIcon className="h-12 w-12 text-slate-600" /></div>
                  <p className="text-lg font-medium text-slate-300">拖拽图片到此处</p>
                  <p className="text-sm text-slate-500">或点击选择文件</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400"><ImageIcon className="h-4 w-4" />抠图效果</h2>
            <div ref={sliderRef} className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
              {processedImage && originalImage ? (
                <>
                  <div className="absolute inset-0"><img src={originalImage} alt="Original" className="h-full w-full object-contain" /></div>
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                    <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3QgZmlsbD0iIzMzMyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzMzMyIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz48cmVjdCBmaWxsPSIjNDQ0IiB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iIzQ0NCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]">
                      <img src={processedImage} alt="Processed" className="h-full w-full object-contain" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 top-0 z-10 w-1 cursor-ew-resize bg-white shadow-lg" style={{ left: `${sliderPosition}%` }} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 shadow-lg">
                      <div className="flex gap-0.5"><div className="h-4 w-0.5 rounded bg-white" /><div className="h-4 w-0.5 rounded bg-white" /></div>
                    </div>
                  </div>
                  <div className="absolute left-4 top-4 rounded bg-slate-900/80 px-2 py-1 text-xs text-slate-400">原图</div>
                  <div className="absolute right-4 top-4 rounded bg-slate-900/80 px-2 py-1 text-xs text-cyan-400">抠图后</div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-600"><ImageIcon className="h-16 w-16" /><span className="text-sm">上传图片后显示效果</span></div>
              )}
            </div>
          </div>
        </div>
        {originalImage && (
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-400">抠图阈值</label>
              <span className="text-cyan-400 font-mono text-sm">{threshold}</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="mt-2 text-xs text-slate-500">调整阈值控制抠图敏感度，数值越小抠图越精确</p>
          </div>
        )}
        {processedImage && (
          <div className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex gap-4">
              <Button onClick={retryProcessing} className="flex-1 bg-slate-700 hover:bg-slate-600">
                <RefreshCw className="mr-2 h-4 w-4" />重新处理
              </Button>
              <Button onClick={downloadImage} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500">
                <Download className="mr-2 h-4 w-4" />下载透明 PNG
              </Button>
            </div>
          </div>
        )}
        {processStatus === "error" && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-400 text-sm">处理失败，请重试或尝试其他图片</p>
            <button onClick={retryProcessing} className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />重新尝试
            </button>
          </div>
        )}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
