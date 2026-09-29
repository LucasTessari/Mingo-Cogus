import React from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router';
import { useLogout, useSession } from '../../hooks/useSession';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DashboardPage from './DashboardPage';
import ProductsPage from './products/ProductsPage';
import ProductFormPage from './products/ProductFormPage';
import CategoriesPage from './categories/CategoriesPage';
import AdminOrdersPage from './orders/AdminOrdersPage';
import AdminOrderDetailPage from './orders/AdminOrderDetailPage';
import '../../styles/admin/Admin.css';

// Painel administrativo. A proteção real é feita pela API (todas as rotas /api/admin exigem admin);
// aqui quem não é admin simplesmente volta para a loja.
const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useSession();
  const logout = useLogout();

  if (isLoading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/logo.png" alt="Mingo Cogus" />
          <span>PAINEL ADMIN</span>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Visão geral
          </NavLink>
          <NavLink to="/admin/products">Produtos</NavLink>
          <NavLink to="/admin/categories">Categorias</NavLink>
          <NavLink to="/admin/orders">Pedidos</NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <span>{user?.name}</span>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            ← Voltar para a loja
          </a>
          <button onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}>
            Sair
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:orderNumber" element={<AdminOrderDetailPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminApp;
