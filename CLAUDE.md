# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

This is a static single-page application — no build step, no package manager, no server required.

Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python (built-in)
python -m http.server 8080

# Node.js (if npx available)
npx serve .
```

The app requires a browser with WebGL support (Chrome 80+, Firefox 79+, Edge 80+). It will display an error screen if WebGL is unavailable.

## Architecture

Three files make up the entire application:

- **`index.html`** — UI structure: header nav, sidebar control panel, canvas, labels overlay, tooltip, and footer bar. The sidebar is divided into collapsible sections (`<section class="ctrl-sec">`): Array Size, Bar Dimensions, Switching Layer, Stack Layers, Colors, Visibility, and Presets.
- **`style.css`** — Theme system via CSS custom properties under `[data-theme]` attribute on `<html>`. Five themes: `dark-neon`, `pure-black`, `gradient`, `light-gray`, `white`. All colors and spacing use `--var` tokens defined per theme.
- **`script.js`** — ES Module, loaded via `<script type="module">`. Uses Three.js r163 via CDN importmap (no local install).

### script.js structure

| Section | Purpose |
|---|---|
| `DEFAULTS` / `P` | Single parameter object controlling all scene state |
| `THEMES` | Three.js scene lighting and fog per theme |
| `CAM_PRESETS` | Named camera positions (iso, front, side, top) |
| `PRESETS` | Named structure configurations (default, dense, neural, etc.) |
| Geometry utilities | `makeBarGeomZ/X`, `makeSwitchBox`, `makeSwitchCyl` — procedural geometry builders |
| `initScene()` | One-time Three.js setup: renderer, camera, lights, OrbitControls, RoomEnvironment IBL |
| `buildScene()` | Rebuilds all `InstancedMesh` objects from current `P` state. Debounced (100 ms) on slider input. Disposes old geometries/materials tracked in `activeGeoms`/`activeMats`. |
| UI event wiring | Sliders, checkboxes, color inputs, dropdowns all write to `P` then call `buildScene()` or targeted update functions |
| Export | PNG snapshot via `renderer.domElement.toDataURL()`, with optional 2× resolution or transparent background |
| Label overlay | HTML labels positioned via Three.js world→screen projection each animation frame |

### Key design patterns

- **InstancedMesh throughout**: bottom bars, top bars, switching pillars, and intersection markers are each a single `InstancedMesh` for performance at 16×16 scale.
- **Debounced rebuild**: slider changes set a 100 ms timer before calling `buildScene()` to avoid rebuilding on every frame during drag.
- **Theme application**: changing theme writes `data-theme` on `<html>` (CSS variables) and calls `applyTheme()` (Three.js scene colors/fog/lighting).
- **Geometry disposal**: `activeGeoms` and `activeMats` arrays track everything created per build cycle; `buildScene()` disposes them before rebuilding.
