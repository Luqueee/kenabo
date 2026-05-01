import { useDraggable, useDroppable } from "@dnd-kit/core"
import type { FileRowProps } from "./types"

export function FileRow({
  entry,
  isSelected,
  isCut,
  isRenaming,
  onClick,
  onDoubleClick,
  onContextMenu,
  children,
}: FileRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: entry.path,
    data: { entry },
    disabled: isRenaming,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${entry.path}`,
    data: { entry },
    disabled: !entry.is_dir,
  })

  return (
    <tr
      ref={(el) => {
        setDragRef(el)
        if (entry.is_dir) setDropRef(el)
      }}
      data-path={entry.path}
      className={`group cursor-pointer border-b border-border/30 ${
        isOver
          ? "bg-primary/15 ring-1 ring-inset ring-primary/50"
          : isSelected
            ? "bg-accent/60"
            : "hover:bg-muted/40"
      } ${isDragging || isCut ? "opacity-40" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
      {children}
    </tr>
  )
}
