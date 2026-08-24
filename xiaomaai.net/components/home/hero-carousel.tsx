"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Globe, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: 1,
    badge: "全新上线",
    badgeIcon: Sparkles,
    title: "发现下一代 AI 工具",
    description: "聚合全球最前沿的人工智能模型与应用，助你一站式探索、对比、使用 AI 生产力工具。",
    cta: "立即探索",
    accent: "from-[#7C3AED]",
    glow: "bg-[#7C3AED]/30",
  },
  {
    id: 2,
    badge: "效率提升",
    badgeIcon: Zap,
    title: "AI 工作流，快人一步",
    description: "从提示词库到自动化工作流，让 AI 真正融入你的日常创作与办公场景。",
    cta: "搭建工作流",
    accent: "from-[#06B6D4]",
    glow: "bg-[#06B6D4]/30",
  },
  {
    id: 3,
    badge: "全球视野",
    badgeIcon: Globe,
    title: "汇聚顶尖 AI 厂商",
    description: "OpenAI、Anthropic、Google、DeepSeek、xAI 等一线厂商模型动态实时追踪。",
    cta: "浏览厂商",
    accent: "from-[#D946EF]",
    glow: "bg-[#D946EF]/30",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full overflow-hidden rounded-2xl gradient-deep shadow-card">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#06B6D4]/15 blur-[96px]" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-48 w-48 rounded-full bg-[#D946EF]/15 blur-[72px]" />
      {/* 噪点纹理增加质感 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative flex min-h-[360px] items-center px-8 py-12 md:px-14">
        <div className="max-w-2xl">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active === idx ? "opacity-100 translate-y-0 relative" : "opacity-0 translate-y-4 absolute pointer-events-none inset-0"
              )}
            >
              <Badge className="mb-4 gap-1.5 border-white/10 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-transform">
                <slide.badgeIcon className="h-3.5 w-3.5" />
                {slide.badge}
              </Badge>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl md:leading-[1.1]">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
                {slide.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className={cn(
                    "gap-2 rounded-full bg-gradient-to-r to-white/10 px-7 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
                    slide.accent
                  )}
                >
                  {slide.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 rounded-full border-white/20 bg-white/5 px-7 text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
                >
                  <Link href="/api">
                    <Plug className="h-4 w-4" />
                    API 接入
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active === idx ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`切换到第 ${idx + 1} 张`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
