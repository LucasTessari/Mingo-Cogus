import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@mingo/shared';
import { api } from '../../../lib/api';
import { qk } from '../../../lib/query-keys';
import AdminPagination from '../AdminPagination';

const STATUS_TABS = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
];

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = { status, search: search || undefined, page };

  const products = useQuery({
    queryKey: qk.admin.products(query),
    queryFn: () => api.admin.products(query),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: qk.products.all });
    queryClient.invalidateQueries({ queryKey: qk.admin.summary });
  };

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.admin.setProductActive(id, isActive),
    onSuccess: refresh,
  });
  const archive = useMutation({ mutationFn: api.admin.archiveProduct, onSuccess: refresh });
  const restore = useMutation({ mutationFn: api.admin.restoreProduct, onSuccess: refresh });

  const changeFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>Produtos</h1>
        <button className="admin-btn" onClick={() => navigate('/admin/products/new')}>
          + Novo produto
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Buscar por nome, strain..."
          value={search}
          onChange={(e) => changeFilter(() => setSearch(e.target.value))}
        />
        <div className="admin-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={status === tab.value ? 'active' : ''}
              onClick={() => changeFilter(() => setStatus(tab.value))}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card admin-table-wrapper">
        {products.isLoading ? (
          <div className="loading">Carregando produtos...</div>
        ) : products.data?.items.length === 0 ? (
          <div className="admin-empty">Nenhum produto encontrado.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.data?.items.map((product) => (
                <tr key={product.id}>
                  <td>{product.images[0] && <img src={product.images[0].url} alt="" />}</td>
                  <td>
                    <Link to={`/admin/products/${product.id}`}>
                      <strong>{product.name}</strong>
                    </Link>
                    <div className="admin-muted">
                      {[product.featured && 'Destaque', product.awardWinning && 'Premiado']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </td>
                  <td>{product.category.name}</td>
                  <td>
                    {product.salePriceCents != null && (
                      <span className="admin-old-price">{formatPrice(product.priceCents)}</span>
                    )}
                    {formatPrice(product.salePriceCents ?? product.priceCents)}
                  </td>
                  <td>
                    <span
                      className={`admin-pill ${product.stock === 0 ? 'off' : product.stock <= 5 ? 'warn' : 'ok'}`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    {product.archivedAt ? (
                      <span className="admin-pill off">Arquivado</span>
                    ) : (
                      <label className="admin-checks">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={(e) =>
                            toggleActive.mutate({ id: product.id, isActive: e.target.checked })
                          }
                        />
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </label>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Link
                        className="admin-btn secondary small"
                        to={`/admin/products/${product.id}`}
                      >
                        Editar
                      </Link>
                      {product.archivedAt ? (
                        <button
                          className="admin-btn secondary small"
                          onClick={() => restore.mutate(product.id)}
                        >
                          Restaurar
                        </button>
                      ) : (
                        <button
                          className="admin-btn secondary small"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Arquivar "${product.name}"? Ele sai da loja, mas continua nos pedidos antigos.`,
                              )
                            ) {
                              archive.mutate(product.id);
                            }
                          }}
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {products.data && (
          <AdminPagination
            page={products.data.page}
            totalPages={products.data.totalPages}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
};

export default ProductsPage;
