import * as THREE from 'three'

const seedFor = (text) => [...text].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 2166136261)

const randomFor = (text) => {
  let seed = seedFor(text)
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

const glowMaterial = (color, opacity = .65) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
})

const addPoints = (group, positions, color, size = .025, opacity = .75) => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  group.add(new THREE.Points(geometry, new THREE.ShaderMaterial({
    uniforms: {
      pointColor: { value: new THREE.Color(color) },
      pointSize: { value: size * 900 },
      pointOpacity: { value: opacity },
    },
    vertexShader: `
      uniform float pointSize;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize / max(1.0, -viewPosition.z);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 pointColor;
      uniform float pointOpacity;
      void main() {
        float distanceFromCenter = distance(gl_PointCoord, vec2(.5));
        if (distanceFromCenter > .5) discard;
        float glow = 1.0 - smoothstep(.08, .5, distanceFromCenter);
        gl_FragColor = vec4(pointColor, glow * pointOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })))
}

const spiralGalaxy = (item, random) => {
  const group = new THREE.Group()
  const stars = []
  const dust = []
  const arms = item.id === 'whirlpool' ? 2 : 4
  const count = item.id === 'andromeda' ? 1500 : 760
  for (let index = 0; index < count; index += 1) {
    const radius = Math.pow(random(), .64) * .52
    const arm = index % arms
    const angle = radius * (item.id === 'andromeda' ? 8.5 : 12) + arm * Math.PI * 2 / arms + (random() - .5) * 1.05
    stars.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * (item.id === 'andromeda' ? .72 : 1),
      (random() - .5) * .022,
    )
    if (index < count * .42 && radius > .15) {
      const dustAngle = angle + .16
      dust.push(Math.cos(dustAngle) * radius, Math.sin(dustAngle) * radius * .72, (random() - .5) * .012 + .012)
    }
  }
  addPoints(group, stars, item.id === 'andromeda' ? 0xb9cafa : item.color, item.id === 'andromeda' ? .012 : .016, .68)
  if (item.id === 'andromeda') addPoints(group, dust, 0xa56e4b, .01, .32)

  const outerDisk = new THREE.Mesh(new THREE.SphereGeometry(.43, 32, 20), glowMaterial(
    item.id === 'andromeda' ? 0x6483bd : item.color,
    item.id === 'andromeda' ? .075 : .055,
  ))
  outerDisk.scale.set(1.25, item.id === 'andromeda' ? .72 : 1, .055)
  const innerDisk = new THREE.Mesh(new THREE.SphereGeometry(.24, 28, 18), glowMaterial(0xd49b6a, .17))
  innerDisk.scale.set(1.35, .62, .08)
  const core = new THREE.Mesh(new THREE.SphereGeometry(.105, 22, 14), glowMaterial(0xffe0ae, .92))
  core.scale.set(item.id === 'andromeda' ? 1.6 : 1, item.id === 'andromeda' ? .72 : 1, .72)
  group.add(outerDisk, innerDisk, core)
  if (item.id === 'whirlpool') {
    const companion = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 10), glowMaterial(0xc7b2e5, .75))
    companion.position.set(.49, .1, .02)
    group.add(companion)
  }
  group.rotation.x = item.id === 'andromeda' ? 1.18 : .18
  group.rotation.z = item.id === 'andromeda' ? -.22 : 0
  return group
}

const sombreroGalaxy = (item, random) => {
  const group = new THREE.Group()
  const stars = []
  for (let index = 0; index < 420; index += 1) {
    const radius = Math.pow(random(), .55) * .52
    const angle = random() * Math.PI * 2
    stars.push(Math.cos(angle) * radius, (random() - .5) * .025, Math.sin(angle) * radius)
  }
  addPoints(group, stars, item.color, .016, .8)
  const bulge = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), glowMaterial(0xffdfad, .9))
  bulge.scale.set(1.4, .7, 1.4)
  const lane = new THREE.Mesh(new THREE.RingGeometry(.16, .5, 64), new THREE.MeshBasicMaterial({
    color: 0x100d0b, transparent: true, opacity: .92, side: THREE.DoubleSide,
  }))
  lane.rotation.x = Math.PI / 2
  group.add(bulge, lane)
  group.rotation.x = 1.42
  return group
}

const cloudModel = (item, random) => {
  const group = new THREE.Group()
  if (item.id === 'pillars') {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x),
                     mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float value = 0.0;
          value += noise(p) * .55; p *= 2.03;
          value += noise(p) * .27; p *= 2.11;
          value += noise(p) * .13; p *= 2.07;
          value += noise(p) * .05;
          return value;
        }
        float pillar(vec2 p, float center, float bottom, float top, float lean, float width) {
          float y = smoothstep(bottom, top, p.y);
          float axis = center + y * lean + sin(p.y * 17.0 + center * 9.0) * .012;
          float taper = width * mix(1.25, .56, y);
          float body = 1.0 - smoothstep(taper - .022, taper + .018, abs(p.x - axis));
          float vertical = smoothstep(bottom - .03, bottom + .035, p.y) * (1.0 - smoothstep(top - .045, top + .035, p.y));
          float crown = 1.0 - smoothstep(taper * .7, taper * 1.42, length((p - vec2(axis + lean * .08, top)) * vec2(1., 1.3)));
          return max(body * vertical, crown);
        }
        void main() {
          vec2 p = vUv - .5;
          p.x *= 1.12;
          float textureNoise = fbm(p * 13.0 + vec2(2.3, 7.1));
          float largeNoise = fbm(p * 5.0);
          float shape = max(
            pillar(p, -.19, -.39, .34, -.06, .105),
            max(pillar(p, .02, -.38, .22, .035, .09),
                pillar(p, .205, -.37, .11, .07, .075))
          );
          shape *= smoothstep(.22, .48, textureNoise + shape * .38);
          float nearby = smoothstep(.1, .92, shape + largeNoise * .22);
          float rim = smoothstep(.08, .42, shape) - smoothstep(.52, .88, shape);
          vec3 darkDust = vec3(.12, .052, .026);
          vec3 warmDust = vec3(.68, .31, .12);
          vec3 litEdge = vec3(1.0, .68, .30);
          vec3 color = mix(darkDust, warmDust, .18 + textureNoise * .82);
          color += litEdge * rim * (.45 + textureNoise * .55);
          float blueHaze = (1.0 - smoothstep(.2, .58, length(p))) * .15 * (1.0 - shape);
          color += vec3(.12, .3, .58) * blueHaze;
          float alpha = max(shape * (.78 + textureNoise * .22), blueHaze);
          if (alpha < .018) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const pillars = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.05, 1, 1), material)
    group.add(pillars)

    const embeddedStars = []
    for (let index = 0; index < 22; index += 1) {
      embeddedStars.push((random() - .5) * .75, (random() - .5) * .72, .05 + random() * .16)
    }
    addPoints(group, embeddedStars, 0xffead0, .014, .82)
    return group
  }
  const count = 22
  for (let index = 0; index < count; index += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(.09 + random() * .12, 10, 8),
      glowMaterial(index % 4 ? item.color : 0xd99b68, .05 + random() * .09),
    )
    if (item.id === 'carina') {
      cloud.position.set((random() - .5) * .75, -.22 + random() * .24 + Math.sin(index) * .06, (random() - .5) * .24)
      cloud.scale.set(1.4, .7, 1)
    } else {
      const angle = random() * Math.PI * 2
      const radius = .12 + random() * .3
      cloud.position.set(Math.cos(angle) * radius, (random() - .5) * .3, Math.sin(angle) * radius)
    }
    group.add(cloud)
  }
  const stars = []
  for (let index = 0; index < 28; index += 1) stars.push((random() - .5) * .65, (random() - .5) * .55, (random() - .5) * .3)
  addPoints(group, stars, 0xcbe4ff, .018, .9)
  return group
}

const remnantModel = (item, random) => {
  const group = new THREE.Group()
  const shell = []
  for (let index = 0; index < 480; index += 1) {
    const u = random() * Math.PI * 2
    const v = Math.acos(2 * random() - 1)
    const radius = .3 + (random() - .5) * (item.id === 'cassiopeia' ? .13 : .2)
    shell.push(Math.sin(v) * Math.cos(u) * radius, Math.cos(v) * radius * .78, Math.sin(v) * Math.sin(u) * radius)
  }
  addPoints(group, shell, item.color, .018, .72)
  if (item.id === 'crab') {
    group.add(new THREE.Mesh(new THREE.TorusGeometry(.12, .018, 8, 40), glowMaterial(0x72bfff, .85)))
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(.008, .022, .68, 8), glowMaterial(0xa98cff, .55))
    jet.rotation.z = .35
    group.add(jet)
  } else {
    const jet = new THREE.Mesh(new THREE.ConeGeometry(.055, .35, 10), glowMaterial(0xd895ff, .4))
    jet.position.x = .33; jet.rotation.z = -Math.PI / 2
    group.add(jet)
  }
  group.add(new THREE.Mesh(new THREE.SphereGeometry(.025, 10, 8), glowMaterial(0xffffff, 1)))
  return group
}

const planetaryNebula = (item) => {
  const group = new THREE.Group()
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(item.id === 'helix' ? .3 : .26, item.id === 'helix' ? .11 : .075, 18, 64),
    glowMaterial(item.color, .38),
  )
  outer.scale.y = item.id === 'helix' ? .76 : 1
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.29, 24, 16), new THREE.MeshBasicMaterial({
    color: item.id === 'helix' ? 0xc96d4d : 0x64a8df, transparent: true, opacity: .07,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  group.add(outer, shell, new THREE.Mesh(new THREE.SphereGeometry(.025, 10, 8), glowMaterial(0xffffff, 1)))
  group.rotation.x = item.id === 'helix' ? .42 : .16
  return group
}

const blackHoleModel = (item, random) => {
  const group = new THREE.Group()
  if (item.id === 'm87') {
    const halo = []
    for (let index = 0; index < 360; index += 1) {
      const radius = Math.pow(random(), .55) * .4
      const theta = random() * Math.PI * 2
      const y = (random() - .5) * radius
      halo.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
    }
    addPoints(group, halo, item.color, .018, .55)
  }
  group.add(new THREE.Mesh(new THREE.SphereGeometry(.07, 18, 12), new THREE.MeshBasicMaterial({ color: 0x010101 })))
  const disk = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 10, 52), glowMaterial(0xffa64f, .9))
  disk.rotation.x = 1.18
  group.add(disk)
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(.006, .022, item.id === 'm87' ? .85 : .38, 8), glowMaterial(0x91c8ff, .58))
  jet.rotation.z = item.id === 'm87' ? .38 : 0
  group.add(jet)
  return group
}

const stellarGroup = (item, random) => {
  const group = new THREE.Group()
  const count = item.id === 'deep-field' ? 55 : item.id === 'pleiades' ? 34 : 190
  for (let index = 0; index < count; index += 1) {
    const point = new THREE.Mesh(
      item.id === 'deep-field' ? new THREE.CircleGeometry(.012 + random() * .02, 8) : new THREE.SphereGeometry(index < 7 ? .026 : .01, 7, 6),
      glowMaterial(index % 5 === 0 ? 0xffc087 : item.color, .55 + random() * .4),
    )
    point.position.set((random() - .5) * .72, (random() - .5) * .56, (random() - .5) * .28)
    if (item.id === 'deep-field') point.scale.set(1 + random() * 2.5, .35 + random(), 1)
    group.add(point)
  }
  if (item.id === 'pleiades') {
    const reflection = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 12), glowMaterial(0x477fc6, .055))
    reflection.scale.set(1.2, .65, .5)
    group.add(reflection)
  }
  return group
}

const irregularGalaxy = (item, random) => {
  const group = new THREE.Group()
  const stars = []
  for (let index = 0; index < 500; index += 1) {
    const x = (random() - .5) * .8
    stars.push(x, (random() - .5) * (.34 - Math.abs(x) * .18) + Math.sin(x * 9) * .06, (random() - .5) * .18)
  }
  addPoints(group, stars, item.color, .016, .68)
  return group
}

const texturedDeepSkyModel = (item) => {
  const group = new THREE.Group()
  const texture = new THREE.TextureLoader().load(item.deepTexture)
  texture.colorSpace = THREE.SRGBColorSpace
  const shape = item.visual === 'galaxy'
    ? (item.id === 'sombrero' ? 2 : 1)
    : item.visual === 'black-hole' || item.visual === 'planetary-nebula' || item.visual === 'remnant'
      ? 3
      : item.id === 'pillars' || item.id === 'carina'
        ? 4
        : 0

  const makeMaterial = (opacity, tint = 0xffffff, threshold = .026) => new THREE.ShaderMaterial({
    uniforms: {
      sourceMap: { value: texture },
      opacity: { value: opacity },
      tint: { value: new THREE.Color(tint) },
      shape: { value: shape },
      threshold: { value: threshold },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D sourceMap;
      uniform float opacity;
      uniform vec3 tint;
      uniform float shape;
      uniform float threshold;
      varying vec2 vUv;

      float softMask(vec2 uv) {
        vec2 p = uv - .5;
        float mask;
        if (shape < .5) {
          mask = 1.0 - smoothstep(.37, .51, length(p));
        } else if (shape < 1.5) {
          p = mat2(.707, -.707, .707, .707) * p;
          mask = 1.0 - smoothstep(.39, .53, length(p * vec2(.68, 1.55)));
        } else if (shape < 2.5) {
          mask = 1.0 - smoothstep(.38, .51, length(p * vec2(.58, 2.15)));
        } else if (shape < 3.5) {
          mask = 1.0 - smoothstep(.39, .51, length(p));
        } else {
          mask = 1.0 - smoothstep(.39, .52, length(p * vec2(.82, .62)));
        }
        float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        return mask * smoothstep(.015, .09, edge);
      }

      void main() {
        vec4 sampleColor = texture2D(sourceMap, vUv);
        float luminance = dot(sampleColor.rgb, vec3(.2126, .7152, .0722));
        float keyedAlpha = smoothstep(threshold, threshold + .11, luminance);
        float alpha = sampleColor.a * keyedAlpha * softMask(vUv) * opacity;
        if (alpha < .008) discard;
        gl_FragColor = vec4(sampleColor.rgb * tint, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(.92, .92),
    makeMaterial(.98),
  )
  group.add(plane)

  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 1.02),
    makeMaterial(.11, item.color, .012),
  )
  aura.position.z = -.018
  group.add(aura)
  group.userData.texture = texture
  return group
}

const starModel = (item) => {
  const group = new THREE.Group()
  const color = new THREE.Color(item.color)
  const radius = .16 + Math.min(.16, Math.log10(Math.max(1, item.radiusSolar || 1)) * .055)
  const photosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 40, 28),
    new THREE.MeshBasicMaterial({ color }),
  )
  if (item.profile === 'rapid-rotator') photosphere.scale.y = .82
  group.add(photosphere)

  for (const [scale, opacity] of [[1.22, .2], [1.55, .07], [2.05, .025]]) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(radius * scale, 28, 20),
      glowMaterial(color, opacity),
    )
    group.add(glow)
  }

  if (item.profile === 'binary') {
    photosphere.position.x = -.12
    const companion = new THREE.Mesh(
      new THREE.SphereGeometry(radius * .72, 32, 22),
      new THREE.MeshBasicMaterial({ color: '#ffd6a3' }),
    )
    companion.position.x = .22
    group.add(companion)
  } else if (item.id === 'sirius') {
    const companion = new THREE.Mesh(
      new THREE.SphereGeometry(radius * .2, 24, 18),
      new THREE.MeshBasicMaterial({ color: '#f5fbff' }),
    )
    companion.position.set(.25, -.12, .02)
    group.add(companion)
  }
  return group
}

export const createDeepSkyModel = (item) => {
  const random = randomFor(item.id)
  let group
  if (item.deepTexture) group = texturedDeepSkyModel(item)
  else if (item.visual === 'star') group = starModel(item)
  else if (item.id === 'sombrero') group = sombreroGalaxy(item, random)
  else if (item.visual === 'galaxy') group = spiralGalaxy(item, random)
  else if (item.visual === 'nebula') group = cloudModel(item, random)
  else if (item.visual === 'remnant') group = remnantModel(item, random)
  else if (item.visual === 'planetary-nebula') group = planetaryNebula(item)
  else if (item.visual === 'black-hole') group = blackHoleModel(item, random)
  else if (item.visual === 'irregular-galaxy') group = irregularGalaxy(item, random)
  else group = stellarGroup(item, random)
  group.userData.item = item
  group.traverse((child) => { child.userData.item = item })
  return group
}
