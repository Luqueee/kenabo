import { useEffect, useState, useCallback, useRef, useMemo } from "react"
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
import {
  AlertCircle,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
} from "lucide-react"
import {
  listDirectory,
  openFile,
  createDir,
  createFile,
  renameEntry,
  deleteEntry,
  copyEntry,
  moveEntry,
  clearSearchIndex,
  type FileEntry,
} from "@/lib/fs"
import { Button } from "@/components/ui/button"
import type { Props, ContextMenuState, Clipboard } from "./types"
import {
  pathSegments,
  parentPath,
  uniqueDestPath,
  formatSize,
  formatDate,
} from "./utils"
import { FileIcon } from "./file-icon"
import { FileRow } from "./file-row"
import { FileContextMenu } from "./context-menu"
import { Toolbar } from "./toolbar"

export function FileExplorer({
  path,
  onNavigate,
  onOpenSearch,
  onAddFavorite,
  isFavorite,
}: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState("")

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null)
  const [opError, setOpError] = useState<string | null>(null)

  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const newFolderInputRef = useRef<HTMLInputElement | null>(null)

  const [creatingFile, setCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const newFileInputRef = useRef<HTMLInputElement | null>(null)

  const [draggingEntry, setDraggingEntry] = useState<FileEntry | null>(null)

  const tableRef = useRef<HTMLDivElement | null>(null)
  const filterRef = useRef<HTMLInputElement | null>(null)
  const pendingSelectRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  const filteredEntries = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.name.toLowerCase().includes(q))
  }, [entries, filterQuery])

  const load = useCallback(async (p: string) => {
    setLoading(true)
    setError(null)
    setSelected(null)
    setFilterQuery("")
    setCreatingFolder(false)
    setCreatingFile(false)
    setRenaming(null)
    try {
      const result = await listDirectory(p)
      setEntries(result)
    } catch (e) {
      setError(String(e))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(path)
  }, [path, load])

  useEffect(() => {
    if (renaming) {
      setTimeout(() => {
        renameInputRef.current?.select()
      }, 0)
    }
  }, [renaming])

  useEffect(() => {
    if (creatingFolder) {
      setTimeout(() => {
        newFolderInputRef.current?.focus()
      }, 0)
    }
  }, [creatingFolder])

  useEffect(() => {
    if (creatingFile) {
      setTimeout(() => {
        newFileInputRef.current?.focus()
      }, 0)
    }
  }, [creatingFile])

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

  async function mutate() {
    await clearSearchIndex().catch(() => {})
    await load(path)
  }

  function handleDelete(entry: FileEntry) {
    setDeleteTarget(entry)
    setOpError(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteEntry(target.path)
      await mutate()
    } catch (e) {
      setOpError(String(e))
    }
  }

  async function commitRename() {
    if (!renaming || !renameValue.trim()) {
      setRenaming(null)
      return
    }
    const trimmed = renameValue.trim()
    const entry = entries.find((e) => e.path === renaming)
    if (!entry || trimmed === entry.name) {
      setRenaming(null)
      return
    }
    try {
      await renameEntry(renaming, trimmed)
      setRenaming(null)
      await mutate()
    } catch (e) {
      alert(String(e))
      setRenaming(null)
    }
  }

  async function commitNewFile() {
    const name = newFileName.trim()
    if (!name) {
      setCreatingFile(false)
      setNewFileName("")
      return
    }
    try {
      await createFile(`${path}/${name}`)
      setCreatingFile(false)
      setNewFileName("")
      pendingSelectRef.current = name
      await mutate()
    } catch (e) {
      alert(String(e))
      setCreatingFile(false)
      setNewFileName("")
    }
  }

  async function commitNewFolder() {
    const name = newFolderName.trim()
    if (!name) {
      setCreatingFolder(false)
      setNewFolderName("")
      return
    }
    try {
      await createDir(`${path}/${name}`)
      setCreatingFolder(false)
      setNewFolderName("")
      pendingSelectRef.current = name
      await mutate()
    } catch (e) {
      alert(String(e))
      setCreatingFolder(false)
      setNewFolderName("")
    }
  }

  async function handlePaste() {
    if (!clipboard) return
    const srcName = clipboard.path.split("/").at(-1) ?? "archivo"
    const dest = uniqueDestPath(path, srcName)
    try {
      if (clipboard.op === "cut") {
        await moveEntry(clipboard.path, dest)
        setClipboard(null)
      } else {
        await copyEntry(clipboard.path, dest)
      }
      await mutate()
    } catch (e) {
      alert(String(e))
    }
  }

  function openContextMenu(e: React.MouseEvent, entry: FileEntry | null) {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 210)
    const y = Math.min(e.clientY, window.innerHeight - 240)
    if (entry) setSelected(entry.path)
    setContextMenu({ x, y, entry })
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  function handleActivate(entry: FileEntry) {
    if (entry.is_dir) onNavigate(entry.path)
    else openFile(entry.path).catch(console.error)
  }

  // ── DnD handlers ────────────────────────────────────────────────────────────

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

    // Drop on nav zone (up button or breadcrumb segment)
    const navPath = over.data.current?.navPath as string | undefined
    if (navPath) {
      if (src.path === navPath) return
      if (navPath.startsWith(src.path + "/")) return
      try {
        await moveEntry(src.path, navPath + "/" + src.name)
        await mutate()
      } catch (e) {
        setOpError(String(e))
      }
      return
    }

    // Drop on a folder entry
    const dest = over.data.current?.entry as FileEntry | undefined
    if (!dest || !dest.is_dir) return
    if (src.path === dest.path) return
    if (src.path.startsWith(dest.path + "/")) return

    try {
      await moveEntry(src.path, dest.path + "/" + src.name)
      await mutate()
    } catch (e) {
      setOpError(String(e))
    }
  }

  function handleDragCancel() {
    setDraggingEntry(null)
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const inInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA"
      const inFilter = inInput && target === filterRef.current

      if (e.key === "Escape") {
        if (contextMenu) {
          closeContextMenu()
          return
        }
        if (deleteTarget) {
          setDeleteTarget(null)
          return
        }
        if (renaming) {
          setRenaming(null)
          return
        }
        if (creatingFolder) {
          setCreatingFolder(false)
          setNewFolderName("")
          return
        }
        if (creatingFile) {
          setCreatingFile(false)
          setNewFileName("")
          return
        }
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
      const selEntry = selected
        ? entries.find((en) => en.path === selected)
        : null

      if (isCmd && e.key === "c" && selEntry) {
        e.preventDefault()
        setClipboard({ path: selEntry.path, op: "copy" })
        return
      }
      if (isCmd && e.key === "x" && selEntry) {
        e.preventDefault()
        setClipboard({ path: selEntry.path, op: "cut" })
        return
      }
      if (isCmd && e.key === "v" && clipboard) {
        e.preventDefault()
        handlePaste()
        return
      }

      if (e.key === "F2" && selEntry) {
        e.preventDefault()
        setRenameValue(selEntry.name)
        setRenaming(selEntry.path)
        return
      }

      if (
        (e.key === "Delete" || (e.key === "Backspace" && selEntry)) &&
        selEntry
      ) {
        if (e.key === "Delete") {
          e.preventDefault()
          handleDelete(selEntry)
          return
        }
      }

      if (filteredEntries.length === 0) return
      const idx = selected
        ? filteredEntries.findIndex((en) => en.path === selected)
        : -1

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next =
          filteredEntries[Math.min(idx + 1, filteredEntries.length - 1)]
        if (next) {
          setSelected(next.path)
          tableRef.current
            ?.querySelector<HTMLElement>(
              `[data-path="${CSS.escape(next.path)}"]`
            )
            ?.scrollIntoView({ block: "nearest" })
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev = filteredEntries[Math.max(idx - 1, 0)]
        if (prev) {
          setSelected(prev.path)
          tableRef.current
            ?.querySelector<HTMLElement>(
              `[data-path="${CSS.escape(prev.path)}"]`
            )
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
    renaming,
    creatingFolder,
    creatingFile,
    clipboard,
    deleteTarget,
  ])

  const segments = pathSegments(path)
  const parent = parentPath(path)
  const dirCount = filteredEntries.filter((e) => e.is_dir).length
  const fileCount = filteredEntries.length - dirCount

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col overflow-hidden bg-[#0f0f0f]">
        <Toolbar
          path={path}
          segments={segments}
          parent={parent}
          loading={loading}
          isFavorite={isFavorite}
          isDragging={draggingEntry !== null}
          onNavigate={onNavigate}
          onRefresh={() => load(path)}
          onAddFavorite={() => onAddFavorite(path)}
          onOpenSearch={onOpenSearch}
        />

        {(filterQuery || entries.length > 0) && (
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/40 bg-muted/10 px-4">
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
              <Button variant="outline" size="sm" onClick={() => load(path)}>
                Reintentar
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            entries.length === 0 &&
            !creatingFolder &&
            !creatingFile && (
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

          {!error &&
            (filteredEntries.length > 0 || creatingFolder || creatingFile) && (
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
                  {creatingFolder && (
                    <tr className="border-b border-border/30 bg-accent/30">
                      <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                        <Folder className="h-4 w-4 shrink-0 fill-blue-400/30 text-blue-400" />
                        <input
                          ref={newFolderInputRef}
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onBlur={commitNewFolder}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              commitNewFolder()
                            }
                            if (e.key === "Escape") {
                              e.preventDefault()
                              setCreatingFolder(false)
                              setNewFolderName("")
                            }
                          }}
                          placeholder="Nueva carpeta"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          className="flex-1 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-sm outline-none"
                        />
                      </td>
                      <td />
                      <td />
                    </tr>
                  )}

                  {creatingFile && (
                    <tr className="border-b border-border/30 bg-accent/30">
                      <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                          ref={newFileInputRef}
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onBlur={commitNewFile}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              commitNewFile()
                            }
                            if (e.key === "Escape") {
                              e.preventDefault()
                              setCreatingFile(false)
                              setNewFileName("")
                            }
                          }}
                          placeholder="nombre.extensión"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          className="flex-1 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-sm outline-none"
                        />
                      </td>
                      <td />
                      <td />
                    </tr>
                  )}

                  {filteredEntries.map((entry) => {
                    const isSelected = selected === entry.path
                    const isRenaming = renaming === entry.path
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
                        onDoubleClick={() =>
                          !isRenaming && handleActivate(entry)
                        }
                        onContextMenu={(e) => openContextMenu(e, entry)}
                      >
                        <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                          <FileIcon entry={entry} />
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  commitRename()
                                }
                                if (e.key === "Escape") {
                                  e.preventDefault()
                                  setRenaming(null)
                                }
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              className="flex-1 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-sm outline-none"
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
              <FileIcon entry={draggingEntry} />
              <span className="max-w-48 truncate">{draggingEntry.name}</span>
            </div>
          )}
        </DragOverlay>

        {deleteTarget && (
          <div className="flex shrink-0 items-center gap-3 border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
            <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
            <span className="flex-1 truncate">
              ¿Eliminar <strong>{deleteTarget.name}</strong>? No se puede
              deshacer.
            </span>
            <button
              onClick={confirmDelete}
              className="text-destructive-foreground rounded bg-destructive px-3 py-1 text-xs font-medium hover:bg-destructive/90"
            >
              Eliminar
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        )}

        {opError && (
          <div className="flex shrink-0 items-center gap-3 border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{opError}</span>
            <button
              onClick={() => setOpError(null)}
              className="text-xs hover:opacity-70"
            >
              ✕
            </button>
          </div>
        )}

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
                {dirCount} {dirCount === 1 ? "carpeta" : "carpetas"} ·{" "}
                {fileCount} {fileCount === 1 ? "archivo" : "archivos"}
                {filterQuery && ` (filtrado de ${entries.length})`}
              </>
            )}
          </span>
          <span className="font-mono opacity-70">{path}</span>
        </footer>

        {contextMenu && (
          <FileContextMenu
            contextMenu={contextMenu}
            clipboard={clipboard}
            onClose={closeContextMenu}
            onActivate={handleActivate}
            onCopy={(entry) => setClipboard({ path: entry.path, op: "copy" })}
            onCut={(entry) => setClipboard({ path: entry.path, op: "cut" })}
            onPaste={handlePaste}
            onRename={(entry) => {
              setRenameValue(entry.name)
              setRenaming(entry.path)
            }}
            onDelete={handleDelete}
            onNewFolder={() => {
              setCreatingFolder(true)
              setNewFolderName("")
            }}
            onNewFile={() => {
              setCreatingFile(true)
              setNewFileName("")
            }}
          />
        )}
      </div>
    </DndContext>
  )
}
