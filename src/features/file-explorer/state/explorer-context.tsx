import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useAction } from "@/features/hotkeys/bindings"
import { DndContext, DragOverlay } from "@dnd-kit/core"
import { useDirectory } from "@/features/filesystem/api/use-directory"
import { useFileOps } from "@/features/filesystem/api/use-file-ops"
import { useClipboard } from "@/features/filesystem/api/use-clipboard"
import {
  pathSegments,
  parentPath,
  type PathSegment,
} from "@/features/filesystem/domain/path"
import type { FileEntry } from "@/features/filesystem/domain/file-entry"
import { isMacJunk } from "@/features/filesystem/domain/mac-junk"
import type { Clipboard } from "@/features/filesystem/domain/clipboard"
import type { ContextMenuState } from "../types"
import { FileIcon } from "../components/file-icon"
import { useViewMode, type ViewMode } from "../hooks/use-view-mode"
import { useInlineEditing, type InlineMode } from "../hooks/use-inline-editing"
import { useDragDrop } from "../hooks/use-drag-drop"
import { useSelection, modeFromEvent } from "../hooks/use-selection"
import { useUndoStack } from "@/features/filesystem/api/use-undo-stack"
import { describeUndoOp } from "@/features/filesystem/domain/undo-op"

export type { InlineMode, ViewMode }

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
  total: number
  hasMore: boolean
  loadMore: () => void

  selected: string | null
  setSelected: (p: string | null) => void
  selectedPaths: ReadonlySet<string>
  isSelected: (path: string) => boolean
  selectAt: (path: string, e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => void
  selectAll: () => void
  clearSelection: () => void

  filterQuery: string
  setFilterQuery: (q: string) => void
  filterRef: RefObject<HTMLInputElement | null>
  tableRef: RefObject<HTMLDivElement | null>

  clipboard: Clipboard | null
  copy: (paths: string[]) => void
  cut: (paths: string[]) => void
  clipboardHas: (path: string) => boolean

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

  deleteTargets: FileEntry[]
  setDeleteTargets: (e: FileEntry[]) => void
  confirmDelete: () => Promise<void>

  draggingEntry: FileEntry | null
  dragCopyMode: boolean

  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void

  terminalId: string | null
  onOpenSettings: () => void

  segments: PathSegment[]
  parent: string | null
  dirCount: number
  fileCount: number
  totalCount: number

  handleActivate: (entry: FileEntry) => void
  handlePaste: () => Promise<void>

  canUndo: boolean
  undoLabel: string | null
  undo: () => Promise<void>
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
  terminalId: string | null
  onOpenSettings: () => void
  children: ReactNode
}

export function FileExplorerProvider({
  path,
  onNavigate,
  onOpenSearch,
  onAddFavorite,
  isFavorite,
  terminalId,
  onOpenSettings,
  children,
}: ProviderProps) {
  const { entries, loading, error, reload, total, hasMore, loadMore, setEntriesFromPage } = useDirectory(path)
  const { clipboard, copy, cut, clear: clearClipboard, hasPath: clipboardHas } = useClipboard()
  const undoStack = useUndoStack()
  const ops = useFileOps(reload, undoStack, setEntriesFromPage)

  const selection = useSelection()
  const selected = selection.anchorPath
  const setSelected = selection.replace
  const [filterQuery, setFilterQuery] = useState("")
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [deleteTargets, setDeleteTargets] = useState<FileEntry[]>([])

  const { viewMode, setViewMode } = useViewMode()
  const inline = useInlineEditing(path, entries, ops)
  const dnd = useDragDrop(ops)

  const tableRef = useRef<HTMLDivElement | null>(null)
  const filterRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setSelected(null)
    setFilterQuery("")
  }, [path])

  const visibleEntries = useMemo(
    () => entries.filter((e) => !isMacJunk(e.name)),
    [entries]
  )

  const filteredEntries = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return visibleEntries
    return visibleEntries.filter((e) => e.name.toLowerCase().includes(q))
  }, [visibleEntries, filterQuery])

  useEffect(() => {
    if (!inline.pendingSelect || entries.length === 0) return
    const entry = entries.find((e) => e.name === inline.pendingSelect)
    if (entry) {
      inline.clearPendingSelect()
      setSelected(entry.path)
      tableRef.current
        ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(entry.path)}"]`)
        ?.scrollIntoView({ block: "nearest" })
    }
  }, [entries, inline.pendingSelect, inline.clearPendingSelect, inline])

  // Refs let callbacks always see latest data without being in deps → stable references.
  const filteredEntriesRef = useRef(filteredEntries)
  const entriesRef = useRef(entries)
  useEffect(() => { filteredEntriesRef.current = filteredEntries }, [filteredEntries])
  useEffect(() => { entriesRef.current = entries }, [entries])

  const handleActivate = useCallback((entry: FileEntry) => {
    if (entry.is_dir) onNavigate(entry.path)
    else ops.open(entry.path)
  }, [onNavigate, ops])

  const openContextMenu = useCallback((e: ReactMouseEvent, entry: FileEntry | null) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 210)
    const y = Math.min(e.clientY, window.innerHeight - 240)
    if (entry) setSelected(entry.path)
    setContextMenu({ x, y, entry })
  }, [setSelected])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handlePaste = useCallback(async () => {
    if (!clipboard) return
    await ops.paste(clipboard, path)
    if (clipboard.op === "cut") clearClipboard()
  }, [clipboard, ops, path, clearClipboard])

  const confirmDelete = useCallback(async () => {
    if (deleteTargets.length === 0) return
    const targets = deleteTargets
    setDeleteTargets([])
    selection.clear()
    await ops.removeMany(targets.map((t) => t.path))
  }, [deleteTargets, ops, selection])

  const selEntry = selected
    ? entries.find((en) => en.path === selected) ?? null
    : null

  const selectedEntries = useCallback((): FileEntry[] => {
    const paths = selection.selectedPaths
    if (paths.size === 0) {
      const anchor = entriesRef.current.find((en) => en.path === selected) ?? null
      return anchor ? [anchor] : []
    }
    return entriesRef.current.filter((en) => paths.has(en.path))
  }, [selected, selection.selectedPaths])

  const navEnabled = !contextMenu && deleteTargets.length === 0 && !inline.inlineMode

  const scrollToSelected = useCallback((p: string) => {
    tableRef.current
      ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(p)}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [])

  useHotkey("Escape", () => {
    if (contextMenu) return setContextMenu(null)
    if (deleteTargets.length > 0) return setDeleteTargets([])
    if (inline.inlineMode) return inline.cancelInline()
    if (document.activeElement === filterRef.current) {
      setFilterQuery("")
      filterRef.current?.blur()
      return
    }
    if (selection.selectedPaths.size > 1) selection.clear()
  }, { ignoreInputs: false, preventDefault: false })

  useAction("filter.focus", () => {
    filterRef.current?.focus()
  })

  useAction("file.copy", () => {
    const sel = selectedEntries()
    if (sel.length > 0) copy(sel.map((e) => e.path))
  }, { enabled: navEnabled && !!selEntry, ignoreInputs: true })

  useAction("file.cut", () => {
    const sel = selectedEntries()
    if (sel.length > 0) cut(sel.map((e) => e.path))
  }, { enabled: navEnabled && !!selEntry, ignoreInputs: true })

  useAction("file.paste", () => {
    if (clipboard) handlePaste()
  }, { enabled: navEnabled && !!clipboard, ignoreInputs: true })

  useAction("file.rename", () => {
    if (selEntry) inline.startRename(selEntry)
  }, { enabled: navEnabled && !!selEntry })

  useAction("file.delete", () => {
    const sel = selectedEntries()
    if (sel.length > 0) setDeleteTargets(sel)
  }, { enabled: navEnabled && !!selEntry })

  useAction("file.newFile", () => {
    inline.startNewFile()
  }, { enabled: navEnabled, ignoreInputs: true })

  useAction("file.newFolder", () => {
    inline.startNewFolder()
  }, { enabled: navEnabled, ignoreInputs: true })

  useAction("history.undo", async () => {
    await undoStack.undo()
    await reload()
  }, { enabled: undoStack.canUndo, ignoreInputs: true })

  useAction("view.reload", () => {
    reload()
  }, { ignoreInputs: true })

  useAction("view.list", () => {
    setViewMode("list")
  }, { ignoreInputs: true })

  useAction("view.grid", () => {
    setViewMode("grid")
  }, { ignoreInputs: true })

  useAction("view.settings", () => {
    onOpenSettings()
  }, { ignoreInputs: true })

  useAction("selection.all", () => {
    selection.selectAll(filteredEntries.map((en) => en.path))
  }, { enabled: navEnabled, ignoreInputs: true })

  useAction("selection.down", () => {
    if (filteredEntries.length === 0) return
    const idx = selected
      ? filteredEntries.findIndex((en) => en.path === selected)
      : -1
    const next = filteredEntries[Math.min(idx + 1, filteredEntries.length - 1)]
    if (next) {
      setSelected(next.path)
      scrollToSelected(next.path)
    }
  }, { enabled: navEnabled })

  useAction("selection.up", () => {
    if (filteredEntries.length === 0) return
    const idx = selected
      ? filteredEntries.findIndex((en) => en.path === selected)
      : 0
    const prev = filteredEntries[Math.max(idx - 1, 0)]
    if (prev) {
      setSelected(prev.path)
      scrollToSelected(prev.path)
    }
  }, { enabled: navEnabled })

  useAction("nav.activate", () => {
    if (selEntry) handleActivate(selEntry)
  }, { enabled: navEnabled && !!selEntry })

  useAction("nav.up", () => {
    const par = parentPath(path)
    if (par) onNavigate(par)
  }, { enabled: navEnabled })

  useAction("nav.enter", () => {
    if (selEntry?.is_dir) onNavigate(selEntry.path)
  }, { enabled: navEnabled && !!selEntry?.is_dir })

  const segments = useMemo(() => pathSegments(path), [path])
  const parent = useMemo(() => parentPath(path), [path])
  const dirCount = useMemo(() => filteredEntries.filter((e) => e.is_dir).length, [filteredEntries])
  const fileCount = filteredEntries.length - dirCount

  const selectAt = useCallback(
    (p: string, e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) =>
      selection.select(p, modeFromEvent(e), filteredEntriesRef.current),
    [selection]
  )
  const selectAll = useCallback(
    () => selection.selectAll(filteredEntriesRef.current.map((en) => en.path)),
    [selection]
  )
  const undo = useCallback(async () => {
    await undoStack.undo()
    await reload()
  }, [undoStack, reload])

  const value = useMemo((): Value => ({
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
    total,
    hasMore,
    loadMore,
    selected,
    setSelected,
    selectedPaths: selection.selectedPaths,
    isSelected: selection.isSelected,
    selectAt,
    selectAll,
    clearSelection: selection.clear,
    filterQuery,
    setFilterQuery,
    filterRef,
    tableRef,
    clipboard,
    copy,
    cut,
    opError: ops.opError,
    clearOpError: ops.clearError,
    inlineMode: inline.inlineMode,
    inlineTarget: inline.inlineTarget,
    inlineValue: inline.inlineValue,
    setInlineValue: inline.setInlineValue,
    startRename: inline.startRename,
    startNewFolder: inline.startNewFolder,
    startNewFile: inline.startNewFile,
    cancelInline: inline.cancelInline,
    commitInline: inline.commitInline,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    deleteTargets,
    setDeleteTargets,
    confirmDelete,
    clipboardHas,
    draggingEntry: dnd.draggingEntry,
    dragCopyMode: dnd.copyMode,
    viewMode,
    setViewMode,
    terminalId,
    onOpenSettings,
    segments,
    parent,
    dirCount,
    fileCount,
    totalCount: entries.length,
    handleActivate,
    handlePaste,
    canUndo: undoStack.canUndo,
    undoLabel: undoStack.peek ? describeUndoOp(undoStack.peek) : null,
    undo,
  }), [
    path, onNavigate, onOpenSearch, onAddFavorite, isFavorite,
    entries, filteredEntries, loading, error, reload, total, hasMore, loadMore,
    selected, setSelected, selection, selectAt, selectAll,
    filterQuery, setFilterQuery, clipboard, copy, cut,
    ops.opError, ops.clearError,
    inline.inlineMode, inline.inlineTarget, inline.inlineValue, inline.setInlineValue,
    inline.startRename, inline.startNewFolder, inline.startNewFile,
    inline.cancelInline, inline.commitInline,
    contextMenu, openContextMenu, closeContextMenu,
    deleteTargets, setDeleteTargets, confirmDelete, clipboardHas,
    dnd.draggingEntry, dnd.copyMode, viewMode, setViewMode,
    terminalId, onOpenSettings, segments, parent, dirCount, fileCount,
    handleActivate, handlePaste, undoStack.canUndo, undoStack.peek, undo,
  ])

  return (
    <Ctx.Provider value={value}>
      <DndContext
        sensors={dnd.sensors}
        onDragStart={dnd.handleDragStart}
        onDragEnd={dnd.handleDragEnd}
        onDragCancel={dnd.handleDragCancel}
      >
        {children}
        <DragOverlay>
          {dnd.draggingEntry && (
            <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-popover px-3 py-1.5 text-sm shadow-lg">
              <FileIcon
                name={dnd.draggingEntry.name}
                isDir={dnd.draggingEntry.is_dir}
                extension={dnd.draggingEntry.extension}
              />
              <span className="max-w-48 truncate">{dnd.draggingEntry.name}</span>
              {dnd.copyMode && (
                <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Copiar
                </span>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Ctx.Provider>
  )
}
