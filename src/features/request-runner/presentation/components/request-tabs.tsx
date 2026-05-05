import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthEditor } from "./auth-editor"
import { BodyEditor } from "./body-editor"
import { HeadersEditor } from "./headers-editor"
import { QueryParamsEditor } from "./query-params-editor"

export function RequestTabs() {
  return (
    <Tabs defaultValue="headers" className="flex flex-col flex-1 min-h-0">
      <TabsList className="mx-3 mt-2 shrink-0">
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="body">Body</TabsTrigger>
        <TabsTrigger value="auth">Auth</TabsTrigger>
        <TabsTrigger value="query">Query</TabsTrigger>
      </TabsList>
      <TabsContent value="headers" className="flex-1 min-h-0 overflow-auto mt-0">
        <HeadersEditor />
      </TabsContent>
      <TabsContent value="body" className="flex-1 min-h-0 mt-0">
        <BodyEditor />
      </TabsContent>
      <TabsContent value="auth" className="flex-1 min-h-0 overflow-auto mt-0">
        <AuthEditor />
      </TabsContent>
      <TabsContent value="query" className="flex-1 min-h-0 overflow-auto mt-0">
        <QueryParamsEditor />
      </TabsContent>
    </Tabs>
  )
}
