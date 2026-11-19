/**
 * Smooth River Pebble Cluster — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 45x38px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Riverpebble {
  static metadata = {
    name: 'Smooth River Pebble Cluster',
    category: 'pebble_rock',
    baseLength: 45,
    baseWidth: 38
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(_name) {}
  update(_dt) {}

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(_name, _callback) {}

  _traceOrganicPebble(ctx, rx, ry, bulgeX = 0.08, bulgeY = 0.06) {
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(
      rx * (1 + bulgeX), ry * 0.62,
      rx * 0.56, ry * (1 + bulgeY),
      0, ry
    );
    ctx.bezierCurveTo(
      -rx * 0.62, ry * (1 - bulgeY * 0.4),
      -rx * (1 + bulgeX * 0.6), ry * 0.54,
      -rx, 0
    );
    ctx.bezierCurveTo(
      -rx * (1 - bulgeX * 0.3), -ry * 0.6,
      -rx * 0.54, -ry * (1 + bulgeY * 0.8),
      0, -ry
    );
    ctx.bezierCurveTo(
      rx * 0.58, -ry * (1 - bulgeY * 0.3),
      rx * (1 + bulgeX * 0.4), -ry * 0.55,
      rx, 0
    );
    ctx.closePath();
  }

  _drawSinglePebble(ctx, cfg) {
    const {
      px, py, rx, ry, rot, bulgeX, bulgeY,
      baseLight, baseMid, baseDark, rimBounce,
      bandColor, speckles, wetGloss
    } = cfg;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Soft cast shadow & tight contact AO
    ctx.fillStyle = 'rgba(20, 14, 34, 0.20)';
    ctx.beginPath();
    ctx.ellipse(1.6, 2.2, rx * 1.06, ry * 1.02, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(18, 12, 30, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0.7, 1.1, rx * 0.98, ry * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base silhouette fill with radial cel-inspired gradient
    this._traceOrganicPebble(ctx, rx, ry, bulgeX, bulgeY);
    const bodyGrad = ctx.createRadialGradient(
      -rx * 0.32, -ry * 0.34, rx * 0.08,
      rx * 0.06, ry * 0.08, Math.max(rx, ry) * 1.15
    );
    bodyGrad.addColorStop(0, baseLight);
    bodyGrad.addColorStop(0.55, baseMid);
    bodyGrad.addColorStop(1, baseDark);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped internal layered cel-shading, mineral bands, speckles & wet highlights
    ctx.save();
    this._traceOrganicPebble(ctx, rx, ry, bulgeX, bulgeY);
    ctx.clip();

    // Subtle sedimentary/water-worn mineral stripe
    if (bandColor) {
      ctx.strokeStyle = bandColor;
      ctx.lineWidth = Math.max(1.2, ry * 0.22);
      ctx.beginPath();
      ctx.moveTo(-rx * 1.1, -ry * 0.12);
      ctx.quadraticCurveTo(0, ry * 0.28, rx * 1.1, -ry * 0.06);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 252, 245, 0.22)';
      ctx.lineWidth = Math.max(0.7, ry * 0.09);
      ctx.beginPath();
      ctx.moveTo(-rx * 1.1, -ry * 0.22);
      ctx.quadraticCurveTo(0, ry * 0.14, rx * 1.1, -ry * 0.16);
      ctx.stroke();
    }

    // Cel-shaded underside shadow crescent
    ctx.fillStyle = 'rgba(26, 18, 42, 0.24)';
    ctx.beginPath();
    ctx.ellipse(rx * 0.22, ry * 0.34, rx * 0.98, ry * 0.82, 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Warm/cool subtle reflected bounce rim along bottom-right edge
    ctx.strokeStyle = rimBounce;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(rx * 0.05, ry * 0.06, Math.min(rx, ry) * 0.86, 0.25, Math.PI * 0.82);
    ctx.stroke();

    // Sunlit top-left dome plane
    ctx.fillStyle = 'rgba(255, 250, 240, 0.22)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.22, -ry * 0.24, rx * 0.58, ry * 0.48, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Fine river-worn mineral speckles
    for (const [sx, sy, sr, sc] of speckles) {
      ctx.fillStyle = sc;
      ctx.beginPath();
      ctx.arc(sx * rx, sy * ry, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy wet bean highlight (primary curved bean + secondary micro dot)
    ctx.save();
    ctx.translate(-rx * 0.30, -ry * 0.30);
    ctx.rotate(-0.42);
    ctx.fillStyle = `rgba(255, 255, 255, ${wetGloss})`;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.24, 0);
    ctx.bezierCurveTo(-rx * 0.20, -ry * 0.22, rx * 0.18, -ry * 0.22, rx * 0.26, -ry * 0.04);
    ctx.bezierCurveTo(rx * 0.14, ry * 0.08, -rx * 0.12, ry * 0.10, -rx * 0.24, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.95, wetGloss + 0.16)})`;
    ctx.beginPath();
    ctx.ellipse(rx * 0.34, ry * 0.03, Math.max(0.9, rx * 0.08), Math.max(0.7, ry * 0.07), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end clip

    // Bold expressive chibi outline (#1E142B)
    this._traceOrganicPebble(ctx, rx, ry, bulgeX, bulgeY);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Soft shared damp river-bed shadow halo beneath the 4-pebble cluster
    const haloGrad = ctx.createRadialGradient(0, 2, 4, 0, 2, 23);
    haloGrad.addColorStop(0, 'rgba(22, 16, 36, 0.28)');
    haloGrad.addColorStop(0.68, 'rgba(22, 16, 36, 0.12)');
    haloGrad.addColorStop(1, 'rgba(22, 16, 36, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.ellipse(0.5, 2.2, 22.5, 17.5, 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 4 plump water-worn oval pebbles: warm slate, taupe, cream, terracotta
    // Drawn back-to-front so overlapping crevices read cleanly
    const pebbles = [
      // 1. Warm Terracotta (back-left tucked pebble)
      {
        px: -12.2, py: 7.4, rx: 7.8, ry: 6.0, rot: 0.42,
        bulgeX: 0.09, bulgeY: 0.06,
        baseLight: '#E09270', baseMid: '#C66F4D', baseDark: '#8F4632',
        rimBounce: 'rgba(255, 206, 176, 0.45)',
        bandColor: 'rgba(130, 52, 34, 0.28)',
        wetGloss: 0.62,
        speckles: [
          [0.25, 0.18, 0.7, 'rgba(72, 28, 22, 0.45)'],
          [-0.12, 0.42, 0.55, 'rgba(255, 228, 210, 0.5)'],
          [0.45, -0.20, 0.6, 'rgba(92, 36, 26, 0.4)']
        ]
      },
      // 2. Warm Taupe (upper-right smooth river oval)
      {
        px: 10.6, py: -5.4, rx: 10.2, ry: 7.5, rot: -0.32,
        bulgeX: 0.07, bulgeY: 0.08,
        baseLight: '#C9BFA9', baseMid: '#A69882', baseDark: '#736757',
        rimBounce: 'rgba(235, 226, 205, 0.42)',
        bandColor: 'rgba(246, 240, 225, 0.30)',
        wetGloss: 0.68,
        speckles: [
          [-0.35, 0.28, 0.7, 'rgba(56, 46, 40, 0.42)'],
          [0.32, 0.32, 0.8, 'rgba(56, 46, 40, 0.38)'],
          [0.12, -0.38, 0.6, 'rgba(255, 250, 240, 0.55)'],
          [0.52, 0.04, 0.55, 'rgba(56, 46, 40, 0.35)']
        ]
      },
      // 3. Warm Slate (main plump hero pebble, upper-left)
      {
        px: -7.0, py: -4.2, rx: 12.2, ry: 9.2, rot: 0.22,
        bulgeX: 0.08, bulgeY: 0.07,
        baseLight: '#94A6B8', baseMid: '#687A8F', baseDark: '#435065',
        rimBounce: 'rgba(186, 209, 232, 0.42)',
        bandColor: 'rgba(220, 232, 244, 0.22)',
        wetGloss: 0.74,
        speckles: [
          [0.38, 0.22, 0.8, 'rgba(30, 38, 56, 0.45)'],
          [0.14, 0.46, 0.65, 'rgba(230, 240, 250, 0.42)'],
          [-0.44, 0.32, 0.75, 'rgba(30, 38, 56, 0.40)'],
          [0.48, -0.18, 0.6, 'rgba(30, 38, 56, 0.36)'],
          [-0.08, 0.14, 0.55, 'rgba(240, 248, 255, 0.35)']
        ]
      },
      // 4. Creamy Limestone-Quartz (foreground lower-right plump bean)
      {
        px: 3.4, py: 8.6, rx: 11.0, ry: 8.0, rot: 0.12,
        bulgeX: 0.06, bulgeY: 0.08,
        baseLight: '#FAF4E4', baseMid: '#E6D9BE', baseDark: '#B8A586',
        rimBounce: 'rgba(255, 252, 242, 0.65)',
        bandColor: 'rgba(182, 158, 122, 0.25)',
        wetGloss: 0.80,
        speckles: [
          [0.36, 0.18, 0.7, 'rgba(122, 100, 74, 0.42)'],
          [-0.36, 0.36, 0.65, 'rgba(122, 100, 74, 0.38)'],
          [0.10, 0.44, 0.55, 'rgba(142, 118, 88, 0.36)'],
          [0.48, -0.22, 0.6, 'rgba(122, 100, 74, 0.35)']
        ]
      }
    ];

    for (const p of pebbles) {
      this._drawSinglePebble(ctx, p);
    }

    // Tiny crevice AO accent where central pebbles meet
    ctx.fillStyle = 'rgba(30, 20, 43, 0.35)';
    ctx.beginPath();
    ctx.arc(0.4, 1.4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Two tiny wet water droplets perched on the slate & cream pebbles
    const droplets = [
      [-1.8, -6.5, 1.25],
      [8.2, 6.4, 1.05]
    ];
    for (const [dx, dy, dr] of droplets) {
      ctx.fillStyle = 'rgba(28, 22, 46, 0.28)';
      ctx.beginPath();
      ctx.arc(dx + 0.4, dy + 0.5, dr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(218, 244, 255, 0.72)';
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(dx - dr * 0.32, dy - dr * 0.32, dr * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Riverpebble;
