import React from 'react';
import { useNavigate } from 'react-router';
import '../../styles/legacy/components/sections/CatalogHighlightSection.css';

// Dados mockados para o exemplo
const highlightProducts = [
  {
    id: 'hl-1',
    name: 'Golden Teacher',
    price: 65.0,
    image: '/products/golden-teacher.png',
    category: 'Psilocybe Cubensis',
    tags: ['Esporos', 'Seringa', 'Iniciante'],
    packSize: '10ml',
    cycle: 'Rápido',
  },
  {
    id: 'hl-2',
    name: "Lion's Mane",
    price: 85.0,
    image: '/products/lions-mane.png',
    category: 'Medicinal',
    tags: ['Cultura Líquida', 'Medicinal', 'Foco'],
    packSize: '10ml',
    cycle: 'Médio',
  },
  {
    id: 'hl-3',
    name: 'Reishi Kit',
    price: 150.0,
    image: '/products/reishi.png',
    category: 'Kits de Cultivo',
    tags: ['Kit Completo', 'Medicinal', 'Imunidade'],
    packSize: '1kg',
    cycle: 'Lento',
  },
];

const CatalogHighlightSection: React.FC = () => {
  const navigate = useNavigate();

  // Vitrine ilustrativa: os itens não são produtos do catálogo, então levam à busca na loja
  const handleAddToCart = (product: (typeof highlightProducts)[number]) => {
    navigate(`/products?search=${encodeURIComponent(product.name)}`);
  };

  return (
    <section className="catalog-section">
      <div className="catalog-container">
        {/* Sidebar */}
        <aside className="catalog-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V6.5C21 7.12951 20.5978 7.69307 20.0093 7.91476L14 10.1785V18L10 21V10.1785L3.99071 7.91476C3.40219 7.69307 3 7.12951 3 6.5V4.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="sidebar-title">ENCONTRE SEU COGUMELO</h3>
            <p className="sidebar-subtitle">Ainda tem dúvidas?</p>
          </div>

          <div className="filter-group">
            <label className="filter-label">Busca</label>
            <input type="text" className="search-input" placeholder="Buscar..." />
          </div>

          <div className="filter-group">
            <label className="filter-label">Preço</label>
            <div className="price-inputs">
              <input type="number" className="price-input" defaultValue="50" />
              <input type="number" className="price-input" defaultValue="500" />
            </div>
            <div className="range-slider">
              <div className="range-thumb left"></div>
              <div className="range-thumb right"></div>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Tipo de Produto</label>
            <div className="filter-options">
              <div className="filter-option">
                <span>Esporos</span>
                <span className="filter-count">12</span>
              </div>
              <div className="filter-option">
                <span>Cultura Líquida</span>
                <span className="filter-count">8</span>
              </div>
              <div className="filter-option">
                <span>Kits de Cultivo</span>
                <span className="filter-count">5</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Grid de Produtos */}
        <div className="catalog-content">
          <div className="catalog-grid">
            {highlightProducts.map((product) => (
              <div key={product.id} className="catalog-card">
                <div className="card-image-container">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'https://via.placeholder.com/300x300/f5f5f5/333333?text=' +
                        encodeURIComponent(product.name);
                    }}
                  />
                </div>

                <h3 className="card-title">{product.name}</h3>
                <span className="card-price-label">a partir de:</span>
                <div className="card-price">R$ {product.price.toFixed(2).replace('.', ',')}</div>

                <div className="card-attributes">
                  <div className="attribute">
                    <div className="attribute-icon">📦</div>
                    <span>{product.packSize}</span>
                  </div>
                  <div className="attribute">
                    <div className="attribute-icon">⏱️</div>
                    <span>{product.cycle}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-add-cart" onClick={() => handleAddToCart(product)}>
                    Adicionar ao Carrinho
                  </button>
                  <button
                    className="btn-details"
                    onClick={() => navigate(`/products?search=${encodeURIComponent(product.name)}`)}
                  >
                    Ver Detalhes
                  </button>
                </div>

                <div className="card-tags">{product.tags.join(', ')}</div>
              </div>
            ))}
          </div>

          <div className="catalog-footer">
            <button className="btn-catalog-action" onClick={() => navigate('/products')}>
              Confira o catálogo completo
            </button>
            <button
              className="btn-catalog-action"
              onClick={() => navigate('/products?category=kits-cultivo')}
            >
              Confira os kits de cultivo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CatalogHighlightSection;
