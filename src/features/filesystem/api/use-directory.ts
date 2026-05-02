import { useCallback, useEffect, useState } from "react"
import { fsGateway } from "../infra/fs.gateway"
import type { FileEntry } from "../domain/file-entry"
import { fsErrorMessage } from "../domain/fs-error"
import { logger } from "@/shared/lib/logger"

const PAGE_SIZE = 2_000

export function useDirectory(path: string) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: string, off = 0) => {
    setLoading(true)
    if (off === 0) setError(null)
    try {
      const page = await fsGateway.list(p, { limit: PAGE_SIZE, offset: off })
      setEntries((prev) => off === 0 ? page.entries : [...prev, ...page.entries])
      setTotal(page.total)
      setOffset(off + page.entries.length)
    } catch (e) {
      setError(fsErrorMessage(e))
      if (off === 0) setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(path, 0)
  }, [path, load])

  const reload = useCallback(() => {
    setOffset(0)
    return load(path, 0)
  }, [path, load])

  const loadMore = useCallback(() => {
    return load(path, offset)
  }, [path, offset, load])

  const hasMore = offset < total

  /** Inject entries directly from a batch op result — skips a reload() IPC call. */
  const setEntriesFromPage = useCallback(
    (fresh: FileEntry[], freshTotal: number) => {
      setEntries(fresh)
      setTotal(freshTotal)
      setOffset(fresh.length)
      setError(null)
    },
    []
  )

  return { entries, loading, error, reload, total, hasMore, loadMore, setEntriesFromPage }
}

export function useHomeDir() {
  const [home, setHome] = useState<string | null>(null)
  useEffect(() => {
    fsGateway.home().then(setHome).catch((e) => logger.error("home failed", e))
  }, [])
  return home
}
