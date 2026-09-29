const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

// Data no fuso de São Paulo no formato YYYYMMDD (usada no número do pedido)
export const yyyymmddSaoPaulo = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts.replace(/-/g, '');
};

export const toIso = (date: Date | null | undefined): string | null => date?.toISOString() ?? null;
