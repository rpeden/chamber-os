import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { generateThemeCSS, DEFAULT_THEME } from '@/lib/theme'
import type { ThemeSettings } from '@/lib/theme'

/**
 * Fetches site-settings from the database with caching.
 *
 * Uses Next.js unstable_cache with a 'site-settings' tag so we can
 * bust the cache on save via revalidateTag('site-settings') in the
 * SiteSettings afterChange hook.
 */
const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'site-settings',
    })
    return settings
  },
  ['site-settings'],
  {
    tags: ['site-settings'],
  },
)

/**
 * Server Component that injects theme CSS custom properties into the page.
 *
 * Reads from the `site-settings` global (cached, busted on save) and
 * outputs a <style> tag. Falls back to DEFAULT_THEME if settings
 * haven't been configured yet.
 *
 * Usage: Place in the <head> of the root layout.
 */
export async function ThemeStyleTag() {
  let theme: ThemeSettings = DEFAULT_THEME

  try {
    const settings = await getSiteSettings()

    if (settings) {
      theme = {
        primaryColor: (settings.primaryColor as string) || DEFAULT_THEME.primaryColor,
        secondaryColor: (settings.secondaryColor as string) || DEFAULT_THEME.secondaryColor,
        accentColor: (settings.accentColor as string) || DEFAULT_THEME.accentColor,
        headingFont: (settings.headingFont as string) || DEFAULT_THEME.headingFont,
        bodyFont: (settings.bodyFont as string) || DEFAULT_THEME.bodyFont,
      }
    }
  } catch {
    // If site-settings doesn't exist yet (fresh install), use defaults
  }

  const css = generateThemeCSS(theme)

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
