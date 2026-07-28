import { Body, Equator, Observer } from 'astronomy-engine'

const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`

const deepSkyObservations = [
  { id: 'pillars', name: 'Pillars of Creation', catalog: 'M16 · Eagle Nebula', ra: 274.70, dec: -13.81, fov: 0.05, distanceLy: 6500, visual: 'nebula', year: 2022, distance: '6,500 ly', type: 'Star-forming region', observatories: ['webb', 'hubble'], color: '#e3a263', size: 24 },
  { id: 'carina', name: 'Cosmic Cliffs', catalog: 'NGC 3324 · Carina', ra: 161.26, dec: -59.87, fov: 0.04, distanceLy: 7600, visual: 'nebula', year: 2022, distance: '7,600 ly', type: 'Stellar nursery', observatories: ['webb'], color: '#e3a263', size: 19 },
  { id: 'cassiopeia', name: 'Cassiopeia A', catalog: 'Cas A', ra: 350.85, dec: 58.82, fov: 0.09, distanceLy: 11000, visual: 'remnant', year: 2023, distance: '11,000 ly', type: 'Supernova remnant', observatories: ['webb', 'chandra'], color: '#af8cf7', size: 18 },
  { id: 'whirlpool', name: 'Whirlpool Galaxy', catalog: 'M51 · NGC 5194', ra: 202.47, dec: 47.20, fov: 0.19, distanceLy: 23000000, visual: 'galaxy', year: 2023, distance: '23m ly', type: 'Spiral galaxy', observatories: ['webb', 'hubble', 'chandra'], color: '#d5a9e8', size: 16 },
  { id: 'deep-field', name: 'Webb Deep Field', catalog: 'SMACS 0723', ra: 110.84, dec: -73.45, fov: 0.04, distanceLy: 4600000000, visual: 'cluster', year: 2022, distance: '4.6b ly', type: 'Galaxy cluster', observatories: ['webb', 'hubble'], color: '#efbb7d', size: 14 },
  { id: 'orion', name: 'Orion Nebula', catalog: 'M42', ra: 83.82, dec: -5.39, fov: 1.1, distanceLy: 1344, visual: 'nebula', year: 2006, distance: '1,344 ly', type: 'Diffuse nebula', observatories: ['hubble', 'chandra'], color: '#719cdf', size: 15 },
  { id: 'crab', name: 'Crab Nebula', catalog: 'M1', ra: 83.63, dec: 22.01, fov: 0.12, distanceLy: 6500, visual: 'remnant', year: 2005, distance: '6,500 ly', type: 'Pulsar wind nebula', observatories: ['hubble', 'chandra'], color: '#b780ff', size: 15 },
  { id: 'sombrero', name: 'Sombrero Galaxy', catalog: 'M104 · NGC 4594', ra: 189.99, dec: -11.62, fov: 0.15, distanceLy: 31000000, visual: 'galaxy', profile: 'edge-on', year: 2003, distance: '31m ly', type: 'Galaxy', observatories: ['hubble'], color: '#71a3e4', size: 11 },
  { id: 'andromeda', name: 'Andromeda Galaxy', catalog: 'M31 · NGC 224', ra: 10.685, dec: 41.269, fov: 3.17, distanceLy: 2540000, visual: 'galaxy', profile: 'inclined-spiral', year: 2015, distance: '2.54m ly', type: 'Spiral galaxy', observatories: ['hubble', 'chandra'], color: '#9fb5d7', size: 14 },
  { id: 'm87', name: 'M87', catalog: 'Virgo A · M87', ra: 187.706, dec: 12.391, fov: 0.12, distanceLy: 53500000, visual: 'black-hole', profile: 'elliptical-jet', year: 2019, distance: '53.5m ly', type: 'Giant elliptical galaxy', observatories: ['hubble', 'chandra'], color: '#d5a36f', size: 12 },
  { id: 'sagittarius-a', name: 'Sagittarius A*', catalog: 'Galactic Center', ra: 266.417, dec: -29.008, fov: 0.05, distanceLy: 26670, visual: 'black-hole', profile: 'galactic-center', year: 2022, distance: '26,670 ly', type: 'Supermassive black hole', observatories: ['hubble', 'chandra'], color: '#e5a260', size: 12 },
  { id: 'lmc', name: 'Large Magellanic Cloud', catalog: 'LMC', ra: 80.894, dec: -69.756, fov: 10.75, distanceLy: 163000, visual: 'irregular-galaxy', profile: 'irregular', year: 2013, distance: '163,000 ly', type: 'Satellite galaxy', observatories: ['hubble', 'chandra'], color: '#83a5d4', size: 15 },
  { id: 'pleiades', name: 'The Pleiades', catalog: 'M45 · Seven Sisters', ra: 56.75, dec: 24.117, fov: 2, distanceLy: 444, visual: 'star-cluster', profile: 'open-cluster', year: 2004, distance: '444 ly', type: 'Open star cluster', observatories: ['hubble', 'chandra'], color: '#8bbcff', size: 13 },
  { id: 'helix', name: 'Helix Nebula', catalog: 'NGC 7293', ra: 337.411, dec: -20.837, fov: 0.42, distanceLy: 655, visual: 'planetary-nebula', profile: 'helix', year: 2003, distance: '655 ly', type: 'Planetary nebula', observatories: ['hubble', 'chandra'], color: '#75c5bd', size: 12 },
  { id: 'ring-nebula', name: 'Ring Nebula', catalog: 'M57 · NGC 6720', ra: 283.396, dec: 33.029, fov: 0.04, distanceLy: 2570, visual: 'planetary-nebula', profile: 'ring', year: 2013, distance: '2,570 ly', type: 'Planetary nebula', observatories: ['hubble', 'webb'], color: '#73bdd0', size: 11 },
]

const solarDefinitions = [
  { id: 'sun', body: Body.Sun, name: 'Sun', type: 'Star', visual: 'star', color: '#ffd27a', radiusKm: 696340, axialTilt: 7.25, surface: 'solar', texture: assetPath('textures/sun.jpg'), size: 12 },
  { id: 'moon', body: Body.Moon, name: 'Moon', type: 'Natural satellite', visual: 'moon', color: '#d8d5cc', radiusKm: 1737.4, axialTilt: 6.68, surface: 'cratered', texture: assetPath('textures/moon.jpg'), size: 9 },
  { id: 'mercury', body: Body.Mercury, name: 'Mercury', type: 'Terrestrial planet', visual: 'planet', color: '#a9a49c', radiusKm: 2439.7, axialTilt: .034, surface: 'cratered', texture: assetPath('textures/mercury.jpg'), size: 7 },
  { id: 'venus', body: Body.Venus, name: 'Venus', type: 'Terrestrial planet', visual: 'planet', color: '#e3bc78', radiusKm: 6051.8, axialTilt: 177.4, surface: 'clouded', texture: assetPath('textures/venus_surface.jpg'), size: 9 },
  { id: 'mars', body: Body.Mars, name: 'Mars', type: 'Terrestrial planet', visual: 'planet', color: '#cf7553', radiusKm: 3389.5, axialTilt: 25.19, surface: 'martian', texture: assetPath('textures/mars.jpg'), size: 8 },
  { id: 'jupiter', body: Body.Jupiter, name: 'Jupiter', type: 'Gas giant', visual: 'planet', color: '#d8b48e', radiusKm: 69911, axialTilt: 3.13, surface: 'jovian', texture: assetPath('textures/jupiter.jpg'), size: 11 },
  { id: 'saturn', body: Body.Saturn, name: 'Saturn', type: 'Ringed gas giant', visual: 'ringed-planet', color: '#d8c28a', radiusKm: 58232, axialTilt: 26.73, surface: 'saturnian', texture: assetPath('textures/saturn.jpg'), size: 11 },
  { id: 'uranus', body: Body.Uranus, name: 'Uranus', type: 'Ice giant', visual: 'planet', color: '#91c9d0', radiusKm: 25362, axialTilt: 97.77, surface: 'ice-giant', texture: assetPath('textures/uranus.jpg'), ringed: true, size: 9 },
  { id: 'neptune', body: Body.Neptune, name: 'Neptune', type: 'Ice giant', visual: 'planet', color: '#668be2', radiusKm: 24622, axialTilt: 28.32, surface: 'neptunian', texture: assetPath('textures/neptune.jpg'), size: 9 },
  { id: 'pluto', body: Body.Pluto, name: 'Pluto', type: 'Dwarf planet', visual: 'planet', color: '#b9a793', radiusKm: 1188.3, axialTilt: 119.6, surface: 'plutonian', texture: assetPath('textures/pluto.jpg'), textureCredit: 'NASA/JHUAPL/SwRI', size: 6 },
]

const ephemerisDate = new Date()
const geocenter = new Observer(0, 0, 0)
const solarSystemObservations = solarDefinitions.map((definition) => {
  const coordinates = Equator(definition.body, ephemerisDate, geocenter, false, true)
  const distanceAu = coordinates.dist
  return {
    ...definition,
    catalog: `Solar System · ${ephemerisDate.toISOString().slice(0, 10)}`,
    ra: coordinates.ra * 15,
    dec: coordinates.dec,
    fov: .001,
    distanceLy: distanceAu / 63241.077,
    year: 1990,
    distance: distanceAu < .01
      ? `${Math.round(distanceAu * 149597870.7).toLocaleString()} km`
      : `${distanceAu.toFixed(2)} AU`,
    observatories: [],
    scope: 'solar',
    ephemerisDate: ephemerisDate.toISOString(),
    modelProvenance: definition.texture
      ? {
          level: 'Mapped surface model',
          detail: 'A spherical model using an imagery- and elevation-informed global surface map.',
          confidence: 'Observed + reconstructed',
        }
      : {
          level: 'Type-based representation',
          detail: 'A procedural model based on the body’s measured color, size, and known physical features.',
          confidence: 'Interpretive',
        },
  }
})

const deepSkyProvenance = {
  pillars: ['Type-based representation', 'Procedural gas, dust, and embedded-star structure informed by the object class.'],
  carina: ['Type-based representation', 'Procedural star-forming cloud based on the visual behavior of emission nebulae.'],
  cassiopeia: ['Type-based representation', 'An asymmetric remnant shell; an official observation-derived model is planned.'],
  whirlpool: ['Type-based representation', 'A procedural face-on spiral with a stellar bulge and dust structure.'],
  'deep-field': ['Type-based representation', 'A representative distribution of galaxies rather than reconstructed three-dimensional positions.'],
  orion: ['Type-based representation', 'A volumetric nebula approximation; it is not yet NASA’s scientific Orion reconstruction.'],
  crab: ['Type-based representation', 'A filamentary remnant approximation; it is not yet the official NASA X-ray-derived model.'],
  sombrero: ['Type-based representation', 'A procedural edge-on galaxy with a stellar bulge and obscuring dust lane.'],
  andromeda: ['Image-informed representation', 'An inclined spiral profile using measured orientation, extent, and major structural features.'],
  m87: ['Image-informed representation', 'An elliptical stellar body with a compact core, accretion structure, and relativistic jet.'],
  'sagittarius-a': ['Image-informed representation', 'A compact dark core and accretion flow based on the known Galactic Center geometry.'],
  lmc: ['Image-informed representation', 'An irregular stellar distribution shaped to the measured extent of the satellite galaxy.'],
  pleiades: ['Catalog-derived representation', 'Member stars are represented as a blue open cluster with reflection-nebula structure.'],
  helix: ['Image-informed representation', 'A tilted bipolar shell and central-star system based on its observed ring structure.'],
  'ring-nebula': ['Image-informed representation', 'A layered ionized shell representing the nebula’s observed barrel-like form.'],
}

const deepSkyWithProvenance = deepSkyObservations.map((item) => {
  const [, detail] = deepSkyProvenance[item.id]
  return {
    ...item,
    deepTexture: assetPath(`deep-sky/${item.id}.png`),
    modelProvenance: {
      level: 'Image-informed synthetic model',
      detail: `${detail} Fine structure and emitted light use a generated texture rather than a telescope photograph.`,
      confidence: 'Interpretive',
    },
  }
})

export const observations = [...deepSkyWithProvenance, ...solarSystemObservations]

export const observatoryMeta = {
  webb: { name: 'Webb', detail: 'Infrared', color: '#e4a15b' },
  hubble: { name: 'Hubble', detail: 'Visible / UV', color: '#6899d9' },
  chandra: { name: 'Chandra', detail: 'X-ray', color: '#ad75f4' },
}
