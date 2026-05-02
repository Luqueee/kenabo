import { Search } from "lucide-react"
import { useFileExplorer } from "../state/explorer-context"

export function FilterBar() {
  const { filterQuery, setFilterQuery, filterRef, entries } = useFileExplorer()

  if (!filterQuery && entries.length === 0) return null

  return (
    <div className="flex h-9 w-full shrink-0 items-center gap-2 border-b border-border/40 bg-muted/10 px-4">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <input
        ref={filterRef}
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        placeholder="Filtrar... (/)"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
      />
      {filterQuery && (
        <button
          onClick={() => {
            setFilterQuery("")
            filterRef.current?.focus()
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}
    </div>
  )
}
