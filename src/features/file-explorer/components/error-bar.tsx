import { AlertCircle } from "lucide-react"

interface Props {
  message: string
  onDismiss: () => void
}

export function ErrorBar({ message, onDismiss }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{message}</span>
      <button onClick={onDismiss} className="text-xs hover:opacity-70">
        ✕
      </button>
    </div>
  )
}
