"use client";

import { TopNav } from "@/components/TopNav";

export default function CanvasPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      <iframe
        src="/canvas-assets/index.html"
        className="w-full min-h-[calc(100vh-56px)] border-0"
        title="小马AI画布"
      />
    </div>
  );
}