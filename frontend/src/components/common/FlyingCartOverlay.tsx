import React, { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'

interface FlyingParticle {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  imageUrl?: string
  active: boolean
}

export const FlyingCartOverlay: React.FC = () => {
  const [particles, setParticles] = useState<FlyingParticle[]>([])

  useEffect(() => {
    const handleFlyItem = (e: Event) => {
      const customEvent = e as CustomEvent<{
        startRect?: { left: number; top: number; width: number; height: number } | null
        imageUrl?: string
      }>
      const startRect = customEvent.detail?.startRect
      if (!startRect) return

      const targetEl =
        (document.querySelector('[data-testid="cart-drawer-btn"]') as HTMLElement | null) ||
        (document.querySelector('[data-testid="guest-cart-link"]') as HTMLElement | null) ||
        (document.querySelector('[data-testid="sidebar-cart-link"]') as HTMLElement | null)

      const endRect = targetEl?.getBoundingClientRect()
      const startX = startRect.left + startRect.width / 2 - 20
      const startY = startRect.top + startRect.height / 2 - 20
      const endX = endRect ? endRect.left + endRect.width / 2 - 14 : window.innerWidth - 90
      const endY = endRect ? endRect.top + endRect.height / 2 - 14 : 40

      const id = Date.now() + Math.random()
      const newParticle: FlyingParticle = {
        id,
        startX,
        startY,
        endX,
        endY,
        imageUrl: customEvent.detail?.imageUrl,
        active: false,
      }

      setParticles((prev) => [...prev, newParticle])

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setParticles((prev) =>
            prev.map((p) => (p.id === id ? { ...p, active: true } : p))
          )
        })
      })

      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id))
      }, 650)
    }

    window.addEventListener('cart:fly-item', handleFlyItem)
    return () => window.removeEventListener('cart:fly-item', handleFlyItem)
  }, [])

  if (particles.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10050,
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: 'var(--accent-gold)',
            border: '2px solid #fff',
            boxShadow: '0 8px 24px rgba(212, 163, 115, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#140e0a',
            transform: p.active
              ? `translate3d(${p.endX}px, ${p.endY}px, 0) scale(0.35) rotate(18deg)`
              : `translate3d(${p.startX}px, ${p.startY}px, 0) scale(1.1) rotate(-6deg)`,
            opacity: p.active ? 0.15 : 1,
            transition:
              'transform 0.56s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.56s ease-in',
            willChange: 'transform, opacity',
          }}
        >
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ShoppingBag size={18} />
          )}
        </div>
      ))}
    </div>
  )
}

export default FlyingCartOverlay
