import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { qk } from '../../lib/query-keys';
import CategoryDropdown from './CategoryDropdown';
import '../../styles/legacy/components/layout/CategoryMenu.css';

const CategoryMenu: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: qk.categories,
    queryFn: api.categories,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <nav className="category-menu">
        <div className="category-menu-loading">Carregando categorias...</div>
      </nav>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <nav className="category-menu">
      <div className="category-menu-container">
        <div className="category-nav-wrapper">
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id} className="category-item">
                <a
                  href={`#categoria/${category.slug}`}
                  className="category-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/products?category=${encodeURIComponent(category.slug)}`);
                  }}
                >
                  <span className="category-name">{category.name}</span>
                  <svg
                    className="category-arrow"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                {/* Dropdown com grid de subcategorias (exibido via :hover no CSS) */}
                <CategoryDropdown category={category} />
              </li>
            ))}
          </ul>
        </div>

        {/* Ícones de Redes Sociais */}
        <div className="social-icons">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            title="Instagram"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
            </svg>
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            title="Telegram"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 3L3 10.53L8.51 12.19L15.49 7.5L10.51 13.81L21 21L17.51 14.81L21 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default CategoryMenu;
