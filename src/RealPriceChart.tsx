import { useEffect, useRef, useState } from 'react'
import { CandlestickSeries, HistogramSeries, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { LoaderCircle, TriangleAlert } from 'lucide-react'

type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

type Props = {
  pairAddress: string
  timeframe: 'minute' | 'hour' | 'day'
  aggregate: number
}

export default function RealPriceChart({ pairAddress, timeframe, aggregate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [legend, setLegend] = useState<Candle | null>(null)

  useEffect(() => {
    if (!pairAddress || !containerRef.current) return
    setLoading(true)
    setError('')
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(
          `/api/market/pairs/${encodeURIComponent(pairAddress)}/ohlcv?timeframe=${timeframe}&aggregate=${aggregate}&limit=250`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error(`History provider returned ${response.status}`)
        const payload = await response.json() as { candles?: Candle[] }
        if (!Array.isArray(payload.candles) || payload.candles.length === 0) {
          throw new Error('No candle history is available for this pair')
        }
        if (!containerRef.current) return
        setLegend(payload.candles[payload.candles.length - 1])

        if (chartRef.current) chartRef.current.remove()
        const chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          layout: { background: { color: 'transparent' }, textColor: '#748090', fontFamily: 'Inter, SF Pro Text, Segoe UI, sans-serif', fontSize: 9 },
          grid: { vertLines: { color: 'rgba(255,255,255,0.035)' }, horzLines: { color: 'rgba(255,255,255,0.035)' } },
          crosshair: { vertLine: { color: 'rgba(145,182,235,0.38)', width: 1, style: 2 }, horzLine: { color: 'rgba(145,182,235,0.38)', width: 1, style: 2 } },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.055)', scaleMargins: { top: 0.08, bottom: 0.24 } },
          timeScale: { borderColor: 'rgba(255,255,255,0.055)', timeVisible: true, secondsVisible: false, rightOffset: 3, barSpacing: 7 },
          handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
          handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        })
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#58c99a',
          downColor: '#e1838b',
          borderUpColor: '#58c99a',
          borderDownColor: '#e1838b',
          wickUpColor: '#58c99a',
          wickDownColor: '#e1838b',
          priceLineVisible: true,
          lastValueVisible: true,
        })
        series.setData(payload.candles.map((candle) => ({
          time: candle.time as never,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })))
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          lastValueVisible: false,
          priceLineVisible: false,
        })
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        })
        volumeSeries.setData(payload.candles
          .filter((candle) => candle.volume !== null)
          .map((candle) => ({
            time: candle.time as never,
            value: candle.volume as number,
            color: candle.close >= candle.open ? 'rgba(88,201,154,0.30)' : 'rgba(225,131,139,0.28)',
          })))
        chart.timeScale().fitContent()
        chartRef.current = chart
        seriesRef.current = series
        setCount(payload.candles.length)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setError(caught instanceof Error ? caught.message : 'Unable to load candle history')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      controller.abort()
      observer.disconnect()
      chartRef.current?.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [pairAddress, timeframe, aggregate])

  return (
    <div className="real-chart">
      {loading && <div className="real-chart-state"><LoaderCircle size={16} className="spin" /><span>Loading real candle history</span></div>}
      {!loading && error && <div className="real-chart-state real-chart-error"><TriangleAlert size={15} /><div><strong>History unavailable</strong><span>{error}</span></div></div>}
      {!loading && !error && legend && (
        <div className="real-chart-legend">
          <span>O <b>{legend.open.toPrecision(6)}</b></span>
          <span>H <b>{legend.high.toPrecision(6)}</b></span>
          <span>L <b>{legend.low.toPrecision(6)}</b></span>
          <span>C <b>{legend.close.toPrecision(6)}</b></span>
          {legend.volume !== null && <span>VOL <b>{new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(legend.volume)}</b></span>}
        </div>
      )}
      <div ref={containerRef} className="real-chart-canvas" />
      {!loading && !error && <div className="real-chart-meta"><span>{count} candles</span><span>GeckoTerminal · provider candles</span></div>}
    </div>
  )
}
