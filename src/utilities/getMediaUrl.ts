/**
 * Processes media resource URL to ensure proper formatting.
 *
 * Local media (paths starting with `/`) are returned as-is — Next.js
 * serves them from `public/` and the `<Image>` component handles
 * optimization and caching without needing absolute URLs or cache tags.
 *
 * Only truly external URLs (already starting with http/https) are
 * passed through unchanged, with an optional cache-busting tag.
 *
 * @param url The original URL from the resource
 * @param _cacheTag Ignored for local files; appended to external URLs only
 * @returns Properly formatted URL
 */
export const getMediaUrl = (url: string | null | undefined, _cacheTag?: string | null): string => {
  if (!url) return ''

  // External URLs — pass through with optional cache tag
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (_cacheTag) {
      return `${url}?${encodeURIComponent(_cacheTag)}`
    }
    return url
  }

  // Local paths (e.g. /media/image.png) — return as-is, no query string
  // Next.js <Image> handles caching for local files internally
  return url
}
