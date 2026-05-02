# Arbor

Explorador de archivos de escritorio construido con Tauri 2, React 19 y Rust. Interfaz nativa liviana con búsqueda fuzzy de alta performance.

## Stack

| Capa        | Tecnología                                               |
| ----------- | -------------------------------------------------------- |
| Shell       | [Tauri 2](https://tauri.app/)                            |
| Frontend    | React 19 + TypeScript + Vite                             |
| Backend     | Rust                                                     |
| UI          | Tailwind CSS v4 + shadcn/ui + Radix UI                   |
| Búsqueda    | [nucleo-matcher](https://github.com/helix-editor/nucleo) |
| Drag & Drop | dnd-kit                                                  |
| Tabla       | TanStack Table                                           |

## Features

- **Navegación de directorios** — listado con directorios primero, ordenados alfabéticamente
- **Búsqueda fuzzy** — indexado paralelo con `ignore` + scoring con `nucleo-matcher` (hasta 250k archivos, top 100 resultados)
- **Operaciones de archivos** — crear, renombrar, eliminar, copiar, mover archivos y carpetas
- **Drag & Drop** — mover archivos arrastrando con dnd-kit
- **Iconos por extensión** — iconos de VS Code via `@iconify-json/vscode-icons`
- **Apertura nativa** — abre archivos con la aplicación por defecto del sistema
- **Context menu** — menú contextual con acciones sobre archivos
- **Sidebar** — bookmarks y acceso rápido a rutas frecuentes
- **Temas** — soporte dark/light mode con `next-themes`

## Requisitos

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/)
- [Rust](https://rustup.rs/) (toolchain stable)
- [Tauri CLI v2](https://tauri.app/start/prerequisites/)

En macOS también necesitás Xcode Command Line Tools:

```bash
xcode-select --install
```

## Instalación

```bash
bun install
```

## Desarrollo

```bash
bun tauri dev
```

## Build

```bash
bun tauri build
```

El binario y el instalador quedan en `src-tauri/target/release/bundle/`.

## Estructura

Arquitectura feature-based con frontera domain / infra / UI.

```
src/
├── app/                          # Composition root
│   ├── App.tsx                   # Compone providers + features
│   └── providers.tsx             # Tooltip + Sidebar providers
│
├── features/
│   ├── filesystem/               # Dominio de archivos
│   │   ├── domain/               # Tipos puros (FileEntry, Clipboard, path helpers)
│   │   ├── infra/                # Gateway Tauri (única puerta a invoke)
│   │   └── api/                  # Hooks: useDirectory, useFileOps, useClipboard
│   │
│   ├── file-explorer/            # UI feature: tabla + toolbar + context menu
│   │   ├── components/           # file-explorer, file-row, toolbar, etc.
│   │   └── types.ts
│   │
│   ├── navigation/               # Historial back/forward + favoritos
│   │   ├── api/                  # useHistory, useFavorites
│   │   └── infra/                # favorites.storage (localStorage)
│   │
│   ├── search/                   # Search palette + indexing
│   │   ├── api/                  # useSearch, useSearchIndex
│   │   └── components/
│   │
│   └── sidebar/                  # App sidebar con bookmarks
│       └── components/
│
├── shared/                       # Reusable cross-feature
│   ├── lib/                      # format helpers
│   └── tauri/                    # trackedInvoke + debug events
│
├── components/ui/                # shadcn/ui primitives (no tocar a mano)
├── lib/utils.ts                  # cn() — convención shadcn
├── hooks/use-mobile.ts           # stub para shadcn sidebar
├── main.tsx                      # entry Vite
└── index.css

src-tauri/src/
└── lib.rs                        # Backend Rust: fs ops, search index, walk paralelo
```

### Reglas de capas

- **`domain/`** — sin imports de React, ni Tauri, ni libs UI. Tipos + funciones puras.
- **`infra/`** — única capa que toca `@tauri-apps/api` o `localStorage`. Resto consume `gateway` o storage.
- **`api/`** — hooks React que orquestan domain + infra.
- **`components/`** — UI. Consume `api/`, nunca `infra/` directo.
- **Cross-feature**: prohibido. Si una feature necesita otra, sube a `shared/` o a `app/`.

## Comandos Tauri (Rust → Frontend)

| Comando                      | Descripción                       |
| ---------------------------- | --------------------------------- |
| `list_directory`             | Lista entradas de un directorio   |
| `get_home_dir`               | Retorna el home del usuario       |
| `open_file`                  | Abre archivo con app nativa       |
| `search_files`               | Búsqueda fuzzy en índice          |
| `index_path`                 | Construye índice de un directorio |
| `clear_search_index`         | Limpia caché del índice           |
| `create_dir` / `create_file` | Crea directorio o archivo         |
| `rename_entry`               | Renombra archivo o carpeta        |
| `delete_entry`               | Elimina archivo o carpeta         |
| `copy_entry` / `move_entry`  | Copia o mueve entradas            |

## Scripts

```bash
bun dev          # Vite dev server (sin Tauri)
bun lint         # ESLint
bun typecheck    # tsc sin emit
bun format       # Prettier
```

## Colaborar

### Setup

1. Fork del repo y clone:
   ```bash
   git clone https://github.com/<tu-usuario>/file-explorer.git
   cd file-explorer
   ```
2. Instalar dependencias:
   ```bash
   bun install
   ```
3. Verificar que arranca:
   ```bash
   bun tauri dev
   ```

### Flujo de trabajo

1. Crear branch desde `main` con prefijo según tipo:
   - `feat/<nombre>` — feature nueva
   - `fix/<nombre>` — bugfix
   - `refactor/<nombre>` — refactor sin cambio de comportamiento
   - `docs/<nombre>` — documentación
2. Commits en formato [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(file-explorer): añadir vista en grid
   fix(search): corregir scoring con queries vacías
   refactor(navigation): extraer historial a hook
   ```
3. Antes del push, validar localmente:
   ```bash
   bun typecheck
   bun lint
   bun format
   ```
4. Abrir PR contra `main` con descripción clara: qué, por qué, cómo se probó.

### Dónde poner el código

Decidí en este orden:

1. ¿Es un tipo o función pura del dominio (sin React/Tauri)? → `features/<feature>/domain/`
2. ¿Toca Tauri, `localStorage`, red? → `features/<feature>/infra/`
3. ¿Es un hook que orquesta domain + infra? → `features/<feature>/api/`
4. ¿Es UI específica de la feature? → `features/<feature>/components/`
5. ¿Lo usan dos o más features? → `shared/`
6. ¿Es un primitive shadcn? → `components/ui/` (vía `npx shadcn add`)

### Reglas

- **No crear** componentes en `src/components/` raíz. Pertenecen a una feature.
- **No importar** `@tauri-apps/api` fuera de `features/*/infra/` ni de `shared/tauri/`.
- **No importar** entre features (`features/a` → `features/b`). Si compartís lógica, mová a `shared/`.
- **No tocar a mano** `components/ui/`. Usar `npx shadcn add <component>`.
- Mantener `domain/` puro: cero side effects, cero imports de React.
- Type checking debe pasar antes de mergear (`bun typecheck`).

### Añadir una feature nueva

```
src/features/<nombre>/
├── domain/        # tipos + funciones puras
├── infra/         # gateway Tauri o storage
├── api/           # hooks React
└── components/    # UI
```

Exponer la feature consumiéndola desde `app/App.tsx` o desde la feature padre.

### Añadir un comando Tauri nuevo

1. Implementar en `src-tauri/src/lib.rs` y registrar en `tauri::generate_handler!`.
2. Añadir el método al `fsGateway` en `src/features/filesystem/infra/fs.gateway.ts`.
3. Si el dominio cambia, actualizar tipos en `src/features/filesystem/domain/`.
4. Crear o ampliar el hook en `src/features/filesystem/api/` si la UI lo necesita.

### Issues y discusiones

- Reportar bugs con pasos para reproducir + sistema operativo + versión de Tauri.
- Para features grandes, abrir un issue de discusión antes del PR.
