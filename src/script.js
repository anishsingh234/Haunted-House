import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI()
gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Fog (exponential fog keeps the house crisp and swallows the distance)
const fogColor = '#262837'
scene.fog = new THREE.FogExp2(fogColor, 0.1)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const doorColorTexture = textureLoader.load('textures/door/color.jpg')
const doorAlphaTexture = textureLoader.load('textures/door/alpha.jpg')
const doorAmbientOcclusionTexture = textureLoader.load('textures/door/ambientOcclusion.jpg')
const doorHeightTexture = textureLoader.load('textures/door/height.jpg')
const doorNormalTexture = textureLoader.load('textures/door/normal.jpg')
const doorMetalnessTexture = textureLoader.load('textures/door/metalness.jpg')
const doorRoughnessTexture = textureLoader.load('textures/door/roughness.jpg')

const bricksColorTexture = textureLoader.load('textures/bricks/color.jpg')
const bricksAmbientOcclusionTexture = textureLoader.load('textures/bricks/ambientOcclusion.jpg')
const bricksNormalTexture = textureLoader.load('textures/bricks/normal.jpg')
const bricksRoughnessTexture = textureLoader.load('textures/bricks/roughness.jpg')

const grassColorTexture = textureLoader.load('textures/grass/color.jpg')
const grassAmbientOcclusionTexture = textureLoader.load('textures/grass/ambientOcclusion.jpg')
const grassNormalTexture = textureLoader.load('textures/grass/normal.jpg')
const grassRoughnessTexture = textureLoader.load('textures/grass/roughness.jpg')

// Color textures are sRGB encoded
doorColorTexture.colorSpace = THREE.SRGBColorSpace
bricksColorTexture.colorSpace = THREE.SRGBColorSpace
grassColorTexture.colorSpace = THREE.SRGBColorSpace

// Grass repeats across the (bigger) floor
const grassTextures = [grassColorTexture, grassAmbientOcclusionTexture, grassNormalTexture, grassRoughnessTexture]
for (const texture of grassTextures)
{
    texture.repeat.set(16, 16)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
}

/**
 * House
 */
const house = new THREE.Group()
scene.add(house)

// Walls
const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    new THREE.MeshStandardMaterial({
        map: bricksColorTexture,
        aoMap: bricksAmbientOcclusionTexture,
        normalMap: bricksNormalTexture,
        roughnessMap: bricksRoughnessTexture
    })
)
walls.position.y = 1.25
house.add(walls)

// Pyramid roof
const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1, 4),
    new THREE.MeshStandardMaterial({ color: '#b35f45', roughness: 0.85 })
)
roof.position.y = 2.5 + 0.5
roof.rotation.y = Math.PI * 0.25
house.add(roof)

// Chimney
const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1.2, 0.45),
    new THREE.MeshStandardMaterial({ color: '#6b3b2e', roughness: 0.9 })
)
chimney.position.set(-0.9, 3.2, -0.6)
house.add(chimney)

// Door
const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.1,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture
    })
)
door.position.y = 1
door.position.z = 2 + 0.01
house.add(door)

// Windows (warm glowing panes with a dark cross frame)
const windowPaneGeometry = new THREE.PlaneGeometry(0.7, 0.8)
const windowPaneMaterial = new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: '#ffa64d',
    emissiveIntensity: 1
})
const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: '#2b1d14', roughness: 1 })
const windowBarVerticalGeometry = new THREE.BoxGeometry(0.06, 0.86, 0.04)
const windowBarHorizontalGeometry = new THREE.BoxGeometry(0.76, 0.06, 0.04)

const createWindow = () =>
{
    const group = new THREE.Group()
    group.add(new THREE.Mesh(windowPaneGeometry, windowPaneMaterial))
    group.add(new THREE.Mesh(windowBarVerticalGeometry, windowFrameMaterial))
    group.add(new THREE.Mesh(windowBarHorizontalGeometry, windowFrameMaterial))
    return group
}

const windowLeft = createWindow()
windowLeft.position.set(-2.01, 1.4, 0)
windowLeft.rotation.y = -Math.PI * 0.5

const windowRight = createWindow()
windowRight.position.set(2.01, 1.4, 0)
windowRight.rotation.y = Math.PI * 0.5

const windowBack = createWindow()
windowBack.position.set(0, 1.4, -2.01)
windowBack.rotation.y = Math.PI

house.add(windowLeft, windowRight, windowBack)

// Bushes
const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
const bushMaterial = new THREE.MeshStandardMaterial({ color: '#6e9e48', roughness: 0.9 })

const bushes = [
    { scale: 0.5, position: [0.8, 0.1, 2.2] },
    { scale: 0.25, position: [1.4, 0.1, 2.1] },
    { scale: 0.4, position: [-0.8, 0.1, 2.2] },
    { scale: 0.15, position: [-1, 0.05, 2.6] }
]
for (const { scale, position } of bushes)
{
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.scale.setScalar(scale)
    bush.position.set(...position)
    // Hide the sphere's pinched pole from the default camera
    bush.rotation.x = -0.75
    bush.castShadow = true
    bush.receiveShadow = true
    house.add(bush)
}

/**
 * Graves
 */
const graves = new THREE.Group()
scene.add(graves)

const graveMaterial = new THREE.MeshStandardMaterial({ color: '#b2b6b1', roughness: 0.95 })

// Rounded headstone (origin at the base so tilting looks like it's sinking)
const headstoneShape = new THREE.Shape()
headstoneShape.moveTo(-0.3, 0)
headstoneShape.lineTo(0.3, 0)
headstoneShape.lineTo(0.3, 0.5)
headstoneShape.absarc(0, 0.5, 0.3, 0, Math.PI, false)
headstoneShape.lineTo(-0.3, 0)
const headstoneGeometry = new THREE.ExtrudeGeometry(headstoneShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 12
})
headstoneGeometry.translate(0, 0, -0.05)

// Plain slab
const slabGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1)
slabGeometry.translate(0, 0.4, 0)

// Cross
const crossGeometry = mergeGeometries([
    new THREE.BoxGeometry(0.12, 0.9, 0.1).translate(0, 0.45, 0),
    new THREE.BoxGeometry(0.5, 0.12, 0.1).translate(0, 0.62, 0)
])

const graveGeometries = [headstoneGeometry, headstoneGeometry, slabGeometry, crossGeometry]

const graveCount = 50
while (graves.children.length < graveCount)
{
    const angle = Math.random() * Math.PI * 2
    const radius = 3.5 + Math.random() * 5.5

    // Keep a clear path in front of the door
    const angleFromDoor = Math.atan2(Math.sin(angle), Math.cos(angle))
    if (Math.abs(angleFromDoor) < 0.35)
        continue

    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    const geometry = graveGeometries[Math.floor(Math.random() * graveGeometries.length)]
    const grave = new THREE.Mesh(geometry, graveMaterial)
    grave.position.set(x, -Math.random() * 0.15, z)
    grave.rotation.y = (Math.random() - 0.5) * 0.4
    grave.rotation.z = (Math.random() - 0.5) * 0.4
    grave.rotation.x = (Math.random() - 0.5) * 0.2
    grave.scale.setScalar(0.85 + Math.random() * 0.35)
    grave.castShadow = true
    grave.receiveShadow = true
    graves.add(grave)
}

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
        aoMap: grassAmbientOcclusionTexture,
        normalMap: grassNormalTexture,
        roughnessMap: grassRoughnessTexture
    })
)
floor.rotation.x = -Math.PI * 0.5
floor.position.y = 0
scene.add(floor)

/**
 * Sky
 */
// Stars (upper hemisphere only, not affected by fog)
const starCount = 1500
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++)
{
    const theta = Math.random() * Math.PI * 2
    const y = 0.1 + Math.random() * 0.9
    const horizontal = Math.sqrt(1 - y * y)
    const radius = 40

    starPositions[i * 3 + 0] = Math.cos(theta) * horizontal * radius
    starPositions[i * 3 + 1] = y * radius
    starPositions[i * 3 + 2] = Math.sin(theta) * horizontal * radius
}
const starsGeometry = new THREE.BufferGeometry()
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
        size: 0.15,
        sizeAttenuation: true,
        color: '#ffffff',
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        fog: false
    })
)
scene.add(stars)

// Moon (follows the moon light direction)
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: '#e8f0ff', fog: false })
)
scene.add(moon)

/**
 * Lights
 */
const lightsFolder = gui.addFolder('Lights')

// Ambient light
// (three r155+ uses physically based light units, so old intensities are multiplied by PI)
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.12 * Math.PI)
lightsFolder.add(ambientLight, 'intensity').min(0).max(1).step(0.001).name('ambientIntensity')
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.12 * Math.PI)
moonLight.position.set(4, 5, -2)
lightsFolder.add(moonLight, 'intensity').min(0).max(1).step(0.001).name('moonIntensity')
lightsFolder.add(moonLight.position, 'x').min(-5).max(5).step(0.001).name('moonX')
lightsFolder.add(moonLight.position, 'y').min(-5).max(5).step(0.001).name('moonY')
lightsFolder.add(moonLight.position, 'z').min(-5).max(5).step(0.001).name('moonZ')
scene.add(moonLight)

// Door light (flickers in the tick function around this base intensity)
// (point lights now use physical decay, so they need higher intensities than before)
const doorLightParams = { intensity: 5, flicker: true }
const doorLight = new THREE.PointLight('#ff7d46', doorLightParams.intensity, 7)
doorLight.position.set(0, 2.2, 2.7)
lightsFolder.add(doorLightParams, 'intensity').min(0).max(20).step(0.001).name('doorIntensity')
lightsFolder.add(doorLightParams, 'flicker').name('doorFlicker')
house.add(doorLight)

// Ghosts (a coloured point light carrying a small glowing orb)
const ghostCoreGeometry = new THREE.SphereGeometry(0.06, 16, 16)
const ghostHaloGeometry = new THREE.SphereGeometry(0.18, 16, 16)

const createGhost = (color) =>
{
    const light = new THREE.PointLight(color, 6, 3)

    const core = new THREE.Mesh(ghostCoreGeometry, new THREE.MeshBasicMaterial({ color: '#ffffff' }))
    const halo = new THREE.Mesh(
        ghostHaloGeometry,
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    )
    light.add(core, halo)

    scene.add(light)
    return light
}

const ghost1 = createGhost('#ff00ff')
const ghost2 = createGhost('#00ffff')
const ghost3 = createGhost('#ffff00')
const ghosts = [ghost1, ghost2, ghost3]

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 5
scene.add(camera)

// Controls (stay above the ground and inside the fog so the floor edge never shows)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1, 0)
controls.maxPolarAngle = Math.PI * 0.48
controls.minDistance = 3
controls.maxDistance = 12
controls.enablePan = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(fogColor)

// Sharper grass at grazing angles
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
for (const texture of grassTextures)
    texture.anisotropy = maxAnisotropy

/**
 * Shadows
 */
renderer.shadowMap.enabled = true
// PCFSoftShadowMap was removed in three r18x; PCF + shadow.radius gives the soft look
renderer.shadowMap.type = THREE.PCFShadowMap

moonLight.castShadow = true
doorLight.castShadow = true
for (const ghost of ghosts)
    ghost.castShadow = true

walls.castShadow = true
walls.receiveShadow = true
roof.castShadow = true
chimney.castShadow = true
floor.receiveShadow = true

// Moon light shadow covers the whole graveyard
moonLight.shadow.mapSize.set(1024, 1024)
moonLight.shadow.camera.left = -10
moonLight.shadow.camera.right = 10
moonLight.shadow.camera.top = 10
moonLight.shadow.camera.bottom = -10
moonLight.shadow.camera.near = 0.1
moonLight.shadow.camera.far = 20
moonLight.shadow.normalBias = 0.02
moonLight.shadow.radius = 3

doorLight.shadow.mapSize.set(256, 256)
doorLight.shadow.camera.far = 7
doorLight.shadow.radius = 3

for (const ghost of ghosts)
{
    ghost.shadow.mapSize.set(256, 256)
    ghost.shadow.camera.far = 7
    ghost.shadow.radius = 3
}

/**
 * Animate
 */
const timer = new THREE.Timer()
timer.connect(document)

const tick = (timestamp) =>
{
    timer.update(timestamp)
    const elapsedTime = timer.getElapsed()

    // Update ghosts
    const ghost1Angle = elapsedTime * 0.5
    ghost1.position.x = Math.cos(ghost1Angle) * 4
    ghost1.position.z = Math.sin(ghost1Angle) * 4
    ghost1.position.y = Math.sin(elapsedTime * 3)

    const ghost2Angle = -elapsedTime * 0.32
    ghost2.position.x = Math.cos(ghost2Angle) * 5
    ghost2.position.z = Math.sin(ghost2Angle) * 5
    ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5)

    const ghost3Angle = -elapsedTime * 0.18
    ghost3.position.x = Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32))
    ghost3.position.z = Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5))
    ghost3.position.y = Math.sin(elapsedTime * 5) + Math.sin(elapsedTime * 2)

    // Flickering door light and windows
    let flicker = 1
    if (doorLightParams.flicker)
    {
        flicker = 0.85 + Math.sin(elapsedTime * 10) * Math.sin(elapsedTime * 7.3) * Math.sin(elapsedTime * 3.1) * 0.15
        // Occasional deep dip, like a bulb about to die
        if (Math.sin(elapsedTime * 1.7) + Math.sin(elapsedTime * 2.9) > 1.85)
            flicker *= 0.3
    }
    doorLight.intensity = doorLightParams.intensity * flicker
    windowPaneMaterial.emissiveIntensity = 0.6 + flicker * 0.5

    // Keep the moon in the sky where the moon light comes from
    moon.position.copy(moonLight.position).normalize().multiplyScalar(45)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
