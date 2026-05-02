import type { ReactNode } from "react"
import { HotkeysProvider } from "@tanstack/react-hotkeys"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HotkeyBindingsProvider } from "@/features/hotkeys/bindings"

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return (
    <HotkeysProvider>
      <HotkeyBindingsProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </HotkeyBindingsProvider>
    </HotkeysProvider>
  )
}
