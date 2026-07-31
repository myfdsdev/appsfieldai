// Shared store currency symbols. Keep in sync with the CURRENCIES list in
// MyMarketplaceHub (Marketplace Settings → Localization).
export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  AED: "د.إ",
  BRL: "R$",
  SGD: "S$",
};

export const currencySymbol = (code) => CURRENCY_SYMBOLS[code] || "$";