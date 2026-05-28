// scripts/generate-icons.mjs
// Run: npm install sharp  →  node scripts/generate-icons.mjs

import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir   = join(__dirname, '..')
const svgPath   = join(rootDir, 'public', 'icon.svg')
const outDir    = join(rootDir, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

console.log('🌱 Shamba AI — generating icons...\n')

for (const size of sizes) {
  const outPath = join(outDir, `icon-${size}.png`)
  await sharp(svgPath)
    .resize(size, size)
    .png({ quality: 100 })
    .toFile(outPath)
  console.log(`  ✓ icons/icon-${size}.png`)
}

// Also generate Apple Touch Icon (180x180, no transparency - white bg)
const applePath = join(rootDir, 'public', 'apple-touch-icon.png')
await sharp({
  create: { width: 180, height: 180, channels: 4, background: '#EAF3DE' }
})
  .composite([{
    input: await sharp(svgPath).resize(148, 148).png().toBuffer(),
    gravity: 'center',
  }])
  .png()
  .toFile(applePath)
console.log('  ✓ apple-touch-icon.png')

// Generate favicon.ico equivalent (32x32 PNG — rename to .ico or use as-is)
const faviconPath = join(rootDir, 'public', 'favicon.png')
await sharp(svgPath).resize(32, 32).png().toFile(faviconPath)
console.log('  ✓ favicon.png\n')

console.log('All icons generated successfully!')
console.log('Next step: copy public/favicon.png → public/favicon.ico\n')
