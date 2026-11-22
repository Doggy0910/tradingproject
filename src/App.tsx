import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Bookmark, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Command, ExternalLink,
  Eye, Filter, LayoutDashboard, LineChart, ListFilter, LoaderCircle, Menu,
  Search, Settings2, ShieldAlert, SlidersHorizontal, Sparkles, Wallet,
  X, GraduationCap, Radar, TriangleAlert, Crosshair, Gauge,
  CandlestickChart, SlidersHorizontal as SlidersIcon, Bot, Scale,
} from 'lucide-react'
import type { Token } from './market'
import { useMarketStore } from './store'
import RealPriceChart from './RealPriceChart'
import './App.css'

type Section = 'overview' | 'scanner' | 'risk' | 'training' | 'paper' | 'ai' | 'settings'

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard; tag?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scanner', label: 'Live scanner', icon: ListFilter },
  { id: 'risk', label: 'Risk intelligence', icon: ShieldAlert },
  { id: 'ai', label: 'AI brain', icon: Sparkles, tag: 'LOCAL' },
  { id: 'training', label: 'AI assisted training', icon: GraduationCap, tag: 'NEW' },
  { id: 'paper', label: 'Paper trading', icon: Wallet },
]

const initialColumns = ['price', 'marketCap', 'liquidity', 'volume', 'change', 'activity']
const columnLabels: Record<string, string> = {
  price: 'Price', marketCap: 'Market cap', liquidity: 'Liquidity',
  volume: '24h volume', change: '24h change', activity: 'Transactions',
}

function compact(value: number | null, currency = true) {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: currency ? 'currency' : 'decimal',
    currency: 'USD',
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value)
}

function shortNumber(value: number | null) {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function percentage(value: number | null) {
  if (value === null) return '—'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatAge(timestamp: number | null) {
  if (!timestamp) return '—'
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000))
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return days < 30 ? `${days}d` : `${Math.floor(days / 30)}mo`
}

function App() {
  const { tokens, updatedAt, loading, error, refresh, refreshSeconds, setRefreshSeconds } = useMarketStore()
  const [section, setSection] = useState<Section>('overview')
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!refreshSeconds) return
    const timer = window.setInterval(() => void refresh(), refreshSeconds * 1_000)
    return () => window.clearInterval(timer)
  }, [refresh, refreshSeconds])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const pageTitle = navigation.find((item) => item.id === section)?.label ?? 'Settings'
  const lastUpdated = updatedAt
    ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(updatedAt)
    : 'Waiting for feed'

  return (
    <div className="app-shell">
      {mobileNav && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={19} strokeWidth={2.2} /></div>
          <span>memescan<span className="brand-ai">.ai</span></span>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={17} /></button>
        </div>
        <button className="workspace-switch" onClick={() => setToast('Personal workspace is active.')} aria-label="Workspace menu">
          <span className="workspace-avatar">M</span>
          <span className="workspace-copy"><strong>Market desk</strong><small>Personal workspace</small></span>
          <ChevronDown size={15} className="muted-icon" />
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon, tag }) => (
            <button key={id} className={`nav-item ${section === id ? 'nav-active' : ''}`}
              onClick={() => { setSection(id); setMobileNav(false) }}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {tag && <span className="nav-tag">{tag}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-spacer" />
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-icon"><Sparkles size={15} /></div>
            <div><strong>Intelligence layer</strong><p>Connect an AI provider to enable analysis.</p></div>
            <button aria-label="Configure AI" onClick={() => setSection('ai')}><ArrowUpRight size={14} /></button>
          </div>
          <button className={`nav-item ${section === 'settings' ? 'nav-active' : ''}`} onClick={() => setSection('settings')}>
            <Settings2 size={17} strokeWidth={1.8} /><span>Settings</span>
          </button>
          <div className="user-row">
            <div className="user-avatar">A</div><div className="user-copy"><strong>Analyst</strong><small>Free workspace</small></div>
            <button className="icon-button" aria-label="Help" onClick={() => setToast('Market data is provided by DexScreener.')}><CircleHelp size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <div className={`feed-status ${error ? 'feed-error' : ''}`}><span className="status-dot" />{error ? 'Feed unavailable' : loading && !updatedAt ? 'Connecting' : 'Solana feed'}</div>
            <div className="topbar-divider" />
            <span className="updated-label"><Clock3 size={13} />{lastUpdated}</span>
            <button className="icon-button refresh-button" aria-label="Refresh market data" onClick={() => void refresh()} disabled={loading}>
              <LoaderCircle size={16} className={loading ? 'spin' : ''} />
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast('You’re all caught up.')}><Bell size={16} /></button>
            <div className="topbar-avatar">A</div>
          </div>
        </header>

        <div className="page-content page-content-enter" key={section}>
          {error && <div className="error-banner"><ShieldAlert size={16} /><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
          {section === 'overview' && <Overview tokens={tokens} loading={loading} onSelect={setSelectedToken} onNavigate={setSection} />}
          {section === 'scanner' && <Scanner tokens={tokens} loading={loading} onSelect={setSelectedToken} onToast={setToast} />}
          {section === 'risk' && <RiskPage tokens={tokens} onSelect={setSelectedToken} />}
          {section === 'training' && <TrainingPage tokens={tokens} onToast={setToast} onNavigatePaper={() => setSection('paper')} />}
          {section === 'ai' && <AiPage tokens={tokens} onSelect={setSelectedToken} />}
          {section === 'paper' && <PaperTrading tokens={tokens} onToast={setToast} />}
          {section === 'settings' && <SettingsPage refreshSeconds={refreshSeconds} setRefreshSeconds={setRefreshSeconds} />}
        </div>
      </main>
      {selectedToken && <TokenDialog token={selectedToken} onClose={() => setSelectedToken(null)} onToast={setToast} onOpenPaper={() => { setSelectedToken(null); setSection('paper') }} />}
      {toast && <div className="toast"><Check size={15} />{toast}</div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ tokens, loading, onSelect, onNavigate }: { tokens: Token[]; loading: boolean; onSelect: (token: Token) => void; onNavigate: (section: Section) => void }) {
  const totalVolume = tokens.reduce((sum, token) => sum + (token.volume24h ?? 0), 0)
  const avgChange = tokens.length ? tokens.reduce((sum, token) => sum + (token.priceChange24h ?? 0), 0) / tokens.filter((token) => token.priceChange24h !== null).length : 0
  const positive = tokens.filter((token) => (token.priceChange24h ?? 0) > 0).length
  const movers = [...tokens].sort((a, b) => (b.priceChange24h ?? -Infinity) - (a.priceChange24h ?? -Infinity)).slice(0, 5)

  return <>
    <PageHeading eyebrow="MARKET OVERVIEW" title="The market, in focus." description="A live snapshot of the Solana tokens currently surfaced by DexScreener." action={<button className="button button-secondary" onClick={() => onNavigate('scanner')}><ListFilter size={15} />Open scanner<ArrowUpRight size={14} /></button>} />
    <div className="data-note"><span className="data-note-dot" />REAL-TIME SOURCE <span>·</span> DexScreener boosted-token feed <span className="note-separator">·</span> Aggregates below represent loaded tokens only</div>
    <div className="metrics-grid">
      <MetricCard label="Tracked tokens" value={loading && !tokens.length ? '—' : tokens.length.toString()} meta="Solana · current feed" icon={<Eye size={16} />} />
      <MetricCard label="24h volume" value={tokens.length ? compact(totalVolume) : '—'} meta="Combined loaded pairs" icon={<Activity size={16} />} />
      <MetricCard label="Average 24h move" value={tokens.some((token) => token.priceChange24h !== null) ? percentage(avgChange) : '—'} meta="Unweighted · loaded pairs" icon={avgChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} positive={avgChange >= 0} />
      <MetricCard label="Advancing tokens" value={tokens.length ? `${positive} / ${tokens.length}` : '—'} meta="Based on 24h price change" icon={<LineChart size={16} />} />
    </div>
    <div className="content-grid">
      <section className="panel movers-panel">
        <div className="panel-heading"><div><h2>Leading movers</h2><p>Top 24h price changes in the loaded feed</p></div><button className="text-button" onClick={() => onNavigate('scanner')}>View scanner<ArrowUpRight size={14} /></button></div>
        {loading && !tokens.length ? <LoadingRows /> : movers.length ? <TokenTable tokens={movers} onSelect={onSelect} compactMode /> : <EmptyState title="No market data yet" copy="The Solana feed is unavailable or has no results. Refresh to try again." />}
      </section>
      <section className="panel pulse-panel">
        <div className="panel-heading"><div><h2>Market pulse</h2><p>Current feed composition</p></div><span className="live-tag"><span />LIVE</span></div>
        <div className="pulse-total"><strong>{tokens.length || '—'}</strong><span>tokens surfaced</span></div>
        <div className="pulse-bar"><span style={{ width: `${tokens.length ? (positive / tokens.length) * 100 : 0}%` }} /></div>
        <div className="pulse-legend"><span><i className="legend-green" />{positive} advancing</span><span><i className="legend-red" />{tokens.length - positive} declining / flat</span></div>
        <div className="pulse-divider" />
        <div className="insight-preview"><div className="insight-icon"><Activity size={15} /></div><div><strong>Feed summary</strong><p>{tokens.length ? `${positive} of ${tokens.length} tracked tokens are showing a positive 24h move. This is descriptive market data, not a forecast.` : 'Waiting for current market data from the provider.'}</p></div></div>
      </section>
    </div>
    <section className="panel full-table-panel">
      <div className="panel-heading"><div><h2>Recently surfaced</h2><p>Ranked by provider activity · live pair metrics</p></div><button className="button button-quiet" onClick={() => onNavigate('scanner')}>All tokens<ChevronRight size={14} /></button></div>
      {loading && !tokens.length ? <LoadingRows /> : <TokenTable tokens={tokens.slice(0, 7)} onSelect={onSelect} compactMode />}
    </section>
  </>
}

function MetricCard({ label, value, meta, icon, positive }: { label: string; value: string; meta: string; icon: React.ReactNode; positive?: boolean }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className={positive === undefined ? '' : positive ? 'positive' : 'negative'}>{value}</strong><small>{meta}</small></div>
}

function TokenTable({ tokens, onSelect, compactMode = false, columns = initialColumns, onToggleWatch, watchlist = [] }: {
  tokens: Token[]; onSelect: (token: Token) => void; compactMode?: boolean; columns?: string[]
  onToggleWatch?: (token: Token) => void; watchlist?: string[]
}) {
  return <div className="table-scroll"><table className={compactMode ? 'token-table compact-table' : 'token-table'}>
    <thead><tr><th className="token-column">TOKEN</th>
      {columns.includes('price') && <th>PRICE</th>}
      {columns.includes('marketCap') && <th>MARKET CAP</th>}
      {columns.includes('liquidity') && <th>LIQUIDITY</th>}
      {columns.includes('volume') && <th>24H VOLUME</th>}
      {columns.includes('change') && <th>24H CHANGE</th>}
      {columns.includes('activity') && <th>TXNS · 24H</th>}
      <th aria-label="Actions" /></tr></thead>
    <tbody>{tokens.map((token) => {
      const change = token.priceChange24h
      return <tr key={token.pairAddress} onClick={() => onSelect(token)} className="clickable-row">
        <td><div className="token-identity"><div className="token-logo">{token.imageUrl ? <img src={token.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span>{token.symbol.slice(0, 1)}</span>}</div><div className="token-names"><strong>{token.name}</strong><small>{token.symbol}<span className="token-network">SOL</span></small></div></div></td>
        {columns.includes('price') && <td className="mono">{compact(token.priceUsd)}</td>}
        {columns.includes('marketCap') && <td className="mono">{compact(token.marketCap)}</td>}
        {columns.includes('liquidity') && <td className="mono">{compact(token.liquidityUsd)}</td>}
        {columns.includes('volume') && <td className="mono">{compact(token.volume24h)}</td>}
        {columns.includes('change') && <td><span className={`change-pill ${(change ?? 0) >= 0 ? 'change-up' : 'change-down'}`}>{(change ?? 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{percentage(change)}</span></td>}
        {columns.includes('activity') && <td className="mono activity-cell">{shortNumber(token.txns24h)}</td>}
        <td className="row-action-cell">{onToggleWatch && <button className={`watch-button ${watchlist.includes(token.address) ? 'watch-active' : ''}`} aria-label={watchlist.includes(token.address) ? 'Remove from watchlist' : 'Add to watchlist'} onClick={(event) => { event.stopPropagation(); onToggleWatch(token) }}><Bookmark size={15} fill={watchlist.includes(token.address) ? 'currentColor' : 'none'} /></button>}<ExternalLink size={13} className="row-external" /></td>
      </tr>
    })}</tbody>
  </table></div>
}

function Scanner({ tokens, loading, onSelect, onToast }: { tokens: Token[]; loading: boolean; onSelect: (token: Token) => void; onToast: (message: string) => void }) {
  const [query, setQuery] = useState('')
  const [minLiquidity, setMinLiquidity] = useState('')
  const [minVolume, setMinVolume] = useState('')
  const [sortKey, setSortKey] = useState<'volume24h' | 'liquidityUsd' | 'marketCap' | 'priceChange24h'>('volume24h')
  const [ascending, setAscending] = useState(false)
  const [page, setPage] = useState(0)
  const [columns, setColumns] = useState(initialColumns)
  const [columnMenu, setColumnMenu] = useState(false)
  const [watchlistOnly, setWatchlistOnly] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('memescan-watchlist') ?? '[]') as string[] } catch { return [] }
  })

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.search-field input')?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const filtered = useMemo(() => tokens.filter((token) => {
    const matchesText = !query || `${token.name} ${token.symbol} ${token.address}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (minLiquidity === '' || (token.liquidityUsd ?? -1) >= Number(minLiquidity))
      && (minVolume === '' || (token.volume24h ?? -1) >= Number(minVolume))
      && (!watchlistOnly || watchlist.includes(token.address))
  }).sort((a, b) => {
    const av = a[sortKey] ?? (ascending ? Infinity : -Infinity)
    const bv = b[sortKey] ?? (ascending ? Infinity : -Infinity)
    return ascending ? Number(av) - Number(bv) : Number(bv) - Number(av)
  }), [tokens, query, minLiquidity, minVolume, sortKey, ascending, watchlistOnly, watchlist])
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize)

  function toggleWatch(token: Token) {
    const next = watchlist.includes(token.address) ? watchlist.filter((address) => address !== token.address) : [...watchlist, token.address]
    setWatchlist(next)
    localStorage.setItem('memescan-watchlist', JSON.stringify(next))
    onToast(next.includes(token.address) ? `${token.symbol} added to watchlist` : `${token.symbol} removed from watchlist`)
  }

  function sortBy(key: typeof sortKey) {
    if (sortKey === key) setAscending(!ascending)
    else { setSortKey(key); setAscending(false) }
    setPage(0)
  }

  return <>
    <PageHeading eyebrow="MARKET SCANNER" title="Find the signal." description="Screen the live Solana feed with pair-level market data from DexScreener." action={<button className="button button-secondary" onClick={() => { setQuery(''); setMinLiquidity(''); setMinVolume(''); setWatchlistOnly(false); setPage(0) }}><X size={14} />Clear filters</button>} />
    <div className="scanner-toolbar">
      <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="Search name, symbol or address..." /><kbd><Command size={11} /> K</kbd></label>
      <label className="filter-field"><span>Min. liquidity</span><div><span>$</span><input type="number" min="0" placeholder="Any" value={minLiquidity} onChange={(event) => { setMinLiquidity(event.target.value); setPage(0) }} /></div></label>
      <label className="filter-field"><span>Min. 24h volume</span><div><span>$</span><input type="number" min="0" placeholder="Any" value={minVolume} onChange={(event) => { setMinVolume(event.target.value); setPage(0) }} /></div></label>
      <button className={`button ${watchlistOnly ? 'button-active' : 'button-secondary'}`} onClick={() => { setWatchlistOnly(!watchlistOnly); setPage(0) }}><Bookmark size={14} />Watchlist</button>
      <div className="column-menu-wrap">
        <button className="button button-secondary" onClick={() => setColumnMenu(!columnMenu)}><SlidersHorizontal size={14} />Columns</button>
        {columnMenu && <div className="column-menu"><strong>Visible columns</strong>{Object.entries(columnLabels).map(([key, label]) => <label key={key}><input type="checkbox" checked={columns.includes(key)} onChange={() => setColumns(columns.includes(key) ? columns.filter((column) => column !== key) : [...columns, key])} />{label}</label>)}</div>}
      </div>
    </div>
    <div className="scanner-meta"><span><Filter size={13} />{filtered.length} token{filtered.length === 1 ? '' : 's'} match</span><span>Sort by <button onClick={() => sortBy(sortKey)}>{columnLabels[sortKey === 'volume24h' ? 'volume' : sortKey === 'liquidityUsd' ? 'liquidity' : sortKey === 'marketCap' ? 'marketCap' : 'change']} {ascending ? '↑' : '↓'}</button></span><div className="sort-shortcuts"><button onClick={() => sortBy('volume24h')}>Volume</button><button onClick={() => sortBy('liquidityUsd')}>Liquidity</button><button onClick={() => sortBy('priceChange24h')}>24h move</button></div></div>
    <section className="panel scanner-panel">
      {loading && !tokens.length ? <LoadingRows /> : visible.length ? <TokenTable tokens={visible} onSelect={onSelect} columns={columns} onToggleWatch={toggleWatch} watchlist={watchlist} /> : <EmptyState title={tokens.length ? 'No tokens match these filters' : 'No live market data'} copy={tokens.length ? 'Try adjusting your search or minimum thresholds.' : 'The provider feed returned no tokens. Use refresh to check again.'} />}
      <div className="pagination"><span>Showing {filtered.length ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} tokens</span><div><button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}><ChevronLeft size={15} /></button><span>Page {page + 1} of {pageCount}</span><button aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage(Math.min(pageCount - 1, page + 1))}><ChevronRight size={15} /></button></div></div>
    </section>
    <div className="scanner-footnote"><ShieldAlert size={13} />Data reflects the selected DexScreener pair. Missing values are not estimated. Token age, concentration and contract risks require additional on-chain data sources.</div>
  </>
}

function RiskPage({ tokens, onSelect }: { tokens: Token[]; onSelect: (token: Token) => void }) {
  return <>
    <PageHeading eyebrow="RISK INTELLIGENCE" title="Know what’s unknown." description="Risk signals require verified on-chain and contract data. The current public feed is not sufficient to certify token safety." />
    <div className="risk-disclaimer"><ShieldAlert size={18} /><div><strong>Risk scoring is not available on this data source</strong><p>DexScreener provides market-pair metrics, not contract verification, holder concentration or insider-activity evidence. We deliberately do not assign risk scores from incomplete data.</p></div></div>
    <section className="panel risk-panel"><div className="panel-heading"><div><h2>Available market indicators</h2><p>Pair-level values only · not a token safety assessment</p></div><span className="data-badge">SOURCE VERIFIED</span></div>
      {tokens.length ? <div className="table-scroll"><table className="token-table risk-table"><thead><tr><th>TOKEN</th><th>LIQUIDITY</th><th>MARKET CAP</th><th>LIQUIDITY / MCAP</th><th>ASSESSMENT</th></tr></thead><tbody>{tokens.slice(0, 20).map((token) => {
        const ratio = token.liquidityUsd !== null && token.marketCap && token.marketCap > 0 ? token.liquidityUsd / token.marketCap : null
        return <tr key={token.pairAddress} className="clickable-row" onClick={() => onSelect(token)}><td><div className="token-identity"><div className="token-logo">{token.imageUrl ? <img src={token.imageUrl} alt="" /> : token.symbol.slice(0, 1)}</div><div className="token-names"><strong>{token.name}</strong><small>{token.symbol}</small></div></div></td><td className="mono">{compact(token.liquidityUsd)}</td><td className="mono">{compact(token.marketCap)}</td><td className="mono">{ratio === null ? '—' : `${(ratio * 100).toFixed(2)}%`}</td><td><span className="unassessed-pill">Not assessed</span></td></tr>
      })}</tbody></table></div> : <EmptyState title="No pair indicators available" copy="Live provider data will appear here when the feed is available." />}
    </section>
    <p className="compliance-note">Liquidity-to-market-cap ratio is a calculation from provider-reported figures, not a measure of withdrawal availability, concentration, or safety. Always verify independently.</p>
  </>
}

type TrainingSignal = {
  token: Token
  score: number
  label: 'Watch' | 'Moderate' | 'Strong study'
  confidence: number
  reasons: string[]
  invalidation: string
}

function calculateSignal(token: Token): TrainingSignal {
  let score = 50
  const reasons: string[] = []
  if (token.priceChange24h !== null) {
    if (token.priceChange24h >= 15) { score += 12; reasons.push('Strong positive 24h price momentum') }
    else if (token.priceChange24h >= 3) { score += 7; reasons.push('Positive 24h price momentum') }
    else if (token.priceChange24h < -15) { score -= 14; reasons.push('Material 24h drawdown') }
  }
  if (token.volume24h !== null && token.volume24h >= 250_000) { score += 10; reasons.push('Above-average observed 24h volume') }
  if (token.liquidityUsd !== null) {
    if (token.liquidityUsd >= 100_000) { score += 12; reasons.push('Liquidity is above $100K') }
    else if (token.liquidityUsd < 10_000) { score -= 15; reasons.push('Liquidity may be thin') }
  }
  if (token.marketCap !== null) {
    if (token.marketCap >= 100_000 && token.marketCap <= 25_000_000) { score += 5; reasons.push('Market cap falls inside an observed mid-range') }
  }
  if (token.txns24h !== null) {
    if (token.txns24h >= 1_000) { score += 6; reasons.push('Meaningful pair transaction activity') }
  }
  if (reasons.length === 0) reasons.push('Insufficient pair metrics for a meaningful study')
  score = Math.max(5, Math.min(95, score))
  const confidence = Math.max(20, Math.min(84, Math.round(score * 0.72)))
  return {
    token,
    score,
    confidence,
    label: score >= 75 ? 'Strong study' : score >= 58 ? 'Moderate' : 'Watch',
    reasons,
    invalidation: 'Invalidate the thesis if liquidity falls sharply, 24h volume collapses, or the price loses the latest observed range.',
  }
}

function AiPage({ tokens, onSelect }: { tokens: Token[]; onSelect: (token: Token) => void }) {
  const [prompt, setPrompt] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    { role: 'assistant', text: 'I build structured market studies from live pair data. Select a token or ask for momentum, liquidity, scenario ranges, invalidation levels and trade-risk planning.' },
  ])
  const ranked = tokens.map(calculateSignal).sort((a, b) => b.score - a.score)
  const selected = ranked.find((item) => item.token.address === selectedAddress)?.token ?? ranked[0]?.token
  const signal = selected ? calculateSignal(selected) : null

  const price = selected?.priceUsd
  const entryLow = price && price > 0 ? price * 0.985 : null
  const entryHigh = price && price > 0 ? price * 1.015 : null
  const target1 = price && price > 0 ? price * 1.08 : null
  const target2 = price && price > 0 ? price * 1.16 : null
  const invalidation = price && price > 0 ? price * 0.92 : null

  function scenarioLabel() {
    if (!signal) return 'No live setup'
    if (signal.score >= 75) return 'Momentum-weighted'
    if (signal.score >= 58) return 'Selective'
    return 'Defensive watch'
  }

  function submitPrompt() {
    const query = prompt.trim()
    if (!query) return
    const lower = query.toLowerCase()
    let answer = 'No meaningful conclusion can be made from the current feed alone.'
    if (lower.includes('momentum') || lower.includes('mover')) {
      const mover = [...tokens].sort((a, b) => (b.priceChange24h ?? -Infinity) - (a.priceChange24h ?? -Infinity))[0]
      answer = mover
        ? `${mover.symbol} leads observed 24h momentum at ${percentage(mover.priceChange24h)}. Before a trade study, check whether the move is supported by liquidity and transaction volume; a strong candle without participation can invalidate quickly.`
        : 'The live feed has no usable 24h price-change values.'
    } else if (lower.includes('liquid') || lower.includes('safe') || lower.includes('risk')) {
      const liquid = [...tokens].filter((token) => token.liquidityUsd !== null).sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0]
      answer = liquid
        ? `${liquid.symbol} has the highest displayed pair liquidity at ${compact(liquid.liquidityUsd)}. Use this only to assess execution friction and drawdown sensitivity—not contract safety or holder quality.`
        : 'No liquidity values are available in the current feed.'
    } else if (lower.includes('compare') || lower.includes('top') || lower.includes('rank')) {
      const ranked = tokens.map(calculateSignal).sort((a, b) => b.score - a.score).slice(0, 3)
      answer = ranked.length
        ? `Rule-based study ranking: ${ranked.map((item) => `${item.token.symbol} (${item.score}/100)`).join(', ')}. Scores summarize observable pair metrics and are not financial predictions.`
        : 'There are not enough live tokens to build a ranking.'
    } else if (lower.includes('trade') || lower.includes('entry') || lower.includes('scenario')) {
      if (!signal || !selected) {
        answer = 'No selected token or live price is available for a structured scenario.'
      } else {
        answer = `${selected.symbol}: observed entry review is ${compact(entryLow)}–${compact(entryHigh)}, indicative continuation zones are ${compact(target1)} and ${compact(target2)}, and a simple invalidation reference is below ${compact(invalidation)}. These are hypothetical planning levels derived from the latest price, not predictions or guaranteed exits.`
      }
    }
    setMessages((current) => [...current, { role: 'user', text: query }, { role: 'assistant', text: answer }])
    setPrompt('')
  }

  return <>
    <PageHeading eyebrow="AI TRADING INTELLIGENCE" title="Trade with context, not conviction." description="A structured research desk for scenario analysis, execution planning and risk validation." action={<span className="model-status"><span />LIVE LOCAL ENGINE</span>} />
    {selected && signal ? <div className="trade-ai-shell">
      <aside className="ai-universe panel">
        <div className="panel-heading"><div><h2>Market universe</h2><p>Ranked pair studies</p></div><Radar size={16} /></div>
        <div className="ai-universe-list">{ranked.slice(0, 10).map((item) => <button key={item.token.pairAddress} className={selected.address === item.token.address ? 'ai-universe-active' : ''} onClick={() => setSelectedAddress(item.token.address)}>
          <div className="ai-universe-token"><div className="token-logo">{item.token.imageUrl ? <img src={item.token.imageUrl} alt="" /> : item.token.symbol.slice(0, 1)}</div><div><strong>{item.token.symbol}</strong><span>{percentage(item.token.priceChange24h)}</span></div></div>
          <div className="ai-mini-score"><span style={{ width: `${item.score}%` }} /><strong>{item.score}</strong></div>
        </button>)}</div>
      </aside>
      <section className="trade-study panel">
        <div className="trade-study-head">
          <div className="trade-study-token"><div className="token-logo large-logo">{selected.imageUrl ? <img src={selected.imageUrl} alt="" /> : selected.symbol.slice(0, 1)}</div><div><span>SELECTED STUDY</span><h2>{selected.name} <b>{selected.symbol}</b></h2></div></div>
          <button className="button button-secondary" onClick={() => onSelect(selected)}><CandlestickChart size={14} />Open chart</button>
        </div>
        <div className="trade-price-row"><div><span>LAST OBSERVED</span><strong>{compact(selected.priceUsd)}</strong></div><div className={`trade-24 ${(selected.priceChange24h ?? 0) >= 0 ? 'positive' : 'negative'}`}><span>24H CHANGE</span><strong>{percentage(selected.priceChange24h)}</strong></div><div><span>STUDY MODE</span><strong>{scenarioLabel()}</strong></div><div><span>MODEL SCORE</span><strong>{signal.score}/100</strong></div></div>
        <div className="scenario-grid">
          <article className="scenario-card bullish"><div><span>BULL CASE</span><small>Conditional</small></div><strong>{target1 ? compact(target1) : '—'}</strong><p>Above entry support with sustained volume. Invalid if liquidity or participation contracts.</p></article>
          <article className="scenario-card base"><div><span>BASE CASE</span><small>Observed</small></div><strong>{entryLow && entryHigh ? `${compact(entryLow)}–${compact(entryHigh)}` : '—'}</strong><p>Wait for acceptance, spread stability and no accelerating sell volume.</p></article>
          <article className="scenario-card bearish"><div><span>BEAR CASE</span><small>Risk</small></div><strong>{invalidation ? compact(invalidation) : '—'}</strong><p>Below this reference, the thesis weakens unless market structure changes.</p></article>
        </div>
        <div className="trade-plan-grid">
          <article className="trade-plan panel-inset"><div className="inset-title"><Crosshair size={14} /><strong>Execution plan</strong></div><div className="plan-level"><span>Entry zone</span><b>{entryLow && entryHigh ? `${compact(entryLow)}–${compact(entryHigh)}` : '—'}</b></div><div className="plan-level"><span>Stop reference</span><b>{compact(invalidation)}</b></div><div className="plan-level"><span>Target 1</span><b>{compact(target1)}</b></div><div className="plan-level"><span>Target 2</span><b>{compact(target2)}</b></div></article>
          <article className="trade-plan panel-inset"><div className="inset-title"><Gauge size={14} /><strong>Confluence</strong></div>{signal.reasons.slice(0, 4).map((reason) => <div className="confluence-row" key={reason}><span><Check size={11} />{reason}</span><b>{Math.round(signal.confidence / 4)} pts</b></div>)}</article>
          <article className="trade-plan panel-inset"><div className="inset-title"><Scale size={14} /><strong>Risk validator</strong></div><div className="risk-meter"><span style={{ width: `${signal.confidence}%` }} /></div><div className="risk-copy"><strong>{signal.confidence}%</strong><span>data confidence</span></div><p>Confidence reflects available pair metrics, not success probability.</p></article>
        </div>
        <div className="trade-ai-disclaimer"><ShieldAlert size={13} /><span>Hypothetical levels. No stop-loss, target or score guarantees execution or profit. Confirm pair, liquidity and contract independently before paper or live action.</span></div>
      </section>
      <aside className="ai-chat panel">
        <div className="panel-heading"><div><h2>Research assistant</h2><p>Context-aware local engine</p></div><Bot size={16} /></div>
        <div className="chat-thread">{messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span>{message.role === 'assistant' ? 'AI' : 'YOU'}</span><p>{message.text}</p></div>)}</div>
        <div className="chat-composer"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitPrompt() }} placeholder="Ask for an entry, scenario or risk..." /><button aria-label="Send analysis request" onClick={submitPrompt}><ArrowUpRight size={15} /></button></div>
      </aside>
    </div> : <EmptyState title="Waiting for live market data" copy="Select a live pair when the market feed is available." />}
  </>
}

function TrainingPage({ tokens, onToast, onNavigatePaper }: { tokens: Token[]; onToast: (message: string) => void; onNavigatePaper: () => void }) {
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced')
  const [sizePercent, setSizePercent] = useState('2')
  const [timeframe, setTimeframe] = useState('15m')
  const [strategy, setStrategy] = useState<'momentum' | 'breakout' | 'mean-reversion'>('momentum')
  const [selectedAddress, setSelectedAddress] = useState('')
  const ranked = tokens.map(calculateSignal).sort((a, b) => b.score - a.score).slice(0, 8)
  const filtered = ranked.filter((item) => riskTolerance === 'conservative' ? item.score >= 70 : riskTolerance === 'balanced' ? item.score >= 58 : item.score >= 45)
  const selected = ranked.find((item) => item.token.address === selectedAddress) ?? filtered[0] ?? ranked[0]
  const positionSize = Math.max(0, Number(sizePercent) || 0)
  const price = selected?.token.priceUsd
  const stop = price ? price * (riskTolerance === 'conservative' ? 0.96 : riskTolerance === 'balanced' ? 0.93 : 0.90) : null
  const reward = price ? price * (strategy === 'breakout' ? 1.18 : strategy === 'mean-reversion' ? 1.09 : 1.14) : null
  const riskUnits = price && stop ? Math.max(0.01, (price - stop) / price) : null
  const rewardUnits = price && reward ? (reward - price) / price : null
  const rr = riskUnits && rewardUnits ? rewardUnits / riskUnits : null

  function saveLesson(item: TrainingSignal) {
    const saved = JSON.parse(localStorage.getItem('memescan-training') ?? '[]') as string[]
    const next = saved.includes(item.token.address) ? saved : [...saved, item.token.address]
    localStorage.setItem('memescan-training', JSON.stringify(next))
    onToast(`${item.token.symbol} saved to your training watchlist`)
  }

  return <>
    <PageHeading eyebrow="AI ASSISTED TRADING LAB" title="Train the process. Measure the risk." description="Strategy design, position planning and live-data scenario rehearsal—built for disciplined paper execution." action={<button className="button button-secondary" onClick={onNavigatePaper}><Wallet size={14} />Open paper desk</button>} />
    <div className="training-warning"><TriangleAlert size={16} /><div><strong>Simulation and educational analysis</strong><p>Levels are derived from the latest observed price and do not establish a real edge or guarantee execution. Historical validation is not yet available.</p></div></div>
    <div className="training-controls">
      <label><span>Risk profile</span><select value={riskTolerance} onChange={(event) => setRiskTolerance(event.target.value as typeof riskTolerance)}><option value="conservative">Conservative</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></select></label>
      <label><span>Practice position size</span><div className="percent-input"><input type="number" min="0" max="100" step="0.5" value={sizePercent} onChange={(event) => setSizePercent(event.target.value)} /><b>%</b></div></label>
      <label><span>Execution timeframe</span><select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}><option value="1m">1 minute</option><option value="5m">5 minutes</option><option value="15m">15 minutes</option><option value="1h">1 hour</option><option value="4h">4 hours</option></select></label>
      <div className="risk-budget"><span>Capital risk budget</span><strong>{positionSize}%</strong><small>of assigned portfolio</small></div>
    </div>
    {selected ? <div className="strategy-lab">
      <section className="panel strategy-candidates">
        <div className="panel-heading"><div><h2>Candidate universe</h2><p>{filtered.length} profile matches</p></div><SlidersIcon size={15} /></div>
        <div className="candidate-list">{filtered.length ? filtered.map((item) => <button className={selected.token.address === item.token.address ? 'candidate-active' : ''} key={item.token.pairAddress} onClick={() => setSelectedAddress(item.token.address)}>
          <div className="candidate-token"><div className="token-logo">{item.token.imageUrl ? <img src={item.token.imageUrl} alt="" /> : item.token.symbol.slice(0, 1)}</div><div><strong>{item.token.symbol}</strong><span>{percentage(item.token.priceChange24h)}</span></div></div>
          <div className="candidate-quality"><strong>{item.score}</strong><span>{item.label}</span></div>
        </button>) : <EmptyState title="No profile matches" copy="Wait for stronger pair metrics or adjust the risk profile." />}</div>
      </section>
      <section className="panel strategy-plan">
        <div className="strategy-plan-head"><div><span>ACTIVE THESIS</span><h2>{selected.token.name} <b>{selected.token.symbol}</b></h2></div><div className="strategy-tabs"><button className={strategy === 'momentum' ? 'active' : ''} onClick={() => setStrategy('momentum')}>Momentum</button><button className={strategy === 'breakout' ? 'active' : ''} onClick={() => setStrategy('breakout')}>Breakout</button><button className={strategy === 'mean-reversion' ? 'active' : ''} onClick={() => setStrategy('mean-reversion')}>Mean rev.</button></div></div>
        <div className="strategy-chart">
          <div className="chart-toolbar"><span>{timeframe} · Hypothetical planning view</span><div><button onClick={() => setTimeframe('5m')} className={timeframe === '5m' ? 'active' : ''}>5m</button><button onClick={() => setTimeframe('15m')} className={timeframe === '15m' ? 'active' : ''}>15m</button><button onClick={() => setTimeframe('1h')} className={timeframe === '1h' ? 'active' : ''}>1h</button></div></div>
          <RealPriceChart
            pairAddress={selected.token.pairAddress}
            timeframe={timeframe === '1h' || timeframe === '4h' ? 'hour' : timeframe === '1m' || timeframe === '5m' || timeframe === '15m' ? 'minute' : 'day'}
            aggregate={timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : 1}
          />
        </div>
        <div className="strategy-metrics">
          <div><span>Observed entry</span><strong>{compact(price)}</strong></div><div><span>Reference stop</span><strong>{compact(stop)}</strong></div><div><span>Planning target</span><strong>{compact(reward)}</strong></div><div><span>Reward / risk</span><strong>{rr ? `${rr.toFixed(2)}R` : '—'}</strong></div>
        </div>
        <div className="strategy-actions"><button className="button button-secondary" onClick={() => saveLesson(selected)}><Bookmark size={13} />Save as study</button><button className="button button-primary" onClick={onNavigatePaper}><Wallet size={13} />Create paper setup</button></div>
      </section>
    </div> : <EmptyState title="No trading studies available" copy="Live pair data is required to build a scenario." />}
  </>
}

type PaperPosition = { address: string; symbol: string; name: string; quantity: number; invested: number; entryPrice: number }
type PaperOrder = { id: string; symbol: string; side: 'BUY' | 'SELL'; quantity: number; price: number; at: number }
type PaperState = { cash: number; positions: PaperPosition[]; orders: PaperOrder[] }
const initialPaper: PaperState = { cash: 10_000, positions: [], orders: [] }

function PaperTrading({ tokens, onToast }: { tokens: Token[]; onToast: (message: string) => void }) {
  const [paper, setPaper] = useState<PaperState>(() => {
    try { return { ...initialPaper, ...JSON.parse(localStorage.getItem('memescan-paper') ?? '{}') as Partial<PaperState> } } catch { return initialPaper }
  })
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('100')
  const selected = tokens.find((token) => token.address === address) ?? tokens[0]
  const cash = Number.isFinite(paper.cash) ? paper.cash : initialPaper.cash
  const positionsValue = paper.positions.reduce((sum, position) => {
    const token = tokens.find((item) => item.address === position.address)
    return sum + position.quantity * (token?.priceUsd ?? position.entryPrice)
  }, 0)

  function execute(side: 'BUY' | 'SELL') {
    if (!selected || selected.priceUsd === null || selected.priceUsd <= 0) { onToast('A current provider price is required to place an order.'); return }
    const usd = Number(amount)
    if (!Number.isFinite(usd) || usd <= 0) { onToast('Enter a valid order amount.'); return }
    const existing = paper.positions.find((position) => position.address === selected.address)
    const quantity = usd / selected.priceUsd
    if (side === 'BUY' && usd > paper.cash) { onToast('Order exceeds available paper cash.'); return }
    if (side === 'SELL' && (!existing || quantity > existing.quantity)) { onToast('Sell amount exceeds this paper position.'); return }
    const nextPositions = side === 'BUY'
      ? existing
        ? paper.positions.map((position) => position.address === selected.address ? { ...position, quantity: position.quantity + quantity, invested: position.invested + usd, entryPrice: (position.invested + usd) / (position.quantity + quantity) } : position)
        : [...paper.positions, { address: selected.address, symbol: selected.symbol, name: selected.name, quantity, invested: usd, entryPrice: selected.priceUsd }]
      : paper.positions.map((position) => position.address === selected.address ? { ...position, quantity: position.quantity - quantity, invested: position.invested * (1 - quantity / position.quantity) } : position).filter((position) => position.quantity > 1e-12)
    const next: PaperState = {
      cash: side === 'BUY' ? paper.cash - usd : paper.cash + usd,
      positions: nextPositions,
      orders: [{ id: crypto.randomUUID(), symbol: selected.symbol, side, quantity, price: selected.priceUsd, at: Date.now() }, ...paper.orders].slice(0, 50),
    }
    setPaper(next)
    localStorage.setItem('memescan-paper', JSON.stringify(next))
    onToast(`${side === 'BUY' ? 'Bought' : 'Sold'} ${selected.symbol} in paper trading`)
  }

  return <>
    <PageHeading eyebrow="SIMULATED EXECUTION" title="Practice without exposure." description="Paper orders use the latest observed provider price. No real assets move and no order is sent to a venue." />
    <div className="paper-notice"><Wallet size={15} />SIMULATION ONLY <span>·</span> $10,000 virtual starting balance <button onClick={() => { const reset = { ...initialPaper }; setPaper(reset); localStorage.setItem('memescan-paper', JSON.stringify(reset)); onToast('Paper portfolio reset to $10,000') }}>Reset portfolio</button></div>
    <div className="paper-summary"><MetricCard label="Portfolio value" value={compact(cash + positionsValue)} meta="Cash + positions at latest available price" icon={<Wallet size={16} />} /><MetricCard label="Available cash" value={compact(cash)} meta="Virtual USD balance" icon={<Activity size={16} />} /><MetricCard label="Open positions" value={paper.positions.length.toString()} meta="Paper positions" icon={<LineChart size={16} />} /><MetricCard label="Realized P&L" value="—" meta="Not calculated in this release" icon={<ArrowUpRight size={16} />} /></div>
    <div className="paper-grid"><section className="panel order-panel"><div className="panel-heading"><div><h2>New paper order</h2><p>Market order · uses latest observed price</p></div><span className="paper-mode">PAPER</span></div><label className="form-field"><span>Token</span><select value={selected?.address ?? ''} onChange={(event) => setAddress(event.target.value)}>{tokens.map((token) => <option key={token.address} value={token.address}>{token.symbol} — {token.name}</option>)}</select></label><div className="order-price-line"><span>Latest provider price</span><strong>{selected ? compact(selected.priceUsd) : '—'}</strong></div><label className="form-field"><span>Order value (USD)</span><div className="amount-input"><span>$</span><input value={amount} type="number" min="0.01" step="1" onChange={(event) => setAmount(event.target.value)} /></div></label><div className="order-value-note">{selected?.priceUsd ? `Estimated quantity: ${(Number(amount) / selected.priceUsd).toLocaleString('en-US', { maximumSignificantDigits: 6 })} ${selected.symbol}` : 'A live price is required to estimate quantity.'}</div><div className="order-actions"><button className="button button-buy" onClick={() => execute('BUY')} disabled={!selected}>Buy · simulate</button><button className="button button-sell" onClick={() => execute('SELL')} disabled={!selected}>Sell · simulate</button></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Open positions</h2><p>Marked to latest provider price when available</p></div></div>{paper.positions.length ? <div className="position-list">{paper.positions.map((position) => { const price = tokens.find((token) => token.address === position.address)?.priceUsd ?? null; const value = position.quantity * (price ?? position.entryPrice); return <div className="position-row" key={position.address}><div><strong>{position.symbol}</strong><small>{position.name}</small></div><span>{position.quantity.toLocaleString('en-US', { maximumSignificantDigits: 6 })}</span><strong>{compact(value)}</strong></div> })}</div> : <EmptyState title="No open positions" copy="Use a paper order to start a simulated portfolio." />}</section></div>
    <section className="panel orders-panel"><div className="panel-heading"><div><h2>Order history</h2><p>Locally stored paper transactions</p></div><span className="orders-count">{paper.orders.length} orders</span></div>{paper.orders.length ? <div className="table-scroll"><table className="token-table"><thead><tr><th>TIME</th><th>SIDE</th><th>TOKEN</th><th>QUANTITY</th><th>OBSERVED PRICE</th><th>VALUE</th></tr></thead><tbody>{paper.orders.map((order) => <tr key={order.id}><td className="mono">{new Date(order.at).toLocaleString()}</td><td><span className={`order-side ${order.side.toLowerCase()}`}>{order.side}</span></td><td>{order.symbol}</td><td className="mono">{order.quantity.toLocaleString('en-US', { maximumSignificantDigits: 6 })}</td><td className="mono">{compact(order.price)}</td><td className="mono">{compact(order.quantity * order.price)}</td></tr>)}</tbody></table></div> : <EmptyState title="No paper orders yet" copy="Your simulated order history will appear here." />}</section>
  </>
}

function SettingsPage({ refreshSeconds, setRefreshSeconds }: { refreshSeconds: number; setRefreshSeconds: (value: number) => void }) {
  return <>
    <PageHeading eyebrow="PREFERENCES" title="Your workspace." description="Manage local market-feed preferences. No API credentials are stored in the browser." />
    <div className="settings-layout"><div className="settings-nav"><button className="settings-nav-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Settings2 size={15} />General</button><button onClick={() => document.getElementById('market-settings')?.scrollIntoView({ behavior: 'smooth' })}><Activity size={15} />Market data</button><button onClick={() => document.getElementById('provider-settings')?.scrollIntoView({ behavior: 'smooth' })}><Sparkles size={15} />AI providers</button></div>
      <div className="settings-main"><section className="panel settings-section" id="market-settings"><div className="settings-section-head"><div><h2>Market data</h2><p>Public market data is proxied through the local FastAPI service.</p></div></div><label className="setting-row"><span><strong>Refresh interval</strong><small>Automatically refresh the Solana feed.</small></span><select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))}><option value={0}>Manual only</option><option value={30}>Every 30 seconds</option><option value={60}>Every minute</option><option value={300}>Every 5 minutes</option></select></label><div className="setting-row"><span><strong>Market data provider</strong><small>DexScreener · boosted token feed and pair metrics</small></span><span className="connected-status"><span />Public API</span></div></section>
        <section className="panel settings-section" id="provider-settings"><div className="settings-section-head"><div><h2>AI provider</h2><p>AI is not configured in this workspace. Secrets must be stored server-side before enabling a provider.</p></div></div><div className="provider-placeholder"><Sparkles size={16} /><span>No AI provider configured</span><span className="coming-label">NOT ENABLED</span></div></section>
        <div className="privacy-note"><ShieldAlert size={15} /><span>API keys must never be placed in frontend environment variables. Provider credentials belong in backend secrets and should be write-only in settings.</span></div>
      </div>
    </div>
  </>
}

function TokenDialog({ token, onClose, onToast, onOpenPaper }: { token: Token; onClose: () => void; onToast: (message: string) => void; onOpenPaper: () => void }) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('15m')
  const [coinTab, setCoinTab] = useState<'overview' | 'trade' | 'alerts'>('overview')
  const [portfolioValue, setPortfolioValue] = useState('10000')
  const [riskPercent, setRiskPercent] = useState('1')
  const [entryPrice, setEntryPrice] = useState(token.priceUsd ? token.priceUsd.toString() : '')
  const [stopPrice, setStopPrice] = useState(token.priceUsd ? (token.priceUsd * 0.92).toFixed(10).replace(/0+$/, '') : '')
  const [targetPrice, setTargetPrice] = useState(token.priceUsd ? (token.priceUsd * 1.08).toFixed(10).replace(/0+$/, '') : '')
  const [alertPrice, setAlertPrice] = useState(token.priceUsd ? token.priceUsd.toString() : '')
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above')
  const [savedAlerts, setSavedAlerts] = useState<{ id: string; address: string; symbol: string; direction: 'above' | 'below'; price: number; at: number }[]>(() => {
    try { return (JSON.parse(localStorage.getItem('memescan-alerts') ?? '[]') as { id: string; address: string; symbol: string; direction: 'above' | 'below'; price: number; at: number }[]).filter((alert) => alert.address === token.address) } catch { return [] }
  })
  const [watching, setWatching] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('memescan-watchlist') ?? '[]') as string[]
      return saved.includes(token.address)
    } catch {
      return false
    }
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleWatch() {
    let saved: string[] = []
    try { saved = JSON.parse(localStorage.getItem('memescan-watchlist') ?? '[]') as string[] } catch { saved = [] }
    const next = watching ? saved.filter((address) => address !== token.address) : Array.from(new Set([...saved, token.address]))
    localStorage.setItem('memescan-watchlist', JSON.stringify(next))
    setWatching(!watching)
    onToast(watching ? `${token.symbol} removed from watchlist` : `${token.symbol} added to watchlist`)
  }

  function saveAlert() {
    const trigger = Number(alertPrice)
    if (!Number.isFinite(trigger) || trigger <= 0) {
      onToast('Enter a valid alert price')
      return
    }
    const key = `memescan-alerts`
    let saved: { id: string; address: string; symbol: string; direction: 'above' | 'below'; price: number; at: number }[] = []
    try { saved = JSON.parse(localStorage.getItem(key) ?? '[]') as typeof saved } catch { saved = [] }
    const next = [{ id: crypto.randomUUID(), address: token.address, symbol: token.symbol, direction: alertDirection, price: trigger, at: Date.now() }, ...saved].slice(0, 50)
    localStorage.setItem(key, JSON.stringify(next))
    setSavedAlerts((current) => [{ id: next[0].id, address: token.address, symbol: token.symbol, direction: alertDirection, price: trigger, at: next[0].at }, ...current].slice(0, 50))
    onToast(`${token.symbol} alert saved`)
  }

  const liquidityMarketCap = token.liquidityUsd !== null && token.marketCap && token.marketCap > 0
    ? (token.liquidityUsd / token.marketCap) * 100
    : null
  const portfolio = Number(portfolioValue)
  const risk = Number(riskPercent)
  const entry = Number(entryPrice)
  const stop = Number(stopPrice)
  const target = Number(targetPrice)
  const riskPerUnit = entry > 0 && stop > 0 ? Math.abs(entry - stop) : null
  const rewardPerUnit = entry > 0 && target > 0 ? target - entry : null
  const riskUsd = Number.isFinite(portfolio) && Number.isFinite(risk) ? portfolio * risk / 100 : 0
  const positionUsd = riskPerUnit && riskPerUnit > 0 && riskUsd > 0 ? riskUsd / riskPerUnit * entry : null
  const rewardRisk = rewardPerUnit !== null && riskPerUnit && riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : null
  const chartTimeframe = timeframe === '1d'
    ? { timeframe: 'day' as const, aggregate: 1 }
    : timeframe === '4h'
      ? { timeframe: 'hour' as const, aggregate: 240 }
      : timeframe === '1h'
        ? { timeframe: 'hour' as const, aggregate: 60 }
        : { timeframe: 'minute' as const, aggregate: timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : 15 }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="token-dialog" role="dialog" aria-modal="true" aria-label={`${token.name} token intelligence`}>
    <header className="dialog-header">
      <div className="dialog-identity">
        <div className="token-logo large-logo">{token.imageUrl ? <img src={token.imageUrl} alt="" /> : token.symbol.slice(0, 1)}</div>
        <div className="token-names"><strong>{token.name}</strong><small>{token.symbol}<span className="dialog-network">SOLANA</span><span>{formatAge(token.pairCreatedAt)} old</span></small></div>
      </div>
      <div className="dialog-header-actions">
        <button className={`button dialog-watch ${watching ? 'watching' : ''}`} onClick={toggleWatch}><Bookmark size={14} fill={watching ? 'currentColor' : 'none'} />{watching ? 'Watching' : 'Watchlist'}</button>
        <a className="button dialog-external" href={token.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />DexScreener</a>
        <button className="icon-button" aria-label="Close token details" onClick={onClose}><X size={17} /></button>
      </div>
    </header>

    <div className="dialog-market-strip">
      <div className="dialog-primary-price"><span>PRICE · USD</span><strong>{compact(token.priceUsd)}</strong></div>
      <div className="dialog-change"><span>24H CHANGE</span><strong className={(token.priceChange24h ?? 0) >= 0 ? 'positive' : 'negative'}>{percentage(token.priceChange24h)}</strong></div>
      <div><span>MARKET CAP</span><strong>{compact(token.marketCap)}</strong></div>
      <div><span>LIQUIDITY</span><strong>{compact(token.liquidityUsd)}</strong></div>
      <div><span>24H VOLUME</span><strong>{compact(token.volume24h)}</strong></div>
      <div><span>24H TXNS</span><strong>{shortNumber(token.txns24h)}</strong></div>
    </div>

    <div className="coin-workspace">
      <section className="coin-chart-column">
        <div className="coin-chart-toolbar">
          <div className="chart-timeframes">{(['1m','5m','15m','1h','4h','1d'] as const).map((value) => <button key={value} className={timeframe === value ? 'active' : ''} onClick={() => setTimeframe(value)}>{value}</button>)}</div>
          <div className="coin-tabs"><button className={coinTab === 'overview' ? 'active' : ''} onClick={() => setCoinTab('overview')}>Overview</button><button className={coinTab === 'trade' ? 'active' : ''} onClick={() => setCoinTab('trade')}>Trade plan</button><button className={coinTab === 'alerts' ? 'active' : ''} onClick={() => setCoinTab('alerts')}>Alerts</button></div>
          <div className="chart-status"><span />Real candles</div>
        </div>
        <RealPriceChart pairAddress={token.pairAddress} timeframe={chartTimeframe.timeframe} aggregate={chartTimeframe.aggregate} />
      </section>

      <aside className="coin-rail">
        {coinTab === 'overview' && <>
          <section className="coin-rail-section">
            <div className="coin-rail-heading"><span>PAIR OVERVIEW</span><LineChart size={14} /></div>
            <div className="coin-stat-row"><span>DEX</span><strong>{token.dexId}</strong></div>
            <div className="coin-stat-row"><span>Age</span><strong>{formatAge(token.pairCreatedAt)}</strong></div>
            <div className="coin-stat-row"><span>Liquidity / mcap</span><strong>{liquidityMarketCap === null ? '—' : `${liquidityMarketCap.toFixed(2)}%`}</strong></div>
            <div className="coin-stat-row"><span>Pair volume</span><strong>{compact(token.volume24h)}</strong></div>
          </section>
          <section className="coin-rail-section">
            <div className="coin-rail-heading"><span>MARKET STRUCTURE</span><ShieldAlert size={14} /></div>
            <div className="structure-row"><span>Momentum</span><strong className={(token.priceChange24h ?? 0) >= 0 ? 'positive' : 'negative'}>{percentage(token.priceChange24h)}</strong></div>
            <div className="structure-row"><span>Volume activity</span><strong>{shortNumber(token.txns24h)} txns</strong></div>
            <div className="structure-row"><span>Liquidity depth</span><strong>{token.liquidityUsd === null ? 'Unknown' : token.liquidityUsd >= 100_000 ? 'Deep' : token.liquidityUsd >= 10_000 ? 'Moderate' : 'Thin'}</strong></div>
          </section>
          <section className="coin-rail-section coin-address-section">
            <div className="coin-rail-heading"><span>BASE TOKEN</span><Check size={14} /></div>
            <code>{token.address}</code>
            <button onClick={async () => { try { await navigator.clipboard.writeText(token.address); onToast('Token address copied') } catch { onToast('Could not access the clipboard') } }}><Check size={12} />Copy address</button>
          </section>
        </>}

        {coinTab === 'trade' && <section className="coin-rail-section trade-plan-rail">
          <div className="coin-rail-heading"><span>POSITION PLANNER</span><Crosshair size={14} /></div>
          <label><span>Portfolio value</span><div className="coin-input-prefix"><b>$</b><input type="number" min="1" value={portfolioValue} onChange={(event) => setPortfolioValue(event.target.value)} /></div></label>
          <label><span>Account risk</span><div className="coin-input-prefix"><input type="number" min="0.1" max="100" step="0.1" value={riskPercent} onChange={(event) => setRiskPercent(event.target.value)} /><b>%</b></div></label>
          <label><span>Entry</span><input type="number" step="any" value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} /></label>
          <label><span>Stop</span><input type="number" step="any" value={stopPrice} onChange={(event) => setStopPrice(event.target.value)} /></label>
          <label><span>Target</span><input type="number" step="any" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} /></label>
          <div className="trade-plan-metrics">
            <div><span>Max risk</span><strong>{riskUsd > 0 ? compact(riskUsd) : '—'}</strong></div>
            <div><span>Position size</span><strong>{positionUsd !== null ? compact(positionUsd) : '—'}</strong></div>
            <div><span>Reward / risk</span><strong>{rewardRisk !== null ? `${rewardRisk.toFixed(2)}R` : '—'}</strong></div>
          </div>
          <button className="coin-primary-action" onClick={onOpenPaper}><Wallet size={13} />Create paper trade</button>
          <p className="trade-plan-note">Calculated as a planning estimate. Verify the stop, liquidity and spread before paper or live action.</p>
        </section>}

        {coinTab === 'alerts' && <section className="coin-rail-section alert-rail">
          <div className="coin-rail-heading"><span>PRICE ALERT</span><Bell size={14} /></div>
          <label><span>Direction</span><select value={alertDirection} onChange={(event) => setAlertDirection(event.target.value as 'above' | 'below')}><option value="above">Moves above</option><option value="below">Moves below</option></select></label>
          <label><span>Trigger price</span><input type="number" step="any" value={alertPrice} onChange={(event) => setAlertPrice(event.target.value)} /></label>
          <button className="coin-primary-action" onClick={saveAlert}><Bell size={13} />Save alert</button>
          <div className="saved-alert-list">
            <div className="saved-alert-heading"><span>Active local alerts</span><strong>{savedAlerts.length}</strong></div>
            {savedAlerts.length ? savedAlerts.map((alert) => <div className="saved-alert-row" key={alert.id}><div><strong>{alert.direction === 'above' ? 'Above' : 'Below'} {compact(alert.price)}</strong><span>{new Date(alert.at).toLocaleDateString()}</span></div><button aria-label="Delete alert" onClick={() => { const key = 'memescan-alerts'; let all: typeof savedAlerts = []; try { all = JSON.parse(localStorage.getItem(key) ?? '[]') as typeof savedAlerts } catch { all = [] } const next = all.filter((item) => item.id !== alert.id); localStorage.setItem(key, JSON.stringify(next)); setSavedAlerts(next.filter((item) => item.address === token.address)); onToast('Alert removed') }}><X size={12} /></button></div>) : <div className="saved-alert-empty">No alerts saved for this pair.</div>}
          </div>
        </section>}
      </aside>
    </div>
    <footer className="dialog-footer"><span>Provider: GeckoTerminal + DexScreener · Delays and incomplete data are possible</span><span>Not investment advice</span></footer>
  </section></div>
}

function LoadingRows() {
  return <div className="loading-state" role="status" aria-label="Connecting to market data">
    <div className="loading-skeleton-rows" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => <div className="loading-skeleton-row" key={index}>
        <span className="loading-skeleton-token"><i /><i /></span><span /><span /><span />
      </div>)}
    </div>
    <strong>Connecting to market data</strong>
    <span>Fetching the latest Solana pair metrics…</span>
  </div>
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><div className="empty-icon"><Search size={18} /></div><strong>{title}</strong><span>{copy}</span></div>
}

export default App
