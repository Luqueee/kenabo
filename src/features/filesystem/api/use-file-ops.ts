import { useCallback, useState } from "react"
import { fsGateway } from "../infra/fs.gateway"
import { joinPath } from "../domain/path"
import type { Clipboard } from "../domain/clipboard"

export function useFileOps(onMutate: () => Promise<void> | void) {
  const [opError, setOpError] = useState<string | null>(null)

  const wrap = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action()
        await fsGateway.clearIndex().catch(() => {})
        await onMutate()
      } catch (e) {
        setOpError(String(e))
      }
    },
    [onMutate]
  )

  return {
    opError,
    clearError: () => setOpError(null),
    rename: (src: string, newName: string) =>
      wrap(() => fsGateway.rename(src, newName)),
    remove: (path: string) => wrap(() => fsGateway.delete(path)),
    mkdir: (parent: string, name: string) =>
      wrap(() => fsGateway.mkdir(joinPath(parent, name))),
    mkfile: (parent: string, name: string) =>
      wrap(() => fsGateway.mkfile(joinPath(parent, name))),
    paste: (clipboard: Clipboard, destDir: string) =>
      wrap(async () => {
        const srcName = clipboard.path.split("/").at(-1) ?? "archivo"
        const dest = joinPath(destDir, srcName)
        if (clipboard.op === "cut") await fsGateway.move(clipboard.path, dest)
        else await fsGateway.copy(clipboard.path, dest)
      }),
    move: (src: string, dest: string) => wrap(() => fsGateway.move(src, dest)),
    open: (path: string) => fsGateway.open(path).catch(console.error),
  }
}
