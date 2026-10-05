export function formatPrice(amount, currency = 'INR') {
  const n = Number(amount);
  const formatted = Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2);
  return `${currency} ${formatted}`;
}

export function catInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}
