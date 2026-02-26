'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Header, Media } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import {
  SearchIcon,
  Menu,
  X,
  ChevronDown,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

/** Map social platform slugs to Lucide icons */
const socialIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
}

interface SocialLink {
  platform: string
  url: string
  id?: string | null
}

interface HeaderClientProps {
  data: Header
  logo: Media | null
  siteName: string
  socialLinks: SocialLink[]
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  logo,
  siteName,
  socialLinks,
}) => {
  const [theme, setTheme] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)

  // Measure header height and expose it as a CSS variable so the
  // fullBleed hero can pull itself up behind the header without
  // resorting to magic numbers. ResizeObserver handles responsive changes.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        document.documentElement.style.setProperty(
          '--header-height',
          `${entry.contentRect.height}px`,
        )
      }
    })

    observer.observe(el)
    // Set initial value immediately
    document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`)

    return () => observer.disconnect()
  }, [])

  // Reset theme and close mobile menu on route change
  useEffect(() => {
    setHeaderTheme(null)
    setMobileOpen(false)
    setOpenDropdown(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const navItems = data?.navItems || []
  const utilityNav = data?.utilityNav || []

  const toggleDropdown = useCallback((index: number) => {
    setOpenDropdown((prev) => (prev === index ? null : index))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (openDropdown === null) return
    const handler = () => setOpenDropdown(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openDropdown])

  return (
    <header ref={headerRef} className={cn('relative z-20 w-full bg-white')}>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-10">
        {/* ── Desktop: OBOT-style — logo left spanning full height, right side has two rows ── */}
        <div className="hidden min-[1091px]:flex items-stretch">
          {/* Logo — spans full header height, vertically centered */}
          <Link href="/" className="flex items-center shrink-0 pt-6 pb-4 pr-8 md:pl-2.5 min-w-0">
            {logo?.url ? (
              <span className="relative block h-[92px] w-[368px] max-w-[42vw]">
                <NextImage
                  src={getMediaUrl(logo.url)}
                  alt={logo.alt || siteName}
                  fill
                  sizes="(min-width: 1280px) 368px, (min-width: 768px) 34vw, 240px"
                  className="object-contain object-left"
                  priority
                />
              </span>
            ) : (
              <span className="text-xl font-bold text-theme-primary font-theme-heading">
                {siteName}
              </span>
            )}
          </Link>

          {/* Right side — two rows stacked */}
          <div className="flex-1 flex flex-col justify-between pt-5 pb-3">
            {/* Row 1: Utility links + social icons — top-aligned with logo */}
            {(utilityNav.length > 0 || socialLinks.length > 0) && (
              <div className="flex justify-end items-center gap-5">
                <nav className="flex items-center gap-1">
                  {utilityNav.map(({ link }, i) => (
                    <React.Fragment key={i}>
                      <CMSLink
                        {...link}
                        appearance="inline"
                        className="text-foreground/70 hover:text-theme-primary transition-colors text-sm px-2"
                      />
                      {i < utilityNav.length - 1 && <span className="text-border">|</span>}
                    </React.Fragment>
                  ))}
                </nav>
                {socialLinks.length > 0 && (
                  <div className="flex gap-3">
                    {socialLinks.map((social, i) => {
                      const Icon = socialIcons[social.platform]
                      return Icon ? (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/60 hover:text-theme-primary transition-colors"
                          aria-label={social.platform}
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Row 2: Main navigation — bottom-aligned */}
            <nav className="flex items-center justify-end gap-1">
              {navItems.map((item, i) => {
                const hasChildren = item.children && item.children.length > 0

                return (
                  <div
                    key={i}
                    className="relative"
                    onClick={(e) => {
                      if (hasChildren) {
                        e.stopPropagation()
                        toggleDropdown(i)
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'flex items-center rounded-md transition-colors hover:bg-muted',
                        hasChildren && 'cursor-pointer',
                      )}
                    >
                      <CMSLink
                        {...item.link}
                        appearance="inline"
                        className={cn(
                          'px-3 py-2 text-sm font-medium text-foreground hover:text-theme-primary transition-colors',
                          hasChildren && 'pr-1',
                        )}
                      />
                      {hasChildren && (
                        <button
                          className="pr-2 py-2"
                          aria-label={`Open ${item.link?.label} submenu`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleDropdown(i)
                          }}
                        >
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 transition-transform',
                              openDropdown === i && 'rotate-180',
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {hasChildren && openDropdown === i && (
                      <div className="absolute top-full left-0 mt-1 min-w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                        {item.children!.map((child, j) => (
                          <CMSLink
                            key={j}
                            {...child.link}
                            appearance="inline"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-theme-primary transition-colors"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              <Link
                href="/search"
                className="ml-2 p-2 text-muted-foreground hover:text-theme-primary transition-colors"
              >
                <span className="sr-only">Search</span>
                <SearchIcon className="w-5 h-5" />
              </Link>
            </nav>
          </div>
        </div>

        {/* ── Mobile: simple logo + hamburger row ── */}
        <div className="flex min-[1091px]:hidden justify-between items-center py-3">
          <Link href="/" className="flex items-center shrink-0 min-w-0">
            {logo?.url ? (
              <span className="relative block h-14 w-[220px] max-w-[70vw]">
                <NextImage
                  src={getMediaUrl(logo.url)}
                  alt={logo.alt || siteName}
                  fill
                  sizes="220px"
                  className="object-contain object-left"
                  priority
                />
              </span>
            ) : (
              <span className="text-xl font-bold text-theme-primary font-theme-heading">
                {siteName}
              </span>
            )}
          </Link>
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="min-[1091px]:hidden border-t border-border bg-background">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-10 py-4 space-y-1">
            {navItems.map((item, i) => {
              const hasChildren = item.children && item.children.length > 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <CMSLink
                      {...item.link}
                      appearance="inline"
                      className="block py-2 text-foreground font-medium"
                    />
                    {hasChildren && (
                      <button
                        className="p-2"
                        onClick={() => toggleDropdown(openDropdown === i ? -1 : i)}
                        aria-label={`Toggle ${item.link?.label} submenu`}
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            openDropdown === i && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {hasChildren && openDropdown === i && (
                    <div className="pl-4 space-y-1">
                      {item.children!.map((child, j) => (
                        <CMSLink
                          key={j}
                          {...child.link}
                          appearance="inline"
                          className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Mobile utility links */}
            {utilityNav.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border space-y-1">
                {utilityNav.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    appearance="inline"
                    className="block py-2 text-sm text-muted-foreground"
                  />
                ))}
              </div>
            )}

            <Link href="/search" className="flex items-center gap-2 py-2 text-muted-foreground">
              <SearchIcon className="w-4 h-4" />
              <span>Search</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
