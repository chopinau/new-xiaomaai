import { Suspense } from 'react'
import ToolsContent from './ToolsContent'

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ToolsContent />
    </Suspense>
  )
}
