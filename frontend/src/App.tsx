import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import OrdersPage from './pages/OrdersPage'
import CustomersPage from './pages/CustomersPage'
import SkillsAssistantPage from './pages/SkillsAssistantPage'
import CustomerStorePage from './pages/CustomerStorePage'
import CustomerOrdersPage from './pages/CustomerOrdersPage'
import CustomerCartPage from './pages/CustomerCartPage'
import ChatPage from './pages/ChatPage'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Main App Layout */}
          <Route element={<Layout />}>
            {/* Public Visitor Routes (No Login Required) */}
            <Route path="/" element={<CustomerStorePage />} />
            <Route path="/store" element={<CustomerStorePage />} />
            <Route path="/carritocliente" element={<CustomerCartPage />} />
            <Route path="/chat" element={<ChatPage />} />

            {/* Authenticated Customer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/my-orders" element={<CustomerOrdersPage />} />
            </Route>

            {/* Staff / Barista & Admin Routes */}
            <Route element={<ProtectedRoute requiredRole="ROLE_BARISTA" />}>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/skills" element={<SkillsAssistantPage />} />
            </Route>

            {/* Admin-only Routes */}
            <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
  )
}

export default App
