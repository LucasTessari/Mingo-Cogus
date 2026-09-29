import React from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@mingo/shared';
import { api } from '../../lib/api';
import { qk } from '../../lib/query-keys';

const DashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: qk.admin.summary, queryFn: api.admin.summary });

  return (
    <>
      <div className="admin-page-header">
        <h1>Visão geral</h1>
      </div>

      {isLoading || !data ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="admin-stats">
            {ORDER_STATUSES.map((status) => (
              <Link key={status} to={`/admin/orders?status=${status}`} className="admin-stat">
                <strong>{data.ordersByStatus[status] ?? 0}</strong>
                <span>Pedidos: {ORDER_STATUS_LABELS[status]}</span>
              </Link>
            ))}
          </div>

          <div className="admin-card">
            <h2>Estoque baixo (5 ou menos)</h2>
            {data.lowStock.length === 0 ? (
              <p className="admin-muted">Nenhum produto com estoque baixo.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Estoque</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span className={`admin-pill ${product.stock === 0 ? 'off' : 'warn'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="admin-btn secondary small"
                          to={`/admin/products/${product.id}`}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default DashboardPage;
