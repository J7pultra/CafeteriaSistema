import React, { useEffect, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  UserPlus,
  Coffee,
  Award,
  RefreshCw,
  Package,
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import { TierBadge, CategoryBadge } from '../components/common/Badge'
import dashboardService from '../services/dashboardService'
import productService from '../services/productService'
import useCountUp from '../hooks/useCountUp'
import type { DashboardMetrics, Product, CustomerTier } from '../types'

const CATEGORY_NAMES: Record<string, string> = {
  BEBIDAS_CALIENTES: 'Bebidas Calientes',
  HOT_BEVERAGES: 'Bebidas Calientes',
  BEBIDAS_FRIAS: 'Bebidas Frías',
  COLD_BEVERAGES: 'Bebidas Frías',
  REPOSTERIA: 'Repostería',
  BAKERY: 'Repostería',
  DESAYUNOS: 'Desayunos',
  BREAKFAST: 'Desayunos',
  SNACKS: 'Snacks',
  OTROS: 'Otros',
  OTHER: 'Otros',
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    setError(null)
    try {
      const [metricsData, lowStockData] = await Promise.all([
        dashboardService.getMetrics().catch(() => null),
        productService.getLowStockProducts(10).catch(() => []),
      ])
      setMetrics(
        metricsData ?? {
          totalOrders: 0,
          totalRevenue: 0,
          activeOrders: 0,
          lowStockCount: 0,
          weeklyNewCustomers: 0,
          customersByTier: {
            BRONZE: 0,
            SILVER: 0,
            GOLD: 0,
            PLATINUM: 0,
          } as Record<CustomerTier, number>,
          salesByCategory: {
            BEBIDAS_CALIENTES: 0,
            BEBIDAS_FRIAS: 0,
            REPOSTERIA: 0,
            DESAYUNOS: 0,
            SNACKS: 0,
            OTROS: 0,
          },
        }
      )
      setLowStockProducts(lowStockData ?? [])
    } catch {
      setError('Error al sincronizar métricas del dashboard con el backend.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const animatedRevenue = useCountUp(Number(metrics?.totalRevenue ?? 0), 650)
  const animatedOrders = useCountUp(Number(metrics?.totalOrders ?? 0), 550)
  const animatedWeeklyCustomers = useCountUp(Number(metrics?.weeklyNewCustomers ?? 0), 500)
  const animatedLowStock = useCountUp(Number(metrics?.lowStockCount ?? 0), 450)

  if (loading) {
    return <LoadingSpinner label="Cargando métricas de cafetería en tiempo real..." />
  }

  const categoryEntries = Object.entries(metrics?.salesByCategory ?? {}).map(([key, val]) => ({
    key,
    label: CATEGORY_NAMES[key] || key,
    amount: Number(val || 0),
  }))
  const totalCategorySales = categoryEntries.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">
            Balance de facturación, estado de pedidos y control de inventario de cafetería.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="btn btn-secondary"
          disabled={refreshing}
          data-testid="refresh-dashboard-btn"
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Sincronizando...' : 'Actualizar'}
        </button>
      </div>

      {error && <Alert type="warning" message={error} />}

      {metrics && metrics.lowStockCount > 0 && (
        <Alert
          type="warning"
          message={`Alerta de Inventario: Existen ${metrics.lowStockCount} productos con stock menor o igual a 10 unidades.`}
        />
      )}

      {/* KPI Cards Grid: 4 columns responsive */}
      <div className="stats-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos Totales"
          value={`$${animatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Facturación acumulada (órdenes válidas)"
          icon={<DollarSign size={20} color="var(--accent-green)" />}
          iconBg="var(--accent-green-soft)"
          staggerClass="stagger-1"
        />

        <StatCard
          title="Órdenes Procesadas"
          value={Math.round(animatedOrders)}
          subtitle={`${metrics?.activeOrders ?? 0} órdenes activas`}
          icon={<TrendingUp size={20} color="var(--accent-gold)" />}
          iconBg="var(--accent-gold-soft)"
          staggerClass="stagger-2"
        />

        <StatCard
          title="Clientes Nuevos Semanales"
          value={Math.round(animatedWeeklyCustomers)}
          subtitle="Registrados en los últimos 7 días"
          icon={<UserPlus size={20} color="var(--accent-blue)" />}
          iconBg="var(--accent-blue-soft)"
          staggerClass="stagger-3"
        />

        <StatCard
          title="Stock Bajo"
          value={Math.round(animatedLowStock)}
          subtitle="Productos con <= 10 uds"
          icon={<AlertTriangle size={20} color="var(--accent-red)" />}
          iconBg="var(--accent-red-soft)"
          staggerClass="stagger-4"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="dashboard-grid">
        {/* Sales by Cafeteria Category */}
        <div className="card animate-stagger stagger-5">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={20} color="var(--accent-gold)" />
              <span>Ventas por Categoría</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Métricas Reales</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {categoryEntries.length === 0 || totalCategorySales === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0', textAlign: 'center' }}>
                Sin órdenes completadas para calcular ventas por categoría aún.
              </p>
            ) : (
              categoryEntries.map(({ key, label, amount }) => {
                const percent = totalCategorySales > 0 ? Math.round((amount / totalCategorySales) * 100) : 0
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${amount.toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="progress-bar-fill-animate"
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: 'var(--accent-gold)',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Customer Loyalty Tier Distribution */}
        <div className="card animate-stagger stagger-6">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--accent-blue)" />
              <span>Fidelización de Clientes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metrics?.customersByTier &&
              Object.entries(metrics.customersByTier).map(([tier, count], idx) => (
                <div
                  key={tier}
                  className={`animate-stagger stagger-${Math.min(idx + 5, 12)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'transform 0.22s ease, border-color 0.22s ease',
                  }}
                >
                  <TierBadge tier={tier as CustomerTier} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Low Stock Inventory Table */}
      <div className="card animate-stagger stagger-7" style={{ marginTop: '24px' }}>
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--accent-red)" />
            <span>Alerta de Reabastecimiento Inmediato</span>
          </div>
          <span className="badge badge-red">{lowStockProducts.length} Productos Afectados</span>
        </div>

        {lowStockProducts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' }}>
            Todo el inventario se encuentra en niveles óptimos.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio Unitario</th>
                  <th>Stock Restante</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="animate-row"
                    style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>
                      <CategoryBadge category={p.category} />
                    </td>
                    <td>${Number(p.unitPrice ?? p.price ?? 0).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>
                      {p.stockQuantity} uds
                    </td>
                    <td>
                      <span className="badge badge-red">Stock Bajo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
