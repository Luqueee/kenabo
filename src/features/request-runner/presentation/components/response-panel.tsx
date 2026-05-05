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
    <table className="w-full font-mono text-xs">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-b">
            <td className="p-2 align-top whitespace-nowrap text-muted-foreground">
              {k}
            </td>
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
    <div className="font-mono text-xs">
      <div className="border-b bg-muted/30 px-3 py-2">
        <span className="font-semibold text-primary">{request.method}</span>{" "}
        <span className="break-all">{request.url || "(no url)"}</span>
      </div>
      {enabledQuery.length > 0 && (
        <>
          <div className="border-b bg-muted/10 px-3 py-1 font-sans text-[11px] tracking-wide text-muted-foreground uppercase">
            Query params
          </div>
          <table className="w-full">
            <tbody>
              {enabledQuery.map((q, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 whitespace-nowrap text-muted-foreground">
                    {q.name}
                  </td>
                  <td className="p-2 break-all">{q.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div className="border-b bg-muted/10 px-3 py-1 font-sans text-[11px] tracking-wide text-muted-foreground uppercase">
        Headers
      </div>
      {headers.length > 0 ? (
        <table className="w-full">
          <tbody>
            {headers.map(([k, v], i) => (
              <tr key={i} className="border-b">
                <td className="p-2 whitespace-nowrap text-muted-foreground">
                  {k}
                </td>
                <td className="p-2 break-all">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-3 py-2 font-sans text-muted-foreground">(none)</p>
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

  const hasResponse = status === "success" && response !== null

  const statusColor = !response
    ? "secondary"
    : response.status < 300
      ? "default"
      : response.status < 400
        ? "secondary"
        : "destructive"

  const rawBody = !response
    ? ""
    : response.body.type === "text"
      ? response.body.content
      : response.body.type === "binary"
        ? `[binary ${formatBytes(response.size_bytes)}]`
        : "[empty]"

  const prettyBody = tryPrettyJson(rawBody)
  const isJson =
    rawBody !== "" &&
    (prettyBody !== rawBody ||
      (() => {
        try {
          JSON.parse(rawBody)
          return true
        } catch {
          return false
        }
      })())
  const bodyText = prettyPrint ? prettyBody : rawBody

  return (
    <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col">
      {/* status bar — top */}
      {hasResponse && (
        <div className="jsutify-between flex w-full items-center gap-3 border-b py-2 pr-4">
          <div className="flex h-9 shrink-0 items-center gap-3 px-3">
            <Badge variant={statusColor} className="text-xs">
              {response!.status} {response!.status_text}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {response!.elapsed_ms} ms
            </span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(response!.size_bytes)}
            </span>
          </div>
          <TabsList className="ml-auto h-7 p-0.5">
            <TabsTrigger value="body" className="h-6 px-2 text-xs">
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-6 px-2 text-xs"
              disabled={!hasResponse}
            >
              Headers{hasResponse ? ` (${response!.headers.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="request" className="h-6 px-2 text-xs">
              Request
            </TabsTrigger>
          </TabsList>
        </div>
      )}

      {/* content — flex-1, fills all space between status and footer */}
      <TabsContent value="body" className="mt-0 min-h-0 flex-1 overflow-auto">
        {status === "idle" && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Send a request to see the response
          </div>
        )}
        {status === "loading" && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sending…
          </div>
        )}
        {status === "error" && (
          <div className="p-4 font-mono text-sm whitespace-pre-wrap text-destructive">
            {error}
          </div>
        )}
        {hasResponse &&
          (prettyPrint && isJson ? (
            <JsonViewer code={bodyText} />
          ) : (
            <pre className="p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {bodyText}
            </pre>
          ))}
      </TabsContent>

      <TabsContent
        value="headers"
        className="mt-0 min-h-0 flex-1 overflow-auto"
      >
        {hasResponse ? (
          <HeadersTable rows={response!.headers} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No response yet
          </div>
        )}
      </TabsContent>

      <TabsContent
        value="request"
        className="mt-0 min-h-0 flex-1 overflow-auto"
      >
        <RequestSummary request={request} />
      </TabsContent>

      {/* footer — tabs + actions, always at bottom */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-t px-3">
        <div className="ml-auto flex items-center gap-1">
          {hasResponse && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setPrettyPrint((p) => !p)}
              >
                {prettyPrint ? "Raw" : "Pretty"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleCopyBody}
                disabled={response!.body.type !== "text"}
              >
                {copiedBody ? "✓ Copied!" : "Copy body"}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleCopyCurl}
          >
            {copiedCurl ? "✓ Copied!" : "Copy as cURL"}
          </Button>
        </div>
      </div>
    </Tabs>
  )
}
