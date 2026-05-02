import type { Clipboard } from "@/features/filesystem/domain/clipboard"

interface Props {
  path: string
  loading: boolean
  error: string | null
  dirCount: number
  fileCount: number
  totalCount: number
  filterQuery: string
  clipboard: Clipboard | null
}

export function StatusFooter({
  path,
  loading,
  error,
  dirCount,
  fileCount,
  totalCount,
  filterQuery,
  clipboard,
}: Props) {
  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-4 text-[11px] text-muted-foreground">
      <span>
        {!loading && !error && (
          <>
            {clipboard && (
              <span className="mr-3 text-primary">
                {clipboard.op === "copy" ? "Copiado" : "Cortado"}:{" "}
                {clipboard.path.split("/").at(-1)}
              </span>
            )}
            {dirCount} {dirCount === 1 ? "carpeta" : "carpetas"} · {fileCount}{" "}
            {fileCount === 1 ? "archivo" : "archivos"}
            {filterQuery && ` (filtrado de ${totalCount})`}
          </>
        )}
      </span>
      <span className="font-mono opacity-70">{path}</span>
    </footer>
  )
}
