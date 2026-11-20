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
    salesByRoastLevel: {
      CLARO: 40,
      MEDIO_CLARO: 20,
      MEDIO: 60,
      MEDIO_OSCURO: 25,
      OSCURO: 15,
    },
  }

  const mockLowStock: Product[] = [
    {
      id: 1,
      sku: 'COF-COL-MED',
      name: 'Café Colombia Huila Supremo',
      roastLevel: 'MEDIO',
      category: 'ORIGEN_UNICO',
      price: 18.5,
      stockQuantity: 5,
      active: true,
    },
    {
      id: 2,
      sku: 'COF-ETH-YIR',
      name: 'Café Etiopía Yirgacheffe Grado 1',
      roastLevel: 'CLARO',
      category: 'ESPECIALIDAD',
      price: 24.0,
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
      expect(screen.getByText('Consola de Operaciones')).toBeInTheDocument()
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
        screen.getByText(/¡Alerta de Inventario Crítico! Existen 2 lotes/i)
      ).toBeInTheDocument()
    })

    expect(screen.getByText('COF-COL-MED')).toBeInTheDocument()
    expect(screen.getByText('5 kg')).toBeInTheDocument()
    expect(screen.getByText('COF-ETH-YIR')).toBeInTheDocument()
    expect(screen.getByText('3 kg')).toBeInTheDocument()
  })

  it('renders sales by roast level and loyalty tier breakdowns', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ventas por Nivel de Tueste')).toBeInTheDocument()
      expect(screen.getByText('Fidelización de Clientes')).toBeInTheDocument()
    })

    expect(screen.getByText(/60 bolsas/i)).toBeInTheDocument()
    expect(screen.getByText('PLATINO')).toBeInTheDocument()
  })
})
