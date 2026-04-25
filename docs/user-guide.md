# User Guide — Pixel Insights

Pixel Insights is a web performance visualization tool. You provide a URL, it runs a real Lighthouse audit in the background, and renders the results as an animated pixel-art data center where the environment and characters physically react to how well your target site performs.

---

## Using the Interface

### Running an Audit

Type any valid URL into the input bar at the bottom of the screen and press `Enter` or click the arrow button. The URL must include the protocol:

```
https://example.com
```

The terminal prompt will cycle through the audit steps in real time — Chrome launching, page navigation, metric collection, score compilation. This process typically takes 15 to 45 seconds depending on the target site and your machine.

Once complete, the data center scene updates to reflect the results.

### Reading the Metrics HUD

After an audit completes, a metrics panel appears in the top-left of the canvas showing:

| Metric | What it measures | Scale |
|--------|-----------------|-------|
| Score | Overall Lighthouse performance score | 0 to 100 |
| LCP | Largest Contentful Paint — how long the main content takes to load | milliseconds |
| FCP | First Contentful Paint — how long until anything appears on screen | milliseconds |
| TBT | Total Blocking Time — how long the main thread was blocked | milliseconds |
| CLS | Cumulative Layout Shift — how much the page layout jumps around | unitless score |

Each metric has a colored fill bar showing its severity relative to its threshold.

### Interacting with Metrics

Hover over any metric row in the HUD to highlight its physical representation in the data center:

- **LCP** — highlights a heavy crate in the scene that vibrates more the worse the score
- **FCP** — highlights a server rack in the upper area
- **CLS** — activates a jitter effect on the entire scene proportional to severity

Click a metric row to pin the highlight. Click again to release it.

Hover over elements in the canvas itself to inspect them. Servers, racks, workstations, and agents all show a tooltip with live status information.

### System States

The scene changes appearance based on the performance score:

| Score range | State | What you see |
|-------------|-------|-------------|
| 90 to 100 | Stable | Agents work calmly, blue accent lights, normal pace |
| 50 to 89 | Warning | Agents move faster, yellow accents |
| 20 to 49 | Chaos | Agents run to servers in panic, fire visible on racks, agents shout dialogue |
| 0 to 19 | Fire | Canvas shakes, alarm sounds, flames and smoke on all servers |

### Scenario Simulator

Click the server icon button in the bottom-right of the canvas to open the Simulator panel. Drag the slider from 0 to 100 to manually force a performance score without running a real audit. This lets you preview all system states on demand.

### Night Mode

Toggle the sun/moon switch in the top-right corner of the page to switch to night mode. In night mode:

- The scene darkens with a deep blue overlay
- Server rack LEDs and monitor screens emit visible glows
- The sliding door at the entrance glows blue

### Performance History Graph

A small trend graph appears in the bottom-left corner of the canvas after at least two audits. It plots the historical performance scores as a line chart, giving you a visual record of how the site has changed across runs.

---

## Audio

Audio starts automatically on the first interaction (audit run or simulator use). This is a browser requirement — audio contexts cannot activate without user interaction.

- A low 60 Hz hum simulates server room ambience and scales in intensity with the system state
- In Fire state, an alarm plays every two seconds
- In Stable state with a perfect score (100), a celebratory tone plays periodically

---

## Known Limitations

- The audit requires Chrome to be installed locally. Headless browser environments or Docker containers without a Chrome binary will fail.
- Auditing `localhost` URLs will not work reliably because Chrome inside the server process cannot always reach another local server from the same process context.
- Very slow sites or sites with heavy redirects may time out.
- The `.lighthouse-profile` directory is created automatically in the project root to isolate Chrome's user data between runs.
