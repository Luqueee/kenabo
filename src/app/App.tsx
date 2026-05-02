import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppProviders } from "./providers"
import { AppSidebar } from "@/features/sidebar/components/app-sidebar"
import { Toolbar } from "@/features/file-explorer/components/toolbar"
import { FilterBar } from "@/features/file-explorer/components/filter-bar"
import { FileTable } from "@/features/file-explorer/components/file-table"
import { DeleteBar } from "@/features/file-explorer/components/delete-bar"
import { ErrorBar } from "@/features/file-explorer/components/error-bar"
import { StatusFooter } from "@/features/file-explorer/components/status-footer"
import { FileContextMenu } from "@/features/file-explorer/components/context-menu"
import { FileExplorerProvider } from "@/features/file-explorer/state/explorer-context"
import { SearchPalette } from "@/features/search/components/search-palette"
import { useHomeDir } from "@/features/filesystem/api/use-directory"
import { fsGateway } from "@/features/filesystem/infra/fs.gateway"
import { useHistory } from "@/features/navigation/api/use-history"
import { useFavorites } from "@/features/navigation/api/use-favorites"

const sidebarStyle = {
  "--sidebar-width": "calc(var(--spacing) * 56)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

export default function App() {
  const homeDir = useHomeDir()
  const { current: currentPath, navigate, back, forward } = useHistory(homeDir)
  const { favorites, add, remove, isFavorite } = useFavorites()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleOpenFile = useCallback((p: string) => {
    fsGateway.open(p).catch(console.error)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (e.button !== 3 && e.button !== 4) return
      e.preventDefault()
      if (e.button === 3) back()
      else forward()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousedown", onMouseDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", onMouseDown)
    }
  }, [back, forward])

  return (
    <AppProviders>
      {currentPath ? (
        <FileExplorerProvider
          path={currentPath}
          onNavigate={navigate}
          onOpenSearch={() => setSearchOpen(true)}
          onAddFavorite={add}
          isFavorite={isFavorite(currentPath)}
        >
          <SidebarProvider
            className="flex h-svh w-full flex-col overflow-hidden bg-background"
            style={sidebarStyle}
          >
            <Toolbar />
            <FilterBar />
            <div className="flex min-h-0 w-full flex-1 flex-row">
              <AppSidebar
                variant="inset"
                style={{ top: "6rem", bottom: "1.75rem", height: "auto" }}
                homeDir={homeDir}
                currentPath={currentPath}
                favorites={favorites}
                onNavigate={navigate}
                onRemoveFavorite={remove}
              />
              <SidebarInset className="min-w-0 flex-1 overflow-hidden">
                <FileTable />
              </SidebarInset>
            </div>
            <DeleteBar />
            <ErrorBar />
            <StatusFooter />
          </SidebarProvider>
          <FileContextMenu />
        </FileExplorerProvider>
      ) : (
        <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      )}

      <SearchPalette
        root={currentPath ?? homeDir ?? "/"}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
        onOpenFile={handleOpenFile}
      />
    </AppProviders>
  )
}
