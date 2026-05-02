import type { CSSProperties, ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return (
    <TooltipProvider>
      <SidebarProvider
        className="h-svh overflow-hidden"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  )
}
