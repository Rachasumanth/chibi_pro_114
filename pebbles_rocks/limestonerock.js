/**
 * Pitted Karst Limestone — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 105x92px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Limestonerock {
  static metadata = {
    name: 'Pitted Karst Limestone',
    category: 'pebble_rock',
    baseLength: 105,
    baseWidth: 92
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

  _traceKarstSilhouette(ctx) {
    ctx.beginPath();
    ctx.moveTo(-46, -4);
    ctx.bezierCurveTo(-48, -26, -28, -42, -2, -42);
    ctx.bezierCurveTo(26, -42, 47, -26, 48, -2);
    ctx.bezierCurveTo(49, 22, 32, 41, 4, 42);
    ctx.bezierCurveTo(-24, 43, -44, 24, -46, -4);
    ctx.closePath();
  }

  _drawTidePool(ctx, cx, cy, rx, ry, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // 1. Sunlit eroded chalk rim bevel (outer halo)
    ctx.fillStyle = 'rgba(255, 253, 244, 0.72)';
    ctx.beginPath();
    ctx.ellipse(0.6, 0.8, rx + 2.4, ry + 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concave limestone pit wall (shadowed top-left rim, sunlit bottom-right wall)
    ctx.beginPath();
    ctx.ellipse(0, 0, rx + 1.0, ry + 1.0, 0, 0, Math.PI * 2);
    const wallGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    wallGrad.addColorStop(0, '#8E8473');
    wallGrad.addColorStop(0.55, '#BDB39E');
    wallGrad.addColorStop(1, '#F3ECDC');
    ctx.fillStyle = wallGrad;
    ctx.fill();

    // 3. Recessed turquoise tide-pool water basin
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0.4, 0.6, rx * 0.84, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.clip();

    const waterGrad = ctx.createRadialGradient(
      rx * 0.12, ry * 0.14, rx * 0.12,
      0, 0, Math.max(rx, ry)
    );
    waterGrad.addColorStop(0, '#5EEAD4');
    waterGrad.addColorStop(0.58, '#14B8A6');
    waterGrad.addColorStop(1, '#0F766E');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

    // Inner recessed rim shadow cast onto upper-left water surface
    ctx.strokeStyle = 'rgba(14, 58, 66, 0.48)';
    ctx.lineWidth = Math.max(2.2, ry * 0.34);
    ctx.beginPath();
    ctx.ellipse(0.8, 1.0, rx * 0.86, ry * 0.84, 0, Math.PI * 0.92, Math.PI * 1.98);
    ctx.stroke();

    // Concentric gentle water ripple ring
    ctx.strokeStyle = 'rgba(204, 251, 241, 0.50)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(0.6, 0.8, rx * 0.48, ry * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp white specular water glints
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.24, -ry * 0.20, rx * 0.24, ry * 0.13, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx * 0.22, ry * 0.22, Math.max(0.9, rx * 0.09), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end pool clip

    // Crisp karst pit rim outline
    ctx.strokeStyle = '#4B4138';
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx + 0.8, ry + 0.8, 0, 0, Math.PI * 2);
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

    // Layered ground shadow
    ctx.save();
    ctx.translate(4, 5.5);
    this._traceKarstSilhouette(ctx);
    ctx.fillStyle = 'rgba(24, 20, 38, 0.20)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(1.8, 2.6);
    this._traceKarstSilhouette(ctx);
    ctx.fillStyle = 'rgba(20, 16, 34, 0.28)';
    ctx.fill();
    ctx.restore();

    // Pale cream-ivory karst limestone base
    this._traceKarstSilhouette(ctx);
    const bodyGrad = ctx.createRadialGradient(-16, -18, 6, 4, 6, 56);
    bodyGrad.addColorStop(0, '#FFFDF7');
    bodyGrad.addColorStop(0.55, '#EFE7D4');
    bodyGrad.addColorStop(1, '#C7BBA3');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped karst erosion texture, cel shading & porous pits
    ctx.save();
    this._traceKarstSilhouette(ctx);
    ctx.clip();

    // Soft underside cel-shading crescent
    ctx.fillStyle = 'rgba(116, 102, 84, 0.26)';
    ctx.beginPath();
    ctx.ellipse(14, 18, 48, 38, 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Eroded limestone shelf contour lines
    ctx.strokeStyle = 'rgba(164, 150, 128, 0.42)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-42, -16);
    ctx.bezierCurveTo(-18, -28, 12, -26, 40, -14);
    ctx.moveTo(-38, 18);
    ctx.bezierCurveTo(-10, 32, 20, 30, 42, 14);
    ctx.stroke();

    // Sunlit ivory top-left crown highlight
    ctx.fillStyle = 'rgba(255, 255, 252, 0.48)';
    ctx.beginPath();
    ctx.ellipse(-18, -18, 22, 14, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Small dry porous karst micro-pits (dimples with upper shadow + lower rim light)
    const dryPits = [
      [-30, -16, 2.8], [-24, 16, 3.2], [28, -16, 2.6], [34, 8, 2.9],
      [-4, 28, 3.0], [18, 26, 2.4], [-34, 4, 2.2], [6, -28, 2.5],
      [30, -4, 1.9], [-12, -30, 2.1], [22, 14, 2.0]
    ];
    for (const [px, py, pr] of dryPits) {
      ctx.fillStyle = 'rgba(255, 253, 246, 0.72)';
      ctx.beginPath();
      ctx.arc(px + 0.6, py + 0.7, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#A89B84';
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#756A58';
      ctx.beginPath();
      ctx.arc(px - 0.3, py - 0.3, pr * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle karst hairline dissolution cracks connecting pools
    ctx.strokeStyle = 'rgba(92, 80, 68, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(4, 2);
    ctx.lineTo(12, 8);
    ctx.moveTo(12, -12);
    ctx.lineTo(22, -16);
    ctx.stroke();

    ctx.restore(); // end limestone clip

    // Smooth circular turquoise tide-pool indentations
    this._drawTidePool(ctx, -13, -6, 13.5, 11.2, -0.18);
    this._drawTidePool(ctx, 15, 7, 11.0, 9.2, 0.22);
    this._drawTidePool(ctx, 12, -17, 7.6, 6.4, -0.12);
    this._drawTidePool(ctx, -12, 19, 6.4, 5.4, 0.30);

    // Bold expressive chibi outline (#1E142B)
    this._traceKarstSilhouette(ctx);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.7;
    ctx.stroke();

    ctx.restore();
  }
}

export default Limestonerock;
