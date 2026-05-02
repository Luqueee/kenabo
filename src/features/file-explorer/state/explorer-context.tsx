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
  const { entries, loading, error, reload } = useDirectory(path)
  const { clipboard, copy, cut, clear: clearClipboard, hasPath: clipboardHas } = useClipboard()
  const ops = useFileOps(reload)

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
    if (deleteTargets.length === 0) return
    const targets = deleteTargets
    setDeleteTargets([])
    selection.clear()
    await ops.removeMany(targets.map((t) => t.path))
  }

  const selEntry = selected
    ? entries.find((en) => en.path === selected) ?? null
    : null

  function selectedEntries(): FileEntry[] {
    if (selection.selectedPaths.size === 0) return selEntry ? [selEntry] : []
    return entries.filter((en) => selection.selectedPaths.has(en.path))
  }

  const navEnabled = !contextMenu && deleteTargets.length === 0 && !inline.inlineMode

  function scrollToSelected(p: string) {
    tableRef.current
      ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(p)}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }

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
    selectedPaths: selection.selectedPaths,
    isSelected: selection.isSelected,
    selectAt: (path, e) =>
      selection.select(path, modeFromEvent(e), filteredEntries),
    selectAll: () => selection.selectAll(filteredEntries.map((en) => en.path)),
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
  }

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
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Ctx.Provider>
  )
}
