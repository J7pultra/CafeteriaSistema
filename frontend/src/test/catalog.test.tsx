import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import CatalogPage from '../pages/CatalogPage'
import productService from '../services/productService'
import type { Product } from '../types'

vi.mock('../services/productService', () => ({
  default: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateStock: vi.fn(),
    deleteProduct: vi.fn(),
  },
}))

describe('CatalogPage Component', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      sku: 'BEB-COL-MED',
      name: 'Café Cappuccino Tradicional',
      description: 'Café espresso con leche espumada.',
      category: 'HOT_BEVERAGES',
      price: 3.5,
      unitPrice: 3.5,
      stockQuantity: 45,
      active: true,
    },
    {
      id: 2,
      sku: 'REP-CRO-ALM',
      name: 'Croissant de Almendras',
      description: 'Croissant artesanal recién horneado.',
      category: 'BAKERY',
      price: 2.8,
      unitPrice: 2.8,
      stockQuantity: 6,
      active: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('coffee_access_token', 'mock_token')
    localStorage.setItem(
      'coffee_user',
      JSON.stringify({
        id: 1,
        username: 'admin',
        email: 'admin@sistemacafe.com',
        roles: ['ROLE_ADMIN'],
      })
    )

    vi.mocked(productService.getProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0,
    })
  })

  it('renders products and displays accurate inventory stock', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('BEB-COL-MED')).toBeInTheDocument()
      expect(screen.getByText('Café Cappuccino Tradicional')).toBeInTheDocument()
      expect(screen.getByText('45 uds')).toBeInTheDocument()
    })

    expect(screen.getByText('REP-CRO-ALM')).toBeInTheDocument()
    expect(screen.getByText('6 uds')).toBeInTheDocument()
  })

  it('filters products by search text', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('BEB-COL-MED')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, SKU o descripción/i)
    fireEvent.change(searchInput, { target: { value: 'Croissant' } })

    expect(screen.getByText('REP-CRO-ALM')).toBeInTheDocument()
    expect(screen.queryByText('BEB-COL-MED')).not.toBeInTheDocument()
  })

  it('opens and closes the quick restock modal', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('BEB-COL-MED')).toBeInTheDocument()
    })

    const restockButtons = screen.getAllByRole('button', { name: /Reabastecer/i })
    fireEvent.click(restockButtons[0])

    expect(screen.getByText(/Reabastecer: Café Cappuccino Tradicional/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmar Ingreso/i })).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Reabastecer: Café Cappuccino Tradicional/i)).not.toBeInTheDocument()
    })
  })
})
