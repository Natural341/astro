import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="h-full relative">
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80">
          <Sidebar />
        </div>
        <main className="md:pl-72 h-full bg-background text-foreground">
          <Header />
          <div className="p-8 h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
