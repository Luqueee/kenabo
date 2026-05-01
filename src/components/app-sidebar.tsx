import * as React from "react"
import { Home, Monitor, FileText, Download, HardDrive } from "lucide-react"
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
  onNavigate: (path: string) => void
}

export function AppSidebar({ homeDir, currentPath, onNavigate, ...props }: Props) {
  const bookmarks = React.useMemo(() => {
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
          <SidebarMenu>
            {bookmarks.map((item) => (
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
