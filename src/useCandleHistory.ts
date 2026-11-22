import { useEffect, useState } from 'react'
import type { Candle } from './marketAnalysis'

export type CandleHistoryState = {
  candles: Candle[]
  loading: boolean
  error: string
}

export function useCandleHistory(
  pairAddress: string,
  timeframe: 'minute' | 'hour' | 'day',
  aggregate: number,
  refreshKey = 0,
): CandleHistoryState {
  const [state, setState] = useState<CandleHistoryState & { requestKey: string }>({
    candles: [],
    loading: true,
    error: '',
    requestKey: '',
  })
  const requestKey = `${pairAddress}:${timeframe}:${aggregate}:${refreshKey}`

  useEffect(() => {
    if (!pairAddress) return

    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(
          `/api/market/pairs/${encodeURIComponent(pairAddress)}/ohlcv?timeframe=${timeframe}&aggregate=${aggregate}&limit=250`,
          { signal: controller.signal, headers: { Accept: 'application/json' } },
        )
        if (!response.ok) {
          let message = `History provider returned ${response.status}`
          try {
            const payload = await response.json() as { error?: string }
            if (payload.error) message = payload.error
          } catch {
            // Keep the status message when the provider does not return JSON.
          }
          throw new Error(message)
        }

        const payload = await response.json() as { candles?: Candle[] }
        if (!Array.isArray(payload.candles)) throw new Error('History provider returned an invalid response')
        const candles = payload.candles.filter((candle) =>
          Number.isFinite(candle.time)
          && Number.isFinite(candle.open)
          && Number.isFinite(candle.high)
          && Number.isFinite(candle.low)
          && Number.isFinite(candle.close)
          && candle.open > 0
          && candle.high >= Math.max(candle.open, candle.close)
          && candle.low <= Math.min(candle.open, candle.close)
          && candle.high >= candle.low
          && (candle.volume === null || Number.isFinite(candle.volume) && candle.volume >= 0),
        )
        if (candles.length === 0) throw new Error('No candle history is available for this pair')
        setState({ candles, loading: false, error: '', requestKey })
      } catch (caught) {
        if (controller.signal.aborted) return
        setState({
          candles: [],
          loading: false,
          error: caught instanceof Error ? caught.message : 'Unable to load candle history',
          requestKey,
        })
      }
    }

    void load()
    return () => controller.abort()
  }, [pairAddress, timeframe, aggregate, refreshKey, requestKey])

  if (!pairAddress) return { candles: [], loading: false, error: '' }
  if (state.requestKey !== requestKey) return { candles: [], loading: true, error: '' }
  return { candles: state.candles, loading: state.loading, error: state.error }
}
