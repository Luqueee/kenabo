import { useCallback, useEffect, useState } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppProviders } from "./providers"
import { AppSidebar } from "@/features/sidebar/components/app-sidebar"
import { FileExplorer } from "@/features/file-explorer/components/file-explorer"
import { SearchPalette } from "@/features/search/components/search-palette"
import { useHomeDir } from "@/features/filesystem/api/use-directory"
import { fsGateway } from "@/features/filesystem/infra/fs.gateway"
import { useHistory } from "@/features/navigation/api/use-history"
import { useFavorites } from "@/features/navigation/api/use-favorites"

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
      <AppSidebar
        variant="inset"
        homeDir={homeDir}
        currentPath={currentPath ?? ""}
        favorites={favorites}
        onNavigate={navigate}
        onRemoveFavorite={remove}
      />
      <SidebarInset>
        {currentPath ? (
          <FileExplorer
            path={currentPath}
            onNavigate={navigate}
            onOpenSearch={() => setSearchOpen(true)}
            onAddFavorite={add}
            isFavorite={isFavorite(currentPath)}
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
        onNavigate={navigate}
        onOpenFile={handleOpenFile}
      />
    </AppProviders>
  )
}
