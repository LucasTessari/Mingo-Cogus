import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
  type OrderStatus,
} from '@mingo/shared';
import { api } from '../../../lib/api';
import { qk } from '../../../lib/query-keys';
import { statusPillClass } from './order-status-style';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminOrderDetailPage: React.FC = () => {
  const { orderNumber = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const order = useQuery({
    queryKey: qk.admin.order(orderNumber),
    queryFn: () => api.admin.order(orderNumber),
  });

  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');

  const changeStatus = useMutation({
    mutationFn: () =>
      api.admin.changeOrderStatus(orderNumber, {
        status: nextStatus as OrderStatus,
        trackingNumber: trackingNumber || null,
        note: note || null,
      }),
    onSuccess: () => {
      setNextStatus('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: qk.admin.all });
      queryClient.invalidateQueries({ queryKey: qk.orders.all });
      queryClient.invalidateQueries({ queryKey: qk.products.all });
    },
  });

  if (order.isLoading) return <div className="loading">Carregando pedido...</div>;
  if (order.isError || !order.data)
    return <div className="admin-alert">{order.error?.message ?? 'Pedido não encontrado'}</div>;

  const data = order.data;
  const allowed = ORDER_TRANSITIONS[data.status];
  const address = data.shippingAddress;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      nextStatus === 'CANCELLED' &&
      !window.confirm('Cancelar o pedido? O estoque dos itens será devolvido.')
    )
      return;
    changeStatus.mutate();
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>
          Pedido {data.orderNumber}{' '}
          <span className={`admin-pill ${statusPillClass(data.status)}`}>
            {ORDER_STATUS_LABELS[data.status]}
          </span>
        </h1>
        <button className="admin-btn secondary" onClick={() => navigate('/admin/orders')}>
          Voltar
        </button>
      </div>

      {changeStatus.error && <div className="admin-alert">{changeStatus.error.message}</div>}

      <div className="admin-detail-grid">
        <div className="admin-card">
          <h2>Cliente</h2>
          <dl>
            <dt>Nome</dt>
            <dd>{data.customer.name}</dd>
            <dt>Email</dt>
            <dd>{data.customer.email}</dd>
            <dt>Telefone</dt>
            <dd>{data.customer.phone}</dd>
            <dt>Conta</dt>
            <dd>{data.user.email}</dd>
          </dl>
        </div>
        <div className="admin-card">
          <h2>Entrega</h2>
          <dl>
            <dt>Endereço</dt>
            <dd>
              {address.street}, {address.number}
              {address.complement ? ` - ${address.complement}` : ''}
            </dd>
            <dt>Bairro</dt>
            <dd>{address.neighborhood}</dd>
            <dt>Cidade</dt>
            <dd>
              {address.city} / {address.state}
            </dd>
            <dt>CEP</dt>
            <dd>{address.zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</dd>
            <dt>Rastreio</dt>
            <dd>{data.trackingNumber ?? '—'}</dd>
            <dt>Previsão</dt>
            <dd>{data.estimatedDeliveryAt ? formatDateTime(data.estimatedDeliveryAt) : '—'}</dd>
          </dl>
        </div>
        <div className="admin-card">
          <h2>Pagamento</h2>
          <dl>
            <dt>Método</dt>
            <dd>{PAYMENT_METHOD_LABELS[data.payment.method]}</dd>
            <dt>Situação</dt>
            <dd>{PAYMENT_STATUS_LABELS[data.payment.status]}</dd>
            <dt>Total</dt>
            <dd>
              <strong>{formatPrice(data.totalCents)}</strong>
            </dd>
            <dt>Criado em</dt>
            <dd>{formatDateTime(data.createdAt)}</dd>
          </dl>
        </div>
      </div>

      <div className="admin-card admin-table-wrapper">
        <h2>Itens</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Produto</th>
              <th>Preço</th>
              <th>Qtd</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.imageUrl && <img src={item.imageUrl} alt="" />}</td>
                <td>{item.productName}</td>
                <td>{formatPrice(item.unitPriceCents)}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-card">
          <h2>Alterar status</h2>
          {allowed.length === 0 ? (
            <p className="admin-muted">
              Este pedido está finalizado ({ORDER_STATUS_LABELS[data.status]}).
            </p>
          ) : (
            <form className="admin-form" onSubmit={submit}>
              <div className="admin-field">
                <label htmlFor="next-status">Novo status</label>
                <select
                  id="next-status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                >
                  <option value="">Selecione...</option>
                  {allowed.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              {nextStatus === 'SHIPPED' && (
                <div className="admin-field">
                  <label htmlFor="tracking">Código de rastreio *</label>
                  <input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="admin-field">
                <label htmlFor="note">Observação (opcional)</label>
                <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn"
                  disabled={!nextStatus || changeStatus.isPending}
                >
                  {changeStatus.isPending ? 'Salvando...' : 'Salvar status'}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="admin-card">
          <h2>Histórico</h2>
          <ul className="admin-timeline">
            {data.events.map((event, index) => (
              <li key={index}>
                <strong>{ORDER_STATUS_LABELS[event.toStatus]}</strong> ·{' '}
                {formatDateTime(event.createdAt)}
                <div className="admin-muted">
                  {[event.note, event.actorName && `por ${event.actorName}`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default AdminOrderDetailPage;
