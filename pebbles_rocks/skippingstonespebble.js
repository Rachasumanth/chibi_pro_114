/**
 * Flat Skipping Stones Scatter — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 58x50px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Skippingstonespebble {
  static metadata = {
    name: 'Flat Skipping Stones Scatter',
    category: 'pebble_rock',
    baseLength: 58,
    baseWidth: 50
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

  _traceDisc(ctx, rx, ry, warp = 0.05) {
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx * (1 + warp), ry * 0.58, rx * 0.56, ry * (1 - warp), 0, ry);
    ctx.bezierCurveTo(-rx * 0.60, ry * (1 + warp * 0.7), -rx * (1 - warp * 0.4), ry * 0.54, -rx, 0);
    ctx.bezierCurveTo(-rx * (1 + warp * 0.3), -ry * 0.58, -rx * 0.54, -ry * (1 + warp * 0.6), 0, -ry);
    ctx.bezierCurveTo(rx * 0.58, -ry * (1 - warp * 0.5), rx * (1 - warp * 0.3), -ry * 0.56, rx, 0);
    ctx.closePath();
  }

  _drawSkippingDisc(ctx, s) {
    const {
      x, y, rx, ry, rot, thickness, warp,
      topLight, topMid, sideDark, sheenAlpha, vein
    } = s;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // 1. Soft thin drop shadow (tight offset emphasizes flat disc profile)
    ctx.fillStyle = 'rgba(20, 16, 36, 0.22)';
    ctx.beginPath();
    ctx.ellipse(1.2, thickness + 1.6, rx * 1.03, ry * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thin layered disc rim thickness (extruded slightly downward)
    ctx.save();
    ctx.translate(0, thickness);
    this._traceDisc(ctx, rx, ry, warp);
    ctx.fillStyle = sideDark;
    ctx.fill();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.65;
    ctx.stroke();
    ctx.restore();

    // 3. Flat polished top disc surface
    this._traceDisc(ctx, rx, ry, warp);
    const topGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    topGrad.addColorStop(0, topLight);
    topGrad.addColorStop(0.62, topMid);
    topGrad.addColorStop(1, sideDark);
    ctx.fillStyle = topGrad;
    ctx.fill();

    // Clipped flat top texture, smooth river-worn bevel & wet sheen
    ctx.save();
    this._traceDisc(ctx, rx, ry, warp);
    ctx.clip();

    // Crisp flat beveled inner plateau highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.05, -ry * 0.06, rx * 0.84, ry * 0.80, 0, Math.PI * 0.9, Math.PI * 1.95);
    ctx.stroke();

    // Optional fine mineral quartz hairline vein across flat disc
    if (vein) {
      ctx.strokeStyle = 'rgba(255, 252, 245, 0.42)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(-rx * 0.85, ry * 0.2);
      ctx.quadraticCurveTo(0, -ry * 0.15, rx * 0.85, -ry * 0.25);
      ctx.stroke();
    }

    // Broad flat glossy wet-stone specular reflection
    ctx.fillStyle = `rgba(240, 249, 255, ${sheenAlpha})`;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.22, -ry * 0.24, rx * 0.44, ry * 0.24, -0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.88, sheenAlpha + 0.24)})`;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.30, -ry * 0.28, rx * 0.18, ry * 0.10, -0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Crisp top contour outline (#1E142B)
    this._traceDisc(ctx, rx, ry, warp);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.65;
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

    // Subtle damp lakeshore shimmer patch beneath the scatter
    const dampGrad = ctx.createRadialGradient(0, 1, 5, 0, 1, 29);
    dampGrad.addColorStop(0, 'rgba(30, 42, 64, 0.16)');
    dampGrad.addColorStop(1, 'rgba(30, 42, 64, 0)');
    ctx.fillStyle = dampGrad;
    ctx.beginPath();
    ctx.ellipse(0, 1, 28, 23, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6 organic flat disc-like slate-blue and warm-tan skipping stones
    // Ordered back-to-front so overlapping stacked discs read naturally
    const stones = [
      // 1. Back-left slate-blue disc
      {
        x: -14.5, y: -9.5, rx: 10.6, ry: 7.4, rot: 0.22, thickness: 2.0, warp: 0.06,
        topLight: '#8CA3BC', topMid: '#607793', sideDark: '#3D4F66',
        sheenAlpha: 0.42, vein: true
      },
      // 2. Upper-right warm-tan flat disc
      {
        x: 13.0, y: -11.2, rx: 9.8, ry: 7.0, rot: -0.34, thickness: 1.8, warp: 0.05,
        topLight: '#E8D5B7', topMid: '#C7AE8B', sideDark: '#8F775A',
        sheenAlpha: 0.36, vein: false
      },
      // 3. Far-right small blue-slate disc
      {
        x: 18.8, y: 4.6, rx: 7.6, ry: 5.8, rot: 0.48, thickness: 1.7, warp: 0.04,
        topLight: '#7E95B0', topMid: '#566C87', sideDark: '#36465C',
        sheenAlpha: 0.46, vein: false
      },
      // 4. Lower-left warm sand-tan oval disc
      {
        x: -13.2, y: 10.2, rx: 9.2, ry: 6.4, rot: -0.20, thickness: 1.9, warp: 0.06,
        topLight: '#DFC7A4', topMid: '#B99C76', sideDark: '#80694C',
        sheenAlpha: 0.38, vein: true
      },
      // 5. Center-foreground hero slate-blue skipping stone (slightly overlapping #1 & #4)
      {
        x: 0.6, y: 0.8, rx: 11.4, ry: 8.2, rot: -0.14, thickness: 2.2, warp: 0.05,
        topLight: '#9AB2CB', topMid: '#6B85A3', sideDark: '#445873',
        sheenAlpha: 0.50, vein: true
      },
      // 6. Front-bottom tiny tan skipper tucked neatly near center
      {
        x: 6.8, y: 14.4, rx: 7.4, ry: 5.4, rot: 0.30, thickness: 1.6, warp: 0.05,
        topLight: '#F0DFC4', topMid: '#CFAF86', sideDark: '#967A59',
        sheenAlpha: 0.44, vein: false
      }
    ];

    for (const s of stones) {
      this._drawSkippingDisc(ctx, s);
    }

    ctx.restore();
  }
}

export default Skippingstonespebble;
