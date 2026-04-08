# GLM Design Recommendations — Cosmic Volume & Depth

> Saved from GLM analysis 2026-04-08. Apply incrementally.

## Key Principles
- Every element should look like a **light source**, not a painted surface
- Use `box-shadow` instead of `border-color`, `text-shadow` instead of plain text
- Use `radial-gradient` instead of solid fills
- `mix-blend-mode: screen` for glows over dark background

## Priority Effects to Apply

### 1. Glass Cards with Depth
```css
box-shadow: 
  0 8px 32px rgba(0,0,0,0.4),
  inset 0 1px 0 rgba(255,255,255,0.1),
  inset 0 -1px 0 rgba(0,0,0,0.3),
  0 0 20px rgba(0,240,255,0.1);
transform: perspective(1000px) rotateX(2deg);
```

### 2. Animated Border Glow
```css
@keyframes borderPulse {
  0%, 100% { border-color: rgba(0,240,255,0.3); }
  50% { border-color: rgba(0,240,255,0.6); }
}
```

### 3. Scan Line Effect on Panels
```css
.scan-line {
  background: linear-gradient(90deg, transparent, #00f0ff, transparent);
  animation: scan 3s linear infinite;
}
```

### 4. Float Animation for Cards
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
```

### 5. Robot Hologram Effect
- Float animation + pulse ring + scanline overlay

### 6. Reveal Animation on Page Load
```css
@keyframes reveal {
  from { opacity: 0; filter: blur(10px); transform: translateY(20px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}
```

## Color Palette (Cosmic Cyber)
- Primary glow: #00f0ff (electric cyan)
- Secondary glow: #bc13fe (neon purple)  
- Warning: #ff0055 (hot pink)
- Success: #00ff88 (matrix green)
- BG: #050810 → #0a1628
- Glass: rgba(15, 23, 42, 0.7)
