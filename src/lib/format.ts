export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";

  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  if (abs >= 1_000) {
    return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (abs >= 100) {
    return `${sign}$${abs.toFixed(0)}`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatRate(amount: number): string {
  return `${formatMoney(amount)}/sec`;
}
