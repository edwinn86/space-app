import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { observations } from '../data/observations'
import { createDeepSkyModel } from '../utils/deepSkyModels'

const depthRadius = (item) => {
  if (item.scope === 'solar') {
    const distanceAu = Math.max(item.distanceLy * 63241.077, .0024)
    const normalizedSolarDistance = (Math.log10(distanceAu) + 2.62) / 4.12
    return .45 + Math.max(0, Math.min(1, normalizedSolarDistance)) * 2.45
  }
  const { distanceLy } = item
  const normalized = (Math.log10(Math.max(distanceLy, .0001)) + 4) / 13.7
  return 1.35 + Math.max(0, Math.min(1, normalized)) * 7.15
}

const toVector = (item) => {
  const ra = THREE.MathUtils.degToRad(item.ra)
  const dec = THREE.MathUtils.degToRad(item.dec)
  const radius = depthRadius(item)
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.sin(ra),
  )
}

const createObjectModel = (item) => {
  if (item.scope !== 'solar') return createDeepSkyModel(item)
  const group = new THREE.Group()
  const color = new THREE.Color(item.color)
  if (item.visual === 'galaxy') {
    const disk = new THREE.Mesh(
      new THREE.RingGeometry(.12, .42, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    )
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(.13, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xffead1 }),
    )
    if (item.profile === 'edge-on') disk.scale.y = .18
    group.add(disk, core)
  } else if (item.visual === 'nebula') {
    for (let index = 0; index < 8; index += 1) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(.16 + index % 3 * .055, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .08 + index % 3 * .035, blending: THREE.AdditiveBlending, depthWrite: false }),
      )
      cloud.position.set(
        Math.sin(index * 2.4) * .25,
        Math.cos(index * 1.7) * .18,
        Math.sin(index * 3.2) * .14,
      )
      group.add(cloud)
    }
  } else if (item.visual === 'remnant') {
    group.add(new THREE.Mesh(
      new THREE.TorusGeometry(.27, .035, 10, 52),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .82, blending: THREE.AdditiveBlending }),
    ))
  } else if (item.visual === 'cluster') {
    for (let index = 0; index < 12; index += 1) {
      const point = new THREE.Mesh(
        new THREE.SphereGeometry(.025, 7, 7),
        new THREE.MeshBasicMaterial({ color }),
      )
      point.position.set(Math.sin(index * 2.4) * .3, Math.cos(index * 1.9) * .27, Math.sin(index * 1.3) * .24)
      group.add(point)
    }
  } else {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(item.visual === 'star' ? .24 : .18, 28, 28),
      new THREE.MeshBasicMaterial({ color }),
    )
    group.add(body)
    if (item.visual === 'star') {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(.31, 24, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false }),
      ))
    }
    if (!item.texture && (item.surface === 'jovian' || item.surface === 'saturnian')) {
      const bandColor = item.surface === 'jovian' ? 0x895b42 : 0xb79f70
      for (let index = -2; index <= 2; index += 1) {
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(.17, .012, 8, 40),
          new THREE.MeshBasicMaterial({ color: bandColor, transparent: true, opacity: .65 }),
        )
        band.rotation.x = Math.PI / 2
        band.position.y = index * .05
        group.add(band)
      }
    }
    if (item.visual === 'ringed-planet' || item.ringed) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(item.id === 'uranus' ? .25 : .27, item.id === 'uranus' ? .27 : .39, 48),
        new THREE.MeshBasicMaterial({ color: item.id === 'uranus' ? 0xa8d8dc : 0xd9c58e, transparent: true, opacity: item.id === 'uranus' ? .35 : .72, side: THREE.DoubleSide }),
      )
      ring.rotation.x = item.id === 'uranus' ? .15 : 1.18
      group.add(ring)
    }
    if (!item.texture && item.surface === 'martian') {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(.181, 18, 18, 0, Math.PI * 2, 0, .36),
        new THREE.MeshBasicMaterial({ color: 0xe8ddd0 }),
      )
      group.add(cap)
    }
    if (item.id === 'pluto' && !item.texture) {
      const heart = new THREE.Group()
      ;[-.035, .035].forEach((x) => {
        const patch = new THREE.Mesh(
          new THREE.SphereGeometry(.052, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xd8cbb8 }),
        )
        patch.position.set(x, .025, .17)
        patch.scale.y = 1.25
        heart.add(patch)
      })
      group.add(heart)
    }
  }
  group.userData.item = item
  return group
}

export default function DepthModel({ active, selected, onSelect, year }) {
  const mountRef = useRef(null)
  const labelsRef = useRef({})
  const earthLabelRef = useRef(null)
  const sceneRef = useRef(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const visible = useMemo(
    () => observations.filter(
      (item) => item.year <= year && (item.scope === 'solar' ? active.solar : item.observatories.some((scope) => active[scope])),
    ),
    [active, year],
  )

  useEffect(() => {
    const mount = mountRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030609)
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, .05, 80)
    camera.position.set(9.5, 6.5, 11.5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.prepend(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xaec8df, 0x17100b, 1.15))
    const keyLight = new THREE.DirectionalLight(0xffe9cf, 1.8)
    keyLight.position.set(5, 7, 9)
    scene.add(keyLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = .07
    controls.minDistance = .55
    controls.maxDistance = 28
    controls.target.set(0, 0, 0)
    let focusTarget = null
    let focusCamera = null
    let interacting = false
    const cancelFocus = () => {
      focusTarget = null
      focusCamera = null
    }
    controls.addEventListener('start', () => {
      cancelFocus()
      interacting = true
      renderer.domElement.style.cursor = 'grabbing'
    })
    controls.addEventListener('end', () => {
      interacting = false
      renderer.domElement.style.cursor = 'grab'
    })

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(.07, 28, 24),
      new THREE.MeshBasicMaterial({ color: 0x78aebd }),
    )
    scene.add(earth)
    scene.add(new THREE.Mesh(
      new THREE.RingGeometry(.105, .108, 48),
      new THREE.MeshBasicMaterial({ color: 0x78aebd, transparent: true, opacity: .35, side: THREE.DoubleSide }),
    ))

    const shells = [2.9, 4.9, 8.5]
    shells.forEach((radius) => {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 18),
        new THREE.MeshBasicMaterial({ color: 0x52606c, wireframe: true, transparent: true, opacity: .045 }),
      )
      scene.add(shell)
    })

    const positions = new Map()
    const models = []
    const loadedTextures = []
    const textureLoader = new THREE.TextureLoader()
    visible.forEach((item) => {
      const position = toVector(item)
      positions.set(item.id, position)
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), position]),
        new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: .1 }),
      )
      scene.add(line)
      const model = createObjectModel(item)
      if (item.texture) {
        const texture = textureLoader.load(item.texture)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        loadedTextures.push(texture)
        const body = model.children.find((child) => child.geometry?.type === 'SphereGeometry')
        if (body) {
          body.material = item.visual === 'star'
            ? new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff })
            : new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xffffff,
                roughness: item.surface === 'clouded' ? .72 : .9,
                metalness: 0,
                emissive: new THREE.Color(item.color).multiplyScalar(.04),
              })
        }
      }
      model.position.copy(position)
      model.rotation.z = THREE.MathUtils.degToRad(item.axialTilt || 0)
      const physicalScale = item.radiusKm
        ? .16 + .56 * Math.pow(item.radiusKm / 696340, .34)
        : .34
      model.userData.baseScale = physicalScale
      model.scale.setScalar(physicalScale)
      scene.add(model)
      models.push(model)
    })

    const stars = []
    let seed = 17491
    for (let index = 0; index < 900; index += 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const a = seed / 4294967296 * Math.PI * 2
      seed = (seed * 1664525 + 1013904223) % 4294967296
      const z = seed / 4294967296 * 2 - 1
      const radius = 10.5
      const radial = Math.sqrt(1 - z * z)
      stars.push(Math.cos(a) * radial * radius, z * radius, Math.sin(a) * radial * radius)
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3))
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xaebdca, size: .025, transparent: true, opacity: .5 })))

    const raycaster = new THREE.Raycaster()
    raycaster.params.Points.threshold = .12
    const focusObject = (item) => {
      const position = positions.get(item.id)
      if (!position) return
      const viewDirection = camera.position.clone().sub(controls.target).normalize()
      const baseScale = item.radiusKm
        ? .16 + .56 * Math.pow(item.radiusKm / 696340, .34)
        : .34
      const focusDistance = item.scope === 'solar'
        ? Math.max(.72, Math.min(3.1, baseScale * 4.1))
        : 3.4
      focusTarget = position.clone()
      focusCamera = position.clone().add(viewDirection.multiplyScalar(focusDistance))
    }
    const pointerMove = (event) => {
      if (interacting) return
      const bounds = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      renderer.domElement.style.cursor = raycaster.intersectObjects(models, true).length ? 'pointer' : 'grab'
    }
    const click = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(models, true)
      if (hits.length) {
        let target = hits[0].object
        while (target.parent && !target.userData.item) target = target.parent
        if (target.userData.item) {
          focusObject(target.userData.item)
          onSelect(target.userData.item)
        }
      }
    }
    renderer.domElement.addEventListener('click', click)
    renderer.domElement.addEventListener('pointermove', pointerMove)

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    sceneRef.current = { focus: focusObject }
    let frame
    const render = () => {
      const time = performance.now() * .001
      if (focusTarget && focusCamera) {
        controls.target.lerp(focusTarget, .045)
        camera.position.lerp(focusCamera, .045)
        if (controls.target.distanceTo(focusTarget) < .015 && camera.position.distanceTo(focusCamera) < .015) {
          focusTarget = null
          focusCamera = null
        }
      }
      controls.update()
      models.forEach((model) => {
        const baseScale = model.userData.baseScale || .34
        const targetScale = model.userData.item?.id === selectedRef.current.id ? baseScale * 1.34 : baseScale
        const displayedScale = THREE.MathUtils.lerp(model.scale.x, targetScale, .08)
        model.scale.setScalar(displayedScale)
        if (model.userData.item?.scope !== 'solar') model.lookAt(camera.position)
        if (model.userData.item?.visual === 'star') {
          model.rotation.y += .00035
          const halo = model.children[1]
          if (halo) {
            const pulse = 1 + Math.sin(time * 1.25) * .035
            halo.scale.setScalar(pulse)
            halo.material.opacity = .13 + Math.sin(time * 1.6) * .025
          }
        }
      })
      camera.updateMatrixWorld(true)
      const earthLabel = earthLabelRef.current
      if (earthLabel) {
        const earthScreen = new THREE.Vector3(0, 0, 0).project(camera)
        const earthVisible = earthScreen.z < 1 && Math.abs(earthScreen.x) < 1.05 && Math.abs(earthScreen.y) < 1.05
        earthLabel.style.left = `${(earthScreen.x * .5 + .5) * mount.clientWidth}px`
        earthLabel.style.top = `${(-earthScreen.y * .5 + .5) * mount.clientHeight}px`
        earthLabel.style.opacity = earthVisible ? '1' : '0'
      }
      const projectedLabels = visible.map((item) => {
        const label = labelsRef.current[item.id]
        if (!label) return null
        const point = positions.get(item.id).clone().project(camera)
        return {
          item,
          label,
          x: (point.x * .5 + .5) * mount.clientWidth,
          y: (-point.y * .5 + .5) * mount.clientHeight,
          hidden: point.z > 1 || Math.abs(point.x) > 1.05 || Math.abs(point.y) > 1.05,
        }
      }).filter(Boolean).sort((a, b) => {
        if (a.item.id === selectedRef.current.id) return -1
        if (b.item.id === selectedRef.current.id) return 1
        return a.item.scope === 'solar' ? -1 : 1
      })
      const occupied = []
      projectedLabels.forEach((entry) => {
        const overlaps = occupied.some((placed) => Math.abs(placed.x - entry.x) < 96 && Math.abs(placed.y - entry.y) < 30)
        const hidden = entry.hidden || overlaps
        entry.label.style.left = `${entry.x}px`
        entry.label.style.top = `${entry.y}px`
        entry.label.style.opacity = hidden ? '0' : '1'
        entry.label.style.pointerEvents = hidden ? 'none' : 'auto'
        if (!hidden) occupied.push(entry)
      })
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      starGeometry.dispose()
      loadedTextures.forEach((texture) => texture.dispose())
      renderer.domElement.remove()
      sceneRef.current = null
    }
  }, [onSelect, visible])

  return (
    <main className="depth-model" ref={mountRef} aria-label="Logarithmic three dimensional distance model">
      <div className="depth-intro">
        <span>EARTH-CENTERED · LOGARITHMIC DISTANCE</span>
        <strong>Drag to orbit · Scroll to zoom</strong>
      </div>
      <div className="earth-label" ref={earthLabelRef}>EARTH <i /></div>
      {visible.map((item) => (
        <button
          key={item.id}
          ref={(node) => { labelsRef.current[item.id] = node }}
          className={`depth-label ${selected.id === item.id ? 'selected' : ''}`}
          onClick={() => { sceneRef.current?.focus(item); onSelect(item) }}
          style={{ '--glow': item.color }}
        >
          <span><strong>{item.name}</strong><small>{item.distance}</small></span>
        </button>
      ))}
      <div className="depth-scale">
        <span>SOLAR SYSTEM</span><span>MILKY WAY</span><span>DEEP SPACE</span>
      </div>
      <a className="texture-credit depth-credit" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">
        PLANET MAPS · SOLAR SYSTEM SCOPE · CC BY 4.0
      </a>
    </main>
  )
}
