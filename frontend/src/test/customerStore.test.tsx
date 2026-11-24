import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import CustomerStorePage from '../pages/CustomerStorePage'
import productService from '../services/productService'
import customerService from '../services/customerService'

vi.mock('../services/productService', () => ({
  default: {
    getProducts: vi.fn(),
  },
}))

vi.mock('../services/customerService', () => ({
  default: {
    getCustomerByEmail: vi.fn(),
  },
}))

describe('CustomerStorePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    localStorage.setItem('coffee_access_token', 'mock_jwt_token')
    localStorage.setItem(
      'coffee_user',
      JSON.stringify({
        id: 1,
        username: 'cliente_carlos',
        email: 'carlos.mendoza@example.com',
        roles: ['ROLE_CUSTOMER'],
      })
    )

    vi.mocked(productService.getProducts).mockResolvedValue({
      content: [
        {
          id: 1,
          sku: 'BEB-CAP-001',
          name: 'Cappuccino Vainilla',
          description: 'Café cappuccino con toque suave de vainilla.',
          category: 'HOT_BEVERAGES',
          unitPrice: 3.8,
          stockQuantity: 40,
          active: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    })

    vi.mocked(customerService.getCustomerByEmail).mockResolvedValue({
      id: 1,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@example.com',
      tier: 'GOLD',
      loyaltyPoints: 340,
      active: true,
    })
  })

  it('renders customer greeting, tier badge, and available products', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CustomerStorePage />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Menú de Cafetería/i)).toBeInTheDocument()
      expect(screen.getByText('Cappuccino Vainilla')).toBeInTheDocument()
      expect(screen.getByText('$3.80')).toBeInTheDocument()
      expect(screen.getByText(/340 pts/i)).toBeInTheDocument()
    })
  })

  it('adds item to cart and updates cart button count', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CustomerStorePage />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Cappuccino Vainilla')).toBeInTheDocument()
    })

    const addBtn = screen.getByRole('button', { name: /Agregar/i })
    fireEvent.click(addBtn)

    const cartBtn = screen.getByTestId('cart-drawer-btn')
    expect(cartBtn).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })
})
