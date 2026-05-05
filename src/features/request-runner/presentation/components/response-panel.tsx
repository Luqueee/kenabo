import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRunnerStore } from "../store"

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

const tryPrettyJson = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

export function ResponsePanel() {
  const status = useRunnerStore((s) => s.status)
  const response = useRunnerStore((s) => s.response)
  const error = useRunnerStore((s) => s.error)

  if (status === "idle")
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Send a request to see the response
      </div>
    )

  if (status === "error")
    return (
      <div className="flex-1 p-4 text-sm text-destructive font-mono whitespace-pre-wrap">
        {error}
      </div>
    )

  if (!response) return null

  const statusColor =
    response.status < 300
      ? "default"
      : response.status < 400
        ? "secondary"
        : "destructive"

  const bodyText =
    response.body.type === "text"
      ? tryPrettyJson(response.body.content)
      : response.body.type === "binary"
        ? `[binary ${formatBytes(response.size_bytes)}]`
        : "[empty]"

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-3 py-2 border-b text-xs">
        <Badge variant={statusColor}>
          {response.status} {response.status_text}
        </Badge>
        <span className="text-muted-foreground">{response.elapsed_ms} ms</span>
        <span className="text-muted-foreground">
          {formatBytes(response.size_bytes)}
        </span>
      </div>
      <Tabs defaultValue="body" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-3 mt-2 shrink-0">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">
            Headers ({response.headers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="flex-1 min-h-0 overflow-auto mt-0">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
            {bodyText}
          </pre>
        </TabsContent>
        <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto mt-0">
          <table className="w-full text-xs font-mono">
            <tbody>
              {response.headers.map(([k, v], i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 text-muted-foreground align-top">{k}</td>
                  <td className="p-2 break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
