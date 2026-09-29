// API falsa no formato do backend antigo (ICO), servindo o MESMO catálogo do seed do projeto novo.
// Usada só para capturar as screenshots de referência do site original.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { CultivationMethod, Potency, ProductTag } from '@mingo/shared';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  seedCreatedAt,
} from '../../apps/api/prisma/seed-data/catalog';

const ICO_TAGS: Record<ProductTag, string> = {
  NEW: 'novo',
  BEST_SELLER: 'mais-vendido',
  EASY_GROW: 'cultivo-facil',
  HIGH_POTENCY: 'alta-potencia',
};
const ICO_POTENCY: Record<Potency, string> = {
  LOW: 'baixa',
  MEDIUM: 'media',
  HIGH: 'alta',
  VERY_HIGH: 'muito-alta',
};
const ICO_METHOD: Record<CultivationMethod, string> = {
  SPORE_SYRINGE: 'spore-syringe',
  SPORE_PRINT: 'spore-print',
  LIQUID_CULTURE: 'liquid-culture',
  GRAIN_SPAWN: 'grain-spawn',
  GROW_KIT: 'grow-kit',
};

// Categorias: nome da categoria de cada slug e da categoria mãe
const categoryName = new Map<string, string>();
const parentName = new Map<string, string>();
for (const category of SEED_CATEGORIES) {
  categoryName.set(category.slug, category.name);
  for (const child of category.children ?? []) {
    categoryName.set(child.slug, child.name);
    parentName.set(child.slug, category.name);
  }
}

const icoCategories = SEED_CATEGORIES.map((category, index) => ({
  _id: `cat-${index}`,
  name: category.name,
  slug: category.slug,
  description: category.description,
  order: category.sortOrder,
  isActive: true,
  parentId: null,
  image: null,
  children: (category.children ?? []).map((child, childIndex) => ({
    _id: `cat-${index}-${childIndex}`,
    name: child.name,
    slug: child.slug,
    description: child.description,
    icon: category.iconKey,
    order: childIndex + 1,
    isActive: true,
    parentId: `cat-${index}`,
    image: null,
  })),
}));

export const icoProducts = SEED_PRODUCTS.map((product, index) => {
  const hasMushroomInfo = Boolean(
    product.species ||
    product.strain ||
    product.potency ||
    product.cultivationMethod ||
    product.quantityLabel,
  );
  return {
    _id: `p${String(index).padStart(3, '0')}`,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.priceCents / 100,
    ...(product.salePriceCents != null && { salePrice: product.salePriceCents / 100 }),
    onSale: product.salePriceCents != null,
    image: product.image,
    images: [product.image],
    category: categoryName.get(product.categorySlug)!,
    parentCategory: parentName.get(product.categorySlug) ?? null,
    stock: product.stock,
    inStock: product.stock > 0,
    rating: 0,
    reviewCount: 0,
    featured: product.featured ?? false,
    awardWinning: product.awardWinning ?? false,
    tags: (product.tags ?? []).map((tag) => ICO_TAGS[tag]),
    ...(hasMushroomInfo && {
      mushroomInfo: {
        ...(product.species && { species: product.species }),
        ...(product.strain && { strain: product.strain }),
        ...(product.potency && { potency: ICO_POTENCY[product.potency] }),
        ...(product.cultivationMethod && {
          cultivationMethod: ICO_METHOD[product.cultivationMethod],
        }),
        ...(product.quantityLabel && { quantity: product.quantityLabel }),
      },
    }),
    isActive: product.isActive ?? true,
    createdAt: seedCreatedAt(index).toISOString(),
  };
});

type IcoProduct = (typeof icoProducts)[number];
const visible = icoProducts.filter((product) => product.isActive);

const unique = <T>(values: T[]) => [...new Set(values)];
const effectivePrice = (product: IcoProduct) => product.salePrice ?? product.price;

// Mesmas opções e mesma ordem que /api/products/facets do projeto novo
function filterOptions() {
  const categories: string[] = [];
  for (const category of SEED_CATEGORIES) {
    const names = [category.name, ...(category.children ?? []).map((child) => child.name)];
    for (const name of names) {
      const used = visible.some(
        (product) => product.category === name || product.parentCategory === name,
      );
      if (used && !categories.includes(name)) categories.push(name);
    }
  }
  const prices = visible.map(effectivePrice);
  return {
    categories,
    tags: Object.values(ICO_TAGS).filter((tag) =>
      visible.some((product) => product.tags.includes(tag)),
    ),
    species: unique(
      visible.map((product) => product.mushroomInfo?.species).filter(Boolean) as string[],
    ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    strains: unique(
      visible.map((product) => product.mushroomInfo?.strain).filter(Boolean) as string[],
    ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    potencies: Object.values(ICO_POTENCY).filter((p) =>
      visible.some((product) => product.mushroomInfo?.potency === p),
    ),
    cultivationMethods: Object.values(ICO_METHOD).filter((m) =>
      visible.some((product) => product.mushroomInfo?.cultivationMethod === m),
    ),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
  };
}

function listProducts(params: URLSearchParams) {
  let list = visible;
  const category = params.get('category');
  if (category && category !== 'all') {
    list = list.filter(
      (product) => product.category === category || product.parentCategory === category,
    );
  }
  const search = params.get('search')?.toLowerCase();
  if (search) {
    list = list.filter((product) =>
      [
        product.name,
        product.description,
        product.category,
        product.mushroomInfo?.species,
        product.mushroomInfo?.strain,
      ].some((field) => field?.toLowerCase().includes(search)),
    );
  }
  for (const flag of ['featured', 'onSale', 'awardWinning'] as const) {
    if (params.get(flag) === 'true') list = list.filter((product) => product[flag]);
  }
  if (params.get('inStock') === 'true') list = list.filter((product) => product.stock > 0);

  const sortBy = params.get('sortBy') ?? 'createdAt';
  const direction = params.get('order') === 'asc' ? 1 : -1;
  const key = (product: IcoProduct): number | string =>
    sortBy === 'price'
      ? effectivePrice(product)
      : sortBy === 'name'
        ? product.name
        : sortBy === 'rating'
          ? product.rating
          : product.createdAt;
  list = [...list].sort((a, b) => (key(a) > key(b) ? direction : key(a) < key(b) ? -direction : 0));

  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 12;
  return {
    success: true,
    data: list.slice((page - 1) * limit, page * limit),
    pagination: {
      current: page,
      totalPages: Math.ceil(list.length / limit),
      totalResults: list.length,
      resultsPerPage: limit,
    },
    filters: filterOptions(),
  };
}

const highlight = (flag: 'featured' | 'onSale' | 'awardWinning', limit: number) => ({
  success: true,
  data: visible.filter((product) => product[flag] && product.stock > 0).slice(0, limit),
});

export const VISUAL_USER = {
  _id: 'u1',
  name: 'Cliente Visual',
  email: 'visual@mingocogus.test',
  avatar: '',
  role: 'user',
};

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function handle(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 204, null);

  const url = new URL(req.url ?? '/', 'http://localhost');
  const limit = Number(url.searchParams.get('limit')) || 12;
  switch (url.pathname) {
    case '/api/categories':
      return send(res, 200, { success: true, data: icoCategories });
    case '/api/products':
      return send(res, 200, listProducts(url.searchParams));
    case '/api/products/featured':
      return send(res, 200, highlight('featured', limit));
    case '/api/products/on-sale':
      return send(res, 200, highlight('onSale', limit));
    case '/api/products/award-winning':
      return send(res, 200, highlight('awardWinning', limit));
    case '/api/auth/login':
      return send(res, 200, { success: true, data: { ...VISUAL_USER, token: 'visual-token' } });
    default:
      return send(res, 404, { error: 'Rota não encontrada' });
  }
}

export function startMockIcoApi(port: number): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer(handle);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
