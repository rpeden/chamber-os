import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

type CliOptions = {
  dryRun: boolean
  border: number
}

const IMAGES_DIR = path.resolve(process.cwd(), 'seed-content/images')
const BACKUP_ROOT = path.resolve(process.cwd(), 'seed-content/images/_logo-backups')
const FILE_PATTERN = /^s-logo-.*\.png$/i

/**
 * Parse command line flags.
 */
function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: argv.includes('--dry-run'),
    border: 4,
  }

  for (const arg of argv) {
    if (arg.startsWith('--border=')) {
      const value = Number(arg.split('=')[1])
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error('border must be a number between 0 and 100')
      }
      options.border = value
    }
  }

  return options
}

/**
 * Return only sponsor logo seed images, never any other assets.
 */
async function getSponsorLogoFiles(): Promise<string[]> {
  const entries = await fs.readdir(IMAGES_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && FILE_PATTERN.test(entry.name))
    .map((entry) => path.join(IMAGES_DIR, entry.name))
    .sort()
}

/**
 * Build an initial foreground mask from color information.
 *
 * AI logo exports with fake checkerboard/noise backgrounds tend to have:
 * - foreground: higher chroma and/or strong color channels
 * - background: low-chroma gray speckle
 */
function buildForegroundMask(
  data: Uint8Array,
  width: number,
  height: number,
  channels: 4,
): Uint8Array {
  const mask = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const chroma = max - min
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

      const saturatedColor = chroma >= 22 && luma >= 18 && luma <= 245
      const redDominant = r - Math.max(g, b) >= 26 && luma >= 18 && luma <= 245
      const blueDominant = b - Math.max(r, g) >= 20 && luma >= 18 && luma <= 245
      const goldLike = r >= 95 && g >= 70 && b <= 110 && chroma >= 15

      if (saturatedColor || redDominant || blueDominant || goldLike) {
        mask[y * width + x] = 1
      }
    }
  }

  return mask
}

type ComponentStats = {
  area: number
  touchesBorder: boolean
  pixels: number[]
}

/**
 * Remove tiny and border-attached speckles from the foreground mask.
 */
function denoiseMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const visited = new Uint8Array(mask.length)
  const cleaned = new Uint8Array(mask.length)

  const minArea = Math.max(80, Math.floor(width * height * 0.00018))
  const neighborOffsets = [-1, 1, -width, width]

  for (let idx = 0; idx < mask.length; idx++) {
    if (!mask[idx] || visited[idx]) continue

    const queue: number[] = [idx]
    visited[idx] = 1
    const component: ComponentStats = {
      area: 0,
      touchesBorder: false,
      pixels: [],
    }

    while (queue.length > 0) {
      const current = queue.pop()!
      component.area++
      component.pixels.push(current)

      const x = current % width
      const y = Math.floor(current / width)

      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        component.touchesBorder = true
      }

      for (const offset of neighborOffsets) {
        const next = current + offset
        if (next < 0 || next >= mask.length) continue

        const nx = next % width
        const ny = Math.floor(next / width)

        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue
        if (!mask[next] || visited[next]) continue

        visited[next] = 1
        queue.push(next)
      }
    }

    const keep =
      component.area >= minArea && !(component.touchesBorder && component.area < minArea * 10)
    if (!keep) continue

    for (const pixelIndex of component.pixels) {
      cleaned[pixelIndex] = 1
    }
  }

  return cleaned
}

/**
 * Apply a binary mask to alpha, then trim and pad.
 */
async function renderFromMask(
  data: Uint8Array,
  width: number,
  height: number,
  channels: 4,
  mask: Uint8Array,
  border: number,
): Promise<Buffer> {
  for (let idx = 0; idx < mask.length; idx++) {
    const alphaIndex = idx * channels + 3
    data[alphaIndex] = mask[idx] ? 255 : 0
  }

  return sharp(data, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .trim()
    .extend({
      top: border,
      right: border,
      bottom: border,
      left: border,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

/**
 * Generic sponsor logo foreground extraction.
 */
async function extractGenericLogoForeground(inputPath: string, border: number): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = 4 as const
  const { width, height } = info

  if (info.channels < 4) {
    throw new Error(`Expected RGBA image for ${path.basename(inputPath)}`)
  }

  const initialMask = buildForegroundMask(data, width, height, channels)
  const cleanedMask = denoiseMask(initialMask, width, height)

  return renderFromMask(data, width, height, channels, cleanedMask, border)
}

/**
 * Extract foreground from noisy AI-generated logo image by keeping high-chroma pixels,
 * then force-remove the bottom-right watermark area.
 */
async function extractSLogo1Foreground(inputPath: string, border: number): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = 4 as const
  const { width, height } = info

  if (info.channels < 4) {
    throw new Error(`Expected RGBA image for ${path.basename(inputPath)}`)
  }

  const rightWatermarkStartX = Math.floor(width * 0.84)
  const bottomWatermarkStartY = Math.floor(height * 0.84)

  const mask = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const chroma = max - min
      const value = max / 255

      const keepForeground = chroma >= 24 && value >= 0.1 && value <= 0.95
      if (keepForeground) {
        mask[y * width + x] = 1
      }

      // Nuke the bottom-right watermark/star region explicitly.
      if (x >= rightWatermarkStartX && y >= bottomWatermarkStartY) {
        mask[y * width + x] = 0
      }
    }
  }

  const cleanedMask = denoiseMask(mask, width, height)
  return renderFromMask(data, width, height, channels, cleanedMask, border)
}

/**
 * Backup originals before any destructive writes.
 */
async function backupFiles(files: string[]): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(BACKUP_ROOT, stamp)
  await fs.mkdir(backupDir, { recursive: true })

  await Promise.all(
    files.map(async (filePath) => {
      const destination = path.join(backupDir, path.basename(filePath))
      await fs.copyFile(filePath, destination)
    }),
  )

  const manifest = {
    createdAt: new Date().toISOString(),
    sourceDir: IMAGES_DIR,
    files: files.map((filePath) => path.basename(filePath)),
  }

  await fs.writeFile(
    path.join(backupDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  return backupDir
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const files = await getSponsorLogoFiles()

  if (files.length === 0) {
    console.log('No sponsor logo files found (expected seed-content/images/s-logo-*.png).')
    return
  }

  console.log(`Found ${files.length} sponsor logo files:`)
  files.forEach((filePath) => console.log(`  - ${path.basename(filePath)}`))

  if (options.dryRun) {
    console.log('\nDry run: no files changed, no backup created.')
    return
  }

  const backupDir = await backupFiles(files)
  console.log(`\nBackup created: ${backupDir}`)

  for (const filePath of files) {
    const fileName = path.basename(filePath)
    const output =
      fileName.toLowerCase() === 's-logo-1.png'
        ? await extractSLogo1Foreground(filePath, options.border)
        : await extractGenericLogoForeground(filePath, options.border)

    await fs.writeFile(filePath, output)
    console.log(`Processed: ${fileName}`)
  }

  console.log('\nDone. Originals are safe in backup folder above.')
}

run().catch((error) => {
  console.error('Logo processing failed:', error)
  process.exit(1)
})
