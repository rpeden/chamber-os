/**
 * SGBCC image config — reads from seed-content/images-sgbcc/ first,
 * falling back to seed-content/images/ for anything not yet replaced.
 *
 * This means you can gradually swap in SGBCC-specific assets (logo, hero,
 * board headshots, whatever) without touching the SHBCC originals.
 * Just drop a file with the same name into images-sgbcc/ and it wins.
 */

import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'
import type { Media } from '@/payload-types'
import { readLocalImage as readShbccImage } from '../seed/chamber-images'

const SGBCC_IMAGES_DIR = path.resolve(process.cwd(), 'seed-content', 'images-sgbcc')

/**
 * Read an image from the SGBCC directory if it exists, otherwise
 * fall back to the shared SHBCC directory. Simple override semantics.
 */
function readLocalImage(filename: string) {
  const sgbccPath = path.join(SGBCC_IMAGES_DIR, filename)
  if (fs.existsSync(sgbccPath)) {
    const data = fs.readFileSync(sgbccPath)
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
  // Fall back to the SHBCC shared images
  return readShbccImage(filename)
}

/** Mapping of seed image filenames to their alt text descriptions — SGBCC edition. */
export const SEED_IMAGE_MANIFEST = {
  // Hero
  'hero-image.png': 'Sunset over Georgian Bay with Midland harbour in the foreground',

  // Events
  'business_after_bears.png': 'Business professionals networking at the Midland Cultural Centre',
  'lunch_and_learn.png': 'Chamber members at a lunch and learn session',
  'awards-gala.png': 'Annual business awards gala with formal table settings',
  'first-friday-networking.png': 'First Friday networking event at the Georgian Bay Hotel',

  // News / Posts
  'new-board-member.png': 'Sir Honksalot the trumpeter swan at the boardroom table',
  '2026-economic-forecast.png': 'Georgian Bay waterfront at golden hour',
  'hudson-bay-trading-post-hero.png': 'Georgian Bay Outfitters storefront in summer',

  // Testimonials
  'human-testimonial-1.png': 'Portrait of a local business owner',
  'human-testimonial-2.png': 'Portrait of a community business leader',
  'seal-testimonial.png': 'Sir Honksalot the trumpeter swan resting on the dock',

  // Sponsors
  's-logo-1.png': 'Georgian Bay Outfitters',
  's-logo-2.png': 'Huronia Insurance Group',
  's-logo-3.png': 'Bay Marine Services',
  's-logo-4.png': 'Trumpeter Financial Planning',

  // Board members
  'board-president.png': 'Sir Honksalot, Board President',
  'board-vice-president.png': 'Marcus Delacroix, Board Vice President',
  'board-treasurer.png': 'Priya Narayan, Board Treasurer',

  // Chamber branding
  'chamber-logo.png': 'Southern Georgian Bay Chamber of Commerce logo',
} as const

export type SeedImageKey = keyof typeof SEED_IMAGE_MANIFEST

/**
 * Upload all seed images to Payload's media collection and return a map
 * of filename → created Media document.
 *
 * Sequential uploads because SQLite is single-writer — same constraint,
 * different bird, same bullshit.
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
