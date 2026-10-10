import { prisma } from "../src/infra/db/prisma";

async function main() {
  const total = await prisma.invoice.count();
  const tomadores = await prisma.invoice.groupBy({ by: ["tomadorCnpj", "tomadorName"] });
  const emitentes = await prisma.invoice.groupBy({ by: ["emitenteCnpj", "emitenteName"] });
  console.log(`invoices=${total} tomadores=${tomadores.length} emitentes=${emitentes.length}`);
  console.log(JSON.stringify({ tomadores, emitentes }, null, 1));
}

main().finally(() => prisma.$disconnect());
