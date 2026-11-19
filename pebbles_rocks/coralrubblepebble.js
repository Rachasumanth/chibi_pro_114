/**
 * Bleached Coral & Sea-Glass Pebbles — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 50x44px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Coralrubblepebble {
  static metadata = {
    name: 'Bleached Coral & Sea-Glass Pebbles',
    category: 'pebble_rock',
    baseLength: 50,
    baseWidth: 44
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

  _drawCoralBranchPebble(ctx, x, y, rot, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);

    // Bleached porous branch-coral rubble silhouette
    const traceCoral = () => {
      ctx.beginPath();
      ctx.moveTo(-11, 2);
      ctx.bezierCurveTo(-13, -4, -6, -9, -1, -7);
      ctx.bezierCurveTo(2, -11, 10, -10, 11, -4);
      ctx.bezierCurveTo(13, 1, 9, 7, 3, 7);
      ctx.bezierCurveTo(-2, 9, -9, 7, -11, 2);
      ctx.closePath();
    };

    // Soft coastal sand shadow
    ctx.save();
    ctx.translate(1.2, 1.8);
    traceCoral();
    ctx.fillStyle = 'rgba(26, 22, 42, 0.22)';
    ctx.fill();
    ctx.restore();

    // Chalk-white bleached coral fill
    traceCoral();
    const grad = ctx.createRadialGradient(-3, -3, 1, 1, 2, 13);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.6, '#F5F0E6');
    grad.addColorStop(1, '#CFC5B4');
    ctx.fillStyle = grad;
    ctx.fill();

    // Porous coral corallite dimples clipped inside
    ctx.save();
    traceCoral();
    ctx.clip();

    const pores = [
      [-6, -2, 1.3], [-2, -4, 1.1], [4, -5, 1.4], [7, -1, 1.2],
      [2, 2, 1.3], [-4, 3, 1.2], [-8, 2, 1.0], [6, 3, 1.0], [0, -1, 1.1]
    ];
    for (const [px, py, pr] of pores) {
      ctx.fillStyle = '#B8AD9B';
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8C8170';
      ctx.beginPath();
      ctx.arc(px - 0.2, py - 0.2, pr * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chalky top-left rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, -1);
    ctx.quadraticCurveTo(-3, -7, 6, -7);
    ctx.stroke();

    ctx.restore();

    traceCoral();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.65;
    ctx.stroke();

    ctx.restore();
  }

  _drawPinkShellFragment(ctx, x, y, rot, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);

    // Worn scalloped fan-shell fragment
    const traceShell = () => {
      ctx.beginPath();
      ctx.moveTo(-2, 6);
      ctx.lineTo(-9, -1);
      ctx.quadraticCurveTo(-7, -7, -2, -7);
      ctx.quadraticCurveTo(3, -9, 7, -5);
      ctx.quadraticCurveTo(10, -2, 8, 3);
      ctx.lineTo(1, 6);
      ctx.closePath();
    };

    ctx.save();
    ctx.translate(1.1, 1.6);
    traceShell();
    ctx.fillStyle = 'rgba(32, 18, 38, 0.22)';
    ctx.fill();
    ctx.restore();

    traceShell();
    const sGrad = ctx.createLinearGradient(-7, -7, 7, 6);
    sGrad.addColorStop(0, '#FFE4EC');
    sGrad.addColorStop(0.55, '#F9A8C9');
    sGrad.addColorStop(1, '#D66D96');
    ctx.fillStyle = sGrad;
    ctx.fill();

    // Scalloped radial shell ribs
    ctx.save();
    traceShell();
    ctx.clip();

    ctx.strokeStyle = 'rgba(168, 62, 104, 0.45)';
    ctx.lineWidth = 1.0;
    const ribs = [[-6, -4], [-2, -7], [3, -7], [7, -3]];
    for (const [rx, ry] of ribs) {
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }

    // Pearlescent highlight band
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 4, 7.5, -Math.PI * 0.8, -Math.PI * 0.25);
    ctx.stroke();

    ctx.restore();

    traceShell();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }

  _drawSeaGlassChip(ctx, x, y, rx, ry, rot, tintCore, tintEdge) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Translucent sea-glass rounded polygon chip
    const traceGlass = () => {
      ctx.beginPath();
      ctx.moveTo(-rx, -ry * 0.2);
      ctx.quadraticCurveTo(-rx * 0.6, -ry * 1.05, rx * 0.2, -ry * 0.92);
      ctx.quadraticCurveTo(rx * 1.08, -ry * 0.6, rx * 0.92, ry * 0.35);
      ctx.quadraticCurveTo(rx * 0.45, ry * 1.08, -rx * 0.45, ry * 0.88);
      ctx.quadraticCurveTo(-rx * 1.06, ry * 0.5, -rx, -ry * 0.2);
      ctx.closePath();
    };

    // Caustic turquoise-tinted shadow (light refracting through frosted sea glass!)
    ctx.save();
    ctx.translate(1.1, 1.5);
    traceGlass();
    ctx.fillStyle = 'rgba(20, 184, 166, 0.28)';
    ctx.fill();
    ctx.restore();

    // Translucent aqua sea-glass fill
    traceGlass();
    const gGrad = ctx.createRadialGradient(-rx * 0.25, -ry * 0.25, 0.6, rx * 0.1, ry * 0.1, Math.max(rx, ry) * 1.2);
    gGrad.addColorStop(0, tintCore);
    gGrad.addColorStop(0.6, tintEdge);
    gGrad.addColorStop(1, '#0D9488');
    ctx.fillStyle = gGrad;
    ctx.fill();

    // Clipped frosted rim & glossy wet specular gleam
    ctx.save();
    traceGlass();
    ctx.clip();

    // Bright internal refraction bounce along bottom-right edge
    ctx.strokeStyle = 'rgba(204, 251, 241, 0.82)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(rx, ry) * 0.78, 0.15, Math.PI * 0.85);
    ctx.stroke();

    // Glossy wet specular bean
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.28, -ry * 0.26, rx * 0.34, ry * 0.18, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceGlass();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.55;
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

    // Soft coastal sand ambient halo
    const bedGrad = ctx.createRadialGradient(0, 1, 3, 0, 1, 24);
    bedGrad.addColorStop(0, 'rgba(28, 36, 52, 0.22)');
    bedGrad.addColorStop(1, 'rgba(28, 36, 52, 0)');
    ctx.fillStyle = bedGrad;
    ctx.beginPath();
    ctx.ellipse(0, 1, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Bleached porous coral rubble pebbles
    this._drawCoralBranchPebble(ctx, -9.5, -6.5, -0.22, 1.02);
    this._drawCoralBranchPebble(ctx, 11.2, 6.4, 0.45, 0.78);

    // 2. Worn scalloped pink shell fragments
    this._drawPinkShellFragment(ctx, 10.5, -7.8, 0.36, 0.95);
    this._drawPinkShellFragment(ctx, -11.8, 9.6, -0.58, 0.72);

    // 3. Glossy translucent aqua & seafoam sea-glass chips
    this._drawSeaGlassChip(ctx, 0.5, 4.2, 7.2, 5.4, -0.24, '#CCFBF1', '#2DD4BF');
    this._drawSeaGlassChip(ctx, -1.8, -12.5, 5.0, 3.8, 0.42, '#E0F2FE', '#38BDF8');
    this._drawSeaGlassChip(ctx, 15.8, -0.2, 4.4, 3.4, -0.52, '#D1FAE5', '#34D399');

    // Tiny sparkling star glint on central aqua sea-glass chip
    ctx.fillStyle = '#FFFFFF';
    ctx.save();
    ctx.translate(-1.5, 2.5);
    ctx.beginPath();
    ctx.moveTo(0, -2.8);
    ctx.quadraticCurveTo(0.4, -0.4, 2.8, 0);
    ctx.quadraticCurveTo(0.4, 0.4, 0, 2.8);
    ctx.quadraticCurveTo(-0.4, 0.4, -2.8, 0);
    ctx.quadraticCurveTo(-0.4, -0.4, 0, -2.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

export default Coralrubblepebble;
