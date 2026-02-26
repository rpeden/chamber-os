import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Where } from 'payload'
import { getPayload } from 'payload'
import React from 'react'

type Args = {
  searchParams: Promise<{
    category?: string
  }>
}

export const dynamic = 'force-static'
export const revalidate = 600

export default async function NewsPage({ searchParams: searchParamsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const { category: categorySlug } = await searchParamsPromise

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: false,
    sort: 'title',
  })

  const selectedCategory =
    typeof categorySlug === 'string' && categorySlug.length > 0
      ? categories.docs.find((category) => category.slug === categorySlug) || null
      : null

  const where: Where = selectedCategory
    ? {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            categories: {
              in: [selectedCategory.id],
            },
          },
        ],
      }
    : {
        _status: {
          equals: 'published',
        },
      }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 24,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
    sort: '-publishedAt',
    where,
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">News</h1>
        <p className="text-muted-foreground mb-6">Latest updates, announcements, and stories.</p>

        <div className="flex flex-wrap gap-3">
          <Link className="px-4 py-2 rounded-md border border-border" href="/news">
            All
          </Link>
          {categories.docs.map((category) => (
            <Link
              className="px-4 py-2 rounded-md border border-border"
              href={`/news?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
            >
              {category.title}
            </Link>
          ))}
        </div>
      </div>

      <CollectionArchive posts={posts.docs} />

      {posts.docs.length === 0 && (
        <div className="container mt-8">
          <p className="text-muted-foreground">No news posts found for this category yet.</p>
        </div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'News',
    description: 'Chamber and community news updates.',
  }
}
