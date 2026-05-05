import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { RequestBody } from "../../domain/http-request"
import { useRunnerStore } from "../store"

type BodyType = RequestBody["type"]

const BODY_TYPES: BodyType[] = ["none", "json", "text", "form", "raw"]

export function BodyEditor() {
  const body = useRunnerStore((s) => s.request.body)
  const setBody = useRunnerStore((s) => s.setBody)

  const switchType = (type: BodyType) => {
    if (type === "none") setBody({ type: "none" })
    else if (type === "json") setBody({ type: "json", content: "" })
    else if (type === "text") setBody({ type: "text", content: "" })
    else if (type === "form") setBody({ type: "form", fields: [] })
    else if (type === "raw") setBody({ type: "raw", "content-type": "text/plain", content: "" })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-3 pt-2 pb-1 border-b shrink-0">
        {BODY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              body.type === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {body.type === "none" && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No body
          </div>
        )}

        {(body.type === "json" || body.type === "text") && (
          <div className="h-full p-3">
            <textarea
              value={body.content}
              onChange={(e) =>
                setBody({ ...body, content: e.target.value } as RequestBody)
              }
              placeholder={body.type === "json" ? '{ "key": "value" }' : "Plain text content"}
              className="w-full h-full p-2 font-mono text-sm bg-background border-0 rounded resize-none focus:outline-none"
            />
          </div>
        )}

        {body.type === "raw" && (
          <div className="flex flex-col h-full">
            <div className="px-3 pt-2 shrink-0">
              <Input
                value={body["content-type"]}
                onChange={(e) =>
                  setBody({ ...body, "content-type": e.target.value })
                }
                placeholder="Content-Type (e.g. application/xml)"
                className="font-mono text-xs h-7"
              />
            </div>
            <div className="flex-1 min-h-0 p-3 pt-2">
              <textarea
                value={body.content}
                onChange={(e) =>
                  setBody({ ...body, content: e.target.value })
                }
                className="w-full h-full p-2 font-mono text-sm bg-background border-0 rounded resize-none focus:outline-none"
              />
            </div>
          </div>
        )}

        {body.type === "form" && (
          <div className="p-3 space-y-2">
            {body.fields.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Checkbox
                  checked={f.enabled}
                  onCheckedChange={(v) => {
                    const fields = body.fields.map((field, idx) =>
                      idx === i ? { ...field, enabled: !!v } : field
                    )
                    setBody({ ...body, fields })
                  }}
                />
                <Input
                  value={f.name}
                  onChange={(e) => {
                    const fields = body.fields.map((field, idx) =>
                      idx === i ? { ...field, name: e.target.value } : field
                    )
                    setBody({ ...body, fields })
                  }}
                  placeholder="Name"
                  className="font-mono"
                />
                <Input
                  value={f.value}
                  onChange={(e) => {
                    const fields = body.fields.map((field, idx) =>
                      idx === i ? { ...field, value: e.target.value } : field
                    )
                    setBody({ ...body, fields })
                  }}
                  placeholder="Value"
                  className="font-mono"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const fields = body.fields.filter((_, idx) => idx !== i)
                    setBody({ ...body, fields })
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setBody({
                  ...body,
                  fields: [...body.fields, { name: "", value: "", enabled: true }],
                })
              }
            >
              + Add field
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
