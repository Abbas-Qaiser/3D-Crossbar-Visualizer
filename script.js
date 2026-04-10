// ═══════════════════════════════════════════════════════════════
//  Crossbar Array 3D Visualizer — script.js v4.0
//  Three.js r135 · UMD globals
//  MeshPhysicalMaterial · RoomEnvironment IBL · Rounded-bar geometry
//  InstancedMesh throughout for performance
// ═══════════════════════════════════════════════════════════════

// THREE, OrbitControls, RoomEnvironment, RoundedBoxGeometry
// are loaded as UMD globals from CDN script tags in index.html

/* ──────────────────────────────────────────────────────────────
   WEBGL CHECK
────────────────────────────────────────────────────────────── */
try {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')))
    throw new Error('no webgl');
} catch (_) {
  document.body.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'height:100vh;gap:16px;font-family:system-ui,sans-serif;background:#07090f;color:#aab4cc;' +
    'text-align:center;padding:24px">' +
    '<div style="font-size:38px">⚠</div>' +
    '<div style="font-size:20px;font-weight:700;color:#e8eeff">WebGL Not Supported</div>' +
    '<div style="font-size:13px;opacity:0.65;max-width:400px;line-height:1.7">' +
    'Please use a modern browser (Chrome 80+, Firefox 79+, Edge 80+).</div></div>';
  throw new Error('WebGL unavailable — halting');
}

/* ──────────────────────────────────────────────────────────────
   DEFAULT PARAMETERS
────────────────────────────────────────────────────────────── */
const DEFAULTS = {
  rows:            4,
  cols:            4,
  barWidth:        0.35,
  barHeight:       0.10,
  spacing:         1.00,
  overhang:        0.50,
  switchShape:     'box',
  switchSize:      0.38,
  switchDiameter:  0.34,
  switchHeight:    0.22,
  layerCount:      1,       // switching layers per crossbar (1=mono, 2=bi, 3=tri)
  stackCount:      1,       // independent crossbar stacks
  stackSpacing:    2.50,
  substratePad:    0.40,    // how far substrate extends beyond bars
  markerSize:      0.07,    // intersection marker radius
  colorBottom:     '#94A3B8',
  colorTop:        '#F59E0B',
  colorSwitch:     '#8B5CF6',
  colorSwitch2:    '#EC4899',  // second switching layer color (bilayer/tri)
  colorSubstrate:  '#334155',
  colorMarker:     '#F97316',
  opacity:         1.00,
  gridOpacity:     0.60,
  showSubstrate:   true,
  showLabels:      true,
  showGrid:        true,
  showAxes:        false,
  showMarkers:     false,
  showShadow:      true,
  showTopBars:     true,
  showBottomBars:  true,
  showSwitchLayer: true,
  autoRotate:      false,
  theme:           'dark-lab',
};

let P = { ...DEFAULTS };

/* ──────────────────────────────────────────────────────────────
   THEME DEFINITIONS (scene lighting + Three.js background)
────────────────────────────────────────────────────────────── */
const THEMES = {
  'dark-lab': {
    sceneBg:    0x07090f,
    fogColor:   0x07090f,
    fogDensity: 0.017,
    gridA:      0x1a2a4a,
    gridB:      0x0c1525,
    ambient:    0.22,
    hemiSky:    0x223366,   hemiGnd: 0x050515,  hemiInt: 0.55,
    key:        2.40,       keyCol:  0xfff8f0,
    fill:       0x3366ff,   fillInt: 0.55,
    rim:        0x7c3aed,   rimInt:  2.60,
    bounce:     0x1e3a8a,   bounceInt: 1.20,
    envInt:     0.75,       shadowOp: 0.18,
  },
  'light-clean': {
    sceneBg:    0xf8fafc,
    fogColor:   0xf8fafc,
    fogDensity: 0.012,
    gridA:      0xd1d5db,
    gridB:      0xe5e7eb,
    ambient:    0.70,
    hemiSky:    0xd4e5f7,   hemiGnd: 0xc8d9ee,  hemiInt: 0.80,
    key:        1.30,       keyCol:  0xffffff,
    fill:       0x5b9cf5,   fillInt: 0.40,
    rim:        0x3b82f6,   rimInt:  0.95,
    bounce:     0xe0f2fe,   bounceInt: 0.60,
    envInt:     1.25,       shadowOp: 0.06,
  },
  'presentation': {
    sceneBg:    0xffffff,
    fogColor:   0xffffff,
    fogDensity: 0.010,
    gridA:      0xdddddd,
    gridB:      0xf0f0f0,
    ambient:    0.80,
    hemiSky:    0xe8eef5,   hemiGnd: 0xd8e4f0,  hemiInt: 0.85,
    key:        1.10,       keyCol:  0xffffff,
    fill:       0x7da3e8,   fillInt: 0.35,
    rim:        0x4b7bdb,   rimInt:  0.70,
    bounce:     0xf0f5fd,   bounceInt: 0.50,
    envInt:     1.50,       shadowOp: 0.04,
  },
  'high-contrast': {
    sceneBg:    0x000000,
    fogColor:   0x000000,
    fogDensity: 0.008,
    gridA:      0x1a1a1a,
    gridB:      0x0d0d0d,
    ambient:    0.25,
    hemiSky:    0x00ffff,   hemiGnd: 0x000000,  hemiInt: 0.50,
    key:        2.50,       keyCol:  0x00ffff,
    fill:       0x00ff00,   fillInt: 0.50,
    rim:        0x00ffff,   rimInt:  2.50,
    bounce:     0x001a1a,   bounceInt: 0.90,
    envInt:     0.60,       shadowOp: 0.22,
  },
  'scientific-blue': {
    sceneBg:    null,
    fogColor:   0x0c0a24,
    fogDensity: 0.013,
    gridA:      0x1a1445,
    gridB:      0x0b0922,
    ambient:    0.22,
    hemiSky:    0x331866,   hemiGnd: 0x040210,  hemiInt: 0.62,
    key:        1.80,       keyCol:  0xddeeff,
    fill:       0x8844ff,   fillInt: 0.55,
    rim:        0xa855f7,   rimInt:  3.00,
    bounce:     0x200a44,   bounceInt: 1.00,
    envInt:     0.90,       shadowOp: 0.16,
  },
  'minimal-gray': {
    sceneBg:    0xf3f4f6,
    fogColor:   0xf3f4f6,
    fogDensity: 0.014,
    gridA:      0xcacbce,
    gridB:      0xe5e7eb,
    ambient:    0.72,
    hemiSky:    0xd7dce6,   hemiGnd: 0xcad6e0,  hemiInt: 0.78,
    key:        1.25,       keyCol:  0xffffff,
    fill:       0x6b7280,   fillInt: 0.38,
    rim:        0x4b5563,   rimInt:  0.80,
    bounce:     0xd1d5db,   bounceInt: 0.55,
    envInt:     1.15,       shadowOp: 0.05,
  },
};

/* ──────────────────────────────────────────────────────────────
   CAMERA PRESETS
────────────────────────────────────────────────────────────── */
const CAM_PRESETS = {
  iso:   { pos: [9,   7,  10],   target: [0, 0.5, 0] },
  front: { pos: [0,   3,  15],   target: [0, 0.5, 0] },
  side:  { pos: [15,  3,   0],   target: [0, 0.5, 0] },
  top:   { pos: [0,  17,  0.01], target: [0, 0,   0] },
};

/* ──────────────────────────────────────────────────────────────
   STRUCTURE PRESETS
────────────────────────────────────────────────────────────── */
const PRESETS = {
  default: {
    rows:4, cols:4, barWidth:0.35, barHeight:0.10, spacing:1.00, overhang:0.50,
    switchShape:'box', switchSize:0.38, switchHeight:0.22, switchDiameter:0.34,
    layerCount:1, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  dense: {
    rows:8, cols:8, barWidth:0.20, barHeight:0.07, spacing:0.60, overhang:0.25,
    switchShape:'box', switchSize:0.20, switchHeight:0.15, switchDiameter:0.18,
    layerCount:1, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  neural: {
    rows:8, cols:4, barWidth:0.26, barHeight:0.09, spacing:0.80, overhang:0.35,
    switchShape:'cylinder', switchSize:0.28, switchHeight:0.20, switchDiameter:0.24,
    layerCount:1, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  large: {
    rows:16, cols:16, barWidth:0.12, barHeight:0.05, spacing:0.42, overhang:0.18,
    switchShape:'box', switchSize:0.12, switchHeight:0.10, switchDiameter:0.10,
    layerCount:1, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  bilayer: {
    rows:4, cols:4, barWidth:0.32, barHeight:0.09, spacing:1.00, overhang:0.50,
    switchShape:'box', switchSize:0.35, switchHeight:0.20, switchDiameter:0.30,
    layerCount:2, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  trilayer: {
    rows:4, cols:4, barWidth:0.30, barHeight:0.08, spacing:1.00, overhang:0.50,
    switchShape:'cylinder', switchSize:0.30, switchHeight:0.18, switchDiameter:0.26,
    layerCount:3, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  stacked: {
    rows:4, cols:4, barWidth:0.32, barHeight:0.09, spacing:1.00, overhang:0.50,
    switchShape:'box', switchSize:0.35, switchHeight:0.22, switchDiameter:0.30,
    layerCount:1, stackCount:3, stackSpacing:2.80, opacity:0.95,
  },
  cylindrical: {
    rows:4, cols:4, barWidth:0.28, barHeight:0.10, spacing:1.00, overhang:0.50,
    switchShape:'cylinder', switchSize:0.36, switchHeight:0.30, switchDiameter:0.32,
    layerCount:1, stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  wide: {
    rows:4, cols:4, barWidth:0.40, barHeight:0.12, spacing:1.60, overhang:0.70,
    switchShape:'box', switchSize:0.50, switchHeight:0.28, switchDiameter:0.42,
    layerCount:1, stackCount:1, stackSpacing:3.00, opacity:1.0,
  },
};

/* ──────────────────────────────────────────────────────────────
   MODULE STATE
────────────────────────────────────────────────────────────── */
let renderer, scene, camera, controls;
let ambientLight, hemiLight, keyLight, fillLight, rimLight, bounceLight;
let crossbarGroup, gridHelper, axesHelper, shadowPlane;
let matBottom, matTop, matSwitch, matSubstrate, matMarker;
let labelData   = [];
let labels      = [];
let buildTimer  = null;
let toastTimer  = null;
let activeGeoms = [];
let activeMats  = [];

// Mesh visibility tracking
let bottomBarMeshes = [];
let topBarMeshes = [];
let switchMeshes = [];

const labelsOverlay = document.getElementById('labels-overlay');
const tooltip       = document.getElementById('tooltip');
const raycaster     = new THREE.Raycaster();
const mouse         = new THREE.Vector2();
const _dummy        = new THREE.Object3D();

/* ══════════════════════════════════════════════════════════════
   GEOMETRY UTILITIES
══════════════════════════════════════════════════════════════ */

function roundedRect(width, height, r) {
  const cr = Math.min(r, width * 0.49, height * 0.49);
  const hw = width  / 2;
  const hh = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + cr, -hh);
  shape.lineTo( hw - cr, -hh);
  shape.quadraticCurveTo( hw, -hh,  hw, -hh + cr);
  shape.lineTo( hw,  hh - cr);
  shape.quadraticCurveTo( hw,  hh,  hw - cr,  hh);
  shape.lineTo(-hw + cr,  hh);
  shape.quadraticCurveTo(-hw,  hh, -hw,  hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return shape;
}

function makeBarGeomZ(barW, barH, length) {
  const cr   = Math.min(0.024, barH * 0.28, barW * 0.14);
  const geom = new THREE.ExtrudeGeometry(roundedRect(barW, barH, cr), {
    depth:          Math.max(0.02, length),
    bevelEnabled:   true,
    bevelThickness: 0.004,
    bevelSize:      0.004,
    bevelSegments:  2,
    curveSegments:  12,
  });
  geom.translate(0, 0, -length / 2);
  geom.computeVertexNormals();
  return geom;
}

function makeBarGeomX(barW, barH, length) {
  const geom = makeBarGeomZ(barW, barH, length);
  geom.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  return geom;
}

function makeSwitchBox(size, height) {
  const r = Math.min(0.016, size * 0.14, height * 0.20);
  if (typeof THREE.RoundedBoxGeometry !== 'undefined') {
    return new THREE.RoundedBoxGeometry(size, height, size, 2, r);
  }
  return new THREE.BoxGeometry(size, height, size);
}

function makeSwitchCyl(diameter, height) {
  return new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 32, 1, false);
}

/* ══════════════════════════════════════════════════════════════
   SCENE INITIALISATION
══════════════════════════════════════════════════════════════ */
function initScene() {
  const canvas = document.getElementById('canvas');

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:             true,
    preserveDrawingBuffer: true,
    alpha:                 true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled       = true;
  renderer.shadowMap.type          = THREE.PCFSoftShadowMap;
  renderer.outputEncoding          = THREE.sRGBEncoding;
  renderer.toneMapping             = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure     = 0.95;

  /* Scene */
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090f, 0.017);

  /* Camera */
  const W = window.innerWidth, H = window.innerHeight;
  camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
  camera.position.set(9, 7, 10);
  camera.lookAt(0, 0.5, 0);

  /* OrbitControls */
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.09;
  controls.autoRotateSpeed = 1.8;
  controls.update();

  /* Lighting */
  ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(0x223366, 0x050515, 0.55);
  scene.add(hemiLight);

  keyLight = new THREE.DirectionalLight(0xfff8f0, 2.40);
  keyLight.position.set(8, 12, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width  = 4096;
  keyLight.shadow.mapSize.height = 4096;
  keyLight.shadow.camera.left    = -30;
  keyLight.shadow.camera.right   = 30;
  keyLight.shadow.camera.top     = 30;
  keyLight.shadow.camera.bottom  = -30;
  keyLight.shadow.camera.near    = 0.5;
  keyLight.shadow.camera.far     = 100;
  keyLight.shadow.bias           = -0.0002;
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(0x3366ff, 0.55);
  fillLight.position.set(-15, 6, -8);
  scene.add(fillLight);

  rimLight = new THREE.DirectionalLight(0x7c3aed, 2.60);
  rimLight.position.set(-18, 10, 15);
  scene.add(rimLight);

  bounceLight = new THREE.DirectionalLight(0x1e3a8a, 1.20);
  bounceLight.position.set(6, 2, -12);
  scene.add(bounceLight);

  /* IBL */
  const pmrem  = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = envMap;

  /* Crossbar group */
  crossbarGroup = new THREE.Group();
  scene.add(crossbarGroup);

  /* Shadow plane — must rotate to lie flat as a floor (PlaneGeometry faces +Z by default) */
  const spGeom = new THREE.PlaneGeometry(60, 60);
  const spMat  = new THREE.ShadowMaterial({ opacity: 0.18, transparent: true });
  shadowPlane  = new THREE.Mesh(spGeom, spMat);
  shadowPlane.rotation.x   = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  shadowPlane.position.y = -0.14;
  crossbarGroup.add(shadowPlane);

  /* Grid, axes */
  gridHelper = new THREE.GridHelper(24, 12, 0x1a2a4a, 0x0c1525);
  gridHelper.position.y = -0.13;
  gridHelper.visible = P.showGrid;
  crossbarGroup.add(gridHelper);

  axesHelper = new THREE.AxesHelper(8);
  axesHelper.visible = P.showAxes;
  crossbarGroup.add(axesHelper);

  /* Labels overlay */
  labelsOverlay.style.display = P.showLabels ? '' : 'none';

  /* Layout on mobile */
  function handleMobileLayout() {
    const hint = document.getElementById('controls-hint');
    if (window.innerWidth <= 600 && hint) {
      hint.style.display = 'none';
    } else if (hint) {
      hint.style.display = '';
    }
  }
  handleMobileLayout();
  window.addEventListener('resize', handleMobileLayout);

  /* Build and render */
  buildScene();
  applyTheme(P.theme);   // initialise scene colours / lighting / CSS vars
  animate();
}

/* ══════════════════════════════════════════════════════════════
   BUILD SCENE
══════════════════════════════════════════════════════════════ */
function buildScene() {
  bottomBarMeshes = [];
  topBarMeshes = [];
  switchMeshes = [];

  const rows    = Math.max(1, Math.min(16, Math.round(P.rows)));
  const cols    = Math.max(1, Math.min(16, Math.round(P.cols)));
  const sp      = Math.max(0.25, P.spacing);
  const barW    = Math.max(0.04, Math.min(sp * 0.88, P.barWidth));
  const barH    = Math.max(0.03, Math.min(0.50, P.barHeight));
  const ovh     = Math.max(0,    P.overhang);
  const swH     = Math.max(0.03, P.switchHeight);
  const swSize  = Math.max(0.04, P.switchSize);
  const swDiam  = Math.max(0.04, P.switchDiameter);
  const stacks  = Math.max(1, Math.min(4, Math.round(P.stackCount)));
  const stackSp = Math.max(0.5, P.stackSpacing);
  const op      = Math.max(0.08, Math.min(1.0, P.opacity));
  const tr      = op < 0.998;

  /* Dispose old */
  activeGeoms.forEach(g => g.dispose());
  activeMats.forEach(m => m.dispose());
  activeGeoms = [];
  activeMats = [];
  const permanent = new Set([shadowPlane, gridHelper, axesHelper]);
  for (let i = crossbarGroup.children.length - 1; i >= 0; i--) {
    const ch = crossbarGroup.children[i];
    if (permanent.has(ch)) continue;
    crossbarGroup.remove(ch);
    if (ch.geometry) ch.geometry.dispose();
    if (ch.material) ch.material.dispose();
  }

  /* Materials */
  matBottom = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(P.colorBottom),
    metalness: 0.92, roughness: 0.12,
    clearcoat: 0.8, clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
    transparent: tr, opacity: op,
  });
  activeMats.push(matBottom);

  matTop = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(P.colorTop),
    metalness: 0.94, roughness: 0.08,
    clearcoat: 0.6, clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
    transparent: tr, opacity: op,
  });
  activeMats.push(matTop);

  matSwitch = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(P.colorSwitch),
    metalness: 0.05, roughness: 0.30,
    clearcoat: 0.9, clearcoatRoughness: 0.15,
    emissive: new THREE.Color(P.colorSwitch),
    emissiveIntensity: 0.18,
    envMapIntensity: 0.9,
    transparent: tr, opacity: op,
  });
  activeMats.push(matSwitch);

  /* Second switch layer material for bilayer/trilayer visual distinction */
  const matSwitch2 = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(P.colorSwitch2),
    metalness: 0.05, roughness: 0.30,
    clearcoat: 0.9, clearcoatRoughness: 0.15,
    emissive: new THREE.Color(P.colorSwitch2),
    emissiveIntensity: 0.18,
    envMapIntensity: 0.9,
    transparent: tr, opacity: op,
  });
  activeMats.push(matSwitch2);

  matSubstrate = new THREE.MeshStandardMaterial({
    color: new THREE.Color(P.colorSubstrate),
    metalness: 0.02, roughness: 0.85,
    transparent: true, opacity: op * 0.65,
  });
  activeMats.push(matSubstrate);

  matMarker = new THREE.MeshStandardMaterial({
    color: new THREE.Color(P.colorMarker),
    metalness: 0.15, roughness: 0.55,
    envMapIntensity: 0.3,
    transparent: tr, opacity: op,
  });
  activeMats.push(matMarker);

  /* Geometries */
  const offX      = (cols - 1) * sp / 2;
  const offZ      = (rows - 1) * sp / 2;
  const bottomLen = (rows - 1) * sp + ovh * 2;
  const topLen    = (cols - 1) * sp + ovh * 2;

  const botGeom  = makeBarGeomZ(barW, barH, Math.max(0.04, bottomLen));
  const topGeom  = makeBarGeomX(barW, barH, Math.max(0.04, topLen));
  const swGeom   = P.switchShape === 'cylinder'
    ? makeSwitchCyl(swDiam, swH)
    : makeSwitchBox(swSize, swH);
  const pad     = Math.max(0, P.substratePad);
  const subW    = (cols - 1) * sp + ovh * 2 + barW + pad;
  const subD    = (rows - 1) * sp + ovh * 2 + barW + pad;
  const subGeom = new THREE.BoxGeometry(subW, 0.11, subD);
  const mkSize  = Math.max(0.02, Math.min(0.30, P.markerSize));
  const mkGeom  = new THREE.SphereGeometry(mkSize, 16, 16);

  activeGeoms.push(botGeom, topGeom, swGeom, subGeom, mkGeom);

  labelData = [];

  /* Build stacks — each stack contains layerCount switching layers
     with (layerCount + 1) electrode bars interleaved:
     Mono  (1): Bar-Z → Sw → Bar-X
     Bi    (2): Bar-Z → Sw → Bar-X → Sw → Bar-Z
     Tri   (3): Bar-Z → Sw → Bar-X → Sw → Bar-Z → Sw → Bar-X
     Bars alternate Z (even index) and X (odd index) direction. */
  const layers   = Math.max(1, Math.min(4, Math.round(P.layerCount)));
  const numBars  = layers + 1;                     // electrodes per stack
  const unitH    = numBars * barH + layers * swH;  // recalculate for multi-layer

  for (let s = 0; s < stacks; s++) {
    const base = s * stackSp;

    /* Substrate */
    if (P.showSubstrate) {
      const sub       = new THREE.Mesh(subGeom, matSubstrate);
      sub.position.y  = base - 0.055;
      sub.castShadow  = true;
      sub.receiveShadow = true;
      sub.userData    = { type: 'substrate', stack: s };
      crossbarGroup.add(sub);
    }

    /* Interleaved bars and switch layers */
    for (let b = 0; b < numBars; b++) {
      const isZ  = b % 2 === 0;                     // even = Z (Word), odd = X (Bit)
      const barY = base + b * (barH + swH) + barH / 2;

      if (isZ) {
        /* Z-direction bar (Word Line electrode) */
        const inst = new THREE.InstancedMesh(botGeom, matBottom, cols);
        inst.castShadow = true;
        inst.receiveShadow = true;
        inst.userData = { type: 'bottom-bar', stack: s, layer: b };
        for (let c = 0; c < cols; c++) {
          _dummy.position.set(-offX + c * sp, barY, 0);
          _dummy.updateMatrix();
          inst.setMatrixAt(c, _dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.visible = P.showBottomBars;
        crossbarGroup.add(inst);
        bottomBarMeshes.push(inst);
      } else {
        /* X-direction bar (Bit Line electrode) */
        const inst = new THREE.InstancedMesh(topGeom, matTop, rows);
        inst.castShadow = true;
        inst.receiveShadow = true;
        inst.userData = { type: 'top-bar', stack: s, layer: b };
        for (let r = 0; r < rows; r++) {
          _dummy.position.set(0, barY, r * sp - offZ);
          _dummy.updateMatrix();
          inst.setMatrixAt(r, _dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.visible = P.showTopBars;
        crossbarGroup.add(inst);
        topBarMeshes.push(inst);
      }

      /* Switch layer sits between this bar and the next (skip after last bar) */
      if (b < layers) {
        const swY    = base + b * (barH + swH) + barH + swH / 2;
        const swMat  = b % 2 === 0 ? matSwitch : matSwitch2;  // alternate colors
        const swInst = new THREE.InstancedMesh(swGeom, swMat, rows * cols);
        swInst.castShadow = true;
        swInst.receiveShadow = true;
        swInst.userData = { type: 'switch-layer', stack: s, layer: b, rows, cols };
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            _dummy.position.set(c * sp - offX, swY, r * sp - offZ);
            _dummy.updateMatrix();
            swInst.setMatrixAt(idx, _dummy.matrix);
          }
        }
        swInst.instanceMatrix.needsUpdate = true;
        swInst.visible = P.showSwitchLayer;
        crossbarGroup.add(swInst);
        switchMeshes.push(swInst);
      }
    }

    /* Intersection markers on top */
    if (P.showMarkers) {
      const mY    = base + unitH + 0.09;
      const mInst = new THREE.InstancedMesh(mkGeom, matMarker, rows * cols);
      mInst.castShadow = true;
      mInst.userData = { type: 'marker', stack: s, rows, cols };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          _dummy.position.set(c * sp - offX, mY, r * sp - offZ);
          _dummy.updateMatrix();
          mInst.setMatrixAt(idx, _dummy.matrix);
        }
      }
      mInst.instanceMatrix.needsUpdate = true;
      crossbarGroup.add(mInst);
    }

    /* Labels — bottom-most Z bar + top-most X bar + layer tag */
    if (P.showLabels) {
      const firstBarY = base + barH / 2;
      const wZ = bottomLen / 2 + 0.24;
      for (let c = 0; c < cols; c++) {
        labelData.push({
          text: `W${c}`,
          pos:  new THREE.Vector3(c * sp - offX, firstBarY, -wZ),
          type: 'word',
        });
      }
      /* Find topmost X-bar Y position */
      const lastXIdx = numBars - 1 - (numBars % 2 === 0 ? 0 : 1);
      const lastXY   = lastXIdx >= 1
        ? base + lastXIdx * (barH + swH) + barH / 2
        : base + barH + swH + barH / 2;
      const bX = topLen / 2 + 0.24;
      for (let r = 0; r < rows; r++) {
        labelData.push({
          text: `B${r}`,
          pos:  new THREE.Vector3(bX, lastXY, r * sp - offZ),
          type: 'bit',
        });
      }
      if (stacks > 1) {
        labelData.push({
          text: `Stack ${s + 1}`,
          pos:  new THREE.Vector3(-offX - ovh - 0.95, base + unitH / 2, -offZ - ovh - 0.95),
          type: 'layer',
        });
      }
    }
  }

  refreshGrid();

  const layerLabel = layers === 1 ? 'Monolayer' : layers === 2 ? 'Bilayer' : layers === 3 ? 'Trilayer' : `${layers}-Layer`;
  document.getElementById('info-txt').textContent =
    `${rows}×${cols} ${layerLabel} · ${rows * cols * layers * stacks} crosspoints` +
    (stacks > 1 ? ` · ${stacks} stacks` : '');

  buildLabelDOM();
}

/* ──────────────────────────────────────────────────────────────
   MATERIAL UPDATES (colour without rebuild)
────────────────────────────────────────────────────────────── */
function updateMaterials() {
  if (matBottom)    { matBottom.color.set(P.colorBottom);       matBottom.needsUpdate = true; }
  if (matTop)       { matTop.color.set(P.colorTop);             matTop.needsUpdate = true; }
  if (matSwitch)    { matSwitch.color.set(P.colorSwitch);       matSwitch.emissive.set(P.colorSwitch); matSwitch.needsUpdate = true; }
  if (matSubstrate) { matSubstrate.color.set(P.colorSubstrate); matSubstrate.needsUpdate = true; }
  if (matMarker)    { matMarker.color.set(P.colorMarker);       matMarker.needsUpdate = true; }
  /* Update switch2 materials on all odd-indexed switch meshes */
  switchMeshes.forEach((m, i) => {
    if (i % 2 !== 0 && m.material) {
      m.material.color.set(P.colorSwitch2);
      m.material.emissive.set(P.colorSwitch2);
      m.material.needsUpdate = true;
    }
  });
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function updateOpacity() {
  const op = Math.max(0.08, Math.min(1.0, P.opacity));
  const tr = op < 0.998;
  [matBottom, matTop, matSwitch].forEach(m => {
    if (!m) return;
    m.opacity = op; m.transparent = tr; m.needsUpdate = true;
  });
  if (matSubstrate) {
    matSubstrate.opacity     = op * 0.65;
    matSubstrate.transparent = true;
    matSubstrate.needsUpdate = true;
  }
}

/* ──────────────────────────────────────────────────────────────
   GRID
────────────────────────────────────────────────────────────── */
function makeGrid() {
  const th   = THEMES[P.theme] || THEMES['dark-lab'];
  const span = Math.max(P.rows, P.cols) * P.spacing;
  const size = Math.max(22, span * 2 + 14);
  const divs = Math.max(10, Math.round(size * 1.0));
  const g    = new THREE.GridHelper(size, divs, th.gridA, th.gridB);
  g.material.transparent = true;
  g.material.opacity = P.gridOpacity;
  g.position.y = -0.13;
  return g;
}

function refreshGrid() {
  if (!crossbarGroup) return;
  if (gridHelper) crossbarGroup.remove(gridHelper);
  gridHelper = makeGrid();
  gridHelper.visible = P.showGrid;
  crossbarGroup.add(gridHelper);
}

/* ──────────────────────────────────────────────────────────────
   LABEL DOM
────────────────────────────────────────────────────────────── */
function buildLabelDOM() {
  labelsOverlay.innerHTML = '';
  labels = [];
  if (!P.showLabels) return;

  labelData.forEach(ld => {
    const el       = document.createElement('div');
    el.className   = `lbl lbl-${ld.type}`;
    el.textContent = ld.text;
    labelsOverlay.appendChild(el);
    labels.push({ el, pos: ld.pos });
  });
}

function updateLabels() {
  if (!P.showLabels || !camera) return;
  const W = window.innerWidth;
  const H = window.innerHeight;

  labels.forEach(({ el, pos }) => {
    const v = pos.clone().project(camera);
    if (v.z > 1 || v.z < -1) { el.style.display = 'none'; return; }
    const sx = (v.x + 1) / 2 * W;
    const sy = (-v.y + 1) / 2 * H;
    if (sx < -60 || sx > W + 60 || sy < -20 || sy > H + 20) {
      el.style.display = 'none'; return;
    }
    el.style.display = 'block';
    el.style.left    = sx + 'px';
    el.style.top     = sy + 'px';
  });
}

/* ──────────────────────────────────────────────────────────────
   TOOLTIP
────────────────────────────────────────────────────────────── */
function onPointerMove(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(crossbarGroup.children, false);

  if (!hits.length) { tooltip.style.display = 'none'; return; }

  const { object, instanceId: iid } = hits[0];
  const ud = object.userData;
  let html = '';

  switch (ud.type) {
    case 'bottom-bar': {
      const c = iid ?? 0;
      html = `<div class="tt-name">Word Line W${c}</div>
              <div class="tt-desc">Bottom electrode · runs along Z-axis<br>Stack ${(ud.stack || 0) + 1}</div>
              <div class="tt-badge">Bottom Electrode</div>`;
      break;
    }
    case 'top-bar': {
      const r = iid ?? 0;
      html = `<div class="tt-name">Bit Line B${r}</div>
              <div class="tt-desc">Top electrode · runs along X-axis<br>Stack ${(ud.stack || 0) + 1}</div>
              <div class="tt-badge">Top Electrode</div>`;
      break;
    }
    case 'switch-layer': {
      const r     = iid != null ? Math.floor(iid / (ud.cols || 1)) : '?';
      const c     = iid != null ? iid % (ud.cols || 1) : '?';
      const shape = P.switchShape === 'cylinder' ? 'Cylindrical' : 'Box';
      html = `<div class="tt-name">Switching Layer</div>
              <div class="tt-desc">Cell (W${c}, B${r}) · ${shape} pillar<br>
              Active resistive switching material<br>Stack ${(ud.stack || 0) + 1}</div>
              <div class="tt-badge">Active Layer</div>`;
      break;
    }
    case 'substrate':
      html = `<div class="tt-name">Substrate</div>
              <div class="tt-desc">Base layer · Stack ${(ud.stack || 0) + 1}</div>`;
      break;
    case 'marker': {
      const r = iid != null ? Math.floor(iid / (ud.cols || 1)) : '?';
      const c = iid != null ? iid % (ud.cols || 1) : '?';
      html = `<div class="tt-name">Crosspoint (W${c}, B${r})</div>
              <div class="tt-desc">Intersection marker · Stack ${(ud.stack || 0) + 1}</div>`;
      break;
    }
  }

  if (!html) { tooltip.style.display = 'none'; return; }

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';

  let tx = e.clientX + 14;
  let ty = e.clientY - 10;
  const { width: tw, height: th } = tooltip.getBoundingClientRect();
  if (tx + tw > window.innerWidth  - 10) tx = e.clientX - tw - 14;
  if (ty + th > window.innerHeight - 10) ty = e.clientY - th + 10;
  tooltip.style.left = tx + 'px';
  tooltip.style.top  = ty + 'px';
}

/* ──────────────────────────────────────────────────────────────
   THEME APPLICATION
────────────────────────────────────────────────────────────── */
function applyTheme(name) {
  P.theme = name;
  const th = THEMES[name] || THEMES['dark-lab'];

  document.documentElement.setAttribute('data-theme', name);

  scene.background = th.sceneBg != null ? new THREE.Color(th.sceneBg) : null;
  if (scene.fog) {
    scene.fog.color.setHex(th.fogColor);
    scene.fog.density = th.fogDensity;
  }

  ambientLight.intensity         = th.ambient;
  hemiLight.color.setHex(th.hemiSky);
  hemiLight.groundColor.setHex(th.hemiGnd);
  hemiLight.intensity            = th.hemiInt;
  keyLight.intensity             = th.key;
  keyLight.color.setHex(th.keyCol);
  fillLight.color.setHex(th.fill);   fillLight.intensity   = th.fillInt;
  rimLight.color.setHex(th.rim);     rimLight.intensity    = th.rimInt;
  bounceLight.color.setHex(th.bounce); bounceLight.intensity = th.bounceInt;

  [matBottom, matTop, matSwitch].forEach(m => {
    if (m) { m.envMapIntensity = th.envInt ?? 1.0; m.needsUpdate = true; }
  });

  /* Adjust shadow plane opacity per theme */
  if (shadowPlane && shadowPlane.material) {
    shadowPlane.material.opacity = th.shadowOp ?? 0.18;
    shadowPlane.material.needsUpdate = true;
  }

  refreshGrid();

  document.querySelectorAll('#menu-theme button').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === name);
  });
}

/* ──────────────────────────────────────────────────────────────
   ANIMATED CAMERA LERP
────────────────────────────────────────────────────────────── */
function gotoPreset(name) {
  const preset = CAM_PRESETS[name];
  if (!preset) return;

  const startPos    = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos      = new THREE.Vector3(...preset.pos);
  const endTarget   = new THREE.Vector3(...preset.target);
  const t0 = Date.now(), dur = 640;

  (function tick() {
    const t    = Math.min((Date.now() - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(tick);
  })();
}

/* ──────────────────────────────────────────────────────────────
   EXPORT
────────────────────────────────────────────────────────────── */
function exportImage(format, scale, transparent, pptMode) {
  const W = window.innerWidth, H = window.innerHeight;
  const origBg  = scene.background;
  const origFog = scene.fog;

  if (transparent) {
    scene.background = null;
    scene.fog = null;
  }

  if (pptMode) {
    scene.background = new THREE.Color(0xffffff);
    scene.fog = null;
  }

  if (scale > 1) {
    renderer.setSize(W * scale, H * scale, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);

  let url;
  if (format === 'jpg') {
    if (!transparent && !pptMode) {
      scene.background = new THREE.Color(origBg || 0x07090f);
    }
    renderer.render(scene, camera);
    url = renderer.domElement.toDataURL('image/jpeg', 0.93);
  } else {
    url = renderer.domElement.toDataURL('image/png');
  }

  if (scale > 1) {
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  scene.background = origBg;
  scene.fog        = origFog;
  renderer.render(scene, camera);

  const a       = document.createElement('a');
  a.href        = url;
  const res = scale === 1 ? '1x' : scale === 2 ? '2x' : scale === 3 ? '3x' : '4x';
  const suffix = transparent ? '-transparent' : pptMode ? '-ppt' : '';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  a.download    = `crossbar-${P.rows}x${P.cols}-${res}${suffix}.${ext}`;
  a.click();

  const resText = scale === 1 ? `${Math.round(W)}×${Math.round(H)}` :
                  scale === 2 ? `${Math.round(W*2)}×${Math.round(H*2)}` :
                  scale === 3 ? `${Math.round(W*3)}×${Math.round(H*3)}` :
                  `${Math.round(W*4)}×${Math.round(H*4)}`;
  showToast(`Saved ${resText} ${format.toUpperCase()}`);
}

/* ──────────────────────────────────────────────────────────────
   RESET ALL
────────────────────────────────────────────────────────────── */
function resetAll() {
  P = { ...DEFAULTS };
  applyTheme(P.theme);
  syncUI();
  buildScene();
  gotoPreset('iso');
  showToast('Reset to defaults');
}

/* ──────────────────────────────────────────────────────────────
   SYNC UI
────────────────────────────────────────────────────────────── */
function syncUI() {
  const sl = (id, vid, v, d) => {
    const el = document.getElementById(id);
    const ve = document.getElementById(vid);
    if (el) el.value        = v;
    if (ve) ve.textContent  = Number(v).toFixed(d);
  };
  sl('ctrl-rows',     'val-rows',     P.rows,           0);
  sl('ctrl-cols',     'val-cols',     P.cols,           0);
  sl('ctrl-barw',     'val-barw',     P.barWidth,       2);
  sl('ctrl-barh',     'val-barh',     P.barHeight,      2);
  sl('ctrl-spacing',  'val-spacing',  P.spacing,        2);
  sl('ctrl-overhang', 'val-overhang', P.overhang,       2);
  sl('ctrl-swsize',   'val-swsize',   P.switchSize,     2);
  sl('ctrl-swdiam',   'val-swdiam',   P.switchDiameter, 2);
  sl('ctrl-swh',      'val-swh',      P.switchHeight,   2);
  sl('ctrl-layers',   'val-layers',   P.layerCount,     0);
  sl('ctrl-stacks',   'val-stacks',   P.stackCount,     0);
  sl('ctrl-stacksep', 'val-stacksep', P.stackSpacing,   1);
  sl('ctrl-subpad',   'val-subpad',   P.substratePad,   2);
  sl('ctrl-mksize',   'val-mksize',   P.markerSize,     2);
  sl('ctrl-opacity',  'val-opacity',  P.opacity,        2);
  sl('ctrl-gridop',   'val-gridop',   P.gridOpacity,    2);

  document.querySelectorAll('input[name="sw-shape"]').forEach(r => {
    r.checked = r.value === P.switchShape;
  });

  const ck = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
  ck('vis-substrate',   P.showSubstrate);
  ck('vis-labels',      P.showLabels);
  ck('vis-grid',        P.showGrid);
  ck('vis-axes',        P.showAxes);
  ck('vis-markers',     P.showMarkers);
  ck('vis-shadow',      P.showShadow);
  ck('vis-topbars',     P.showTopBars);
  ck('vis-bottombars',  P.showBottomBars);
  ck('vis-switchlayer', P.showSwitchLayer);

  const cl = (id, sid, v) => {
    const e = document.getElementById(id);  if (e)  e.value            = v;
    const s = document.getElementById(sid); if (s)  s.style.background = v;
  };
  cl('color-bottom',    'sw-bottom',    P.colorBottom);
  cl('color-top',       'sw-top',       P.colorTop);
  cl('color-switch',    'sw-switch',    P.colorSwitch);
  cl('color-switch2',   'sw-switch2',   P.colorSwitch2);
  cl('color-marker',    'sw-marker',    P.colorMarker);
  cl('color-substrate', 'sw-substrate', P.colorSubstrate);

  toggleSwitchShape();

  const arBtn = document.getElementById('autorotate-btn');
  if (arBtn) {
    arBtn.classList.toggle('active', P.autoRotate);
    const txt = arBtn.lastChild;
    if (txt && txt.nodeType === Node.TEXT_NODE) {
      txt.textContent = P.autoRotate ? ' Rotating' : ' Auto-Rotate';
    }
  }
  if (controls) controls.autoRotate = P.autoRotate;
}

function toggleSwitchShape() {
  const isBox = P.switchShape === 'box';
  const rs    = document.getElementById('row-swsize');
  const rd    = document.getElementById('row-swdiam');
  if (rs) rs.style.display = isBox ? '' : 'none';
  if (rd) rd.style.display = isBox ? 'none' : '';
}

/* ──────────────────────────────────────────────────────────────
   DEBOUNCED BUILD
────────────────────────────────────────────────────────────── */
function scheduleBuild(delay) {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(buildScene, delay ?? 55);
}

/* ──────────────────────────────────────────────────────────────
   EVENT BINDING
────────────────────────────────────────────────────────────── */
function bindEvents() {

  const onSlider = (id, vid, key, dec, rebuild = true) => {
    const el = document.getElementById(id);
    const ve = document.getElementById(vid);
    if (!el) return;
    el.addEventListener('input', () => {
      P[key] = parseFloat(el.value);
      if (ve) ve.textContent = P[key].toFixed(dec);
      if (rebuild) scheduleBuild();
    });
  };

  onSlider('ctrl-rows',     'val-rows',     'rows',           0);
  onSlider('ctrl-cols',     'val-cols',     'cols',           0);
  onSlider('ctrl-barw',     'val-barw',     'barWidth',       2);
  onSlider('ctrl-barh',     'val-barh',     'barHeight',      2);
  onSlider('ctrl-spacing',  'val-spacing',  'spacing',        2);
  onSlider('ctrl-overhang', 'val-overhang', 'overhang',       2);
  onSlider('ctrl-swsize',   'val-swsize',   'switchSize',     2);
  onSlider('ctrl-swdiam',   'val-swdiam',   'switchDiameter', 2);
  onSlider('ctrl-swh',      'val-swh',      'switchHeight',   2);
  onSlider('ctrl-layers',   'val-layers',   'layerCount',     0);
  onSlider('ctrl-stacks',   'val-stacks',   'stackCount',     0);
  onSlider('ctrl-stacksep', 'val-stacksep', 'stackSpacing',   1);
  onSlider('ctrl-subpad',   'val-subpad',   'substratePad',   2);
  onSlider('ctrl-mksize',   'val-mksize',   'markerSize',     2);

  (() => {
    const el = document.getElementById('ctrl-opacity');
    const ve = document.getElementById('val-opacity');
    if (!el) return;
    el.addEventListener('input', () => {
      P.opacity = parseFloat(el.value);
      if (ve) ve.textContent = P.opacity.toFixed(2);
      updateOpacity();
    });
  })();

  (() => {
    const el = document.getElementById('ctrl-gridop');
    const ve = document.getElementById('val-gridop');
    if (!el) return;
    el.addEventListener('input', () => {
      P.gridOpacity = parseFloat(el.value);
      if (ve) ve.textContent = P.gridOpacity.toFixed(2);
      refreshGrid();
    });
  })();

  document.querySelectorAll('input[name="sw-shape"]').forEach(r => {
    r.addEventListener('change', () => {
      P.switchShape = r.value;
      toggleSwitchShape();
      scheduleBuild();
    });
  });

  document.querySelectorAll('.qbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      P.rows = parseInt(btn.dataset.r);
      P.cols = parseInt(btn.dataset.c);
      const rEl = document.getElementById('ctrl-rows');
      const cEl = document.getElementById('ctrl-cols');
      if (rEl) { rEl.value = P.rows; document.getElementById('val-rows').textContent = P.rows; }
      if (cEl) { cEl.value = P.cols; document.getElementById('val-cols').textContent = P.cols; }
      buildScene();
    });
  });

  const onColor = (id, sid, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      P[key] = el.value;
      const sw = document.getElementById(sid);
      if (sw) sw.style.background = el.value;
      updateMaterials();
    });
  };
  onColor('color-bottom',    'sw-bottom',    'colorBottom');
  onColor('color-top',       'sw-top',       'colorTop');
  onColor('color-switch',    'sw-switch',    'colorSwitch');
  onColor('color-switch2',   'sw-switch2',   'colorSwitch2');
  onColor('color-marker',    'sw-marker',    'colorMarker');
  onColor('color-substrate', 'sw-substrate', 'colorSubstrate');

  const onCheck = (id, key, fn) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => { P[key] = el.checked; fn?.(el.checked); });
  };
  onCheck('vis-substrate', 'showSubstrate', () => scheduleBuild());
  onCheck('vis-markers',   'showMarkers',   () => scheduleBuild());
  onCheck('vis-labels', 'showLabels', v => {
    labelsOverlay.style.display = v ? '' : 'none';
    if (v) buildLabelDOM();
  });
  onCheck('vis-grid',   'showGrid',   v => { if (gridHelper) gridHelper.visible = v; });
  onCheck('vis-axes',   'showAxes',   v => { if (axesHelper) axesHelper.visible = v; });
  onCheck('vis-shadow', 'showShadow', v => {
    renderer.shadowMap.enabled = v;
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  });
  onCheck('vis-topbars', 'showTopBars', v => {
    topBarMeshes.forEach(m => { m.visible = v; });
  });
  onCheck('vis-bottombars', 'showBottomBars', v => {
    bottomBarMeshes.forEach(m => { m.visible = v; });
  });
  onCheck('vis-switchlayer', 'showSwitchLayer', v => {
    switchMeshes.forEach(m => { m.visible = v; });
  });

  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => gotoPreset(btn.dataset.view));
  });

  const arBtn = document.getElementById('autorotate-btn');
  if (arBtn) {
    arBtn.addEventListener('click', () => {
      P.autoRotate = !P.autoRotate;
      controls.autoRotate = P.autoRotate;
      arBtn.classList.toggle('active', P.autoRotate);
      const txt = arBtn.lastChild;
      if (txt && txt.nodeType === Node.TEXT_NODE)
        txt.textContent = P.autoRotate ? ' Rotating' : ' Auto-Rotate';
    });
  }

  const themeBtn  = document.getElementById('btn-theme');
  const themeMenu = document.getElementById('menu-theme');
  const expBtn    = document.getElementById('btn-export');
  const expMenu   = document.getElementById('menu-export');

  themeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    themeMenu?.classList.toggle('open');
    expMenu?.classList.remove('open');
  });
  themeMenu?.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => { applyTheme(b.dataset.theme); themeMenu.classList.remove('open'); });
  });

  expBtn?.addEventListener('click', e => {
    e.stopPropagation();
    expMenu?.classList.toggle('open');
    themeMenu?.classList.remove('open');
  });

  const bindExport = (id, format, scale, transp, ppt) => {
    document.getElementById(id)?.addEventListener('click', () => {
      expMenu?.classList.remove('open');
      exportImage(format, scale, transp, ppt);
    });
  };
  bindExport('exp-png-std',  'png', 1, false, false);
  bindExport('exp-png-hd',   'png', 2, false, false);
  bindExport('exp-png-fhd',  'png', 3, false, false);
  bindExport('exp-png-4k',   'png', 4, false, false);
  bindExport('exp-png-transp', 'png', 1, true, false);
  bindExport('exp-jpg-std',  'jpg', 1, false, false);
  bindExport('exp-jpg-hd',   'jpg', 2, false, false);
  bindExport('exp-ppt',      'png', 3, false, true);

  document.addEventListener('click', () => {
    themeMenu?.classList.remove('open');
    expMenu?.classList.remove('open');
  });

  document.getElementById('btn-reset-all')?.addEventListener('click', resetAll);
  document.getElementById('btn-reset-view')?.addEventListener('click', () => gotoPreset('iso'));

  const sidebar       = document.getElementById('sidebar');
  const sideToggle    = document.getElementById('btn-sidebar-toggle');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const isMobile      = () => window.innerWidth <= 768;

  function openSidebar() {
    sidebar?.classList.remove('hidden');
    sidebar?.classList.add('open-mobile');
    sideToggle?.classList.add('active');
    if (isMobile()) mobileOverlay?.classList.add('active');
  }
  function closeSidebar() {
    sidebar?.classList.add('hidden');
    sidebar?.classList.remove('open-mobile');
    sideToggle?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
  }
  function isSidebarOpen() {
    return !sidebar?.classList.contains('hidden');
  }

  sideToggle?.addEventListener('click', () => {
    if (isSidebarOpen()) closeSidebar(); else openSidebar();
  });

  mobileOverlay?.addEventListener('click', closeSidebar);

  document.querySelectorAll('.sec-hdr').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.ctrl-sec')?.classList.toggle('open'));
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;
      Object.assign(P, preset);
      syncUI();
      buildScene();
      showToast('Preset: ' + btn.textContent.trim());
    });
  });

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });

  function onResize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));

    if (!isMobile() && mobileOverlay?.classList.contains('active')) {
      mobileOverlay.classList.remove('active');
      sidebar?.classList.remove('open-mobile');
    }
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 180));
}

/* ──────────────────────────────────────────────────────────────
   TOAST
────────────────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ──────────────────────────────────────────────────────────────
   ANIMATION LOOP
────────────────────────────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

/* ──────────────────────────────────────────────────────────────
   BOOT
────────────────────────────────────────────────────────────── */
initScene();
bindEvents();
syncUI();
