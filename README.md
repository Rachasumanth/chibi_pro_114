# Chibi Pro 114 — Aquatic 2D Canvas Asset Pack

A comprehensive library of **181 standalone 2D procedural assets** designed for HTML5 Canvas 2D. Every asset is a self-contained ES module with **zero external dependencies** — no raster images, fonts, or third-party libraries required.

## Contents

| Category | Count | Description |
| :--- | :---: | :--- |
| [`fishes/`](./fishes/) | 67 | Chibi Pro fish and marine life with multi-node spine rigs and keyframe animations |
| [`villans/`](./villans/) | 67 | Dark / sinister Chibi Pro villain variants with stylized palettes, glowing lures, and razor grins |
| [`floras/`](./floras/) | 15 | Underwater vegetation, kelp, corals, sponges, and water lilies |
| [`objects/`](./objects/) | 16 | Underwater props, anchors, treasure chests, cannons, and rowboats |
| [`pebbles_rocks/`](./pebbles_rocks/) | 16 | Procedural rocks, boulders, geodes, and gravel formations |
| **Total** | **181** | **Complete aquatic scene asset pack** |

## Usage

Import any asset as an ES module, instantiate it with `(x, y, scale)`, update animation state, and render into your 2D canvas context:

```javascript
import ClownFish from './fishes/clownfish.js';
import VillainAnglerFish from './villans/villain_anglerfish.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const hero = new ClownFish(200, 300, 1.0);
hero.play('swimming');

const villain = new VillainAnglerFish(600, 300, 1.2);
villain.play('swimming');

function loop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hero.update(16);     // Delta time in ms
  hero.draw(ctx);

  villain.update(16);
  villain.draw(ctx);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

## Common Animation States

Fish assets support keyframe animation states including:
- `breathing` / `idle`
- `swimming`
- `relax`
- `left_turn`, `right_turn`
- `hungry`, `eating`
- `shock`, `fear`, `stress`
- `happy`, `sad`
