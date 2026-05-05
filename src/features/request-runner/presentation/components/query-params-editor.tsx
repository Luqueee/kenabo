import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useRunnerStore } from "../store"

export function QueryParamsEditor() {
  const query = useRunnerStore((s) => s.request.query)
  const setQuery = useRunnerStore((s) => s.setQuery)
  const addQuery = useRunnerStore((s) => s.addQuery)
  const removeQuery = useRunnerStore((s) => s.removeQuery)

  return (
    <div className="p-3 space-y-2">
      {query.map((q, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Checkbox
            checked={q.enabled}
            onCheckedChange={(v) => setQuery(i, { enabled: !!v })}
          />
          <Input
            value={q.name}
            onChange={(e) => setQuery(i, { name: e.target.value })}
            placeholder="Name"
            className="font-mono"
          />
          <Input
            value={q.value}
            onChange={(e) => setQuery(i, { value: e.target.value })}
            placeholder="Value"
            className="font-mono"
          />
          <Button variant="ghost" size="sm" onClick={() => removeQuery(i)}>
            ✕
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addQuery}>
        + Add param
      </Button>
    </div>
  )
}
