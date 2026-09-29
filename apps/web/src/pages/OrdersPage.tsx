import React, { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatPrice } from '@mingo/shared';
import { api } from '../lib/api';
import { qk } from '../lib/query-keys';
import { useSession } from '../hooks/useSession';
import '../styles/legacy/components/orders/OrderHistory.css';

const PAGE_SIZE = 10;

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// "Meus Pedidos" (design do histórico de pedidos do site original)
const OrdersPage: React.FC = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const orders = useQuery({
    queryKey: qk.orders.mine(currentPage),
    queryFn: () => api.myOrders(currentPage, PAGE_SIZE),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
  });

  if (!sessionLoading && !user) {
    return (
      <div className="order-history">
        <div className="auth-required">
          <h2>Meus Pedidos</h2>
          <p>Faça login para ver seu histórico de pedidos</p>
        </div>
      </div>
    );
  }

  if (sessionLoading || orders.isLoading) {
    return (
      <div className="order-history">
        <div className="loading">Carregando pedidos...</div>
      </div>
    );
  }

  if (orders.isError) {
    return (
      <div className="order-history">
        <div className="error">{orders.error.message}</div>
      </div>
    );
  }

  const page = orders.data;
  const list = page?.items ?? [];
  const totalPages = page?.totalPages ?? 1;

  return (
    <div className="order-history">
      <h2>Meus Pedidos</h2>

      {list.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>Nenhum pedido encontrado</h3>
          <p>Você ainda não fez nenhum pedido. Que tal explorar nossos produtos?</p>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {list.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Pedido {order.orderNumber}</h3>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.productId} className="order-item">
                      <img src={item.imageUrl ?? undefined} alt={item.productName} />
                      <div className="item-details">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">Qtd: {item.quantity}</span>
                      </div>
                      <span className="item-price">{formatPrice(item.lineTotalCents)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-meta">
                    <div className="order-total">
                      <strong>Total: {formatPrice(order.totalCents)}</strong>
                    </div>
                    <div className="order-payment">
                      <span>Pagamento: {PAYMENT_METHOD_LABELS[order.payment.method]}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="order-tracking">
                        <span>Código de rastreio: {order.trackingNumber}</span>
                      </div>
                    )}
                    {order.estimatedDeliveryAt && (
                      <div className="order-delivery">
                        <span>Previsão de entrega: {formatDate(order.estimatedDeliveryAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Anterior
              </button>

              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
