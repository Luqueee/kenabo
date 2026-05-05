import { useEffect } from "react"
import { ChevronRight, ChevronDown, FolderIcon, FileText, Plus, MoreHorizontal, Trash2, Pencil, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { showInputDialog } from "@/components/ui/input-dialog"
import { useCollectionsStore } from "./store"
import { useRunnerStore } from "@/features/request-runner/presentation/store"
import type { Collection, Folder } from "../domain/collection"
import type { HttpRequest } from "@/features/request-runner/domain/http-request"

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  HEAD: "text-slate-400",
  OPTIONS: "text-slate-400",
}

interface RequestItemProps {
  request: HttpRequest
  collectionId: string
  depth: number
}

function RequestItem({ request, collectionId, depth }: RequestItemProps) {
  const loadRequest = useRunnerStore((s) => s.loadRequest)
  const renameRequest = useCollectionsStore((s) => s.renameRequest)
  const removeRequest = useCollectionsStore((s) => s.removeRequest)

  return (
    <div
      className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-accent cursor-pointer text-xs"
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={() => void loadRequest(request, collectionId)}
    >
      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className={cn("shrink-0 font-mono font-semibold text-[10px] w-10", METHOD_COLORS[request.method] ?? "text-muted-foreground")}>
        {request.method}
      </span>
      <span className="flex-1 truncate text-foreground">{request.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={async (e) => {
              e.stopPropagation()
              const name = await showInputDialog("Request name", request.name)
              if (name) void renameRequest(collectionId, request.id, name)
            }}
          >
            <Pencil className="h-3 w-3 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              void removeRequest(collectionId, request.id)
            }}
          >
            <Trash2 className="h-3 w-3 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface FolderNodeProps {
  folder: Folder
  collectionId: string
  depth: number
  isRoot?: boolean
}

function FolderNode({ folder, collectionId, depth, isRoot = false }: FolderNodeProps) {
  const expanded = useCollectionsStore((s) => s.expanded[folder.id] ?? false)
  const toggleExpanded = useCollectionsStore((s) => s.toggleExpanded)
  const addFolder = useCollectionsStore((s) => s.addFolder)
  const addRequest = useCollectionsStore((s) => s.addRequest)
  const renameFolder = useCollectionsStore((s) => s.renameFolder)
  const removeFolder = useCollectionsStore((s) => s.removeFolder)

  const hasChildren = folder.folders.length > 0 || folder.requests.length > 0

  if (isRoot) {
    return (
      <>
        {folder.folders.map((sub) => (
          <FolderNode key={sub.id} folder={sub} collectionId={collectionId} depth={depth} />
        ))}
        {folder.requests.map((req) => (
          <RequestItem key={req.id} request={req} collectionId={collectionId} depth={depth} />
        ))}
      </>
    )
  }

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-accent cursor-pointer text-xs"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => toggleExpanded(folder.id)}
      >
        <span className="shrink-0 w-3">
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </span>
        <FolderIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{folder.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void addRequest(collectionId, folder.id) }}>
              <FileText className="h-3 w-3 mr-2" /> Add request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void addFolder(collectionId, folder.id) }}>
              <FolderPlus className="h-3 w-3 mr-2" /> Add folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation()
                const name = await showInputDialog("Folder name", folder.name)
                if (name) void renameFolder(collectionId, folder.id, name)
              }}
            >
              <Pencil className="h-3 w-3 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); void removeFolder(collectionId, folder.id) }}
            >
              <Trash2 className="h-3 w-3 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <>
          {folder.folders.map((sub) => (
            <FolderNode key={sub.id} folder={sub} collectionId={collectionId} depth={depth + 1} />
          ))}
          {folder.requests.map((req) => (
            <RequestItem key={req.id} request={req} collectionId={collectionId} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  )
}

interface CollectionNodeProps {
  collection: Collection
}

function CollectionNode({ collection }: CollectionNodeProps) {
  const expanded = useCollectionsStore((s) => s.expanded[collection.id] ?? false)
  const toggleExpanded = useCollectionsStore((s) => s.toggleExpanded)
  const addFolder = useCollectionsStore((s) => s.addFolder)
  const addRequest = useCollectionsStore((s) => s.addRequest)
  const rename = useCollectionsStore((s) => s.rename)
  const remove = useCollectionsStore((s) => s.remove)

  const hasChildren =
    collection.root.folders.length > 0 || collection.root.requests.length > 0

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-accent cursor-pointer text-xs font-medium"
        onClick={() => toggleExpanded(collection.id)}
      >
        <span className="shrink-0 w-3">
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </span>
        <FolderIcon className="h-3 w-3 shrink-0" />
        <span className="flex-1 truncate">{collection.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void addRequest(collection.id, collection.root.id) }}>
              <FileText className="h-3 w-3 mr-2" /> Add request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void addFolder(collection.id, collection.root.id) }}>
              <FolderPlus className="h-3 w-3 mr-2" /> Add folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation()
                const name = await showInputDialog("Collection name", collection.name)
                if (name) void rename(collection.id, name)
              }}
            >
              <Pencil className="h-3 w-3 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); void remove(collection.id) }}
            >
              <Trash2 className="h-3 w-3 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <FolderNode
          folder={collection.root}
          collectionId={collection.id}
          depth={1}
          isRoot
        />
      )}
    </div>
  )
}

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
          className="h-6 w-6 p-0"
          onClick={async () => {
            const name = await showInputDialog("Collection name")
            if (name) void create(name)
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-1 space-y-0.5 text-sm">
        {collections.map((c) => (
          <CollectionNode key={c.id} collection={c} />
        ))}
        {collections.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-2">No collections yet</p>
        )}
      </div>
    </aside>
  )
}
