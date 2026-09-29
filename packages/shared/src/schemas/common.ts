import { z } from 'zod';

// Helpers para parâmetros de query string (URL do site e da API). Valores inválidos
// caem no padrão em vez de gerar erro, e parâmetros repetidos usam o primeiro valor.

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const blankToUndefined = (value: unknown) => {
  const v = first(value);
  return v === '' || v === null ? undefined : v;
};

export const queryText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional()).catch(undefined);

export const queryFlag = z
  .preprocess(blankToUndefined, z.enum(['true', 'false']).optional())
  .transform((value) => (value === undefined ? undefined : value === 'true'))
  .catch(undefined);

const toNumber = (value: unknown) => {
  const v = blankToUndefined(value);
  return v === undefined ? undefined : Number(v);
};

export const queryInt = (min: number, max = Number.MAX_SAFE_INTEGER) =>
  z.preprocess(toNumber, z.number().int().min(min).max(max).optional()).catch(undefined);

export const queryIntWithDefault = (min: number, fallback: number, max = Number.MAX_SAFE_INTEGER) =>
  z.preprocess(toNumber, z.number().int().min(min).max(max).default(fallback)).catch(fallback);

type EnumValues = readonly [string, ...string[]];

export const queryEnum = <const T extends EnumValues>(values: T) =>
  z.preprocess(blankToUndefined, z.enum(values).optional()).catch(undefined);

export const queryEnumWithDefault = <const T extends EnumValues>(values: T, fallback: T[number]) =>
  z
    .preprocess(blankToUndefined, z.enum(values).default(fallback as never))
    .catch(fallback as never);

export const queryEnumList = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .preprocess(
      (value) => {
        const joined = Array.isArray(value) ? value.join(',') : value;
        return typeof joined === 'string' && joined ? joined.split(',') : undefined;
      },
      z.array(z.enum(values)).optional(),
    )
    .catch(undefined);

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  });

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const errorBody = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});

export const idParam = z.object({ id: z.uuid() });
