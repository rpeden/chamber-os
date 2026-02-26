import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Event } from '../../../payload-types'

export const revalidateEvent: CollectionAfterChangeHook<Event> = ({ doc, previousDoc }) => {
  const path = `/events/${doc.slug}`
  revalidatePath('/events')
  revalidatePath(path)

  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/events/${previousDoc.slug}`)
  }

  return doc
}

export const revalidateEventDelete: CollectionAfterDeleteHook<Event> = ({ doc }) => {
  if (doc?.slug) {
    revalidatePath(`/events/${doc.slug}`)
  }

  revalidatePath('/events')
  return doc
}
