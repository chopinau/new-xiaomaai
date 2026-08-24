"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from "file-saver";
import gifshot from "gifshot";
import { TopNav } from "@/components/TopNav";

type GifResult = {
  error?: boolean;
  image?: string;
};

interface SliceConfig {
  cols: number;
  rows: number;
}

interface ExportMode {
  type: "gif" | "webm";
  label: string;
  icon: string;
  description: string;
}

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const warningVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 16,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const terminalLineVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.15, duration: 0.3 },
  }),
};

function Slider3D({
  label,
  value,
  onChange,
  min,
  max,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400 font-medium tracking-wide">
          {label}
        </span>
        <span className="text-cyan-400 font-mono text-sm tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600/20 to-cyan-600/20 blur-sm" />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none cursor-pointer rounded-full
            bg-[#16162a] border border-violet-500/20
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.05)]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-violet-400 [&::-webkit-slider-thumb]:to-cyan-400
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
            [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(124,58,237,0.5),0_4px_8px_rgba(0,0,0,0.3)]
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
        />
      </div>
    </div>
  );
}

function ExportModeCard({
  mode,
  isSelected,
  onClick,
}: {
  mode: ExportMode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex-1 p-4 rounded-xl cursor-pointer transition-all duration-300
        ${
          isSelected
            ? "bg-gradient-to-br from-violet-900/50 to-blue-900/50 border-violet-500/50"
            : "bg-[#0f0f1a]/80 border-violet-500/10 hover:border-violet-500/30"
        }
        border backdrop-blur-xl
        shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_20px_rgba(0,0,0,0.3)]`}
    >
      {isSelected && (
        <motion.div
          layoutId="selectedGlow"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{mode.icon}</span>
          <span
            className={`font-semibold ${isSelected ? "text-violet-300" : "text-gray-300"}`}
          >
            {mode.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 text-left">{mode.description}</p>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

function TerminalAnimation({
  isExporting,
  progress,
}: {
  isExporting: boolean;
  progress: number;
}) {
  const lines = [
    "▸ 初始化渲染引擎...",
    "▸ 加载帧序列数据...",
    "▸ 配置编码参数...",
    "▸ 启动本地渲染管线...",
    `▸ 渲染进度: ${progress}%`,
  ];

  return (
    <AnimatePresence>
      {isExporting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 rounded-xl bg-[#0a0a14] border border-violet-500/20 overflow-hidden
            shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-violet-500/10 bg-[#0f0f1a]">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/50" />
            <span className="ml-2 text-xs text-gray-500 font-mono">
              render-pipeline.sh
            </span>
          </div>
          <div className="p-4 font-mono text-sm space-y-2">
            {lines.map((line, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={terminalLineVariants}
                initial="hidden"
                animate="visible"
                className={`${i === lines.length - 1 ? "text-cyan-400" : "text-violet-300/70"}`}
              >
                {line}
                {i === lines.length - 1 && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="ml-1"
                  >
                    █
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="h-1.5 rounded-full bg-[#16162a] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full
                  shadow-[0_0_10px_rgba(124,58,237,0.5)]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SequenceSlicer() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>({
    cols: 4,
    rows: 4,
  });
  const [fps, setFps] = useState(12);
  const [exportMode, setExportMode] = useState<"gif" | "webm">("gif");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const exportModes: ExportMode[] = [
    {
      type: "gif",
      label: "极速表情包 (GIF)",
      icon: "⚡",
      description: "极轻量，适合社群传播",
    },
    {
      type: "webm",
      label: "高清视频流 (WebM)",
      icon: "🎬",
      description: "原画质，适合视频平台起号",
    },
  ];

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setUploadedImage(e.target?.result as string);
          sliceImage(img, sliceConfig.cols, sliceConfig.rows);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [sliceConfig]
  );

  const sliceImage = useCallback(
    (img: HTMLImageElement, cols: number, rows: number) => {
      const frameWidth = Math.floor(img.width / cols);
      const frameHeight = Math.floor(img.height / rows);
      const newFrames: ImageData[] = [];

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = frameWidth;
      tempCanvas.height = frameHeight;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) return;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          tempCtx.clearRect(0, 0, frameWidth, frameHeight);
          tempCtx.drawImage(
            img,
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight
          );
          newFrames.push(tempCtx.getImageData(0, 0, frameWidth, frameHeight));
        }
      }

      setFrames(newFrames);
      setCurrentFrame(0);

      if (canvasRef.current) {
        canvasRef.current.width = frameWidth;
        canvasRef.current.height = frameHeight;
      }
    },
    []
  );

  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => sliceImage(img, sliceConfig.cols, sliceConfig.rows);
      img.src = uploadedImage;
    }
  }, [sliceConfig, uploadedImage, sliceImage]);

  useEffect(() => {
    if (frames.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const animate = (timestamp: number) => {
      const frameInterval = 1000 / fps;
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        const frame = frames[currentFrame];
        if (frame) {
          ctx.putImageData(frame, 0, 0);
        }
        setCurrentFrame((prev) => (prev + 1) % frames.length);
        lastFrameTimeRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frames, fps, currentFrame]);

  useEffect(() => {
    if (!uploadedImage || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const cellWidth = img.width / sliceConfig.cols;
      const cellHeight = img.height / sliceConfig.rows;

      for (let i = 1; i < sliceConfig.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, img.height);
        ctx.stroke();
      }

      for (let i = 1; i < sliceConfig.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(img.width, i * cellHeight);
        ctx.stroke();
      }
    };
    img.src = uploadedImage;
  }, [uploadedImage, sliceConfig]);

  const handleExport = async () => {
    if (frames.length === 0 || !canvasRef.current) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (exportMode === "gif") {
        await exportAsGIF();
      } else {
        await exportAsWebM();
      }
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportAsGIF = async () => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    const frameDataUrls: string[] = [];

    for (let i = 0; i < frames.length; i++) {
      tempCtx.putImageData(frames[i], 0, 0);
      frameDataUrls.push(tempCanvas.toDataURL("image/png"));
      
      // 更新进度
      setExportProgress(Math.round((i / frames.length) * 80));
    }

    setExportProgress(85);

    return new Promise<void>((resolve) => {
      gifshot.createGIF({
        images: frameDataUrls,
        gifWidth: canvas.width,
        gifHeight: canvas.height,
        interval: 1 / fps,
        numFrames: frames.length,
        numWorkers: 2,
        sampleInterval: 7,
        onProgress: (progress: number) => {
          setExportProgress(85 + Math.round(progress * 15));
        },
      }, (obj: GifResult) => {
        if (!obj.error) {
          const image = obj.image;
          if (!image) {
            resolve();
            return;
          }
          // 将 base64 转换为 blob 并下载
          fetch(image)
            .then(res => res.blob())
            .then(blob => {
              saveAs(blob, "emoji.gif");
              resolve();
            })
            .catch(err => {
              console.error("GIF 下载失败:", err);
              resolve();
            });
        } else {
          console.error("GIF 生成失败:", obj.error);
          alert("GIF 生成失败，请重试");
          resolve();
        }
      });
    });
  };

  const exportAsWebM = async () => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    const stream = tempCanvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      saveAs(blob, "emoji.webm");
    };

    mediaRecorder.start();
    setExportProgress(10);

    // 播放所有帧
    let frameIndex = 0;
    const interval = setInterval(() => {
      tempCtx.putImageData(frames[frameIndex], 0, 0);
      frameIndex++;
      setExportProgress(10 + Math.round((frameIndex / frames.length) * 80));
      
      if (frameIndex >= frames.length) {
        clearInterval(interval);
        setTimeout(() => {
          mediaRecorder.stop();
          setExportProgress(100);
        }, 1000 / fps);
      }
    }, 1000 / fps);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-gray-100 pt-14">
      <TopNav />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 lg:p-8">
        <div className="text-center mb-8 pt-4">
          <p className="text-xs text-gray-600">小马科技AI提供技术支持</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-violet-500/20">
                <svg
                  className="w-4 h-4 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-200">
                图片上传与切分
              </h2>
            </div>

            <motion.div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-300 overflow-hidden
                ${
                  isDragging
                    ? "border-cyan-400 bg-cyan-500/5"
                    : "border-violet-500/30 hover:border-violet-500/50"
                }
                bg-[#0a0a14]/80 backdrop-blur-xl
                shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.3)]`}
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent
                  animate-[shimmer_3s_ease-in-out_infinite] -translate-x-full"
                  style={{
                    animation: "shimmer 3s ease-in-out infinite",
                  }}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />

              {uploadedImage ? (
                <div className="relative aspect-square">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <span className="px-3 py-1.5 rounded-full bg-[#0a0a14]/90 text-xs text-cyan-400 border border-cyan-500/20">
                      {sliceConfig.cols} × {sliceConfig.rows} ={" "}
                      {sliceConfig.cols * sliceConfig.rows} 帧
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center border border-violet-500/20">
                    <svg
                      className="w-8 h-8 text-violet-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-1">
                    拖入连续动作图序列
                  </p>
                  <p className="text-gray-600 text-sm">
                    支持 PNG / JPG / WebP 格式
                  </p>
                </div>
              )}
            </motion.div>

            <div
              className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10
              shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                切分参数设置
              </h3>
              <div className="space-y-6">
                <Slider3D
                  label="横向列数 (Cols)"
                  value={sliceConfig.cols}
                  onChange={(v) =>
                    setSliceConfig((prev) => ({ ...prev, cols: v }))
                  }
                  min={1}
                  max={10}
                />
                <Slider3D
                  label="纵向行数 (Rows)"
                  value={sliceConfig.rows}
                  onChange={(v) =>
                    setSliceConfig((prev) => ({ ...prev, rows: v }))
                  }
                  min={1}
                  max={10}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-200">
                预览与导出设置
              </h2>
            </div>

            <div
              className="relative rounded-2xl overflow-hidden bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10
              shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.3)]"
            >
              <div className="aspect-square flex items-center justify-center bg-[#08080f]">
                {frames.length > 0 ? (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center border border-violet-500/20">
                      <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">等待图像切分...</p>
                  </div>
                )}
              </div>

              {frames.length > 0 && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-[#0a0a14]/90 border border-violet-500/20">
                  <span className="font-mono text-xs text-violet-300">
                    帧 {currentFrame + 1}/{frames.length}
                  </span>
                </div>
              )}
            </div>

            <div
              className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10
              shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                播放速度设置
              </h3>
              <Slider3D
                label="帧率"
                value={fps}
                onChange={setFps}
                min={1}
                max={30}
                unit=" FPS"
              />
            </div>

            <div
              className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10
              shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.3)]"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                导出格式选择
              </h3>

              <div className="flex gap-4">
                {exportModes.map((mode) => (
                  <ExportModeCard
                    key={mode.type}
                    mode={mode}
                    isSelected={exportMode === mode.type}
                    onClick={() => setExportMode(mode.type)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {exportMode === "webm" && (
                  <motion.div
                    variants={warningVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <p className="text-sm text-blue-300/80 leading-relaxed">
                          原生流媒体录制需要以真实帧率在后台完整播放一遍动画，耗时与播放时长成正比，请耐心等待。
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <TerminalAnimation
                isExporting={isExporting}
                progress={exportProgress}
              />

              <motion.button
                onClick={handleExport}
                disabled={frames.length === 0 || isExporting}
                whileHover={{ scale: frames.length > 0 && !isExporting ? 1.02 : 1 }}
                whileTap={{ scale: frames.length > 0 && !isExporting ? 0.98 : 1 }}
                className={`relative w-full mt-6 py-4 px-6 rounded-xl font-semibold text-base
                  transition-all duration-300 overflow-hidden
                  ${
                    frames.length === 0 || isExporting
                      ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-cyan-600 text-white cursor-pointer"
                  }
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_20px_rgba(124,58,237,0.3)]`}
              >
                {frames.length > 0 && !isExporting && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                      style={{ animation: "shimmer 2s ease-in-out infinite" }}
                    />
                  </div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isExporting ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      渲染中...
                    </>
                  ) : (
                    <>
                      🚀 导出表情包 (本地渲染)
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
