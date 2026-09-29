// Catálogo inicial (desenvolvimento, testes E2E e baseline visual).
// Baseado no seed do site original, sem a categoria de cogumelos desidratados.
// Preços em centavos. Os produtos estão do mais novo para o mais antigo (ordem padrão da loja).
import type { CultivationMethod, Potency, ProductTag } from '@mingo/shared';

export interface SeedCategory {
  slug: string;
  name: string;
  iconKey: string;
  description?: string;
  sortOrder: number;
  children?: Array<{ slug: string; name: string; description: string }>;
}

export interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  salePriceCents?: number;
  stock: number;
  featured?: boolean;
  awardWinning?: boolean;
  isActive?: boolean;
  tags?: ProductTag[];
  species?: string;
  strain?: string;
  potency?: Potency;
  cultivationMethod?: CultivationMethod;
  quantityLabel?: string;
  origin?: string;
  image: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    slug: 'esporos',
    name: 'Esporos',
    iconKey: 'esporos',
    sortOrder: 1,
    description: 'Seringas e impressões de esporos',
    children: [
      {
        slug: 'seringas-esporos',
        name: 'Seringas de Esporos',
        description: 'Seringas com esporos prontos para inoculação',
      },
      {
        slug: 'impressoes-esporos',
        name: 'Impressões de Esporos',
        description: 'Impressões de esporos em papel alumínio',
      },
    ],
  },
  {
    slug: 'kits-cultivo',
    name: 'Kits de Cultivo',
    iconKey: 'kits-cultivo',
    sortOrder: 2,
    description: 'Kits completos para cultivo de cogumelos',
    children: [
      {
        slug: 'kits-iniciantes',
        name: 'Kits Iniciantes',
        description: 'Kits completos para iniciantes',
      },
      {
        slug: 'kits-avancados',
        name: 'Kits Avançados',
        description: 'Kits para cultivadores experientes',
      },
      { slug: 'substratos', name: 'Substratos', description: 'Substratos preparados para cultivo' },
      {
        slug: 'camaras-frutificacao',
        name: 'Câmaras de Frutificação',
        description: 'Câmaras para frutificação',
      },
      { slug: 'equipamentos', name: 'Equipamentos', description: 'Equipamentos de cultivo' },
    ],
  },
  {
    slug: 'culturas-liquidas',
    name: 'Culturas Líquidas',
    iconKey: 'culturas-liquidas',
    sortOrder: 3,
    description: 'Culturas líquidas de micélio para inoculação',
  },
  {
    slug: 'acessorios',
    name: 'Acessórios',
    iconKey: 'acessorios',
    sortOrder: 4,
    description: 'Acessórios e equipamentos para cultivo',
    children: [
      {
        slug: 'seringas-vazias',
        name: 'Seringas Vazias',
        description: 'Seringas estéreis para uso',
      },
      {
        slug: 'luvas-estereis',
        name: 'Luvas Estéreis',
        description: 'Luvas para trabalho estéril',
      },
      { slug: 'alcool-70', name: 'Álcool 70%', description: 'Álcool para desinfecção' },
      { slug: 'espatulas', name: 'Espátulas', description: 'Espátulas para manipulação' },
      { slug: 'balanca-digital', name: 'Balança Digital', description: 'Balança de precisão' },
      {
        slug: 'papel-aluminio',
        name: 'Papel Alumínio',
        description: 'Papel alumínio para impressões',
      },
    ],
  },
];

const cubensis = { species: 'Psilocybe Cubensis' };

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: 'golden-teacher-seringa-de-esporos',
    name: 'Golden Teacher - Seringa de Esporos',
    description:
      'Strain clássica e confiável, ideal para iniciantes. Golden Teacher é conhecida por seu crescimento consistente e produz cogumelos grandes e dourados.',
    categorySlug: 'seringas-esporos',
    priceCents: 8990,
    salePriceCents: 7990,
    stock: 25,
    featured: true,
    tags: ['NEW', 'BEST_SELLER', 'EASY_GROW'],
    ...cubensis,
    strain: 'Golden Teacher',
    potency: 'HIGH',
    cultivationMethod: 'SPORE_SYRINGE',
    quantityLabel: '10ml',
    origin: 'Brasil',
    image: '/placeholders/seringa-esporos.svg',
  },
  {
    slug: 'b-plus-seringa-de-esporos',
    name: 'B+ - Seringa de Esporos',
    description:
      'Uma das strains mais populares e resistentes. B+ é conhecida por sua facilidade de cultivo e alta produtividade. Ideal para cultivadores de todos os níveis.',
    categorySlug: 'seringas-esporos',
    priceCents: 7990,
    stock: 30,
    featured: true,
    tags: ['BEST_SELLER', 'EASY_GROW'],
    ...cubensis,
    strain: 'B+',
    potency: 'MEDIUM',
    cultivationMethod: 'SPORE_SYRINGE',
    quantityLabel: '10ml',
    origin: 'Brasil',
    image: '/placeholders/seringa-esporos.svg',
  },
  {
    slug: 'penis-envy-seringa-de-esporos',
    name: 'Penis Envy - Seringa de Esporos',
    description:
      'Strain premium, reconhecida entre colecionadores. Requer mais cuidado no cultivo, recomendada para cultivadores experientes.',
    categorySlug: 'seringas-esporos',
    priceCents: 12990,
    stock: 15,
    featured: true,
    awardWinning: true,
    tags: ['HIGH_POTENCY'],
    ...cubensis,
    strain: 'Penis Envy',
    potency: 'VERY_HIGH',
    cultivationMethod: 'SPORE_SYRINGE',
    quantityLabel: '10ml',
    origin: 'Colombia',
    image: '/placeholders/seringa-esporos.svg',
  },
  {
    slug: 'mazatapec-seringa-de-esporos',
    name: 'Mazatapec - Seringa de Esporos',
    description:
      'Strain mexicana tradicional. Produz cogumelos médios com crescimento consistente.',
    categorySlug: 'seringas-esporos',
    priceCents: 8590,
    salePriceCents: 7590,
    stock: 20,
    ...cubensis,
    strain: 'Mazatapec',
    potency: 'MEDIUM',
    cultivationMethod: 'SPORE_SYRINGE',
    quantityLabel: '10ml',
    origin: 'México',
    image: '/placeholders/seringa-esporos.svg',
  },
  {
    slug: 'amazonian-seringa-de-esporos',
    name: 'Amazonian - Seringa de Esporos',
    description: 'Strain brasileira de origem amazônica. Produz cogumelos grandes e vigorosos.',
    categorySlug: 'seringas-esporos',
    priceCents: 9590,
    stock: 18,
    featured: true,
    tags: ['HIGH_POTENCY'],
    ...cubensis,
    strain: 'Amazonian',
    potency: 'HIGH',
    cultivationMethod: 'SPORE_SYRINGE',
    quantityLabel: '10ml',
    origin: 'Brasil',
    image: '/placeholders/seringa-esporos.svg',
  },
  {
    slug: 'impressao-de-esporos-golden-teacher',
    name: 'Impressão de Esporos Golden Teacher',
    description:
      'Impressão de esporos em papel alumínio, embalada individualmente para microscopia e coleção.',
    categorySlug: 'impressoes-esporos',
    priceCents: 6990,
    stock: 12,
    ...cubensis,
    strain: 'Golden Teacher',
    potency: 'HIGH',
    cultivationMethod: 'SPORE_PRINT',
    quantityLabel: '1 unidade',
    origin: 'Brasil',
    image: '/placeholders/impressao-esporos.svg',
  },
  {
    slug: 'golden-teacher-kit-de-cultivo',
    name: 'Golden Teacher - Kit de Cultivo',
    description:
      'Kit completo para iniciantes. Inclui tudo necessário para começar seu cultivo, com substrato e instruções detalhadas.',
    categorySlug: 'kits-iniciantes',
    priceCents: 19990,
    salePriceCents: 17990,
    stock: 12,
    featured: true,
    tags: ['NEW', 'EASY_GROW'],
    ...cubensis,
    strain: 'Golden Teacher',
    potency: 'HIGH',
    cultivationMethod: 'GROW_KIT',
    quantityLabel: '1 unidade',
    origin: 'Brasil',
    image: '/placeholders/kit-cultivo.svg',
  },
  {
    slug: 'b-plus-kit-de-cultivo',
    name: 'B+ - Kit de Cultivo',
    description:
      'Kit de cultivo completo com strain B+. Perfeito para iniciantes que desejam uma experiência de cultivo bem-sucedida desde o primeiro ciclo.',
    categorySlug: 'kits-iniciantes',
    priceCents: 18990,
    stock: 10,
    tags: ['EASY_GROW'],
    ...cubensis,
    strain: 'B+',
    potency: 'MEDIUM',
    cultivationMethod: 'GROW_KIT',
    quantityLabel: '1 unidade',
    origin: 'Brasil',
    image: '/placeholders/kit-cultivo.svg',
  },
  {
    slug: 'kit-avancado-monotub',
    name: 'Kit Avançado Monotub',
    description:
      'Monotub completo para cultivadores experientes, com filtros de ar e substrato para grandes colheitas.',
    categorySlug: 'kits-avancados',
    priceCents: 29990,
    stock: 0,
    cultivationMethod: 'GROW_KIT',
    quantityLabel: '1 unidade',
    image: '/placeholders/kit-cultivo.svg',
  },
  {
    slug: 'cultura-liquida-golden-teacher',
    name: 'Cultura Líquida Golden Teacher',
    description:
      'Cultura líquida pronta para inoculação. Mais rápida que esporos, ideal para cultivadores experientes que buscam resultados mais rápidos.',
    categorySlug: 'culturas-liquidas',
    priceCents: 11990,
    stock: 14,
    tags: ['NEW'],
    ...cubensis,
    strain: 'Golden Teacher',
    potency: 'HIGH',
    cultivationMethod: 'LIQUID_CULTURE',
    quantityLabel: '20ml',
    origin: 'Brasil',
    image: '/placeholders/cultura-liquida.svg',
  },
  {
    slug: 'cultura-liquida-b-plus',
    name: 'Cultura Líquida B+',
    description: 'Cultura líquida de B+, vigorosa e com colonização rápida.',
    categorySlug: 'culturas-liquidas',
    priceCents: 11990,
    stock: 9,
    awardWinning: true,
    ...cubensis,
    strain: 'B+',
    potency: 'MEDIUM',
    cultivationMethod: 'LIQUID_CULTURE',
    quantityLabel: '20ml',
    origin: 'Brasil',
    image: '/placeholders/cultura-liquida.svg',
  },
  {
    slug: 'seringa-esteril-10ml-pacote-5',
    name: 'Seringa Estéril 10ml (pacote com 5)',
    description: 'Seringas estéreis descartáveis com agulha, embaladas individualmente.',
    categorySlug: 'seringas-vazias',
    priceCents: 2990,
    stock: 50,
    quantityLabel: '5 unidades',
    image: '/placeholders/acessorio.svg',
  },
  {
    slug: 'luvas-nitrilicas-caixa-100',
    name: 'Luvas Nitrílicas (caixa com 100)',
    description: 'Luvas descartáveis sem pó para trabalho estéril.',
    categorySlug: 'luvas-estereis',
    priceCents: 4990,
    salePriceCents: 3990,
    stock: 40,
    quantityLabel: '100 unidades',
    image: '/placeholders/acessorio.svg',
  },
  {
    slug: 'alcool-70-1l',
    name: 'Álcool 70% 1L',
    description: 'Álcool etílico 70% para desinfecção de superfícies e ferramentas.',
    categorySlug: 'alcool-70',
    priceCents: 1990,
    stock: 60,
    quantityLabel: '1L',
    image: '/placeholders/acessorio.svg',
  },
  {
    slug: 'balanca-digital-001g',
    name: 'Balança Digital 0,01g',
    description: 'Balança de precisão compacta com tara e calibração.',
    categorySlug: 'balanca-digital',
    priceCents: 5990,
    stock: 8,
    quantityLabel: '1 unidade',
    image: '/placeholders/acessorio.svg',
  },
  {
    slug: 'substrato-esterilizado-2kg',
    name: 'Substrato Esterilizado 2kg',
    description: 'Substrato pronto para uso (fora de linha).',
    categorySlug: 'substratos',
    priceCents: 3990,
    stock: 5,
    isActive: false,
    quantityLabel: '2kg',
    image: '/placeholders/kit-cultivo.svg',
  },
];

// Datas de criação fixas: a ordem padrão da loja (mais recentes primeiro) fica determinística
export const SEED_BASE_DATE = new Date('2026-01-01T12:00:00Z');
export const seedCreatedAt = (index: number) =>
  new Date(SEED_BASE_DATE.getTime() - index * 60 * 60 * 1000);
