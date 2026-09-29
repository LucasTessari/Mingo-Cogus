import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { App } from '../src/app';
import { buildTestApp } from './helpers/app';
import { createCategory, createProduct } from './helpers/factories';

let app: App;
beforeEach(async () => {
  app = await buildTestApp();
});
afterEach(async () => {
  await app.close();
});

const listNames = async (query: string) => {
  const response = await app.inject({ method: 'GET', url: `/api/products?${query}` });
  expect(response.statusCode).toBe(200);
  return (response.json().items as Array<{ name: string }>).map((product) => product.name);
};

describe('listagem de produtos', () => {
  test('categoria inclui as subcategorias; inativos, arquivados e categorias inativas ficam de fora', async () => {
    const esporos = await createCategory({ slug: 'esporos', name: 'Esporos' });
    const seringas = await createCategory({
      slug: 'seringas',
      name: 'Seringas',
      parentId: esporos.id,
    });
    const inativa = await createCategory({ slug: 'inativa', isActive: false });
    await createProduct({ name: 'Na mãe', categoryId: esporos.id });
    await createProduct({ name: 'Na filha', categoryId: seringas.id });
    await createProduct({ name: 'Inativo', categoryId: seringas.id, isActive: false });
    await createProduct({ name: 'Arquivado', categoryId: seringas.id, archivedAt: new Date() });
    await createProduct({ name: 'Em categoria inativa', categoryId: inativa.id });
    await createProduct({ name: 'Outra categoria' });

    expect((await listNames('category=esporos')).sort()).toEqual(['Na filha', 'Na mãe']);
    expect(await listNames('category=seringas')).toEqual(['Na filha']);
    expect(await listNames('category=nao-existe')).toEqual([]);
    expect((await listNames('')).sort()).toEqual(['Na filha', 'Na mãe', 'Outra categoria']);
  });

  test('busca é literal, sem acentos e sem diferenciar maiúsculas', async () => {
    await createProduct({ name: 'Cultura Líquida B+' });
    await createProduct({ name: 'Álcool 70%' });
    await createProduct({ name: 'Kit_Avançado' });
    await createProduct({ name: 'Outro produto' });

    expect(await listNames('search=liquida')).toEqual(['Cultura Líquida B+']);
    expect(await listNames('search=B%2B')).toEqual(['Cultura Líquida B+']);
    expect(await listNames('search=%25')).toEqual(['Álcool 70%']);
    expect(await listNames('search=_')).toEqual(['Kit_Avançado']);
    expect(await listNames('search=(.*')).toEqual([]);
  });

  test('promoção é derivada do preço promocional e preço/ordenação usam o preço efetivo', async () => {
    await createProduct({ name: 'Caro em promoção', priceCents: 10000, salePriceCents: 1500 });
    await createProduct({ name: 'Médio', priceCents: 3000 });
    await createProduct({ name: 'Barato', priceCents: 2000 });

    expect(await listNames('onSale=true')).toEqual(['Caro em promoção']);
    expect(await listNames('sortBy=price&order=asc')).toEqual([
      'Caro em promoção',
      'Barato',
      'Médio',
    ]);
    expect(await listNames('maxPrice=2000&sortBy=price&order=asc')).toEqual([
      'Caro em promoção',
      'Barato',
    ]);
    expect(await listNames('minPrice=2500')).toEqual(['Médio']);
  });

  test('filtros de estoque, destaque, tags e dados do cogumelo', async () => {
    await createProduct({ name: 'Sem estoque', stock: 0 });
    await createProduct({
      name: 'Destaque',
      featured: true,
      tags: ['NEW'],
      strain: 'B+',
      potency: 'HIGH',
    });
    await createProduct({ name: 'Premiado', awardWinning: true, cultivationMethod: 'GROW_KIT' });

    expect(await listNames('inStock=true')).not.toContain('Sem estoque');
    expect(await listNames('featured=true')).toEqual(['Destaque']);
    expect(await listNames('awardWinning=true')).toEqual(['Premiado']);
    expect(await listNames('tags=NEW,EASY_GROW')).toEqual(['Destaque']);
    expect(await listNames('strain=B%2B&potency=HIGH')).toEqual(['Destaque']);
    expect(await listNames('cultivationMethod=GROW_KIT')).toEqual(['Premiado']);
  });

  test('paginação estável e parâmetros inválidos caem nos padrões', async () => {
    const category = await createCategory();
    for (let i = 0; i < 5; i++) {
      await createProduct({
        name: `P${i}`,
        categoryId: category.id,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
    }
    const page1 = await app.inject({ method: 'GET', url: '/api/products?limit=2&page=1' });
    const page2 = await app.inject({ method: 'GET', url: '/api/products?limit=2&page=2' });
    const ids = [...page1.json().items, ...page2.json().items].map(
      (product: { id: string }) => product.id,
    );
    expect(new Set(ids).size).toBe(4);
    expect(page1.json()).toMatchObject({ total: 5, totalPages: 3, pageSize: 2, page: 1 });

    const invalid = await app.inject({
      method: 'GET',
      url: '/api/products?limit=abc&page=-1&sortBy=hack',
    });
    expect(invalid.statusCode).toBe(200);
    expect(invalid.json()).toMatchObject({ page: 1, pageSize: 12 });
  });

  test('resposta tem o formato do resumo do produto', async () => {
    await createProduct({
      name: 'Golden',
      priceCents: 8990,
      salePriceCents: 7990,
      strain: 'Golden Teacher',
    });
    const [product] = (await app.inject({ method: 'GET', url: '/api/products' })).json().items;
    expect(product).toMatchObject({
      name: 'Golden',
      priceCents: 8990,
      salePriceCents: 7990,
      effectivePriceCents: 7990,
      imageUrl: '/placeholders/cogumelo.svg',
      strain: 'Golden Teacher',
    });
    expect(product.category).toHaveProperty('slug');
    expect(product).not.toHaveProperty('searchText');
  });
});

describe('categorias e facets', () => {
  test('árvore de categorias ativas ordenada', async () => {
    const b = await createCategory({ name: 'B', slug: 'b', sortOrder: 2 });
    const a = await createCategory({ name: 'A', slug: 'a', sortOrder: 1 });
    await createCategory({ name: 'A2', slug: 'a2', sortOrder: 2, parentId: a.id });
    await createCategory({ name: 'A1', slug: 'a1', sortOrder: 1, parentId: a.id });
    await createCategory({ name: 'Oculta', slug: 'oculta', isActive: false, parentId: b.id });

    const tree = (await app.inject({ method: 'GET', url: '/api/categories' })).json();
    expect(tree.map((c: { slug: string }) => c.slug)).toEqual(['a', 'b']);
    expect(tree[0].children.map((c: { slug: string }) => c.slug)).toEqual(['a1', 'a2']);
    expect(tree[1].children).toEqual([]);
  });

  test('facets listam as opções presentes no catálogo', async () => {
    const mae = await createCategory({ name: 'Esporos', slug: 'esporos', sortOrder: 1 });
    const filha = await createCategory({ name: 'Seringas', slug: 'seringas', parentId: mae.id });
    await createProduct({
      categoryId: filha.id,
      priceCents: 5000,
      tags: ['HIGH_POTENCY', 'NEW'],
      species: 'Cubensis',
      strain: 'B+',
      potency: 'HIGH',
    });
    await createProduct({
      categoryId: filha.id,
      priceCents: 9000,
      salePriceCents: 3000,
      strain: 'Amazonian',
    });

    const facets = (await app.inject({ method: 'GET', url: '/api/products/facets' })).json();
    expect(facets.categories).toEqual([
      { slug: 'esporos', name: 'Esporos' },
      { slug: 'seringas', name: 'Seringas' },
    ]);
    expect(facets.tags).toEqual(['NEW', 'HIGH_POTENCY']);
    expect(facets.strains).toEqual(['Amazonian', 'B+']);
    expect(facets.potencies).toEqual(['HIGH']);
    expect(facets.priceRange).toEqual({ minCents: 3000, maxCents: 5000 });
  });
});
