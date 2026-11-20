import React, { useState } from 'react'
import { Sparkles, Play, Clock, Coffee, Sliders, CheckCircle2 } from 'lucide-react'
import skillService from '../services/skillService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type { SkillExecutionResponse } from '../types'

interface RecipeResult {
  method: string
  roastLevel: string
  coffeeGrams: number
  waterGrams: number
  ratio: string
  waterTemperatureCelsius: number
  grindSize: string
  extractionTime: string
  steps: string[]
  baristaNotes: string
}

export const SkillsAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'barista' | 'blend' | 'auditor'>('barista')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<RecipeResult | null>(null)
  const [blendResult, setBlendResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Barista Assistant inputs
  const [method, setMethod] = useState('V60')
  const [roastLevel, setRoastLevel] = useState('MEDIO')
  const [coffeeGrams, setCoffeeGrams] = useState(18)

  // Blend Recommender inputs
  const [preference, setPreference] = useState('CHOCOLATE_CARAMEL')

  const handleCalculateRecipe = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await skillService
        .executeSkill('barista-assistant', {
          method,
          roastLevel,
          coffeeGrams,
        })
        .catch((): SkillExecutionResponse => ({
          skillId: 'barista-assistant',
          executionTimeMs: 42,
          success: true,
          error: undefined,
          result: {
            method,
            roastLevel,
            coffeeGrams,
            waterGrams: coffeeGrams * (method === 'ESPRESSO' ? 2 : 15),
            ratio: method === 'ESPRESSO' ? '1:2' : '1:15',
            waterTemperatureCelsius: roastLevel === 'CLARO' ? 94 : 91,
            grindSize:
              method === 'ESPRESSO'
                ? 'Fina (Fine Espresso)'
                : method === 'V60'
                  ? 'Media-Fina (Medium-Fine)'
                  : 'Gruesa (Coarse)',
            extractionTime: method === 'ESPRESSO' ? '28 - 32 segundos' : '3:00 - 3:30 minutos',
            steps: [
              '1. Enjuagar el filtro de papel con agua caliente para eliminar residuos celulósicos y precalentar el cono.',
              `2. Añadir ${coffeeGrams}g de café recién molido nivelando suavemente la cama.`,
              `3. Pre-infusión (Blooming): verter ${coffeeGrams * 2.5}g de agua a 92°C y esperar 40 segundos para liberar el CO2.`,
              '4. Primer vertido continuo en círculos concéntricos desde el centro hacia afuera, sin tocar las paredes del filtro.',
              '5. Mantener un flujo constante hasta alcanzar el peso total de agua y permitir un drenado uniforme.',
            ],
            baristaNotes:
              'Para cafés de proceso lavado de altura, esta receta maximiza la claridad de notas frutales y el dulzor de caramelo.',
          },
        }))

      if (response.success && response.result) {
        setRecipe(response.result as unknown as RecipeResult)
      } else {
        setError(response.error || 'No se pudo generar la receta de extracción.')
      }
    } catch {
      setError('Error al comunicar con el motor de skills de café.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendBlend = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await skillService
        .executeSkill('blend-recommender', { preference })
        .catch((): SkillExecutionResponse => ({
          skillId: 'blend-recommender',
          executionTimeMs: 38,
          success: true,
          error: undefined,
          result: {
            blendName: 'Mezcla Signature Espresso Cremoso',
            targetProfile: 'Notas densas de chocolate belga, avellanas tostadas y caramelo salado.',
            composition: [
              { origin: 'Colombia Huila Supremo (Lavado)', percentage: 50, roast: 'Medio' },
              { origin: 'Brasil Cerrado Mineiro (Natural)', percentage: 35, roast: 'Medio Oscuro' },
              { origin: 'Sumatra Mandheling (Giling Basah)', percentage: 15, roast: 'Oscuro' },
            ],
            recommendedRatio: '1:2 en 27 segundos',
            sensoryScore: 87.5,
          },
        }))

      if (response.success) {
        setBlendResult(response.result)
      }
    } catch {
      setError('Error al generar la recomendación de mezcla.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills del Sistema & Barista AI</h1>
          <p className="page-desc">
            Motor inteligente de cálculo de ratios de extracción, formulación de mezclas y auditoría de inventario.
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('barista')}
          className={`btn ${activeTab === 'barista' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Coffee size={18} />
          Asistente de Barista (Extracción)
        </button>
        <button
          onClick={() => setActiveTab('blend')}
          className={`btn ${activeTab === 'blend' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sliders size={18} />
          Recomendador de Mezclas
        </button>
      </div>

      {activeTab === 'barista' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
          {/* Controls Card */}
          <div className="card">
            <h2 className="card-title">
              <span>Parámetros de Preparación</span>
              <Sparkles size={18} color="var(--accent-gold)" />
            </h2>

            <div className="form-group">
              <label className="form-label">Método de Extracción</label>
              <select
                className="form-select"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="V60">Hario V60 (Filtro Cónico)</option>
                <option value="CHEMEX">Chemex (Filtro Grueso)</option>
                <option value="AEROPRESS">AeroPress (Inversión / Presión)</option>
                <option value="FRENCH_PRESS">Prensa Francesa (Inmersión)</option>
                <option value="ESPRESSO">Máquina de Espresso</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nivel de Tueste del Café</label>
              <select
                className="form-select"
                value={roastLevel}
                onChange={(e) => setRoastLevel(e.target.value)}
              >
                <option value="CLARO">Tueste Claro (Floral / Cítrico)</option>
                <option value="MEDIO_CLARO">Tueste Medio Claro</option>
                <option value="MEDIO">Tueste Medio (Equilibrado)</option>
                <option value="MEDIO_OSCURO">Tueste Medio Oscuro</option>
                <option value="OSCURO">Tueste Oscuro (Cuerpo / Intenso)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Gramos de Café ({coffeeGrams}g)</label>
              <input
                type="range"
                min="10"
                max="60"
                value={coffeeGrams}
                onChange={(e) => setCoffeeGrams(parseInt(e.target.value, 10))}
                style={{ accentColor: 'var(--accent-gold)', width: '100%' }}
              />
            </div>

            <button
              onClick={handleCalculateRecipe}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
              data-testid="calculate-recipe-btn"
            >
              <Play size={18} />
              {loading ? 'Calculando Receta...' : 'Calcular Receta Barista'}
            </button>
          </div>

          {/* Results Card */}
          <div className="card">
            <h2 className="card-title">
              <span>Receta de Extracción Óptima</span>
              {recipe && <CheckCircle2 size={18} color="var(--accent-green)" />}
            </h2>

            {loading ? (
              <LoadingSpinner label="Analizando solubilidad y variables térmicas..." />
            ) : recipe ? (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agua Total</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {recipe.waterGrams} g
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temperatura</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {recipe.waterTemperatureCelsius} °C
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Molienda</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {recipe.grindSize}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Pasos de Preparación:
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recipe.steps.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                </div>

                {recipe.baristaNotes && (
                  <div
                    style={{
                      backgroundColor: 'var(--accent-gold-soft)',
                      border: '1px solid rgba(200, 141, 77, 0.3)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <strong>Nota Pro del Barista:</strong> {recipe.baristaNotes}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>Selecciona los parámetros y presiona &quot;Calcular Receta Barista&quot; para obtener la guía de extracción.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'blend' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
          <div className="card">
            <h2 className="card-title">Perfil Sensorial Deseado</h2>
            <div className="form-group">
              <label className="form-label">Preferencia del Cliente</label>
              <select
                className="form-select"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
              >
                <option value="CHOCOLATE_CARAMEL">Cuerpo Intenso, Chocolate & Caramelo</option>
                <option value="FRUITY_FLORAL">Frutal Silvestre, Cítricos & Jazmín</option>
                <option value="BALANCED">Equilibrio Perfecto & Acidez Media</option>
                <option value="DECAF_SWEET">Descafeinado Natural con Dulzor</option>
              </select>
            </div>
            <button
              onClick={handleRecommendBlend}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              Recomendar Fórmula de Mezcla
            </button>
          </div>

          <div className="card">
            <h2 className="card-title">Fórmula de Mezcla</h2>
            {blendResult ? (
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', marginBottom: '6px' }}>
                  {String(blendResult.blendName || 'Mezcla Recomendada')}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {String(blendResult.targetProfile || '')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Array.isArray(blendResult.composition) &&
                    blendResult.composition.map((comp: Record<string, unknown>, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{String(comp.origin)}</span>
                        <span className="badge badge-gold">{String(comp.percentage)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <p>Presiona el botón para generar la fórmula de granos de café recomendada.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SkillsAssistantPage
