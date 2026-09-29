import React from 'react';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@mingo/shared';
import { api } from '../../../lib/api';
import { qk } from '../../../lib/query-keys';
import AdminPagination from '../AdminPagination';
import { statusPillClass } from './order-status-style';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined;
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page')) || 1;
  const query = { status, search: search || undefined, page };

  const orders = useQuery({
    queryKey: qk.admin.orders(query),
    queryFn: () => api.admin.orders(query),
    placeholderData: keepPreviousData,
  });

  const setFilter = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>Pedidos</h1>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Número, nome ou email do cliente"
          value={search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <div className="admin-tabs">
          <button
            className={!status ? 'active' : ''}
            onClick={() => setFilter({ status: undefined })}
          >
            Todos
          </button>
          {ORDER_STATUSES.map((value) => (
            <button
              key={value}
              className={status === value ? 'active' : ''}
              onClick={() => setFilter({ status: value })}
            >
              {ORDER_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card admin-table-wrapper">
        {orders.isLoading ? (
          <div className="loading">Carregando pedidos...</div>
        ) : orders.data?.items.length === 0 ? (
          <div className="admin-empty">Nenhum pedido encontrado.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.data?.items.map((order) => (
                <tr key={order.orderNumber}>
                  <td>
                    <Link to={`/admin/orders/${order.orderNumber}`}>
                      <strong>{order.orderNumber}</strong>
                    </Link>
                  </td>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td>
                    {order.customerName}
                    <div className="admin-muted">{order.customerEmail}</div>
                  </td>
                  <td>{order.itemCount}</td>
                  <td>{formatPrice(order.totalCents)}</td>
                  <td>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                    <div className="admin-muted">
                      {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-pill ${statusPillClass(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {orders.data && (
          <AdminPagination
            page={orders.data.page}
            totalPages={orders.data.totalPages}
            onChange={(next) => setFilter({ page: String(next) })}
          />
        )}
      </div>
    </>
  );
};

export default AdminOrdersPage;
