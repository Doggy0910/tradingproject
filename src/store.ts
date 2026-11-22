import { create } from 'zustand'
import type { Token } from './market'

type MarketStore = {
  tokens: Token[]
  updatedAt: number | null
  loading: boolean
  error: string
  refreshSeconds: number
  refresh: () => Promise<void>
  setRefreshSeconds: (value: number) => void
}

function readRefreshSeconds() {
  const value = Number(localStorage.getItem('memescan-refresh') ?? '60')
  return [0, 30, 60, 300].includes(value) ? value : 60
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  tokens: [],
  updatedAt: null,
  loading: false,
  error: '',
  refreshSeconds: readRefreshSeconds(),
  setRefreshSeconds: (value) => {
    localStorage.setItem('memescan-refresh', String(value))
    set({ refreshSeconds: value })
  },
  refresh: async () => {
    if (get().loading) return
    set({ loading: true, error: '' })
    try {
      const response = await fetch('/api/market/tokens', { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Market service returned ${response.status}`)
      const payload = await response.json() as { tokens?: Token[] }
      if (!Array.isArray(payload.tokens)) throw new Error('Market service returned an invalid response')
      set({ tokens: payload.tokens, updatedAt: Date.now(), loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect to the market service'
      set({ loading: false, error: message })
    }
  },
}))
