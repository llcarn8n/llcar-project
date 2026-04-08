#!/usr/bin/env node
// Compress карикатуры and помощник images to WebP for web deployment
// Usage: npx sharp-cli is not ideal, use this script with: node scripts/compress-images.mjs

import { execSync } from 'child_process'
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs'
import { join, basename, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')

const sources = [
  {
    input: join(ROOT, 'карикатуры'),
    output: join(ROOT, 'llcar-dashboard', 'public', 'images', 'comics'),
    width: 1200,
    quality: 75,
  },
  {
    input: join(ROOT, 'помощник'),
    output: join(ROOT, 'llcar-dashboard', 'public', 'images', 'robot'),
    width: 800,
    quality: 80,
  },
]

for (const { input, output, width, quality } of sources) {
  if (!existsSync(output)) mkdirSync(output, { recursive: true })

  const files = readdirSync(input).filter(f => /\.(png|jpg|jpeg)$/i.test(f))
  console.log(`\n=== ${input} → ${output} (${files.length} files) ===`)

  for (const file of files) {
    const src = join(input, file)
    const stat = statSync(src)
    const name = basename(file, extname(file)).replace(/[\s()]/g, '_')
    const dst = join(output, `${name}.webp`)

    try {
      // Use sharp-cli: resize width, output as webp (detected from extension)
      execSync(`npx sharp-cli -i "${src}" -o "${dst}" -- resize ${width}`, {
        stdio: 'pipe',
        timeout: 30000,
      })
      const dstStat = statSync(dst)
      const ratio = ((1 - dstStat.size / stat.size) * 100).toFixed(0)
      console.log(`  ${file}: ${(stat.size / 1024).toFixed(0)}KB → ${(dstStat.size / 1024).toFixed(0)}KB (-${ratio}%)`)
    } catch (e) {
      console.error(`  FAIL: ${file} — ${e.message}`)
    }
  }
}

console.log('\nDone!')
