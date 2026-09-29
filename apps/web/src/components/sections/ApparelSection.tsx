import React from 'react';
import { useNavigate } from 'react-router';
import '../../styles/legacy/components/sections/ApparelSection.css';

// Dados mockados baseados na imagem fornecida
const apparelItems = [
  {
    id: 'app-1',
    name: 'Guardião da Semente',
    price: 129.0,
    image: '/apparel/guardiao.png', // Placeholder path
    category: 'Camisetas',
  },
  {
    id: 'app-2',
    name: 'Auto Cultivo é o Caminho',
    price: 129.0,
    image: '/apparel/autocultivo.png', // Placeholder path
    category: 'Camisetas',
  },
  {
    id: 'app-3',
    name: 'Chamado das Ondas',
    price: 129.0,
    image: '/apparel/ondas.png', // Placeholder path
    category: 'Camisetas',
  },
  {
    id: 'app-4',
    name: 'Prainha Surf Vintage',
    price: 129.0,
    image: '/apparel/surf.png', // Placeholder path
    category: 'Camisetas',
  },
];

const ApparelSection: React.FC = () => {
  const navigate = useNavigate();

  // Como temos poucos itens por enquanto, a navegação pode ser simplificada ou desabilitada
  // Mas implementando a estrutura para quando houver mais itens
  const handlePrev = () => {
    // Lógica de scroll futura
    console.log('Prev clicked');
  };

  const handleNext = () => {
    // Lógica de scroll futura
    console.log('Next clicked');
  };

  const handleProductClick = (productName: string) => {
    navigate(`/products?search=${encodeURIComponent(productName)}`);
  };

  return (
    <section className="apparel-section">
      <div className="apparel-header">
        <h2 className="apparel-title">VISTA SUA ESSÊNCIA</h2>
        <p className="apparel-subtitle">
          Estampas que são verdadeiras obras de arte, celebrando a natureza, a cultura e a liberdade
          do seu estilo.
        </p>
      </div>

      <div className="apparel-carousel-container">
        <button className="nav-button prev" onClick={handlePrev} aria-label="Anterior">
          &#10094;
        </button>

        <div className="carousel-track-container">
          <div className="apparel-grid">
            {apparelItems.map((item) => (
              <div key={item.id} className="apparel-card">
                <div className="apparel-image-container">
                  {/* Usando um placeholder colorido se a imagem não existir */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="apparel-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'https://via.placeholder.com/300x300/2a2a2a/FFFFFF?text=' +
                        encodeURIComponent(item.name);
                    }}
                  />
                </div>
                <h3 className="apparel-card-title">{item.name}</h3>
                <span className="apparel-card-label">a partir de:</span>
                <span className="apparel-card-price">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </span>
                <button className="apparel-btn" onClick={() => handleProductClick(item.name)}>
                  VISUALIZAR
                </button>
              </div>
            ))}
          </div>
        </div>

        <button className="nav-button next" onClick={handleNext} aria-label="Próximo">
          &#10095;
        </button>
      </div>
    </section>
  );
};

export default ApparelSection;
