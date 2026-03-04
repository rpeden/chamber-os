import { getPayload } from 'payload'
import config from '@payload-config'
import type { NextRequest } from 'next/server'
import { computeDateRange } from '@/lib/orders/date-range'
import type { Period } from '@/lib/orders/date-range'
import type { Event } from '@/payload-types'

/**
 * GET /api/admin/orders-export?period=last30&fiscal=1
 *
 * Streams a CSV file of all orders for the requested period.
 * Requires authentication.
 *
 * CSV columns:
 *   Order ID, Purchaser Name, Email, Event, Ticket Type, Quantity,
 *   Base Amount, Service Fee, Tax, Total, Status, Date
 *
 * Amounts are exported in dollars (converted from minor units).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = (searchParams.get('period') ?? 'last30') as Period
  const fiscalParam = Number(searchParams.get('fiscal') ?? '1')
  const fyMonth = fiscalParam >= 1 && fiscalParam <= 12 ? fiscalParam : 1

  const dateRange = computeDateRange(period, fyMonth)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (dateRange) {
    where['and'] = [
      { createdAt: { greater_than_equal: dateRange.start } },
      { createdAt: { less_than_equal: dateRange.end } },
    ]
  }

  // Fetch all orders for the period (up to 5000 — sufficient for any real chamber)
  const ordersResult = await payload.find({
    collection: 'orders',
    where,
    limit: 5000,
    sort: '-createdAt',
    depth: 1,
    select: {
      purchaserName: true,
      purchaserEmail: true,
      event: true,
      ticketType: true,
      quantity: true,
      totalAmount: true,
      serviceFeeAmount: true,
      taxAmount: true,
      status: true,
      createdAt: true,
    },
  })

  const csv = buildCsv(ordersResult.docs)

  const filename = `orders-${period}-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

type OrderDoc = {
  id: number
  purchaserName: string
  purchaserEmail: string
  event: Event | number | null
  ticketType: string
  quantity: number
  totalAmount?: number | null
  serviceFeeAmount?: number | null
  taxAmount?: number | null
  status: string
  createdAt: string
}

function buildCsv(docs: OrderDoc[]): string {
  const headers = [
    'Order ID',
    'Purchaser Name',
    'Email',
    'Event',
    'Ticket Type',
    'Quantity',
    'Base Amount',
    'Service Fee',
    'Tax',
    'Total',
    'Status',
    'Date',
  ]

  const rows = docs.map((order) => {
    const eventObj = order.event as Event | null | number
    const eventTitle =
      typeof eventObj === 'object' && eventObj ? eventObj.title : `Event #${String(eventObj)}`

    // Convert minor units to dollars
    const total = ((order.totalAmount ?? 0) / 100).toFixed(2)
    const fee = ((order.serviceFeeAmount ?? 0) / 100).toFixed(2)
    const tax = ((order.taxAmount ?? 0) / 100).toFixed(2)
    const base = (((order.totalAmount ?? 0) - (order.serviceFeeAmount ?? 0) - (order.taxAmount ?? 0)) / 100).toFixed(2)

    return [
      order.id,
      csvEscape(order.purchaserName),
      csvEscape(order.purchaserEmail),
      csvEscape(eventTitle),
      csvEscape(order.ticketType),
      order.quantity,
      base,
      fee,
      tax,
      total,
      order.status,
      new Date(order.createdAt).toISOString().slice(0, 10),
    ]
  })

  const lines = [headers.join(','), ...rows.map((r) => r.join(','))]
  return lines.join('\r\n')
}

/** Wraps a value in double-quotes if it contains a comma, quote, or newline. */
function csvEscape(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
