import { useQuery } from "@tanstack/react-query";
import { CURRENCY_SYMBOLS, currencySymbol } from "@/lib/currency";

// Fetches live USD-based exchange rates (free, no key required) and caches them
// for the session. Prices are stored in USD; the store's selected currency is
// converted at the current rate.
async function fetchRates() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Failed to load exchange rates");
  const data = await res.json();
  if (!data?.rates) throw new Error("No rates in response");
  return data.rates; // { USD: 1, EUR: 0.92, INR: 83.1, ... }
}

// Returns { convert, format, rate, loading } for a target currency code.
// convert(usdAmount) → number in target currency
// format(usdAmount)  → "₹1,23,456" style string with the currency symbol
export function useCurrencyRates(currency = "USD") {
  const { data: rates, isLoading } = useQuery({
    queryKey: ["currency-rates"],
    queryFn: fetchRates,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const code = CURRENCY_SYMBOLS[currency] ? currency : "USD";
  // Fall back to 1 (no conversion) until rates load or if the rate is missing.
  const rate = rates?.[code] || 1;
  const symbol = currencySymbol(code);
  // Currencies without minor units display whole numbers.
  const noDecimals = ["JPY", "INR"].includes(code);

  const convert = (usdAmount) => (Number(usdAmount) || 0) * rate;

  const format = (usdAmount) => {
    const value = convert(usdAmount);
    const rounded = noDecimals ? Math.round(value) : Math.round(value * 100) / 100;
    return `${symbol}${rounded.toLocaleString(undefined, {
      maximumFractionDigits: noDecimals ? 0 : 2,
    })}`;
  };

  return { convert, format, rate, symbol, loading: isLoading };
}