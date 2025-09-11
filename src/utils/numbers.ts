export function formatYenNumber(n?: number): string {
    if (typeof n !== "number" || isNaN(n)) return "0"
    return n.toLocaleString("ja-JP")
  }