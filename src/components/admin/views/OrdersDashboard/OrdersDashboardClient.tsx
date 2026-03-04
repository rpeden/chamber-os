'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PERIOD_LABELS } from '@/lib/orders/date-range'
import type { Period } from '@/lib/orders/date-range'
import type { OrderDataRow, RevenueStats } from '@/app/(frontend)/api/admin/orders-data/route'

import './index.scss'

// ── Re-export from API route for CRMSearch to use ─────────────────────────
export type { OrderDataRow, RevenueStats }

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  fiscalYearStartMonth: number
  taxName: string
}

const PERIOD_OPTIONS = Object.entries(PERIOD_LABELS) as [Period, string][]

const STATUS_LABELS: Record<OrderDataRow['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  refunded: 'Refunded',
}

/**
 * Orders Dashboard client component.
 *
 * Manages period selection and fetches order data + revenue stats from
 * /api/admin/orders-data. Exports CSV via /api/admin/orders-export.
 */
export function OrdersDashboardClient({ fiscalYearStartMonth, taxName }: Props) {
  const [period, setPeriod] = useState<Period>('last30')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orders, setOrders] = useState<OrderDataRow[]>([])
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (p: Period) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ period: p, fiscal: String(fiscalYearStartMonth) })
      const res = await fetch(`/api/admin/orders-data?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = (await res.json()) as { orders: OrderDataRow[]; stats: RevenueStats }
      setOrders(data.orders)
      setStats(data.stats)
    } catch (err) {
      setError(`Failed to load order data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [fiscalYearStartMonth])

  useEffect(() => {
    void fetchData(period)
  }, [period, fetchData])

  const filteredOrders =
    statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  const handleExport = () => {
    const params = new URLSearchParams({ period, fiscal: String(fiscalYearStartMonth) })
    window.location.href = `/api/admin/orders-export?${params.toString()}`
  }

  const formatCurrency = (minorUnits: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(
      minorUnits / 100,
    )
  }

  return (
    <div className="orders-dashboard">
      {/* ── Header ── */}
      <div className="orders-dashboard__header">
        <div>
          <h1 className="orders-dashboard__title">Orders Dashboard</h1>
          <p className="orders-dashboard__subtitle">Revenue and ticket sales summary</p>
        </div>
        <div className="orders-dashboard__header-actions">
          <button
            className="btn btn--style-secondary btn--size-medium"
            disabled={isLoading || orders.length === 0}
            onClick={handleExport}
            type="button"
          >
            Export CSV
          </button>
          <Link
            className="btn btn--style-secondary btn--size-medium"
            href="/admin/collections/orders"
          >
            View All Orders
          </Link>
        </div>
      </div>

      {/* ── Period selector ── */}
      <div className="orders-dashboard__period-bar">
        <span className="orders-dashboard__period-label">Period:</span>
        <div className="orders-dashboard__period-tabs">
          {PERIOD_OPTIONS.map(([key, label]) => (
            <button
              className={[
                'orders-dashboard__period-tab',
                period === key ? 'orders-dashboard__period-tab--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={key}
              onClick={() => setPeriod(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Revenue cards ── */}
      {isLoading ? (
        <div className="orders-dashboard__loading">Loading…</div>
      ) : error ? (
        <div className="orders-dashboard__error">{error}</div>
      ) : stats ? (
        <>
          <div className="orders-dashboard__stats">
            <RevenueCard
              label="Confirmed Revenue"
              value={formatCurrency(stats.confirmedGross)}
              sub={`${stats.orderCount} order${stats.orderCount !== 1 ? 's' : ''}`}
              variant="positive"
            />
            <RevenueCard
              label="Refunded"
              value={formatCurrency(stats.refundedTotal)}
              sub={`${stats.refundedCount} refund${stats.refundedCount !== 1 ? 's' : ''}`}
              variant={stats.refundedCount > 0 ? 'negative' : undefined}
            />
            <RevenueCard
              label="Net Revenue"
              value={formatCurrency(stats.netRevenue)}
              sub="confirmed minus refunded"
              variant="net"
            />
            {stats.pendingCount > 0 && (
              <RevenueCard
                label="Pending"
                value={String(stats.pendingCount)}
                sub="awaiting payment"
              />
            )}
          </div>

          {/* ── Order table ── */}
          <div className="orders-dashboard__table-section">
            <div className="orders-dashboard__table-toolbar">
              <span className="orders-dashboard__table-count">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' && ` · filtered by ${statusFilter}`}
              </span>
              <select
                aria-label="Filter by status"
                className="orders-dashboard__select"
                onChange={(e) => setStatusFilter(e.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="orders-dashboard__empty">No orders for this period.</div>
            ) : (
              <div className="orders-dashboard__table-wrap">
                <table className="orders-dashboard__table">
                  <thead>
                    <tr>
                      <th>Purchaser</th>
                      <th>Event</th>
                      <th>Ticket</th>
                      <th>Qty</th>
                      <th>Base</th>
                      <th>Fee</th>
                      <th>{taxName}</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={
                          order.status === 'refunded' ? 'orders-dashboard__row--refunded' : ''
                        }
                      >
                        <td className="orders-dashboard__cell--purchaser">
                          <span className="orders-dashboard__name">{order.purchaserName}</span>
                          <span className="orders-dashboard__email">{order.purchaserEmail}</span>
                        </td>
                        <td className="orders-dashboard__cell--event">
                          <Link href={`/admin/collections/events/${order.eventId}`}>
                            {order.eventTitle}
                          </Link>
                        </td>
                        <td className="orders-dashboard__cell--ticket">{order.ticketType}</td>
                        <td className="orders-dashboard__cell--qty">{order.quantity}</td>
                        <td className="orders-dashboard__cell--amount">
                          {formatCurrency(
                            order.totalAmount - order.serviceFeeAmount - order.taxAmount,
                          )}
                        </td>
                        <td className="orders-dashboard__cell--amount">
                          {order.serviceFeeAmount > 0
                            ? formatCurrency(order.serviceFeeAmount)
                            : '—'}
                        </td>
                        <td className="orders-dashboard__cell--amount">
                          {order.taxAmount > 0 ? formatCurrency(order.taxAmount) : '—'}
                        </td>
                        <td className="orders-dashboard__cell--amount orders-dashboard__cell--total">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`orders-dashboard__badge orders-dashboard__badge--${order.status}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="orders-dashboard__cell--date">
                          {new Date(order.createdAt).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

// ── Revenue card ───────────────────────────────────────────────────────────

function RevenueCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string
  value: string
  sub: string
  variant?: 'positive' | 'negative' | 'net'
}) {
  return (
    <div
      className={[
        'orders-dashboard__stat',
        variant ? `orders-dashboard__stat--${variant}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="orders-dashboard__stat-label">{label}</span>
      <span className="orders-dashboard__stat-value">{value}</span>
      <span className="orders-dashboard__stat-sub">{sub}</span>
    </div>
  )
}
