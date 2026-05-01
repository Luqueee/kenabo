export function formatSize(bytes: number): string {
  if (bytes === 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function formatDate(timestamp: number): string {
  if (timestamp === 0) return "—"
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {
    year: sameYear ? undefined : "numeric",
    month: "short",
    day: "numeric",
  })
}

export function pathSegments(path: string) {
  if (path === "/") return [{ label: "/", path: "/" }]
  const parts = path.split("/").filter(Boolean)
  return [
    { label: "/", path: "/" },
    ...parts.map((label, i) => ({
      label,
      path: "/" + parts.slice(0, i + 1).join("/"),
    })),
  ]
}

export function parentPath(path: string): string | null {
  if (path === "/") return null
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null
  const parent = "/" + parts.slice(0, -1).join("/")
  return parent || "/"
}

export function uniqueDestPath(dir: string, name: string): string {
  return `${dir}/${name}`
}
