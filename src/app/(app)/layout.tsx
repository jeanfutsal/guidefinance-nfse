import { Sidebar } from "@/components/ui/Sidebar";
import { SidebarProvider } from "@/components/ui/SidebarContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Sem redirect de sessão aqui: /, /notas e /relatorios são públicas
  // (definidas em src/proxy.ts). Rotas como /tickets e /upload continuam
  // barradas pelo proxy; os dados de verdade são protegidos nas APIs (401/403).
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
