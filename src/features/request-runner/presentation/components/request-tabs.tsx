import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HeadersEditor } from "./headers-editor"
import { BodyEditor } from "./body-editor"

export function RequestTabs() {
  return (
    <Tabs defaultValue="headers" className="flex flex-col flex-1 min-h-0">
      <TabsList className="mx-3 mt-2 shrink-0">
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="body">Body</TabsTrigger>
        <TabsTrigger value="auth" disabled>
          Auth
        </TabsTrigger>
        <TabsTrigger value="query" disabled>
          Query
        </TabsTrigger>
      </TabsList>
      <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto mt-0">
        <HeadersEditor />
      </TabsContent>
      <TabsContent value="body" className="flex-1 min-h-0 overflow-auto mt-0">
        <BodyEditor />
      </TabsContent>
    </Tabs>
  )
}
