import { useCallback, useEffect, useState } from "react"
import { fsGateway } from "../infra/fs.gateway"
import type { FileEntry } from "../domain/file-entry"

export function useDirectory(path: string) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fsGateway.list(p)
      setEntries(result)
    } catch (e) {
      setError(String(e))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(path)
  }, [path, load])

  const reload = useCallback(() => load(path), [path, load])

  return { entries, loading, error, reload }
}

export function useHomeDir() {
  const [home, setHome] = useState<string | null>(null)
  useEffect(() => {
    fsGateway.home().then(setHome).catch(console.error)
  }, [])
  return home
}
