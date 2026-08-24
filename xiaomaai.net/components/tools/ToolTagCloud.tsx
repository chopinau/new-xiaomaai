import Link from 'next/link';

type CategoryColor =
  | 'image'
  | 'video'
  | 'code'
  | 'chat'
  | 'audio'
  | 'productivity';

interface CategoryStyle {
  readonly wrapper: string;
}

const CATEGORY_STYLES: Record<CategoryColor, CategoryStyle> = {
  image: {
    wrapper: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  },
  video: {
    wrapper: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  code: {
    wrapper: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  chat: {
    wrapper: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  audio: {
    wrapper: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  productivity: {
    wrapper: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  },
};

const FALLBACK_STYLE: CategoryStyle = {
  wrapper: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
};

interface ToolTagCloudProps {
  tags: string[];
  category: string;
}

function resolveCategoryStyle(category: string): CategoryStyle {
  const key = category.toLowerCase() as CategoryColor;
  return CATEGORY_STYLES[key] ?? FALLBACK_STYLE;
}

export function ToolTagCloud({ tags, category }: ToolTagCloudProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const style = resolveCategoryStyle(category);

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const href = `/tags/${encodeURIComponent(tag)}`;
        return (
          <Link
            key={tag}
            href={href}
            className={[
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:shadow-sm',
              style.wrapper,
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-[0.6rem] leading-none">
              🔹
            </span>
            <span>{tag}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default ToolTagCloud;
