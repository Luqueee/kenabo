import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { AlertCircle, FileText, Folder, FolderOpen, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDirectory } from "@/features/filesystem/api/use-directory"
import { useFileOps } from "@/features/filesystem/api/use-file-ops"
import { useClipboard } from "@/features/filesystem/api/use-clipboard"
import { pathSegments, parentPath, joinPath } from "@/features/filesystem/domain/path"
import { formatSize, formatDate } from "@/shared/lib/format"
import type { FileEntry } from "@/features/filesystem/domain/file-entry"
import type { FileExplorerProps, ContextMenuState } from "../types"
import { FileIcon } from "./file-icon"
import { FileRow } from "./file-row"
import { FileContextMenu } from "./context-menu"
import { Toolbar } from "./toolbar"
import { FilterBar } from "./filter-bar"
import { InlineEditInput } from "./inline-edit-input"
import { DeleteBar } from "./delete-bar"
import { ErrorBar } from "./error-bar"
import { StatusFooter } from "./status-footer"

type InlineMode = null | "rename" | "newFolder" | "newFile"

export function FileExplorer({
  path,
  onNavigate,
  onOpenSearch,
  onAddFavorite,
  isFavorite,
}: FileExplorerProps) {
  const { entries, loading, error, reload } = useDirectory(path)
  const { clipboard, copy, cut, clear: clearClipboard } = useClipboard()
  const ops = useFileOps(reload)

  const [selected, setSelected] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState("")
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null)
  const [draggingEntry, setDraggingEntry] = useState<FileEntry | null>(null)

  const [inlineMode, setInlineMode] = useState<InlineMode>(null)
  const [inlineTarget, setInlineTarget] = useState<string | null>(null)
  const [inlineValue, setInlineValue] = useState("")

  const tableRef = useRef<HTMLDivElement | null>(null)
  const filterRef = useRef<HTMLInputElement | null>(null)
  const pendingSelectRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Reset transient state when path changes
  useEffect(() => {
    setSelected(null)
    setFilterQuery("")
    setInlineMode(null)
    setInlineTarget(null)
    setInlineValue("")
  }, [path])

  const filteredEntries = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.name.toLowerCase().includes(q))
  }, [entries, filterQuery])

  // Auto-select pending entry after creation
  useEffect(() => {
    const name = pendingSelectRef.current
    if (!name || entries.length === 0) return
    const entry = entries.find((e) => e.name === name)
    if (entry) {
      pendingSelectRef.current = null
      setSelected(entry.path)
      tableRef.current
        ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(entry.path)}"]`)
        ?.scrollIntoView({ block: "nearest" })
    }
  }, [entries])

  function startRename(entry: FileEntry) {
    setInlineMode("rename")
    setInlineTarget(entry.path)
    setInlineValue(entry.name)
  }
  function startNewFolder() {
    setInlineMode("newFolder")
    setInlineTarget(null)
    setInlineValue("")
  }
  function startNewFile() {
    setInlineMode("newFile")
    setInlineTarget(null)
    setInlineValue("")
  }
  function cancelInline() {
    setInlineMode(null)
    setInlineTarget(null)
    setInlineValue("")
  }

  async function commitInline() {
    const trimmed = inlineValue.trim()
    if (!trimmed) {
      cancelInline()
      return
    }

    if (inlineMode === "rename" && inlineTarget) {
      const entry = entries.find((e) => e.path === inlineTarget)
      if (!entry || trimmed === entry.name) {
        cancelInline()
        return
      }
      await ops.rename(inlineTarget, trimmed)
    } else if (inlineMode === "newFolder") {
      pendingSelectRef.current = trimmed
      await ops.mkdir(path, trimmed)
    } else if (inlineMode === "newFile") {
      pendingSelectRef.current = trimmed
      await ops.mkfile(path, trimmed)
    }
    cancelInline()
  }

  function handleActivate(entry: FileEntry) {
    if (entry.is_dir) onNavigate(entry.path)
    else ops.open(entry.path)
  }

  function openContextMenu(e: React.MouseEvent, entry: FileEntry | null) {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 210)
    const y = Math.min(e.clientY, window.innerHeight - 240)
    if (entry) setSelected(entry.path)
    setContextMenu({ x, y, entry })
  }

  async function handlePaste() {
    if (!clipboard) return
    await ops.paste(clipboard, path)
    if (clipboard.op === "cut") clearClipboard()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    await ops.remove(target.path)
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const entry = event.active.data.current?.entry as FileEntry | undefined
    if (entry) setDraggingEntry(entry)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggingEntry(null)
    const { active, over } = event
    if (!over) return
    const src = active.data.current?.entry as FileEntry | undefined
    if (!src) return

    const navPath = over.data.current?.navPath as string | undefined
    if (navPath) {
      if (src.path === navPath) return
      if (navPath.startsWith(src.path + "/")) return
      await ops.move(src.path, joinPath(navPath, src.name))
      return
    }

    const dest = over.data.current?.entry as FileEntry | undefined
    if (!dest || !dest.is_dir) return
    if (src.path === dest.path) return
    if (src.path.startsWith(dest.path + "/")) return
    await ops.move(src.path, joinPath(dest.path, src.name))
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA"
      const inFilter = inInput && target === filterRef.current

      if (e.key === "Escape") {
        if (contextMenu) return setContextMenu(null)
        if (deleteTarget) return setDeleteTarget(null)
        if (inlineMode) return cancelInline()
        if (inFilter) {
          setFilterQuery("")
          filterRef.current?.blur()
          return
        }
      }

      if (e.key === "/" && !inInput) {
        e.preventDefault()
        filterRef.current?.focus()
        return
      }

      if (inInput) return
      if (contextMenu) return

      const isCmd = e.metaKey || e.ctrlKey
      const selEntry = selected ? entries.find((en) => en.path === selected) : null

      if (isCmd && e.key === "c" && selEntry) {
        e.preventDefault()
        copy(selEntry.path)
        return
      }
      if (isCmd && e.key === "x" && selEntry) {
        e.preventDefault()
        cut(selEntry.path)
        return
      }
      if (isCmd && e.key === "v" && clipboard) {
        e.preventDefault()
        handlePaste()
        return
      }

      if (e.key === "F2" && selEntry) {
        e.preventDefault()
        startRename(selEntry)
        return
      }

      if (e.key === "Delete" && selEntry) {
        e.preventDefault()
        setDeleteTarget(selEntry)
        return
      }

      if (filteredEntries.length === 0) return
      const idx = selected
        ? filteredEntries.findIndex((en) => en.path === selected)
        : -1

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = filteredEntries[Math.min(idx + 1, filteredEntries.length - 1)]
        if (next) {
          setSelected(next.path)
          tableRef.current
            ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(next.path)}"]`)
            ?.scrollIntoView({ block: "nearest" })
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev = filteredEntries[Math.max(idx - 1, 0)]
        if (prev) {
          setSelected(prev.path)
          tableRef.current
            ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(prev.path)}"]`)
            ?.scrollIntoView({ block: "nearest" })
        }
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selEntry) handleActivate(selEntry)
      } else if (e.key === "Backspace" || e.key === "ArrowLeft") {
        const par = parentPath(path)
        if (par) onNavigate(par)
      } else if (e.key === "ArrowRight") {
        if (selEntry?.is_dir) onNavigate(selEntry.path)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredEntries,
    entries,
    selected,
    path,
    onNavigate,
    contextMenu,
    inlineMode,
    clipboard,
    deleteTarget,
  ])

  const segments = pathSegments(path)
  const parent = parentPath(path)
  const dirCount = filteredEntries.filter((e) => e.is_dir).length
  const fileCount = filteredEntries.length - dirCount
  const showTable =
    filteredEntries.length > 0 ||
    inlineMode === "newFolder" ||
    inlineMode === "newFile"

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingEntry(null)}
    >
      <div className="flex h-full flex-col overflow-hidden bg-[#0f0f0f]">
        <Toolbar
          segments={segments}
          parent={parent}
          loading={loading}
          isFavorite={isFavorite}
          isDragging={draggingEntry !== null}
          onNavigate={onNavigate}
          onRefresh={reload}
          onAddFavorite={() => onAddFavorite(path)}
          onOpenSearch={onOpenSearch}
        />

        {(filterQuery || entries.length > 0) && (
          <FilterBar
            value={filterQuery}
            onChange={setFilterQuery}
            inputRef={filterRef}
          />
        )}

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

        <DragOverlay>
          {draggingEntry && (
            <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-popover px-3 py-1.5 text-sm shadow-lg">
              <FileIcon
                name={draggingEntry.name}
                isDir={draggingEntry.is_dir}
                extension={draggingEntry.extension}
              />
              <span className="max-w-48 truncate">{draggingEntry.name}</span>
            </div>
          )}
        </DragOverlay>

        {deleteTarget && (
          <DeleteBar
            target={deleteTarget}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {ops.opError && (
          <ErrorBar message={ops.opError} onDismiss={ops.clearError} />
        )}

        <StatusFooter
          path={path}
          loading={loading}
          error={error}
          dirCount={dirCount}
          fileCount={fileCount}
          totalCount={entries.length}
          filterQuery={filterQuery}
          clipboard={clipboard}
        />

        {contextMenu && (
          <FileContextMenu
            contextMenu={contextMenu}
            clipboard={clipboard}
            onClose={() => setContextMenu(null)}
            onActivate={handleActivate}
            onCopy={(entry) => copy(entry.path)}
            onCut={(entry) => cut(entry.path)}
            onPaste={handlePaste}
            onRename={startRename}
            onDelete={(entry) => setDeleteTarget(entry)}
            onNewFolder={startNewFolder}
            onNewFile={startNewFile}
          />
        )}
      </div>
    </DndContext>
  )
}
