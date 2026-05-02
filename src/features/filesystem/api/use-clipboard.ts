import { useCallback, useState } from "react"
import type { Clipboard } from "../domain/clipboard"

export function useClipboard() {
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)

  const copy = useCallback(
    (path: string) => setClipboard({ path, op: "copy" }),
    []
  )
  const cut = useCallback(
    (path: string) => setClipboard({ path, op: "cut" }),
    []
  )
  const clear = useCallback(() => setClipboard(null), [])

  return { clipboard, copy, cut, clear }
}
