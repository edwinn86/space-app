import { useCallback, useEffect, useRef, useState } from 'react'
import { Crosshair, Minus, Plus } from 'lucide-react'
import { observations, observatoryMeta } from '../data/observations'

const wrap180 = (angle) => ((angle + 180) % 360 + 360) % 360 - 180
const raHours = (degrees) => `${Math.floor((((degrees % 360) + 360) % 360) / 15)}h`

// IAU J2000 galactic-to-equatorial rotation, transposed for the inverse transform.
const galacticToEquatorial = (longitude) => {
  const l = longitude * Math.PI / 180
  const galactic = [Math.cos(l), Math.sin(l), 0]
  const matrix = [
    [-0.0548755604, 0.4941094279, -0.8676661490],
    [-0.8734370902, -0.4448296300, -0.1980763734],
    [-0.4838350155, 0.7469822445, 0.4559837762],
  ]
  const [x, y, z] = matrix.map((row) => row.reduce((sum, value, index) => sum + value * galactic[index], 0))
  return { ra: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360, dec: Math.asin(z) * 180 / Math.PI }
}

export default function SkyMap({ active, selected, onSelect, year }) {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const [viewport, setViewport] = useState({ width: 1000, height: 700 })
  const [center, setCenter] = useState({ ra: 180, dec: 0 })
  const [zoom, setZoom] = useState(1)

  const project = useCallback((ra, dec) => {
    const x = viewport.width / 2 - (wrap180(ra - center.ra) / 360) * viewport.width * zoom
    const y = viewport.height / 2 - ((dec - center.dec) / 180) * viewport.height * zoom
    return { x, y }
  }, [center, viewport, zoom])

  const visible = observations.filter(
    (item) => item.year <= year && (item.scope === 'solar' ? active.solar : item.observatories.some((scope) => active[scope])),
  )

  useEffect(() => {
    const stage = stageRef.current
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ratio = window.devicePixelRatio || 1
    canvas.width = viewport.width * ratio
    canvas.height = viewport.height * ratio
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    const context = canvas.getContext('2d')
    context.scale(ratio, ratio)
    context.clearRect(0, 0, viewport.width, viewport.height)

    context.lineWidth = 1
    context.strokeStyle = 'rgba(128, 147, 163, .13)'
    for (let dec = -75; dec <= 75; dec += 15) {
      context.beginPath()
      for (let ra = 0; ra <= 360; ra += 2) {
        const point = project(ra, dec)
        if (ra === 0) context.moveTo(point.x, point.y)
        else if (Math.abs(point.x - project(ra - 2, dec).x) < viewport.width / 2) context.lineTo(point.x, point.y)
      }
      context.stroke()
    }
    for (let ra = 0; ra < 360; ra += 15) {
      const start = project(ra, -90)
      const end = project(ra, 90)
      context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke()
    }

    context.strokeStyle = 'rgba(215, 181, 132, .28)'
    context.lineWidth = 18
    context.lineCap = 'round'
    context.beginPath()
    let previous
    for (let longitude = 0; longitude <= 360; longitude += 2) {
      const sky = galacticToEquatorial(longitude)
      const point = project(sky.ra, sky.dec)
      if (!previous || Math.abs(point.x - previous.x) > viewport.width / 2) context.moveTo(point.x, point.y)
      else context.lineTo(point.x, point.y)
      previous = point
    }
    context.stroke()
    context.strokeStyle = 'rgba(228, 205, 167, .32)'
    context.lineWidth = 1
    context.stroke()
  }, [project, viewport])

  const changeZoom = (amount) => setZoom((current) => Math.min(6, Math.max(1, current + amount)))

  const pointerDown = (event) => {
    dragRef.current = { x: event.clientX, y: event.clientY, ra: center.ra, dec: center.dec }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    setCenter({
      ra: (dragRef.current.ra + dx / viewport.width * 360 / zoom + 360) % 360,
      dec: Math.max(-70, Math.min(70, dragRef.current.dec + dy / viewport.height * 180 / zoom)),
    })
  }

  return (
    <main
      className="sky-stage"
      ref={stageRef}
      aria-label="Interactive 360 degree map of telescope observations"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={() => { dragRef.current = null }}
      onPointerCancel={() => { dragRef.current = null }}
      onWheel={(event) => changeZoom(event.deltaY > 0 ? -.25 : .25)}
    >
      <canvas className="celestial-reference" ref={canvasRef} />
      <div className="star-field" />

      {visible.map((item) => {
        const point = project(item.ra, item.dec)
        const onScreen = point.x > -100 && point.x < viewport.width + 100 && point.y > -80 && point.y < viewport.height + 80
        if (!onScreen) return null
        return (
          <button
            className={`observation ${selected.id === item.id ? 'selected' : ''}`}
            key={item.id}
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              '--glow': item.color,
              '--size': `${Math.max(item.size, item.fov * viewport.width * zoom / 360)}px`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(item)}
            aria-label={`Explore ${item.name} at right ascension ${item.ra} degrees, declination ${item.dec} degrees`}
          >
            <span className="observation-core" />
            <span className="observation-label">
              <strong>{item.name}</strong>
              <small>{item.catalog}</small>
            </span>
          </button>
        )
      })}

      <div className="map-caption">
        <span>EARTH-CENTERED CELESTIAL SPHERE</span>
        <strong>360° sky · J2000 coordinates</strong>
      </div>
      <div className="coordinate-readout">
        <span>CENTER</span>
        <strong>RA {raHours(center.ra)} · DEC {center.dec >= 0 ? '+' : ''}{center.dec.toFixed(1)}°</strong>
      </div>
      <div className="galactic-key"><i /> Galactic plane</div>

      <div className="telescope-legend">
        {Object.entries(observatoryMeta).map(([key, item]) => (
          <button key={key} className={active[key] ? '' : 'muted'} style={{ '--accent': item.color }}>
            <i /> <span>{item.name}</span>
          </button>
        ))}
      </div>

      <div className="map-tools">
        <button aria-label="Zoom in" onClick={() => changeZoom(.5)}><Plus size={18} /></button>
        <button aria-label="Zoom out" onClick={() => changeZoom(-.5)}><Minus size={18} /></button>
        <button aria-label="Reset full sky" onClick={() => { setCenter({ ra: 180, dec: 0 }); setZoom(1) }}><Crosshair size={18} /></button>
      </div>
    </main>
  )
}
