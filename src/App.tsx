import type { CSSProperties } from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { FileExplorer } from "@/components/file-explorer"
import { SearchPalette } from "@/components/search-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getHomeDir, openFile } from "@/lib/fs"

const FAVORITES_KEY = "file-explorer:favorites"

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveFavorites(paths: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(paths))
}

export default function App() {
  const [homeDir, setHomeDir] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)

  // Navigation history
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    getHomeDir()
      .then((home) => {
        setHomeDir(home)
        setCurrentPath(home)
        historyRef.current = [home]
        historyIndexRef.current = 0
      })
      .catch(console.error)
  }, [])

  // Mouse back/forward buttons + Cmd/Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    function onMouseDown(e: MouseEvent) {
      // button 3 = back, button 4 = forward
      if (e.button !== 3 && e.button !== 4) return
      e.preventDefault()
      const history = historyRef.current
      const idx = historyIndexRef.current
      if (e.button === 3 && idx > 0) {
        historyIndexRef.current = idx - 1
        setCurrentPath(history[idx - 1])
      } else if (e.button === 4 && idx < history.length - 1) {
        historyIndexRef.current = idx + 1
        setCurrentPath(history[idx + 1])
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousedown", onMouseDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", onMouseDown)
    }
  }, [])

  const handleNavigate = useCallback((p: string) => {
    const idx = historyIndexRef.current
    historyRef.current = [...historyRef.current.slice(0, idx + 1), p]
    historyIndexRef.current = historyRef.current.length - 1
    setCurrentPath(p)
  }, [])

  const handleOpenFile = useCallback((p: string) => {
    openFile(p).catch(console.error)
  }, [])

  const handleAddFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      if (prev.includes(path)) return prev
      const next = [...prev, path]
      saveFavorites(next)
      return next
    })
  }, [])

  const handleRemoveFavorite = useCallback((path: string) => {
    setFavorites((prev) => {
      const next = prev.filter((p) => p !== path)
      saveFavorites(next)
      return next
    })
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider
        className="h-svh overflow-hidden"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          homeDir={homeDir}
          currentPath={currentPath ?? ""}
          favorites={favorites}
          onNavigate={handleNavigate}
          onRemoveFavorite={handleRemoveFavorite}
        />
        <SidebarInset>
          {currentPath ? (
            <FileExplorer
              path={currentPath}
              onNavigate={handleNavigate}
              onOpenSearch={() => setSearchOpen(true)}
              onAddFavorite={handleAddFavorite}
              isFavorite={favorites.includes(currentPath)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Cargando...
            </div>
          )}
        </SidebarInset>

        <SearchPalette
          root={currentPath ?? homeDir ?? "/"}
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={handleNavigate}
          onOpenFile={handleOpenFile}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}
