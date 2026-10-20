/**
 * Preenche a tela de Processos com dados de exemplo organizacionais.
 * Idempotente: não duplica processos se já existirem.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/seed-processos-exemplo.ts
 */
import { prisma } from "../src/infra/db/prisma";

const STEPS_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#64748b", // slate
];

async function main() {
  // Pega 2 clientes existentes para vincular (opcional)
  const clientes = await prisma.client.findMany({
    take: 3,
    select: { id: true, razaoSocial: true },
    orderBy: { razaoSocial: "asc" },
  });

  const c1 = clientes[0];
  const c2 = clientes[1];

  const processos = [
    {
      title: "Emissão de NFS-e Mensal",
      description: "Emissão das notas fiscais de serviços do mês referente à CONDOR SUPER CENTER LTDA",
      status: "em_andamento",
      clientId: c1?.id,
      steps: [
        {
          title: "Solicitação recebida",
          description: "Cliente solicitou emissão de notas do mês",
          color: STEPS_COLORS[0],
          date: new Date("2025-02-01T10:00:00Z"),
        },
        {
          title: "Documentos validados",
          description: "Contrato e cadastro verificados",
          color: STEPS_COLORS[1],
          date: new Date("2025-02-03T14:30:00Z"),
        },
        {
          title: "Emissão concluída",
          description: "Notas emitidas e enviadas por e-mail",
          color: STEPS_COLORS[3],
          date: new Date("2025-02-05T09:15:00Z"),
        },
      ],
    },
    {
      title: "Renovação de Contrato",
      description: "Renovação anual do contrato de prestação de serviços contábeis",
      status: "aguardando",
      clientId: c2?.id,
      steps: [
        {
          title: "Proposta enviada",
          description: "Nova proposta comercial enviada ao cliente",
          color: STEPS_COLORS[4],
          date: new Date("2025-01-20T11:00:00Z"),
        },
        {
          title: "Aguardando resposta",
          description: "Cliente analisando condições comerciais",
          color: STEPS_COLORS[2],
          date: new Date("2025-01-25T16:45:00Z"),
        },
      ],
    },
    {
      title: "Auditoria Fiscal Trimestral",
      description: "Revisão e conferência das notas emitidas no trimestre",
      status: "aberto",
      steps: [
        {
          title: "Planejamento",
          description: "Definição do escopo da auditoria",
          color: STEPS_COLORS[6],
          date: new Date("2025-02-10T08:00:00Z"),
        },
        {
          title: "Coleta de dados",
          description: "Exportação das notas do período",
          color: STEPS_COLORS[5],
          date: new Date("2025-02-12T10:30:00Z"),
        },
        {
          title: "Conferência",
          description: "Conferência de valores e alíquotas",
          color: STEPS_COLORS[1],
          date: new Date("2025-02-14T13:20:00Z"),
        },
        {
          title: "Relatório final",
          description: "Emissão do relatório de auditoria",
          color: STEPS_COLORS[3],
          date: new Date("2025-02-16T17:00:00Z"),
        },
      ],
    },
    {
      title: "Cadastro de Novo Tomador",
      description: "Inclusão de novo tomador de serviço no sistema",
      status: "concluido",
      steps: [
        {
          title: "Dados recebidos",
          description: "CNPJ e dados cadastrais recebidos",
          color: STEPS_COLORS[0],
          date: new Date("2025-01-15T09:00:00Z"),
        },
        {
          title: "Cadastro realizado",
          description: "Tomador cadastrado e validado",
          color: STEPS_COLORS[3],
          date: new Date("2025-01-16T14:00:00Z"),
        },
      ],
    },
    {
      title: "Correção de Nota Fiscal",
      description: "Solicitação de cancelamento e reemissão de nota com erro de descrição",
      status: "cancelado",
      steps: [
        {
          title: "Erro identificado",
          description: "Cliente notificou erro na descrição do serviço",
          color: STEPS_COLORS[4],
          date: new Date("2025-01-10T15:30:00Z"),
        },
        {
          title: "Processo cancelado",
          description: "Cancelado a pedido do cliente (nota mantida)",
          color: STEPS_COLORS[6],
          date: new Date("2025-01-12T10:00:00Z"),
        },
      ],
    },
  ];

  let criados = 0;
  for (const p of processos) {
    // Idempotência: verifica se já existe processo com mesmo título
    const existe = await prisma.process.findFirst({ where: { title: p.title } });
    if (existe) {
      console.log(`SKIP (já existe): ${p.title}`);
      continue;
    }

    const proc = await prisma.process.create({
      data: {
        title: p.title,
        description: p.description,
        status: p.status,
        clientId: p.clientId ?? null,
      },
    });

    // Cria as etapas da timeline
    for (const step of p.steps) {
      await prisma.processStep.create({
        data: {
          processId: proc.id,
          title: step.title,
          description: step.description,
          color: step.color,
          date: step.date,
        },
      });
    }

    criados++;
    console.log(`OK: ${p.title} (${p.steps.length} etapas)`);
  }

  console.log(`\n${criados} processo(s) criado(s) com sucesso.`);
  console.log("Acesse: /admin/processos");
}

main()
  .catch((err) => {
    console.error("ERRO:", err?.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });