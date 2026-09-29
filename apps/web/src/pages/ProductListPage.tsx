import React from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-keys';
import { useCatalogParams } from '../hooks/useCatalogParams';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import '../styles/legacy/components/products/ProductList.css';

const ProductListPage: React.FC = () => {
  const { params, setParams } = useCatalogParams();
  const products = useQuery({
    queryKey: qk.products.list(params),
    queryFn: () => api.products(params),
    placeholderData: keepPreviousData,
  });
  const facets = useQuery({ queryKey: qk.products.facets, queryFn: api.facets, staleTime: 60_000 });

  const handlePageChange = (page: number) => {
    setParams({ ...params, page }, { keepPage: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (products.isLoading) {
    return (
      <div className="product-list">
        <div className="loading">Carregando produtos...</div>
      </div>
    );
  }

  const page = products.data;
  const items = page?.items ?? [];
  const resultsSuffix = page?.total !== 1 ? 's' : '';

  return (
    <div className="product-list">
      <div className="product-list-container">
        {/* Sidebar com filtros */}
        <aside className="filters-sidebar">
          <ProductFilters filters={params} onFiltersChange={setParams} facets={facets.data} />
        </aside>

        {/* Conteúdo principal */}
        <main className="products-main">
          <div className="products-header">
            <h2>Nossos Produtos</h2>
            {page && (
              <div className="products-count">
                {page.total} produto{resultsSuffix} encontrado{resultsSuffix}
              </div>
            )}
          </div>

          {products.isError && <div className="error">Erro ao carregar produtos</div>}

          <div className="products-grid">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {items.length === 0 && !products.isFetching && (
            <div className="no-products">
              <p>Nenhum produto encontrado com os filtros selecionados.</p>
              <p>Tente ajustar os critérios de busca.</p>
            </div>
          )}

          {/* Paginação */}
          {page && page.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(page.page - 1)}
                disabled={page.page === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>

              <div className="pagination-info">
                Página {page.page} de {page.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(page.page + 1)}
                disabled={page.page === page.totalPages}
                className="pagination-btn"
              >
                Próxima →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;
