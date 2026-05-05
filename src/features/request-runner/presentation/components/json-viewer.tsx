import type { ReactNode } from "react"

const TOKEN_RX =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([\[\]{}])|([:,])/g

function tokenizeLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  const rx = new RegExp(TOKEN_RX.source, "g")
  let m: RegExpExecArray | null

  while ((m = rx.exec(line)) !== null) {
    if (m.index > last) nodes.push(line.slice(last, m.index))

    const [full, str, colon, num, kw, bracket, punct] = m

    if (str !== undefined) {
      if (colon !== undefined) {
        nodes.push(
          <span key={m.index + "k"} className="text-sky-400">
            {str}
          </span>,
        )
        nodes.push(
          <span key={m.index + "c"} className="text-zinc-500">
            {colon}
          </span>,
        )
      } else {
        nodes.push(
          <span key={m.index} className="text-emerald-400">
            {str}
          </span>,
        )
      }
    } else if (num !== undefined) {
      nodes.push(
        <span key={m.index} className="text-amber-400">
          {num}
        </span>,
      )
    } else if (kw !== undefined) {
      const cls = kw === "null" ? "text-zinc-500 italic" : "text-violet-400"
      nodes.push(
        <span key={m.index} className={cls}>
          {kw}
        </span>,
      )
    } else if (bracket !== undefined) {
      nodes.push(
        <span key={m.index} className="text-zinc-400">
          {bracket}
        </span>,
      )
    } else if (punct !== undefined) {
      nodes.push(
        <span key={m.index} className="text-zinc-600">
          {punct}
        </span>,
      )
    }

    last = m.index + full.length
  }

  if (last < line.length) nodes.push(line.slice(last))
  return nodes
}

export function JsonViewer({ code }: { code: string }) {
  const lines = code.split("\n")

  return (
    <div className="p-3 text-xs font-mono select-text">
      {lines.map((line, i) => (
        <div key={i} className="flex hover:bg-white/5 rounded-sm">
          <span className="select-none text-right text-zinc-700 pr-4 min-w-[2.5rem] shrink-0">
            {i + 1}
          </span>
          <span className="whitespace-pre-wrap break-all">{tokenizeLine(line)}</span>
        </div>
      ))}
    </div>
  )
}
