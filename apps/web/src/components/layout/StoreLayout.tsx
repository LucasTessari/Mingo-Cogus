import React, { Suspense } from 'react';
import { Outlet } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import LoadingSpinner from '../common/LoadingSpinner';
import GlobalToast from '../common/GlobalToast';
// Depois do CSS dos componentes do layout, como no site original
import '../../styles/legacy/App.css';

// Estrutura da loja: cabeçalho, conteúdo da rota e rodapé
const StoreLayout: React.FC = () => (
  <div className="App">
    <Header />
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
    <GlobalToast />
  </div>
);

export default StoreLayout;
