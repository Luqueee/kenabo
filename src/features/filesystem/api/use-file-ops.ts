import { useCallback, useState } from "react"
import { fsGateway } from "../infra/fs.gateway"
import { joinPath } from "../domain/path"
import type { Clipboard } from "../domain/clipboard"
import { fsErrorMessage } from "../domain/fs-error"
import { logger } from "@/shared/lib/logger"
import type { useUndoStack } from "./use-undo-stack"

type UndoStack = ReturnType<typeof useUndoStack>

export function useFileOps(
  onMutate: () => Promise<void> | void,
  undoStack: UndoStack
) {
  const [opError, setOpError] = useState<string | null>(null)

  const wrap = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action()
        await fsGateway.clearIndex().catch(() => {})
        await onMutate()
      } catch (e) {
        setOpError(fsErrorMessage(e))
      }
    },
    [onMutate]
  )

  return {
    opError,
    clearError: () => setOpError(null),

    rename: (src: string, newName: string) =>
      wrap(async () => {
        const parentDir = src.slice(0, src.lastIndexOf("/"))
        const newPath = `${parentDir}/${newName}`
        await fsGateway.rename(src, newName)
        undoStack.push({ type: "rename", oldPath: src, newPath })
      }),

    remove: (path: string) => wrap(() => fsGateway.delete(path)),

    mkdir: (parent: string, name: string) =>
      wrap(() => fsGateway.mkdir(joinPath(parent, name))),

    mkfile: (parent: string, name: string) =>
      wrap(() => fsGateway.mkfile(joinPath(parent, name))),

    paste: (clipboard: Clipboard, destDir: string) =>
      wrap(async () => {
        const moves: Array<{ from: string; to: string }> = []
        for (const src of clipboard.paths) {
          const srcName = src.split("/").at(-1) ?? "archivo"
          const dest = joinPath(destDir, srcName)
          if (clipboard.op === "cut") {
            await fsGateway.move(src, dest)
            moves.push({ from: src, to: dest })
          } else {
            await fsGateway.copy(src, dest)
          }
        }
        if (clipboard.op === "cut" && moves.length > 0) {
          undoStack.push({ type: "move", moves })
        }
      }),

    move: (src: string, dest: string) =>
      wrap(async () => {
        await fsGateway.move(src, dest)
        undoStack.push({ type: "move", moves: [{ from: src, to: dest }] })
      }),

    removeMany: (paths: string[]) =>
      wrap(async () => {
        for (const p of paths) await fsGateway.delete(p)
      }),

    open: (path: string) =>
      fsGateway.open(path).catch((e) => logger.error("open failed", e)),
  }
}
