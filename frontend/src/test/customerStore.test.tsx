import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import CustomerStorePage from '../pages/CustomerStorePage'
import productService from '../services/productService'
import customerService from '../services/customerService'
import orderService from '../services/orderService'

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

vi.mock('../services/orderService', () => ({
  default: {
    createOrder: vi.fn(),
    guestCheckout: vi.fn(),
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
          sku: 'COF-COL-MED',
          name: 'Café Colombia Huila Supremo',
          description: 'Notas de caramelo y chocolate negro.',
          origin: 'Huila, Colombia',
          roastLevel: 'MEDIUM',
          category: 'ESPRESSO_SINGLE_ORIGIN',
          unitPrice: 18.5,
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

  it('renders customer greeting, tier badge, and available coffees', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerStorePage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Cafés de Temporada & Mesa de Cata/i)).toBeInTheDocument()
      expect(screen.getByText('Café Colombia Huila Supremo')).toBeInTheDocument()
      expect(screen.getByText('$18.50')).toBeInTheDocument()
      expect(screen.getByText(/340 pts/i)).toBeInTheDocument()
    })
  })

  it('adds coffee to cart, opens cart drawer, and displays discount', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerStorePage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Café Colombia Huila Supremo')).toBeInTheDocument()
    })

    // Click "Agregar"
    const addBtn = screen.getByRole('button', { name: /Agregar/i })
    fireEvent.click(addBtn)

    // Open Cart Drawer
    const cartBtn = screen.getByTestId('cart-drawer-btn')
    fireEvent.click(cartBtn)

    await waitFor(() => {
      expect(screen.getByText('Carrito de Compras')).toBeInTheDocument()
      expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument()
      expect(screen.getByText(/Descuento Lealtad/i)).toBeInTheDocument()
    })
  })

  it('opens simulated billing invoice modal and processes order', async () => {
    vi.mocked(orderService.createOrder).mockResolvedValueOnce({
      id: 99,
      orderNumber: 'ORD-2026-7777',
      customerId: 1,
      items: [],
      status: 'CONFIRMADO',
      paymentMethod: 'TARJETA_CREDITO',
      subtotal: 18.5,
      discount: 1.85,
      tax: 1.66,
      total: 18.31,
      createdAt: new Date().toISOString(),
    })

    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerStorePage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Café Colombia Huila Supremo')).toBeInTheDocument()
    })

    // Add to cart
    fireEvent.click(screen.getByRole('button', { name: /Agregar/i }))

    // Open Cart Drawer
    fireEvent.click(screen.getByTestId('cart-drawer-btn'))

    // Click "Simular Facturación & Pago"
    await waitFor(() => {
      expect(screen.getByTestId('proceed-billing-btn')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('proceed-billing-btn'))

    // Verify Invoice modal is displayed
    await waitFor(() => {
      expect(screen.getByText(/SISTEMA CAFÉ ENTERPRISE S.A.S./i)).toBeInTheDocument()
      expect(screen.getByText(/TOTAL A FACTURAR:/i)).toBeInTheDocument()
    })

    // Click confirm simulation
    const confirmBtn = screen.getByTestId('confirm-simulation-btn')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalled()
      expect(screen.getByText(/¡Pedido confirmado con éxito!/i)).toBeInTheDocument()
    })
  })
})
