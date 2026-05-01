import { createPortal } from "react-dom"
import {
  FolderOpen,
  Copy,
  Scissors,
  Clipboard,
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react"
import type { FileContextMenuProps } from "./types"
import type { FileEntry } from "./types"

interface MenuItemProps {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  disabled,
  onClick,
}: MenuItemProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm disabled:opacity-40 ${
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent"
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="ml-4 font-mono text-[10px] text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

function MenuDivider() {
  return <div className="my-1 border-t border-border/60" />
}

export function FileContextMenu({
  contextMenu,
  clipboard,
  onClose,
  onActivate,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  onNewFolder,
  onNewFile,
}: FileContextMenuProps) {
  const entry: FileEntry | null = contextMenu.entry

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div
        className="fixed z-50 min-w-50 overflow-hidden rounded-lg border border-border/80 bg-popover py-1 shadow-xl"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {entry ? (
          <>
            <MenuItem
              icon={<FolderOpen className="h-3.5 w-3.5" />}
              label="Abrir"
              shortcut="↵"
              onClick={() => {
                onActivate(entry)
                onClose()
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Copiar"
              shortcut="⌘C"
              onClick={() => {
                onCopy(entry)
                onClose()
              }}
            />
            <MenuItem
              icon={<Scissors className="h-3.5 w-3.5" />}
              label="Cortar"
              shortcut="⌘X"
              onClick={() => {
                onCut(entry)
                onClose()
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="Renombrar"
              shortcut="F2"
              onClick={() => {
                onRename(entry)
                onClose()
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Eliminar"
              shortcut="⌦"
              danger
              onClick={() => {
                onDelete(entry)
                onClose()
              }}
            />
          </>
        ) : (
          <>
            <MenuItem
              icon={<FolderPlus className="h-3.5 w-3.5" />}
              label="Nueva carpeta"
              onClick={() => {
                onNewFolder()
                onClose()
              }}
            />
            <MenuItem
              icon={<FilePlus className="h-3.5 w-3.5" />}
              label="Nuevo archivo"
              onClick={() => {
                onNewFile()
                onClose()
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<Clipboard className="h-3.5 w-3.5" />}
              label="Pegar"
              shortcut="⌘V"
              disabled={!clipboard}
              onClick={() => {
                onPaste()
                onClose()
              }}
            />
          </>
        )}
      </div>
    </>,
    document.body
  )
}
