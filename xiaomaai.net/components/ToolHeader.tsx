interface ToolHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
}

export function ToolHeader({ title, description, icon }: ToolHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-ink-200">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center text-white text-sm">
            {icon}
          </div>
          <div>
            <h1 className="font-semibold text-ink-900 text-sm">{title}</h1>
            {description && (
              <p className="text-xs text-ink-500">{description}</p>
            )}
          </div>
        </div>
        <a
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 border border-ink-200 hover:bg-ink-50 rounded-md text-sm text-ink-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <span>返回主页</span>
        </a>
      </div>
    </header>
  );
}
