import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CircleHelp, Crosshair, Layers3, Menu, Search, Sparkles } from 'lucide-react'
import SkyMap from './components/SkyMap'
import SidePanel from './components/SidePanel'
import ComparisonView from './components/ComparisonView'
import { observations, observatoryMeta } from './data/observations'

const Planetarium = lazy(() => import('./components/Planetarium'))
const DepthModel = lazy(() => import('./components/DepthModel'))

export default function App() {
  const [active, setActive] = useState({ webb: true, hubble: true, chandra: true, solar: true })
  const [selected, setSelected] = useState(observations[0])
  const [panelOpen, setPanelOpen] = useState(true)
  const [year, setYear] = useState(2024)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)
  const [focusRequest, setFocusRequest] = useState(0)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [viewMode, setViewMode] = useState('planetarium')

  const toggleScope = (scope) => setActive((current) => ({ ...current, [scope]: !current[scope] }))
  const handleSelect = useCallback((item) => {
    setSelected(item)
    setPanelOpen(true)
    setFocusRequest((request) => request + 1)
  }, [])

  const searchResults = useMemo(() => {
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return observations
      .map((item) => {
        const name = item.name.toLowerCase()
        const catalog = item.catalog?.toLowerCase() || ''
        const searchable = `${name} ${catalog} ${item.type || ''} ${item.visual || ''}`.toLowerCase()
        const score = terms.reduce((total, term) => {
          if (!searchable.includes(term)) return -100
          if (name.startsWith(term)) return total + 5
          if (catalog.includes(term)) return total + 3
          return total + 1
        }, 0)
        return { item, score }
      })
      .filter(({ score }) => terms.length === 0 || score >= 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 10)
      .map(({ item }) => item)
  }, [searchQuery])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchIndex(0)
  }, [])

  const chooseSearchResult = useCallback((item) => {
    if (!item) return
    setYear((current) => Math.max(current, item.year))
    setActive((current) => {
      if (item.scope === 'solar') return { ...current, solar: true }
      return item.observatories.reduce((next, scope) => ({ ...next, [scope]: true }), current)
    })
    setComparisonOpen(false)
    handleSelect(item)
    closeSearch()
  }, [closeSearch, handleSelect])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        return
      }
      if (!searchOpen) return
      if (event.key === 'Escape') closeSearch()
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSearchIndex((index) => Math.min(index + 1, searchResults.length - 1))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSearchIndex((index) => Math.max(index - 1, 0))
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        chooseSearchResult(searchResults[searchIndex])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [chooseSearchResult, closeSearch, searchIndex, searchOpen, searchResults])

  useEffect(() => setSearchIndex(0), [searchQuery])

  return (
    <div className="app-shell">
      {comparisonOpen && <ComparisonView item={selected} onClose={() => setComparisonOpen(false)} />}
      <header className="topbar">
        <button className="icon-button mobile-only" aria-label="Open menu"><Menu size={19} /></button>
        <a className="brand" href="#">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>THE OBSERVED <strong>UNIVERSE</strong></span>
        </a>
        <nav>
          <button className="active">Sky</button>
          <button>Signals <span className="signal-dot" /></button>
          <button>Briefing</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-backdrop" onPointerDown={closeSearch}>
          <div className="search-popover" role="dialog" aria-label="Search the universe" onPointerDown={(event) => event.stopPropagation()}>
            <div className="search-input-row">
              <Search size={18} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search planets, galaxies, nebulae, or catalog numbers…"
                aria-label="Search celestial bodies"
              />
              <kbd>ESC</kbd>
            </div>
            <div className="search-results" role="listbox">
              <div className="search-results-heading">{searchQuery ? 'RESULTS' : 'EXPLORE THE CATALOG'}</div>
              {searchResults.map((item, index) => (
                <button
                  key={item.id}
                  className={index === searchIndex ? 'active' : ''}
                  onPointerMove={() => setSearchIndex(index)}
                  onClick={() => chooseSearchResult(item)}
                  role="option"
                  aria-selected={index === searchIndex}
                >
                  <i style={{ '--object-color': item.color }} />
                  <span><strong>{item.name}</strong><small>{item.catalog}</small></span>
                  <em>{item.type}</em>
                  <Crosshair size={15} />
                </button>
              ))}
              {searchResults.length === 0 && <div className="search-empty">No celestial bodies match “{searchQuery}”.</div>}
            </div>
            <div className="search-hint"><span>↑↓ Navigate</span><span>↵ Select &amp; zoom</span></div>
          </div>
        </div>
      )}

      <section className="workspace">
        <div className="map-wrap">
          <button className="celestial-search-launcher" onClick={() => setSearchOpen(true)}>
            <span className="celestial-search-icon"><Search size={18} /></span>
            <span>
              <strong>Find a celestial body</strong>
              <small>Planets, galaxies, nebulae, and catalog numbers</small>
            </span>
            <kbd>Ctrl K</kbd>
          </button>

          {viewMode === 'planetarium' ? (
            <Suspense fallback={<div className="planetarium-loading">Building your view of the sky…</div>}>
              <Planetarium
                active={active}
                selected={selected}
                focusRequest={focusRequest}
                year={year}
                onSelect={handleSelect}
              />
            </Suspense>
          ) : viewMode === 'depth' ? (
            <Suspense fallback={<div className="planetarium-loading">Building the distance model…</div>}>
              <DepthModel
                active={active}
                selected={selected}
                focusRequest={focusRequest}
                year={year}
                onSelect={handleSelect}
              />
            </Suspense>
          ) : (
            <SkyMap
              active={active}
              selected={selected}
              focusRequest={focusRequest}
              year={year}
              onSelect={handleSelect}
            />
          )}

          <div className="mode-tabs">
            <button className={viewMode === 'planetarium' ? 'active' : ''} onClick={() => setViewMode('planetarium')}>
              <Sparkles size={14} /> Planetarium
            </button>
            <button className={viewMode === 'atlas' ? 'active' : ''} onClick={() => setViewMode('atlas')}>
              <Crosshair size={14} /> Sky atlas
            </button>
            <button className={viewMode === 'depth' ? 'active' : ''} onClick={() => setViewMode('depth')}>
              <Layers3 size={14} /> Depth model
            </button>
          </div>

          <div className="filter-bar">
            <span className="filter-title">OBSERVATORIES</span>
            {Object.entries(observatoryMeta).map(([key, item]) => (
              <button
                key={key}
                className={active[key] ? 'on' : ''}
                onClick={() => toggleScope(key)}
                style={{ '--accent': item.color }}
              >
                <i /> <span><strong>{item.name}</strong><small>{item.detail}</small></span>
              </button>
            ))}
            <button
              className={active.solar ? 'on' : ''}
              onClick={() => toggleScope('solar')}
              style={{ '--accent': '#8ec7c7' }}
            >
              <i /><span><strong>Solar system</strong><small>Live positions</small></span>
            </button>
          </div>

          <div className="timeline">
            <div className="timeline-heading"><span>COSMIC TIME</span><strong>{year}</strong></div>
            <input
              type="range"
              min="1990"
              max="2024"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              aria-label="Observation year"
            />
            <div className="timeline-years"><span>1990</span><span>2000</span><span>2010</span><span>2020</span><span>NOW</span></div>
          </div>
        </div>
        {panelOpen && (
          <SidePanel
            item={selected}
            onClose={() => setPanelOpen(false)}
            onExplore={() => setComparisonOpen(true)}
          />
        )}
      </section>
    </div>
  )
}
