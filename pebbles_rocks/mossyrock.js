/**
 * Moss-Covered River Rock — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 110x95px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Mossyrock {
  static metadata = {
    name: 'Moss-Covered River Rock',
    category: 'pebble_rock',
    baseLength: 110,
    baseWidth: 95
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

  _traceBoulder(ctx) {
    ctx.beginPath();
    ctx.moveTo(-48, 2);
    ctx.bezierCurveTo(-51, -24, -32, -43, -4, -44);
    ctx.bezierCurveTo(26, -45, 49, -28, 51, -2);
    ctx.bezierCurveTo(53, 24, 34, 43, 4, 44);
    ctx.bezierCurveTo(-28, 45, -45, 28, -48, 2);
    ctx.closePath();
  }

  _traceScallopedMoss(ctx, lobes) {
    ctx.beginPath();
    for (let i = 0; i < lobes.length; i++) {
      const [cx, cy, r] = lobes[i];
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }

  _drawClover(ctx, cx, cy, size, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Soft leaf shadow
    ctx.fillStyle = 'rgba(18, 48, 28, 0.35)';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size * 0.55 + 0.6, Math.sin(a) * size * 0.55 + 0.8, size * 0.56, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 plush heart-like clover leaves
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(size * 0.4, -size * 0.72, size * 1.15, -size * 0.55, size * 1.05, 0);
      ctx.bezierCurveTo(size * 1.15, size * 0.55, size * 0.4, size * 0.72, 0, 0);
      ctx.closePath();
      ctx.fillStyle = i === 0 ? '#A3E635' : '#84CC16';
      ctx.fill();
      ctx.strokeStyle = '#1E3A24';
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // Tiny pale leaf vein
      ctx.strokeStyle = 'rgba(236, 253, 185, 0.75)';
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(size * 0.15, 0);
      ctx.lineTo(size * 0.68, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Center stem dot
    ctx.fillStyle = '#D9F99D';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawDewdrop(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(16, 38, 28, 0.30)';
    ctx.beginPath();
    ctx.ellipse(x + r * 0.25, y + r * 0.35, r * 1.05, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, 'rgba(240, 253, 255, 0.95)');
    grad.addColorStop(0.55, 'rgba(147, 232, 245, 0.72)');
    grad.addColorStop(1, 'rgba(46, 134, 148, 0.62)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - r * 0.34, y - r * 0.34, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Ground cast shadow & damp river contact AO
    ctx.save();
    ctx.translate(4, 6);
    this._traceBoulder(ctx);
    ctx.fillStyle = 'rgba(18, 16, 34, 0.24)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(1.8, 2.8);
    this._traceBoulder(ctx);
    ctx.fillStyle = 'rgba(16, 14, 30, 0.32)';
    ctx.fill();
    ctx.restore();

    // Rounded dark-grey river boulder base
    this._traceBoulder(ctx);
    const rockGrad = ctx.createRadialGradient(-16, -18, 6, 4, 6, 56);
    rockGrad.addColorStop(0, '#788496');
    rockGrad.addColorStop(0.55, '#525E70');
    rockGrad.addColorStop(1, '#333C4B');
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // Clipped river boulder shading & exposed stone texture
    ctx.save();
    this._traceBoulder(ctx);
    ctx.clip();

    // Cel-shaded underside shadow band
    ctx.fillStyle = 'rgba(20, 22, 38, 0.34)';
    ctx.beginPath();
    ctx.ellipse(12, 18, 52, 40, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Cool turquoise-slate river water bounce rim along bottom-right
    ctx.strokeStyle = 'rgba(128, 178, 194, 0.35)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 2, 42, 0.25, Math.PI * 0.82);
    ctx.stroke();

    // Exposed stone weathered crack & wet sheen on lower-right rock face
    ctx.strokeStyle = '#212736';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.lineTo(26, 20);
    ctx.lineTo(38, 16);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(205, 220, 236, 0.32)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(13, 10.5);
    ctx.lineTo(25, 18.5);
    ctx.lineTo(37, 14.5);
    ctx.stroke();

    // Wet specular glint on exposed stone shoulder
    ctx.fillStyle = 'rgba(226, 240, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(29, 8, 9, 4.2, 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Tiny stone pits & dark river speckles on exposed rock
    const stoneSpecks = [
      [24, 24, 1.5], [34, 12, 1.2], [12, 30, 1.6], [38, 2, 1.3],
      [-26, 28, 1.4], [-10, 34, 1.5], [22, -26, 1.2]
    ];
    ctx.fillStyle = 'rgba(24, 28, 42, 0.45)';
    for (const [sx, sy, sr] of stoneSpecks) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end boulder clip

    // Bold boulder outline (#1E142B)
    this._traceBoulder(ctx);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // --- PLUSH SCALLOPED MOSS CUSHIONS (drawn over boulder so cushions puff slightly) ---
    const mainMossLobes = [
      [-24, -18, 15], [-8, -24, 16], [10, -20, 14], [22, -10, 12],
      [-32, -2, 14], [-14, -4, 17], [4, -4, 16], [16, 4, 11],
      [-24, 12, 13], [-6, 14, 14], [6, 14, 10]
    ];

    // Secondary smaller moss patch on lower-right rim
    const sideMossLobes = [
      [26, 20, 9.5], [35, 16, 7.5], [30, 27, 7.2]
    ];

    const renderMossCushion = (lobes, gradCenter, gradRadius) => {
      // Cushion cast shadow onto the stone
      ctx.save();
      ctx.translate(2.2, 3.2);
      this._traceScallopedMoss(ctx, lobes);
      ctx.fillStyle = 'rgba(18, 22, 34, 0.42)';
      ctx.fill();
      ctx.restore();

      // Dark forest-emerald border stroke (simulated via expanded silhouette for clean scalloped union)
      ctx.save();
      ctx.beginPath();
      for (const [cx, cy, r] of lobes) {
        ctx.moveTo(cx + r + 2.1, cy);
        ctx.arc(cx, cy, r + 2.1, 0, Math.PI * 2);
      }
      ctx.fillStyle = '#1E142B';
      ctx.fill();

      // Deep emerald base fill
      this._traceScallopedMoss(ctx, lobes);
      const mGrad = ctx.createRadialGradient(
        gradCenter[0] - gradRadius * 0.28,
        gradCenter[1] - gradRadius * 0.30,
        gradRadius * 0.12,
        gradCenter[0],
        gradCenter[1],
        gradRadius
      );
      mGrad.addColorStop(0, '#84CC16');
      mGrad.addColorStop(0.5, '#34A853');
      mGrad.addColorStop(1, '#166534');
      ctx.fillStyle = mGrad;
      ctx.fill();

      // Plush sunlit lime-green puffs inside each cushion
      ctx.save();
      this._traceScallopedMoss(ctx, lobes);
      ctx.clip();

      for (const [cx, cy, r] of lobes) {
        ctx.fillStyle = 'rgba(163, 230, 53, 0.36)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.22, cy - r * 0.24, r * 0.62, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(217, 249, 157, 0.34)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.34, cy - r * 0.34, r * 0.30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Velvety moss micro-tuft stipples
      for (let i = 0; i < lobes.length; i++) {
        const [cx, cy, r] = lobes[i];
        ctx.fillStyle = 'rgba(20, 83, 45, 0.38)';
        ctx.beginPath();
        ctx.arc(cx + r * 0.28, cy + r * 0.32, 1.5, 0, Math.PI * 2);
        ctx.arc(cx - r * 0.12, cy + r * 0.42, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(236, 253, 185, 0.52)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.18, cy - r * 0.18, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    };

    renderMossCushion(mainMossLobes, [-8, -6], 42);
    renderMossCushion(sideMossLobes, [30, 21], 16);

    // Cute clover tufts nestled in the plush moss
    this._drawClover(ctx, -18, -14, 5.2, 0.25);
    this._drawClover(ctx, 8, -12, 4.6, -0.55);
    this._drawClover(ctx, -10, 10, 4.4, 0.95);
    this._drawClover(ctx, 29, 21, 3.6, -0.2);

    // Sparkling morning dewdrops resting on moss & boulder
    this._drawDewdrop(ctx, -28, -4, 2.3);
    this._drawDewdrop(ctx, -2, -24, 2.0);
    this._drawDewdrop(ctx, 16, -2, 1.8);
    this._drawDewdrop(ctx, -20, 14, 1.7);
    this._drawDewdrop(ctx, 34, 15, 1.5);

    ctx.restore();
  }
}

export default Mossyrock;
