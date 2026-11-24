import React from 'react'
import type { CustomerTier, OrderStatus, RoastLevel } from '../../types'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'blue'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gold', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>
}

export const TierBadge: React.FC<{ tier: CustomerTier }> = ({ tier }) => {
  const map: Record<CustomerTier, { label: string; variant: 'gold' | 'green' | 'blue' | 'red' }> = {
    PLATINUM: { label: 'PLATINO', variant: 'blue' },
    GOLD: { label: 'ORO', variant: 'gold' },
    SILVER: { label: 'PLATA', variant: 'green' },
    BRONZE: { label: 'BRONCE', variant: 'gold' },
  }
  const config = map[tier] || { label: tier, variant: 'gold' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const RoastBadge: React.FC<{ roast: RoastLevel | string }> = ({ roast }) => {
  const map: Record<string, { label: string; variant: 'gold' | 'green' | 'blue' | 'red' }> = {
    LIGHT: { label: 'Tueste Claro', variant: 'green' },
    MEDIUM_LIGHT: { label: 'Medio Claro', variant: 'green' },
    MEDIUM: { label: 'Tueste Medio', variant: 'gold' },
    MEDIUM_DARK: { label: 'Medio Oscuro', variant: 'gold' },
    DARK: { label: 'Tueste Oscuro', variant: 'red' },
    CLARO: { label: 'Tueste Claro', variant: 'green' },
    MEDIO_CLARO: { label: 'Medio Claro', variant: 'green' },
    MEDIO: { label: 'Tueste Medio', variant: 'gold' },
    MEDIO_OSCURO: { label: 'Medio Oscuro', variant: 'gold' },
    OSCURO: { label: 'Tueste Oscuro', variant: 'red' },
  }
  const config = map[String(roast)] || { label: String(roast), variant: 'gold' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const map: Record<string, { label: string; variant: 'gold' | 'green' | 'blue' | 'red' }> = {
    HOT_BEVERAGES: { label: 'Bebidas Calientes', variant: 'gold' },
    COLD_BEVERAGES: { label: 'Bebidas Frías', variant: 'blue' },
    BAKERY: { label: 'Repostería', variant: 'gold' },
    BREAKFAST: { label: 'Desayunos', variant: 'green' },
    SNACKS: { label: 'Snacks', variant: 'blue' },
    OTHER: { label: 'Otros', variant: 'gold' },
    BEBIDAS_CALIENTES: { label: 'Bebidas Calientes', variant: 'gold' },
    BEBIDAS_FRIAS: { label: 'Bebidas Frías', variant: 'blue' },
    REPOSTERIA: { label: 'Repostería', variant: 'gold' },
    DESAYUNOS: { label: 'Desayunos', variant: 'green' },
    OTROS: { label: 'Otros', variant: 'gold' },
  }
  const config = map[category] || { label: category, variant: 'gold' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const map: Record<OrderStatus, { label: string; variant: 'gold' | 'green' | 'blue' | 'red' }> = {
    PENDIENTE: { label: 'Pendiente', variant: 'gold' },
    CONFIRMADO: { label: 'Confirmado', variant: 'blue' },
    EN_PREPARACION: { label: 'En Preparación', variant: 'blue' },
    LISTO: { label: 'Listo para Entrega', variant: 'green' },
    ENTREGADO: { label: 'Entregado', variant: 'green' },
    CANCELADO: { label: 'Cancelado', variant: 'red' },
  }
  const config = map[status] || { label: status, variant: 'gold' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default Badge
