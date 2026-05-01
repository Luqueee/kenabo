import type { CSSProperties } from "react"
import { useEffect, useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { FileExplorer } from "@/components/file-explorer"
import { SearchPalette } from "@/components/search-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getHomeDir, openFile } from "@/lib/fs"

export default function App() {
  const [homeDir, setHomeDir] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    getHomeDir()
      .then((home) => {
        setHomeDir(home)
        setCurrentPath(home)
      })
      .catch(console.error)
  }, [])

  // Cmd/Ctrl+K → abrir search palette
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleNavigate = useCallback((p: string) => setCurrentPath(p), [])
  const handleOpenFile = useCallback((p: string) => {
    openFile(p).catch(console.error)
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider
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
          onNavigate={handleNavigate}
        />
        <SidebarInset>
          {currentPath ? (
            <FileExplorer
              path={currentPath}
              onNavigate={handleNavigate}
              onOpenSearch={() => setSearchOpen(true)}
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
