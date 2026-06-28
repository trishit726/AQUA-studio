"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { EditorProvider } from "@/components/editor/editor-provider"
import { EditorShell } from "@/components/editor/editor-shell"

export default function Page() {
  return (
    <TooltipProvider delayDuration={300}>
      <EditorProvider>
        <EditorShell />
      </EditorProvider>
    </TooltipProvider>
  )
}
