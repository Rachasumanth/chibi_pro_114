/**
 * Multi-Colored Gravel & Grit Patch — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 65x58px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Sandgravelpebble {
  static metadata = {
    name: 'Multi-Colored Gravel & Grit Patch',
    category: 'pebble_rock',
    baseLength: 65,
    baseWidth: 58
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

  _drawTinyPebble(ctx, x, y, rx, ry, rot, light, mid, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Tiny nested sand contact shadow
    ctx.fillStyle = 'rgba(32, 22, 38, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0.9, 1.3, rx * 1.05, ry * 0.98, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plump chibi gravel nugget
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx * 1.06, ry * 0.65, rx * 0.54, ry * 1.04, 0, ry);
    ctx.bezierCurveTo(-rx * 0.62, ry * 0.96, -rx * 1.04, ry * 0.56, -rx, 0);
    ctx.bezierCurveTo(-rx * 0.96, -ry * 0.64, -rx * 0.48, -ry * 1.05, 0, -ry);
    ctx.bezierCurveTo(rx * 0.60, -ry * 0.96, rx * 1.02, -ry * 0.54, rx, 0);
    ctx.closePath();

    const pGrad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, Math.max(rx, ry) * 1.15);
    pGrad.addColorStop(0, light);
    pGrad.addColorStop(0.55, mid);
    pGrad.addColorStop(1, dark);
    ctx.fillStyle = pGrad;
    ctx.fill();

    // Cute glossy highlight dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.28, -ry * 0.28, rx * 0.30, ry * 0.18, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Crisp chibi outline (#1E142B)
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.4;
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

    // Soft textured warm sand shadow patch
    const sandGrad = ctx.createRadialGradient(-2, -1, 4, 0, 1, 31);
    sandGrad.addColorStop(0, 'rgba(194, 158, 108, 0.48)');
    sandGrad.addColorStop(0.62, 'rgba(156, 122, 82, 0.26)');
    sandGrad.addColorStop(1, 'rgba(156, 122, 82, 0)');
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.ellipse(0, 1, 31, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Subtle organic sandy grit ripples & tiny sand grains beneath pebbles
    const grit = [
      [-24, -10, 1.1, '#B89568'], [-18, -18, 0.9, '#EAD4B0'], [-4, -22, 1.2, '#9A7852'],
      [14, -19, 1.0, '#EAD4B0'], [24, -8, 1.1, '#B89568'], [26, 6, 0.9, '#8E6D49'],
      [18, 18, 1.2, '#EAD4B0'], [2, 23, 1.0, '#9A7852'], [-14, 21, 1.1, '#B89568'],
      [-25, 8, 1.0, '#EAD4B0'], [-10, -4, 0.9, '#8E6D49'], [8, -6, 1.0, '#F4E3C5'],
      [4, 8, 0.95, '#9A7852'], [-6, 12, 1.1, '#EAD4B0'], [15, 4, 0.85, '#8E6D49'],
      [-20, -1, 0.9, '#F4E3C5'], [10, -12, 0.85, '#9A7852'], [-16, 14, 0.9, '#8E6D49']
    ];
    for (const [gx, gy, gr, col] of grit) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5 mineral color palettes: amber, rust, slate, ivory, ochre
    const amber = ['#FBBF24', '#D97706', '#92400E'];
    const rust  = ['#E07A5F', '#B84A39', '#7A2922'];
    const slate = ['#94A3B8', '#64748B', '#3E4C61'];
    const ivory = ['#FFFDF5', '#E8DFC8', '#B8AA8F'];
    const ochre = ['#E9B872', '#C68B45', '#8A5B26'];

    // Exactly 15 tiny multi-hued pebbles arranged organically within 65x58
    const pebbles = [
      [-21, -8,  4.4, 3.3,  0.35, slate],
      [-12, -16, 4.8, 3.6, -0.25, amber],
      [2,   -18, 4.2, 3.1,  0.18, ivory],
      [15,  -13, 5.0, 3.8, -0.40, rust],
      [23,  -2,  3.8, 2.9,  0.52, ochre],
      [-23,  6,  4.0, 3.0, -0.30, ivory],
      [-12, -4,  5.6, 4.2,  0.15, rust],
      [0,   -6,  5.2, 4.0, -0.22, slate],
      [11,  -2,  4.6, 3.5,  0.38, amber],
      [-15,  12, 4.6, 3.4,  0.28, ochre],
      [-4,   5,  5.8, 4.3, -0.12, ivory],
      [8,    8,  5.0, 3.7,  0.42, slate],
      [19,   11, 4.2, 3.1, -0.28, amber],
      [-5,   18, 4.5, 3.3,  0.10, rust],
      [8,    19, 3.9, 2.9, -0.35, ochre]
    ];

    for (const [px, py, rx, ry, rot, pal] of pebbles) {
      this._drawTinyPebble(ctx, px, py, rx, ry, rot, pal[0], pal[1], pal[2]);
    }

    ctx.restore();
  }
}

export default Sandgravelpebble;
