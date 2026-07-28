import { useState } from 'react'
import { ArrowLeft, ExternalLink, Info, RotateCcw, X } from 'lucide-react'

const modes = {
  visible: { label: 'Visible / UV', telescope: 'Hubble', value: 0 },
  infrared: { label: 'Infrared', telescope: 'Webb', value: 100 },
  xray: { label: 'X-ray', telescope: 'Chandra', value: 100 },
}

export default function ComparisonView({ onClose }) {
  const [mix, setMix] = useState(58)
  const [mode, setMode] = useState('mix')
  const [notesOpen, setNotesOpen] = useState(true)

  const chooseMode = (next) => {
    setMode(next)
    if (next !== 'xray') setMix(modes[next].value)
  }

  return (
    <section className="comparison-view" aria-label="Pillars of Creation wavelength comparison">
      <header className="comparison-header">
        <button className="back-button" onClick={onClose}><ArrowLeft size={17} /> Back to sky</button>
        <div>
          <p>SAME SKY, DIFFERENT EYES</p>
          <h2>Pillars of Creation</h2>
        </div>
        <button className="close-comparison" onClick={onClose} aria-label="Close comparison"><X size={19} /></button>
      </header>

      <div className="comparison-canvas">
        <div className="pillar-layer hubble-layer" />
        <div
          className="pillar-layer webb-layer"
          style={{ clipPath: `inset(0 0 0 ${100 - mix}%)`, opacity: mode === 'xray' ? .18 : 1 }}
        />
        <div className={`pillar-layer chandra-layer ${mode === 'xray' ? 'visible' : ''}`} />
        <div className="canvas-vignette" />
        {mode !== 'xray' && <div className="split-line" style={{ left: `${100 - mix}%` }}><span /></div>}

        <div className="image-label image-label--left">
          <span className="hubble-dot" /> HUBBLE
          <small>VISIBLE LIGHT · 2014</small>
        </div>
        <div className="image-label image-label--right">
          <span className={mode === 'xray' ? 'chandra-dot' : 'webb-dot'} />
          {mode === 'xray' ? 'CHANDRA' : 'WEBB'}
          <small>{mode === 'xray' ? 'X-RAY + OPTICAL · 2007' : 'NEAR-INFRARED · 2022'}</small>
        </div>

        <button className="reset-view" onClick={() => { setMode('mix'); setMix(58) }}>
          <RotateCcw size={14} /> Reset view
        </button>
      </div>

      <div className="light-mixer">
        <div className="mixer-title">
          <span>LIGHT MIXER</span>
          <small>Choose a wavelength or drag to crossfade</small>
        </div>
        <div className="wavelength-buttons">
          {Object.entries(modes).map(([key, item]) => (
            <button key={key} className={mode === key ? 'active' : ''} onClick={() => chooseMode(key)}>
              <i className={`${key}-dot`} />
              <span><strong>{item.label}</strong><small>{item.telescope}</small></span>
            </button>
          ))}
          <button className={mode === 'mix' ? 'active' : ''} onClick={() => setMode('mix')}>
            <i className="mix-dot" />
            <span><strong>Compare</strong><small>Hubble + Webb</small></span>
          </button>
        </div>
        <input
          className="mix-range"
          type="range"
          min="0"
          max="100"
          value={mix}
          onChange={(event) => { setMix(Number(event.target.value)); setMode('mix') }}
          aria-label="Crossfade between Hubble and Webb imagery"
        />
      </div>

      <aside className={`science-notes ${notesOpen ? 'open' : ''}`}>
        <button className="notes-toggle" onClick={() => setNotesOpen(!notesOpen)}>
          <Info size={16} /> What changed?
        </button>
        <div className="notes-content">
          <p className="eyebrow">WHAT CHANGED?</p>
          <h3>Dust becomes a window.</h3>
          <p>
            Hubble’s visible-light view traces the opaque edges of the cold columns. Webb’s
            near-infrared view passes through more of that dust, revealing many newly formed
            stars and energetic jets hidden in the familiar silhouette.
          </p>
          <div className="finding">
            <span>THE EVIDENCE</span>
            <strong>More precise counts of newborn stars and clearer views of gas-and-dust structure.</strong>
          </div>
          <div className="confidence">
            <span>SCIENTIFIC CONFIDENCE</span><strong>High</strong><i><b /></i>
          </div>
          <p className="xray-note">
            <span className="chandra-dot" /> Chandra adds the high-energy sources: young stars
            that emit X-rays. Surprisingly few are embedded inside the pillars themselves.
          </p>
          <a href="https://science.nasa.gov/missions/webb/nasas-webb-takes-star-filled-portrait-of-pillars-of-creation/" target="_blank" rel="noreferrer">
            Read the NASA science release <ExternalLink size={13} />
          </a>
          <small className="credit">IMAGES: NASA, ESA, CSA, STScI · NASA/CXC/INAF</small>
        </div>
      </aside>
    </section>
  )
}
