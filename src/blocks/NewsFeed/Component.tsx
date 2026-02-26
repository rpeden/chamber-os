import React from 'react'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import { BlockWrapper } from '@/components/BlockWrapper'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'

import type { NewsFeedBlock as NewsFeedBlockProps, Post, Category } from '@/payload-types'

/**
 * News Feed block — a dynamic server component that queries the Posts
 * collection and renders cards with featured images, category badges, and titles.
 *
 * Supports optional category filtering. Staff picks which categories to show;
 * leave empty for an unfiltered feed.
 */
export const NewsFeedBlock: React.FC<NewsFeedBlockProps> = async ({
  sectionHeading,
  introText,
  maxItems,
  categoryFilter,
  enableViewAllLink,
  viewAllLink,
  background,
}) => {
  const payload = await getPayload({ config: configPromise })
  const limit = maxItems ?? 3

  // Build where clause
  const whereConditions: Where[] = [{ _status: { equals: 'published' } }]

  // Category filter — only if categories are selected
  if (categoryFilter && Array.isArray(categoryFilter) && categoryFilter.length > 0) {
    const categoryIds = categoryFilter.map((cat) =>
      typeof cat === 'object' && cat !== null ? cat.id : cat,
    )
    whereConditions.push({ categories: { in: categoryIds } })
  }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-publishedAt',
    where: { and: whereConditions },
  })

  if (posts.docs.length === 0) {
    return null
  }

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-4">{sectionHeading}</h2>}
      {introText && <p className="text-lg text-muted-foreground mb-10 max-w-2xl">{introText}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.docs.map((post: Post) => {
          const hasImage = post.heroImage && typeof post.heroImage === 'object'
          const categories = (post.categories ?? []).filter(
            (cat): cat is Category => typeof cat === 'object' && cat !== null,
          )

          return (
            <article
              key={post.id}
              className="group relative rounded-lg overflow-hidden border border-border bg-card flex flex-col"
            >
              {/* Featured image with category badge overlay */}
              <div className="relative aspect-[16/10] bg-muted">
                {hasImage && (
                  <Media
                    resource={post.heroImage as NonNullable<typeof post.heroImage>}
                    imgClassName="w-full h-full object-cover"
                  />
                )}
                {/* Category badge(s) */}
                {categories.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat.id}
                        className="bg-theme-primary/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded"
                      >
                        {cat.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-xl font-semibold mb-2 leading-tight">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="hover:underline after:absolute after:inset-0"
                  >
                    {post.title}
                  </Link>
                </h3>
                {post.meta?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.meta.description}
                  </p>
                )}
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt}
                    className="text-xs text-muted-foreground mt-auto pt-3"
                  >
                    {new Date(post.publishedAt).toLocaleDateString('en-CA', {
                      dateStyle: 'medium',
                    })}
                  </time>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {enableViewAllLink && viewAllLink && (
        <div className="mt-8 text-center">
          <CMSLink {...viewAllLink} appearance="default" />
        </div>
      )}
    </BlockWrapper>
  )
}
