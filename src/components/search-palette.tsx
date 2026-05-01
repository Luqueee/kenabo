import { useEffect, useRef, useState } from "react"
import { Search, Folder, File, Loader2, CornerDownLeft } from "lucide-react"
import { searchFiles, indexPath, type SearchResult } from "@/lib/fs"

interface Props {
  root: string
  open: boolean
  onClose: () => void
  onNavigate: (path: string) => void
  onOpenFile: (path: string) => void
}

export function SearchPalette({
  root,
  open,
  onClose,
  onNavigate,
  onOpenFile,
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [indexSize, setIndexSize] = useState<number | null>(null)
  const reqIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Reset on open + warm cache
  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery("")
    setResults([])
    setSelected(0)
    setIndexing(true)
    setIndexSize(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false
    indexPath(root)
      .then((n) => {
        if (cancelled) return
        setIndexSize(n)
      })
      .catch((e) => {
        if (cancelled) return
        console.error(e)
      })
      .finally(() => {
        if (!cancelled) setIndexing(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, root])

  // Debounced search; ignore stale responses
  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    const myReq = ++reqIdRef.current
    const timer = window.setTimeout(() => {
      searchFiles(root, query)
        .then((r) => {
          if (myReq !== reqIdRef.current) return
          setResults(r)
          setSelected(0)
        })
        .catch((e) => {
          if (myReq !== reqIdRef.current) return
          console.error(e)
          setResults([])
        })
        .finally(() => {
          if (myReq === reqIdRef.current) setLoading(false)
        })
    }, 40)
    return () => window.clearTimeout(timer)
  }, [query, root, open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, Math.max(results.length - 1, 0)))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const r = results[selected]
        if (r) handleSelect(r)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, results, selected])

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const el = list.querySelector<HTMLElement>(`[data-index="${selected}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selected])

  function handleSelect(r: SearchResult) {
    if (r.is_dir) {
      onNavigate(r.path)
    } else {
      onOpenFile(r.path)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/80 bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              indexing ? "Indexando..." : "Buscar archivos por nombre..."
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {(loading || indexing) && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          )}
          <kbd className="hidden shrink-0 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {!query && !indexing && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {indexSize != null
                ? `${indexSize.toLocaleString()} archivos indexados. Escribe para buscar.`
                : `Escribe para buscar archivos en ${root}`}
            </div>
          )}
          {!query && indexing && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Indexando {root}...
            </div>
          )}
          {query && !loading && results.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Sin resultados
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.path}
              data-index={i}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setSelected(i)}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                i === selected
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground"
              }`}
            >
              {r.is_dir ? (
                <Folder className="h-4 w-4 shrink-0 text-blue-400" />
              ) : (
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="shrink-0 truncate font-medium">{r.name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {r.path}
              </span>
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
            <span>{results.length} resultados</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/60 bg-background px-1 py-0.5 font-mono">
                  ↑↓
                </kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/60 bg-background px-1 py-0.5 font-mono">
                  <CornerDownLeft className="h-3 w-3" />
                </kbd>
                abrir
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
