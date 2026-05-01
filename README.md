# File Explorer

Explorador de archivos de escritorio construido con Tauri 2, React 19 y Rust. Interfaz nativa liviana con búsqueda fuzzy de alta performance.

## Stack

| Capa | Tecnología |
|------|-----------|
| Shell | [Tauri 2](https://tauri.app/) |
| Frontend | React 19 + TypeScript + Vite |
| Backend | Rust |
| UI | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Búsqueda | [nucleo-matcher](https://github.com/helix-editor/nucleo) |
| Drag & Drop | dnd-kit |
| Tabla | TanStack Table |

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

```
src/
├── components/
│   ├── file-explorer/   # Componente principal (tabla, toolbar, context menu)
│   ├── app-sidebar.tsx  # Sidebar con bookmarks
│   └── search-palette.tsx
├── lib/
│   ├── fs.ts            # Bindings TypeScript → comandos Tauri
│   └── tauri.ts
└── App.tsx

src-tauri/src/
└── lib.rs               # Backend Rust: fs ops, search index, walk paralelo
```

## Comandos Tauri (Rust → Frontend)

| Comando | Descripción |
|---------|-------------|
| `list_directory` | Lista entradas de un directorio |
| `get_home_dir` | Retorna el home del usuario |
| `open_file` | Abre archivo con app nativa |
| `search_files` | Búsqueda fuzzy en índice |
| `index_path` | Construye índice de un directorio |
| `clear_search_index` | Limpia caché del índice |
| `create_dir` / `create_file` | Crea directorio o archivo |
| `rename_entry` | Renombra archivo o carpeta |
| `delete_entry` | Elimina archivo o carpeta |
| `copy_entry` / `move_entry` | Copia o mueve entradas |

## Scripts

```bash
bun dev          # Vite dev server (sin Tauri)
bun lint         # ESLint
bun typecheck    # tsc sin emit
bun format       # Prettier
```
