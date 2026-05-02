import { Search } from "lucide-react"
import type { RefObject } from "react"

interface Props {
  value: string
  onChange: (value: string) => void
  inputRef: RefObject<HTMLInputElement | null>
}

export function FilterBar({ value, onChange, inputRef }: Props) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/40 bg-muted/10 px-4">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filtrar... (/)"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
      />
      {value && (
        <button
          onClick={() => {
            onChange("")
            inputRef.current?.focus()
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}
    </div>
  )
}
