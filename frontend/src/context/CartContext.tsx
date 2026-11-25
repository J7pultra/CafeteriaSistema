import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AuthContext } from './AuthContext'

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
  lastAddedAt: number
  lastAddedProductId: number | null
  triggerFlyToCart: (sourceEl?: HTMLElement | null, imageUrl?: string, label?: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const LEGACY_CART_STORAGE_KEY = 'coffee_cart'
const getCartStorageKey = (username?: string | null): string =>
  username ? `coffee_cart:${username}` : 'coffee_cart:guest'

const readStoredCart = (storageKey: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    // ignore JSON parse error
  }
  return []
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authCtx = useContext(AuthContext)
  const storageKey = getCartStorageKey(authCtx?.user?.username)
  const loadedKeyRef = useRef<string>(storageKey)

  const [cart, setCart] = useState<CartItem[]>(() => readStoredCart(storageKey))

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [lastAddedAt, setLastAddedAt] = useState<number>(0)
  const [lastAddedProductId, setLastAddedProductId] = useState<number | null>(null)

  const triggerFlyToCart = useCallback(
    (sourceEl?: HTMLElement | null, imageUrl?: string, label?: string) => {
      try {
        const rect = sourceEl?.getBoundingClientRect()
        window.dispatchEvent(
          new CustomEvent('cart:fly-item', {
            detail: {
              startRect: rect
                ? {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }
                : null,
              imageUrl,
              label,
            },
          })
        )
      } catch {
        // Safe noop in non-DOM tests
      }
    },
    []
  )

  // Reset guest cart on explicit logout so previous user items never leak
  useEffect(() => {
    const handleAuthLogout = () => {
      try {
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
        localStorage.removeItem('coffee_cart:guest')
      } catch {
        // ignore
      }
      setIsCartOpen(false)
      setCart([])
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [])

  // Persist cart to account-scoped localStorage, or switch cart cleanly when account changes
  useEffect(() => {
    if (loadedKeyRef.current !== storageKey) {
      loadedKeyRef.current = storageKey
      setIsCartOpen(false)
      setCart(readStoredCart(storageKey))
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart))
    } catch {
      // storage unavailable
    }
  }, [cart, storageKey])

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

    setLastAddedProductId(id)
    setLastAddedAt(Date.now())

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

    // Automatically trigger flying particle from matching product card if present in DOM
    try {
      const cardEl = document.getElementById(`product-card-${id}`)
      if (cardEl) {
        triggerFlyToCart(cardEl, normalizedProduct.imageUrl, name)
      }
    } catch {
      // Safe noop
    }
  }, [triggerFlyToCart])

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
        lastAddedAt,
        lastAddedProductId,
        triggerFlyToCart,
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
