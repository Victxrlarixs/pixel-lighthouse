# Pixel Lighthouse

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NanoStores](https://img.shields.io/badge/NanoStores-000000?style=for-the-badge&logo=nanostores&logoColor=white)](https://github.com/nanostores/nanostores)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-F44B21?style=for-the-badge&logo=lighthouse&logoColor=white)](https://developer.chrome.com/docs/lighthouse/)

Enter a URL. A real Lighthouse audit runs server-side. The results appear not as numbers — but as a pixel-art data center where the environment, the lights, and the people react to your site's performance.

---

## How it works

You submit a URL. The server launches Chrome headlessly, runs a full Lighthouse audit, and returns six metrics: performance score, FCP, LCP, CLS, TBT, and timestamp. Those metrics are passed through a state machine that classifies the system into one of four states. The canvas reacts immediately.

Seven agents live in the data center. They have roles, moods, walking speeds, and dialogue. When your site performs well, they work calmly at their desks. When it does not, they run.

### System states

| Score | State | What happens |
|-------|-------|-------------|
| 90 – 100 | Stable | Agents work at normal pace, blue accent lighting |
| 50 – 89 | Warning | Agents move faster, yellow lighting, stress dialogue |
| 20 – 49 | Chaos | Agents sprint between racks, fire appears on servers |
| 0 – 19 | Fire | Canvas shakes, alarm sounds, smoke and flames everywhere |

### Metric metaphors

Each metric has a physical representation in the scene that activates when you hover or click it in the HUD:

| Metric | Visual representation |
|--------|----------------------|
| LCP | A heavy crate that vibrates — the worse the score, the more it shakes |
| FCP | A highlighted server rack in the upper zone |
| CLS | The entire scene jitters with sinusoidal translation |
| TBT | Agents stutter and flicker with a red overlay proportional to blocking time |

---

## Quickstart

Requires Node.js >= 22.12.0 and Google Chrome installed locally.

```bash
npm install
npm run dev
```

Open `http://localhost:4321`, enter any URL, and press Enter.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 — SSR with Node.js standalone adapter |
| Language | TypeScript 5 strict |
| State | NanoStores — atomic reactive atoms |
| Rendering | Canvas API — pixel-art engine, no libraries |
| Audio | Web Audio API — procedural sound |
| Audit | Lighthouse 13 + chrome-launcher |
| Styling | Vanilla CSS |

---

## Documentation

- [User Guide](docs/user-guide.md) — interface walkthrough, metric HUD, simulator, night mode
- [Technical Reference](docs/technical-reference.md) — architecture, data flow, rendering pipeline, agent system, extension points
