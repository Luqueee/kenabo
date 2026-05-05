import { useEffect, useState } from "react"
import { Settings, Plus, Trash2, Pencil, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { showInputDialog } from "@/components/ui/input-dialog"
import { cn } from "@/lib/utils"
import { useEnvironmentsStore } from "./store"
import type { Environment } from "../domain/environment"

function AddVarRow({ envId }: { envId: string }) {
  const setVar = useEnvironmentsStore((s) => s.setVar)
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")

  const add = async () => {
    const k = key.trim()
    if (!k) return
    await setVar(envId, k, value)
    setKey("")
    setValue("")
  }

  return (
    <div className="grid grid-cols-[1fr_2fr_28px_32px] gap-0 border-t border-border">
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="New variable"
        className="h-8 rounded-none border-0 border-r text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        onKeyDown={(e) => { if (e.key === "Enter") void add() }}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value"
        className="h-8 rounded-none border-0 border-r text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        onKeyDown={(e) => { if (e.key === "Enter") void add() }}
      />
      <div className="flex items-center justify-center border-r border-border" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={() => void add()}
        disabled={!key.trim()}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function VarsEditor({ env }: { env: Environment }) {
  const setVar = useEnvironmentsStore((s) => s.setVar)
  const renameVar = useEnvironmentsStore((s) => s.renameVar)
  const removeVar = useEnvironmentsStore((s) => s.removeVar)

  const entries = Object.entries(env.variables)

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_2fr_28px_32px] bg-muted/50 border-b border-border">
        <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Key</div>
        <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Value</div>
        <div className="flex items-center justify-center border-r border-border py-1.5">
          <EyeOff className="h-3 w-3 text-muted-foreground" />
        </div>
        <div />
      </div>

      {entries.map(([key, { value, secret }]) => (
        <div
          key={key}
          className="group grid grid-cols-[1fr_2fr_28px_32px] border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
        >
          <Input
            defaultValue={key}
            className="h-8 rounded-none border-0 border-r text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            onBlur={(e) => void renameVar(env.id, key, e.target.value)}
          />
          <Input
            value={value}
            onChange={(e) => void setVar(env.id, key, e.target.value, secret)}
            className="h-8 rounded-none border-0 border-r text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            type={secret ? "password" : "text"}
          />
          <div className="flex items-center justify-center border-r border-border">
            <Checkbox
              checked={secret}
              onCheckedChange={(v) => void setVar(env.id, key, value, !!v)}
              className="h-3.5 w-3.5"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-none opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
            onClick={() => void removeVar(env.id, key)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <AddVarRow key={entries.length} envId={env.id} />
    </div>
  )
}

function EnvManager() {
  const environments = useEnvironmentsStore((s) => s.environments)
  const activeId = useEnvironmentsStore((s) => s.activeId)
  const create = useEnvironmentsStore((s) => s.create)
  const remove = useEnvironmentsStore((s) => s.remove)
  const rename = useEnvironmentsStore((s) => s.rename)
  const setActive = useEnvironmentsStore((s) => s.setActive)

  const [selectedId, setSelectedId] = useState<string | null>(activeId)
  const selectedEnv = environments.find((e) => e.id === selectedId) ?? environments[0] ?? null

  useEffect(() => {
    if (selectedId && !environments.find((e) => e.id === selectedId)) {
      setSelectedId(environments[0]?.id ?? null)
    }
  }, [environments, selectedId])

  return (
    <div className="flex h-full gap-0">
      <div className="w-52 shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environments</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={async () => {
              const name = await showInputDialog("Environment name")
              if (name) void create(name)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
          {environments.map((env) => (
            <div
              key={env.id}
              className={cn(
                "group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-xs transition-colors",
                selectedId === env.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setSelectedId(env.id)}
            >
              <span className="flex-1 truncate font-medium">{env.name}</span>
              {activeId === env.id && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px] shrink-0">active</Badge>
              )}
              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={async (e) => {
                    e.stopPropagation()
                    const name = await showInputDialog("Environment name", env.name)
                    if (name) void rename(env.id, name)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    void remove(env.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {environments.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">
              No environments yet
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEnv ? (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
              <span className="text-sm font-semibold">{selectedEnv.name}</span>
              <Button
                variant={activeId === selectedEnv.id ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActive(activeId === selectedEnv.id ? null : selectedEnv.id)}
              >
                {activeId === selectedEnv.id ? "Active" : "Set active"}
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <VarsEditor key={selectedEnv.id} env={selectedEnv} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select an environment</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function EnvironmentSelector() {
  const environments = useEnvironmentsStore((s) => s.environments)
  const activeId = useEnvironmentsStore((s) => s.activeId)
  const setActive = useEnvironmentsStore((s) => s.setActive)
  const load = useEnvironmentsStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex items-center gap-1">
      <Select
        value={activeId ?? "none"}
        onValueChange={(v) => setActive(v === "none" ? null : v)}
      >
        <SelectTrigger className="h-9 w-40 text-xs">
          <SelectValue placeholder="No environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs text-muted-foreground">No environment</SelectItem>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id} className="text-xs">
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0 flex flex-col" style={{ width: "70vw", maxWidth: "70vw" }}>
          <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
            <SheetTitle className="text-base">Environments</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <EnvManager />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
