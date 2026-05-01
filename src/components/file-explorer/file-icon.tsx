import { Icon } from "@iconify/react"
import { Folder, File } from "lucide-react"
import type { FileEntry } from "./types"

const FILENAME_ICON: Record<string, string> = {
  Dockerfile: "vscode-icons:file-type-docker",
  "docker-compose.yml": "vscode-icons:file-type-docker",
  "docker-compose.yaml": "vscode-icons:file-type-docker",
  ".gitignore": "vscode-icons:file-type-git",
  ".gitattributes": "vscode-icons:file-type-git",
  ".gitmodules": "vscode-icons:file-type-git",
  "package.json": "vscode-icons:file-type-npm",
  "package-lock.json": "vscode-icons:file-type-npm",
  "yarn.lock": "vscode-icons:file-type-yarn",
  "Cargo.toml": "vscode-icons:file-type-cargo",
  "Cargo.lock": "vscode-icons:file-type-cargo",
  "tsconfig.json": "vscode-icons:file-type-tsconfig",
  "jsconfig.json": "vscode-icons:file-type-jsconfig",
  ".env": "vscode-icons:file-type-dotenv",
  ".env.local": "vscode-icons:file-type-dotenv",
  ".env.development": "vscode-icons:file-type-dotenv",
  ".env.production": "vscode-icons:file-type-dotenv",
  ".editorconfig": "vscode-icons:file-type-editorconfig",
  "LICENSE": "vscode-icons:file-type-license",
  "LICENSE.md": "vscode-icons:file-type-license",
  "schema.prisma": "vscode-icons:file-type-prisma",
}

const EXT_ICON: Record<string, string> = {
  // TypeScript
  ts: "vscode-icons:file-type-typescript",
  mts: "vscode-icons:file-type-typescript",
  cts: "vscode-icons:file-type-typescript",
  tsx: "vscode-icons:file-type-reactts",
  // JavaScript
  js: "vscode-icons:file-type-javascript",
  mjs: "vscode-icons:file-type-javascript",
  cjs: "vscode-icons:file-type-javascript",
  jsx: "vscode-icons:file-type-reactjs",
  // Web
  html: "vscode-icons:file-type-html",
  htm: "vscode-icons:file-type-html",
  css: "vscode-icons:file-type-css",
  scss: "vscode-icons:file-type-scss",
  sass: "vscode-icons:file-type-sass",
  less: "vscode-icons:file-type-less",
  // Data / Config
  json: "vscode-icons:file-type-json",
  yaml: "vscode-icons:file-type-yaml",
  yml: "vscode-icons:file-type-yaml",
  toml: "vscode-icons:file-type-toml",
  xml: "vscode-icons:file-type-xml",
  // Docs
  md: "vscode-icons:file-type-markdown",
  mdx: "vscode-icons:file-type-mdx",
  txt: "vscode-icons:file-type-text",
  pdf: "vscode-icons:file-type-pdf2",
  doc: "vscode-icons:file-type-word",
  docx: "vscode-icons:file-type-word",
  xls: "vscode-icons:file-type-excel",
  xlsx: "vscode-icons:file-type-excel",
  ppt: "vscode-icons:file-type-powerpoint",
  pptx: "vscode-icons:file-type-powerpoint",
  // Systems / General purpose
  py: "vscode-icons:file-type-python",
  pyw: "vscode-icons:file-type-python",
  rs: "vscode-icons:file-type-rust",
  go: "vscode-icons:file-type-go",
  java: "vscode-icons:file-type-java",
  c: "vscode-icons:file-type-c",
  cpp: "vscode-icons:file-type-cpp",
  cc: "vscode-icons:file-type-cpp",
  cxx: "vscode-icons:file-type-cpp",
  h: "vscode-icons:file-type-cppheader",
  hpp: "vscode-icons:file-type-cppheader",
  cs: "vscode-icons:file-type-csharp",
  rb: "vscode-icons:file-type-ruby",
  php: "vscode-icons:file-type-php",
  swift: "vscode-icons:file-type-swift",
  kt: "vscode-icons:file-type-kotlin",
  kts: "vscode-icons:file-type-kotlin",
  lua: "vscode-icons:file-type-lua",
  dart: "vscode-icons:file-type-dartlang",
  ex: "vscode-icons:file-type-elixir",
  exs: "vscode-icons:file-type-elixir",
  elm: "vscode-icons:file-type-elm",
  hs: "vscode-icons:file-type-haskell",
  scala: "vscode-icons:file-type-scala",
  pl: "vscode-icons:file-type-perl",
  pm: "vscode-icons:file-type-perl",
  r: "vscode-icons:file-type-r",
  clj: "vscode-icons:file-type-clojure",
  cljs: "vscode-icons:file-type-clojure",
  erl: "vscode-icons:file-type-erlang",
  hrl: "vscode-icons:file-type-erlang",
  // Frameworks
  vue: "vscode-icons:file-type-vue",
  svelte: "vscode-icons:file-type-svelte",
  // DB / Query
  sql: "vscode-icons:file-type-sql",
  graphql: "vscode-icons:file-type-graphql",
  gql: "vscode-icons:file-type-graphql",
  prisma: "vscode-icons:file-type-prisma",
  // Shell
  sh: "vscode-icons:file-type-shell",
  bash: "vscode-icons:file-type-shell",
  zsh: "vscode-icons:file-type-shell",
  fish: "vscode-icons:file-type-shell",
  ps1: "vscode-icons:file-type-powershell",
  // Keys / Certs
  pem: "vscode-icons:file-type-key",
  key: "vscode-icons:file-type-key",
  // Env
  env: "vscode-icons:file-type-dotenv",
  // Media — images
  png: "vscode-icons:file-type-image",
  jpg: "vscode-icons:file-type-image",
  jpeg: "vscode-icons:file-type-image",
  gif: "vscode-icons:file-type-image",
  webp: "vscode-icons:file-type-image",
  bmp: "vscode-icons:file-type-image",
  tiff: "vscode-icons:file-type-image",
  heic: "vscode-icons:file-type-image",
  ico: "vscode-icons:file-type-image",
  svg: "vscode-icons:file-type-svg",
  // Media — video
  mp4: "vscode-icons:file-type-video",
  mov: "vscode-icons:file-type-video",
  avi: "vscode-icons:file-type-video",
  mkv: "vscode-icons:file-type-video",
  webm: "vscode-icons:file-type-video",
  m4v: "vscode-icons:file-type-video",
  // Media — audio
  mp3: "vscode-icons:file-type-audio",
  wav: "vscode-icons:file-type-audio",
  flac: "vscode-icons:file-type-audio",
  aac: "vscode-icons:file-type-audio",
  ogg: "vscode-icons:file-type-audio",
  m4a: "vscode-icons:file-type-audio",
  opus: "vscode-icons:file-type-audio",
  // Archives
  zip: "vscode-icons:file-type-zip",
  tar: "vscode-icons:file-type-zip",
  gz: "vscode-icons:file-type-zip",
  rar: "vscode-icons:file-type-zip",
  "7z": "vscode-icons:file-type-zip",
  bz2: "vscode-icons:file-type-zip",
  xz: "vscode-icons:file-type-zip",
}

export function FileIcon({ entry }: { entry: FileEntry }) {
  const cls = "h-4 w-4 shrink-0"

  if (entry.is_dir)
    return <Folder className={`${cls} fill-blue-400/30 text-blue-400`} />

  const nameIcon = FILENAME_ICON[entry.name]
  if (nameIcon) return <Icon icon={nameIcon} width={16} height={16} />

  const ext = entry.extension ?? ""
  const extIcon = EXT_ICON[ext]
  if (extIcon) return <Icon icon={extIcon} width={16} height={16} />

  return <File className={`${cls} text-muted-foreground`} />
}
