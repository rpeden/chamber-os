/**
 * Local file upload helpers for the seed script.
 *
 * Instead of fetching images from GitHub like the template did,
 * we read them from the local `seed-content/images/` directory.
 * This keeps the seed self-contained and doesn't require internet access.
 */

import fs from 'fs'
import path from 'path'
import type { File, Payload } from 'payload'
import type { Media } from '@/payload-types'

const SEED_IMAGES_DIR = path.resolve(process.cwd(), 'seed-content', 'images')

/**
 * Read a local image file and return a Payload-compatible File object.
 * The file must exist in seed-content/images/.
 */
export function readLocalImage(filename: string): File {
  const filePath = path.join(SEED_IMAGES_DIR, filename)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed image not found: ${filePath}`)
  }

  const data = fs.readFileSync(filePath)
  const ext = path.extname(filename).slice(1).toLowerCase()

  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    gif: 'image/gif',
  }

  return {
    name: filename,
    data: Buffer.from(data),
    mimetype: mimeMap[ext] || 'image/png',
    size: data.byteLength,
  }
}

/** Mapping of seed image filenames to their alt text descriptions. */
export const SEED_IMAGE_MANIFEST = {
  // Hero
  'hero-image.png': 'Aerial view of the Southern Hudson Bay coastline at sunset',

  // Events
  'business_after_bears.png': 'Business professionals networking at a winter evening event',
  'lunch_and_learn.png': 'Chamber members attending a lunch and learn presentation',
  'awards-gala.png': 'Annual business awards gala with formal table settings',
  'first-friday-networking.png': 'Casual first Friday networking event at a local venue',

  // News / Posts
  'new-board-member.png': 'Natsiq the ringed seal at the boardroom table',
  '2026-economic-forecast.png': 'Polar bear walking down Main Street in dramatic light',
  'hudson-bay-trading-post-hero.png': 'Hudson Bay Trading Post storefront in winter',

  // Testimonials
  'human-testimonial-1.png': 'Portrait of a local business owner',
  'human-testimonial-2.png': 'Portrait of a community business leader',
  'seal-testimonial.png': 'Natsiq the ringed seal resting on the dock',

  // Sponsors
  's-logo-1.png': 'Hudson bay Trading Post',
  's-logo-2.png': 'Arctic Insurance Group',
  's-logo-3.png': 'Polar Express Logistics',
  's-logo-4.png': 'Seal of Approval Accounting',

  // Board members
  'board-president.png': 'Natsiq, Board President',
  'board-vice-president.png': 'Raymond Singh, Board Vice President',
  'board-treasurer.png': 'Robert Jones, Board Treasurer',

  // Chamber branding
  'chamber-logo.png': 'Southern Hudson Bay Chamber of Commerce logo',
} as const

export type SeedImageKey = keyof typeof SEED_IMAGE_MANIFEST

/**
 * Upload all seed images to Payload's media collection and return a map
 * of filename → created Media document.
 *
 * We upload them all in parallel because life is short and these images
 * aren't going to upload themselves.
 *
 * Uploads are sequential because SQLite is single-writer and
 * concurrent media creates with file data cause the file
 * associations to get shuffled. Ask me how I know.
 */
export async function uploadAllSeedImages(payload: Payload) {
  const entries = Object.entries(SEED_IMAGE_MANIFEST) as [SeedImageKey, string][]

  payload.logger.info(`— Uploading ${entries.length} seed images...`)

  const imageMap = {} as Record<SeedImageKey, Media>

  for (const [filename, alt] of entries) {
    const file = readLocalImage(filename)
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      file,
    })
    imageMap[filename] = doc
  }

  payload.logger.info(`— Uploaded ${entries.length} images successfully`)

  return imageMap
}
