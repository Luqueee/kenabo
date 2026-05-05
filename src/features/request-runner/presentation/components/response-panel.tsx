import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildCurl } from "../../application/build-curl"
import type { HttpRequest } from "../../domain/http-request"
import { JsonViewer } from "./json-viewer"
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

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

function HeadersTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-xs font-mono">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b">
            <td className="p-2 text-muted-foreground align-top whitespace-nowrap">{k}</td>
            <td className="p-2 break-all">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function computedRequestHeaders(req: HttpRequest): [string, string][] {
  const rows: [string, string][] = []

  for (const h of req.headers.filter((h) => h.enabled && h.name)) {
    rows.push([h.name, h.value])
  }

  if (req.auth.type === "bearer") {
    rows.push(["Authorization", `Bearer ${req.auth.token}`])
  } else if (req.auth.type === "basic") {
    const encoded = btoa(`${req.auth.username}:${req.auth.password}`)
    rows.push(["Authorization", `Basic ${encoded}`])
  } else if (req.auth.type === "api-key" && req.auth.placement === "header") {
    rows.push([req.auth.key, req.auth.value])
  }

  if (req.body.type === "json") {
    rows.push(["Content-Type", "application/json"])
  } else if (req.body.type === "raw") {
    rows.push(["Content-Type", req.body["content-type"]])
  }

  return rows
}

function RequestSummary({ request }: { request: HttpRequest }) {
  const enabledQuery = request.query.filter((q) => q.enabled && q.name)
  const headers = computedRequestHeaders(request)

  return (
    <div className="text-xs font-mono">
      <div className="px-3 py-2 border-b bg-muted/30">
        <span className="font-semibold text-primary">{request.method}</span>{" "}
        <span className="break-all">{request.url || "(no url)"}</span>
      </div>

      {enabledQuery.length > 0 && (
        <>
          <div className="px-3 py-1 text-muted-foreground font-sans text-[11px] uppercase tracking-wide border-b bg-muted/10">
            Query params
          </div>
          <table className="w-full">
            <tbody>
              {enabledQuery.map((q, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 text-muted-foreground whitespace-nowrap">{q.name}</td>
                  <td className="p-2 break-all">{q.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="px-3 py-1 text-muted-foreground font-sans text-[11px] uppercase tracking-wide border-b bg-muted/10">
        Headers
      </div>
      {headers.length > 0 ? (
        <table className="w-full">
          <tbody>
            {headers.map(([k, v], i) => (
              <tr key={i} className="border-b">
                <td className="p-2 text-muted-foreground whitespace-nowrap">{k}</td>
                <td className="p-2 break-all">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-3 py-2 text-muted-foreground font-sans">(none)</p>
      )}
    </div>
  )
}

export function ResponsePanel() {
  const status = useRunnerStore((s) => s.status)
  const response = useRunnerStore((s) => s.response)
  const error = useRunnerStore((s) => s.error)
  const request = useRunnerStore((s) => s.request)

  const [prettyPrint, setPrettyPrint] = useState(true)
  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  const handleCopyBody = async () => {
    if (!response || response.body.type !== "text") return
    await copyToClipboard(response.body.content)
    setCopiedBody(true)
    setTimeout(() => setCopiedBody(false), 1500)
  }

  const handleCopyCurl = async () => {
    await copyToClipboard(buildCurl(request))
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 1500)
  }

  if (status === "idle")
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex justify-end px-3 py-2 border-b shrink-0">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleCopyCurl}>
            {copiedCurl ? "✓ Copied!" : "Copy as cURL"}
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Send a request to see the response
        </div>
      </div>
    )

  if (status === "loading")
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Sending…
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

  const rawBody =
    response.body.type === "text"
      ? response.body.content
      : response.body.type === "binary"
        ? `[binary ${formatBytes(response.size_bytes)}]`
        : "[empty]"

  const prettyBody = tryPrettyJson(rawBody)
  const isJson = prettyBody !== rawBody || (() => { try { JSON.parse(rawBody); return true } catch { return false } })()
  const bodyText = prettyPrint ? prettyBody : rawBody

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-3 py-2 border-b text-xs shrink-0">
        <Badge variant={statusColor}>
          {response.status} {response.status_text}
        </Badge>
        <span className="text-muted-foreground">{response.elapsed_ms} ms</span>
        <span className="text-muted-foreground">{formatBytes(response.size_bytes)}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => setPrettyPrint((p) => !p)}
          >
            {prettyPrint ? "Raw" : "Pretty"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={handleCopyBody}
            disabled={response.body.type !== "text"}
          >
            {copiedBody ? "✓ Copied!" : "Copy body"}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleCopyCurl}>
            {copiedCurl ? "✓ Copied!" : "Copy as cURL"}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="body" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-3 mt-2 shrink-0">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">
            Headers ({response.headers.length})
          </TabsTrigger>
          <TabsTrigger value="request">Request</TabsTrigger>
        </TabsList>
        <TabsContent value="body" className="flex-1 min-h-0 overflow-auto mt-0">
          {prettyPrint && isJson ? (
            <JsonViewer code={bodyText} />
          ) : (
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {bodyText}
            </pre>
          )}
        </TabsContent>
        <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto mt-0">
          <HeadersTable rows={response.headers} />
        </TabsContent>
        <TabsContent value="request" className="flex-1 min-h-0 overflow-auto mt-0">
          <RequestSummary request={request} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
