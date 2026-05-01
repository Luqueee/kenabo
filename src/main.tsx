import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { addCollection } from "@iconify/react"
import type { IconifyJSON } from "@iconify/types"
import vscodeIconsData from "@iconify-json/vscode-icons/icons.json"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

addCollection(vscodeIconsData as IconifyJSON)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <main data-ui-scroll-container>
        <App />
      </main>
    </ThemeProvider>
  </StrictMode>
)
