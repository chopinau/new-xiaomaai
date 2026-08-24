"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Library, X, Plus, Clock, Image as ImageIcon, Film } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { PromptCard } from "@/components/PromptCard";
import { PROMPT_LIBRARY, PROMPT_CATEGORIES } from "@/data/prompts";
import { videoPrompts, VIDEO_PROMPT_CATEGORIES } from "@/data/prompts-video";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SubmitPromptDialog,
  getSubmittedPrompts,
  type SubmittedPrompt,
} from "@/components/SubmitPromptDialog";

type TabKey = "image" | "video";

export default function PromptsPage() {
  const [tab, setTab] = useState<TabKey>("image");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submittedPrompts, setSubmittedPrompts] = useState<SubmittedPrompt[]>(
    () => getSubmittedPrompts()
  );

  const handleSubmitted = useCallback(() => {
    setSubmittedPrompts(getSubmittedPrompts());
  }, []);

  // 切换 tab 时重置分类和搜索
  const switchTab = useCallback((next: TabKey) => {
    setTab(next);
    setActiveCategory("全部");
    setSearch("");
  }, []);

  const filtered = useMemo(() => {
    const list = tab === "image" ? PROMPT_LIBRARY : videoPrompts;
    let result: typeof list = list as any;
    if (activeCategory !== "全部") {
      result = (result as any).filter((p: any) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = (result as any).filter(
        (p: any) =>
          p.title?.toLowerCase().includes(q) ||
          p.prompt?.toLowerCase().includes(q) ||
          p.category?.toLowerCase?.().includes(q) ||
          (p.style && p.style.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory, tab]);

  const categories = tab === "image" ? PROMPT_CATEGORIES : VIDEO_PROMPT_CATEGORIES;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      {/* Hero 区域 */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-hero">
              <Library className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              AI 提示词库
            </h1>

            {/* Tab 切换 */}
            <div className="mt-5 inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                type="button"
                onClick={() => switchTab("image")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tab === "image"
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                图像提示词
                <span className={`ml-1 rounded-full px-1.5 text-[10px] ${tab === "image" ? "bg-white/20" : "bg-muted"}`}>
                  {PROMPT_LIBRARY.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("video")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  tab === "video"
                    ? "bg-brand-gradient text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Film className="h-4 w-4" />
                视频提示词
                <span className={`ml-1 rounded-full px-1.5 text-[10px] ${tab === "video" ? "bg-white/20" : "bg-muted"}`}>
                  {videoPrompts.length}
                </span>
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {tab === "image"
                  ? `收录 ${PROMPT_LIBRARY.length} 条精选 AI 图像生成提示词,按分类浏览,一键复制使用`
                  : `收录 ${videoPrompts.length} 条精选 AI 视频生成提示词 (Sora / Veo / 可灵 / 即梦),一键复制使用`}
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="h-9 shrink-0 rounded-full bg-brand-gradient text-white shadow-hero hover:opacity-90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                提交提示词
              </Button>
            </div>

            {/* 搜索框 */}
            <div className="relative mt-6 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索提示词标题、内容…"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none ring-0 transition-all placeholder:text-muted-foreground focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="清除搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 分类筛选 + 卡片列表 */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 分类标签 */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "border-brand-purple bg-brand-purple text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-purple/40 hover:text-brand-purple"
              }`}
            >
              {cat}
              {cat !== "全部" && (
                <span className="ml-1.5 opacity-70">
                  {(tab === "image" ? PROMPT_LIBRARY : videoPrompts).filter((p: any) => p.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 结果统计 */}
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {search || activeCategory !== "全部" ? "筛选" : "全部"}结果：{filtered.length} 条
          </span>
          {(search || activeCategory !== "全部") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("全部");
              }}
              className="text-xs text-brand-purple hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 卡片网格 */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((prompt, idx) => (
              <PromptCard key={prompt.id} prompt={prompt} index={idx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">未找到匹配的提示词</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              尝试调整搜索关键词或切换分类
            </p>
          </div>
        )}
      </section>

      {/* 底部间距 */}
      <div className="pb-16" />

      {/* 已提交的提示词（待审核） */}
      {submittedPrompts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">
              我提交的提示词
              <Badge variant="outline" className="ml-2 border-amber-300 bg-amber-50 text-amber-700">
                待审核
              </Badge>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {submittedPrompts.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-amber-300 bg-amber-50 text-amber-700"
                  >
                    待审核
                  </Badge>
                </div>
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {item.prompt}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-brand-purple">
                    {item.category}
                  </span>
                  {item.tags &&
                    item.tags.split(",").map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-ink-500"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(item.submittedAt).toLocaleString("zh-CN")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 提交提示词对话框 */}
      <SubmitPromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}