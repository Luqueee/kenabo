import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react"
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
import { useDirectory } from "@/features/filesystem/api/use-directory"
import { useFileOps } from "@/features/filesystem/api/use-file-ops"
import { useClipboard } from "@/features/filesystem/api/use-clipboard"
import {
  pathSegments,
  parentPath,
  joinPath,
  type PathSegment,
} from "@/features/filesystem/domain/path"
import type { FileEntry } from "@/features/filesystem/domain/file-entry"
import type { Clipboard } from "@/features/filesystem/domain/clipboard"
import type { ContextMenuState } from "../types"
import { FileIcon } from "../components/file-icon"

export type InlineMode = null | "rename" | "newFolder" | "newFile"

interface Value {
  path: string
  onNavigate: (path: string) => void
  onOpenSearch: () => void
  onAddFavorite: (path: string) => void
  isFavorite: boolean

  entries: FileEntry[]
  filteredEntries: FileEntry[]
  loading: boolean
  error: string | null
  reload: () => void

  selected: string | null
  setSelected: (p: string | null) => void

  filterQuery: string
  setFilterQuery: (q: string) => void
  filterRef: RefObject<HTMLInputElement | null>
  tableRef: RefObject<HTMLDivElement | null>

  clipboard: Clipboard | null
  copy: (path: string) => void
  cut: (path: string) => void

  opError: string | null
  clearOpError: () => void

  inlineMode: InlineMode
  inlineTarget: string | null
  inlineValue: string
  setInlineValue: (v: string) => void
  startRename: (entry: FileEntry) => void
  startNewFolder: () => void
  startNewFile: () => void
  cancelInline: () => void
  commitInline: () => Promise<void>

  contextMenu: ContextMenuState | null
  openContextMenu: (e: ReactMouseEvent, entry: FileEntry | null) => void
  closeContextMenu: () => void

  deleteTarget: FileEntry | null
  setDeleteTarget: (e: FileEntry | null) => void
  confirmDelete: () => Promise<void>

  draggingEntry: FileEntry | null

  segments: PathSegment[]
  parent: string | null
  dirCount: number
  fileCount: number
  totalCount: number

  handleActivate: (entry: FileEntry) => void
  handlePaste: () => Promise<void>
}

const Ctx = createContext<Value | null>(null)

export function useFileExplorer(): Value {
  const v = useContext(Ctx)
  if (!v) throw new Error("useFileExplorer must be used inside FileExplorerProvider")
  return v
}

interface ProviderProps {
  path: string
  onNavigate: (path: string) => void
  onOpenSearch: () => void
  onAddFavorite: (path: string) => void
  isFavorite: boolean
  children: ReactNode
}

export function FileExplorerProvider({
  path,
  onNavigate,
  onOpenSearch,
  onAddFavorite,
  isFavorite,
  children,
}: ProviderProps) {
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

  function openContextMenu(e: ReactMouseEvent, entry: FileEntry | null) {
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

  // Keyboard shortcuts
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

  const value: Value = {
    path,
    onNavigate,
    onOpenSearch,
    onAddFavorite,
    isFavorite,
    entries,
    filteredEntries,
    loading,
    error,
    reload,
    selected,
    setSelected,
    filterQuery,
    setFilterQuery,
    filterRef,
    tableRef,
    clipboard,
    copy,
    cut,
    opError: ops.opError,
    clearOpError: ops.clearError,
    inlineMode,
    inlineTarget,
    inlineValue,
    setInlineValue,
    startRename,
    startNewFolder,
    startNewFile,
    cancelInline,
    commitInline,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    draggingEntry,
    segments,
    parent,
    dirCount,
    fileCount,
    totalCount: entries.length,
    handleActivate,
    handlePaste,
  }

  return (
    <Ctx.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingEntry(null)}
      >
        {children}
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
      </DndContext>
    </Ctx.Provider>
  )
}
