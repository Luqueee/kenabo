import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "./button"
import { Input } from "./input"

interface InputDialogProps {
  title: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

function InputDialog({ title, defaultValue = "", onConfirm, onCancel }: InputDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const confirm = () => {
    const trimmed = value.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-background border rounded-lg shadow-lg p-4 w-72 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium">{title}</p>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm()
            if (e.key === "Escape") onCancel()
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={confirm}>OK</Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface DialogState {
  title: string
  defaultValue: string
  resolve: (value: string | null) => void
}

let setDialogState: ((state: DialogState | null) => void) | null = null

export function InputDialogProvider() {
  const [state, setState] = useState<DialogState | null>(null)
  setDialogState = setState

  if (!state) return null

  return (
    <InputDialog
      title={state.title}
      defaultValue={state.defaultValue}
      onConfirm={(value) => {
        state.resolve(value)
        setState(null)
      }}
      onCancel={() => {
        state.resolve(null)
        setState(null)
      }}
    />
  )
}

export function showInputDialog(title: string, defaultValue = ""): Promise<string | null> {
  return new Promise((resolve) => {
    setDialogState?.({ title, defaultValue, resolve })
  })
}
