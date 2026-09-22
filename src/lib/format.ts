export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "0 CP";

  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const suffix = " CP";

  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(2)}T${suffix}`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2)}B${suffix}`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M${suffix}`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K${suffix}`;
  }
  if (abs >= 1_000) {
    return `${sign}${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
  }
  if (abs >= 100) {
    return `${sign}${abs.toFixed(0)}${suffix}`;
  }
  return `${sign}${abs.toFixed(2)}${suffix}`;
}

export function formatRate(amount: number): string {
  return `${formatMoney(amount)}/sec`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
