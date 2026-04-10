import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GlassPanel } from '../components/shared/GlassPanel'
import { useApiData } from '../hooks/useApiData'
import { useDashboardStore } from '../stores/dashboardStore'
import { theme } from '../theme'

interface TripPoint {
  ts: string
  lat: number
  lng: number
  vib: number
  speed: number
  temp: number | null
  weather: string
  road: string
}

interface Trip {
  start: string
  end: string
  points: number
  route: TripPoint[]
  avg_vib: number
  max_vib: number
  avg_speed: number
  weather: string
}

// Custom marker icon (cyan dot) — start
const dotIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#00E5FF;box-shadow:0 0 10px #00E5FF,0 0 20px rgba(0,229,255,0.4);border:2px solid #fff"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// End marker (red dot)
const endIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#FF1744;box-shadow:0 0 10px #FF1744,0 0 20px rgba(255,23,68,0.4);border:2px solid #fff"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function vibColor(vib: number): string {
  if (vib < 2) return '#00E5FF'
  if (vib < 5) return '#FFAB00'
  return '#FF1744'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// Weather text → icon mapping
const weatherIcons: Record<string, string> = {
  clear: '☀️',
  sunny: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  overcast: '☁️',
  rain: '🌧️',
  light_rain: '🌦️',
  heavy_rain: '🌧️',
  snow: '🌨️',
  thunderstorm: '⛈️',
  fog: '🌫️',
  mist: '🌫️',
  wind: '💨',
  drizzle: '🌦️',
}

function weatherIcon(raw: string): string {
  if (!raw) return ''
  const key = raw.toLowerCase().trim()
  return weatherIcons[key] ?? raw
}

// Child component that controls map bounds via useMap()
function MapController({ trips, selectedTrip }: { trips: Trip[]; selectedTrip: number | null }) {
  const map = useMap()

  // Compute bounds for given trips
  const bounds = useMemo(() => {
    const visibleTrips = selectedTrip !== null ? [trips[selectedTrip]] : trips
    const allPoints: [number, number][] = []
    for (const trip of visibleTrips) {
      if (!trip) continue
      for (const p of trip.route) {
        allPoints.push([p.lat, p.lng])
      }
    }
    if (allPoints.length === 0) return null
    return L.latLngBounds(allPoints)
  }, [trips, selectedTrip])

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      // padding: [top, right, bottom, left] — extra left for sidebar overlay
      map.fitBounds(bounds, { padding: L.point(400, 50), maxZoom: 16, animate: true })
    }
  }, [map, bounds])

  return null
}

export function Trips() {
  const { clientHash, timeRange } = useDashboardStore()
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null)
  const [listOpen, setListOpen] = useState(true)

  const { data } = useApiData<{ trips: Trip[] }>({
    endpoint: '/api/trips/',
    params: { client: clientHash, minutes: timeRange },
    refreshInterval: 60000,
  })

  const trips = data?.trips ?? []
  const active = selectedTrip !== null ? trips[selectedTrip] : null

  // Default center (Moscow) or first trip's start
  const defaultCenter: [number, number] = trips.length > 0 && trips[0].route.length > 0
    ? [trips[0].route[0].lat, trips[0].route[0].lng]
    : [55.75, 37.62]

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Trip list sidebar — collapsible on mobile */}
      <div className="md:col-span-3 overflow-y-auto md:max-h-[calc(100vh-100px)]" style={{ maxHeight: listOpen ? 220 : 48 }}>
        <GlassPanel>
          <div
            className="hud-header mb-3 cursor-pointer md:cursor-default flex items-center justify-between"
            onClick={() => setListOpen(!listOpen)}
          >
            <span>Поездки ({trips.length})</span>
            <span className="md:hidden text-[10px]" style={{ color: theme.text.muted }}>
              {listOpen ? '▲ свернуть' : '▼ развернуть'}
            </span>
          </div>
          {trips.length === 0 ? (
            <div className="text-white/20 text-sm font-mono text-center py-8">
              Нет поездок за выбранный период
            </div>
          ) : listOpen ? (
            <div className="space-y-2">
              {trips.map((trip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedTrip(selectedTrip === i ? null : i)
                    // On mobile: collapse list after selection
                    if (window.innerWidth < 768) setListOpen(false)
                  }}
                  className="w-full text-left p-3 rounded transition-all"
                  style={{
                    background: selectedTrip === i ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedTrip === i ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono" style={{ color: theme.accent.cyan }}>
                      {formatTime(trip.start)} — {formatTime(trip.end)}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: theme.text.muted }}>
                      {trip.points} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: theme.text.secondary }}>
                    <span>Ср. скор: <b style={{ color: '#fff' }}>{trip.avg_speed}</b> км/ч</span>
                    <span>Вибр: <b style={{ color: vibColor(trip.avg_vib) }}>{trip.avg_vib}</b></span>
                    <span>{weatherIcon(trip.weather)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {/* Trip stats */}
          {active && listOpen && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,229,255,0.15)' }}>
              <div className="hud-header mb-2" style={{ fontSize: '0.6rem' }}>Статистика</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ср. скорость', value: `${active.avg_speed}`, unit: 'км/ч' },
                  { label: 'Ср. вибрация', value: `${active.avg_vib}`, unit: 'м/с²' },
                  { label: 'Макс. вибр.', value: `${active.max_vib}`, unit: 'м/с²' },
                  { label: 'Точек', value: `${active.points}`, unit: '' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded" style={{ background: 'rgba(0,229,255,0.03)' }}>
                    <div className="text-[9px] font-mono" style={{ color: theme.text.muted }}>{s.label}</div>
                    <div className="metric-value" style={{ fontSize: 18 }}>{s.value}</div>
                    <div className="text-[9px]" style={{ color: theme.text.muted }}>{s.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Map */}
      <div className="md:col-span-9 flex-1 min-h-[350px]">
        <GlassPanel className="!p-0 overflow-hidden" style={{ height: '100%' }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
            zoomControl={false}
            attributionControl={false}
          >
            <div className="leaflet-bottom leaflet-right" style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 1000, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Consolas' }}>
              © 2ГИС
            </div>
            <TileLayer
              attribution='&copy; <a href="https://2gis.ru">2ГИС</a>'
              url="https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1"
              subdomains="0123"
              className="dark-tiles"
            />

            <MapController trips={trips} selectedTrip={selectedTrip} />

            {/* Render all trips or just selected */}
            {(selectedTrip !== null ? [trips[selectedTrip]] : trips).map((trip, ti) => {
              if (!trip || trip.route.length < 2) return null

              // Split route into segments colored by vibration
              const segments: { positions: [number, number][]; color: string }[] = []
              for (let i = 0; i < trip.route.length - 1; i++) {
                const p = trip.route[i]
                const next = trip.route[i + 1]
                segments.push({
                  positions: [[p.lat, p.lng], [next.lat, next.lng]],
                  color: vibColor(p.vib),
                })
              }

              const start = trip.route[0]
              const end = trip.route[trip.route.length - 1]

              return (
                <div key={ti}>
                  {segments.map((seg, si) => (
                    <Polyline
                      key={si}
                      positions={seg.positions}
                      pathOptions={{ color: seg.color, weight: 3, opacity: 0.8 }}
                    />
                  ))}
                  <Marker position={[start.lat, start.lng]} icon={dotIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'Consolas', fontSize: 11 }}>
                        <b>Старт</b> {formatTime(start.ts)}<br />
                        Скорость: {start.speed} км/ч<br />
                        Вибрация: {start.vib} м/с²
                      </div>
                    </Popup>
                  </Marker>
                  <Marker position={[end.lat, end.lng]} icon={endIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'Consolas', fontSize: 11 }}>
                        <b>Финиш</b> {formatTime(end.ts)}<br />
                        Скорость: {end.speed} км/ч<br />
                        Вибрация: {end.vib} м/с²
                      </div>
                    </Popup>
                  </Marker>
                </div>
              )
            })}
          </MapContainer>
        </GlassPanel>
      </div>
    </div>
  )
}
