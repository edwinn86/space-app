import { ArrowUpRight, Bookmark, Box, ChevronRight, Layers2, X } from 'lucide-react'
import { observatoryMeta } from '../data/observations'

export default function SidePanel({ item, onClose, onExplore }) {
  const previewTexture = item.deepTexture || item.texture
  return (
    <aside className="detail-panel">
      <div className="panel-actions">
        <button aria-label="Save observation"><Bookmark size={17} /></button>
        <button aria-label="Close details" onClick={onClose}><X size={18} /></button>
      </div>
      <p className="eyebrow">SELECTED OBSERVATION</p>
      <h1>{item.name}</h1>
      <p className="catalog">{item.catalog}</p>

      <div
        className={`object-art object-art--${item.id} ${previewTexture ? 'object-art--mapped' : ''} ${item.scope === 'solar' ? 'object-art--solar' : 'object-art--deep'}`}
        style={previewTexture ? { '--object-image': `url("${previewTexture}")` } : undefined}
      >
        {item.scope === 'solar' && previewTexture && <span className="object-preview-sphere" />}
        <span className="reticle" />
        <span className="image-credit">COMPOSITE VIEW · SIMULATED</span>
      </div>

      <div className="observed-by">
        <span>{item.scope === 'solar' ? 'POSITION SOURCE' : 'OBSERVED BY'}</span>
        <div>
          {item.scope === 'solar' ? (
            <span style={{ '--dot': '#8eb5bd' }}><i /> Live geocentric ephemeris</span>
          ) : (
            item.observatories.map((key) => (
              <span key={key} style={{ '--dot': observatoryMeta[key].color }}>
                <i /> {observatoryMeta[key].name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="facts">
        <div><small>DISTANCE</small><strong>{item.distance}</strong></div>
        <div><small>OBJECT TYPE</small><strong>{item.type}</strong></div>
        <div><small>RIGHT ASCENSION</small><strong>{(item.ra / 15).toFixed(2)}h</strong></div>
        <div><small>DECLINATION</small><strong>{item.dec >= 0 ? '+' : ''}{item.dec.toFixed(2)}°</strong></div>
      </div>

      <div className="model-provenance">
        <span className="provenance-icon"><Box size={15} /></span>
        <div>
          <small>MODEL PROVENANCE</small>
          <strong>{item.modelProvenance.level}</strong>
          <p>{item.modelProvenance.detail}</p>
          <em>{item.modelProvenance.confidence}</em>
        </div>
      </div>

      <button className="change-card">
        <span className="change-icon"><Layers2 size={18} /></span>
        <span><small>WHAT CHANGED?</small><strong>See what each wavelength reveals</strong></span>
        <ChevronRight size={18} />
      </button>

      <button className="explore-button" onClick={onExplore} disabled={item.id !== 'pillars'}>
        {item.id === 'pillars' ? 'Compare wavelengths' : 'Comparison coming soon'}
        <ArrowUpRight size={17} />
      </button>
    </aside>
  )
}
