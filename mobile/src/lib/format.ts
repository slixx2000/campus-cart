export function formatPrice(amount: number) {
  return `ZMW ${Number(amount || 0).toLocaleString('en-ZM')}`;
}

export function relativeDate(input: string) {
  const date = new Date(input).getTime();
  const diff = Date.now() - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(input).toLocaleDateString('en-ZM');
}
