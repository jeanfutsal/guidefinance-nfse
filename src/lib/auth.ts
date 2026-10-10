import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { prisma } from "@/infra/db/prisma";

// Instância do Better Auth — lê BETTER_AUTH_SECRET e BETTER_AUTH_URL do .env
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Fase 2.1 - Segurança: cadastro público desativado.
    // Contas são criadas pelo script scripts/seed-admin.ts ou via plugin admin.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
    },
  },
  // nextCookies deve ser sempre o último plugin (necessário para Server Actions)
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});
