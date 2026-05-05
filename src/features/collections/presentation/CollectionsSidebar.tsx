import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCollectionsStore } from "./store"

export function CollectionsSidebar() {
  const collections = useCollectionsStore((s) => s.collections)
  const load = useCollectionsStore((s) => s.load)
  const create = useCollectionsStore((s) => s.create)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <aside className="w-64 border-r flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold">Collections</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const name = prompt("Collection name")
            if (name) void create(name)
          }}
        >
          +
        </Button>
      </div>
      <ul className="flex-1 overflow-auto p-2 space-y-1 text-sm">
        {collections.map((c) => (
          <li
            key={c.id}
            className="px-2 py-1 rounded hover:bg-accent cursor-pointer"
          >
            {c.name}
          </li>
        ))}
        {collections.length === 0 && (
          <li className="text-xs text-muted-foreground px-2">
            No collections yet
          </li>
        )}
      </ul>
    </aside>
  )
}
