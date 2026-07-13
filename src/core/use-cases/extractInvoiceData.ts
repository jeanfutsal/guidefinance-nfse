import { Invoice } from "../entities/Invoice";

/**
 * Utilitário para limpar strings de valores monetários brasileiros (ex: "R$ 6.000,00")
 * e converter para número de ponto flutuante.
 */
export function parseBrValue(valStr: string | null | undefined): number {
  if (!valStr || valStr === "-" || valStr.trim() === "") return 0;
  const cleaned = valStr
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Converte data em formato brasileiro "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY" para string ISO.
 */
export function parseBrDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.trim() === "") return new Date().toISOString();
  
  let sanitized = dateStr.trim();
  // Se a data e a hora estiverem juntas sem espaço (ex: "17/03/202620:35:23")
  const mergedMatch = sanitized.match(/^(\d{2}\/\d{2}\/\d{4})(\d{2}:\d{2}(?::\d{2})?)$/);
  if (mergedMatch) {
    sanitized = `${mergedMatch[1]} ${mergedMatch[2]}`;
  }
  
  const parts = sanitized.split(" ");
  const dateParts = parts[0].split("/");
  if (dateParts.length !== 3) return new Date().toISOString();
  
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed em JS
  const year = parseInt(dateParts[2], 10);
  
  let hours = 12;
  let minutes = 0;
  let seconds = 0;
  
  if (parts.length > 1 && parts[1]) {
    const timeParts = parts[1].split(":");
    if (timeParts.length >= 3) {
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
      seconds = parseInt(timeParts[2], 10);
    } else if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
  }
  
  const date = new Date(year, month, day, hours, minutes, seconds);
  return date.toISOString();
}

/**
 * Função principal para extrair os dados estruturados a partir do texto de uma NFS-e padrão nacional.
 */
export function extractInvoiceData(text: string): Omit<Invoice, "id"> {
  // 1. Chave de Acesso (50 dígitos de NFS-e nacional ou 44 de NF-e)
  const accessKeyMatch = text.match(/\b\d{44,50}\b/);
  const accessKey = accessKeyMatch ? accessKeyMatch[0] : "";

  // 2. Número da NFS-e
  const numberMatch = text.match(/N[úu]mero\s*da\s*NFS-e\s*\n\s*(\d+)/i);
  const number = numberMatch ? numberMatch[1] : "0";

  // 3. Competência da NFS-e
  const competenceMatch = text.match(/Compet[êe]ncia\s*da\s*NFS-e\s*\n\s*([\d/]+)/i);
  const competenceDate = competenceMatch ? competenceMatch[1] : "";

  // 4. Data e Hora da emissão
  const issueDateMatch = text.match(/Data\s*e\s*Hora\s*da\s*emiss[ãa]o\s*da\s*NFS-e\s*\n\s*([\d/ :]+)/i);
  const issueDate = issueDateMatch ? parseBrDate(issueDateMatch[1]) : new Date().toISOString();

  // 5. Blocos Emitente e Tomador (separados por TOMADOR DO SERVIÇO)
  const blocks = text.split(/TOMADOR\s*DO\s*SERVI[ÇC]O/i);
  const emitenteBlock = blocks[0] || "";
  const afterTomador = blocks[1] || "";
  const tomadorBlock = afterTomador.split(/INTERMEDI[ÁA]RIO\s*DO\s*SERVI[ÇC]O/i)[0] || "";

  // Emitente CNPJ
  const emitenteCnpjMatch = emitenteBlock.match(/CNPJ\s*[\/\\|]\s*CPF\s*[\/\\|]\s*NIF\s*\n\s*([\d./-]+)/i);
  const emitenteCnpj = emitenteCnpjMatch ? emitenteCnpjMatch[1] : "";

  // Emitente Nome
  const emitenteNameMatch = emitenteBlock.match(/Nome\s*[\/\\|]\s*Nome\s*Empresarial\s*\n\s*([^\n]+)/i);
  let emitenteName = emitenteNameMatch ? emitenteNameMatch[1].trim() : "";
  // Limpar CNPJ ou prefixo numérico grudado no nome
  emitenteName = emitenteName.replace(/^[\d./-]+\s*/, "");

  // Emitente Cidade/UF
  const emitenteCityMatch = emitenteBlock.match(/Munic[íi]pio\s*\n\s*([^\n]+)/i);
  let emitenteCity = "";
  let emitenteState = "";
  if (emitenteCityMatch) {
    const parts = emitenteCityMatch[1].split("-");
    emitenteCity = parts[0]?.trim() || "";
    emitenteState = parts[1]?.trim() || "";
  }

  // Tomador CNPJ
  const tomadorCnpjMatch = tomadorBlock.match(/CNPJ\s*[\/\\|]\s*CPF\s*[\/\\|]\s*NIF\s*\n\s*([\d./-]+)/i);
  const tomadorCnpj = tomadorCnpjMatch ? tomadorCnpjMatch[1] : "";

  // Tomador Nome
  const tomadorNameMatch = tomadorBlock.match(/Nome\s*[\/\\|]\s*Nome\s*Empresarial\s*\n\s*([^\n]+)/i);
  let tomadorName = tomadorNameMatch ? tomadorNameMatch[1].trim() : "";
  tomadorName = tomadorName.replace(/^[\d./-]+\s*/, "");

  // Tomador Cidade/UF
  const tomadorCityMatch = tomadorBlock.match(/Munic[íi]pio\s*\n\s*([^\n]+)/i);
  let tomadorCity = "";
  let tomadorState = "";
  if (tomadorCityMatch) {
    const parts = tomadorCityMatch[1].split("-");
    tomadorCity = parts[0]?.trim() || "";
    tomadorState = parts[1]?.trim() || "";
  }

  // 6. Serviço
  const serviceCodeMatch = text.match(/C[oó]digo\s*de\s*Tributa[çc][aã]o\s*Nacional\s*\n\s*([^\n]+)/i);
  const serviceCode = serviceCodeMatch ? serviceCodeMatch[1].trim() : "";

  // Descrição do Serviço
  const serviceDescMatch = text.match(/Descri[çc][aã]o\s*do\s*Servi[çc]o\s*\n([\s\S]*?)(?=\n\s*TRIBUTA[ÇC][AÃ]O\s*MUNICIPAL|\n\s*Valor\s*do\s*Servi[çc]o)/i);
  const serviceDescription = serviceDescMatch ? serviceDescMatch[1].trim() : "";

  // 7. Valores e Impostos
  const serviceValueMatch = text.match(/Valor\s*do\s*Servi[çc]o\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);
  const serviceValue = serviceValueMatch ? parseBrValue(serviceValueMatch[1]) : 0;

  const liquidValueMatch = text.match(/Valor\s*L[íi]quido\s*da\s*NFS-e\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);
  const liquidValue = liquidValueMatch ? parseBrValue(liquidValueMatch[1]) : serviceValue;

  const issqnValueMatch = text.match(/ISSQN\s*Apurado\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);
  const issqnValue = issqnValueMatch ? parseBrValue(issqnValueMatch[1]) : 0;

  const issqnRateMatch = text.match(/Al[íi]quota\s*Aplicada\s*\n\s*(R\$\s*[\d.,]+|[\d.,%]+)/i);
  let issqnRate = 0;
  if (issqnRateMatch) {
    const rateStr = issqnRateMatch[1].replace("%", "").trim();
    issqnRate = parseBrValue(rateStr);
  }

  // ISSQN Retido
  const issqnRetainedMatch = text.match(/Reten[çc][aã]o\s*do\s*ISSQN\s*\n\s*([^\n]+)/i);
  const issqnRetained = issqnRetainedMatch ? issqnRetainedMatch[1].includes("Retido") && !issqnRetainedMatch[1].includes("Não Retido") : false;

  // Retenções Federais
  const irrfMatch = text.match(/IRRF\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);
  const prevMatch = text.match(/Contribui[çc][aã]o\s*Previdenci[áa]ria\s*-\s*Retida\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);
  const socMatch = text.match(/Contribui[çc][oõ]es\s*Sociais\s*-\s*Retidas\s*\n\s*(R\$\s*[\d.,]+|[\d.,]+)/i);

  const irrf = irrfMatch ? parseBrValue(irrfMatch[1]) : 0;
  const prev = prevMatch ? parseBrValue(prevMatch[1]) : 0;
  const soc = socMatch ? parseBrValue(socMatch[1]) : 0;
  const federalRetentions = irrf + prev + soc;

  return {
    accessKey,
    number,
    issueDate,
    competenceDate,
    emitenteCnpj,
    emitenteName,
    emitenteCity,
    emitenteState,
    tomadorCnpj,
    tomadorName,
    tomadorCity,
    tomadorState,
    serviceCode,
    serviceDescription,
    serviceValue,
    liquidValue,
    issqnValue,
    issqnRate,
    issqnRetained,
    federalRetentions
  };
}

