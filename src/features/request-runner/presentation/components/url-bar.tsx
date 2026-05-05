import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HTTP_METHODS, type HttpMethod } from "../../domain/http-method"
import { useRunnerStore } from "../store"

export function UrlBar() {
  const method = useRunnerStore((s) => s.request.method)
  const url = useRunnerStore((s) => s.request.url)
  const status = useRunnerStore((s) => s.status)
  const setMethod = useRunnerStore((s) => s.setMethod)
  const setUrl = useRunnerStore((s) => s.setUrl)
  const send = useRunnerStore((s) => s.send)

  return (
    <div className="flex gap-2 p-3 border-b">
      <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
        <SelectTrigger className="w-28 font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HTTP_METHODS.map((m) => (
            <SelectItem key={m} value={m} className="font-mono">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 font-mono"
        onKeyDown={(e) => {
          if (e.key === "Enter") void send()
        }}
      />
      <Button onClick={() => void send()} disabled={status === "loading" || !url}>
        {status === "loading" ? "Sending..." : "Send"}
      </Button>
    </div>
  )
}
