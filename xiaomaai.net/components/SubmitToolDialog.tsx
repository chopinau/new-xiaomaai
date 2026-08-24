'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { addSubmittedTool } from '@/lib/storage'

const CATEGORIES = [
  { value: 'chat', label: 'AI 对话' },
  { value: 'image', label: 'AI 图像' },
  { value: 'video', label: 'AI 视频' },
  { value: 'audio', label: 'AI 音频' },
  { value: 'code', label: 'AI 编程' },
  { value: 'productivity', label: 'AI 效率' },
]

interface SubmitToolDialogProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  children?: React.ReactNode
}

export function SubmitToolDialog({
  className = '',
  variant = 'outline',
  size = 'sm',
  children,
}: SubmitToolDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  function resetForm() {
    setName('')
    setUrl('')
    setDescription('')
    setCategory('')
    setTags('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      toast({ variant: 'warning', title: '请填写必填项', description: '工具名称和官网 URL 为必填字段' })
      return
    }

    setSubmitting(true)

    // 保存到 localStorage
    addSubmittedTool({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      category: category || 'chat',
      tags: tags.trim(),
    })

    // 同时提交到 API
    try {
      await fetch('/api/submit-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          description: description.trim(),
          category: category || 'chat',
          tags: tags.trim(),
        }),
      })
    } catch {
      // API 失败不影响本地存储
    }

    toast({ variant: 'success', title: '感谢提交', description: '审核通过后将上线' })
    resetForm()
    setOpen(false)
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant} size={size} className={className}>
            <Plus className="h-4 w-4" />
            提交工具
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>提交新工具</DialogTitle>
          <DialogDescription>
            推荐你喜欢的 AI 工具，审核通过后将展示在工具市场中
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              工具名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：ChatGPT"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              官网 URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述这个工具的功能..."
              rows={3}
              className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            >
              <option value="">请选择分类</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">标签</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="多个标签用逗号分隔，例如：AI, 对话, GPT"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-ink-200"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gradient-brand text-white"
            >
              {submitting ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}