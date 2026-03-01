import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { UsersTable } from "@/components/users-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const sidebarUser = {
    name: session.username ?? session.email,
    email: session.email,
    avatar: "",
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <UsersTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
