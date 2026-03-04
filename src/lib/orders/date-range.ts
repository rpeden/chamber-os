/**
 * Computes a date range for a given reporting period and fiscal year start.
 *
 * @param period - Period identifier
 * @param fiscalYearStartMonth - 1-indexed month (1=January, 4=April, etc.)
 * @returns ISO string range, or null for "all time"
 */

export type Period =
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisFiscal'
  | 'lastFiscal'
  | 'allTime'

export const PERIOD_LABELS: Record<Period, string> = {
  last30: 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisFiscal: 'This fiscal year',
  lastFiscal: 'Last fiscal year',
  allTime: 'All time',
}

export function computeDateRange(
  period: Period,
  fiscalYearStartMonth: number,
): { start: string; end: string } | null {
  const now = new Date()

  switch (period) {
    case 'last30': {
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString(),
      }
    }
    case 'thisMonth': {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        end: now.toISOString(),
      }
    }
    case 'lastMonth': {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
      }
    }
    case 'thisFiscal': {
      const fyMonth = fiscalYearStartMonth - 1 // 0-indexed
      const month = now.getMonth()
      const year = now.getFullYear()
      const fyStart = month >= fyMonth ? new Date(year, fyMonth, 1) : new Date(year - 1, fyMonth, 1)
      return {
        start: fyStart.toISOString(),
        end: now.toISOString(),
      }
    }
    case 'lastFiscal': {
      const fyMonth = fiscalYearStartMonth - 1
      const month = now.getMonth()
      const year = now.getFullYear()
      const thisStart =
        month >= fyMonth ? new Date(year, fyMonth, 1) : new Date(year - 1, fyMonth, 1)
      const lastStart = new Date(thisStart.getFullYear() - 1, fyMonth, 1)
      const lastEnd = new Date(thisStart.getFullYear(), fyMonth, 0, 23, 59, 59)
      return {
        start: lastStart.toISOString(),
        end: lastEnd.toISOString(),
      }
    }
    case 'allTime':
    default:
      return null
  }
}
