import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { addCollection } from "@iconify/react"
import type { IconifyJSON } from "@iconify/types"
import vscodeIconsData from "@iconify-json/vscode-icons/icons.json"

import "./index.css"
import App from "./app/App"
import { AppProviders } from "./app/providers"

addCollection(vscodeIconsData as IconifyJSON)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <main data-ui-scroll-container>
        <App />
      </main>
    </AppProviders>
  </StrictMode>
)
