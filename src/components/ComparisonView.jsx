import { useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, Info, RotateCcw, X } from 'lucide-react'
import { wavelengthComparisons } from '../data/wavelengthComparisons'

const scienceByVisual = {
  nebula: {
    title: 'Dust changes from wall to window.',
    body: 'Visible light emphasizes glowing gas and opaque dust. Infrared penetrates more of that dust to expose embedded stars and cooler structure, while X-rays isolate the hottest young stars and energetic shocks.',
    evidence: 'Registered observations separate stellar, dusty, and high-energy components in the same field.',
  },
  remnant: {
    title: 'The explosion separates into layers.',
    body: 'Visible light traces expanding filaments while X-rays map particles and gas energized to extreme temperatures by the remnant and its central pulsar.',
    evidence: 'The archive images locate physically different structures inside the same supernova remnant.',
  },
  'black-hole': {
    title: 'The scale changes by millions.',
    body: 'EHT radio interferometry resolves glowing material immediately around the black hole shadow. Chandra observes hot gas and flares across the much larger Galactic Center environment.',
    evidence: 'The radio ring spans roughly ten light-minutes; the X-ray field spans roughly seven light-years.',
  },
  default: {
    title: 'One object becomes several physical stories.',
    body: 'Each archived observation responds to a different wavelength and physical process, separating stars, dust, gas, and high-energy activity.',
    evidence: 'These are real telescope datasets, not color treatments of the app model.',
  },
}

const bandLabels = {
  visible: 'Visible light',
  infrared: 'Infrared',
  ultraviolet: 'Ultraviolet',
  xray: 'X-ray',
  radio: 'Radio / radar',
  multi: 'Multiwavelength',
}

function WavelengthLayer({ channel, className = '', style }) {
  const spriteClass = channel.sprite ? `wavelength-layer--sprite-${channel.sprite}` : ''
  const cropClass = channel.crop ? `wavelength-layer--crop-${channel.crop}` : ''
  return (
    <div
      className={`wavelength-layer wavelength-layer--archive ${spriteClass} ${cropClass} ${className}`}
      style={{ '--comparison-image': `url("${channel.image}")`, ...style }}
    />
  )
}

function ChannelLabel({ channel, position = 'left' }) {
  return (
    <div className={`image-label image-label--${position}`}>
      <span className={`${channel.key}-dot`} /> {channel.telescope.toUpperCase()}
      {channel.framing && <small>{channel.framing.toUpperCase()}</small>}
      <small>{channel.band} · {channel.date}</small>
    </div>
  )
}

export default function ComparisonView({ item, onClose }) {
  const dataset = wavelengthComparisons[item.id]
  const channels = dataset.channels
  const decoratedChannels = channels.map((channel, index) => ({ ...channel, id: channel.id || `${channel.key}-${index}` }))
  const bandGroups = decoratedChannels.reduce((groups, channel) => {
    const group = groups.find((entry) => entry.key === channel.key)
    if (group) group.channels.push(channel)
    else groups.push({ key: channel.key, channels: [channel] })
    return groups
  }, [])
  const hasMultiple = bandGroups.length > 1
  const canCompare = hasMultiple && dataset.comparable !== false
  const [selectedByBand, setSelectedByBand] = useState(
    () => Object.fromEntries(bandGroups.map((group) => [
      group.key,
      (group.channels.find((channel) => channel.default) || group.channels[0]).id,
    ])),
  )
  const [openBand, setOpenBand] = useState(null)
  const [mix, setMix] = useState(50)
  const [mode, setMode] = useState(canCompare ? 'mix' : decoratedChannels[0].id)
  const [notesOpen, setNotesOpen] = useState(true)
  const mixDragging = useRef(false)
  const canvasDragging = useRef(false)
  const selectedChannels = bandGroups.map(
    (group) => group.channels.find((channel) => channel.id === selectedByBand[group.key])
      || group.channels.find((channel) => channel.default)
      || group.channels[0],
  )
  const left = selectedChannels[0]
  const right = selectedChannels[1]
  const science = scienceByVisual[item.visual] || scienceByVisual.default
  const selectedChannel = decoratedChannels.find((channel) => channel.id === mode)
  const shownChannel = mode === 'mix' ? left : selectedChannel || left
  const canCrossfade = canCompare && mode === 'mix' && dataset.aligned

  const updateMix = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setMix(Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))))
  }
  const handleMixKey = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setMix((current) => Math.max(0, current - 5))
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setMix((current) => Math.min(100, current + 5))
    }
    if (event.key === 'Home') setMix(0)
    if (event.key === 'End') setMix(100)
  }

  return (
    <section className="comparison-view" aria-label={`${item.name} archival wavelength comparison`}>
      <header className="comparison-header">
        <button className="back-button" onClick={onClose}><ArrowLeft size={17} /> Back to sky</button>
        <div><p>ARCHIVAL LIGHT STUDY</p><h2>{item.name}</h2></div>
        <button className="close-comparison" onClick={onClose} aria-label="Close comparison"><X size={19} /></button>
      </header>

      <div
        className={`comparison-canvas ${canCrossfade ? 'comparison-canvas--interactive' : ''}`}
        onPointerDown={(event) => {
          if (!canCrossfade) return
          canvasDragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          updateMix(event)
        }}
        onPointerMove={(event) => {
          if (canCrossfade && canvasDragging.current) updateMix(event)
        }}
        onPointerUp={(event) => {
          if (!canvasDragging.current) return
          updateMix(event)
          canvasDragging.current = false
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { canvasDragging.current = false }}
      >
        {canCompare && mode === 'mix' && !dataset.aligned ? (
          <div className="unaligned-comparison">
            <div className="unaligned-panel">
              <WavelengthLayer channel={left} />
              <ChannelLabel channel={left} position="left" />
            </div>
            <div className="unaligned-panel">
              <WavelengthLayer channel={right} />
              <ChannelLabel channel={right} position="right" />
            </div>
            <div className="scale-warning">
              <span>NOT THE SAME SCALE</span>
              <strong>{dataset.scale}</strong>
            </div>
          </div>
        ) : (
          <>
            <WavelengthLayer channel={shownChannel} className="comparison-base" />
            {canCrossfade && (
              <>
                <WavelengthLayer channel={right} className="comparison-reveal" style={{ clipPath: `inset(0 0 0 ${mix}%)` }} />
                <div className="split-line" style={{ left: `${mix}%` }}><span /></div>
              </>
            )}
            <ChannelLabel channel={shownChannel} position="left" />
            {canCrossfade && <ChannelLabel channel={right} position="right" />}
          </>
        )}
        <div className="canvas-vignette" />

        {mode !== 'mix' && (
          <div className="archive-credit">
            <span>{shownChannel.credit}</span>
            <strong>{shownChannel.detail}</strong>
          </div>
        )}
        {canCompare && dataset.aligned && (
          <button
            className="reset-view"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => { setMode('mix'); setMix(50) }}
          >
            <RotateCcw size={14} /> Reset comparison
          </button>
        )}
      </div>

      <div className="light-mixer">
        <div className="mixer-title">
          <span>OBSERVED WAVELENGTHS</span>
          <small>{!canCompare
            ? hasMultiple ? 'Separate archival observations' : 'One verified archival observation'
            : dataset.aligned
              ? 'Registered archive images · drag the image divider'
              : 'Shown separately because the physical scales differ'}</small>
        </div>
        <div className="wavelength-buttons">
          {bandGroups.map((group) => {
            const channel = selectedChannels.find((entry) => entry.key === group.key)
            return (
              <div className="wavelength-group" key={group.key}>
                <button
                  className={mode === channel.id || openBand === group.key ? 'active' : ''}
                  aria-expanded={group.channels.length > 1 ? openBand === group.key : undefined}
                  onClick={() => {
                    if (group.channels.length > 1) {
                      setOpenBand((current) => current === group.key ? null : group.key)
                    } else {
                      setMode(channel.id)
                      setOpenBand(null)
                    }
                  }}
                >
                  <i className={`${group.key}-dot`} />
                  <span><strong>{bandLabels[group.key] || channel.label}</strong><small>{group.channels.length > 1 ? channel.label : channel.telescope}</small></span>
                </button>
                {group.channels.length > 1 && (
                  openBand === group.key && (
                      <div className="wavelength-variants">
                        <small>CHOOSE OBSERVATION</small>
                        {group.channels.map((variant) => (
                          <button
                            key={variant.id}
                            className={variant.id === channel.id ? 'active' : ''}
                            onClick={() => {
                              setSelectedByBand((current) => ({ ...current, [group.key]: variant.id }))
                              setMode(variant.id)
                              setOpenBand(null)
                            }}
                          >
                            <strong>{variant.label}</strong>
                            <span>{variant.telescope} · {variant.date}</span>
                          </button>
                        ))}
                      </div>
                  )
                )}
              </div>
            )
          })}
          {canCompare && (
            <button className={mode === 'mix' ? 'active' : ''} onClick={() => { setMode('mix'); setMix(50) }}>
              <i className="mix-dot" />
              <span><strong>Compare</strong><small>{dataset.aligned ? 'Registered view' : 'Separate scales'}</small></span>
            </button>
          )}
        </div>
        {canCrossfade && (
          <div
            className="mix-range"
            role="slider"
            tabIndex="0"
            aria-label={`Crossfade between ${left.telescope} and ${right.telescope}`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={mix}
            style={{ '--mix': `${mix}%` }}
            onKeyDown={handleMixKey}
            onPointerDown={(event) => {
              mixDragging.current = true
              event.currentTarget.setPointerCapture(event.pointerId)
              updateMix(event)
            }}
            onPointerMove={(event) => {
              if (mixDragging.current) updateMix(event)
            }}
            onPointerUp={(event) => {
              updateMix(event)
              mixDragging.current = false
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={() => { mixDragging.current = false }}
          >
            <i className="mix-range__track" />
            <i className="mix-range__thumb" />
          </div>
        )}
      </div>

      <aside className={`science-notes ${notesOpen ? 'open' : ''}`}>
        <button className="notes-toggle" onClick={() => setNotesOpen(!notesOpen)}><Info size={16} /> What changed?</button>
        <div className="notes-content">
          <p className="eyebrow">WHAT CHANGED?</p>
          <h3>{science.title}</h3>
          <p>{science.body}</p>
          <div className="finding"><span>THE EVIDENCE</span><strong>{science.evidence}</strong></div>
          <div className="confidence"><span>DATA STATUS</span><strong>Archival observation</strong><i><b /></i></div>
          <p className="xray-note"><strong>Scale:</strong> {dataset.scale}</p>
          <a
            href={shownChannel.sourceUrl || dataset.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {shownChannel.sourceLabel || dataset.sourceLabel} <ExternalLink size={13} />
          </a>
          <small className="credit">{channels.map((channel) => channel.credit).join(' · ')}</small>
        </div>
      </aside>
    </section>
  )
}
