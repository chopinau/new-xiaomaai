"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PROMPT_CATEGORIES } from "@/data/prompts";

export interface SubmittedPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  tags: string;
  submittedAt: string;
  status: "pending";
}

interface SubmitPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

const STORAGE_KEY = "xiaoma_submitted_prompts";

export function getSubmittedPrompts(): SubmittedPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SubmittedPrompt[];
  } catch {
    return [];
  }
}

const categories = PROMPT_CATEGORIES.filter((c) => c !== "全部");

export function SubmitPromptDialog({
  open,
  onOpenChange,
  onSubmitted,
}: SubmitPromptDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "请填写标题",
        description: "提示词标题不能为空",
        variant: "destructive",
      });
      return;
    }
    if (!prompt.trim()) {
      toast({
        title: "请填写内容",
        description: "提示词内容不能为空",
        variant: "destructive",
      });
      return;
    }
    if (!category) {
      toast({
        title: "请选择分类",
        description: "请为提示词选择一个分类",
        variant: "destructive",
      });
      return;
    }

    const newPrompt: SubmittedPrompt = {
      id: Date.now().toString(),
      title: title.trim(),
      prompt: prompt.trim(),
      category,
      tags: tags.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      const existing = getSubmittedPrompts();
      existing.unshift(newPrompt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {
      toast({
        title: "提交失败",
        description: "存储空间不足，请清理后重试",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "提交成功！",
      description: "您的提示词已提交，等待审核通过后展示",
      variant: "success",
    });

    setTitle("");
    setPrompt("");
    setCategory("");
    setTags("");
    onOpenChange(false);
    onSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>提交提示词</DialogTitle>
          <DialogDescription>
            分享您的优质提示词，审核通过后将展示在提示词库中
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="submit-title">标题</Label>
            <Input
              id="submit-title"
              placeholder="请输入提示词标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="submit-prompt">提示词内容</Label>
            <Textarea
              id="submit-prompt"
              placeholder="请输入提示词详细内容"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
            />
          </div>
          <div className="grid gap-2">
            <Label>分类</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="submit-tags">标签（逗号分隔）</Label>
            <Input
              id="submit-tags"
              placeholder="例如：AI, 编程, 效率提升"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}