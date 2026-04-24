# Lighthouse Pixel — Performance Telemetry Simulator

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NanoStores](https://img.shields.io/badge/NanoStores-000000?style=for-the-badge&logo=nanostores&logoColor=white)](https://github.com/nanostores/nanostores)

**"A living data center that explains web performance through metaphors."**

Lighthouse Pixel is an interactive visualization tool where a pixel-art data center represents a website's performance. Instead of just numbers, you see a living system that reacts visually to Lighthouse metrics like LCP, CLS, and TBT.

---

## Intelligent Visual Metaphors

This tool transforms abstract metrics into intuitive visual feedback:

- **LCP (Largest Contentful Paint):** Represented by "Heavy Data Payloads". If LCP is slow, massive crates block movement and vibrate with effort.
- **CLS (Cumulative Layout Shift):** Causes "Layout Jitter". The entire scene (racks, furniture) shifts and vibrates based on the severity of the shift.
- **TBT (Total Blocking Time):** Simulates "Main-Thread Blocking". Characters stutter and freeze in place, visually representing lag.

---

## Key Features

- **Interactive Telemetry HUD:** A reactive metrics panel that controls the scene.
- **Bidirectional Inspection:** Hover or click any metric to highlight its physical representation in the data center.
- **Premium Aesthetics:** GBA-style pixel art with modern CRT scanlines, glassmorphism UI, and smooth spring animations.
- **Scenario Simulator:** Manually force performance scores to see how the data center adapts from "Stable" to "Chaos" or "Fire" modes.
- **Zero-Inline Architecture:** Clean separation of concerns with logic decoupled into reactive NanoStores and modular TypeScript modules.

---

## Tech Stack

- **Framework:** Astro (Static Site Generation)
- **Logic:** TypeScript (Simulation engine)
- **State Management:** NanoStores (Atomic reactivity)
- **Rendering:** Canvas API (Pixel-art engine)
- **Styling:** Vanilla CSS (Advanced animations)
