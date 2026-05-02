# File Explorer — Tareas de mejora

> Auditoría 2026-05-03. Agrupado por categoría. Prioridad: 🔴 crítico · 🟡 alto · 🟢 medio.

---

## 🔒 Seguridad

- [ ] 🔴 **Path traversal en `rename_entry`** ([src-tauri/src/lib.rs:280-287](src-tauri/src/lib.rs#L280-L287))
  - Validar `..`, symlinks, colisiones case-insensitive macOS.
  - Canonicalizar `Path` y verificar que resultado siga bajo `parentPath`.
- [ ] 🔴 **Shell injection terminal Linux/Windows** ([src-tauri/src/lib.rs:451](src-tauri/src/lib.rs#L451))
  - Usar `Command::new()` sin shell. Args aislados. `shellwords::split()` si hace falta parsear.
- [ ] 🟡 **SMB password en memoria** ([src-tauri/src/smb.rs:57-77](src-tauri/src/smb.rs#L57-L77))
  - Zero-fill buffer post-mount.
  - Validar credenciales antes de keychain.
- [ ] 🟡 **Symlinks sin canonicalizar** en mounts SMB.

## ⚡ Performance

- [ ] 🔴 **Virtualización listas** ([src/features/file-explorer/components/file-table.tsx](src/features/file-explorer/components/file-table.tsx), [file-grid.tsx](src/features/file-explorer/components/file-grid.tsx))
  - Integrar `@tanstack/react-virtual` o `react-window`.
  - Estimado: 5x perf con 10k+ entradas.
- [ ] 🟡 **Paginación `list_directory`** ([src-tauri/src/lib.rs:36-82](src-tauri/src/lib.rs#L36-L82))
  - Params `limit`, `offset`. Evitar carga total memoria.
- [ ] 🟡 **Invalidación índice selectiva** ([src/features/file-explorer/hooks/use-file-ops.ts:13](src/features/file-explorer/hooks/use-file-ops.ts#L13))
  - Reemplazar `clearIndex()` global por invalidación de subtree.
  - LRU + TTL.
- [ ] 🟢 **Search debounce con `useDeferredValue`** ([src/features/search/hooks/use-search.ts:46-47](src/features/search/hooks/use-search.ts#L46-L47))
  - Quitar `setTimeout` hardcoded.

## 🏗️ Arquitectura

- [ ] 🟡 **Partir `ExplorerContext`** (487 líneas, [explorer-context.tsx](src/features/file-explorer/state/explorer-context.tsx))
  - `ClipboardProvider`
  - `SelectionProvider`
  - `ViewProvider`
  - Hook `useDragDrop` (extraer drag-drop del provider).
- [ ] 🟡 **Modularizar backend Rust** (`lib.rs` 692 líneas)
  - `fs.rs` · `search.rs` · `terminal.rs` · `system.rs`.
- [ ] 🟢 **Capa gateway con retry/queue** ([src/features/filesystem/infrastructure/fs.gateway.ts](src/features/filesystem/infrastructure/fs.gateway.ts))
  - Queue pattern. Backoff exponencial.

## 🎨 UX

- [ ] 🔴 **Multi-select** ([explorer-context.tsx:62](src/features/file-explorer/state/explorer-context.tsx#L62))
  - Cambiar `selected: string` → `Set<string>`.
  - Shift+Click (rango), Ctrl/Cmd+Click (toggle).
- [ ] 🟡 **Undo/Redo** delete/rename/move
  - Stack con `immer`. Hook `useUndoStack`.
- [ ] 🟡 **Hotkeys faltantes**
  - `Ctrl+A` select all
  - `Ctrl+Shift+N` new folder
  - `Ctrl+L` focus address bar
- [ ] 🟢 **Drag-drop feedback copy vs move**
  - Detectar Ctrl/Alt. Cursor + indicador visual.
- [ ] 🟢 **Search palette enriquecido**
  - Mostrar size, icono tipo, mtime.

## 🧪 Testing

- [ ] 🟡 **Setup vitest** (frontend)
  - Suites: hooks, utils, gateway.
- [ ] 🟡 **`cargo test`** (backend)
  - Sanitización paths
  - SMB failure cases
  - Concurrent IPC
- [ ] 🟢 **Benchmarks** dirs grandes (1k/10k/100k entradas).

## 🐛 Observabilidad

- [ ] 🟡 **Error enum tipado**
  - `PermissionDenied` · `NotFound` · `NoSpace` · `NetworkError`.
  - Localizar mensajes. Reemplazar `setError(String(e))`.
- [ ] 🟡 **Logging persistente** con `@tauri-apps/plugin-log`
  - Reemplazar `console.error` (se borra prod).
- [ ] 🟢 **SMB unmount errors no silenciosos** ([use-smb.ts:60-85](src/features/smb/hooks/use-smb.ts#L60-L85))

## ♿ Accesibilidad

- [ ] 🟡 **ARIA en `file-row`**
  - `role="button"`, `aria-label`, `aria-selected`.
- [ ] 🟢 **Focus trap context menu** + ESC para cerrar.
- [ ] 🟢 **Indicador selección no sólo color**
  - Border/check icon además de `bg-accent/60`.

## 🔌 Tauri-specific

- [ ] 🟡 **Batch mutations** — un command para rename+refresh, no 3 invokes.
- [ ] 🟢 **Cancelación búsquedas largas** — request-id consistente.
- [ ] 🟢 **Granularidad commands** — separar list/sort/filter.

---

## 🚀 Quick wins (alto ROI)

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Virtualización listas | 1-2h | 5x perf |
| 2 | Path canonicalization + symlink check | 1h | Seguridad crítica |
| 3 | Partir ExplorerContext | 2h | Mantenibilidad |
| 4 | Error enum tipado | 2h | UX + debug |

## Orden sugerido

1. Quick wins (1-4)
2. Multi-select + undo
3. Modularizar Rust backend
4. Setup tests
5. A11y + observabilidad
