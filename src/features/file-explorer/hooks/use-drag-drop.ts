import { useState } from "react"
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import type { FileEntry } from "@/features/filesystem/domain/file-entry"
import { joinPath } from "@/features/filesystem/domain/path"

interface Ops {
  move: (src: string, dest: string) => Promise<void>
}

export function useDragDrop(ops: Ops) {
  const [draggingEntry, setDraggingEntry] = useState<FileEntry | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

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

  function handleDragCancel() {
    setDraggingEntry(null)
  }

  return {
    draggingEntry,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
