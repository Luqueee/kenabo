import { useState } from "react"
import { Network, Plus, Unplug, Plug, Pencil, Trash2, Loader2 } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddSmbDialog } from "./add-smb-dialog"
import { useSmb } from "../api/use-smb"
import { smbMountPath, type SmbShare } from "../domain/share"

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
}

export function SmbSection({ currentPath, onNavigate }: Props) {
  const { shares, mounted, busy, save, remove, mount, unmount } = useSmb()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SmbShare | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (s: SmbShare) => {
    setEditing(s)
    setDialogOpen(true)
  }

  const handleClick = async (s: SmbShare) => {
    setError(null)
    try {
      if (mounted[s.id]) {
        onNavigate(smbMountPath(s))
      } else {
        const path = await mount(s.id)
        onNavigate(path)
      }
    } catch (e) {
      setError(String(e))
    }
  }

  const handleUnmount = async (s: SmbShare) => {
    setError(null)
    try {
      await unmount(s.id)
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Red</SidebarGroupLabel>
        <SidebarGroupAction
          title="Añadir share SMB"
          onClick={openNew}
        >
          <Plus />
        </SidebarGroupAction>
        <SidebarMenu>
          {shares.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">
              Sin shares. Añadí uno con +.
            </li>
          )}
          {shares.map((s) => {
            const isMounted = mounted[s.id]
            const isBusy = busy[s.id]
            const path = smbMountPath(s)
            const active = currentPath === path
            return (
              <SidebarMenuItem key={s.id}>
                <SidebarMenuButton
                  isActive={active}
                  onClick={() => handleClick(s)}
                  className="group/smb pr-1"
                  title={`smb://${s.host}/${s.share}`}
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Network
                      className={`h-4 w-4 shrink-0 ${isMounted ? "text-primary" : "text-muted-foreground"}`}
                    />
                  )}
                  <span className="flex-1 truncate">{s.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto rounded p-0.5 opacity-0 group-hover/smb:opacity-100 hover:bg-sidebar-accent-foreground/10"
                        title="Opciones"
                      >
                        <span className="text-xs">⋯</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {isMounted ? (
                        <DropdownMenuItem onClick={() => handleUnmount(s)}>
                          <Unplug className="h-4 w-4" />
                          Desmontar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleClick(s)}>
                          <Plug className="h-4 w-4" />
                          Montar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => remove(s.id)}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          {error && (
            <li className="px-2 py-1 text-xs text-destructive">{error}</li>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <AddSmbDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={save}
      />
    </>
  )
}
