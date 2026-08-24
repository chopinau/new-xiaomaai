"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, X } from "lucide-react";
import { SubmitToolDialog } from "@/components/SubmitToolDialog";

interface TopNavProps {
  query?: string;
  setQuery?: (q: string) => void;
}

const navItems = [
  { label: "首页", href: "/" },
  { label: "资讯", href: "/news" },
  { label: "工作流", href: "/workflows" },
  { label: "操作手册", href: "/manuals" },
  { label: "排行榜", href: "/rankings" },
  { label: "我的收藏", href: "/bookmarks" },
  { label: "模型价格", href: "/pricing" },
  { label: "API 接入", href: "/api" },
];

export function TopNav({ query = "", setQuery }: TopNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearchChange = (value: string) => {
    setLocalQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setQuery?.(value);
    }, 300);
  };

  const SearchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors" />
      <input
        type="text"
        value={localQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="搜索 440+ AI 工具…"
        aria-label="搜索 AI 工具"
        className="h-10 w-full rounded-full bg-background/80 pl-9 pr-4 text-sm text-foreground outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-purple/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)] md:w-64 lg:w-72"
      />
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/50 bg-card/85 backdrop-blur-xl transition-all duration-300 ${
        isScrolled ? "shadow-[0_4px_24px_-12px_rgba(124,58,237,0.18)]" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/mascot.png"
            alt="小马 AI Logo"
            width={36}
            height={36}
            className="size-9 object-contain"
            priority
          />
          <span className="text-lg font-bold tracking-tight">
            小马 <span className="text-gradient-brand">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-brand-purple/5 hover:text-brand-purple"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <div className="hidden items-center gap-3 md:flex">
          {SearchInput}
          <SubmitToolDialog variant="outline" size="sm" className="border-ink-200 text-ink-700 hover:border-brand-purple hover:text-brand-purple" />
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground/80 transition-colors hover:bg-accent md:hidden"
          aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border/50 bg-card/95 px-4 py-5 backdrop-blur-xl md:hidden">
          <div className="mb-5">{SearchInput}</div>
          <nav className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 pt-5 border-t border-border/50">
            <SubmitToolDialog variant="outline" size="default" className="mb-3 w-full border-ink-200 text-ink-700" />
          </div>
        </div>
      )}
    </header>
  );
}

export default TopNav;
