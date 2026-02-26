import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

type CliOptions = {
  dryRun: boolean
  whiteThreshold: number
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
    whiteThreshold: 245,
    border: 4,
  }

  for (const arg of argv) {
    if (arg.startsWith('--white-threshold=')) {
      const value = Number(arg.split('=')[1])
      if (!Number.isFinite(value) || value < 0 || value > 255) {
        throw new Error('white-threshold must be a number between 0 and 255')
      }
      options.whiteThreshold = value
    }

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
 * Make near-white pixels transparent (simple color-key style).
 */
async function makeNearWhiteTransparent(
  inputPath: string,
  threshold: number,
): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  if (channels < 4) {
    throw new Error(`Expected RGBA image for ${path.basename(inputPath)}`)
  }

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const aIndex = i + 3

    const isNearWhite = r >= threshold && g >= threshold && b >= threshold
    if (isNearWhite) {
      data[aIndex] = 0
    }
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels,
    },
  })
    .trim()
    .extend({
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
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
    const output = await makeNearWhiteTransparent(filePath, options.whiteThreshold)
    await fs.writeFile(filePath, output)
    console.log(`Processed: ${path.basename(filePath)}`)
  }

  console.log('\nDone. Originals are safe in backup folder above.')
}

run().catch((error) => {
  console.error('Logo processing failed:', error)
  process.exit(1)
})
