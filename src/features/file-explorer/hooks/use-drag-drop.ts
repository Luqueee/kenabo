import { useEffect, useRef, useState } from "react"
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
  copy: (src: string, dest: string) => Promise<void>
}

export function useDragDrop(ops: Ops) {
  const [draggingEntry, setDraggingEntry] = useState<FileEntry | null>(null)
  const [copyMode, setCopyMode] = useState(false)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isDraggingRef.current) return
      setCopyMode(e.altKey || e.ctrlKey)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("keyup", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKey)
    }
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const entry = event.active.data.current?.entry as FileEntry | undefined
    if (entry) {
      setDraggingEntry(entry)
      isDraggingRef.current = true
      setCopyMode(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const wasCopy = copyMode
    setDraggingEntry(null)
    setCopyMode(false)
    isDraggingRef.current = false

    const { active, over } = event
    if (!over) return
    const src = active.data.current?.entry as FileEntry | undefined
    if (!src) return

    const navPath = over.data.current?.navPath as string | undefined
    if (navPath) {
      if (src.path === navPath) return
      if (navPath.startsWith(src.path + "/")) return
      const dest = joinPath(navPath, src.name)
      if (wasCopy) await ops.copy(src.path, dest)
      else await ops.move(src.path, dest)
      return
    }

    const destEntry = over.data.current?.entry as FileEntry | undefined
    if (!destEntry || !destEntry.is_dir) return
    if (src.path === destEntry.path) return
    if (src.path.startsWith(destEntry.path + "/")) return
    const dest = joinPath(destEntry.path, src.name)
    if (wasCopy) await ops.copy(src.path, dest)
    else await ops.move(src.path, dest)
  }

  function handleDragCancel() {
    setDraggingEntry(null)
    setCopyMode(false)
    isDraggingRef.current = false
  }

  return {
    draggingEntry,
    copyMode,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
