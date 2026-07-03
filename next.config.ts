import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse é um módulo CJS — deve rodar no servidor sem ser empacotado pelo bundler
  serverExternalPackages: ["pdf-parse"],
  // Turbopack é o padrão no Next.js 16; configuração vazia silencia o aviso
  turbopack: {},
};

export default nextConfig;

