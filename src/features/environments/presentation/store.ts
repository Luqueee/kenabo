import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Environment } from "../domain/environment"
import { makeEnvironmentService } from "../application/environment-service"
import { tauriEnvironmentGateway } from "../infrastructure/tauri-env-gateway"

const service = makeEnvironmentService(tauriEnvironmentGateway)

interface EnvironmentsState {
  environments: Environment[]
  activeId: string | null
  loading: boolean

  load: () => Promise<void>
  create: (name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  rename: (id: string, name: string) => Promise<void>
  setActive: (id: string | null) => void
  setVar: (envId: string, key: string, value: string, secret?: boolean) => Promise<void>
  renameVar: (envId: string, oldKey: string, newKey: string) => Promise<void>
  removeVar: (envId: string, key: string) => Promise<void>
}

function findEnv(environments: Environment[], id: string): Environment | undefined {
  return environments.find((e) => e.id === id)
}

export const useEnvironmentsStore = create<EnvironmentsState>()(
  immer((set, get) => ({
    environments: [],
    activeId: null,
    loading: false,

    load: async () => {
      set((s) => { s.loading = true })
      const environments = await service.list()
      set((s) => {
        s.environments = environments
        s.loading = false
      })
    },

    create: async (name) => {
      const env = await service.create(name)
      set((s) => {
        s.environments.push(env)
        s.activeId = env.id
      })
    },

    remove: async (id) => {
      await service.remove(id)
      set((s) => {
        s.environments = s.environments.filter((e) => e.id !== id)
        if (s.activeId === id) s.activeId = null
      })
    },

    rename: async (id, name) => {
      const env = findEnv(get().environments, id)
      if (!env) return
      const updated = { ...env, name }
      await service.save(updated)
      set((s) => {
        const e = s.environments.find((e) => e.id === id)
        if (e) e.name = name
      })
    },

    setActive: (id) => {
      set((s) => { s.activeId = id })
    },

    setVar: async (envId, key, value, secret = false) => {
      const env = findEnv(get().environments, envId)
      if (!env) return
      const updated = { ...env, variables: { ...env.variables, [key]: { value, secret } } }
      await service.save(updated)
      set((s) => {
        const e = s.environments.find((e) => e.id === envId)
        if (e) e.variables[key] = { value, secret }
      })
    },

    renameVar: async (envId, oldKey, newKey) => {
      const trimmed = newKey.trim()
      if (!trimmed || trimmed === oldKey) return
      const env = findEnv(get().environments, envId)
      if (!env) return
      const existing = env.variables[oldKey]
      if (!existing) return
      const { [oldKey]: _, ...rest } = env.variables
      const updated = { ...env, variables: { ...rest, [trimmed]: existing } }
      await service.save(updated)
      set((s) => {
        const e = s.environments.find((e) => e.id === envId)
        if (e) {
          delete e.variables[oldKey]
          e.variables[trimmed] = existing
        }
      })
    },

    removeVar: async (envId, key) => {
      const env = findEnv(get().environments, envId)
      if (!env) return
      const { [key]: _, ...rest } = env.variables
      const updated = { ...env, variables: rest }
      await service.save(updated)
      set((s) => {
        const e = s.environments.find((e) => e.id === envId)
        if (e) delete e.variables[key]
      })
    },
  })),
)
