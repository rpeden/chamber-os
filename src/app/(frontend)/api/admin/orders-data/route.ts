import { getPayload } from 'payload'
import config from '@payload-config'
import type { NextRequest } from 'next/server'
import { computeDateRange } from '@/lib/orders/date-range'
import type { Period } from '@/lib/orders/date-range'
import type { Event } from '@/payload-types'

export type OrderDataRow = {
  id: number
  purchaserName: string
  purchaserEmail: string
  eventTitle: string
  eventId: number
  ticketType: string
  quantity: number
  totalAmount: number
  serviceFeeAmount: number
  taxAmount: number
  status: 'pending' | 'confirmed' | 'refunded'
  createdAt: string
}

export type RevenueStats = {
  confirmedGross: number
  refundedTotal: number
  netRevenue: number
  orderCount: number
  refundedCount: number
  pendingCount: number
}

export type OrdersDataResponse = {
  orders: OrderDataRow[]
  stats: RevenueStats
  fiscalYearStartMonth: number
}

/**
 * GET /api/admin/orders-data?period=last30
 *
 * Returns orders and revenue stats for the requested period.
 * Requires authentication.
 *
 * Query params:
 *   period: Period (default: last30)
 *   fiscal: fiscal year start month 1–12 (used only for thisFiscal/lastFiscal)
 */
export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = (searchParams.get('period') ?? 'last30') as Period
  const fiscalParam = Number(searchParams.get('fiscal') ?? '1')
  const fiscalYearStartMonth = fiscalParam >= 1 && fiscalParam <= 12 ? fiscalParam : 1

  // Read fiscal year from SiteSettings (canonical source)
  const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const fyMonth = Number(siteSettings.fiscalYearStartMonth ?? '1')

  const dateRange = computeDateRange(period, fyMonth)

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (dateRange) {
    where['and'] = [
      { createdAt: { greater_than_equal: dateRange.start } },
      { createdAt: { less_than_equal: dateRange.end } },
    ]
  }

  const ordersResult = await payload.find({
    collection: 'orders',
    where,
    limit: 500,
    sort: '-createdAt',
    depth: 1, // populate event for title
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

  // Build stats
  const stats: RevenueStats = {
    confirmedGross: 0,
    refundedTotal: 0,
    netRevenue: 0,
    orderCount: 0,
    refundedCount: 0,
    pendingCount: 0,
  }

  const orders: OrderDataRow[] = ordersResult.docs.map((order) => {
    const eventObj = order.event as Event | null | number
    const eventTitle = typeof eventObj === 'object' && eventObj ? eventObj.title : `Event #${String(order.event)}`
    const eventId =
      typeof eventObj === 'object' && eventObj ? eventObj.id : (order.event as number)

    if (order.status === 'confirmed') {
      stats.confirmedGross += order.totalAmount ?? 0
      stats.orderCount++
    } else if (order.status === 'refunded') {
      stats.refundedTotal += order.totalAmount ?? 0
      stats.refundedCount++
    } else if (order.status === 'pending') {
      stats.pendingCount++
    }

    return {
      id: order.id,
      purchaserName: order.purchaserName,
      purchaserEmail: order.purchaserEmail,
      eventTitle,
      eventId,
      ticketType: order.ticketType,
      quantity: order.quantity,
      totalAmount: order.totalAmount ?? 0,
      serviceFeeAmount: order.serviceFeeAmount ?? 0,
      taxAmount: order.taxAmount ?? 0,
      status: order.status as OrderDataRow['status'],
      createdAt: order.createdAt,
    }
  })

  stats.netRevenue = stats.confirmedGross - stats.refundedTotal

  const response: OrdersDataResponse = {
    orders,
    stats,
    fiscalYearStartMonth: fyMonth,
  }

  return Response.json(response)
}
