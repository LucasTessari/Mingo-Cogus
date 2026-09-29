import React, { useEffect, useEffectEvent, useState } from 'react';
import {
  CULTIVATION_METHOD_LABELS,
  POTENCY_LABELS,
  TAG_META,
  toTitleCase,
  type ProductFacets,
  type ProductListParams,
  type ProductListQuery,
  type ProductSortField,
  type ProductTag,
  type SortOrder,
} from '@mingo/shared';
import '../../styles/legacy/components/products/ProductFilters.css';

interface ProductFiltersProps {
  filters: ProductListQuery;
  onFiltersChange: (
    filters: ProductListParams,
    options?: { keepPage?: boolean; replace?: boolean },
  ) => void;
  facets?: ProductFacets;
}

type BooleanFilter = 'inStock' | 'featured' | 'onSale' | 'awardWinning';

const DEFAULT_MAX_PRICE = 1000;
const SEARCH_DEBOUNCE_MS = 300;

// Filtros que, quando preenchidos, habilitam o botão "Limpar Filtros"
const CLEARABLE_FILTERS: Array<keyof ProductListQuery> = [
  'search',
  'category',
  'minPrice',
  'maxPrice',
  'inStock',
  'featured',
  'onSale',
  'awardWinning',
  'species',
  'strain',
  'potency',
  'cultivationMethod',
];

// Preço digitado em reais -> centavos
const toCents = (value: string) => (value ? Math.round(Number(value) * 100) : undefined);

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, checked, onChange }) => (
  <label className="checkbox-label">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="checkmark"></span>
    {label}
  </label>
);

interface FilterSelectProps {
  id: string;
  label: string;
  allLabel: string;
  options?: readonly string[];
  value?: string;
  onChange: (value: string) => void;
  getLabel?: (option: string) => string;
}

// Select de um filtro opcional; não é exibido se não houver opções
const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  label,
  allLabel,
  options,
  value,
  onChange,
  getLabel = (option) => option,
}) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="filter-subgroup">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
};

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onFiltersChange, facets }) => {
  // Busca digitada: atualiza a URL depois de uma pausa na digitação.
  // Quando a busca muda por fora (link do cabeçalho, "Limpar Filtros"), o campo acompanha.
  const [search, setSearch] = useState(filters.search ?? '');
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearch(filters.search ?? '');
  }

  const commitSearch = useEffectEvent((value: string) => {
    if (value !== (filters.search ?? '')) {
      onFiltersChange({ ...filters, search: value || undefined }, { replace: true });
    }
  });
  useEffect(() => {
    const timer = setTimeout(() => commitSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const updateFilters = (changes: ProductListParams) => onFiltersChange({ ...filters, ...changes });

  const toggleFilter = (key: BooleanFilter) => (checked: boolean) =>
    updateFilters({ [key]: checked || undefined });

  const handleTagChange = (tag: ProductTag, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked ? [...currentTags, tag] : currentTags.filter((t) => t !== tag);
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  // A ordenação mantém a página atual
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, order] = e.target.value.split('-') as [ProductSortField, SortOrder];
    onFiltersChange({ ...filters, sortBy, order }, { keepPage: true });
  };

  const clearFilters = () => {
    setSearch('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    CLEARABLE_FILTERS.some((key) => Boolean(filters[key])) || Boolean(filters.tags?.length);
  const maxPrice = facets?.priceRange.maxCents
    ? facets.priceRange.maxCents / 100
    : DEFAULT_MAX_PRICE;

  return (
    <div className="product-filters">
      <div className="filters-header">
        <h3>Filtros</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="filter-group">
        <label htmlFor="search">Buscar</label>
        <input
          id="search"
          type="text"
          placeholder="Digite o nome, descrição ou c"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Categoria */}
      <div className="filter-group">
        <label htmlFor="category">Categoria</label>
        <select
          id="category"
          value={filters.category || 'all'}
          onChange={(e) =>
            updateFilters({ category: e.target.value === 'all' ? undefined : e.target.value })
          }
        >
          <option value="all">Todas as categorias</option>
          {facets?.categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Preço */}
      <div className="filter-group">
        <label>Preço</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Mín"
            value={filters.minPrice ? filters.minPrice / 100 : ''}
            onChange={(e) => updateFilters({ minPrice: toCents(e.target.value) })}
            min="0"
            max={maxPrice}
          />
          <span>até</span>
          <input
            type="number"
            placeholder="Máx"
            value={filters.maxPrice ? filters.maxPrice / 100 : ''}
            onChange={(e) => updateFilters({ maxPrice: toCents(e.target.value) })}
            min="0"
            max={maxPrice}
          />
        </div>
      </div>

      {/* Em estoque */}
      <div className="filter-group">
        <FilterCheckbox
          label="Apenas em estoque"
          checked={filters.inStock || false}
          onChange={toggleFilter('inStock')}
        />
      </div>

      {/* Filtros de Destaque */}
      <div className="filter-group">
        <label className="filter-section-title">Destaques</label>
        <div className="checkbox-group">
          <FilterCheckbox
            label="Em Destaque"
            checked={filters.featured || false}
            onChange={toggleFilter('featured')}
          />
          <FilterCheckbox
            label="Em Promoção"
            checked={filters.onSale || false}
            onChange={toggleFilter('onSale')}
          />
          <FilterCheckbox
            label="Premiados"
            checked={filters.awardWinning || false}
            onChange={toggleFilter('awardWinning')}
          />
        </div>
      </div>

      {/* Tags */}
      {facets && facets.tags.length > 0 && (
        <div className="filter-group">
          <label className="filter-section-title">Tags</label>
          <div className="checkbox-group">
            {facets.tags.map((tag) => (
              <FilterCheckbox
                key={tag}
                label={toTitleCase(TAG_META[tag].label)}
                checked={filters.tags?.includes(tag) || false}
                onChange={(checked) => handleTagChange(tag, checked)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtros de Cogumelos */}
      <div className="filter-group">
        <label className="filter-section-title">Informações do Cogumelo</label>

        <FilterSelect
          id="species"
          label="Espécie"
          allLabel="Todas as espécies"
          options={facets?.species}
          value={filters.species}
          onChange={(value) => updateFilters({ species: value || undefined })}
        />
        <FilterSelect
          id="strain"
          label="Strain"
          allLabel="Todas as strains"
          options={facets?.strains}
          value={filters.strain}
          onChange={(value) => updateFilters({ strain: value || undefined })}
        />
        <FilterSelect
          id="potency"
          label="Potência"
          allLabel="Todas as potências"
          options={facets?.potencies}
          value={filters.potency}
          onChange={(value) =>
            updateFilters({ potency: (value || undefined) as ProductListParams['potency'] })
          }
          getLabel={(potency) => POTENCY_LABELS[potency as keyof typeof POTENCY_LABELS] ?? potency}
        />
        <FilterSelect
          id="cultivationMethod"
          label="Método de Cultivo"
          allLabel="Todos os métodos"
          options={facets?.cultivationMethods}
          value={filters.cultivationMethod}
          onChange={(value) =>
            updateFilters({
              cultivationMethod: (value || undefined) as ProductListParams['cultivationMethod'],
            })
          }
          getLabel={(method) =>
            CULTIVATION_METHOD_LABELS[method as keyof typeof CULTIVATION_METHOD_LABELS] ?? method
          }
        />
      </div>

      {/* Ordenação */}
      <div className="filter-group">
        <label htmlFor="sort">Ordenar por</label>
        <select id="sort" value={`${filters.sortBy}-${filters.order}`} onChange={handleSortChange}>
          <option value="createdAt-desc">Mais recentes</option>
          <option value="createdAt-asc">Mais antigos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name-asc">Nome A-Z</option>
          <option value="name-desc">Nome Z-A</option>
          <option value="rating-desc">Melhor avaliados</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilters;
