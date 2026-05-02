import { useDroppable } from "@dnd-kit/core"
import { ArrowUp, RefreshCw, Search, Star } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { ToolbarProps } from "./types"

function DroppableUpButton({
  parent,
  isDragging,
  onNavigate,
}: {
  parent: string | null
  isDragging: boolean
  onNavigate: (path: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "nav-up",
    data: { navPath: parent },
    disabled: !parent,
  })

  return (
    <div ref={setNodeRef} className="rounded-md">
      <Button
        variant="ghost"
        size="icon"
        disabled={!parent}
        onClick={() => parent && onNavigate(parent)}
        title="Subir directorio"
        className={`h-8 w-8 transition-colors ${
          isOver
            ? "bg-primary/15 ring-2 ring-primary"
            : isDragging && parent
              ? "ring-dashed ring-1 ring-muted-foreground/50"
              : ""
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  )
}

function DroppableBreadcrumbLink({
  seg,
  isDragging,
  onNavigate,
}: {
  seg: { label: string; path: string }
  isDragging: boolean
  onNavigate: (path: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `nav-seg-${seg.path}`,
    data: { navPath: seg.path },
  })

  return (
    <span
      ref={setNodeRef}
      onClick={() => onNavigate(seg.path)}
      className={`cursor-pointer rounded px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${
        isOver
          ? "bg-primary/15 text-foreground ring-1 ring-primary"
          : isDragging
            ? "ring-dashed ring-1 ring-muted-foreground/40"
            : ""
      }`}
    >
      {seg.label}
    </span>
  )
}

export function Toolbar({
  segments,
  parent,
  loading,
  isFavorite,
  isDragging,
  onNavigate,
  onRefresh,
  onAddFavorite,
  onOpenSearch,
}: ToolbarProps) {
  return (
    <header data-tauri-drag-region className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 bg-background/95 px-3 backdrop-blur">
      <SidebarTrigger className="h-8 w-8" />
      <Separator orientation="vertical" className="mx-1 h-full" />

      <DroppableUpButton
        parent={parent}
        isDragging={isDragging}
        onNavigate={onNavigate}
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRefresh}
        title="Actualizar"
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onAddFavorite}
        disabled={isFavorite}
        title={isFavorite ? "Ya está en favoritos" : "Agregar a favoritos"}
      >
        <Star
          className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
        />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-full" />

      <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
        <BreadcrumbList className="flex-nowrap">
          {(segments.length > 6
            ? [segments[0], null, ...segments.slice(-4)]
            : segments
          ).map((seg, i, arr) => {
            if (seg === null) {
              return (
                <div
                  key="ellipsis"
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <BreadcrumbItem>
                    <span className="px-1 text-sm text-muted-foreground">
                      …
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </div>
              )
            }
            const isLast = i === arr.length - 1
            return (
              <div
                key={seg.path}
                className={`flex items-center gap-1.5 ${isLast ? "min-w-0 overflow-hidden" : "shrink-0"}`}
              >
                <BreadcrumbItem
                  className={isLast ? "min-w-0 overflow-hidden" : ""}
                >
                  {isLast ? (
                    <BreadcrumbPage className="block truncate font-medium">
                      {seg.label}
                    </BreadcrumbPage>
                  ) : (
                    <DroppableBreadcrumbLink
                      seg={seg}
                      isDragging={isDragging}
                      onNavigate={onNavigate}
                    />
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <Button
        variant="outline"
        size="sm"
        className="ml-2 h-9 gap-2 px-6 text-muted-foreground"
        onClick={onOpenSearch}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Buscar archivos</span>
        <kbd className="ml-1 hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
    </header>
  )
}
