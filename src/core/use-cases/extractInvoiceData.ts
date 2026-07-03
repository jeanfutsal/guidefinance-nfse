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
  
  const parts = dateStr.trim().split(" ");
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
  const numberMatch = text.match(/Número da NFS-e\n(\d+)/);
  const number = numberMatch ? numberMatch[1] : "0";

  // 3. Competência da NFS-e
  const competenceMatch = text.match(/Competência da NFS-e\n([\d/]+)/);
  const competenceDate = competenceMatch ? competenceMatch[1] : "";

  // 4. Data e Hora da emissão
  const issueDateMatch = text.match(/Data e Hora da emissão da NFS-e\n([\d/ :]+)/);
  const issueDate = issueDateMatch ? parseBrDate(issueDateMatch[1]) : new Date().toISOString();

  // 5. Blocos Emitente e Tomador
  const emitenteBlock = text.split("TOMADOR DO SERVIÇO")[0] || "";
  const tomadorBlock = text.split("TOMADOR DO SERVIÇO")[1]?.split("INTERMEDIÁRIO DO SERVIÇO")[0] || "";

  // Emitente CNPJ
  const emitenteCnpjMatch = emitenteBlock.match(/CNPJ \/ CPF \/ NIF\n([\d./-]+)/);
  const emitenteCnpj = emitenteCnpjMatch ? emitenteCnpjMatch[1] : "";

  // Emitente Nome
  const emitenteNameMatch = emitenteBlock.match(/Nome \/ Nome Empresarial\n([^\n]+)/);
  const emitenteName = emitenteNameMatch ? emitenteNameMatch[1] : "";

  // Emitente Cidade/UF
  const emitenteCityMatch = emitenteBlock.match(/Município\n([^\n]+)/);
  let emitenteCity = "";
  let emitenteState = "";
  if (emitenteCityMatch) {
    const parts = emitenteCityMatch[1].split("-");
    emitenteCity = parts[0]?.trim() || "";
    emitenteState = parts[1]?.trim() || "";
  }

  // Tomador CNPJ
  const tomadorCnpjMatch = tomadorBlock.match(/CNPJ \/ CPF \/ NIF\n([\d./-]+)/);
  const tomadorCnpj = tomadorCnpjMatch ? tomadorCnpjMatch[1] : "";

  // Tomador Nome
  const tomadorNameMatch = tomadorBlock.match(/Nome \/ Nome Empresarial\n([^\n]+)/);
  const tomadorName = tomadorNameMatch ? tomadorNameMatch[1] : "";

  // Tomador Cidade/UF
  const tomadorCityMatch = tomadorBlock.match(/Município\n([^\n]+)/);
  let tomadorCity = "";
  let tomadorState = "";
  if (tomadorCityMatch) {
    const parts = tomadorCityMatch[1].split("-");
    tomadorCity = parts[0]?.trim() || "";
    tomadorState = parts[1]?.trim() || "";
  }

  // 6. Serviço
  const serviceCodeMatch = text.match(/Código de Tributação Nacional\n([^\n]+)/);
  const serviceCode = serviceCodeMatch ? serviceCodeMatch[1].trim() : "";

  // Descrição do Serviço (Pode ter múltiplas linhas, capturamos até a seção TRIBUTAÇÃO MUNICIPAL ou VALOR TOTAL)
  const serviceDescMatch = text.match(/Descrição do Serviço\n([\s\S]*?)(?=\nTRIBUTAÇÃO MUNICIPAL|\nValor do Serviço)/);
  const serviceDescription = serviceDescMatch ? serviceDescMatch[1].trim() : "";

  // 7. Valores e Impostos
  const serviceValueMatch = text.match(/Valor do Serviço\n(R\$\s*[\d.,]+|[\d.,]+)/);
  const serviceValue = serviceValueMatch ? parseBrValue(serviceValueMatch[1]) : 0;

  const liquidValueMatch = text.match(/Valor Líquido da NFS-e\n(R\$\s*[\d.,]+|[\d.,]+)/);
  const liquidValue = liquidValueMatch ? parseBrValue(liquidValueMatch[1]) : serviceValue;

  const issqnValueMatch = text.match(/ISSQN Apurado\n(R\$\s*[\d.,]+|[\d.,]+)/);
  const issqnValue = issqnValueMatch ? parseBrValue(issqnValueMatch[1]) : 0;

  const issqnRateMatch = text.match(/Alíquota Aplicada\n(R\$\s*[\d.,]+|[\d.,%]+)/);
  let issqnRate = 0;
  if (issqnRateMatch) {
    const rateStr = issqnRateMatch[1].replace("%", "").trim();
    issqnRate = parseBrValue(rateStr);
  }

  // ISSQN Retido
  const issqnRetainedMatch = text.match(/Retenção do ISSQN\n([^\n]+)/);
  const issqnRetained = issqnRetainedMatch ? issqnRetainedMatch[1].includes("Retido") && !issqnRetainedMatch[1].includes("Não Retido") : false;

  // Retenções Federais (IRRF, CSLL, PIS, COFINS retidos)
  // Podemos tentar somar retensões ou calcular a diferença líquida se houver retenção federal declarada
  const irrfMatch = text.match(/IRRF\n(R\$\s*[\d.,]+|[\d.,]+)/);
  const prevMatch = text.match(/Contribuição Previdenciária - Retida\n(R\$\s*[\d.,]+|[\d.,]+)/);
  const socMatch = text.match(/Contribuições Sociais - Retidas\n(R\$\s*[\d.,]+|[\d.,]+)/);

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
