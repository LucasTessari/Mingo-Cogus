import React from 'react';
import { Link, useNavigate } from 'react-router';
import { formatPrice, sumCents, type CartLineIssue } from '@mingo/shared';
import { useCartStore } from '../stores/cart-store';
import { useAuthModal } from '../stores/auth-modal-store';
import { useCartQuote } from '../hooks/useCartQuote';
import { useSession } from '../hooks/useSession';
import '../styles/legacy/components/cart/Cart.css';

const ISSUE_MESSAGES: Record<CartLineIssue, string> = {
  UNAVAILABLE: 'Produto indisponível no momento',
  INSUFFICIENT_STOCK: 'Quantidade maior que o estoque disponível',
};

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, setQuantity, remove, clear } = useCartStore();
  const { user } = useSession();
  const openAuthModal = useAuthModal((state) => state.open);
  const quote = useCartQuote();

  if (items.length === 0) {
    return (
      <div className="cart">
        <h2>🛒 Seu Carrinho</h2>
        <div className="empty-cart">
          <p>Seu carrinho está vazio</p>
          <span>Adicione alguns produtos incríveis! 😊</span>
          <Link to="/products" className="back-to-products-btn">
            Ver Produtos
          </Link>
        </div>
      </div>
    );
  }

  // Valores do servidor; enquanto a cotação carrega, os dados guardados no carrinho
  const lines = items.map((item) => {
    const quoted = quote.data?.lines.find((line) => line.productId === item.productId);
    const unitPriceCents = quoted?.unitPriceCents ?? item.snapshot.unitPriceCents;
    return {
      ...item,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
      stock: quoted?.stock ?? item.snapshot.stock,
      issues: quoted?.issues ?? [],
    };
  });
  const itemCount = sumCents(items.map((item) => item.quantity));
  const totalCents = quote.data?.totalCents ?? sumCents(lines.map((line) => line.lineTotalCents));
  const canCheckout = !quote.data?.hasIssues;

  const handleCheckout = () => {
    if (user) navigate('/checkout');
    else openAuthModal({ redirectTo: '/checkout' });
  };

  return (
    <div className="cart">
      <div className="cart-header">
        <h2>🛒 Seu Carrinho</h2>
        <button className="clear-cart-btn" onClick={clear}>
          🗑️ Limpar Carrinho
        </button>
      </div>

      <div className="cart-items">
        {lines.map((line) => (
          <div key={line.productId} className="cart-item">
            <img src={line.snapshot.imageUrl ?? undefined} alt={line.snapshot.name} />

            <div className="cart-item-info">
              <h4>{line.snapshot.name}</h4>
              <p className="cart-item-category">{line.snapshot.categoryName}</p>
              <p className="cart-item-price">{formatPrice(line.unitPriceCents)}</p>
              {line.issues.map((issue) => (
                <p key={issue} className="cart-item-category" style={{ color: '#dc2626' }}>
                  {ISSUE_MESSAGES[issue]}
                </p>
              ))}
            </div>

            <div className="cart-item-controls">
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(line.productId, line.quantity - 1)}
                  disabled={line.quantity <= 1}
                >
                  -
                </button>
                <span>{line.quantity}</span>
                <button
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  disabled={line.quantity >= line.stock}
                >
                  +
                </button>
              </div>

              <button className="remove-btn" onClick={() => remove(line.productId)}>
                🗑️ Remover
              </button>
            </div>

            <div className="cart-item-total">{formatPrice(line.lineTotalCents)}</div>
          </div>
        ))}
      </div>

      <div className="cart-features">
        <div className="feature-info">
          <span>🔄 Seu carrinho é salvo automaticamente</span>
          <small>Os itens ficam disponíveis mesmo depois de fechar o navegador</small>
        </div>
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Total de itens:</span>
          <span>{itemCount}</span>
        </div>
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
        <div className="summary-row">
          <span>Frete:</span>
          <span>Grátis</span>
        </div>
        <div className="summary-row total">
          <span>Valor Total:</span>
          <span>{formatPrice(totalCents)}</span>
        </div>

        <button className="checkout-btn" onClick={handleCheckout} disabled={!canCheckout}>
          🚀 Finalizar Compra
        </button>
      </div>
    </div>
  );
};

export default CartPage;
