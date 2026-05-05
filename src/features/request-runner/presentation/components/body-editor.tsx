import { useRunnerStore } from "../store"

export function BodyEditor() {
  const body = useRunnerStore((s) => s.request.body)
  const setBodyJson = useRunnerStore((s) => s.setBodyJson)
  const content = body.type === "json" ? body.content : ""

  return (
    <div className="h-full p-3">
      <textarea
        value={content}
        onChange={(e) => setBodyJson(e.target.value)}
        placeholder='{ "key": "value" }'
        className="w-full h-full p-2 font-mono text-sm bg-background border-0 rounded resize-none focus:outline-none"
      />
    </div>
  )
}
