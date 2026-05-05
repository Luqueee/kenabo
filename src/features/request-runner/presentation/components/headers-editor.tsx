import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useRunnerStore } from "../store"

export function HeadersEditor() {
  const headers = useRunnerStore((s) => s.request.headers)
  const setHeader = useRunnerStore((s) => s.setHeader)
  const addHeader = useRunnerStore((s) => s.addHeader)
  const removeHeader = useRunnerStore((s) => s.removeHeader)

  return (
    <div className="p-3 space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Checkbox
            checked={h.enabled}
            onCheckedChange={(v) => setHeader(i, { enabled: !!v })}
          />
          <Input
            value={h.name}
            onChange={(e) => setHeader(i, { name: e.target.value })}
            placeholder="Name"
            className="font-mono"
          />
          <Input
            value={h.value}
            onChange={(e) => setHeader(i, { value: e.target.value })}
            placeholder="Value"
            className="font-mono"
          />
          <Button variant="ghost" size="sm" onClick={() => removeHeader(i)}>
            ✕
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addHeader}>
        + Add header
      </Button>
    </div>
  )
}
