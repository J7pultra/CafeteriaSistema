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
import { RoastBadge, TierBadge } from '../components/common/Badge'
import dashboardService from '../services/dashboardService'
import productService from '../services/productService'
import type { DashboardMetrics, Product, CustomerTier, RoastLevel } from '../types'

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
          salesByRoastLevel: {} as Record<RoastLevel, number>,
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

  if (loading) {
    return <LoadingSpinner label="Calculando analíticas de negocio en tiempo real..." />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consola de Operaciones</h1>
          <p className="page-desc">
            Balance de facturación, rotación de lotes y estado de inventario.
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
          message={`¡Alerta de Inventario Crítico! Existen ${metrics.lowStockCount} lotes de granos de café con stock menor a 10 kg.`}
        />
      )}

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <StatCard
          title="Ingresos Totales"
          value={`$${Number(metrics?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Facturación acumulada (7 días)"
          icon={<DollarSign size={20} color="var(--accent-green)" />}
          iconBg="var(--accent-green-soft)"
        />

        <StatCard
          title="Órdenes Procesadas"
          value={metrics?.totalOrders ?? 0}
          subtitle={`${metrics?.activeOrders ?? 0} órdenes en preparación`}
          icon={<TrendingUp size={20} color="var(--accent-gold)" />}
          iconBg="var(--accent-gold-soft)"
        />

        <StatCard
          title="Clientes Nuevos Semanales"
          value={metrics?.weeklyNewCustomers ?? 0}
          subtitle="Registrados en los últimos 7 días"
          icon={<UserPlus size={20} color="var(--accent-blue)" />}
          iconBg="var(--accent-blue-soft)"
        />

        <StatCard
          title="Stock Crítico"
          value={metrics?.lowStockCount ?? 0}
          subtitle="Lotes < 10 unidades/kg"
          icon={<AlertTriangle size={20} color="var(--accent-red)" />}
          iconBg="var(--accent-red-soft)"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="dashboard-grid">
        {/* Sales by Roast Level */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={20} color="var(--accent-gold)" />
              <span>Ventas por Nivel de Tueste</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Métricas Acumuladas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {metrics?.salesByRoastLevel &&
              Object.entries(metrics.salesByRoastLevel).map(([roast, count]) => {
                const total = Object.values(metrics.salesByRoastLevel).reduce((a, b) => a + b, 0) || 1
                const percent = Math.round((count / total) * 100)
                return (
                  <div key={roast}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <RoastBadge roast={roast as RoastLevel} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {count} bolsas ({percent}%)
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
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor:
                            roast === 'OSCURO'
                              ? '#78350f'
                              : roast === 'MEDIO'
                                ? 'var(--accent-gold)'
                                : 'var(--accent-green)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Customer Loyalty Tier Distribution */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--accent-blue)" />
              <span>Fidelización de Clientes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metrics?.customersByTier &&
              Object.entries(metrics.customersByTier).map(([tier, count]) => (
                <div
                  key={tier}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
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

      {/* Critical Stock Inventory Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--accent-red)" />
            <span>Alerta de Reabastecimiento Inmediato</span>
          </div>
          <span className="badge badge-red">{lowStockProducts.length} Lotes Afectados</span>
        </div>

        {lowStockProducts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' }}>
            Todo el inventario de granos de café se encuentra en niveles óptimos.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Variedad / Lote</th>
                  <th>Origen</th>
                  <th>Nivel de Tueste</th>
                  <th>Stock Restante</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.origin || 'No especificado'}</td>
                    <td>
                      <RoastBadge roast={p.roastLevel} />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>
                      {p.stockQuantity} kg
                    </td>
                    <td>
                      <span className="badge badge-red">Stock Crítico</span>
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
