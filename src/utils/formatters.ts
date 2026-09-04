export interface SaleReceiptData {
  value: string; // Ex: 120,50
  product: string; // Ex: Relógio Smartwatch X9
  nsu: string; // Ex: 98124578
  timestamp: string; // ISO string
  formattedDate: string; // Ex: 04/09/2026 09:45
  clientPhotoBase64: string | null;
  signatureBase64: string | null;
  id: string;
}

export function formatCurrencyBRL(rawValue: string): string {
  // Mantém apenas dígitos
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";
  
  const numberVal = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberVal);
}

export function parseCurrencyToNumber(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
