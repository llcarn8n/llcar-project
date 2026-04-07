interface WeatherData {
  temp: number
  condition: string
}

export function WeatherWidget({ weather }: { weather?: WeatherData | null }) {
  if (!weather) return null

  const icon = weather.condition === 'clear' ? '\u2600'
    : weather.condition === 'clouds' ? '\u2601'
    : weather.condition === 'rain' ? '\uD83C\uDF27'
    : weather.condition === 'snow' ? '\u2744' : '\uD83C\uDF24'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 8,
      background: 'rgba(10,20,30,0.6)', border: '1px solid rgba(0,229,255,0.15)',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "Consolas, monospace", fontSize: 16, color: '#fff', fontWeight: 'bold' }}>
          {Math.round(weather.temp)}{"°C"}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          {weather.condition}
        </div>
      </div>
    </div>
  )
}
