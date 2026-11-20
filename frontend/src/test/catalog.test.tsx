import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CatalogPage from '../pages/CatalogPage'
import productService from '../services/productService'
import type { Product } from '../types'

vi.mock('../services/productService', () => ({
  default: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateStock: vi.fn(),
  },
}))

describe('CatalogPage Component', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      sku: 'COF-COL-MED',
      name: 'Café Colombia Huila Supremo',
      description: 'Notas de caramelo y chocolate.',
      origin: 'Huila, Colombia',
      roastLevel: 'MEDIO',
      category: 'ORIGEN_UNICO',
      price: 18.5,
      stockQuantity: 45,
      active: true,
    },
    {
      id: 2,
      sku: 'COF-ETH-YIR',
      name: 'Café Etiopía Yirgacheffe Grado 1',
      description: 'Notas florales a jazmín.',
      origin: 'Yirgacheffe, Etiopía',
      roastLevel: 'CLARO',
      category: 'ESPECIALIDAD',
      price: 24.0,
      stockQuantity: 6,
      active: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
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
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('COF-COL-MED')).toBeInTheDocument()
      expect(screen.getByText('Café Colombia Huila Supremo')).toBeInTheDocument()
      expect(screen.getByText('45 kg')).toBeInTheDocument()
    })

    expect(screen.getByText('COF-ETH-YIR')).toBeInTheDocument()
    expect(screen.getByText('6 kg')).toBeInTheDocument()
  })

  it('filters products by search text', async () => {
    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('COF-COL-MED')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Buscar por variedad, origen o SKU/i)
    fireEvent.change(searchInput, { target: { value: 'Etiopía' } })

    expect(screen.getByText('COF-ETH-YIR')).toBeInTheDocument()
    expect(screen.queryByText('COF-COL-MED')).not.toBeInTheDocument()
  })

  it('opens and closes the quick restock modal', async () => {
    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('COF-COL-MED')).toBeInTheDocument()
    })

    const restockButtons = screen.getAllByRole('button', { name: /Reabastecer/i })
    fireEvent.click(restockButtons[0])

    expect(screen.getByText(/Reabastecer: Café Colombia Huila Supremo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmar Reabastecimiento/i })).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Reabastecer: Café Colombia Huila Supremo/i)).not.toBeInTheDocument()
    })
  })
})
