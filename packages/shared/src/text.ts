// Texto normalizado para busca: minúsculas e sem acentos ("Cultura Líquida" -> "cultura liquida")
export const toSearchText = (...parts: Array<string | null | undefined>): string =>
  parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // remove acentos (marcas combinantes após o NFD)
    .replace(/\s+/g, ' ')
    .trim();

// Escapa os curingas de LIKE/ILIKE para que o texto seja buscado literalmente
export const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (char) => `\\${char}`);

// "Culturas Líquidas" -> "culturas-liquidas"
export const slugify = (text: string): string =>
  toSearchText(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
