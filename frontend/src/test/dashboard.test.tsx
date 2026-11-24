import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage'
import dashboardService from '../services/dashboardService'
import productService from '../services/productService'
import type { DashboardMetrics, Product } from '../types'

vi.mock('../services/dashboardService', () => ({
  default: {
    getMetrics: vi.fn(),
  },
}))

vi.mock('../services/productService', () => ({
  default: {
    getLowStockProducts: vi.fn(),
  },
}))

describe('DashboardPage Analytics', () => {
  const mockMetrics: DashboardMetrics = {
    totalOrders: 150,
    totalRevenue: 32500.5,
    activeOrders: 12,
    lowStockCount: 2,
    weeklyNewCustomers: 34,
    customersByTier: {
      BRONZE: 50,
      SILVER: 30,
      GOLD: 15,
      PLATINUM: 5,
    },
    salesByCategory: {
      BEBIDAS_CALIENTES: 250.0,
      REPOSTERIA: 110.0,
    },
  }

  const mockLowStock: Product[] = [
    {
      id: 1,
      sku: 'BEB-COL-MED',
      name: 'Café Cappuccino',
      category: 'HOT_BEVERAGES',
      price: 3.5,
      stockQuantity: 5,
      active: true,
    },
    {
      id: 2,
      sku: 'REP-CRO-ALM',
      name: 'Croissant de Almendras',
      category: 'BAKERY',
      price: 2.8,
      stockQuantity: 3,
      active: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getMetrics).mockResolvedValue(mockMetrics)
    vi.mocked(productService.getLowStockProducts).mockResolvedValue(mockLowStock)
  })

  it('renders all real-time analytics KPIs correctly', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })

    // Check Weekly New Customers KPI
    expect(screen.getByText('Clientes Nuevos Semanales')).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()

    // Check Revenue
    expect(screen.getByText('$32,500.50')).toBeInTheDocument()

    // Check Total Orders
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('displays critical low stock banner and table when count > 0', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Alerta de Inventario: Existen 2 productos con stock menor o igual a 10 unidades/i)
      ).toBeInTheDocument()
    })

    expect(screen.getByText('BEB-COL-MED')).toBeInTheDocument()
    expect(screen.getByText('5 uds')).toBeInTheDocument()
    expect(screen.getByText('REP-CRO-ALM')).toBeInTheDocument()
    expect(screen.getByText('3 uds')).toBeInTheDocument()
  })

  it('renders sales by category and loyalty tier breakdowns', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ventas por Categoría')).toBeInTheDocument()
      expect(screen.getByText('Fidelización de Clientes')).toBeInTheDocument()
    })

    expect(screen.getAllByText(/Bebidas Calientes/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('PLATINO')).toBeInTheDocument()
  })
})
