import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/ui/Sidebar";
import { SidebarProvider } from "@/components/ui/SidebarContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Validação real da sessão (o proxy apenas faz o check otimista do cookie)
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
