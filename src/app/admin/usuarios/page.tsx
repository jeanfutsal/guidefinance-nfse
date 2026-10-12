import { Header } from "@/components/ui/Header";
import { requireAdmin } from "@/lib/permissions";
import { UsersManager } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div>
      <Header
        title="Usuários"
        subtitle="Gestão de contas, papéis e acessos do sistema"
      />
      <div className="p-6">
        <UsersManager />
      </div>
    </div>
  );
}
