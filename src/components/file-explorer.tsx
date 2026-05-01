import { useEffect, useState, useCallback, useRef } from "react"
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  Film,
  Music,
  Archive,
  ArrowUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  Search,
  FolderOpen,
} from "lucide-react"
import { listDirectory, openFile, type FileEntry } from "@/lib/fs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface Props {
  path: string
  onNavigate: (path: string) => void
  onOpenSearch: () => void
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(timestamp: number): string {
  if (timestamp === 0) return "—"
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {
    year: sameYear ? undefined : "numeric",
    month: "short",
    day: "numeric",
  })
}

function pathSegments(path: string) {
  if (path === "/") return [{ label: "/", path: "/" }]
  const parts = path.split("/").filter(Boolean)
  return [
    { label: "/", path: "/" },
    ...parts.map((label, i) => ({
      label,
      path: "/" + parts.slice(0, i + 1).join("/"),
    })),
  ]
}

function parentPath(path: string): string | null {
  if (path === "/") return null
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null
  const parent = "/" + parts.slice(0, -1).join("/")
  return parent || "/"
}

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "bmp",
  "tiff",
  "heic",
])
const CODE_EXTS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "rs",
  "go",
  "java",
  "c",
  "cpp",
  "h",
  "css",
  "scss",
  "html",
  "json",
  "yaml",
  "yml",
  "toml",
  "md",
  "sh",
  "rb",
  "vue",
  "svelte",
  "lua",
  "php",
  "swift",
  "kt",
])
const VIDEO_EXTS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"])
const AUDIO_EXTS = new Set(["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"])
const ARCHIVE_EXTS = new Set([
  "zip",
  "tar",
  "gz",
  "rar",
  "7z",
  "bz2",
  "xz",
  "dmg",
])
const DOC_EXTS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "rtf",
])

function FileIcon({ entry }: { entry: FileEntry }) {
  const cls = "h-4 w-4 shrink-0"
  if (entry.is_dir)
    return <Folder className={`${cls} fill-blue-400/30 text-blue-400`} />
  const ext = entry.extension ?? ""
  if (IMAGE_EXTS.has(ext))
    return <FileImage className={`${cls} text-emerald-400`} />
  if (CODE_EXTS.has(ext))
    return <FileCode className={`${cls} text-violet-400`} />
  if (VIDEO_EXTS.has(ext)) return <Film className={`${cls} text-rose-400`} />
  if (AUDIO_EXTS.has(ext)) return <Music className={`${cls} text-amber-400`} />
  if (ARCHIVE_EXTS.has(ext))
    return <Archive className={`${cls} text-orange-400`} />
  if (DOC_EXTS.has(ext)) return <FileText className={`${cls} text-sky-400`} />
  return <File className={`${cls} text-muted-foreground`} />
}

export function FileExplorer({ path, onNavigate, onOpenSearch }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async (p: string) => {
    setLoading(true)
    setError(null)
    setSelected(null)
    try {
      const result = await listDirectory(p)
      setEntries(result)
    } catch (e) {
      setError(String(e))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(path)
  }, [path, load])

  // Keyboard navigation for file list
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (entries.length === 0) return
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      const idx = selected
        ? entries.findIndex((en) => en.path === selected)
        : -1

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = entries[Math.min(idx + 1, entries.length - 1)]
        if (next) {
          setSelected(next.path)
          tableRef.current
            ?.querySelector<HTMLElement>(
              `[data-path="${CSS.escape(next.path)}"]`
            )
            ?.scrollIntoView({ block: "nearest" })
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev = entries[Math.max(idx - 1, 0)]
        if (prev) {
          setSelected(prev.path)
          tableRef.current
            ?.querySelector<HTMLElement>(
              `[data-path="${CSS.escape(prev.path)}"]`
            )
            ?.scrollIntoView({ block: "nearest" })
        }
      } else if (e.key === "Enter") {
        e.preventDefault()
        const entry = selected
          ? entries.find((en) => en.path === selected)
          : null
        if (entry) handleActivate(entry)
      } else if (e.key === "Backspace" || e.key === "ArrowLeft") {
        const parent = parentPath(path)
        if (parent) onNavigate(parent)
      } else if (e.key === "ArrowRight") {
        const entry = selected
          ? entries.find((en) => en.path === selected)
          : null
        if (entry?.is_dir) onNavigate(entry.path)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, selected, path, onNavigate])

  function handleActivate(entry: FileEntry) {
    if (entry.is_dir) {
      onNavigate(entry.path)
    } else {
      openFile(entry.path).catch(console.error)
    }
  }

  const segments = pathSegments(path)
  const parent = parentPath(path)
  const dirCount = entries.filter((e) => e.is_dir).length
  const fileCount = entries.length - dirCount

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 bg-background/95 px-3 backdrop-blur">
        <SidebarTrigger className="h-8 w-8" />
        <Separator orientation="vertical" className="mx-1 h-full" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!parent}
          onClick={() => parent && onNavigate(parent)}
          title="Subir directorio"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => load(path)}
          title="Actualizar"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-full" />

        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap overflow-hidden">
            {segments.map((seg, i) => {
              const isLast = i === segments.length - 1
              return (
                <div
                  key={seg.path}
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {seg.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => onNavigate(seg.path)}
                      >
                        {seg.label}
                      </BreadcrumbLink>
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
          className="ml-2 h-8 gap-2 px-2.5 text-muted-foreground"
          onClick={onOpenSearch}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Buscar archivos</span>
          <kbd className="ml-1 hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            ⌘K
          </kbd>
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && entries.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="max-w-md text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => load(path)}>
              Reintentar
            </Button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FolderOpen className="h-8 w-8 opacity-50" />
            <p className="text-sm">Directorio vacío</p>
          </div>
        )}

        {!error && entries.length > 0 && (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Nombre
                </th>
                <th className="w-28 px-4 py-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Tamaño
                </th>
                <th className="w-36 px-4 py-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Modificado
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isSelected = selected === entry.path
                return (
                  <tr
                    key={entry.path}
                    className={`group cursor-pointer border-b border-border/30 transition-colors ${
                      isSelected ? "bg-accent/60" : "hover:bg-muted/40"
                    }`}
                    onClick={() => setSelected(entry.path)}
                    onDoubleClick={() => handleActivate(entry)}
                  >
                    <td className="flex min-w-0 items-center gap-2.5 px-4 py-2">
                      <FileIcon entry={entry} />
                      <span className="truncate">{entry.name}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
                      {entry.is_dir ? "—" : formatSize(entry.size)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {formatDate(entry.modified)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-4 text-[11px] text-muted-foreground">
        <span>
          {!loading && !error && (
            <>
              {dirCount} {dirCount === 1 ? "carpeta" : "carpetas"} · {fileCount}{" "}
              {fileCount === 1 ? "archivo" : "archivos"}
            </>
          )}
        </span>
        <span className="font-mono opacity-70">{path}</span>
      </footer>
    </div>
  )
}
