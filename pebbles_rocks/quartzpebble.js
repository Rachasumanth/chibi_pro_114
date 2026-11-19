/**
 * Milky White Quartz Pebbles — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 42x36px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Quartzpebble {
  static metadata = {
    name: 'Milky White Quartz Pebbles',
    category: 'pebble_rock',
    baseLength: 42,
    baseWidth: 36
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

  _traceQuartzBean(ctx, rx, ry) {
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx * 1.04, ry * 0.64, rx * 0.56, ry * 1.04, 0, ry);
    ctx.bezierCurveTo(-rx * 0.58, ry * 0.98, -rx * 1.02, ry * 0.58, -rx, 0);
    ctx.bezierCurveTo(-rx * 0.98, -ry * 0.60, -rx * 0.52, -ry * 1.05, 0, -ry);
    ctx.bezierCurveTo(rx * 0.58, -ry * 0.98, rx * 1.02, -ry * 0.56, rx, 0);
    ctx.closePath();
  }

  _drawSparkle(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.14, -size * 0.14, size, 0);
    ctx.quadraticCurveTo(size * 0.14, size * 0.14, 0, size);
    ctx.quadraticCurveTo(-size * 0.14, size * 0.14, -size, 0);
    ctx.quadraticCurveTo(-size * 0.14, -size * 0.14, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawQuartzStone(ctx, cfg) {
    const {
      px, py, rx, ry, rot,
      coreColor, midColor, rimColor, innerGlow,
      veinColor, sparkleOffset
    } = cfg;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Soft translucent shadow (slightly cool-tinted with light pass-through)
    ctx.fillStyle = 'rgba(30, 22, 48, 0.18)';
    ctx.beginPath();
    ctx.ellipse(1.5, 2.2, rx * 1.04, ry * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle refracted caustic light glow inside shadow edge
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.ellipse(rx * 0.35, ry * 0.45, rx * 0.42, ry * 0.3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Main translucent milky quartz fill
    this._traceQuartzBean(ctx, rx, ry);
    const bodyGrad = ctx.createRadialGradient(
      -rx * 0.30, -ry * 0.32, rx * 0.08,
      rx * 0.10, ry * 0.14, Math.max(rx, ry) * 1.15
    );
    bodyGrad.addColorStop(0, coreColor);
    bodyGrad.addColorStop(0.55, midColor);
    bodyGrad.addColorStop(1, rimColor);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped internal crystalline structure, milky clouds & subsurface bounce
    ctx.save();
    this._traceQuartzBean(ctx, rx, ry);
    ctx.clip();

    // Internal subsurface translucent glow near bottom-right rim (quartz light scatter)
    const subGrad = ctx.createRadialGradient(
      rx * 0.28, ry * 0.32, 0.5,
      rx * 0.28, ry * 0.32, rx * 0.85
    );
    subGrad.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
    subGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = subGrad;
    ctx.beginPath();
    ctx.ellipse(rx * 0.25, ry * 0.28, rx * 0.78, ry * 0.62, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Soft cool lavender-slate cel-shading crescent
    ctx.strokeStyle = 'rgba(138, 128, 168, 0.26)';
    ctx.lineWidth = ry * 0.36;
    ctx.beginPath();
    ctx.arc(rx * 0.04, ry * 0.06, Math.min(rx, ry) * 0.84, 0.15, Math.PI * 0.88);
    ctx.stroke();

    // Subtle crystalline internal fracture veins (branching pearlescent threads)
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.72, ry * 0.12);
    ctx.lineTo(-rx * 0.14, -ry * 0.06);
    ctx.lineTo(rx * 0.32, ry * 0.24);
    ctx.lineTo(rx * 0.74, ry * 0.08);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.70, ry * 0.04);
    ctx.lineTo(-rx * 0.12, -ry * 0.14);
    ctx.lineTo(rx * 0.28, -ry * 0.44);
    ctx.stroke();

    // Tiny faceted crystalline shimmer plane inside quartz
    ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
    ctx.beginPath();
    ctx.moveTo(-rx * 0.18, -ry * 0.36);
    ctx.lineTo(rx * 0.22, -ry * 0.18);
    ctx.lineTo(rx * 0.06, ry * 0.14);
    ctx.lineTo(-rx * 0.34, -ry * 0.04);
    ctx.closePath();
    ctx.fill();

    // Glossy glass-like bean specular highlight
    ctx.save();
    ctx.translate(-rx * 0.28, -ry * 0.30);
    ctx.rotate(-0.38);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.30, ry * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(rx * 0.36, ry * 0.06, Math.max(0.85, rx * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end clip

    // Crisp expressive outline (#1E142B)
    this._traceQuartzBean(ctx, rx, ry);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.85;
    ctx.stroke();

    // 4-point star sparkle on top specular spot
    if (sparkleOffset) {
      this._drawSparkle(ctx, sparkleOffset[0] * rx, sparkleOffset[1] * ry, sparkleOffset[2]);
    }

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

    // Soft ambient shadow bed under trio
    const bedGrad = ctx.createRadialGradient(0, 2, 3, 0, 2, 20);
    bedGrad.addColorStop(0, 'rgba(32, 24, 52, 0.24)');
    bedGrad.addColorStop(1, 'rgba(32, 24, 52, 0)');
    ctx.fillStyle = bedGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute trio of milky-white and pale-rose rounded quartz pebbles
    const trio = [
      // 1. Pale Rose Quartz (upper-right)
      {
        px: 8.8, py: -5.4, rx: 9.2, ry: 7.4, rot: -0.28,
        coreColor: '#FFF5F8',
        midColor: '#F7DCE6',
        rimColor: '#D4A8BC',
        innerGlow: 'rgba(255, 224, 238, 0.35)',
        veinColor: 'rgba(186, 132, 158, 0.45)',
        sparkleOffset: [-0.36, -0.34, 2.7]
      },
      // 2. Milky Snow Quartz (main plump hero pebble, left)
      {
        px: -7.8, py: -2.2, rx: 11.4, ry: 8.8, rot: 0.24,
        coreColor: '#FFFFFF',
        midColor: '#EEF2F8',
        rimColor: '#BCC6D9',
        innerGlow: 'rgba(235, 246, 255, 0.38)',
        veinColor: 'rgba(148, 162, 192, 0.42)',
        sparkleOffset: [-0.34, -0.34, 3.4]
      },
      // 3. Blush-Cream Quartz (foreground lower-right)
      {
        px: 3.4, py: 8.2, rx: 8.4, ry: 6.6, rot: 0.16,
        coreColor: '#FFFDFC',
        midColor: '#F4E8EE',
        rimColor: '#C9B5C6',
        innerGlow: 'rgba(255, 240, 248, 0.32)',
        veinColor: 'rgba(166, 144, 168, 0.40)',
        sparkleOffset: [-0.32, -0.32, 2.3]
      }
    ];

    for (const q of trio) {
      this._drawQuartzStone(ctx, q);
    }

    ctx.restore();
  }
}

export default Quartzpebble;
