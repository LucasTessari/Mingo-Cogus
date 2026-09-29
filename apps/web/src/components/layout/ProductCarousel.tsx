import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isOnSale, type ProductSummary } from '@mingo/shared';
import { api } from '../../lib/api';
import { qk } from '../../lib/query-keys';
import '../../styles/legacy/components/layout/ProductCarousel.css';

const CAROUSEL_SIZE = 20;
const PRODUCTS_PER_PAGE = 4; // Move 4 produtos por vez
const AUTOPLAY_INTERVAL_MS = 8000; // Muda a cada 8 segundos

// Produtos em destaque; se não houver (ou a busca falhar), produtos normais
const loadCarouselProducts = async (): Promise<ProductSummary[]> => {
  try {
    const featured = await api.products({ featured: true, limit: CAROUSEL_SIZE });
    if (featured.items.length) return featured.items;
  } catch {
    // tenta a lista geral abaixo
  }
  return (await api.products({ limit: CAROUSEL_SIZE })).items;
};

// Índice da próxima "página" do carrossel, voltando ao início após a última
const nextPageIndex = (index: number, total: number) =>
  index + PRODUCTS_PER_PAGE >= total ? 0 : index + PRODUCTS_PER_PAGE;

const previousPageIndex = (index: number, total: number) =>
  index - PRODUCTS_PER_PAGE < 0
    ? Math.max(0, total - PRODUCTS_PER_PAGE)
    : index - PRODUCTS_PER_PAGE;

// Elementos decorativos comuns
const decorations = (
  <>
    <div className="carousel-stars"></div>
    <div className="carousel-plant-left"></div>
    <div className="carousel-plant-right"></div>
    <div className="spores-container">
      {[...Array(15)].map((_, i) => (
        <div
          key={`spore-${i}`}
          className={`spore spore-${i % 3}`}
          style={{
            left: `${(i * 7) % 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        ></div>
      ))}
    </div>
    <div className="mushrooms-container">
      {[...Array(8)].map((_, i) => (
        <div key={`mushroom-${i}`} className={`floating-mushroom mushroom-${i % 4}`}>
          <div className="mushroom-cap"></div>
          <div className="mushroom-stem"></div>
        </div>
      ))}
    </div>
  </>
);

interface ProductCarouselProps {
  onProductClick?: (product: ProductSummary) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ onProductClick }) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: [...qk.products.all, 'carousel'],
    queryFn: loadCarouselProducts,
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  const showNext = () => setCurrentIndex((index) => nextPageIndex(index, products.length));
  const showPrevious = () => setCurrentIndex((index) => previousPageIndex(index, products.length));

  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((index) => nextPageIndex(index, products.length));
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [products.length]);

  // Mostrar carrossel mesmo durante carregamento ou sem produtos (com placeholder)
  if (isLoading || products.length === 0) {
    return (
      <div className="product-carousel-container">
        {decorations}
        <div className="product-carousel-wrapper">
          <div className="carousel-loading">
            <div className="carousel-loading-text">
              {isLoading ? 'Carregando produtos...' : 'Nenhum produto disponível'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Duplicar produtos para criar loop infinito
  const duplicatedProducts = [...products, ...products, ...products];

  return (
    <div className="product-carousel-container">
      {decorations}
      <div className="product-carousel-wrapper">
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={showPrevious}
          aria-label="Produtos anteriores"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="product-carousel-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / PRODUCTS_PER_PAGE)}%)`,
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {duplicatedProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="carousel-product-item"
              onClick={() => onProductClick?.(product)}
            >
              <div className="carousel-product-image">
                <img src={product.imageUrl ?? undefined} alt={product.name} loading="lazy" />
                {isOnSale(product) && (
                  <div className="carousel-sale-badge">
                    <span>PROMO</span>
                  </div>
                )}
              </div>
              <div className="carousel-product-name">{product.name}</div>
            </div>
          ))}
        </div>

        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={showNext}
          aria-label="Próximos produtos"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductCarousel;
