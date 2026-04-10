# 3D Crossbar Array Visualizer

**Author:** QAISER ABBAS

**Device:** Pt/ZnO/MoO3/Pt

**University:** Sejong University, Seoul, South Korea

---

## About

An interactive 3D visualization of a memristor crossbar array built with **Three.js** and **WebGL**.  
Designed to demonstrate the physical structure of neuromorphic hardware used in memristor-based AI research.

---

## Features

- Real-time 3D crossbar array rendering (up to 16×16)
- Interactive controls: bar size, spacing, layer height, colors
- Multiple themes: Dark Neon, Pure Black, Gradient, Light Gray, White
- Switching layer visualization (pillars & cylinders)
- Camera presets: Isometric, Front, Side, Top
- Structure presets: Default, Dense, Neural, Sparse
- Export as PNG (1x or 2x resolution, optional transparent background)
- Hover tooltips showing row/column/layer info
- Fully runs in browser — no install, no server needed

---

## How to Run

Open `index.html` directly in any modern browser:

```bash
# Option 1 — just double-click index.html

# Option 2 — Python server
python -m http.server 8080
# then open http://localhost:8080

# Option 3 — Node.js
npx serve .
```

> Requires WebGL support: Chrome 80+, Firefox 79+, Edge 80+

---

## Project Structure

```
3D-Crossbar-Visualizer/
├── index.html     — UI layout, sidebar controls, canvas
├── style.css      — Theme system via CSS custom properties (5 themes)
├── script.js      — Three.js scene, geometry builders, controls logic
└── notes.html     — Development notes and references
```

---

## Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=flat&logo=webgl&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)

---

## Research Context

This visualizer is part of research on **memristor-constrained neural networks**.  
The crossbar array represents the hardware architecture where memristor devices  
(Pt/ZnO/MoO₃/Pt) are arranged at each row-column intersection to act as synaptic weights.

Related project: [Memristor CNN on CIFAR-10](https://github.com/Qaiser-baitham/QAL)

---

## Connect

[![LinkedIn](https://img.shields.io/badge/LinkedIn-qaiser--sju-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/qaiser-sju)
