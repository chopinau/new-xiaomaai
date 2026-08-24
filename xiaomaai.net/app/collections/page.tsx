"use client";

import { useState, useMemo } from "react";
import { Search, Library, X } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/site-footer";
import { CollectionCard } from "@/components/CollectionCard";
import { collections } from "@/data/collections";

// 分类中文名映射（未知分类直接显示原始 key，例如「跨境电商」「AI视频」）
const CATEGORY_LABELS: Record<string, string> = {
  dev: "开发",
  design: "设计",
  free: "免费",
  writing: "写作",
  video: "视频",
  productivity: "效率",
  enterprise: "企业",
  academic: "学术",
  marketing: "营销",
};

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // 从所有 collections 聚合出唯一分类列表（含数量），按数量降序
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    collections.forEach((c) => {
      counts.set(c.category, (counts.get(c.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const filtered = useMemo(() => {
    let result = collections;

    if (activeCategory !== "all") {
      result = result.filter((c) => c.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeCategory]);

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
              专题合集
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              收录 {collections.length} 个精选 AI 工具专题合集，按场景分类，快速找到你需要的工具组合
            </p>

            {/* 搜索框 */}
            <div className="relative mt-6 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索合集名称、描述…"
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
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === "all"
                ? "border-brand-purple bg-brand-purple text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-brand-purple/40 hover:text-brand-purple"
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeCategory === cat.key
                  ? "border-brand-purple bg-brand-purple text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-purple/40 hover:text-brand-purple"
              }`}
            >
              {CATEGORY_LABELS[cat.key] || cat.key}
              <span className="ml-1.5 opacity-70">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* 结果统计 */}
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {search || activeCategory !== "all" ? "筛选" : "全部"}结果：{filtered.length} 个
          </span>
          {(search || activeCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="text-xs text-brand-purple hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 卡片网格 */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((collection, idx) => (
              <CollectionCard key={collection.id} collection={collection} index={idx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">未找到匹配的合集</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              尝试调整搜索关键词或切换分类
            </p>
          </div>
        )}
      </section>

      {/* 底部间距 */}
      <div className="pb-16" />

      <SiteFooter />
    </div>
  );
}