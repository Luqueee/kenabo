import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return <TooltipProvider>{children}</TooltipProvider>
}
