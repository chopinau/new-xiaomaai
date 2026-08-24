import Link from "next/link";
import Image from "next/image";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const footerLinks = {
  产品: [
    { label: "AI 画布", href: "/canvas" },
    { label: "工作流", href: "/flow" },
    { label: "提示词库", href: "/prompts" },
    { label: "PDF 工具", href: "/pdf" },
    { label: "PPT 工具", href: "/pptx" },
  ],
  资源: [
    { label: "API 教程", href: "/articles" },
    { label: "模型价格", href: "/pricing" },
    { label: "文章资讯", href: "/articles" },
  ],
  关于: [
    { label: "关于我们", href: "/admin" },
    { label: "提交工具", href: "/admin" },
    { label: "模型价格", href: "/pricing" },
    { label: "API 接入", href: "/api" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="w-full bg-background">
      <div className="h-px w-full bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/mascot.png"
                alt="小马 AI Logo"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
              <span className="text-xl font-bold tracking-tight">
                小马 <span className="text-gradient-brand">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              小马 AI 致力于打造简单、高效的 AI 创作与办公工具，让智能技术真正服务于每一位用户。
            </p>
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">订阅周刊</h3>
              <NewsletterSignup compact />
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={`${group}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center text-sm text-muted-foreground/80 transition-colors hover:text-brand-purple"
                    >
                      <span className="mr-0 h-1 w-1 rounded-full bg-brand-purple/0 transition-all duration-200 group-hover/link:mr-1.5 group-hover/link:bg-brand-purple" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 py-6 text-xs text-muted-foreground/70 md:flex-row">
          <p>© 2026 小马 AI · xiaomaai.net · All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-brand-purple/40" />
            Built with Next.js · Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
