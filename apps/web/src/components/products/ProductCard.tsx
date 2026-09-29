import React from 'react';
import {
  CULTIVATION_METHOD_LABELS,
  POTENCY_LABELS,
  TAG_META,
  effectivePriceCents,
  formatPrice,
  isOnSale,
  type ProductSummary,
} from '@mingo/shared';
import { useCartLine, useCartStore } from '../../stores/cart-store';
import Badge from '../common/Badge';
import Rating from '../common/Rating';
import DiscountBadge from '../common/DiscountBadge';
import '../../styles/legacy/components/products/ProductCard.css';

interface ProductCardProps {
  product: ProductSummary;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addItem = useCartStore((state) => state.add);
  const cartItem = useCartLine(product.id);

  const onSale = isOnSale(product);
  const isInStock = product.stock > 0;
  const rating = product.ratingAvg ?? 0;
  // Os blocos de informações do cogumelo aparecem quando o produto tem qualquer um desses dados
  const hasMushroomInfo = Boolean(
    product.species ||
    product.strain ||
    product.potency ||
    product.cultivationMethod ||
    product.quantityLabel,
  );

  const buttonLabel = !isInStock
    ? 'Indisponível'
    : cartItem
      ? `Adicionar Mais (${cartItem.quantity})`
      : 'Adicionar ao Carrinho';

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.imageUrl ?? undefined} alt={product.name} loading="lazy" />

        {/* Badges */}
        <div className="product-badges">
          {product.awardWinning && <Badge label="Premiado" type="premiado" />}
          {onSale && (
            <DiscountBadge
              priceCents={product.priceCents}
              salePriceCents={product.salePriceCents!}
            />
          )}
          {product.featured && <Badge label="Destaque" type="destaque" />}
          {product.tags.map((tag, index) => (
            <Badge key={index} label={TAG_META[tag].label} type={TAG_META[tag].badge} />
          ))}
        </div>

        {cartItem && <div className="cart-indicator">{cartItem.quantity} no carrinho</div>}
      </div>

      <div className="product-info">
        {/* Informações de cogumelo */}
        {hasMushroomInfo && (
          <div className="mushroom-info">
            {product.strain && <span className="mushroom-strain">{product.strain}</span>}
            {product.species && <span className="mushroom-species">{product.species}</span>}
          </div>
        )}

        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <span className="product-category">{product.category.name}</span>
          {rating > 0 && <Rating rating={rating} reviewCount={product.reviewCount} size="small" />}
        </div>

        {/* Informações específicas de cogumelos */}
        {hasMushroomInfo && (
          <div className="mushroom-details">
            {product.potency && (
              <span className="potency-badge">Potência: {POTENCY_LABELS[product.potency]}</span>
            )}
            {product.cultivationMethod && (
              <span className="cultivation-method">
                {CULTIVATION_METHOD_LABELS[product.cultivationMethod]}
              </span>
            )}
            {product.quantityLabel && (
              <span className="quantity-info">{product.quantityLabel}</span>
            )}
          </div>
        )}

        <div className="product-details">
          <div className="price-container">
            {onSale && <span className="old-price">{formatPrice(product.priceCents)}</span>}
            <span className="product-price">{formatPrice(effectivePriceCents(product))}</span>
          </div>
          <div className="product-stock">
            {isInStock ? (
              <span className="in-stock">✓ {product.stock} em estoque</span>
            ) : (
              <span className="out-of-stock">Sem estoque</span>
            )}
          </div>
        </div>

        <button
          className={`add-to-cart-btn ${cartItem ? 'in-cart' : ''}`}
          onClick={() => addItem(product)}
          disabled={!isInStock}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
