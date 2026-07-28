import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Crosshair, Minus, Plus } from 'lucide-react'
import { observations } from '../data/observations'
import { createDeepSkyModel } from '../utils/deepSkyModels'

const toVector = (ra, dec, radius = 10) => {
  const alpha = THREE.MathUtils.degToRad(ra)
  const delta = THREE.MathUtils.degToRad(dec)
  return new THREE.Vector3(
    radius * Math.cos(delta) * Math.cos(alpha),
    radius * Math.sin(delta),
    radius * Math.cos(delta) * Math.sin(alpha),
  )
}

const viewAngles = (ra, dec) => {
  const alpha = THREE.MathUtils.degToRad(ra)
  return {
    yaw: Math.atan2(-Math.cos(alpha), -Math.sin(alpha)),
    pitch: THREE.MathUtils.degToRad(dec),
  }
}

const depthRadius = (distanceLy) => {
  const normalized = (Math.log10(Math.max(distanceLy, .0001)) + 4) / 13.7
  return 5.9 + Math.max(0, Math.min(1, normalized)) * 3.45
}

const makeObjectTexture = (item) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  const center = 128
  const color = new THREE.Color(item.color)
  const rgb = `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`
  const glow = context.createRadialGradient(center, center, 3, center, center, 120)
  glow.addColorStop(0, `rgba(255,255,255,.95)`)
  glow.addColorStop(.12, `rgba(${rgb},.8)`)
  glow.addColorStop(1, `rgba(${rgb},0)`)

  if (item.visual === 'galaxy') {
    context.save()
    context.translate(center, center)
    if (item.profile === 'edge-on') {
      context.scale(1, .26)
      context.fillStyle = glow
      context.beginPath(); context.arc(0, 0, 118, 0, Math.PI * 2); context.fill()
      context.fillStyle = 'rgba(3,5,8,.9)'
      context.fillRect(-116, -6, 232, 12)
      context.fillStyle = 'rgba(255,245,220,.9)'
      context.beginPath(); context.ellipse(0, 0, 24, 46, 0, 0, Math.PI * 2); context.fill()
    } else {
      context.strokeStyle = `rgba(${rgb},.65)`
      context.lineWidth = 9
      for (let arm = 0; arm < 2; arm += 1) {
        context.beginPath()
        for (let angle = 0; angle < Math.PI * 4; angle += .08) {
          const radius = 5 + angle * 8
          const x = Math.cos(angle + arm * Math.PI) * radius
          const y = Math.sin(angle + arm * Math.PI) * radius * .7
          if (angle === 0) context.moveTo(x, y); else context.lineTo(x, y)
        }
        context.stroke()
      }
      context.fillStyle = glow
      context.fillRect(-128, -128, 256, 256)
    }
    context.restore()
  } else if (item.visual === 'nebula') {
    context.fillStyle = glow
    context.fillRect(0, 0, 256, 256)
    context.globalCompositeOperation = 'screen'
    for (let index = 0; index < 14; index += 1) {
      const angle = index * 2.399
      const radius = 18 + (index * 17) % 75
      const x = center + Math.cos(angle) * radius
      const y = center + Math.sin(angle) * radius * .72
      const cloud = context.createRadialGradient(x, y, 0, x, y, 32 + index % 4 * 8)
      cloud.addColorStop(0, `rgba(${rgb},.28)`)
      cloud.addColorStop(1, `rgba(${rgb},0)`)
      context.fillStyle = cloud
      context.fillRect(x - 52, y - 52, 104, 104)
    }
  } else if (item.visual === 'remnant') {
    context.fillStyle = glow
    context.fillRect(0, 0, 256, 256)
    context.globalCompositeOperation = 'screen'
    for (let index = 0; index < 24; index += 1) {
      const angle = index / 24 * Math.PI * 2
      const radius = 63 + Math.sin(index * 4.7) * 15
      const x = center + Math.cos(angle) * radius
      const y = center + Math.sin(angle) * radius * .78
      const filament = context.createRadialGradient(x, y, 0, x, y, 12 + index % 5 * 3)
      filament.addColorStop(0, `rgba(${rgb},${.38 + index % 3 * .12})`)
      filament.addColorStop(1, `rgba(${rgb},0)`)
      context.fillStyle = filament
      context.fillRect(x - 28, y - 28, 56, 56)
    }
    context.strokeStyle = `rgba(${rgb},.42)`
    context.lineWidth = 3
    for (let arc = 0; arc < 7; arc += 1) {
      context.beginPath()
      context.arc(center, center, 48 + arc * 7, arc * .77, arc * .77 + .7 + arc % 3 * .24)
      context.stroke()
    }
  } else if (item.visual === 'cluster') {
    for (let index = 0; index < 28; index += 1) {
      const angle = index * 2.399
      const radius = 8 + (index * 19) % 94
      context.fillStyle = `rgba(${rgb},${.35 + index % 4 * .14})`
      context.beginPath()
      context.arc(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius, 1.5 + index % 3, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    const bodyRadius = item.visual === 'star' ? 82 : 66
    context.fillStyle = glow
    context.fillRect(0, 0, 256, 256)
    context.save()
    context.beginPath(); context.arc(center, center, bodyRadius, 0, Math.PI * 2); context.clip()
    const sphere = context.createRadialGradient(105, 100, 5, center, center, bodyRadius)
    sphere.addColorStop(0, item.visual === 'star' ? '#fff8c8' : `rgba(255,255,255,.92)`)
    sphere.addColorStop(.28, `rgba(${rgb},1)`)
    sphere.addColorStop(1, `rgba(${Math.round(color.r * 95)},${Math.round(color.g * 95)},${Math.round(color.b * 95)},1)`)
    context.fillStyle = sphere
    context.fillRect(center - bodyRadius, center - bodyRadius, bodyRadius * 2, bodyRadius * 2)

    if (item.surface === 'jovian' || item.surface === 'saturnian') {
      const bands = item.surface === 'jovian'
        ? ['#7f563f','#ead2aa','#b97955','#f1ddba','#8e5d43','#dfbf91']
        : ['#a88e62','#e1ce9c','#bba46f','#ead9a7','#9e885d']
      bands.forEach((band, index) => {
        context.globalAlpha = .55
        context.fillStyle = band
        context.fillRect(55, 76 + index * 19, 146, 10 + index % 2 * 5)
      })
      if (item.surface === 'jovian') {
        context.globalAlpha = .8
        context.fillStyle = '#a85438'
        context.beginPath(); context.ellipse(163, 151, 21, 9, -.08, 0, Math.PI * 2); context.fill()
      }
    } else if (item.surface === 'cratered') {
      context.globalAlpha = .36
      ;[[95,91,13],[151,112,9],[116,157,16],[169,158,7],[82,137,6]].forEach(([x,y,radius]) => {
        context.fillStyle = '#34383a'; context.beginPath(); context.arc(x,y,radius,0,Math.PI*2); context.fill()
        context.strokeStyle = '#ded8c8'; context.lineWidth = 2; context.stroke()
      })
    } else if (item.surface === 'martian') {
      context.globalAlpha = .42; context.fillStyle = '#572f2a'
      context.beginPath(); context.ellipse(112,132,38,15,.4,0,Math.PI*2); context.fill()
      context.fillStyle = '#eee1cf'; context.fillRect(92,63,72,8)
    } else if (item.surface === 'clouded') {
      context.globalAlpha = .28; context.strokeStyle = '#fff5cc'; context.lineWidth = 10
      for (let y = 82; y < 184; y += 24) { context.beginPath(); context.moveTo(58,y); context.bezierCurveTo(95,y-18,150,y+18,199,y); context.stroke() }
    } else if (item.surface === 'neptunian') {
      context.globalAlpha = .55; context.fillStyle = '#233d91'
      context.beginPath(); context.ellipse(153,145,19,8,0,0,Math.PI*2); context.fill()
      context.strokeStyle = '#9fbff6'; context.lineWidth = 5; context.beginPath(); context.moveTo(66,115); context.lineTo(192,112); context.stroke()
    } else if (item.surface === 'plutonian') {
      context.globalAlpha = .5; context.fillStyle = '#ddd0bc'
      context.beginPath(); context.arc(112,112,25,0,Math.PI*2); context.arc(142,112,25,0,Math.PI*2); context.fill()
    } else if (item.surface === 'solar') {
      context.globalAlpha = .45
      for (let index = 0; index < 18; index += 1) {
        context.fillStyle = index % 2 ? '#ffb72c' : '#fff08a'
        context.beginPath(); context.arc(72 + (index * 37) % 118, 74 + (index * 53) % 112, 4 + index % 8, 0, Math.PI * 2); context.fill()
      }
    }
    context.restore()

    if (item.visual === 'ringed-planet' || item.ringed) {
      context.save()
      context.translate(center, center)
      context.scale(1, item.id === 'uranus' ? .46 : .28)
      context.strokeStyle = item.id === 'uranus' ? 'rgba(184,225,225,.45)' : 'rgba(231,211,154,.78)'
      context.lineWidth = item.id === 'uranus' ? 4 : 13
      context.beginPath(); context.ellipse(0, 0, 105, 105, 0, 0, Math.PI * 2); context.stroke()
      context.restore()
    }
  }
  return new THREE.CanvasTexture(canvas)
}

const physicalDisplayScale = (item) => {
  if (!item.radiusKm) return null
  return .095 + .47 * Math.pow(item.radiusKm / 696340, .34)
}

const galacticToEquatorial = (longitude) => {
  const l = THREE.MathUtils.degToRad(longitude)
  const galactic = [Math.cos(l), Math.sin(l), 0]
  const matrix = [
    [-0.0548755604, 0.4941094279, -0.8676661490],
    [-0.8734370902, -0.4448296300, -0.1980763734],
    [-0.4838350155, 0.7469822445, 0.4559837762],
  ]
  const [x, y, z] = matrix.map((row) => row.reduce((sum, value, index) => sum + value * galactic[index], 0))
  return {
    ra: (THREE.MathUtils.radToDeg(Math.atan2(y, x)) + 360) % 360,
    dec: THREE.MathUtils.radToDeg(Math.asin(z)),
  }
}

export default function Planetarium({ active, selected, onSelect, year }) {
  const mountRef = useRef(null)
  const labelsRef = useRef({})
  const sceneRef = useRef(null)
  const orientationRef = useRef(viewAngles(274.7, -13.81))
  const [fieldOfView, setFieldOfView] = useState(52)
  const [dragMode, setDragMode] = useState('grab')
  const dragModeRef = useRef('grab')
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
    scene.fog = new THREE.FogExp2(0x030609, 0.012)
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.01, 30)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.prepend(renderer.domElement)
    scene.add(new THREE.AmbientLight(0x7890aa, .48))
    const observerLight = new THREE.PointLight(0xfff2df, 2.2, 24, 1.35)
    observerLight.position.set(0, 0, 0)
    scene.add(observerLight)

    const starGeometry = new THREE.BufferGeometry()
    const stars = []
    let seed = 928371
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    for (let index = 0; index < 4200; index += 1) {
      const ra = random() * 360
      const dec = THREE.MathUtils.radToDeg(Math.asin(random() * 2 - 1))
      const point = toVector(ra, dec, 9.7 + random() * .25)
      stars.push(point.x, point.y, point.z)
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3))
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: 0xcbd8e2, size: .012, transparent: true, opacity: .72, sizeAttenuation: true,
    })))

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x53616d, transparent: true, opacity: .15 })
    for (let dec = -60; dec <= 60; dec += 30) {
      const points = []
      for (let ra = 0; ra <= 360; ra += 3) points.push(toVector(ra, dec, 9.82))
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial))
    }
    for (let ra = 0; ra < 360; ra += 30) {
      const points = []
      for (let dec = -90; dec <= 90; dec += 3) points.push(toVector(ra, dec, 9.82))
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial))
    }

    const galacticPoints = []
    for (let longitude = 0; longitude <= 360; longitude += 2) {
      const sky = galacticToEquatorial(longitude)
      galacticPoints.push(toVector(sky.ra, sky.dec, 9.78))
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(galacticPoints),
      new THREE.LineBasicMaterial({ color: 0xc69a69, transparent: true, opacity: .48 }),
    ))

    const markerGroup = new THREE.Group()
    const markerMeshes = []
    const markerPositions = new Map()
    const loadedTextures = []
    const photoTextureLoader = new THREE.TextureLoader()
    visible.forEach((item) => {
      const radius = depthRadius(item.distanceLy)
      const position = toVector(item.ra, item.dec, radius)
      markerPositions.set(item.id, position)
      if (item.texture) {
        const texture = photoTextureLoader.load(item.texture)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        loadedTextures.push(texture)
        const scale = physicalDisplayScale(item)
        const material = item.visual === 'star'
          ? new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff })
          : new THREE.MeshStandardMaterial({
              map: texture,
              color: 0xffffff,
              roughness: item.surface === 'clouded' ? .72 : .9,
              metalness: 0,
              emissive: new THREE.Color(item.color).multiplyScalar(.045),
            })
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(scale / 2, 32, 24), material)
        sphere.position.copy(position)
        sphere.rotation.y = item.ra * Math.PI / 180
        sphere.rotation.z = THREE.MathUtils.degToRad(item.axialTilt || 0)
        sphere.userData.item = item
        sphere.userData.rotates = true
        markerGroup.add(sphere)
        markerMeshes.push(sphere)
        if (item.visual === 'star') {
          const corona = new THREE.Mesh(
            new THREE.SphereGeometry(scale * .64, 28, 20),
            new THREE.MeshBasicMaterial({
              color: 0xffa43a,
              transparent: true,
              opacity: .11,
              blending: THREE.AdditiveBlending,
              side: THREE.BackSide,
              depthWrite: false,
            }),
          )
          corona.position.copy(position)
          corona.userData.corona = true
          corona.userData.baseScale = 1
          markerGroup.add(corona)
        }
        if (item.visual === 'ringed-planet' || item.ringed) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(scale * .62, scale * (item.id === 'saturn' ? 1.02 : .75), 56),
            new THREE.MeshBasicMaterial({
              color: item.id === 'saturn' ? 0xbfae82 : 0x8ebec0,
              transparent: true,
              opacity: item.id === 'saturn' ? .6 : .25,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
          )
          ring.position.copy(position)
          ring.lookAt(0, 0, 0)
          ring.rotateX(item.id === 'saturn' ? .68 : 1.28)
          ring.userData.item = item
          markerGroup.add(ring)
          markerMeshes.push(ring)
        }
      } else if (item.scope !== 'solar') {
        const model = createDeepSkyModel(item)
        model.position.copy(position.clone().multiplyScalar(.997))
        const deepScale = item.id === 'andromeda' || item.id === 'lmc' ? .72 : item.visual === 'nebula' ? .62 : .55
        model.scale.setScalar(deepScale)
        model.lookAt(0, 0, 0)
        markerGroup.add(model)
        model.traverse((child) => {
          if (child.isMesh || child.isPoints) markerMeshes.push(child)
        })
      } else {
        const texture = makeObjectTexture(item)
        texture.colorSpace = THREE.SRGBColorSpace
        loadedTextures.push(texture)
        const solidBody = item.scope === 'solar'
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture,
          color: 0xffffff,
          transparent: true,
          opacity: solidBody ? .98 : .76,
          blending: solidBody && item.visual !== 'star' ? THREE.NormalBlending : THREE.AdditiveBlending,
          depthWrite: false,
        }))
        sprite.position.copy(position.clone().multiplyScalar(.997))
        const scaleByType = {
          nebula: .68, galaxy: .5, remnant: .42, cluster: .44,
          planet: .24, 'ringed-planet': .32, moon: .22, star: .34,
        }
        const scale = physicalDisplayScale(item) || scaleByType[item.visual] || .32
        sprite.scale.set(scale, scale, 1)
        sprite.userData.item = item
        markerGroup.add(sprite)
        markerMeshes.push(sprite)
      }
    })
    scene.add(markerGroup)

    let { yaw, pitch } = orientationRef.current
    let targetYaw = yaw
    let targetPitch = pitch
    let targetFov = camera.fov
    let gridOpacity = .15
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    const updateCamera = () => camera.rotation.set(pitch, yaw, 0, 'YXZ')
    updateCamera()

    const pointerDown = (event) => {
      dragging = true; moved = false; lastX = event.clientX; lastY = event.clientY
      gridOpacity = .045
      renderer.domElement.style.cursor = 'none'
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const pointerMove = (event) => {
      if (!dragging) {
        renderer.domElement.style.cursor = hitAt(event) ? 'pointer' : 'grab'
        return
      }
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true
      const direction = dragModeRef.current === 'grab' ? 1 : -1
      targetYaw += dx * .0025 * direction
      const pitchLimit = THREE.MathUtils.degToRad(78)
      targetPitch = Math.max(-pitchLimit, Math.min(pitchLimit, targetPitch + dy * .0025 * direction))
      orientationRef.current = { yaw: targetYaw, pitch: targetPitch }
      lastX = event.clientX; lastY = event.clientY
    }
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points.threshold = .08
    const hitAt = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(markerMeshes, true)[0]
    }
    const pointerUp = (event) => {
      dragging = false
      gridOpacity = .15
      renderer.domElement.style.cursor = 'grab'
      if (moved) return
      const hit = hitAt(event)
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab'
      if (hit) {
        const item = hit.object.userData.item
        const angles = viewAngles(item.ra, item.dec)
        targetYaw = angles.yaw
        targetPitch = angles.pitch
        targetFov = 36
        orientationRef.current = { yaw: targetYaw, pitch: targetPitch }
        onSelect(item)
      }
    }
    const pointerCancel = () => {
      dragging = false
      gridOpacity = .15
      renderer.domElement.style.cursor = 'grab'
    }
    const wheel = (event) => {
      event.preventDefault()
      camera.fov = Math.max(35, Math.min(75, camera.fov + Math.sign(event.deltaY) * 3))
      targetFov = camera.fov
      camera.updateProjectionMatrix()
      setFieldOfView(Math.round(camera.fov))
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointercancel', pointerCancel)
    renderer.domElement.addEventListener('wheel', wheel, { passive: false })

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let animationFrame
    const render = () => {
      const time = performance.now() * .001
      const yawDifference = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw))
      yaw += yawDifference * .14
      pitch += (targetPitch - pitch) * .14
      camera.fov += (targetFov - camera.fov) * .055
      camera.updateProjectionMatrix()
      const roundedFov = Math.round(camera.fov)
      setFieldOfView((current) => current === roundedFov ? current : roundedFov)
      updateCamera()
      camera.updateMatrixWorld(true)
      gridMaterial.opacity += (gridOpacity - gridMaterial.opacity) * .12
      markerGroup.children.forEach((child) => {
        if (child.userData.rotates) child.rotation.y += .00045
        if (child.userData.corona) {
          const pulse = 1 + Math.sin(time * 1.35) * .035
          child.scale.setScalar(pulse)
          child.material.opacity = .095 + Math.sin(time * 1.7) * .018
        }
      })
      visible.forEach((item) => {
        const label = labelsRef.current[item.id]
        if (!label) return
        const worldPosition = markerPositions.get(item.id)
        const cameraPosition = worldPosition.clone().applyMatrix4(camera.matrixWorldInverse)
        const projected = worldPosition.clone().project(camera)
        const edge = Math.max(Math.abs(projected.x), Math.abs(projected.y))
        const hidden = cameraPosition.z >= 0 || edge > 1.03
        const edgeOpacity = Math.max(0, Math.min(1, (1.02 - edge) / .18))
        label.style.left = `${(projected.x * .5 + .5) * mount.clientWidth}px`
        label.style.top = `${(-projected.y * .5 + .5) * mount.clientHeight}px`
        label.style.opacity = hidden ? '0' : String(edgeOpacity)
        label.style.pointerEvents = hidden ? 'none' : 'auto'
      })
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(render)
    }
    render()
    sceneRef.current = {
      camera,
      focus: (item) => {
        const angles = viewAngles(item.ra, item.dec)
        targetYaw = angles.yaw
        targetPitch = angles.pitch
        targetFov = 36
        orientationRef.current = { yaw: targetYaw, pitch: targetPitch }
      },
      setFov: (value) => { targetFov = value },
      reset: () => {
        const angles = viewAngles(274.7, -13.81)
        yaw = angles.yaw
        pitch = angles.pitch
        targetYaw = yaw
        targetPitch = pitch
        targetFov = 52
        orientationRef.current = { yaw: targetYaw, pitch: targetPitch }
      },
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      renderer.dispose()
      starGeometry.dispose()
      loadedTextures.forEach((texture) => texture.dispose())
      renderer.domElement.remove()
      sceneRef.current = null
    }
  }, [onSelect, visible])

  const zoom = (amount) => {
    const camera = sceneRef.current?.camera
    if (!camera) return
    camera.fov = Math.max(35, Math.min(75, camera.fov + amount))
    sceneRef.current?.setFov(camera.fov)
    camera.updateProjectionMatrix()
    setFieldOfView(Math.round(camera.fov))
  }

  const changeDragMode = (mode) => {
    dragModeRef.current = mode
    setDragMode(mode)
  }

  return (
    <main className="planetarium" ref={mountRef} aria-label="Interactive 3D planetarium">
      <div className="planetarium-intro">
        <span>YOU ARE HERE · EARTH</span>
        <strong>{dragMode === 'grab' ? 'Grab and move the sky' : 'Drag to move your view'}</strong>
      </div>
      <div className="drag-mode" aria-label="Drag direction">
        <button className={dragMode === 'grab' ? 'active' : ''} onClick={() => changeDragMode('grab')}>Grab sky</button>
        <button className={dragMode === 'look' ? 'active' : ''} onClick={() => changeDragMode('look')}>Look around</button>
      </div>
      <div className="horizon-reticle"><i /><i /></div>
      <div className="orientation-ring" aria-hidden="true">
        <span>UP</span><i /><i /><i /><i />
      </div>
      {visible.map((item) => (
        <button
          key={item.id}
          ref={(node) => { labelsRef.current[item.id] = node }}
          className={`planet-label ${selected.id === item.id ? 'selected' : ''}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            sceneRef.current?.focus(item)
            onSelect(item)
          }}
          style={{ '--glow': item.color }}
        >
          <span><strong>{item.name}</strong><small>{item.catalog}</small></span>
        </button>
      ))}
      <div className="planetarium-tools">
        <button aria-label="Zoom in" onClick={() => zoom(-8)}><Plus size={18} /></button>
        <span>{fieldOfView}°</span>
        <button aria-label="Zoom out" onClick={() => zoom(8)}><Minus size={18} /></button>
        <button aria-label="Look toward Pillars of Creation" onClick={() => sceneRef.current?.reset()}><Crosshair size={18} /></button>
      </div>
      <div className="galactic-key planetarium-key"><i /> Galactic plane</div>
      <a className="texture-credit" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">
        PLANET MAPS · SOLAR SYSTEM SCOPE · CC BY 4.0
      </a>
    </main>
  )
}
