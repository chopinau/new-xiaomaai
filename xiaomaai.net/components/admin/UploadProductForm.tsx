'use client'

import { useState, useMemo, type FormEvent, type ReactNode } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ProductCategory =
  | 'chat'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'productivity'

type ProductPricing = 'free' | 'freemium' | 'paid' | 'enterprise'

type ProductStatus = 'draft' | 'published'

export interface UploadedProduct {
  name: string
  url: string
  description: string
  category: ProductCategory
  tags: string[]
  pricing: ProductPricing
  logoUrl?: string
  affiliate?: string
  status: ProductStatus
}

interface UploadProductFormProps {
  onSubmitted?: (product: UploadedProduct) => void
}

const CATEGORY_OPTIONS: ReadonlyArray<{ value: ProductCategory; label: string }> = [
  { value: 'chat', label: 'AI 对话' },
  { value: 'image', label: 'AI 图像' },
  { value: 'video', label: 'AI 视频' },
  { value: 'audio', label: 'AI 音频' },
  { value: 'code', label: 'AI 编程' },
  { value: 'productivity', label: 'AI 效率' },
]

const PRICING_OPTIONS: ReadonlyArray<{ value: ProductPricing; label: string }> = [
  { value: 'free', label: '免费 (free)' },
  { value: 'freemium', label: '免费增值 (freemium)' },
  { value: 'paid', label: '付费 (paid)' },
  { value: 'enterprise', label: '企业 (enterprise)' },
]

const STATUS_OPTIONS: ReadonlyArray<{ value: ProductStatus; label: string }> = [
  { value: 'draft', label: '草稿 (draft)' },
  { value: 'published', label: '已发布 (published)' },
]

const DESCRIPTION_MAX_LENGTH = 500

const URL_PATTERN = /^https?:\/\/.+/

const INITIAL_FORM_STATE = {
  name: '',
  url: '',
  description: '',
  category: 'chat' as ProductCategory,
  tagsInput: '',
  pricing: 'freemium' as ProductPricing,
  logoUrl: '',
  affiliate: '',
  status: 'draft' as ProductStatus,
}

function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

export default function UploadProductForm({
  onSubmitted,
}: UploadProductFormProps): ReactNode {
  const [name, setName] = useState<string>(INITIAL_FORM_STATE.name)
  const [url, setUrl] = useState<string>(INITIAL_FORM_STATE.url)
  const [description, setDescription] = useState<string>(
    INITIAL_FORM_STATE.description,
  )
  const [category, setCategory] = useState<ProductCategory>(
    INITIAL_FORM_STATE.category,
  )
  const [tagsInput, setTagsInput] = useState<string>(INITIAL_FORM_STATE.tagsInput)
  const [pricing, setPricing] = useState<ProductPricing>(
    INITIAL_FORM_STATE.pricing,
  )
  const [logoUrl, setLogoUrl] = useState<string>(INITIAL_FORM_STATE.logoUrl)
  const [affiliate, setAffiliate] = useState<string>(INITIAL_FORM_STATE.affiliate)
  const [status, setStatus] = useState<ProductStatus>(INITIAL_FORM_STATE.status)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const descriptionLength = description.length
  const isDescriptionOverLimit = descriptionLength > DESCRIPTION_MAX_LENGTH
  const isUrlValid = URL_PATTERN.test(url.trim())

  const tagPreview = useMemo<string[]>(() => parseTagsInput(tagsInput), [tagsInput])

  const resetForm = (): void => {
    setName(INITIAL_FORM_STATE.name)
    setUrl(INITIAL_FORM_STATE.url)
    setDescription(INITIAL_FORM_STATE.description)
    setCategory(INITIAL_FORM_STATE.category)
    setTagsInput(INITIAL_FORM_STATE.tagsInput)
    setPricing(INITIAL_FORM_STATE.pricing)
    setLogoUrl(INITIAL_FORM_STATE.logoUrl)
    setAffiliate(INITIAL_FORM_STATE.affiliate)
    setStatus(INITIAL_FORM_STATE.status)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (trimmedName.length === 0) {
      toast({
        title: '请填写工具名称',
        variant: 'destructive',
      })
      return
    }

    if (trimmedUrl.length === 0) {
      toast({
        title: '请填写官网链接',
        variant: 'destructive',
      })
      return
    }

    if (!URL_PATTERN.test(trimmedUrl)) {
      toast({
        title: '官网链接需以 http:// 或 https:// 开头',
        variant: 'destructive',
      })
      return
    }

    if (isDescriptionOverLimit) {
      toast({
        title: `描述不能超过 ${DESCRIPTION_MAX_LENGTH} 字符`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    const trimmedLogo = logoUrl.trim()
    const trimmedAffiliate = affiliate.trim()
    const parsedTags = parseTagsInput(tagsInput)

    const product: UploadedProduct = {
      name: trimmedName,
      url: trimmedUrl,
      description: description.trim(),
      category,
      tags: parsedTags,
      pricing,
      status,
      ...(trimmedLogo.length > 0 ? { logoUrl: trimmedLogo } : {}),
      ...(trimmedAffiliate.length > 0 ? { affiliate: trimmedAffiliate } : {}),
    }

    // 真实实现时再连 /api/admin/tools/submit 端点
    // 现在只显示成功 toast 并清空表单
    toast({
      title: '已加入草稿区',
      description: '请到 /admin/tools 草稿 tab 审核',
    })

    if (onSubmitted) {
      onSubmitted(product)
    }

    window.setTimeout(() => {
      resetForm()
      setSubmitting(false)
    }, 2500)
  }

  return (
    <TooltipProvider>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-white p-6"
        aria-label="上传新产品表单"
      >
        <div>
          <h2 className="text-base font-semibold text-ink-900">上传新产品</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            填写工具信息后提交到草稿区,待人工审核后入库。
          </p>
        </div>

        {/* 名称 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-name" className="text-sm font-medium">
            名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="upload-product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如 ChatGPT"
            required
            className="h-10 border border-border rounded-md px-3"
          />
        </div>

        {/* 官网链接 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-url" className="text-sm font-medium">
            官网链接 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="upload-product-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            aria-invalid={url.length > 0 && !isUrlValid}
            className="h-10 border border-border rounded-md px-3"
          />
          {url.length > 0 && !isUrlValid ? (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              需以 http:// 或 https:// 开头
            </p>
          ) : null}
        </div>

        {/* 描述 */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="upload-product-description" className="text-sm font-medium">
              描述
            </Label>
            <span
              className={`text-xs ${
                isDescriptionOverLimit ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="upload-product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话介绍这个 AI 工具的核心能力"
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={4}
            className="border border-border rounded-md px-3 py-2"
          />
        </div>

        {/* 分类 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-category" className="text-sm font-medium">
            分类
          </Label>
          <select
            id="upload-product-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-purple"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 标签 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-tags" className="text-sm font-medium">
            标签
          </Label>
          <Input
            id="upload-product-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="AI, 设计, 办公"
            className="h-10 border border-border rounded-md px-3"
          />
          {tagPreview.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              预览 ({tagPreview.length}): {tagPreview.join(' · ')}
            </p>
          ) : null}
        </div>

        {/* 定价 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-pricing" className="text-sm font-medium">
            定价
          </Label>
          <select
            id="upload-product-pricing"
            value={pricing}
            onChange={(e) => setPricing(e.target.value as ProductPricing)}
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-purple"
          >
            {PRICING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Logo URL + 上传图片(规划中) */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-logo" className="text-sm font-medium">
            Logo URL
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="upload-product-logo"
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-10 flex-1 border border-border rounded-md px-3"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="h-10 shrink-0 cursor-not-allowed border-border bg-gray-100 text-gray-400"
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  上传图片 🚧
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">对象存储规划中</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 联盟链接 */}
        <div className="space-y-1.5">
          <Label htmlFor="upload-product-affiliate" className="text-sm font-medium">
            联盟链接
          </Label>
          <Input
            id="upload-product-affiliate"
            type="text"
            value={affiliate}
            onChange={(e) => setAffiliate(e.target.value)}
            placeholder="https://affiliate.example.com/..."
            className="h-10 border border-border rounded-md px-3"
          />
        </div>

        {/* 状态 */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium">状态</span>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink-900"
              >
                <input
                  type="radio"
                  name="upload-product-status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="h-4 w-4 cursor-pointer accent-brand-purple"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full bg-brand-gradient text-white shadow-sm hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? '已加入草稿区…' : '提交到草稿区'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            提交后请到 <code className="rounded bg-muted px-1 py-0.5">/admin/tools</code> 草稿 tab 审核
          </p>
        </div>
      </form>
    </TooltipProvider>
  )
}
