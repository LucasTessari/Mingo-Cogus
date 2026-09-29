import { describe, expect, test } from 'vitest';
import { canTransition } from './order-status';
import { escapeLike, slugify, toSearchText } from './text';
import { createOrderInput, shippingAddress } from './schemas/order';
import { productListQuery } from './schemas/catalog';
import { productInput } from './schemas/admin';

describe('texto', () => {
  test('toSearchText remove acentos e caixa', () => {
    expect(toSearchText('Cultura Líquida', null, 'B+')).toBe('cultura liquida b+');
  });
  test('escapeLike escapa curingas', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });
  test('slugify', () => {
    expect(slugify('Câmaras de Frutificação')).toBe('camaras-de-frutificacao');
    expect(slugify('Álcool 70%')).toBe('alcool-70');
  });
});

test('transições de status', () => {
  expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
  expect(canTransition('CONFIRMED', 'SHIPPED')).toBe(true);
  expect(canTransition('SHIPPED', 'CANCELLED')).toBe(false);
  expect(canTransition('DELIVERED', 'PENDING')).toBe(false);
});

describe('schemas', () => {
  const validOrder = {
    items: [{ productId: '5b0f7a3e-2f7c-4c43-9b2a-0f7c8a1d2e3f', quantity: 2 }],
    customer: { name: 'Ana', email: 'ANA@X.COM ', phone: '11999999999' },
    shippingAddress: {
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
    paymentMethod: 'PIX',
    expectedTotalCents: 15980,
  };

  test('pedido válido normaliza email e CEP', () => {
    const parsed = createOrderInput.parse(validOrder);
    expect(parsed.customer.email).toBe('ana@x.com');
    expect(parsed.shippingAddress.zipCode).toBe('01310100');
  });

  test('pedido rejeita campos de preço enviados pelo cliente', () => {
    expect(createOrderInput.safeParse({ ...validOrder, totalCents: 1 }).success).toBe(false);
  });

  test('CEP inválido', () => {
    expect(
      shippingAddress.safeParse({ ...validOrder.shippingAddress, zipCode: '123' }).success,
    ).toBe(false);
  });

  test('query da listagem cai nos padrões quando inválida', () => {
    const parsed = productListQuery.parse({
      page: 'abc',
      limit: '1000',
      sortBy: 'hack',
      inStock: 'true',
      tags: 'NEW,BOGUS',
    });
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.sortBy).toBe('createdAt');
    expect(parsed.order).toBe('desc');
    expect(parsed.inStock).toBe(true);
    expect(parsed.tags).toBeUndefined();
  });

  test('query aceita listas separadas por vírgula e parâmetros repetidos', () => {
    expect(productListQuery.parse({ tags: 'NEW,EASY_GROW' }).tags).toEqual(['NEW', 'EASY_GROW']);
    expect(productListQuery.parse({ tags: ['NEW', 'HIGH_POTENCY'] }).tags).toEqual([
      'NEW',
      'HIGH_POTENCY',
    ]);
    expect(productListQuery.parse({ minPrice: '1000', search: '  teacher ' })).toMatchObject({
      minPrice: 1000,
      search: 'teacher',
    });
  });

  test('preço promocional precisa ser menor que o preço', () => {
    const base = {
      name: 'X',
      description: 'd',
      categoryId: '5b0f7a3e-2f7c-4c43-9b2a-0f7c8a1d2e3f',
      priceCents: 1000,
      stock: 1,
    };
    expect(productInput.safeParse({ ...base, salePriceCents: 900 }).success).toBe(true);
    expect(productInput.safeParse({ ...base, salePriceCents: 1000 }).success).toBe(false);
  });
});

test('slug vazio é gerado a partir do nome (não é erro)', () => {
  const base = {
    name: 'X',
    description: 'd',
    categoryId: '5b0f7a3e-2f7c-4c43-9b2a-0f7c8a1d2e3f',
    priceCents: 1000,
    stock: 1,
  };
  expect(productInput.parse({ ...base, slug: '' }).slug).toBeUndefined();
  expect(productInput.safeParse({ ...base, slug: 'Com Espaço' }).success).toBe(false);
  expect(productInput.parse({ ...base, slug: 'meu-produto' }).slug).toBe('meu-produto');
});
