import { UrlBar } from "./components/url-bar"
import { RequestTabs } from "./components/request-tabs"
import { ResponsePanel } from "./components/response-panel"

export function RequestRunner() {
  return (
    <div className="flex flex-col flex-1 h-full">
      <UrlBar />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col border-r min-w-0 min-h-0">
          <RequestTabs />
        </div>
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <ResponsePanel />
        </div>
      </div>
    </div>
  )
}
