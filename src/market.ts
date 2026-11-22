export type Token = {
  address: string
  pairAddress: string
  name: string
  symbol: string
  dexId: string
  url: string
  imageUrl: string | null
  pairCreatedAt: number | null
  priceUsd: number | null
  marketCap: number | null
  liquidityUsd: number | null
  volume24h: number | null
  volumeChange24h: number | null
  priceChange24h: number | null
  txns24h: number | null
}
