import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { ShieldCheck, Users, Building2, FileText, UserCog } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const cards = [
    {
      href: "/admin/usuarios",
      icon: UserCog,
      title: "Usuários",
      desc: "Contas, papéis e acessos",
      color: "text-amber-400 bg-amber-500/10",
    },

    {
      href: "/admin/fornecedores",
      icon: Building2,
      title: "Fornecedores",
      desc: "Cadastro de emitentes (prestadores)",
      color: "text-cyan-400 bg-cyan-500/10",
    },
    {
      href: "/admin/clientes",
      icon: Users,
      title: "Clientes (Tomadores)",
      desc: "Cadastro de tomadores de serviço",
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      href: "/notas",
      icon: FileText,
      title: "Notas Fiscais",
      desc: "Inclusão, edição e arquivamento",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div>
      <Header
        title="Administração"
        subtitle="Gestão de cadastros e configurações do sistema"
      />

      <div className="p-6 space-y-6">
        <div className="glass-card rounded-xl p-6 border border-primary/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Área do administrador</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Somente usuários com papel admin podem acessar esta área.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ href, icon: Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="glass-card rounded-xl p-5 border border-border flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
