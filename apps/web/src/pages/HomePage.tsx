import React from 'react';
import ProductHighlightSection from '../components/sections/ProductHighlightSection';
import AboutSection from '../components/sections/AboutSection';
import ApparelSection from '../components/sections/ApparelSection';
import CatalogHighlightSection from '../components/sections/CatalogHighlightSection';
import '../styles/legacy/pages/Home/HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <CatalogHighlightSection />
      <ApparelSection />
      <AboutSection />
      <ProductHighlightSection
        filter={{ featured: true }}
        className="section-featured"
        title="⭐ Produtos em Destaque"
        subtitle="Seleção especial dos nossos melhores cogumelos"
        loadingText="Carregando produtos em destaque..."
      />
      <ProductHighlightSection
        filter={{ onSale: true }}
        className="section-promo"
        title="🔥 Promoções Especiais"
        subtitle="Ofertas imperdíveis com descontos exclusivos"
        loadingText="Carregando promoções..."
      />
      <ProductHighlightSection
        filter={{ awardWinning: true, sortBy: 'rating', order: 'desc' }}
        className="section-award"
        title="🏆 Produtos Premiados"
        subtitle="Genéticas reconhecidas pela qualidade excepcional"
        loadingText="Carregando produtos premiados..."
      />
    </div>
  );
};

export default HomePage;
