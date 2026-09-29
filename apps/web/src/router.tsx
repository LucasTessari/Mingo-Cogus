import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import StoreLayout from './components/layout/StoreLayout';

// Páginas carregadas sob demanda (o painel admin fica em um pacote separado)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AdminApp = lazy(() => import('./features/admin/AdminApp'));

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products', element: <ProductListPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: '/admin/*',
    element: (
      <React.Suspense fallback={null}>
        <AdminApp />
      </React.Suspense>
    ),
  },
]);
