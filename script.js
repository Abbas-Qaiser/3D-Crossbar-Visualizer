// ═══════════════════════════════════════════════════════════════
//  Crossbar Array 3D Visualizer — script.js v3.0
//  Three.js r163 · ES Modules
//  MeshPhysicalMaterial · RoomEnvironment IBL · Rounded-bar geometry
//  InstancedMesh throughout for performance
// ═══════════════════════════════════════════════════════════════

import * as THREE              from 'three';
import { OrbitControls }       from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment }     from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry }  from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  switchShape:     'box',      // 'box' | 'cylinder'
  switchSize:      0.38,
  switchDiameter:  0.34,
  switchHeight:    0.22,
  stackCount:      1,
  stackSpacing:    2.50,
  colorBottom:     '#C0C8D8',
  colorTop:        '#FFCC44',
  colorSwitch:     '#7C3AED',
  colorSubstrate:  '#4A6070',
  opacity:         1.00,
  showSubstrate:   true,
  showLabels:      true,
  showGrid:        true,
  showAxes:        false,
  showMarkers:     false,
  showShadow:      true,
  autoRotate:      false,
  theme:           'dark-neon',
};

let P = { ...DEFAULTS };

/* ──────────────────────────────────────────────────────────────
   THEME DEFINITIONS  (scene lighting + Three.js background)
────────────────────────────────────────────────────────────── */
const THEMES = {
  'dark-neon': {
    sceneBg:    0x07090f,
    fogColor:   0x07090f,
    fogDensity: 0.017,
    gridA:      0x1a2a4a,
    gridB:      0x0c1525,
    ambient:    0.22,
    hemiSky:    0x223366,   hemiGnd: 0x050515,  hemiInt: 0.55,
    key:        2.00,       keyCol:  0xfff8f0,
    fill:       0x3366ff,   fillInt: 0.55,
    rim:        0x7c3aed,   rimInt:  2.60,
    bounce:     0x1e3a8a,   bounceInt: 1.20,
    envInt:     0.75,
  },
  'pure-black': {
    sceneBg:    0x000000,
    fogColor:   0x000000,
    fogDensity: 0.013,
    gridA:      0x181818,
    gridB:      0x080808,
    ambient:    0.20,
    hemiSky:    0x113322,   hemiGnd: 0x000000,  hemiInt: 0.45,
    key:        2.20,       keyCol:  0xffffff,
    fill:       0x22cc88,   fillInt: 0.45,
    rim:        0x00aa55,   rimInt:  2.10,
    bounce:     0x001a0d,   bounceInt: 0.85,
    envInt:     0.55,
  },
  'gradient': {
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
    envInt:     0.90,
  },
  'light-gray': {
    sceneBg:    0xe8ecf0,
    fogColor:   0xe8ecf0,
    fogDensity: 0.015,
    gridA:      0xaaaaaa,
    gridB:      0xcccccc,
    ambient:    0.65,
    hemiSky:    0xaabbcc,   hemiGnd: 0x888899,  hemiInt: 0.75,
    key:        1.20,       keyCol:  0xffffff,
    fill:       0x88aadd,   fillInt: 0.35,
    rim:        0x4466aa,   rimInt:  0.85,
    bounce:     0xbbbbee,   bounceInt: 0.55,
    envInt:     1.20,
  },
  'white': {
    sceneBg:    0xfafafa,
    fogColor:   0xfafafa,
    fogDensity: 0.012,
    gridA:      0xbbbbbb,
    gridB:      0xdddddd,
    ambient:    0.75,
    hemiSky:    0xddeeff,   hemiGnd: 0xaabbcc,  hemiInt: 0.85,
    key:        1.00,       keyCol:  0xffffff,
    fill:       0x99aabb,   fillInt: 0.30,
    rim:        0x4488cc,   rimInt:  0.65,
    bounce:     0xddeeff,   bounceInt: 0.45,
    envInt:     1.50,
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
    stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  dense: {
    rows:8, cols:8, barWidth:0.20, barHeight:0.07, spacing:0.60, overhang:0.25,
    switchShape:'box', switchSize:0.20, switchHeight:0.15, switchDiameter:0.18,
    stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  neural: {
    rows:8, cols:4, barWidth:0.26, barHeight:0.09, spacing:0.80, overhang:0.35,
    switchShape:'cylinder', switchSize:0.28, switchHeight:0.20, switchDiameter:0.24,
    stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  large: {
    rows:16, cols:16, barWidth:0.12, barHeight:0.05, spacing:0.42, overhang:0.18,
    switchShape:'box', switchSize:0.12, switchHeight:0.10, switchDiameter:0.10,
    stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  stacked: {
    rows:4, cols:4, barWidth:0.32, barHeight:0.09, spacing:1.00, overhang:0.50,
    switchShape:'box', switchSize:0.35, switchHeight:0.22, switchDiameter:0.30,
    stackCount:3, stackSpacing:2.80, opacity:0.95,
  },
  cylindrical: {
    rows:4, cols:4, barWidth:0.28, barHeight:0.10, spacing:1.00, overhang:0.50,
    switchShape:'cylinder', switchSize:0.36, switchHeight:0.30, switchDiameter:0.32,
    stackCount:1, stackSpacing:2.50, opacity:1.0,
  },
  wide: {
    rows:4, cols:4, barWidth:0.40, barHeight:0.12, spacing:1.60, overhang:0.70,
    switchShape:'box', switchSize:0.50, switchHeight:0.28, switchDiameter:0.42,
    stackCount:1, stackSpacing:3.00, opacity:1.0,
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
// Track disposable geometry / material created per build cycle
let activeGeoms = [];
let activeMats  = [];

const labelsOverlay = document.getElementById('labels-overlay');
const tooltip       = document.getElementById('tooltip');
const raycaster     = new THREE.Raycaster();
const mouse         = new THREE.Vector2();
const _dummy        = new THREE.Object3D();   // reusable for InstancedMesh

/* ══════════════════════════════════════════════════════════════
   GEOMETRY UTILITIES
══════════════════════════════════════════════════════════════ */

/**
 * 2-D rounded-rectangle Shape centred at the origin.
 * width × height in the XY plane, corner radius = r.
 */
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

/**
 * Bar running along the Z-axis.
 * Cross-section: barW × barH (XY), centred at world origin.
 * Corner radius scales with barH for a realistic electrode profile.
 */
function makeBarGeomZ(barW, barH, length) {
  const cr   = Math.min(0.024, barH * 0.28, barW * 0.14);
  const geom = new THREE.ExtrudeGeometry(roundedRect(barW, barH, cr), {
    depth:         Math.max(0.02, length),
    bevelEnabled:  false,
    curveSegments: 6,
  });
  // ExtrudeGeometry extrudes from Z=0 to Z=depth; centre it:
  geom.translate(0, 0, -length / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Bar running along the X-axis.
 * Built from a Z-bar then rotated 90° around Y so length → X.
 */
function makeBarGeomX(barW, barH, length) {
  const geom = makeBarGeomZ(barW, barH, length);
  geom.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  // Normals are correctly transformed by applyMatrix4; no recompute needed.
  return geom;
}

/**
 * Rounded-box switching-layer pillar, centred at origin, height along Y.
 */
function makeSwitchBox(size, height) {
  const r = Math.min(0.016, size * 0.14, height * 0.20);
  return new RoundedBoxGeometry(size, height, size, 2, r);
}

/**
 * Cylindrical switching-layer pillar, centred at origin, height along Y.
 */
function makeSwitchCyl(diameter, height) {
  return new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 32, 1, false);
}

/* ══════════════════════════════════════════════════════════════
   SCENE INITIALISATION
══════════════════════════════════════════════════════════════ */
function initScene() {
  const canvas = document.getElementById('canvas');

  /* ── Renderer ─────────────────────────────────────────────── */
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:             true,
    preserveDrawingBuffer: true,   // required for PNG export
    alpha:                 true,   // transparent for gradient theme
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled       = true;
  renderer.shadowMap.type          = THREE.PCFSoftShadowMap;
  renderer.toneMapping             = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure     = 1.08;
  renderer.outputColorSpace        = THREE.SRGBColorSpace;

  /* ── Scene ────────────────────────────────────────────────── */
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090f, 0.017);

  /* ── Camera ───────────────────────────────────────────────── */
  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(...CAM_PRESETS.iso.pos);

  /* ── Orbit Controls ───────────────────────────────────────── */
  controls = new OrbitControls(camera, canvas);
  controls.target.set(...CAM_PRESETS.iso.target);
  controls.enableDamping   = true;
  controls.dampingFactor   = 0.055;
  controls.minDistance     = 1;
  controls.maxDistance     = 90;
  controls.maxPolarAngle   = Math.PI * 0.90;
  controls.autoRotate      = false;
  controls.autoRotateSpeed = 1.0;
  controls.update();

  /* ── Environment Map (Room IBL for PBR reflections) ────────── */
  const pmrem  = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  /* ── Lights ───────────────────────────────────────────────── */
  ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(0x223366, 0x050515, 0.55);
  scene.add(hemiLight);

  keyLight = new THREE.DirectionalLight(0xfff8f0, 2.00);
  keyLight.position.set(10, 16, 10);
  keyLight.castShadow               = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near       =  0.5;
  keyLight.shadow.camera.far        = 90;
  keyLight.shadow.camera.left       = -30;
  keyLight.shadow.camera.right      =  30;
  keyLight.shadow.camera.top        =  30;
  keyLight.shadow.camera.bottom     = -30;
  keyLight.shadow.bias              = -0.0003;
  keyLight.shadow.normalBias        =  0.025;
  scene.add(keyLight);

  fillLight = new THREE.DirectionalLight(0x3366ff, 0.55);
  fillLight.position.set(-10, 5, -6);
  scene.add(fillLight);

  rimLight = new THREE.DirectionalLight(0x7c3aed, 2.60);
  rimLight.position.set(-4, 10, -12);
  scene.add(rimLight);

  bounceLight = new THREE.DirectionalLight(0x1e3a8a, 1.20);
  bounceLight.position.set(2, -8, 2);
  scene.add(bounceLight);

  /* ── Shadow receiver plane (invisible, catches floor shadows) */
  const spGeom = new THREE.PlaneGeometry(60, 60);
  const spMat  = new THREE.ShadowMaterial({ opacity: 0.18, transparent: true });
  shadowPlane  = new THREE.Mesh(spGeom, spMat);
  shadowPlane.rotation.x    = -Math.PI / 2;
  shadowPlane.position.y    = -0.025;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ── Groups / helpers ─────────────────────────────────────── */
  crossbarGroup = new THREE.Group();
  scene.add(crossbarGroup);

  gridHelper = makeGrid();
  gridHelper.visible = P.showGrid;
  scene.add(gridHelper);

  axesHelper = new THREE.AxesHelper(4);
  axesHelper.visible = P.showAxes;
  scene.add(axesHelper);

  /* ── Touch controls ──────────────────────────────────────── */
  controls.touches = {
    ONE:  THREE.TOUCH.ROTATE,
    TWO:  THREE.TOUCH.DOLLY_PAN,
  };

  /* ── Boot sequence ────────────────────────────────────────── */
  applyTheme(P.theme);
  buildScene();
  syncUI();
  bindEvents();

  /* ── Mobile: collapse sidebar & update hint text ─────────── */
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar')?.classList.add('hidden');
    document.getElementById('btn-sidebar-toggle')?.classList.remove('active');
    // Swap hint to touch-friendly wording
    const hint = document.getElementById('controls-hint');
    if (hint) {
      hint.innerHTML =
        '<span>1 Finger — Rotate</span>' +
        '<span>Pinch — Zoom</span>' +
        '<span>2 Fingers — Pan</span>';
    }
  }

  animate();
}

/* ══════════════════════════════════════════════════════════════
   BUILD SCENE  —  main parametric geometry & instancing pass
══════════════════════════════════════════════════════════════ */
function buildScene() {
  /* Dispose previous cycle's resources */
  activeGeoms.forEach(g => g.dispose());
  activeMats.forEach(m  => m.dispose());
  activeGeoms = [];
  activeMats  = [];
  while (crossbarGroup.children.length) crossbarGroup.remove(crossbarGroup.children[0]);

  /* ── Safe parameter clamping ──────────────────────────────── */
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

  /* ── PBR materials ────────────────────────────────────────── */
  matBottom = new THREE.MeshPhysicalMaterial({
    color:              new THREE.Color(P.colorBottom),
    metalness:          0.95,
    roughness:          0.08,
    clearcoat:          0.50,
    clearcoatRoughness: 0.10,
    envMapIntensity:    1.00,
    transparent: tr, opacity: op,
  });
  matTop = new THREE.MeshPhysicalMaterial({
    color:              new THREE.Color(P.colorTop),
    metalness:          0.97,
    roughness:          0.06,
    clearcoat:          0.40,
    clearcoatRoughness: 0.12,
    envMapIntensity:    1.00,
    transparent: tr, opacity: op,
  });
  matSwitch = new THREE.MeshPhysicalMaterial({
    color:              new THREE.Color(P.colorSwitch),
    metalness:          0.12,
    roughness:          0.38,
    clearcoat:          0.60,
    clearcoatRoughness: 0.18,
    envMapIntensity:    0.80,
    transparent: tr, opacity: op,
  });
  matSubstrate = new THREE.MeshStandardMaterial({
    color:       new THREE.Color(P.colorSubstrate),
    metalness:   0.05,
    roughness:   0.88,
    transparent: true,
    opacity:     op * 0.72,
  });
  matMarker = new THREE.MeshStandardMaterial({
    color:             0xffffff,
    emissive:          new THREE.Color(0xffffff),
    emissiveIntensity: 0.55,
    metalness:         0,
    roughness:         0.20,
  });
  activeMats.push(matBottom, matTop, matSwitch, matSubstrate, matMarker);

  /* ── Derived dimensions ───────────────────────────────────── */
  const offX      = (cols - 1) * sp / 2;
  const offZ      = (rows - 1) * sp / 2;
  const bottomLen = (rows - 1) * sp + ovh * 2;   // bar spans along Z
  const topLen    = (cols - 1) * sp + ovh * 2;   // bar spans along X
  const unitH     = barH + swH + barH;

  /* ── Shared geometry objects ──────────────────────────────── */
  const botGeom  = makeBarGeomZ(barW, barH, Math.max(0.04, bottomLen));
  const topGeom  = makeBarGeomX(barW, barH, Math.max(0.04, topLen));
  const swGeom   = P.switchShape === 'cylinder'
                   ? makeSwitchCyl(swDiam, swH)
                   : makeSwitchBox(swSize, swH);

  const subW    = (cols - 1) * sp + ovh * 2 + barW + 0.55;
  const subD    = (rows - 1) * sp + ovh * 2 + barW + 0.55;
  const subGeom = new THREE.BoxGeometry(subW, 0.11, subD);

  const mkGeom  = new THREE.SphereGeometry(0.065, 10, 10);

  activeGeoms.push(botGeom, topGeom, swGeom, subGeom, mkGeom);

  /* ── Label collection reset ───────────────────────────────── */
  labelData = [];

  /* ── Per-stack layer construction ────────────────────────── */
  for (let s = 0; s < stacks; s++) {
    const base = s * stackSp;

    // ── Substrate plate ──────────────────────────────────────
    if (P.showSubstrate) {
      const sub       = new THREE.Mesh(subGeom, matSubstrate);
      sub.position.set(0, base - 0.055, 0);
      sub.receiveShadow = true;
      sub.userData      = { type: 'substrate', stack: s };
      crossbarGroup.add(sub);
    }

    // ── Bottom bars — word lines (along Z) ───────────────────
    const bY      = base + barH / 2;
    const botInst = new THREE.InstancedMesh(botGeom, matBottom, cols);
    botInst.castShadow    = true;
    botInst.receiveShadow = true;
    botInst.userData      = { type: 'bottom-bar', stack: s };
    for (let c = 0; c < cols; c++) {
      _dummy.position.set(c * sp - offX, bY, 0);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      botInst.setMatrixAt(c, _dummy.matrix);
    }
    botInst.instanceMatrix.needsUpdate = true;
    crossbarGroup.add(botInst);

    // ── Switching layer pillars (one per crosspoint) ─────────
    const swY    = base + barH + swH / 2;
    const swInst = new THREE.InstancedMesh(swGeom, matSwitch, rows * cols);
    swInst.castShadow    = true;
    swInst.receiveShadow = true;
    swInst.userData      = { type: 'switch-layer', stack: s, rows, cols };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        _dummy.position.set(c * sp - offX, swY, r * sp - offZ);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        swInst.setMatrixAt(r * cols + c, _dummy.matrix);
      }
    }
    swInst.instanceMatrix.needsUpdate = true;
    crossbarGroup.add(swInst);

    // ── Top bars — bit lines (along X) ──────────────────────
    const tY      = base + barH + swH + barH / 2;
    const topInst = new THREE.InstancedMesh(topGeom, matTop, rows);
    topInst.castShadow    = true;
    topInst.receiveShadow = true;
    topInst.userData      = { type: 'top-bar', stack: s };
    for (let r = 0; r < rows; r++) {
      _dummy.position.set(0, tY, r * sp - offZ);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      topInst.setMatrixAt(r, _dummy.matrix);
    }
    topInst.instanceMatrix.needsUpdate = true;
    crossbarGroup.add(topInst);

    // ── Intersection markers (optional) ─────────────────────
    if (P.showMarkers) {
      const mY    = base + unitH + 0.09;
      const mInst = new THREE.InstancedMesh(mkGeom, matMarker, rows * cols);
      mInst.userData = { type: 'marker', stack: s, rows, cols };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          _dummy.position.set(c * sp - offX, mY, r * sp - offZ);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.setScalar(1);
          _dummy.updateMatrix();
          mInst.setMatrixAt(r * cols + c, _dummy.matrix);
        }
      }
      mInst.instanceMatrix.needsUpdate = true;
      crossbarGroup.add(mInst);
    }

    // ── Label positions ─────────────────────────────────────
    if (P.showLabels) {
      // Word-line labels: placed at +Z end of each bottom bar
      const wZ = bottomLen / 2 + 0.24;
      for (let c = 0; c < cols; c++) {
        labelData.push({
          text: `W${c}`,
          pos:  new THREE.Vector3(c * sp - offX, bY + barH * 0.65, wZ),
          type: 'word',
        });
      }
      // Bit-line labels: placed at +X end of each top bar
      const bX = topLen / 2 + 0.24;
      for (let r = 0; r < rows; r++) {
        labelData.push({
          text: `B${r}`,
          pos:  new THREE.Vector3(bX, tY, r * sp - offZ),
          type: 'bit',
        });
      }
      // Layer label (multi-stack only)
      if (stacks > 1) {
        labelData.push({
          text: `Layer ${s + 1}`,
          pos:  new THREE.Vector3(-offX - ovh - 0.95, base + unitH / 2, -offZ - ovh - 0.95),
          type: 'layer',
        });
      }
    }
  }

  /* ── Update helpers & info bar ─────────────────────────────── */
  refreshGrid();

  document.getElementById('info-txt').textContent =
    `${rows}×${cols} Array · ${rows * cols * stacks} crosspoints` +
    (stacks > 1 ? ` · ${stacks} stacks` : '');

  buildLabelDOM();
}

/* ──────────────────────────────────────────────────────────────
   MATERIAL UPDATES  (colour / opacity without geometry rebuild)
────────────────────────────────────────────────────────────── */
function updateMaterials() {
  if (matBottom)    matBottom.color.set(P.colorBottom);
  if (matTop)       matTop.color.set(P.colorTop);
  if (matSwitch)    matSwitch.color.set(P.colorSwitch);
  if (matSubstrate) matSubstrate.color.set(P.colorSubstrate);
}

function updateOpacity() {
  const op = Math.max(0.08, Math.min(1.0, P.opacity));
  const tr = op < 0.998;
  [matBottom, matTop, matSwitch].forEach(m => {
    if (!m) return;
    m.opacity = op; m.transparent = tr; m.needsUpdate = true;
  });
  if (matSubstrate) {
    matSubstrate.opacity     = op * 0.72;
    matSubstrate.transparent = true;
    matSubstrate.needsUpdate = true;
  }
}

/* ──────────────────────────────────────────────────────────────
   GRID
────────────────────────────────────────────────────────────── */
function makeGrid() {
  const th   = THEMES[P.theme] || THEMES['dark-neon'];
  const span = Math.max(P.rows, P.cols) * P.spacing;
  const size = Math.max(22, span * 2 + 14);
  const divs = Math.max(10, Math.round(size * 1.0));
  const g    = new THREE.GridHelper(size, divs, th.gridA, th.gridB);
  g.position.y = -0.03;
  return g;
}

function refreshGrid() {
  if (!scene) return;
  if (gridHelper) scene.remove(gridHelper);
  gridHelper = makeGrid();
  gridHelper.visible = P.showGrid;
  scene.add(gridHelper);
}

/* ──────────────────────────────────────────────────────────────
   LABEL DOM (2-D HTML overlays projected via camera)
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
   TOOLTIP  (pointer hover + raycasting against InstancedMesh)
────────────────────────────────────────────────────────────── */
function onPointerMove(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  // intersect direct children (each is an InstancedMesh or Mesh)
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
  const th = THEMES[name] || THEMES['dark-neon'];

  document.documentElement.setAttribute('data-theme', name);

  // Three.js scene background
  scene.background = th.sceneBg != null ? new THREE.Color(th.sceneBg) : null;
  if (scene.fog) {
    scene.fog.color.setHex(th.fogColor);
    scene.fog.density = th.fogDensity;
  }

  // Lights
  ambientLight.intensity         = th.ambient;
  hemiLight.color.setHex(th.hemiSky);
  hemiLight.groundColor.setHex(th.hemiGnd);
  hemiLight.intensity            = th.hemiInt;
  keyLight.intensity             = th.key;
  keyLight.color.setHex(th.keyCol);
  fillLight.color.setHex(th.fill);   fillLight.intensity   = th.fillInt;
  rimLight.color.setHex(th.rim);     rimLight.intensity    = th.rimInt;
  bounceLight.color.setHex(th.bounce); bounceLight.intensity = th.bounceInt;

  // envMapIntensity on existing physical materials
  [matBottom, matTop, matSwitch].forEach(m => {
    if (m) { m.envMapIntensity = th.envInt ?? 1.0; m.needsUpdate = true; }
  });

  // Grid rebuild for new colours
  refreshGrid();

  // Theme menu active state
  document.querySelectorAll('#menu-theme button').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === name);
  });
}

/* ──────────────────────────────────────────────────────────────
   ANIMATED CAMERA LERP TO PRESET
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
    const ease = 1 - Math.pow(1 - t, 3);   // easeOutCubic
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(tick);
  })();
}

/* ──────────────────────────────────────────────────────────────
   EXPORT  (PNG / high-res / transparent)
────────────────────────────────────────────────────────────── */
function exportImage(scale, transparent) {
  const W = window.innerWidth, H = window.innerHeight;
  const origBg  = scene.background;
  const origFog = scene.fog;

  if (transparent) { scene.background = null; scene.fog = null; }

  if (scale > 1) {
    renderer.setSize(W * scale, H * scale, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');

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
  a.download    = `crossbar-${P.rows}x${P.cols}${scale > 1 ? '-2x' : ''}${transparent ? '-transparent' : ''}.png`;
  a.click();
  showToast(`Saved ${Math.round(W * scale)}×${Math.round(H * scale)} PNG`);
}

/* ──────────────────────────────────────────────────────────────
   RESET ALL  →  defaults
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
   SYNC UI ← P  (push current params into every control)
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
  sl('ctrl-stacks',   'val-stacks',   P.stackCount,     0);
  sl('ctrl-stacksep', 'val-stacksep', P.stackSpacing,   1);
  sl('ctrl-opacity',  'val-opacity',  P.opacity,        2);

  document.querySelectorAll('input[name="sw-shape"]').forEach(r => {
    r.checked = r.value === P.switchShape;
  });

  const ck = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
  ck('vis-substrate', P.showSubstrate);
  ck('vis-labels',    P.showLabels);
  ck('vis-grid',      P.showGrid);
  ck('vis-axes',      P.showAxes);
  ck('vis-markers',   P.showMarkers);
  ck('vis-shadow',    P.showShadow);

  const cl = (id, sid, v) => {
    const e = document.getElementById(id);  if (e)  e.value            = v;
    const s = document.getElementById(sid); if (s)  s.style.background = v;
  };
  cl('color-bottom',    'sw-bottom',    P.colorBottom);
  cl('color-top',       'sw-top',       P.colorTop);
  cl('color-switch',    'sw-switch',    P.colorSwitch);
  cl('color-substrate', 'sw-substrate', P.colorSubstrate);

  toggleSwitchShape();

  const arBtn = document.getElementById('autorotate-btn');
  if (arBtn) {
    arBtn.classList.toggle('active', P.autoRotate);
    // Last child is the text node " Auto-Rotate" / " Rotating"
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
   DEBOUNCED BUILD  (avoids hammering geometry on rapid slider)
────────────────────────────────────────────────────────────── */
function scheduleBuild(delay) {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(buildScene, delay ?? 55);
}

/* ──────────────────────────────────────────────────────────────
   EVENT BINDING
────────────────────────────────────────────────────────────── */
function bindEvents() {

  /* Slider helper: wire one slider → P[key], display value, rebuild */
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
  onSlider('ctrl-stacks',   'val-stacks',   'stackCount',     0);
  onSlider('ctrl-stacksep', 'val-stacksep', 'stackSpacing',   1);

  /* Opacity — material update only, no full geometry rebuild */
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

  /* Switching shape radios */
  document.querySelectorAll('input[name="sw-shape"]').forEach(r => {
    r.addEventListener('change', () => {
      P.switchShape = r.value;
      toggleSwitchShape();
      scheduleBuild();
    });
  });

  /* Quick-size preset buttons */
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

  /* Color pickers */
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
  onColor('color-substrate', 'sw-substrate', 'colorSubstrate');

  /* Visibility checkboxes */
  const onCheck = (id, key, fn) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => { P[key] = el.checked; fn?.(el.checked); });
  };
  onCheck('vis-substrate', 'showSubstrate', () => scheduleBuild());
  onCheck('vis-markers',   'showMarkers',   () => scheduleBuild());
  onCheck('vis-labels', 'showLabels', v => {
    labelsOverlay.style.opacity = v ? '1' : '0';
    if (v) buildLabelDOM();
  });
  onCheck('vis-grid',   'showGrid',   v => { if (gridHelper) gridHelper.visible = v; });
  onCheck('vis-axes',   'showAxes',   v => { if (axesHelper) axesHelper.visible = v; });
  onCheck('vis-shadow', 'showShadow', v => {
    renderer.shadowMap.enabled = v;
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  });

  /* View-preset buttons */
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => gotoPreset(btn.dataset.view));
  });

  /* Auto-rotate */
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

  /* Theme dropdown */
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

  /* Export dropdown */
  expBtn?.addEventListener('click', e => {
    e.stopPropagation();
    expMenu?.classList.toggle('open');
    themeMenu?.classList.remove('open');
  });
  const bindExport = (id, scale, transp) => {
    document.getElementById(id)?.addEventListener('click', () => {
      expMenu?.classList.remove('open');
      exportImage(scale, transp);
    });
  };
  bindExport('exp-png',    1, false);
  bindExport('exp-png-hd', 2, false);
  bindExport('exp-transp', 1, true);

  /* Close dropdowns on outside click */
  document.addEventListener('click', () => {
    themeMenu?.classList.remove('open');
    expMenu?.classList.remove('open');
  });

  /* Reset / view */
  document.getElementById('btn-reset-all')?.addEventListener('click', resetAll);
  document.getElementById('btn-reset-view')?.addEventListener('click', () => gotoPreset('iso'));

  /* Sidebar toggle — with mobile overlay support */
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

  /* Tap backdrop to close sidebar on mobile */
  mobileOverlay?.addEventListener('click', closeSidebar);

  /* Resize: handled below alongside camera update */

  /* Collapsible sections */
  document.querySelectorAll('.sec-hdr').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.ctrl-sec')?.classList.toggle('open'));
  });

  /* Structure presets */
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

  /* Tooltip / raycasting */
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });

  /* Resize — camera + renderer + mobile overlay cleanup */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // If screen grew to desktop width, dismiss mobile overlay
    if (!isMobile() && mobileOverlay?.classList.contains('active')) {
      mobileOverlay.classList.remove('active');
      sidebar?.classList.remove('open-mobile');
    }
  });
}

/* ──────────────────────────────────────────────────────────────
   TOAST NOTIFICATION
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
  controls.update();           // apply damping
  updateLabels();              // project HTML labels
  renderer.render(scene, camera);
}

/* ──────────────────────────────────────────────────────────────
   BOOT
────────────────────────────────────────────────────────────── */
initScene();
