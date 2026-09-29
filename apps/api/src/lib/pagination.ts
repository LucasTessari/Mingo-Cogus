import type { Paginated } from '@mingo/shared';

export const pageArgs = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const toPage = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> => ({
  items,
  page,
  pageSize: limit,
  total,
  totalPages: Math.ceil(total / limit),
});
