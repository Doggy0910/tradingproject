import { useEffect, useRef, useState } from 'react'
import { CandlestickSeries, HistogramSeries, LineSeries, LineStyle, createChart, type AutoscaleInfoProvider, type IChartApi } from 'lightweight-charts'
import { TriangleAlert } from 'lucide-react'
import type { Candle } from './marketAnalysis'
import { useCandleHistory, type CandleHistoryState } from './useCandleHistory'

const nonNegativeAutoscale: AutoscaleInfoProvider = (baseImplementation) => {
  const info = baseImplementation()
  if (!info?.priceRange) return info
  return {
    ...info,
    priceRange: { ...info.priceRange, minValue: Math.max(0, info.priceRange.minValue) },
  }
}

type Props = {
  pairAddress: string
  timeframe: 'minute' | 'hour' | 'day'
  aggregate: number
  history?: CandleHistoryState
  indicators?: { showSma20: boolean; showSma50: boolean; showRangeLevels: boolean }
}

export default function RealPriceChart({ pairAddress, timeframe, aggregate, history: sharedHistory, indicators }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const activeCandleRef = useRef<number | null>(null)
  const [count, setCount] = useState(0)
  const [legend, setLegend] = useState<Candle | null>(null)
  const fetchedHistory = useCandleHistory(sharedHistory ? '' : pairAddress, timeframe, aggregate)
  const { candles, loading, error } = sharedHistory ?? fetchedHistory
  const intervalLabel = `${aggregate}${timeframe === 'minute' ? 'm' : timeframe === 'hour' ? 'h' : 'd'}`
  const candleChange = legend ? legend.close - legend.open : null
  const candleChangePct = legend?.open ? (legend.close / legend.open - 1) * 100 : null

  useEffect(() => {
    if (loading || error || !containerRef.current || candles.length === 0) return
    setLegend(null)
    setCount(candles.length)
    activeCandleRef.current = null
    chartRef.current?.remove()
    chartRef.current = null
    const latestCandle = candles[candles.length - 1]
    const candlesByTime = new Map(candles.map((candle) => [candle.time, candle]))
    activeCandleRef.current = latestCandle.time
    setLegend(latestCandle)
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { color: 'transparent' }, textColor: '#8793a1', fontFamily: 'Inter, SF Pro Text, Segoe UI, sans-serif', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.025)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: { vertLine: { color: 'rgba(169,200,239,0.38)', width: 1, style: 2 }, horzLine: { color: 'rgba(169,200,239,0.32)', width: 1, style: 2 } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.07)', minimumWidth: 88, scaleMargins: { top: 0.06, bottom: 0 } },
      timeScale: { borderColor: 'rgba(255,255,255,0.07)', timeVisible: true, secondsVisible: false, rightOffset: 4, barSpacing: 7 },
      localization: { locale: 'en-US' },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })
    chartRef.current = chart
    const volumePane = chart.addPane()
    chart.panes()[0].setStretchFactor(0.76)
    volumePane.setStretchFactor(0.24)
    const minPrice = Math.min(...candles.flatMap((candle) => [candle.open, candle.high, candle.low, candle.close]))
    const precision = Math.min(16, Math.max(2, Math.ceil(-Math.log10(minPrice)) + 2))
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#58c99a',
      downColor: '#e1838b',
      borderUpColor: '#58c99a',
      borderDownColor: '#e1838b',
      wickUpColor: '#58c99a',
      wickDownColor: '#e1838b',
      priceLineVisible: true,
      lastValueVisible: true,
      priceFormat: { type: 'price', precision, minMove: 10 ** -precision },
      autoscaleInfoProvider: nonNegativeAutoscale,
    })
    series.setData(candles.map((candle) => ({
      time: candle.time as never,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })))
    series.priceScale().applyOptions({ visible: true, minimumWidth: 88 })
    const addMovingAverage = (period: 20 | 50, color: string) => {
      if (candles.length < period) return
      let total = 0
      const points = candles.flatMap((candle, index) => {
        total += candle.close
        if (index >= period) total -= candles[index - period].close
        return index >= period - 1
          ? [{ time: candle.time as never, value: total / period }]
          : []
      })
      chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      }).setData(points)
    }
    if (indicators?.showSma20) addMovingAverage(20, '#a9c9dc')
    if (indicators?.showSma50) addMovingAverage(50, '#d7b47d')
    if (indicators?.showRangeLevels) {
      const prior = candles.slice(-21, -1)
      const range = prior.length === 20 ? prior : candles.slice(-20)
      if (range.length) {
        const high = Math.max(...range.map((candle) => candle.high))
        const low = Math.min(...range.map((candle) => candle.low))
        for (const [price, title, color] of [
          [high, '20H', 'rgba(100, 210, 162, 0.72)'],
          [low, '20L', 'rgba(231, 131, 141, 0.72)'],
        ] as const) {
          series.createPriceLine({
            price,
            title,
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
          })
        }
      }
    }
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    }, 1)
    volumeSeries.priceScale().applyOptions({ visible: true, minimumWidth: 64, scaleMargins: { top: 0.08, bottom: 0.08 } })
    volumeSeries.setData(candles
      .filter((candle) => candle.volume !== null)
      .map((candle) => ({
        time: candle.time as never,
        value: candle.volume as number,
        color: candle.close >= candle.open ? 'rgba(88,201,154,0.30)' : 'rgba(225,131,139,0.28)',
      })))
    chart.subscribeCrosshairMove((param) => {
      const hovered = typeof param.time === 'number' ? candlesByTime.get(param.time) : undefined
      const candle = hovered ?? latestCandle
      if (activeCandleRef.current === candle.time) return
      activeCandleRef.current = candle.time
      setLegend(candle)
    })
    chart.timeScale().fitContent()
    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chartRef.current?.remove()
      chartRef.current = null
    }
  }, [candles, loading, error, indicators])

  return (
    <div className="real-chart">
      {loading && <div className="chart-loading-skeleton" role="status" aria-label="Loading real candle history">
        <div className="chart-skeleton-grid" aria-hidden="true"><i /><i /><i /><i /></div>
        <svg className="chart-skeleton-line" viewBox="0 0 640 240" preserveAspectRatio="none" aria-hidden="true"><path d="M0 190 C45 174 52 146 92 156 S142 180 176 132 S231 118 260 139 S303 122 329 94 S381 115 412 83 S456 105 481 72 S524 86 548 42 S606 67 640 22" /></svg>
        <span className="chart-loading-caption">Loading provider candles</span>
      </div>}
      {!loading && error && <div className="real-chart-state real-chart-error"><TriangleAlert size={15} /><div><strong>History unavailable</strong><span>{error}</span></div></div>}
      {!loading && !error && legend && (
      <div className="real-chart-legend" aria-label="Selected candle data">
        <div className="real-chart-legend-heading">
          <strong>PRICE · USD</strong>
          <span>Selected candle · {formatCandleTime(legend.time)} · {intervalLabel}</span>
        </div>
        <div className="real-chart-legend-values">
          <span title="Price at the start of this candle"><small>OPEN</small><b>{formatPrice(legend.open)}</b></span>
          <span title="Highest price reached during this candle"><small>HIGH</small><b>{formatPrice(legend.high)}</b></span>
          <span title="Lowest price reached during this candle"><small>LOW</small><b>{formatPrice(legend.low)}</b></span>
          <span title="Price at the end of this candle"><small>CLOSE</small><b>{formatPrice(legend.close)}</b></span>
          {candleChange !== null && candleChangePct !== null && <span className={candleChange >= 0 ? 'positive' : 'negative'} title="Close minus open; this is one candle, not the selected timeframe's total return">
            <small>BAR CHANGE</small><b>{formatSignedPrice(candleChange)} · {formatSignedPercent(candleChangePct)}</b>
          </span>}
          {legend.volume !== null && <span title="Provider-reported volume for this candle"><small>VOLUME</small><b>{new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(legend.volume)}</b></span>}
        </div>
        </div>
      )}
      {!loading && !error && <div className="real-chart-indicators" aria-label="Visible chart indicators">
      {indicators?.showSma20 && count >= 20 && <span title="Average of the last 20 candle closes; it follows past price and can lag"><i className="indicator-swatch sma20-swatch" />SMA 20 · 20-close average</span>}
      {indicators?.showSma50 && count >= 50 && <span title="Average of the last 50 candle closes; it follows past price and can lag"><i className="indicator-swatch sma50-swatch" />SMA 50 · 50-close average</span>}
      {indicators?.showRangeLevels && count >= 20 && <span title="Highest and lowest values in the previous 20 candles"><i className="indicator-swatch range-swatch" />Prior 20-candle high / low</span>}
      </div>}
      {!loading && !error && candles.some((candle) => candle.volume !== null) && <span className="real-chart-volume-label">REPORTED VOLUME</span>}
      <div ref={containerRef} className="real-chart-canvas" />
      {!loading && !error && <div className="real-chart-meta">
      <span>{count} candles · {intervalLabel} interval · {formatCandleTime(candles[0].time)} – {formatCandleTime(candles[candles.length - 1].time)} · GeckoTerminal</span>
      <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Charts by TradingView</a>
      </div>}
      {!loading && !error && <p className="real-chart-guide">
      <span><i className="guide-up" /> Verde: cierre sobre apertura</span>
      <span><i className="guide-down" /> Rojo: cierre bajo apertura</span>
      <span>Mecha = máximo–mínimo</span>
      <span>Volumen reportado; no indica compras netas. La última vela puede seguir abierta.</span>
      </p>}
    </div>
  )
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 7 }).format(value)
}

function formatSignedPrice(value: number) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatPrice(Math.abs(value))}`
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatCandleTime(time: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time * 1_000))
}
