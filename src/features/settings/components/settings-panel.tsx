import { RefreshCw, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HotkeysList } from "@/features/hotkeys/components/hotkeys-list"
import type { TerminalInfo } from "../api/use-settings"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  terminals: TerminalInfo[]
  loadingTerminals: boolean
  terminalId: string | null
  setTerminalId: (id: string | null) => void
  refreshTerminals: () => void
}

export function SettingsPanel({
  open,
  onOpenChange,
  terminals,
  loadingTerminals,
  terminalId,
  setTerminalId,
  refreshTerminals,
}: Props) {
  const effectiveId = terminalId ?? terminals[0]?.id ?? null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[28rem] flex-col gap-4 p-6 sm:max-w-lg">
        <SheetHeader className="p-0">
          <SheetTitle>Configuración</SheetTitle>
          <SheetDescription>
            Personaliza las preferencias del explorador.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="terminal" className="flex min-h-0 flex-1 flex-col gap-3">
          <TabsList>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
            <TabsTrigger value="hotkeys">Atajos</TabsTrigger>
          </TabsList>

          <TabsContent value="terminal" className="m-0 min-h-0 overflow-auto">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Terminal por defecto</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={refreshTerminals}
                  disabled={loadingTerminals}
                  title="Re-detectar"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loadingTerminals ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {terminals.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {loadingTerminals
                    ? "Detectando terminales..."
                    : "No se detectaron terminales instaladas."}
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {terminals.map((t) => {
                    const selected = effectiveId === t.id
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setTerminalId(t.id)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                            selected
                              ? "border-primary/60 bg-primary/10"
                              : "border-border/40 hover:bg-muted/50"
                          }`}
                        >
                          <span>{t.name}</span>
                          {selected && (
                            <span className="text-xs text-primary">✓</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="hotkeys" className="m-0 min-h-0 overflow-auto">
            <HotkeysList />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
