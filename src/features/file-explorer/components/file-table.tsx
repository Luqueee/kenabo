import { AlertCircle, FileText, Folder, FolderOpen, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatSize, formatDate } from "@/shared/lib/format"
import { useFileExplorer } from "../state/explorer-context"
import { FileIcon } from "./file-icon"
import { FileRow } from "./file-row"
import { InlineEditInput } from "./inline-edit-input"

export function FileTable() {
  const {
    entries,
    filteredEntries,
    loading,
    error,
    reload,
    selected,
    setSelected,
    filterQuery,
    tableRef,
    clipboard,
    inlineMode,
    inlineTarget,
    inlineValue,
    setInlineValue,
    commitInline,
    cancelInline,
    handleActivate,
    openContextMenu,
  } = useFileExplorer()

  const showTable =
    filteredEntries.length > 0 ||
    inlineMode === "newFolder" ||
    inlineMode === "newFile"

  return (
    <div
      ref={tableRef}
      className="flex-1 overflow-auto"
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-path]")) return
        openContextMenu(e, null)
      }}
    >
      {loading && entries.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="max-w-md text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading &&
        !error &&
        entries.length === 0 &&
        inlineMode !== "newFolder" &&
        inlineMode !== "newFile" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FolderOpen className="h-8 w-8 opacity-50" />
            <p className="text-sm">Directorio vacío</p>
          </div>
        )}

      {!loading &&
        !error &&
        entries.length > 0 &&
        filteredEntries.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Search className="h-8 w-8 opacity-50" />
            <p className="text-sm">Sin resultados para "{filterQuery}"</p>
          </div>
        )}

      {!error && showTable && (
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Nombre
              </th>
              <th className="w-28 px-4 py-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Tamaño
              </th>
              <th className="w-36 px-4 py-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Modificado
              </th>
            </tr>
          </thead>
          <tbody>
            {inlineMode === "newFolder" && (
              <tr className="border-b border-border/30 bg-accent/30">
                <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                  <Folder className="h-4 w-4 shrink-0 fill-blue-400/30 text-blue-400" />
                  <InlineEditInput
                    value={inlineValue}
                    onChange={setInlineValue}
                    onCommit={commitInline}
                    onCancel={cancelInline}
                    placeholder="Nueva carpeta"
                  />
                </td>
                <td />
                <td />
              </tr>
            )}

            {inlineMode === "newFile" && (
              <tr className="border-b border-border/30 bg-accent/30">
                <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <InlineEditInput
                    value={inlineValue}
                    onChange={setInlineValue}
                    onCommit={commitInline}
                    onCancel={cancelInline}
                    placeholder="nombre.extensión"
                  />
                </td>
                <td />
                <td />
              </tr>
            )}

            {filteredEntries.map((entry) => {
              const isSelected = selected === entry.path
              const isRenaming =
                inlineMode === "rename" && inlineTarget === entry.path
              const isCut =
                clipboard?.op === "cut" && clipboard.path === entry.path

              return (
                <FileRow
                  key={entry.path}
                  entry={entry}
                  isSelected={isSelected}
                  isCut={isCut}
                  isRenaming={isRenaming}
                  onClick={() => setSelected(entry.path)}
                  onDoubleClick={() => !isRenaming && handleActivate(entry)}
                  onContextMenu={(e) => openContextMenu(e, entry)}
                >
                  <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                    <FileIcon
                      name={entry.name}
                      isDir={entry.is_dir}
                      extension={entry.extension}
                    />
                    {isRenaming ? (
                      <InlineEditInput
                        value={inlineValue}
                        onChange={setInlineValue}
                        onCommit={commitInline}
                        onCancel={cancelInline}
                        autoSelect
                      />
                    ) : (
                      <span className="truncate">{entry.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
                    {entry.is_dir ? "—" : formatSize(entry.size)}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {formatDate(entry.modified)}
                  </td>
                </FileRow>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
