"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Bookmark,
  Globe,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Heart,
  Link2,
  Search,
} from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getFavorites,
  removeFavorite,
  getRecentTools,
  getCustomLinks,
  addCustomLink,
  removeCustomLink,
  type FavoriteTool,
  type RecentTool,
  type CustomLink,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

type TabKey = "favorites" | "custom" | "recent";

const TABS: { key: TabKey; label: string; icon: typeof Bookmark }[] = [
  { key: "favorites", label: "我的收藏", icon: Heart },
  { key: "custom", label: "自定义网址", icon: Globe },
  { key: "recent", label: "最近浏览", icon: Clock },
];

const EMOJI_OPTIONS = ["🚀", "🤖", "🎨", "📊", "💻", "🎵", "🎬", "📚", "🔍", "⚡", "🛠️", "🌐"];

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("favorites");
  const [favorites, setFavorites] = useState<FavoriteTool[]>([]);
  const [recent, setRecent] = useState<RecentTool[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [favSearch, setFavSearch] = useState("");

  // 自定义网址表单
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEmoji, setFormEmoji] = useState("🚀");
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState("");

  const refresh = () => {
    setFavorites(getFavorites());
    setRecent(getRecentTools());
    setCustomLinks(getCustomLinks());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = formUrl.trim().startsWith("http") ? formUrl.trim() : `https://${formUrl.trim()}`;
    if (!formName.trim() || !formUrl.trim()) {
      setFormError("请填写名称和网址");
      return;
    }
    addCustomLink({
      name: formName.trim(),
      url,
      emoji: formEmoji,
      note: formNote.trim(),
    });
    setFormName("");
    setFormUrl("");
    setFormEmoji("🚀");
    setFormNote("");
    setFormError("");
    refresh();
  };

  const handleRemoveFavorite = (slug: string) => {
    removeFavorite(slug);
    refresh();
  };

  const handleRemoveLink = (id: string) => {
    removeCustomLink(id);
    refresh();
  };

  const filteredFavorites = useMemo(() => {
    if (!favSearch.trim()) return favorites;
    const q = favSearch.toLowerCase();
    return favorites.filter((f) => f.name.toLowerCase().includes(q));
  }, [favorites, favSearch]);

  const favUrl = (slug: string) => `/tools/${slug}`;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-hero">
            <Bookmark className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">我的收藏</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            收藏的工具、自定义网址与浏览记录都保存在本机浏览器，不会上传
          </p>
        </section>

        {/* Tab */}
        <div className="mx-auto mb-8 flex w-fit gap-1 rounded-xl bg-brand-purple/[0.04] p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "favorites" ? favorites.length : tab.key === "custom" ? customLinks.length : recent.length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {tab.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* 收藏 */}
        {activeTab === "favorites" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">共收藏 {favorites.length} 个工具</p>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={favSearch}
                  onChange={(e) => setFavSearch(e.target.value)}
                  placeholder="搜索收藏…"
                  className="h-9 border-border bg-card pl-8 text-sm"
                />
              </div>
            </div>

            {filteredFavorites.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredFavorites.map((fav) => (
                  <div
                    key={fav.slug}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-brand-purple/40 hover:shadow-card"
                  >
                    <Link href={favUrl(fav.slug)} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-bold text-brand-purple">
                          {fav.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{fav.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(fav.addedAt).toLocaleDateString("zh-CN")} 收藏
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={favUrl(fav.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`打开 ${fav.name}`}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-brand-purple"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleRemoveFavorite(fav.slug)}
                        aria-label={`取消收藏 ${fav.name}`}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 text-center">
                <Heart className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {favSearch ? "未找到匹配的收藏" : "还没有收藏工具"}
                </p>
                {!favSearch && (
                  <Link href="/" className="text-sm text-brand-purple hover:underline">
                    去逛逛 AI 工具 →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 自定义网址 */}
        {activeTab === "custom" && (
          <div className="space-y-6">
            {/* 添加表单 */}
            <form
              onSubmit={handleAddLink}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <Plus className="h-4 w-4 text-brand-purple" />
                添加自定义网址
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">名称 *</label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="例如：Notion 工作台"
                      className="h-10 border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">网址 *</label>
                    <Input
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="notion.so 或 https://notion.so"
                      className="h-10 border-border bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">图标</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormEmoji(emoji)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-all",
                          formEmoji === emoji
                            ? "border-brand-purple bg-brand-purple/10 shadow-sm"
                            : "border-border bg-background hover:border-brand-purple/40"
                        )}
                        aria-label={`选择图标 ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">备注（可选）</label>
                  <Input
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="这个网址是干嘛的…"
                    className="h-10 border-border bg-background"
                  />
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" className="gradient-brand text-white hover:brightness-110">
                    <Plus className="mr-1 h-4 w-4" /> 添加
                  </Button>
                </div>
              </div>
            </form>

            {/* 列表 */}
            {customLinks.length > 0 ? (
              <div className="space-y-2.5">
                {customLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-brand-purple/40 hover:shadow-card"
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                          {link.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{link.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Link2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{link.url.replace(/^https?:\/\//, "")}</span>
                          </p>
                          {link.note && <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{link.note}</p>}
                        </div>
                      </div>
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      aria-label={`删除 ${link.name}`}
                      className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 text-center">
                <Globe className="h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">还没有自定义网址，添加一个试试吧</p>
              </div>
            )}
          </div>
        )}

        {/* 最近浏览 */}
        {activeTab === "recent" && (
          <div>
            {recent.length > 0 ? (
              <div className="space-y-2.5">
                {recent.map((item) => (
                  <div
                    key={item.slug}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-brand-purple/40 hover:shadow-card"
                  >
                    <Link href={favUrl(item.slug)} className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-sm font-bold text-brand-purple">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.visitedAt).toLocaleString("zh-CN")}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <Badge variant="outline" className="shrink-0 border-border text-[10px] text-muted-foreground">
                      最近浏览
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">暂无浏览记录</p>
                <Link href="/" className="text-sm text-brand-purple hover:underline">
                  去逛逛 AI 工具 →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
