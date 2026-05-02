import * as React from "react"
import { Home, Monitor, FileText, Download, HardDrive, Star, X } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface Props extends React.ComponentProps<typeof Sidebar> {
  homeDir: string | null
  currentPath: string
  favorites: string[]
  onNavigate: (path: string) => void
  onRemoveFavorite: (path: string) => void
}

export function AppSidebar({
  homeDir,
  currentPath,
  favorites,
  onNavigate,
  onRemoveFavorite,
  ...props
}: Props) {
  const defaultBookmarks = React.useMemo(() => {
    if (!homeDir) return []
    return [
      { label: "Inicio", icon: Home, path: homeDir },
      { label: "Escritorio", icon: Monitor, path: `${homeDir}/Desktop` },
      { label: "Documentos", icon: FileText, path: `${homeDir}/Documents` },
      { label: "Descargas", icon: Download, path: `${homeDir}/Downloads` },
    ]
  }, [homeDir])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <div data-tauri-drag-region className="h-7 w-full shrink-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
          <SidebarMenu>
            {defaultBookmarks.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={currentPath === item.path}
                  onClick={() => onNavigate(item.path)}
                >
                  <item.icon />
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {favorites.map((favPath) => {
              const label = favPath.split("/").filter(Boolean).at(-1) ?? favPath
              return (
                <SidebarMenuItem key={favPath}>
                  <SidebarMenuButton
                    isActive={currentPath === favPath}
                    onClick={() => onNavigate(favPath)}
                    className="group/fav pr-1"
                  >
                    <Star className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveFavorite(favPath)
                      }}
                      className="ml-auto hidden rounded p-0.5 hover:bg-sidebar-accent-foreground/10 group-hover/fav:flex"
                      title="Quitar de favoritos"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Dispositivos</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentPath === "/"}
                onClick={() => onNavigate("/")}
              >
                <HardDrive />
                Raíz del sistema
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
