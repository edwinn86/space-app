import { lazy, Suspense, useCallback, useState } from 'react'
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
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [viewMode, setViewMode] = useState('planetarium')

  const toggleScope = (scope) => setActive((current) => ({ ...current, [scope]: !current[scope] }))
  const handleSelect = useCallback((item) => {
    setSelected(item)
    setPanelOpen(true)
  }, [])

  return (
    <div className="app-shell">
      {comparisonOpen && <ComparisonView onClose={() => setComparisonOpen(false)} />}
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
          <button className="search-button" onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={16} /> <span>Search the universe</span> <kbd>⌘ K</kbd>
          </button>
          <button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-popover">
          <Search size={18} />
          <input autoFocus placeholder="Galaxy, nebula, catalog number…" />
          <span>ESC</span>
        </div>
      )}

      <section className="workspace">
        <div className="map-wrap">
          {viewMode === 'planetarium' ? (
            <Suspense fallback={<div className="planetarium-loading">Building your view of the sky…</div>}>
              <Planetarium
                active={active}
                selected={selected}
                year={year}
                onSelect={handleSelect}
              />
            </Suspense>
          ) : viewMode === 'depth' ? (
            <Suspense fallback={<div className="planetarium-loading">Building the distance model…</div>}>
              <DepthModel
                active={active}
                selected={selected}
                year={year}
                onSelect={handleSelect}
              />
            </Suspense>
          ) : (
            <SkyMap
              active={active}
              selected={selected}
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
