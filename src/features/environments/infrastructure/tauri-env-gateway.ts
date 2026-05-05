import { tauri } from "@/shared/infrastructure/tauri-client"
import type { Environment } from "../domain/environment"

export interface EnvironmentGateway {
  list(): Promise<Environment[]>
  create(name: string): Promise<Environment>
  save(environment: Environment): Promise<void>
  delete(id: string): Promise<void>
}

export const tauriEnvironmentGateway: EnvironmentGateway = {
  list: () => tauri.invoke<Environment[]>("list_environments"),
  create: (name) => tauri.invoke<Environment>("create_environment", { name }),
  save: (environment) =>
    tauri.invoke<void>("save_environment", { environment }),
  delete: (id) => tauri.invoke<void>("delete_environment", { id }),
}
