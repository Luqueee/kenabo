import { invoke } from "@tauri-apps/api/core"

export const tauri = {
  invoke: <T>(cmd: string, args?: Record<string, unknown>): Promise<T> =>
    invoke<T>(cmd, args),
}
