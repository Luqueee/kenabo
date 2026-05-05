import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InputDialogProvider } from "@/components/ui/input-dialog"

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return (
    <TooltipProvider>
      {children}
      <InputDialogProvider />
    </TooltipProvider>
  )
}
