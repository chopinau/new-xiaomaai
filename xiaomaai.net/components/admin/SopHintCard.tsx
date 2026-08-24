'use client'

import { useState, type ReactNode } from 'react'
import { Lightbulb, X, ChevronDown } from 'lucide-react'

interface SopHintCardProps {
  defaultOpen?: boolean
  onClose?: () => void
}

interface SopItem {
  icon: string
  label: string
  description: string
}

const SOP_ITEMS: ReadonlyArray<SopItem> = [
  {
    icon: '✅',
    label: '可自动',
    description: '抓取 faxianai / Toolify / GitHub trending → 草稿区',
  },
  {
    icon: '⚠️',
    label: '需人工',
    description: '补全 logo（上传）/ 选/补封面图 / 确认分类 / 写中文简介 / 决定是否上首页',
  },
  {
    icon: '💡',
    label: '你可做的',
    description: '上传 logo / 填外链 / 加标签 / 上/下架',
  },
  {
    icon: '🚧',
    label: '规划中',
    description: '图片上传到对象存储、批量改分类 API、对外 RSS 输出',
  },
]

export default function SopHintCard({
  defaultOpen = true,
  onClose,
}: SopHintCardProps): ReactNode {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  const handleClose = (): void => {
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className="rounded-lg border border-amber-300/70 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 shadow-sm"
      role="region"
      aria-label="半自动运营 SOP 提示卡"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={isOpen}
          aria-controls="sop-hint-card-content"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-blue-600 transition-transform duration-200 ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <h3 className="text-sm font-semibold text-blue-600">
            📌 半自动运营 SOP
          </h3>
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="关闭提示"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div
          id="sop-hint-card-content"
          className="space-y-2 px-4 pb-4 pt-1"
        >
          {SOP_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-md border border-amber-200/60 bg-white/60 px-3 py-2"
            >
              <span className="text-base leading-5" aria-hidden="true">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {item.label === '可自动' || item.label === '你可做的' ? (
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  ) : null}
                  <span className="text-xs font-semibold text-amber-900">
                    {item.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-5 text-amber-900/80">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
