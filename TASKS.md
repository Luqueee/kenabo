# Kenabo — API Client MVP

## Request Runner

- [x] Tab Query Params (editor habilitado)
- [x] Tab Auth (basic, bearer, api-key)
- [x] Selector de tipo de body (none/json/text/form/raw)
- [x] Pretty-print toggle en response body
- [x] Copiar response body al portapapeles
- [x] Copiar request como cURL

## Collections

- [ ] Tree de folders con expand/collapse
- [ ] Agregar request dentro de folder
- [ ] Drag & drop para reorganizar
- [ ] Click en request → carga en runner
- [ ] Rename / delete request y folder
- [ ] Persistir request editado de vuelta a la colección

## Tabs de trabajo

- [ ] Abrir múltiples requests en tabs (como browser)
- [ ] Persistir tabs activos entre sesiones
- [ ] Indicador de unsaved changes por tab

## Environments

- [ ] UI para crear/editar environments
- [ ] Selector de environment activo (dropdown en toolbar)
- [ ] Editor de variables (key/value/secret)
- [ ] Mostrar variables resueltas en URL bar (preview)

## Historial

- [ ] Guardar cada request ejecutado con timestamp
- [ ] Panel de historial con filtro
- [ ] Reabrir request desde historial

## UI / Shell

- [ ] Toolbar superior (env selector, settings)
- [ ] Layout drag para redimensionar paneles (split drag)
- [ ] Tema claro/oscuro
- [ ] Atajos de teclado (Ctrl+Enter = send, Ctrl+W = cerrar tab)

## Fase 2

- [ ] Import colección Postman (v2.1 JSON)
- [ ] Import colección Bruno (.bru)
- [ ] Export colección
- [ ] Scripting pre/post request (sandbox JS via `boa`)
- [ ] Variables de colección (además de env)
- [ ] WebSocket support
- [ ] gRPC support
