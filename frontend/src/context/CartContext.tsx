import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

export interface CartProduct {
  id: number
  sku: string
  name: string
  price: number
  unitPrice?: number
  description?: string
  stockQuantity?: number
  category?: string
  roastLevel?: string
  origin?: string
  flavorNotes?: string
  active?: boolean
  imageUrl?: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  addToCart: (productOrPayload: any, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, delta: number) => void
  clearCart: () => void
  subtotal: number
  totalCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'coffee_cart'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // ignore JSON parse error
    }
    return []
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // storage unavailable
    }
  }, [cart])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const addToCart = useCallback((productOrPayload: any, quantity: number = 1) => {
    if (!productOrPayload) return

    // Normalize from diverse sources (Product entity or MCP toolResult payload)
    const raw = productOrPayload.product || productOrPayload
    const id = Number(raw.id || raw.productId || 1)
    const name = String(raw.name || raw.nombre || 'Café de Especialidad')
    const price = Number(raw.price || raw.precio || raw.unitPrice || 0)
    const sku = String(raw.sku || `COF-${id}`)
    const stockQuantity = Number(raw.stockQuantity || raw.stock || raw.stockDisponible || 50)

    const normalizedProduct: CartProduct = {
      id,
      name,
      price,
      unitPrice: price,
      sku,
      stockQuantity,
      description: raw.description || raw.descripcion || '',
      category: raw.category || raw.categoria || 'SPECIALTY_BEANS',
      roastLevel: raw.roastLevel || raw.tueste || 'MEDIUM',
      origin: raw.origin || raw.origen || 'Origen de la Casa',
      flavorNotes: raw.flavorNotes || raw.notasCata || '',
      imageUrl: raw.imageUrl || raw.image,
      active: true,
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === id)
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity
        const newQty = Math.min(currentQty + quantity, stockQuantity)
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        }
        return updated
      }
      return [...prev, { product: normalizedProduct, quantity: Math.min(quantity, stockQuantity) }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta
            if (nextQty <= 0) return null
            const maxStock = item.product.stockQuantity || 50
            return {
              ...item,
              quantity: Math.min(nextQty, maxStock),
            }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Subtotal & Total Items calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  }, [cart])

  const totalCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0)
  }, [cart])

  // Custom Event Listeners for Sommelier AI Co-Navigation & Chat sync
  useEffect(() => {
    const handleCartAdd = (e: any) => {
      const detail = e.detail
      if (detail) {
        const qty = detail.quantity || detail.product?.quantity || 1
        addToCart(detail.product || detail, qty)
      }
    }

    const handleOpenCart = () => setIsCartOpen(true)
    const handleCloseCart = () => setIsCartOpen(false)

    window.addEventListener('sommelier:add-to-cart', handleCartAdd)
    window.addEventListener('sommelier:open-cart', handleOpenCart)
    window.addEventListener('sommelier:close-cart', handleCloseCart)

    return () => {
      window.removeEventListener('sommelier:add-to-cart', handleCartAdd)
      window.removeEventListener('sommelier:open-cart', handleOpenCart)
      window.removeEventListener('sommelier:close-cart', handleCloseCart)
    }
  }, [addToCart])

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
