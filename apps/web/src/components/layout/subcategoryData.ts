export interface SubcategoryItem {
  name: string;
  slug: string;
  icon: string; // chave em CATEGORY_ICONS
  description: string;
  iconSrc?: string; // ícone personalizado (URL ou arquivo em assets/icons)
}

// Subcategorias pré-definidas para cada categoria principal
// iconSrc é opcional - se fornecido, será usado em vez do ícone SVG padrão
export const SUBCATEGORY_DATA: Record<string, SubcategoryItem[]> = {
  esporos: [
    {
      name: 'Seringas de Esporos',
      slug: 'seringas-esporos',
      icon: 'esporos',
      description: 'Seringas com esporos prontos para inoculação',
    }, // Adicione iconSrc: 'meu-icone.svg' para usar ícone personalizado
    {
      name: 'Impressões de Esporos',
      slug: 'impressoes-esporos',
      icon: 'esporos',
      description: 'Impressões de esporos em papel alumínio',
    },
    {
      name: 'Esporos Golden Teacher',
      slug: 'esporos-golden-teacher',
      icon: 'esporos',
      description: 'Strain Golden Teacher em seringa',
    },
    {
      name: 'Esporos B+',
      slug: 'esporos-b-plus',
      icon: 'esporos',
      description: 'Strain B+ em seringa',
    },
    {
      name: 'Esporos Penis Envy',
      slug: 'esporos-penis-envy',
      icon: 'esporos',
      description: 'Strain Penis Envy em seringa',
    },
    {
      name: 'Esporos Mazatapec',
      slug: 'esporos-mazatapec',
      icon: 'esporos',
      description: 'Strain Mazatapec em seringa',
    },
    {
      name: 'Esporos Cambodian',
      slug: 'esporos-cambodian',
      icon: 'esporos',
      description: 'Strain Cambodian em seringa',
    },
    {
      name: 'Esporos Amazonian',
      slug: 'esporos-amazonian',
      icon: 'esporos',
      description: 'Strain Amazonian em seringa',
    },
    {
      name: 'Esporos Thai',
      slug: 'esporos-thai',
      icon: 'esporos',
      description: 'Strain Thai em seringa',
    },
    {
      name: 'Mix de Esporos',
      slug: 'mix-esporos',
      icon: 'esporos',
      description: 'Combinações especiais de strains',
    },
  ],
  'kits-cultivo': [
    {
      name: 'Kits Iniciantes',
      slug: 'kits-iniciantes',
      icon: 'kits-cultivo',
      description: 'Kits completos para iniciantes',
    },
    {
      name: 'Kits Avançados',
      slug: 'kits-avancados',
      icon: 'kits-cultivo',
      description: 'Kits para cultivadores experientes',
    },
    {
      name: 'Kits All-in-One',
      slug: 'kits-all-in-one',
      icon: 'kits-cultivo',
      description: 'Kits tudo-em-um prontos para usar',
    },
    {
      name: 'Substratos',
      slug: 'substratos',
      icon: 'kits-cultivo',
      description: 'Substratos preparados para cultivo',
    },
    {
      name: 'Câmaras de Fruição',
      slug: 'camaras-fruicao',
      icon: 'kits-cultivo',
      description: 'Câmaras para frutificação',
    },
    {
      name: 'Equipamentos',
      slug: 'equipamentos',
      icon: 'kits-cultivo',
      description: 'Equipamentos de cultivo',
    },
  ],
  'cogumelos-desidratados': [
    {
      name: 'Golden Teacher',
      slug: 'desidratados-golden-teacher',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos Golden Teacher desidratados',
    },
    {
      name: 'B+',
      slug: 'desidratados-b-plus',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos B+ desidratados',
    },
    {
      name: 'Penis Envy',
      slug: 'desidratados-penis-envy',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos Penis Envy desidratados',
    },
    {
      name: 'Mazatapec',
      slug: 'desidratados-mazatapec',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos Mazatapec desidratados',
    },
    {
      name: 'Cambodian',
      slug: 'desidratados-cambodian',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos Cambodian desidratados',
    },
    {
      name: 'Amazonian',
      slug: 'desidratados-amazonian',
      icon: 'cogumelos-desidratados',
      description: 'Cogumelos Amazonian desidratados',
    },
  ],
  'culturas-liquidas': [
    {
      name: 'Culturas Golden Teacher',
      slug: 'culturas-golden-teacher',
      icon: 'culturas-liquidas',
      description: 'Cultura líquida Golden Teacher',
    },
    {
      name: 'Culturas B+',
      slug: 'culturas-b-plus',
      icon: 'culturas-liquidas',
      description: 'Cultura líquida B+',
    },
    {
      name: 'Culturas Penis Envy',
      slug: 'culturas-penis-envy',
      icon: 'culturas-liquidas',
      description: 'Cultura líquida Penis Envy',
    },
    {
      name: 'Culturas Mazatapec',
      slug: 'culturas-mazatapec',
      icon: 'culturas-liquidas',
      description: 'Cultura líquida Mazatapec',
    },
    {
      name: 'Culturas Cambodian',
      slug: 'culturas-cambodian',
      icon: 'culturas-liquidas',
      description: 'Cultura líquida Cambodian',
    },
  ],
  promocoes: [
    {
      name: 'Ofertas Especiais',
      slug: 'ofertas-especiais',
      icon: 'promocoes',
      description: 'Promoções e ofertas limitadas',
    },
    {
      name: 'Combo Especial',
      slug: 'combo-especial',
      icon: 'promocoes',
      description: 'Combos com desconto',
    },
    {
      name: 'Liquidação',
      slug: 'liquidacao',
      icon: 'promocoes',
      description: 'Produtos em liquidação',
    },
    {
      name: 'Novidades em Promoção',
      slug: 'novidades-promocao',
      icon: 'promocoes',
      description: 'Novos produtos com desconto',
    },
  ],
  acessorios: [
    {
      name: 'Seringas Vazias',
      slug: 'seringas-vazias',
      icon: 'acessorios',
      description: 'Seringas estéreis para uso',
    },
    {
      name: 'Papel Alumínio',
      slug: 'papel-aluminio',
      icon: 'acessorios',
      description: 'Papel alumínio para impressões',
    },
    {
      name: 'Luvas Estéreis',
      slug: 'luvas-estereis',
      icon: 'acessorios',
      description: 'Luvas para trabalho estéril',
    },
    {
      name: 'Álcool 70%',
      slug: 'alcool-70',
      icon: 'acessorios',
      description: 'Álcool para desinfecção',
    },
    {
      name: 'Espátulas',
      slug: 'espátulas',
      icon: 'acessorios',
      description: 'Espátulas para manipulação',
    },
    {
      name: 'Balança Digital',
      slug: 'balanca-digital',
      icon: 'acessorios',
      description: 'Balança de precisão',
    },
  ],
};
