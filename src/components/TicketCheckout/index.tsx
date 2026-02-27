'use client'

import React, { useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

/**
 * Ticket type as rendered on the event detail page.
 * Matches the Event.ticketTypes array shape from Payload.
 */
interface TicketType {
  id?: string | null
  name: string
  description?: string | null
  /** Price in minor units (cents) */
  price: number
  capacity: number
  saleStart?: string | null
  saleEnd?: string | null
}

interface ServiceFee {
  feeType: 'none' | 'flat' | 'percentage'
  feeAmount?: number | null
}

interface TicketCheckoutProps {
  eventId: number
  eventTitle: string
  ticketTypes: TicketType[]
  serviceFee?: ServiceFee | null
  stripePublishableKey: string
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

/**
 * Calculate the service fee for display purposes (client-side preview).
 * Mirrors the server-side calculateServiceFee logic.
 */
function previewServiceFee(baseAmount: number, fee?: ServiceFee | null): number {
  if (!fee || fee.feeType === 'none') return 0
  const amount = fee.feeAmount ?? 0
  if (fee.feeType === 'percentage') return Math.floor(baseAmount * (amount / 100))
  if (fee.feeType === 'flat') return amount
  return 0
}

// ─── Phase 1: Ticket Selection ────────────────────────────────────────────

interface TicketSelectorProps {
  ticketTypes: TicketType[]
  serviceFee?: ServiceFee | null
  onCheckout: (ticketType: string, quantity: number) => void
  loading: boolean
}

function TicketSelector({ ticketTypes, serviceFee, onCheckout, loading }: TicketSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>(ticketTypes[0]?.name ?? '')
  const [quantity, setQuantity] = useState(1)

  const selectedTicket = ticketTypes.find((t) => t.name === selectedType)
  const baseAmount = (selectedTicket?.price ?? 0) * quantity
  const feeAmount = previewServiceFee(baseAmount, serviceFee)
  const totalAmount = baseAmount + feeAmount

  const now = new Date()
  const isOnSale = (ticket: TicketType) => {
    if (ticket.saleStart && new Date(ticket.saleStart) > now) return false
    if (ticket.saleEnd && new Date(ticket.saleEnd) < now) return false
    return true
  }

  return (
    <div className="ticket-selector">
      <h3 className="text-xl font-semibold mb-4">Tickets</h3>

      {/* Ticket type selection */}
      <div className="space-y-3 mb-6">
        {ticketTypes.map((ticket) => {
          const onSale = isOnSale(ticket)
          return (
            <label
              key={ticket.name}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedType === ticket.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${!onSale ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ticketType"
                  value={ticket.name}
                  checked={selectedType === ticket.name}
                  onChange={() => onSale && setSelectedType(ticket.name)}
                  disabled={!onSale}
                  className="accent-primary"
                />
                <div>
                  <div className="font-medium">{ticket.name}</div>
                  {ticket.description && (
                    <div className="text-sm text-muted-foreground">{ticket.description}</div>
                  )}
                  {!onSale && (
                    <div className="text-xs text-destructive mt-1">
                      {ticket.saleStart && new Date(ticket.saleStart) > now
                        ? `On sale ${new Date(ticket.saleStart).toLocaleDateString()}`
                        : 'Sales ended'}
                    </div>
                  )}
                </div>
              </div>
              <div className="font-semibold">{formatPrice(ticket.price)}</div>
            </label>
          )
        })}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-4 mb-6">
        <label htmlFor="ticket-quantity" className="font-medium">
          Quantity
        </label>
        <select
          id="ticket-quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-2"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Price breakdown */}
      <div className="border-t border-border pt-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            {selectedTicket?.name} × {quantity}
          </span>
          <span>{formatPrice(baseAmount)}</span>
        </div>
        {feeAmount > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Service fee</span>
            <span>{formatPrice(feeAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
          <span>Total</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onCheckout(selectedType, quantity)}
        disabled={loading || !selectedTicket || !isOnSale(selectedTicket)}
        className="w-full rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  )
}

// ─── Phase 2: Payment Form (Stripe Elements) ─────────────────────────────

interface PaymentFormInnerProps {
  onSuccess: () => void
  onError: (message: string) => void
  totalAmount: number
}

function PaymentFormInner({ onSuccess, onError, totalAmount }: PaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/events/checkout/confirmation`,
      },
    })

    // If we reach here, there was an error (successful payments redirect)
    if (error) {
      onError(error.message ?? 'Payment failed')
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 p-3 rounded-md bg-muted text-sm">
        Total: <strong>{formatPrice(totalAmount)}</strong>
      </div>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full mt-6 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? 'Processing payment...' : `Pay ${formatPrice(totalAmount)}`}
      </button>
    </form>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

type CheckoutPhase = 'select' | 'payment' | 'error'

export function TicketCheckout({
  eventId,
  eventTitle,
  ticketTypes,
  serviceFee,
  stripePublishableKey,
}: TicketCheckoutProps) {
  const [phase, setPhase] = useState<CheckoutPhase>('select')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [purchaserName, setPurchaserName] = useState('')
  const [purchaserEmail, setPurchaserEmail] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedTicketType, setSelectedTicketType] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const handleCheckout = useCallback(
    (ticketType: string, quantity: number) => {
      setSelectedTicketType(ticketType)
      setSelectedQuantity(quantity)
      setShowContactForm(true)
    },
    [],
  )

  const handleContactSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            ticketType: selectedTicketType,
            quantity: selectedQuantity,
            purchaserName,
            purchaserEmail,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Checkout failed')
          setLoading(false)
          return
        }

        setClientSecret(data.clientSecret)
        setTotalAmount(data.totalAmount)
        setPhase('payment')
      } catch {
        setError('Network error — please try again')
      } finally {
        setLoading(false)
      }
    },
    [eventId, selectedTicketType, selectedQuantity, purchaserName, purchaserEmail],
  )

  const stripePromise = React.useMemo(
    () => loadStripe(stripePublishableKey),
    [stripePublishableKey],
  )

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6">
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {phase === 'select' && !showContactForm && (
        <TicketSelector
          ticketTypes={ticketTypes}
          serviceFee={serviceFee}
          onCheckout={handleCheckout}
          loading={loading}
        />
      )}

      {phase === 'select' && showContactForm && (
        <div>
          <button
            type="button"
            onClick={() => setShowContactForm(false)}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back to tickets
          </button>
          <h3 className="text-xl font-semibold mb-4">Your Information</h3>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label htmlFor="purchaser-name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="purchaser-name"
                type="text"
                required
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label htmlFor="purchaser-email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="purchaser-email"
                type="email"
                required
                value={purchaserEmail}
                onChange={(e) => setPurchaserEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="jane@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !purchaserName || !purchaserEmail}
              className="w-full rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Setting up payment...' : 'Continue to Payment'}
            </button>
          </form>
        </div>
      )}

      {phase === 'payment' && clientSecret && (
        <div>
          <button
            type="button"
            onClick={() => {
              setPhase('select')
              setShowContactForm(true)
              setClientSecret(null)
            }}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h3 className="text-xl font-semibold mb-4">Payment</h3>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(var(--primary))',
                },
              },
            }}
          >
            <PaymentFormInner
              totalAmount={totalAmount}
              onSuccess={() => {
                // Stripe redirects on success — this is a fallback
                window.location.href = '/events/checkout/confirmation'
              }}
              onError={(msg) => setError(msg)}
            />
          </Elements>
        </div>
      )}
    </div>
  )
}
