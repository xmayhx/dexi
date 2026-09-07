import * as THREE from 'three';

// ===== TYPES =====
export type LocationType = 'hut' | 'stone' | 'gaming' | 'portal' | null;

interface GameState {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  player: THREE.Group;
  playerPos: THREE.Vector3;
  playerTarget: THREE.Vector3;
  keys: Set<string>;
  locations: Map<string, THREE.Group>;
  eyes: THREE.Group[];
  clock: THREE.Clock;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  hoveredLocation: LocationType;
  onLocationEnter: (loc: LocationType) => void;
  onLocationHover: (loc: LocationType) => void;
  animationId: number;
  particles: THREE.Points;
  fog: THREE.FogExp2;
}

let state: GameState | null = null;

// ===== PIXEL RENDERING =====
const PIXEL_SCALE = 3; // Lower = more pixelated

export function initScene(
  canvas: HTMLCanvasElement,
  onLocationEnter: (loc: LocationType) => void,
  onLocationHover: (loc: LocationType) => void
) {
  // Renderer with low resolution for pixel effect
  const width = Math.floor(window.innerWidth / PIXEL_SCALE);
  const height = Math.floor(window.innerHeight / PIXEL_SCALE);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.setClearColor(0x050508);

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.04);

  // Camera (isometric-ish top-down)
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 18, 12);
  camera.lookAt(0, 0, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x4444aa, 0.4);
  moonLight.position.set(-10, 20, -5);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(512, 512);
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 50;
  moonLight.shadow.camera.left = -20;
  moonLight.shadow.camera.right = 20;
  moonLight.shadow.camera.top = 20;
  moonLight.shadow.camera.bottom = -20;
  scene.add(moonLight);

  // Point light for hut
  const hutLight = new THREE.PointLight(0xff8833, 2, 8);
  hutLight.position.set(-6, 2, -4);
  hutLight.castShadow = true;
  scene.add(hutLight);

  // Gaming area light
  const gamingLight = new THREE.PointLight(0x8833ff, 1.5, 6);
  gamingLight.position.set(7, 2, 3);
  scene.add(gamingLight);

  // Ground
  createGround(scene);

  // Trees (dark forest)
  createForest(scene);

  // Locations
  const locations = new Map<string, THREE.Group>();

  const hut = createHut(scene);
  hut.position.set(-6, 0, -4);
  scene.add(hut);
  locations.set('hut', hut);

  const stone = createCrossroadsStone(scene);
  stone.position.set(0, 0, 0);
  scene.add(stone);
  locations.set('stone', stone);

  const gaming = createGamingArea(scene);
  gaming.position.set(7, 0, 3);
  scene.add(gaming);
  locations.set('gaming', gaming);

  // Hidden portal (between trees, slightly visible)
  const portal = createHiddenPortal(scene);
  portal.position.set(-3, 0, 7);
  scene.add(portal);
  locations.set('portal', portal);

  // Player
  const player = createPlayer();
  player.position.set(0, 0, 4);
  scene.add(player);

  // Eyes in darkness
  const eyes = createEyes(scene);

  // Particles (fireflies/dust)
  const particles = createParticles(scene);

  // Path markers
  createPaths(scene);

  // State
  state = {
    camera,
    scene,
    renderer,
    player,
    playerPos: new THREE.Vector3(0, 0, 4),
    playerTarget: new THREE.Vector3(0, 0, 4),
    keys: new Set(),
    locations,
    eyes,
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    hoveredLocation: null,
    onLocationEnter,
    onLocationHover,
    animationId: 0,
    particles,
    fog: scene.fog as THREE.FogExp2,
  };

  // Events
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  // Start loop
  animate();
}

// ===== WORLD CREATION =====

function createGround(scene: THREE.Scene) {
  // Dark ground with pixel texture
  const groundGeo = new THREE.PlaneGeometry(60, 60, 30, 30);
  const groundMat = new THREE.MeshLambertMaterial({ 
    color: 0x0a0f0a,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grass patches (voxel style)
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 30;
    const grassGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    const grassMat = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color().setHSL(0.3, 0.3, 0.05 + Math.random() * 0.05) 
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.set(x, 0.05, z);
    scene.add(grass);
  }
}

function createTree(scene: THREE.Scene, x: number, z: number, height: number) {
  const group = new THREE.Group();
  
  // Trunk
  const trunkGeo = new THREE.BoxGeometry(0.5, height, 0.5);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x1a0f08 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage (dark, sparse)
  const foliageSize = 1.5 + Math.random();
  for (let i = 0; i < 3; i++) {
    const fGeo = new THREE.BoxGeometry(foliageSize - i * 0.3, 0.8, foliageSize - i * 0.3);
    const fMat = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color().setHSL(0.35, 0.2, 0.03 + Math.random() * 0.03) 
    });
    const foliage = new THREE.Mesh(fGeo, fMat);
    foliage.position.y = height + i * 0.7;
    foliage.castShadow = true;
    group.add(foliage);
  }

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function createForest(scene: THREE.Scene) {
  const treePositions: [number, number][] = [];
  
  // Dense forest around the edges
  for (let i = 0; i < 60; i++) {
    let x, z;
    do {
      x = (Math.random() - 0.5) * 28;
      z = (Math.random() - 0.5) * 28;
    } while (
      // Keep clear of locations
      (Math.abs(x + 6) < 3 && Math.abs(z + 4) < 3) || // hut
      (Math.abs(x) < 2.5 && Math.abs(z) < 2.5) || // stone
      (Math.abs(x - 7) < 3 && Math.abs(z - 3) < 3) || // gaming
      (Math.abs(x + 3) < 2 && Math.abs(z - 7) < 2) || // portal
      (Math.abs(x) < 2 && Math.abs(z - 4) < 2) // player start
    );
    
    treePositions.push([x, z]);
    const height = 2 + Math.random() * 3;
    createTree(scene, x, z, height);
  }

  // Extra dark trees at edges
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 5;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    createTree(scene, x, z, 3 + Math.random() * 4);
  }
}

// ===== LOCATIONS =====

function createHut(scene: THREE.Scene): THREE.Group {
  const hut = new THREE.Group();
  hut.userData = { type: 'hut', interactable: true };

  // Base/walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
  
  // Walls
  const wallGeo = new THREE.BoxGeometry(3, 2.5, 3);
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = 1.25;
  walls.castShadow = true;
  hut.add(walls);

  // Roof
  const roofGeo = new THREE.ConeGeometry(2.5, 1.5, 4);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x1a0a05 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  hut.add(roof);

  // Window (glowing)
  const windowGeo = new THREE.BoxGeometry(0.6, 0.6, 0.1);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xff8833 });
  const window1 = new THREE.Mesh(windowGeo, windowMat);
  window1.position.set(0, 1.5, 1.55);
  hut.add(window1);

  const window2 = new THREE.Mesh(windowGeo, windowMat);
  window2.position.set(1.55, 1.5, 0);
  window2.rotation.y = Math.PI / 2;
  hut.add(window2);

  // Door
  const doorGeo = new THREE.BoxGeometry(0.8, 1.5, 0.1);
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2010 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(-0.5, 0.75, 1.55);
  hut.add(door);

  // Newspaper icon floating above
  const iconGroup = new THREE.Group();
  const paperGeo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
  const paperMat = new THREE.MeshBasicMaterial({ color: 0xddccaa });
  const paper = new THREE.Mesh(paperGeo, paperMat);
  iconGroup.add(paper);
  
  // Text lines on paper
  for (let i = 0; i < 3; i++) {
    const lineGeo = new THREE.BoxGeometry(0.5, 0.05, 0.02);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, 0.15 - i * 0.15, 0.06);
    iconGroup.add(line);
  }
  
  iconGroup.position.set(0, 4.5, 0);
  iconGroup.userData = { floating: true };
  hut.add(iconGroup);

  // Light beam from windows
  const beamLight = new THREE.PointLight(0xff8833, 1, 4);
  beamLight.position.set(0, 1.5, 2);
  hut.add(beamLight);

  // Chimney smoke particles placeholder
  const smokeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 3; i++) {
    const smoke = new THREE.Mesh(smokeGeo, smokeMat.clone());
    smoke.position.set(0.8, 3.8 + i * 0.5, -0.8);
    smoke.userData = { smokeParticle: true, offset: i };
    hut.add(smoke);
  }

  return hut;
}

function createCrossroadsStone(scene: THREE.Scene): THREE.Group {
  const stone = new THREE.Group();
  stone.userData = { type: 'stone', interactable: true };

  // Main stone
  const stoneGeo = new THREE.BoxGeometry(1.5, 2.5, 1);
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
  const mainStone = new THREE.Mesh(stoneGeo, stoneMat);
  mainStone.position.y = 1.25;
  mainStone.castShadow = true;
  stone.add(mainStone);

  // Stone top (rough)
  const topGeo = new THREE.BoxGeometry(1.8, 0.5, 1.3);
  const top = new THREE.Mesh(topGeo, stoneMat);
  top.position.y = 2.6;
  top.castShadow = true;
  stone.add(top);

  // Sign post left (to hut)
  const signGeo = new THREE.BoxGeometry(1.5, 0.4, 0.1);
  const signMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
  const sign1 = new THREE.Mesh(signGeo, signMat);
  sign1.position.set(-1, 2, 0.6);
  sign1.rotation.y = -0.3;
  stone.add(sign1);

  // Sign post right (to gaming)
  const sign2 = new THREE.Mesh(signGeo, signMat);
  sign2.position.set(1, 1.5, 0.6);
  sign2.rotation.y = 0.3;
  stone.add(sign2);

  // Mystical glow at base
  const glowGeo = new THREE.RingGeometry(1.5, 2, 8);
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0x4444aa, 
    transparent: true, 
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.05;
  stone.add(glow);

  // Rune markings
  const runeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.05);
  const runeMat = new THREE.MeshBasicMaterial({ color: 0x6666ff });
  const runePositions = [
    [0, 1.8, 0.55], [0.3, 1.5, 0.55], [-0.3, 1.5, 0.55],
    [0, 1.2, 0.55], [0.2, 2.1, 0.55]
  ];
  runePositions.forEach(([x, y, z]) => {
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(x, y, z);
    stone.add(rune);
  });

  return stone;
}

function createGamingArea(scene: THREE.Scene): THREE.Group {
  const gaming = new THREE.Group();
  gaming.userData = { type: 'gaming', interactable: true };

  // Platform
  const platGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 8);
  const platMat = new THREE.MeshLambertMaterial({ color: 0x1a0a2a });
  const platform = new THREE.Mesh(platGeo, platMat);
  platform.position.y = 0.15;
  platform.receiveShadow = true;
  gaming.add(platform);

  // Portal arch
  const archGeo = new THREE.TorusGeometry(1.5, 0.2, 8, 8, Math.PI);
  const archMat = new THREE.MeshBasicMaterial({ color: 0x8833ff });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 1.5, 0);
  gaming.add(arch);

  // Portal swirl (inside arch)
  const swirlGeo = new THREE.CircleGeometry(1.3, 8);
  const swirlMat = new THREE.MeshBasicMaterial({ 
    color: 0x6622cc, 
    transparent: true, 
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const swirl = new THREE.Mesh(swirlGeo, swirlMat);
  swirl.position.set(0, 1.5, 0);
  swirl.userData = { portalSwirl: true };
  gaming.add(swirl);

  // Floating crystals
  for (let i = 0; i < 4; i++) {
    const crystalGeo = new THREE.OctahedronGeometry(0.3);
    const crystalMat = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color().setHSL(0.75 + i * 0.05, 0.8, 0.5) 
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    const angle = (i / 4) * Math.PI * 2;
    crystal.position.set(Math.cos(angle) * 2, 1 + Math.sin(i) * 0.5, Math.sin(angle) * 2);
    crystal.userData = { crystal: true, angle: angle, speed: 0.5 + Math.random() * 0.5 };
    gaming.add(crystal);
  }

  // Label
  const labelGeo = new THREE.BoxGeometry(2, 0.3, 0.1);
  const labelMat = new THREE.MeshBasicMaterial({ color: 0x8833ff });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 3.5, 0);
  gaming.add(label);

  return gaming;
}

function createHiddenPortal(scene: THREE.Scene): THREE.Group {
  const portal = new THREE.Group();
  portal.userData = { type: 'portal', interactable: true, hidden: true };

  // Subtle glow on ground (hardly visible)
  const glowGeo = new THREE.CircleGeometry(0.8, 6);
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0xff69b4, 
    transparent: true, 
    opacity: 0.08,
    side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.05;
  portal.add(glow);

  // Small rainbow shimmer (very subtle)
  const shimmerGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const shimmerMat = new THREE.MeshBasicMaterial({ 
    color: 0xff69b4, 
    transparent: true, 
    opacity: 0.15 
  });
  const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
  shimmer.position.y = 0.5;
  shimmer.userData = { shimmer: true };
  portal.add(shimmer);

  // Tiny sparkles
  for (let i = 0; i < 3; i++) {
    const sparkGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const sparkMat = new THREE.MeshBasicMaterial({ 
      color: [0xff0000, 0xffff00, 0x00ffff][i],
      transparent: true,
      opacity: 0.2
    });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.set(
      (Math.random() - 0.5) * 1,
      0.3 + Math.random() * 0.5,
      (Math.random() - 0.5) * 1
    );
    spark.userData = { sparkle: true, offset: i };
    portal.add(spark);
  }

  return portal;
}

// ===== PLAYER =====

function createPlayer(): THREE.Group {
  const player = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.5);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a4a });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.65;
  player.add(body);

  // Head
  const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.2;
  player.add(head);

  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(-0.1, 1.25, 0.22);
  player.add(eye1);
  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(0.1, 1.25, 0.22);
  player.add(eye2);

  // Cloak
  const cloakGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
  const cloakMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
  const cloak = new THREE.Mesh(cloakGeo, cloakMat);
  cloak.position.set(0, 0.6, -0.2);
  player.add(cloak);

  // Player light
  const playerLight = new THREE.PointLight(0x4466aa, 0.5, 4);
  playerLight.position.y = 1.5;
  player.add(playerLight);

  return player;
}

// ===== EYES IN DARKNESS =====

function createEyes(scene: THREE.Scene): THREE.Group[] {
  const eyes: THREE.Group[] = [];
  
  for (let i = 0; i < 8; i++) {
    const eyeGroup = new THREE.Group();
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 6;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = 1 + Math.random() * 2;

    // Left eye
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ 
      color: Math.random() > 0.5 ? 0xff3300 : 0xffff00,
      transparent: true,
      opacity: 0
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 0, 0);
    eyeGroup.add(leftEye);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(0.15, 0, 0);
    eyeGroup.add(rightEye);

    eyeGroup.position.set(x, y, z);
    eyeGroup.userData = { 
      blinkTimer: Math.random() * 10,
      visibleTimer: 0,
      maxVisible: 2 + Math.random() * 4,
      hiddenTimer: 3 + Math.random() * 8,
      isVisible: false
    };

    scene.add(eyeGroup);
    eyes.push(eyeGroup);
  }

  return eyes;
}

// ===== PARTICLES =====

function createParticles(scene: THREE.Scene): THREE.Points {
  const count = 100;
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 25;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({ 
    color: 0x44ff88, 
    size: 0.1, 
    transparent: true, 
    opacity: 0.4 
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);
  return particles;
}

// ===== PATHS =====

function createPaths(scene: THREE.Scene) {
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x1a1510 });
  
  // Path to hut
  for (let i = 0; i < 8; i++) {
    const stoneGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const stone = new THREE.Mesh(stoneGeo, pathMat);
    stone.position.set(-i * 0.8, 0.02, -i * 0.5 + 2);
    stone.receiveShadow = true;
    scene.add(stone);
  }

  // Path to gaming
  for (let i = 0; i < 8; i++) {
    const stoneGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const stone = new THREE.Mesh(stoneGeo, pathMat);
    stone.position.set(i * 0.9, 0.02, i * 0.4);
    stone.receiveShadow = true;
    scene.add(stone);
  }
}

// ===== EVENT HANDLERS =====

function onKeyDown(e: KeyboardEvent) {
  if (state) state.keys.add(e.key.toLowerCase());
}

function onKeyUp(e: KeyboardEvent) {
  if (state) state.keys.delete(e.key.toLowerCase());
}

function onClick(e: MouseEvent) {
  if (!state) return;
  
  const rect = state.renderer.domElement.getBoundingClientRect();
  state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  state.raycaster.setFromCamera(state.mouse, state.camera);
  
  // Check location intersections
  const locationObjects: THREE.Object3D[] = [];
  state.locations.forEach((group) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        locationObjects.push(child);
      }
    });
  });

  const intersects = state.raycaster.intersectObjects(locationObjects, false);
  
  if (intersects.length > 0) {
    // Find which location was clicked
    let clickedObj = intersects[0].object;
    while (clickedObj.parent && !clickedObj.userData.type) {
      clickedObj = clickedObj.parent as THREE.Object3D;
    }
    
    if (clickedObj.userData.type) {
      // Move player towards location
      const locPos = clickedObj.position.clone();
      state.playerTarget.copy(locPos);
      state.playerTarget.z += 2.5; // Stop in front
      
      // Check if close enough to interact
      const dist = state.playerPos.distanceTo(locPos);
      if (dist < 4) {
        state.onLocationEnter(clickedObj.userData.type as LocationType);
      }
    }
  }
}

function onMouseMove(e: MouseEvent) {
  if (!state) return;
  
  const rect = state.renderer.domElement.getBoundingClientRect();
  state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  state.raycaster.setFromCamera(state.mouse, state.camera);
  
  const locationObjects: THREE.Object3D[] = [];
  state.locations.forEach((group) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        locationObjects.push(child);
      }
    });
  });

  const intersects = state.raycaster.intersectObjects(locationObjects, false);
  
  let newHovered: LocationType = null;
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj.parent && !obj.userData.type) {
      obj = obj.parent as THREE.Object3D;
    }
    if (obj.userData.type) {
      newHovered = obj.userData.type as LocationType;
    }
  }

  if (newHovered !== state.hoveredLocation) {
    state.hoveredLocation = newHovered;
    state.onLocationHover(newHovered);
  }
}

function onResize() {
  if (!state) return;
  const width = Math.floor(window.innerWidth / PIXEL_SCALE);
  const height = Math.floor(window.innerHeight / PIXEL_SCALE);
  state.renderer.setSize(width, height);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

// ===== ANIMATION LOOP =====

function animate() {
  if (!state) return;
  state.animationId = requestAnimationFrame(animate);

  const delta = state.clock.getDelta();
  const time = state.clock.getElapsedTime();

  // Player movement
  const speed = 4 * delta;
  let dx = 0, dz = 0;

  if (state.keys.has('w') || state.keys.has('arrowup')) dz -= speed;
  if (state.keys.has('s') || state.keys.has('arrowdown')) dz += speed;
  if (state.keys.has('a') || state.keys.has('arrowleft')) dx -= speed;
  if (state.keys.has('d') || state.keys.has('arrowright')) dx += speed;

  if (dx !== 0 || dz !== 0) {
    state.playerPos.x += dx;
    state.playerPos.z += dz;
    // Clamp to world bounds
    state.playerPos.x = Math.max(-13, Math.min(13, state.playerPos.x));
    state.playerPos.z = Math.max(-13, Math.min(13, state.playerPos.z));
    state.playerTarget.copy(state.playerPos);
  } else {
    // Smooth movement to target
    state.playerPos.lerp(state.playerTarget, 3 * delta);
  }

  state.player.position.copy(state.playerPos);

  // Player bob
  state.player.position.y = Math.sin(time * 5) * 0.05;

  // Player face direction
  if (dx !== 0 || dz !== 0) {
    state.player.rotation.y = Math.atan2(dx, dz);
  }

  // Camera follow
  const camTarget = new THREE.Vector3(
    state.playerPos.x,
    18,
    state.playerPos.z + 12
  );
  state.camera.position.lerp(camTarget, 2 * delta);
  state.camera.lookAt(state.playerPos.x, 0, state.playerPos.z);

  // Animate floating icons
  state.scene.traverse((obj) => {
    if (obj.userData.floating) {
      obj.position.y = 4.5 + Math.sin(time * 2) * 0.3;
      obj.rotation.y = time * 0.5;
    }
    if (obj.userData.smokeParticle) {
      const offset = obj.userData.offset as number;
      obj.position.y = 3.8 + offset * 0.5 + Math.sin(time + offset) * 0.3;
      obj.position.x = 0.8 + Math.sin(time * 0.5 + offset) * 0.2;
      (obj as THREE.Mesh).material = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
      ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 
        0.3 - offset * 0.08 + Math.sin(time + offset) * 0.1;
    }
    if (obj.userData.portalSwirl) {
      obj.rotation.z = time * 2;
    }
    if (obj.userData.crystal) {
      const angle = obj.userData.angle + time * obj.userData.speed;
      const parent = obj.parent;
      if (parent) {
        obj.position.x = Math.cos(angle) * 2;
        obj.position.z = Math.sin(angle) * 2;
        obj.position.y = 1 + Math.sin(time * 2 + obj.userData.angle) * 0.5;
      }
      obj.rotation.y = time * 3;
    }
    if (obj.userData.shimmer) {
      obj.rotation.y = time * 2;
      obj.rotation.x = time * 1.5;
      ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 
        0.1 + Math.sin(time * 3) * 0.08;
    }
    if (obj.userData.sparkle) {
      const offset = obj.userData.offset;
      obj.position.y = 0.3 + Math.sin(time * 2 + offset * 2) * 0.3;
      ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 
        0.1 + Math.sin(time * 4 + offset) * 0.15;
    }
  });

  // Animate eyes
  state.eyes.forEach((eyeGroup) => {
    const data = eyeGroup.userData;
    data.blinkTimer += delta;

    if (!data.isVisible) {
      data.hiddenTimer -= delta;
      if (data.hiddenTimer <= 0) {
        data.isVisible = true;
        data.visibleTimer = data.maxVisible;
      }
    } else {
      data.visibleTimer -= delta;
      if (data.visibleTimer <= 0) {
        data.isVisible = false;
        data.hiddenTimer = 3 + Math.random() * 8;
      }
    }

    const targetOpacity = data.isVisible ? 0.8 : 0;
    eyeGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity += (targetOpacity - mat.opacity) * 3 * delta;
      }
    });

    // Blink
    if (data.isVisible && Math.sin(data.blinkTimer * 3) > 0.95) {
      eyeGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      });
    }
  });

  // Animate particles
  const positions = state.particles.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    positions.setY(i, y + Math.sin(time + i) * 0.003);
    const x = positions.getX(i);
    positions.setX(i, x + Math.cos(time * 0.5 + i) * 0.002);
  }
  positions.needsUpdate = true;

  // Render
  state.renderer.render(state.scene, state.camera);
}

// ===== CLEANUP =====

export function cleanup() {
  if (!state) return;
  cancelAnimationFrame(state.animationId);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('resize', onResize);
  state.renderer.dispose();
  state = null;
}

// ===== PROXIMITY CHECK =====

export function checkProximity(): LocationType {
  if (!state) return null;
  
  let closest: LocationType = null;
  let closestDist = Infinity;

  state.locations.forEach((group, key) => {
    const dist = state!.playerPos.distanceTo(group.position);
    if (dist < 3.5 && dist < closestDist) {
      closest = key as LocationType;
      closestDist = dist;
    }
  });

  return closest;
}

export function getPlayerPosition(): THREE.Vector3 {
  if (!state) return new THREE.Vector3();
  return state.playerPos.clone();
}
