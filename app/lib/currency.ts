const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
  UGX: "USh",
  TZS: "TSh",
  XOF: "CFA",
  XAF: "FCFA",
};

export function getCurrencySymbol(code: string): string {
  if (SYMBOLS[code]) return SYMBOLS[code];
  return (
    new Intl.NumberFormat("en", { style: "currency", currency: code, minimumFractionDigits: 0 })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? code
  );
}
