"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Upload, Workflow } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { getWorkflowBySlug } from "@/data/workflows";

function FlowToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template");
  const template = templateSlug ? getWorkflowBySlug(templateSlug) : undefined;

  return (
    <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
      {/* 左侧：返回 + 标题 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/workflows")}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="返回工作流模板库"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">返回</span>
        </button>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-brand-purple" />
          <h1 className="text-sm font-semibold text-foreground">工作流画布</h1>
          {template && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium text-brand-purple">
                {template.title}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 右侧：导入/导出按钮 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-purple/40 hover:text-brand-purple"
          title="导入工作流"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">导入</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
          title="导出工作流"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">导出</span>
        </button>
      </div>
    </div>
  );
}

function FlowToolbarFallback() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">返回</span>
        </div>
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-brand-purple" />
          <h1 className="text-sm font-semibold text-foreground">工作流画布</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 animate-shimmer rounded-lg" />
        <div className="h-8 w-16 animate-shimmer rounded-lg" />
      </div>
    </div>
  );
}

export default function FlowPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      <Suspense fallback={<FlowToolbarFallback />}>
        <FlowToolbar />
      </Suspense>

      <iframe
        src="/canvas-assets/flow.html"
        className="w-full min-h-[calc(100vh-112px)] border-0"
        title="小马AI · 节点画布"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}