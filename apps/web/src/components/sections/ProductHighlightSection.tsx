import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ProductListParams } from '@mingo/shared';
import { api } from '../../lib/api';
import { qk } from '../../lib/query-keys';
import ProductCard from '../products/ProductCard';
import '../../styles/legacy/components/sections/Section.css';

interface ProductHighlightSectionProps {
  // Filtro da vitrine (ex.: { featured: true })
  filter: ProductListParams;
  className: string;
  title: string;
  subtitle: string;
  loadingText: string;
}

const SHOWCASE_SIZE = 12;

// Vitrine da home: grade de produtos em estoque que atendem ao filtro, oculta quando vazia
const ProductHighlightSection: React.FC<ProductHighlightSectionProps> = ({
  filter,
  className,
  title,
  subtitle,
  loadingText,
}) => {
  const params: ProductListParams = { ...filter, inStock: true, limit: SHOWCASE_SIZE };
  const { data, isLoading } = useQuery({
    queryKey: qk.products.list(params),
    queryFn: () => api.products(params),
  });
  const products = data?.items ?? [];

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className={`section ${className}`}>
      <div className="section-content">
        {isLoading ? (
          <div className="loading">{loadingText}</div>
        ) : (
          <>
            <div className="section-header">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <div className="section-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductHighlightSection;
