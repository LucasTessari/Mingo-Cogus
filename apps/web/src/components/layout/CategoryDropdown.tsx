import React from 'react';
import { useNavigate } from 'react-router';
import type { CategoryNode } from '@mingo/shared';
import CustomIcon from './CustomIcon';
import { CATEGORY_ICONS } from './categoryIcons';
import { SUBCATEGORY_DATA, type SubcategoryItem } from './subcategoryData';
import '../../styles/legacy/components/layout/CategoryDropdown.css';

// Item do dropdown; `fromDatabase` indica se é uma subcategoria real (filtrável por slug)
type DropdownItem = SubcategoryItem & { fromDatabase: boolean };

// Usar subcategorias do banco se existirem, senão usar as pré-definidas
const getSubcategories = (category: CategoryNode): DropdownItem[] => {
  if (category.children.length === 0) {
    return (SUBCATEGORY_DATA[category.slug] || []).map((item) => ({
      ...item,
      fromDatabase: false,
    }));
  }
  return category.children.map((sub) => ({
    name: sub.name,
    slug: sub.slug,
    icon: sub.iconKey || category.slug,
    description: sub.description || '',
    iconSrc: sub.imageUrl || undefined,
    fromDatabase: true,
  }));
};

// Ícone personalizado (quando houver `iconSrc`) ou o SVG padrão da categoria
const renderIcon = ({ icon, iconSrc, name }: SubcategoryItem) => {
  const defaultIcon = CATEGORY_ICONS[icon] || CATEGORY_ICONS['default'];
  return iconSrc ? (
    <CustomIcon src={iconSrc} size={56} alt={name || 'Icon'} fallback={defaultIcon} />
  ) : (
    defaultIcon
  );
};

const CategoryDropdown: React.FC<{ category: CategoryNode }> = ({ category }) => {
  const navigate = useNavigate();
  const subcategories = getSubcategories(category);

  // Se não houver subcategorias, não renderizar
  if (subcategories.length === 0) {
    return null;
  }

  // Subcategoria real filtra o catálogo; item pré-definido busca pelo nome
  const open = (item: DropdownItem) =>
    navigate(
      item.fromDatabase
        ? `/products?category=${encodeURIComponent(item.slug)}`
        : `/products?search=${encodeURIComponent(item.name)}`,
    );

  return (
    <div className="category-dropdown">
      <div className="dropdown-content">
        <div className="dropdown-grid">
          {subcategories.map((subcategory, index) => (
            <a
              key={subcategory.slug || index}
              href={`#categoria/${subcategory.slug}`}
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                open(subcategory);
              }}
            >
              <div className="dropdown-icon">{renderIcon(subcategory)}</div>
              <div className="dropdown-text">
                <span className="dropdown-name">{subcategory.name}</span>
                {subcategory.description && (
                  <span className="dropdown-description">{subcategory.description}</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDropdown;
