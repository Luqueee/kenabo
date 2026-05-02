import { useEffect, useRef, useState } from "react"
import { fsGateway } from "@/features/filesystem/infra/fs.gateway"
import type { SearchResult } from "@/features/filesystem/domain/file-entry"
import { logger } from "@/shared/lib/logger"

export function useSearchIndex(root: string, enabled: boolean) {
  const [indexing, setIndexing] = useState(false)
  const [size, setSize] = useState<number | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    setIndexing(true)
    setSize(null)
    const myReq = ++reqRef.current
    fsGateway
      .index(root)
      .then((n) => {
        if (myReq !== reqRef.current) return
        setSize(n)
      })
      .catch((e) => {
        if (myReq !== reqRef.current) return
        logger.error("index failed", e)
      })
      .finally(() => {
        if (myReq === reqRef.current) setIndexing(false)
      })
    return () => {
      // Bump req to discard pending callbacks, clear loading.
      reqRef.current++
      setIndexing(false)
    }
  }, [root, enabled])

  return { indexing, size }
}

export function useSearch(root: string, query: string, enabled: boolean) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const reqIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setResults([])
      setLoading(false)
      return
    }
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const myReq = ++reqIdRef.current
    const timer = window.setTimeout(() => {
      if (myReq !== reqIdRef.current) return
      fsGateway
        .search(root, query)
        .then((r) => {
          if (myReq !== reqIdRef.current) return
          setResults(r)
        })
        .catch((e) => {
          if (myReq !== reqIdRef.current) return
          logger.error("search failed", e)
          setResults([])
        })
        .finally(() => {
          if (myReq === reqIdRef.current) setLoading(false)
        })
    }, 40)
    return () => {
      window.clearTimeout(timer)
      // Discard pending IPC callbacks + clear loading for this query.
      reqIdRef.current++
      setLoading(false)
    }
  }, [root, query, enabled])

  return { results, loading }
}
