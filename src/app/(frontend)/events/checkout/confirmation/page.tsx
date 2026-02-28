import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import QRCode from 'qrcode'
import Link from 'next/link'

type Args = {
  searchParams: Promise<{
    payment_intent?: string
    payment_intent_client_secret?: string
    redirect_status?: string
    token?: string
  }>
}

/**
 * Format minor units (cents) to display dollars.
 */
function formatPrice(minorUnits: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(minorUnits / 100)
}

export default async function ConfirmationPage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = await searchParamsPromise
  const qrTokenParam = searchParams.token
  const paymentIntentId = searchParams.payment_intent
  const redirectStatus = searchParams.redirect_status

  // ─── Free registration path: ?token=<qrToken> ────────────────────────────
  if (qrTokenParam) {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'orders',
      where: { qrToken: { equals: qrTokenParam } },
      depth: 1,
      limit: 1,
    })

    const order = result.docs[0]

    if (!order) {
      return (
        <main className="container pt-24 pb-16">
          <h1 className="text-3xl font-bold mb-4">Registration Not Found</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find your registration. Please check your confirmation email or contact
            us for assistance.
          </p>
        </main>
      )
    }

    let qrDataUrl: string | null = null
    try {
      qrDataUrl = await QRCode.toDataURL(order.qrToken!, {
        width: 250,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    } catch {
      // non-fatal
    }

    const event = order.event && typeof order.event === 'object' ? order.event : null

    return (
      <main className="container pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Registration Confirmed!</h1>
            <p className="text-muted-foreground">
              Your spot is reserved. A confirmation email has been sent to{' '}
              <strong>{order.purchaserEmail}</strong>.
            </p>
          </div>

          {qrDataUrl && (
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Registration QR code for event entry"
                  width={250}
                  height={250}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Show this QR code at the event for entry
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Registration Details</h2>
            <dl className="space-y-3">
              {event && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Event</dt>
                  <dd className="font-medium">{event.title}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ticket</dt>
                <dd className="font-medium">{order.ticketType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="font-medium">{order.quantity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{order.purchaserName}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Browse More Events
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ─── Paid path: ?payment_intent=<pi_id> ──────────────────────────────────

  if (!paymentIntentId) {
    return (
      <main className="container pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-4">Order Confirmation</h1>
        <p className="text-muted-foreground">
          No payment information found. If you just completed a purchase, please check your email
          for confirmation.
        </p>
      </main>
    )
  }

  if (redirectStatus === 'failed') {
    return (
      <main className="container pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
        <p className="text-muted-foreground mb-4">
          Your payment could not be processed. Please try again or contact us for assistance.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium"
        >
          Back to Events
        </Link>
      </main>
    )
  }

  const payload = await getPayload({ config: configPromise })

  // Look up the order by Stripe Payment Intent ID
  const result = await payload.find({
    collection: 'orders',
    where: {
      stripePaymentIntentId: { equals: paymentIntentId },
    },
    depth: 1, // Populate event relationship
    limit: 1,
  })

  const order = result.docs[0]

  // Read tax name for display (stored amount on order, name from settings)
  const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
  const confirmedTaxName = ((siteSettings as Record<string, unknown>).taxName as string) || 'Tax'

  if (!order) {
    return (
      <main className="container pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-4">Processing Your Order</h1>
        <p className="text-muted-foreground mb-4">
          Your payment is being processed. This page will have your ticket details shortly.
          Please check your email for confirmation.
        </p>
        <p className="text-sm text-muted-foreground">
          Payment reference: {paymentIntentId}
        </p>
      </main>
    )
  }

  // Generate QR code as data URL if the order is confirmed and has a token
  let qrDataUrl: string | null = null
  if (order.qrToken) {
    try {
      qrDataUrl = await QRCode.toDataURL(order.qrToken, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    } catch {
      // QR generation failure is non-fatal
    }
  }

  const event =
    order.event && typeof order.event === 'object' ? order.event : null

  return (
    <main className="container pt-24 pb-16">
      <div className="max-w-2xl mx-auto">
        {order.status === 'confirmed' ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            <h1 className="text-3xl font-bold mb-2">Purchase Confirmed!</h1>
              <p className="text-muted-foreground">
                Your tickets are ready. A confirmation email has been sent to{' '}
                <strong>{order.purchaserEmail}</strong>.
              </p>
            </div>

            {qrDataUrl && (
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR code for event entry"
                    width={250}
                    height={250}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Show this QR code at the event for entry
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Order Received</h1>
            <p className="text-muted-foreground">
              Your payment is being processed. You&apos;ll receive a confirmation email at{' '}
              <strong>{order.purchaserEmail}</strong> once complete.
            </p>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <dl className="space-y-3">
            {event && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Event</dt>
                <dd className="font-medium">{event.title}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ticket</dt>
              <dd className="font-medium">{order.ticketType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Quantity</dt>
              <dd className="font-medium">{order.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Purchaser</dt>
              <dd className="font-medium">{order.purchaserName}</dd>
            </div>
            {typeof order.serviceFeeAmount === 'number' && order.serviceFeeAmount > 0 && (
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd>{formatPrice(order.serviceFeeAmount)}</dd>
              </div>
            )}
            {typeof (order as Record<string, unknown>).taxAmount === 'number' &&
              ((order as Record<string, unknown>).taxAmount as number) > 0 && (
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{confirmedTaxName}</dt>
                <dd>{formatPrice((order as Record<string, unknown>).taxAmount as number)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-semibold">Total Paid</dt>
              <dd className="font-semibold">
                {typeof order.totalAmount === 'number'
                  ? formatPrice(order.totalAmount)
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/events"
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Order Confirmation | Events',
  description: 'Your event ticket purchase confirmation and QR code.',
  robots: {
    index: false,
    follow: false,
  },
}
