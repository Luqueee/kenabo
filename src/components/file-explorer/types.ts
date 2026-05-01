import type { FileEntry } from "@/lib/fs"

export type { FileEntry }

export interface Props {
  path: string
  onNavigate: (path: string) => void
  onOpenSearch: () => void
  onAddFavorite: (path: string) => void
  isFavorite: boolean
}

export interface ContextMenuState {
  x: number
  y: number
  entry: FileEntry | null
}

export interface Clipboard {
  path: string
  op: "copy" | "cut"
}

export interface FileRowProps {
  entry: FileEntry
  isSelected: boolean
  isCut: boolean
  isRenaming: boolean
  onClick: () => void
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  children: React.ReactNode
}

export interface FileContextMenuProps {
  contextMenu: ContextMenuState
  clipboard: Clipboard | null
  onClose: () => void
  onActivate: (entry: FileEntry) => void
  onCopy: (entry: FileEntry) => void
  onCut: (entry: FileEntry) => void
  onPaste: () => void
  onRename: (entry: FileEntry) => void
  onDelete: (entry: FileEntry) => void
  onNewFolder: () => void
  onNewFile: () => void
}

export interface ToolbarProps {
  path: string
  segments: Array<{ label: string; path: string }>
  parent: string | null
  loading: boolean
  isFavorite: boolean
  isDragging: boolean
  onNavigate: (path: string) => void
  onRefresh: () => void
  onAddFavorite: () => void
  onOpenSearch: () => void
}
