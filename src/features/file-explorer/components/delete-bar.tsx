import { Trash2 } from "lucide-react"
import type { FileEntry } from "@/features/filesystem/domain/file-entry"

interface Props {
  target: FileEntry
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteBar({ target, onConfirm, onCancel }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
      <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
      <span className="flex-1 truncate">
        ¿Eliminar <strong>{target.name}</strong>? No se puede deshacer.
      </span>
      <button
        onClick={onConfirm}
        className="text-destructive-foreground rounded bg-destructive px-3 py-1 text-xs font-medium hover:bg-destructive/90"
      >
        Eliminar
      </button>
      <button
        onClick={onCancel}
        className="rounded px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        Cancelar
      </button>
    </div>
  )
}
