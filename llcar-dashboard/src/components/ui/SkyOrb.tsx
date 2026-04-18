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

  const B = import.meta.env.BASE_URL
  const mediaBase = `${B}images/icons/${isDay ? 'sun' : 'moon'}`
  const label = isDusk ? (hour < 12 ? 'DAWN' : 'DUSK') : isDay ? 'DAY' : 'NIGHT'
  const weatherHint = weather ? weatherIcon(weather.code, isDay) : ''

  // Glow radius — днём champagne «солнце заливает сцену», ночью холоднее и слабее
  const sceneGlowFilter = isDay
    ? 'drop-shadow(0 0 24px rgba(255,224,168,0.55)) drop-shadow(0 0 80px rgba(255,200,130,0.35)) drop-shadow(0 0 160px rgba(255,180,110,0.25))'
    : 'drop-shadow(0 0 16px rgba(170,190,225,0.45)) drop-shadow(0 0 50px rgba(130,150,210,0.25))'

  return (
    <div
      title={weather ? `${weather.temp}\u00B0C \u2022 ${label} ${weatherHint}` : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        cursor: 'help',
      }}
    >
      {/* Scene-wide glow halo — льёт свет на 3D сцену из правого верхнего угла */}
      {isDay && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -80, right: -80,
            width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,220,160,0.18) 0%, rgba(255,200,130,0.10) 25%, rgba(255,180,110,0.04) 50%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: -1,
            mixBlendMode: 'screen',
          }}
        />
      )}
      <video
        key={isDay ? 'day' : 'night'}
        src={`${mediaBase}.mp4`}
        poster={`${mediaBase}.jpg`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: 72,
          height: 72,
          objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: sceneGlowFilter,
          flexShrink: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--c-spectral)',
          letterSpacing: '0.02em',
          textShadow: '0 0 10px rgba(239,242,247,0.4)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {weather ? `${weather.temp}\u00B0` : '\u2014'}
      </span>
    </div>
  )
}
