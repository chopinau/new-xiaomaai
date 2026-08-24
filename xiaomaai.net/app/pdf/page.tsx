"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";

type TabType = "slicer" | "converter" | "binder";

interface TerminalLog {
  text: string;
  type: "info" | "success" | "warning" | "process";
}

const tabs: { id: TabType; icon: string; label: string; description: string }[] = [
  { id: "slicer", icon: "✂️", label: "极速 PDF 切片机", description: "拆分 / 合并" },
  { id: "converter", icon: "🖼️", label: "PDF 逐帧洗印池", description: "PDF 转多图" },
  { id: "binder", icon: "📓", label: "视觉资产装订册", description: "多图生成 PDF" },
];

export default function PDFEngine() {
  const [activeTab, setActiveTab] = useState<TabType>("slicer");
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [slicerFile, setSlicerFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("");

  const [converterFile, setConverterFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<"jpg" | "png">("png");

  const [binderFiles, setBinderFiles] = useState<File[]>([]);
  const [binderPreviews, setBinderPreviews] = useState<string[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const addLog = useCallback((text: string, type: TerminalLog["type"] = "info") => {
    setTerminalLogs((prev) => [...prev, { text, type }]);
  }, []);

  const simulateTerminal = useCallback(
    async (logs: { text: string; type: TerminalLog["type"]; delay: number }[], callback?: () => void) => {
      setShowTerminal(true);
      setTerminalLogs([]);
      setProgress(0);
      setIsProcessing(true);
      setErrorMessage("");

      for (let i = 0; i < logs.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, logs[i].delay));
        addLog(logs[i].text, logs[i].type);
        setProgress(((i + 1) / logs.length) * 100);
      }

      if (callback) {
        try {
          await callback();
        } catch (error) {
          console.error("Operation failed:", error);
          setErrorMessage(error instanceof Error ? error.message : "操作失败");
          addLog(`> ✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`, "warning");
        }
      }

      setIsProcessing(false);
    },
    [addLog]
  );

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const extractPageCount = (pdfData: Uint8Array): number => {
    const text = new TextDecoder().decode(pdfData);
    const pageCountMatch = text.match(/\/Type\s*\/Pages[^}]*\/Count\s+(\d+)/);
    if (pageCountMatch) {
      return parseInt(pageCountMatch[1], 10);
    }
    const pageMatch = text.match(/\/Type\s*\/Page/g);
    return pageMatch ? pageMatch.length : 1;
  };

  const handleSlice = async () => {
    if (!slicerFile) return;

    const logs = [
      { text: "> 初始化小马AI处理引擎...", type: "info" as const, delay: 300 },
      { text: "> 加载小马AI处理模块...", type: "process" as const, delay: 500 },
      { text: `> 加载文档: ${slicerFile.name}`, type: "info" as const, delay: 400 },
      { text: `> 解析页码范围: ${pageRange || "全部页面"}`, type: "process" as const, delay: 300 },
      { text: "> 执行页面提取...", type: "process" as const, delay: 600 },
      { text: "> 重建文档结构...", type: "process" as const, delay: 500 },
      { text: "> 压缩输出...", type: "process" as const, delay: 400 },
      { text: "> ✓ 处理完成，准备下载。", type: "success" as const, delay: 300 },
    ];

    await simulateTerminal(logs, async () => {
      const pdfLibModule = await import("pdf-lib");
      const { PDFDocument } = pdfLibModule;
      
      const arrayBuffer = await slicerFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const pageIndices: number[] = [];
      if (pageRange) {
        const ranges = pageRange.split(",");
        for (const range of ranges) {
          const trimmed = range.trim();
          if (trimmed.includes("-")) {
            const [start, end] = trimmed.split("-").map(Number);
            for (let i = start - 1; i < end; i++) {
              pageIndices.push(i);
            }
          } else {
            pageIndices.push(Number(trimmed) - 1);
          }
        }
      } else {
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
          pageIndices.push(i);
        }
      }

      const pages = await newPdf.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      downloadFile(blob, `sliced_${slicerFile.name}`);
    });
  };

  const handleConvert = async () => {
    if (!converterFile) return;

    const logs = [
      { text: "> 启动小马AI渲染引擎...", type: "info" as const, delay: 400 },
      { text: "> 加载小马AI处理组件...", type: "process" as const, delay: 500 },
      { text: `> 文档已加载: ${converterFile.name}`, type: "info" as const, delay: 300 },
      { text: "> 检测页面数量...", type: "process" as const, delay: 200 },
      { text: `> 输出格式: ${outputFormat.toUpperCase()}`, type: "info" as const, delay: 200 },
      { text: "> 渲染页面...", type: "process" as const, delay: 800 },
      { text: "> 打包为压缩文件...", type: "process" as const, delay: 600 },
      { text: "> ✓ 转换完成，压缩包已准备好。", type: "success" as const, delay: 300 },
    ];

    await simulateTerminal(logs, async () => {
      const pdfjsLib = await import("pdfjs-dist");
      const JSZip = (await import("jszip")).default;

      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await converterFile.arrayBuffer();
      
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        disableFontFace: true,
      }).promise;
      
      const zip = new JSZip();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        
        await page.render({ canvasContext: ctx!, viewport }).promise;
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((value) => {
            if (value) {
              resolve(value);
              return;
            }
            reject(new Error("Failed to convert canvas to blob"));
          }, `image/${outputFormat}`);
        });
        zip.file(`page-${i}.${outputFormat}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadFile(zipBlob, `converted_${converterFile.name.replace(".pdf", "")}.zip`);
    });
  };

  const handleBind = async () => {
    if (binderFiles.length === 0) return;

    const logs = [
      { text: "> 初始化小马AI文档生成器...", type: "info" as const, delay: 400 },
      { text: `> 处理 ${binderFiles.length} 张图片...`, type: "process" as const, delay: 300 },
      { text: "> 创建文档模板...", type: "process" as const, delay: 400 },
      { text: "> 处理图片...", type: "process" as const, delay: 800 },
      { text: "> 生成文档...", type: "process" as const, delay: 400 },
      { text: "> ✓ 文档生成完成。", type: "success" as const, delay: 300 },
    ];

    await simulateTerminal(logs, async () => {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const a4Width = 210;
      const a4Height = 297;

      for (let i = 0; i < binderFiles.length; i++) {
        const file = binderFiles[i];
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = imgData;
        });

        const ratio = img.width / img.height;
        let width = a4Width - 20;
        let height = width / ratio;
        
        if (height > a4Height - 20) {
          height = a4Height - 20;
          width = height * ratio;
        }

        const x = (a4Width - width) / 2;
        const y = (a4Height - height) / 2;

        doc.addImage(imgData, "JPEG", x, y, width, height);
        
        if (i < binderFiles.length - 1) {
          doc.addPage();
        }
      }

      doc.save("album.pdf");
    });
  };

  const handleBinderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBinderFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBinderPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBinderImage = (index: number) => {
    setBinderFiles((prev) => prev.filter((_, i) => i !== index));
    setBinderPreviews((prev) => prev.filter((_, i) => i !== index));
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

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.aside
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-1"
          >
            <div className="p-4 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10">
              <nav className="space-y-3">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index + 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-300
                      ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-violet-600/30 to-blue-600/30 border border-violet-500/50"
                          : "bg-[#0f0f1a] border border-violet-500/10 hover:border-violet-500/30"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tab.icon}</span>
                      <div>
                        <div className={`font-medium ${activeTab === tab.id ? "text-violet-300" : "text-gray-300"}`}>
                          {tab.label}
                        </div>
                        <div className="text-xs text-gray-500">{tab.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.aside>

          <main className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === "slicer" && (
                <motion.div
                  key="slicer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">✂️</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200">极速 PDF 切片机</h2>
                      <p className="text-sm text-gray-500">拆分 PDF 文件，提取指定页码范围</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <DropZone
                      file={slicerFile}
                      onFileChange={setSlicerFile}
                      accept=".pdf"
                      placeholder="将 PDF 文件拖拽至此处，或点击选择"
                    />

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-400">页码范围 (可选)</label>
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder="例如: 1-5, 8, 10-15 (留空则保留全部页面)"
                        className="w-full px-4 py-3 bg-[#0f0f1a] border border-violet-500/20 rounded-xl 
                                 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <button
                      onClick={handleSlice}
                      disabled={!slicerFile || isProcessing}
                      className={`w-full py-4 rounded-xl font-medium text-lg transition-all
                        ${!slicerFile || isProcessing
                          ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90"}`}
                    >
                      {isProcessing ? "处理中..." : "🚀 小马AI技术瞬间切割"}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "converter" && (
                <motion.div
                  key="converter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">🖼️</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200">PDF 逐帧洗印池</h2>
                      <p className="text-sm text-gray-500">将 PDF 每页转换为高清图片</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <DropZone
                      file={converterFile}
                      onFileChange={setConverterFile}
                      accept=".pdf"
                      placeholder="将 PDF 文件拖拽至此处，或点击选择"
                    />

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-400">输出格式</label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setOutputFormat("jpg")}
                          className={`flex-1 p-4 rounded-xl border transition-all
                            ${outputFormat === "jpg"
                              ? "border-violet-500/50 bg-violet-500/10"
                              : "border-violet-500/10 bg-[#0f0f1a] hover:border-violet-500/30"}`}
                        >
                          <div className="font-medium text-gray-200">输出 JPG</div>
                          <div className="text-xs text-gray-500">更小的文件体积</div>
                        </button>
                        <button
                          onClick={() => setOutputFormat("png")}
                          className={`flex-1 p-4 rounded-xl border transition-all
                            ${outputFormat === "png"
                              ? "border-violet-500/50 bg-violet-500/10"
                              : "border-violet-500/10 bg-[#0f0f1a] hover:border-violet-500/30"}`}
                        >
                          <div className="font-medium text-gray-200">输出 PNG</div>
                          <div className="text-xs text-gray-500">无损高清画质</div>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={!converterFile || isProcessing}
                      className={`w-full py-4 rounded-xl font-medium text-lg transition-all
                        ${!converterFile || isProcessing
                          ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90"}`}
                    >
                      {isProcessing ? "处理中..." : "🎥 启动小马AI渲染"}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "binder" && (
                <motion.div
                  key="binder"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 rounded-2xl bg-[#0a0a14]/80 backdrop-blur-xl border border-violet-500/10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">📓</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200">视觉资产装订册</h2>
                      <p className="text-sm text-gray-500">将多张图片合并为 PDF 画册</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-400">图片资产 (支持多选)</label>
                      <label
                        className="flex flex-col items-center justify-center h-40 border-2 border-dashed 
                                 border-violet-500/30 rounded-xl cursor-pointer hover:border-violet-500/50 
                                 hover:bg-[#0f0f1a] transition-all"
                      >
                        <div className="text-4xl mb-2">📁</div>
                        <div className="text-gray-400">点击选择图片或拖拽至此</div>
                        <div className="text-xs text-gray-600 mt-1">支持 JPG, PNG, WebP 格式</div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBinderFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {binderPreviews.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-400">
                            已选择 {binderPreviews.length} 张图片
                          </label>
                          <button
                            onClick={() => {
                              setBinderFiles([]);
                              setBinderPreviews([]);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            清空全部
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {binderPreviews.map((preview, index) => (
                            <div
                              key={index}
                              className="relative group aspect-square rounded-lg overflow-hidden border border-violet-500/20"
                            >
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => removeBinderImage(index)}
                                aria-label={`删除第 ${index + 1} 张图片`}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                                         transition-opacity flex items-center justify-center text-white text-xl"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleBind}
                      disabled={binderFiles.length === 0 || isProcessing}
                      className={`w-full py-4 rounded-xl font-medium text-lg transition-all
                        ${binderFiles.length === 0 || isProcessing
                          ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90"}`}
                    >
                      {isProcessing ? "处理中..." : "🗂️ 压制高清 PDF 画册"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <AnimatePresence>
          {showTerminal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="w-full max-w-2xl bg-[#0a0a12] border border-violet-500/20 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f1a] border-b border-violet-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500/60" />
                    <div className="w-3 h-3 rounded-full bg-blue-500/60" />
                    <div className="w-3 h-3 rounded-full bg-cyan-500/60" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">edge-pdf-engine</span>
                  <button
                    onClick={() => setShowTerminal(false)}
                    disabled={isProcessing}
                    className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div ref={terminalRef} className="h-64 p-4 overflow-auto font-mono text-sm">
                  {terminalLogs.map((log, index) => (
                    <TerminalLine key={index} log={log} index={index} />
                  ))}
                  {isProcessing && <span className="text-cyan-400">▋</span>}
                  {errorMessage && (
                    <div className="text-red-400 mt-2">✗ {errorMessage}</div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">处理进度</span>
                    <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-[#0f0f1a] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${progress >= 100 ? "bg-green-500" : "bg-gradient-to-r from-violet-500 to-blue-500"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {progress >= 100 && !isProcessing && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setShowTerminal(false)}
                      className="w-full mt-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-500 transition-colors"
                    >
                      ✓ 处理完成 - 点击关闭
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DropZone({
  file,
  onFileChange,
  accept,
  placeholder,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  placeholder: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileChange(e.dataTransfer.files[0]);
      }
    },
    [onFileChange]
  );

  return (
    <label
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center h-48 rounded-xl cursor-pointer
        border-2 border-dashed transition-all duration-300 bg-[#0f0f1a]
        ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-violet-500/20 hover:border-violet-500/40"}`}
    >
      {file ? (
        <div className="text-center">
          <div className="text-5xl mb-3">📄</div>
          <div className="font-medium text-gray-200">{file.name}</div>
          <div className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onFileChange(null);
            }}
            className="mt-3 text-sm text-gray-500 hover:text-gray-300 underline"
          >
            更换文件
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-3">{isDragging ? "📥" : "📁"}</div>
          <div className="text-gray-400">{placeholder}</div>
        </div>
      )}

      <input type="file" accept={accept} onChange={(e) => onFileChange(e.target.files?.[0] || null)} className="hidden" />
    </label>
  );
}

function TerminalLine({ log, index }: { log: TerminalLog; index: number }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= log.text.length) {
        setDisplayText(log.text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [log.text]);

  const colorClass = {
    info: "text-gray-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    process: "text-cyan-400",
  }[log.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`mb-1 ${colorClass}`}
    >
      {displayText}
    </motion.div>
  );
}
