'use client'

import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'xiaoma_newsletter_subscribers'

interface Subscriber {
  email: string
  subscribedAt: string
}

function getSubscribers(): Subscriber[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addSubscriber(email: string): Subscriber[] {
  const subscribers = getSubscribers()
  subscribers.push({ email, subscribedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers))
  return subscribers
}

function isSubscribed(email: string): boolean {
  return getSubscribers().some((s) => s.email.toLowerCase() === email.toLowerCase())
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

interface NewsletterSignupProps {
  compact?: boolean
  className?: string
}

export function NewsletterSignup({ compact = false, className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const subscribers = getSubscribers()
    if (subscribers.length > 0) {
      setSubscribed(true)
    }
  }, [])

  const handleSubscribe = () => {
    const trimmed = email.trim()

    if (!trimmed) {
      toast({
        title: '请输入邮箱地址',
        description: '邮箱地址不能为空',
        variant: 'destructive',
      })
      return
    }

    if (!isValidEmail(trimmed)) {
      toast({
        title: '邮箱格式不正确',
        description: '请输入有效的邮箱地址，如 example@domain.com',
        variant: 'destructive',
      })
      return
    }

    if (isSubscribed(trimmed)) {
      setSubscribed(true)
      setEmail('')
      toast({
        title: '已订阅',
        description: '该邮箱已经订阅过 AI 工具周刊，无需重复订阅',
      })
      return
    }

    addSubscriber(trimmed)
    setSubscribed(true)
    setEmail('')
    toast({
      title: '订阅成功！',
      description: '你已成功订阅 AI 工具周刊，每周将收到精选内容',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe()
    }
  }

  if (compact) {
    return (
      <div className={cn(className)}>
        {subscribed ? (
          <div className="flex items-center gap-2 rounded-lg border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-sm text-brand-purple">
            <Mail className="size-4" />
            <span>已订阅 AI 工具周刊</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <Mail className="size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入邮箱订阅周刊"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={handleSubscribe}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              订阅
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-brand-purple/[0.03] via-background to-brand-blue/[0.03] p-6 sm:p-8',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
        <div className="mb-4 flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient sm:mb-0 sm:mr-6">
          <Mail className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            AI 工具周刊
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            每周精选 AI 工具与行业动态，直达你的邮箱
          </p>
        </div>
      </div>

      {subscribed ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-brand-purple/20 bg-brand-purple/5 px-4 py-3 text-sm font-medium text-brand-purple">
          <Mail className="size-4" />
          已订阅 AI 工具周刊
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入你的邮箱地址"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleSubscribe}
            className="rounded-lg bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
          >
            订阅
          </button>
        </div>
      )}
    </div>
  )
}