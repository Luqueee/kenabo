import { CollectionsSidebar } from "@/features/collections/presentation/CollectionsSidebar"
import { RequestRunner } from "@/features/request-runner/presentation/RequestRunner"

export function Workspace() {
  return (
    <div className="flex h-svh w-full">
      <CollectionsSidebar />
      <main className="flex-1 flex min-w-0">
        <RequestRunner />
      </main>
    </div>
  )
}
