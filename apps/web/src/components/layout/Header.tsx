import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useCartCount } from '../../stores/cart-store';
import { useAuthModal } from '../../stores/auth-modal-store';
import { useLogout, useSession } from '../../hooks/useSession';
import AuthModal from '../auth/AuthModal';
import BrandLogos from '../common/BrandLogos';
import CategoryMenu from './CategoryMenu';
import SearchBar from './SearchBar';
import ProductCarousel from './ProductCarousel';
import '../../styles/legacy/components/layout/Header.css';

// Páginas que exibem o menu de categorias e o carrossel abaixo do cabeçalho
const PAGES_WITH_SECONDARY_NAV = ['/', '/products'];

// Conteúdo do botão de conta (ícone de usuário + "LOGIN" + seta)
const accountButtonContent = (
  <>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
    <span>LOGIN</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useCartCount();
  const { user, isAdmin } = useSession();
  const logout = useLogout();
  const openAuthModal = useAuthModal((state) => state.open);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.user-dropdown')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const searchProducts = (term: string) => {
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const goTo = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    logout.mutate();
    goTo('/');
  };

  const shouldShowSecondaryNav = PAGES_WITH_SECONDARY_NAV.includes(location.pathname);

  return (
    <>
      {/* Header Superior - Fundo Preto */}
      <header className="header-top">
        <div className="header-top-content">
          {/* Logo à esquerda */}
          <div
            className="logo-container"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="logos-wrapper">
              <BrandLogos fallbackClassName="logo-text" />
            </div>
          </div>

          {/* Barra de busca no centro */}
          <div className="header-center">
            <SearchBar onSearch={searchProducts} />
          </div>

          {/* Links à direita */}
          <div className="header-right">
            <a href="#blog" className="header-link">
              BLOG
            </a>
            <button className="header-icon-btn help-btn" title="Ajuda">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 17H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {user ? (
              <div className="user-dropdown">
                <button
                  className="header-link user-link"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {accountButtonContent}
                </button>
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <button className="dropdown-item" onClick={() => goTo('/orders')}>
                      Meus Pedidos
                    </button>
                    {isAdmin && (
                      <button className="dropdown-item" onClick={() => goTo('/admin')}>
                        Painel Admin
                      </button>
                    )}
                    <button className="dropdown-item" onClick={handleLogoutClick}>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="header-link login-link" onClick={() => openAuthModal()}>
                {accountButtonContent}
              </button>
            )}

            <button
              className="header-icon-btn cart-btn-header"
              onClick={() => navigate('/cart')}
              title="Carrinho"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19C19.4693 16.009 19.9268 15.8526 20.2925 15.5583C20.6581 15.264 20.9086 14.8504 21 14.39L22.54 6.5H6.27"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {cartCount > 0 && <span className="cart-badge-header">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Menu de Categorias */}
      {shouldShowSecondaryNav && (
        <>
          <CategoryMenu />
          <ProductCarousel onProductClick={(product) => searchProducts(product.name)} />
        </>
      )}

      <AuthModal />
    </>
  );
};

export default Header;
