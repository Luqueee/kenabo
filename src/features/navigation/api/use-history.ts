import { useCallback, useEffect, useRef, useState } from "react"

export function useHistory(initial: string | null) {
  const [current, setCurrent] = useState<string | null>(initial)
  const history = useRef<string[]>(initial ? [initial] : [])
  const index = useRef(initial ? 0 : -1)

  useEffect(() => {
    if (initial && history.current.length === 0) {
      history.current = [initial]
      index.current = 0
      setCurrent(initial)
    }
  }, [initial])

  const navigate = useCallback((p: string) => {
    history.current = [...history.current.slice(0, index.current + 1), p]
    index.current = history.current.length - 1
    setCurrent(p)
  }, [])

  const back = useCallback(() => {
    if (index.current <= 0) return
    index.current -= 1
    setCurrent(history.current[index.current])
  }, [])

  const forward = useCallback(() => {
    if (index.current >= history.current.length - 1) return
    index.current += 1
    setCurrent(history.current[index.current])
  }, [])

  return { current, navigate, back, forward }
}
