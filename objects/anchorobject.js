/**
 * Rusted Iron Ship Anchor (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Anchorobject {
  static metadata = {
    name: 'Rusted Iron Ship Anchor',
    category: 'object',
    baseLength: 110,
    baseWidth: 90,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(name) {}
  update(dt) {}

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(name, callback) {}

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this._drawAmbientShadow(ctx);
    this._drawBraidedRopeCoil(ctx);
    this._drawShackleRing(ctx);
    this._drawAnchorBody(ctx);
    this._drawStockCrossbar(ctx);
    this._drawRustPatina(ctx);
    this._drawSandDrift(ctx);
    this._drawBarnacles(ctx);
    this._drawHighlights(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(-2, 4, 8, 0, 4, 54);
    grad.addColorStop(0, 'rgba(12, 18, 36, 0.52)');
    grad.addColorStop(0.68, 'rgba(12, 18, 36, 0.22)');
    grad.addColorStop(1, 'rgba(12, 18, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 5, 52, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBraidedRopeCoil(ctx) {
    ctx.save();
    // Coiled braided hemp rope nestled beside the upper shank
    const cx = -31;
    const cy = 22;

    // Shadow under rope coil
    ctx.fillStyle = 'rgba(16, 14, 30, 0.36)';
    ctx.beginPath();
    ctx.ellipse(cx + 1.5, cy + 2.5, 16, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Trailing rope line linking coil to shackle ring
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7.2;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.bezierCurveTo(-48, 8, -46, 18, cx - 8, cy);
    ctx.stroke();

    ctx.strokeStyle = '#CFA262';
    ctx.lineWidth = 3.8;
    ctx.stroke();

    // Concentric braided rings
    for (const r of [14, 9.5, 5.2]) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = r === 9.5 ? '#DDB576' : '#C99C5C';
      ctx.lineWidth = 3.4;
      ctx.stroke();

      // Braided strand twist ticks
      const steps = Math.round(r * 1.4);
      ctx.strokeStyle = 'rgba(84, 52, 22, 0.65)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (r - 1.6);
        const y1 = cy + Math.sin(a) * (r - 1.6);
        const x2 = cx + Math.cos(a + 0.2) * (r + 1.6);
        const y2 = cy + Math.sin(a + 0.2) * (r + 1.6);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawShackleRing(ctx) {
    ctx.save();
    // Chunky forged iron ring at top of shank (left side along -X)
    const rx = -39;
    const ry = 0;

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(rx, ry, 10.5, 0, Math.PI * 2);
    ctx.stroke();

    const grad = ctx.createLinearGradient(rx - 10, ry - 10, rx + 10, ry + 10);
    grad.addColorStop(0, '#808DA3');
    grad.addColorStop(0.5, '#4F5A6E');
    grad.addColorStop(1, '#2F3746');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5.4;
    ctx.stroke();

    // Specular rim arc
    ctx.strokeStyle = 'rgba(218, 232, 250, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(rx, ry, 10.5, -2.5, -1.0);
    ctx.stroke();
    ctx.restore();
  }

  _drawAnchorBody(ctx) {
    ctx.save();
    const ironGrad = ctx.createLinearGradient(-32, -36, 46, 36);
    ironGrad.addColorStop(0, '#727F96');
    ironGrad.addColorStop(0.42, '#4C5669');
    ironGrad.addColorStop(0.8, '#363E4E');
    ironGrad.addColorStop(1, '#262C38');

    // Main curved arms (crown & twin arms)
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 15.5;
    ctx.beginPath();
    ctx.moveTo(14, -33);
    ctx.bezierCurveTo(36, -30, 44, -15, 44, 0);
    ctx.bezierCurveTo(44, 15, 36, 30, 14, 33);
    ctx.stroke();

    ctx.strokeStyle = ironGrad;
    ctx.lineWidth = 10.2;
    ctx.stroke();

    // Central chunky tapered shank
    ctx.fillStyle = ironGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-30, -5.5);
    ctx.lineTo(42, -7.8);
    ctx.quadraticCurveTo(50, 0, 42, 7.8);
    ctx.lineTo(-30, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Barbed triangular flukes (top & bottom)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(12, side * 32);
      ctx.rotate(side * 0.25);

      const flukeGrad = ctx.createLinearGradient(-12, -10, 12, 10);
      flukeGrad.addColorStop(0, '#7B889E');
      flukeGrad.addColorStop(0.55, '#4A5468');
      flukeGrad.addColorStop(1, '#2D3442');

      ctx.fillStyle = flukeGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(7, side * -10);
      ctx.lineTo(11, 0);
      ctx.lineTo(7, side * 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center ridge bevel on fluke
      ctx.strokeStyle = 'rgba(205, 220, 240, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Crown reinforcement boss & rivet
    ctx.fillStyle = '#5D697E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(41, 0, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9BA8BF';
    ctx.beginPath();
    ctx.arc(40, -1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawStockCrossbar(ctx) {
    ctx.save();
    // Chunky timber-and-iron anchor stock crossbar near the top of the shank
    const x = -22;
    const grad = ctx.createLinearGradient(x - 6, -26, x + 6, 26);
    grad.addColorStop(0, '#A66D3D');
    grad.addColorStop(0.5, '#7E4D27');
    grad.addColorStop(1, '#553015');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - 5, -24);
    ctx.quadraticCurveTo(x, -27, x + 5, -24);
    ctx.lineTo(x + 6, 24);
    ctx.quadraticCurveTo(x, 27, x - 6, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron clamping bands & rivets
    ctx.fillStyle = '#4B5568';
    ctx.lineWidth = 1.8;
    for (const by of [-17, -4, 13]) {
      ctx.fillRect(x - 5.8, by, 11.6, 5);
      ctx.strokeRect(x - 5.8, by, 11.6, 5);
      ctx.fillStyle = '#9DA9BE';
      ctx.beginPath();
      ctx.arc(x, by + 2.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4B5568';
    }
    ctx.restore();
  }

  _drawRustPatina(ctx) {
    // Warm orange-brown rust patina blotches across forged iron
    const rustPatches = [
      { x: 10, y: -3, rx: 10, ry: 4.5, rot: 0.2 },
      { x: 38, y: -14, rx: 6.5, ry: 4, rot: 0.7 },
      { x: 24, y: -30, rx: 6, ry: 3.5, rot: -0.3 },
      { x: -6, y: 2.5, rx: 7, ry: 3.2, rot: -0.1 },
      { x: -41, y: -8, rx: 4, ry: 2.8, rot: 0.5 },
    ];
    for (const p of rustPatches) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(196, 92, 34, 0.78)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(235, 136, 56, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-p.rx * 0.25, -p.ry * 0.2, p.rx * 0.5, p.ry * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawSandDrift(ctx) {
    ctx.save();
    // Half-buried soft golden seabed sand drift covering bottom-right fluke
    const grad = ctx.createRadialGradient(16, 30, 4, 22, 30, 26);
    grad.addColorStop(0, '#F5DFAF');
    grad.addColorStop(0.65, '#DAB67A');
    grad.addColorStop(1, '#B88D52');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(2, 38);
    ctx.bezierCurveTo(6, 22, 24, 18, 40, 24);
    ctx.bezierCurveTo(49, 28, 48, 38, 36, 41);
    ctx.bezierCurveTo(22, 44, 6, 43, 2, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sand ripple contour
    ctx.strokeStyle = 'rgba(145, 102, 50, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, 35);
    ctx.quadraticCurveTo(25, 30, 38, 34);
    ctx.stroke();
    ctx.restore();
  }

  _drawBarnacles(ctx) {
    const barnacles = [
      [33, 10, 4.2], [38, 14, 3.2], [29, 14, 2.7],
      [-10, -6, 3.6], [-5, -7, 2.6],
      [18, -26, 3.4], [22, -23, 2.5],
    ];
    for (const [bx, by, r] of barnacles) {
      ctx.fillStyle = '#E5DAC4';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4B3E4D';
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawHighlights(ctx) {
    // Crisp cel specular line on iron shank
    ctx.strokeStyle = 'rgba(220, 234, 252, 0.52)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -3.5);
    ctx.lineTo(26, -4.5);
    ctx.stroke();
  }
}

export default Anchorobject;
