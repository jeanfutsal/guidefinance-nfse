import { requireAdmin } from "@/lib/permissions";
import { Sidebar } from "@/components/ui/Sidebar";
import { SidebarProvider } from "@/components/ui/SidebarContext";

/**
 * Layout das áreas administrativas.
 * Redireciona para /login sem sessão e para /403 se não for admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
