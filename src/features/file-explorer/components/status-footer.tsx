import { useFileExplorer } from "../state/explorer-context"

export function StatusFooter() {
  const {
    path,
    loading,
    error,
    dirCount,
    fileCount,
    totalCount,
    filterQuery,
    clipboard,
  } = useFileExplorer()

  return (
    <footer className="flex h-7 w-full shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-4 text-[11px] text-muted-foreground">
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
