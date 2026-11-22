import type { Token } from './market'

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

export type ActivityAnalysis = {
  score: number
  coverage: number
  label: 'Higher activity' | 'Mixed activity' | 'Lower activity'
  turnover: number | null
  evidence: string[]
  cautions: string[]
}

export type HistoricalAnalysis = {
  bars: number
  lastClose: number
  rangeHigh: number
  rangeLow: number
  previousRangeHigh: number | null
  previousRangeLow: number | null
  rangePositionPct: number
  sma20: number
  sma50: number | null
  atr14: number
  volatilityPct: number
  momentumPct: number
  volumeRatio: number | null
  volumeState: 'above baseline' | 'near baseline' | 'below baseline' | 'unavailable'
  structure: 'rising highs and lows' | 'falling highs and lows' | 'mixed structure'
  patterns: ChartPattern[]
}

export type ChartPattern = {
  id: string
  direction: 'bullish' | 'bearish' | 'neutral'
  name: string
  explanation: string
  limitation: string
}

export function analyzeMarketActivity(token: Token, now: number): ActivityAnalysis {
  let score = 50
  const evidence: string[] = []
  const cautions: string[] = []
  const available = [
    token.priceUsd,
    token.marketCap,
    token.liquidityUsd,
    token.volume24h,
    token.volumeChange24h,
    token.priceChange24h,
    token.txns24h,
    token.pairCreatedAt,
  ].filter((value) => value !== null && Number.isFinite(value)).length

  if (token.priceChange24h !== null && Number.isFinite(token.priceChange24h)) {
    const change = token.priceChange24h
    if (change >= 5 && change <= 35) {
      score += 9
      evidence.push('Positive 24h price momentum')
    } else if (change > 35 && change <= 100) {
      score += 3
      cautions.push('Large 24h move; avoid treating extension as confirmation')
    } else if (change > 100) {
      score -= 7
      cautions.push('Very large 24h move increases chase and reversal risk')
    } else if (change <= -20) {
      score -= 10
      cautions.push('Material 24h drawdown')
    } else if (change < 0) {
      score -= 4
      cautions.push('Negative 24h price momentum')
    }
  }

  if (token.liquidityUsd !== null && Number.isFinite(token.liquidityUsd)) {
    if (token.liquidityUsd >= 100_000) {
      score += 10
      evidence.push('Reported pair liquidity above $100K')
    } else if (token.liquidityUsd >= 30_000) {
      score += 5
      evidence.push('Reported pair liquidity above $30K')
    } else if (token.liquidityUsd < 10_000) {
      score -= 12
      cautions.push('Low reported pair liquidity can increase execution impact')
    } else {
      evidence.push('Reported pair liquidity between $10K and $30K')
    }
  }

  const turnover = token.volume24h !== null && token.liquidityUsd !== null && token.liquidityUsd > 0
    ? token.volume24h / token.liquidityUsd
    : null
  if (turnover !== null && Number.isFinite(turnover)) {
    if (turnover < 0.05) {
      score -= 4
      cautions.push('Low 24h turnover relative to reported liquidity')
    } else if (turnover > 10) {
      score -= 6
      cautions.push('Unusually high turnover; verify the source of activity')
    } else {
      evidence.push('24h turnover is within a broad observable range')
    }
  }

  if (token.volumeChange24h !== null && Number.isFinite(token.volumeChange24h)) {
    if (token.volumeChange24h >= 25) {
      score += 4
      evidence.push('24h volume increased versus the provider baseline')
    } else if (token.volumeChange24h <= -25) {
      score -= 4
      cautions.push('24h volume declined versus the provider baseline')
    }
  }

  if (token.txns24h !== null && Number.isFinite(token.txns24h)) {
    if (token.txns24h >= 1_000) {
      score += 4
      evidence.push('At least 1,000 reported 24h pair transactions')
    } else if (token.txns24h < 25) {
      score -= 5
      cautions.push('Low reported transaction activity')
    }
  }

  if (now > 0 && token.pairCreatedAt !== null && Number.isFinite(token.pairCreatedAt)) {
    const ageHours = Math.max(0, (now - token.pairCreatedAt) / 3_600_000)
    if (ageHours < 24) {
      score -= 7
      cautions.push('Pair is less than 24 hours old; history is limited')
    }
  }

  if (evidence.length === 0 && cautions.length === 0) {
    cautions.push('No material activity signals in the available pair data')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return {
    score,
    coverage: Math.round((available / 8) * 100),
    label: score >= 68 ? 'Higher activity' : score >= 52 ? 'Mixed activity' : 'Lower activity',
    turnover,
    evidence,
    cautions,
  }
}

export function analyzeCandleHistory(input: Candle[]): HistoricalAnalysis | null {
  const candles = input.filter((candle) =>
    Number.isFinite(candle.time)
    && Number.isFinite(candle.open)
    && Number.isFinite(candle.high)
    && Number.isFinite(candle.low)
    && Number.isFinite(candle.close)
    && candle.open > 0
    && candle.high > 0
    && candle.low > 0
    && candle.close > 0
    && candle.high >= candle.low
    && candle.high >= candle.open
    && candle.high >= candle.close
    && candle.low <= candle.open
    && candle.low <= candle.close,
  ).sort((left, right) => left.time - right.time)

  if (candles.length < 20) return null

  const recent = candles.slice(-20)
  const last = candles[candles.length - 1]
  const previous = candles[candles.length - 2]
  const sma20 = recent.reduce((sum, candle) => sum + candle.close, 0) / recent.length
  const rangeHigh = Math.max(...recent.map((candle) => candle.high))
  const rangeLow = Math.min(...recent.map((candle) => candle.low))
  const priorRange = candles.slice(-21, -1)
  const previousRangeHigh = priorRange.length === 20 ? Math.max(...priorRange.map((candle) => candle.high)) : null
  const previousRangeLow = priorRange.length === 20 ? Math.min(...priorRange.map((candle) => candle.low)) : null
  const trueRanges = candles.slice(-15).map((candle, index, range) => {
    const previousClose = index > 0 ? range[index - 1].close : candles[candles.length - 16].close
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose))
  })
  const atr14 = trueRanges.slice(-14).reduce((sum, range) => sum + range, 0) / Math.min(14, trueRanges.length)
  const start = candles[candles.length - 20].close
  const volumes = candles.slice(-25, -5).map((candle) => candle.volume).filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0)
  const recentVolumes = candles.slice(-5).map((candle) => candle.volume).filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0)
  const averageVolume = volumes.length ? volumes.reduce((sum, value) => sum + value, 0) / volumes.length : null
  const currentAverageVolume = recentVolumes.length ? recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length : null
  const volumeRatio = averageVolume && currentAverageVolume !== null ? currentAverageVolume / averageVolume : null
  const sma50 = candles.length >= 50
    ? candles.slice(-50).reduce((sum, candle) => sum + candle.close, 0) / 50
    : null
  const segments = Array.from({ length: 4 }, (_, index) => recent.slice(index * 5, (index + 1) * 5))
  const segmentHighs = segments.map((segment) => Math.max(...segment.map((candle) => candle.high)))
  const segmentLows = segments.map((segment) => Math.min(...segment.map((candle) => candle.low)))
  const rising = segmentHighs.every((value, index) => index === 0 || value > segmentHighs[index - 1])
    && segmentLows.every((value, index) => index === 0 || value > segmentLows[index - 1])
  const falling = segmentHighs.every((value, index) => index === 0 || value < segmentHighs[index - 1])
    && segmentLows.every((value, index) => index === 0 || value < segmentLows[index - 1])
  const body = Math.abs(last.close - last.open)
  const candleRange = last.high - last.low
  const upperWick = last.high - Math.max(last.open, last.close)
  const lowerWick = Math.min(last.open, last.close) - last.low
  const patterns: ChartPattern[] = []

  if (candleRange > 0 && body / candleRange <= 0.08) {
    patterns.push({
      id: 'doji',
      direction: 'neutral',
      name: 'Doji · indecision',
      explanation: 'The latest candle opened and closed near the same price, showing a temporary balance between buyers and sellers.',
      limitation: 'A doji has no reliable direction on its own and is not a reversal signal without follow-through.',
    })
  } else if (candleRange > 0 && lowerWick >= body * 2 && upperWick <= body && last.close >= last.low + candleRange * 0.6) {
    patterns.push({
      id: 'hammer',
      direction: 'bullish',
      name: 'Hammer-like rejection',
      explanation: 'Price traded lower during the candle but closed nearer its high, which can indicate rejection of lower prices.',
      limitation: 'This is a single-candle shape. Context, a closed candle and later confirmation matter; it does not predict a bounce.',
    })
  } else if (candleRange > 0 && upperWick >= body * 2 && lowerWick <= body && last.close <= last.low + candleRange * 0.4) {
    patterns.push({
      id: 'shooting-star',
      direction: 'bearish',
      name: 'Upper-wick rejection',
      explanation: 'Price traded higher during the candle but closed nearer its low, which can indicate rejection of higher prices.',
      limitation: 'A single upper wick does not establish a top or guarantee a decline.',
    })
  }

  if (previous.close < previous.open && last.close > last.open && last.open <= previous.close && last.close >= previous.open) {
    patterns.push({
      id: 'bullish-engulfing',
      direction: 'bullish',
      name: 'Bullish engulfing shape',
      explanation: 'The latest rising candle body covers the prior falling candle body.',
      limitation: 'This two-candle pattern is descriptive, not a standalone entry signal; volume and the wider trend can disagree.',
    })
  } else if (previous.close > previous.open && last.close < last.open && last.open >= previous.close && last.close <= previous.open) {
    patterns.push({
      id: 'bearish-engulfing',
      direction: 'bearish',
      name: 'Bearish engulfing shape',
      explanation: 'The latest falling candle body covers the prior rising candle body.',
      limitation: 'This two-candle pattern is descriptive, not a standalone exit signal; volume and the wider trend can disagree.',
    })
  }

  if (previousRangeHigh !== null && last.close > previousRangeHigh) {
    patterns.push({
      id: 'range-close-above',
      direction: 'bullish',
      name: 'Close above prior 20-bar high',
      explanation: 'The latest close is above the highest wick from the preceding 20 candles.',
      limitation: 'A range break can fail. The next candles, liquidity and transaction quality remain unverified.',
    })
  } else if (previousRangeHigh !== null && last.high > previousRangeHigh && last.close <= previousRangeHigh) {
    patterns.push({
      id: 'range-upper-rejection',
      direction: 'bearish',
      name: 'Upper-range rejection',
      explanation: 'The latest candle traded above the prior 20-bar high but closed back inside the range.',
      limitation: 'A rejected test is not proof of a trend reversal; it may be noise or an unfinished candle.',
    })
  }

  if (previousRangeLow !== null && last.close < previousRangeLow) {
    patterns.push({
      id: 'range-close-below',
      direction: 'bearish',
      name: 'Close below prior 20-bar low',
      explanation: 'The latest close is below the lowest wick from the preceding 20 candles.',
      limitation: 'A breakdown can reverse. Confirm price acceptance and consider liquidity and slippage.',
    })
  } else if (previousRangeLow !== null && last.low < previousRangeLow && last.close >= previousRangeLow) {
    patterns.push({
      id: 'range-lower-rejection',
      direction: 'bullish',
      name: 'Lower-range rejection',
      explanation: 'The latest candle traded below the prior 20-bar low but closed back inside the range.',
      limitation: 'A rejected test is not proof of a trend reversal; it may be noise or an unfinished candle.',
    })
  }

  const volumeState = volumeRatio === null
    ? 'unavailable'
    : volumeRatio >= 1.5
      ? 'above baseline'
      : volumeRatio < 0.67
        ? 'below baseline'
        : 'near baseline'
  const rangePositionPct = rangeHigh > rangeLow
    ? Math.max(0, Math.min(100, ((last.close - rangeLow) / (rangeHigh - rangeLow)) * 100))
    : 50

  return {
    bars: candles.length,
    lastClose: last.close,
    rangeHigh,
    rangeLow,
    previousRangeHigh,
    previousRangeLow,
    rangePositionPct,
    sma20,
    sma50,
    atr14,
    volatilityPct: (atr14 / last.close) * 100,
    momentumPct: ((last.close / start) - 1) * 100,
    volumeRatio,
    volumeState,
    structure: rising ? 'rising highs and lows' : falling ? 'falling highs and lows' : 'mixed structure',
    patterns,
  }
}
