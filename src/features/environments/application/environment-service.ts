import type { EnvironmentGateway } from "../infrastructure/tauri-env-gateway"

export const makeEnvironmentService = (gateway: EnvironmentGateway) => ({
  list: () => gateway.list(),
  create: (name: string) => gateway.create(name),
  save: gateway.save,
  remove: gateway.delete,
})
