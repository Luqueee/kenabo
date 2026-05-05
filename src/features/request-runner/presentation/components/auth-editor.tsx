import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AuthScheme } from "../../domain/http-request"
import { useRunnerStore } from "../store"

export function AuthEditor() {
  const auth = useRunnerStore((s) => s.request.auth)
  const setAuth = useRunnerStore((s) => s.setAuth)

  const handleTypeChange = (type: AuthScheme["type"]) => {
    if (type === "none") setAuth({ type: "none" })
    else if (type === "basic") setAuth({ type: "basic", username: "", password: "" })
    else if (type === "bearer") setAuth({ type: "bearer", token: "" })
    else if (type === "api-key")
      setAuth({ type: "api-key", key: "", value: "", placement: "header" })
  }

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Auth type</Label>
        <Select value={auth.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No auth</SelectItem>
            <SelectItem value="basic">Basic auth</SelectItem>
            <SelectItem value="bearer">Bearer token</SelectItem>
            <SelectItem value="api-key">API key</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === "basic" && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={auth.username}
              onChange={(e) =>
                setAuth({ ...auth, username: e.target.value })
              }
              placeholder="username"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={auth.password}
              onChange={(e) =>
                setAuth({ ...auth, password: e.target.value })
              }
              placeholder="password"
              className="font-mono"
            />
          </div>
        </div>
      )}

      {auth.type === "bearer" && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Token</Label>
          <Input
            value={auth.token}
            onChange={(e) => setAuth({ ...auth, token: e.target.value })}
            placeholder="eyJhbGci..."
            className="font-mono"
          />
        </div>
      )}

      {auth.type === "api-key" && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Key</Label>
            <Input
              value={auth.key}
              onChange={(e) => setAuth({ ...auth, key: e.target.value })}
              placeholder="X-API-Key"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Value</Label>
            <Input
              value={auth.value}
              onChange={(e) => setAuth({ ...auth, value: e.target.value })}
              placeholder="your-api-key"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Add to</Label>
            <Select
              value={auth.placement}
              onValueChange={(v: "header" | "query") =>
                setAuth({ ...auth, placement: v })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query param</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
