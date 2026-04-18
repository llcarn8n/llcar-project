import { useEffect, useState } from 'react'

interface Weather {
  temp: number
  code: number
}

interface Cached {
  w: Weather
  ts: number
}

const CACHE_KEY = 'llcar.skyorb.weather'
const CACHE_TTL_MS = 15 * 60 * 1000

function weatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '\u2600' : '\u263E'
  if (code <= 3) return '\u26C5'
  if (code >= 45 && code <= 48) return '\u2601'
  if (code >= 51 && code <= 67) return '\u{1F327}'
  if (code >= 71 && code <= 77) return '\u2744'
  if (code >= 80 && code <= 82) return '\u{1F327}'
  if (code >= 95) return '\u26C8'
  return '\u2601'
}

async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
  const res = await fetch(url)
  const json = await res.json()
  return {
    temp: Math.round(json.current?.temperature_2m ?? 0),
    code: json.current?.weather_code ?? 0,
  }
}

function getCached(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cached
    if (Date.now() - c.ts > CACHE_TTL_MS) return null
    return c.w
  } catch {
    return null
  }
}

function setCached(w: Weather) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ w, ts: Date.now() } as Cached))
  } catch {}
}

export function SkyOrb() {
  const [weather, setWeather] = useState<Weather | null>(() => getCached())
  const [hour, setHour] = useState(() => new Date().getHours())

  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (weather) return
    let cancelled = false
    const loc = { lat: 55.7558, lon: 37.6173 }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { fetchWeather(pos.coords.latitude, pos.coords.longitude).then(w => { if (!cancelled) { setWeather(w); setCached(w) } }) },
        () => { fetchWeather(loc.lat, loc.lon).then(w => { if (!cancelled) { setWeather(w); setCached(w) } }) },
        { timeout: 3000, maximumAge: 15 * 60 * 1000 },
      )
    } else {
      fetchWeather(loc.lat, loc.lon).then(w => { if (!cancelled) { setWeather(w); setCached(w) } })
    }
    return () => { cancelled = true }
  }, [weather])

  const isDay = hour >= 7 && hour < 20
  const isDusk = (hour >= 6 && hour < 7) || (hour >= 19 && hour < 20)

  const sunCore = '#FFE8B0'
  const sunGlow = 'rgba(230,200,120,0.55)'
  const sunRim = 'rgba(200,160,80,0.35)'
  const moonCore = '#E8EEF8'
  const moonGlow = 'rgba(160,170,220,0.45)'
  const moonRim = 'rgba(107,90,224,0.45)'
  const duskCore = '#F4C89A'
  const duskGlow = 'rgba(220,140,100,0.5)'
  const duskRim = 'rgba(150,90,180,0.45)'

  const core = isDusk ? duskCore : isDay ? sunCore : moonCore
  const glow = isDusk ? duskGlow : isDay ? sunGlow : moonGlow
  const rim = isDusk ? duskRim : isDay ? sunRim : moonRim

  const ringOpacity = isDay ? 0.35 : 0.5
  const icon = weather ? weatherIcon(weather.code, isDay) : (isDay ? '\u2600' : '\u263E')
  const label = isDusk ? (hour < 12 ? 'DAWN' : 'DUSK') : isDay ? 'DAY' : 'NIGHT'

  return (
    <div
      title={weather ? `${weather.temp}\u00B0C \u2022 ${label}` : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        cursor: 'help',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${core} 0%, ${glow} 45%, transparent 75%)`,
          boxShadow: `0 0 24px ${glow}, 0 0 48px ${rim}, inset 0 0 12px rgba(255,255,255,0.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -5,
            borderRadius: '50%',
            border: `1px solid ${rim}`,
            opacity: ringOpacity,
          }}
        />
        {!isDay && (
          <div
            style={{
              position: 'absolute',
              top: 3,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(20,20,35,0.55)',
              filter: 'blur(1.5px)',
            }}
          />
        )}
        <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }}>{icon}</span>
      </div>
      <span
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--c-spectral)',
          letterSpacing: '0.02em',
          textShadow: '0 0 10px rgba(239,242,247,0.35)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {weather ? `${weather.temp}\u00B0` : '\u2014'}
      </span>
    </div>
  )
}
