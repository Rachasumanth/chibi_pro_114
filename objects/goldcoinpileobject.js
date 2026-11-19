/**
 * Glittering Doubloon Coin Heap (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Goldcoinpileobject {
  static metadata = {
    name: 'Glittering Doubloon Coin Heap',
    category: 'object',
    baseLength: 75,
    baseWidth: 70,
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
    this._drawMoundUnderlayer(ctx);
    this._drawTieredDoubloons(ctx);
    this._drawStarSparkles(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 3, 8, 0, 3, 38);
    grad.addColorStop(0, 'rgba(20, 14, 34, 0.52)');
    grad.addColorStop(0.7, 'rgba(20, 14, 34, 0.22)');
    grad.addColorStop(1, 'rgba(20, 14, 34, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 36, 33, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawMoundUnderlayer(ctx) {
    // Rich warm metallic gold base fill so there are no hollow gaps between coins
    const grad = ctx.createRadialGradient(-4, -5, 4, 0, 0, 30);
    grad.addColorStop(0, '#F6C53B');
    grad.addColorStop(0.65, '#C98318');
    grad.addColorStop(1, '#854B08');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 1, 29, 25, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  _drawDoubloon(ctx, x, y, r, tier, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Subtle drop shadow for upper-tier coins to convey mound height
    if (tier > 0) {
      ctx.fillStyle = 'rgba(42, 22, 8, 0.34)';
      ctx.beginPath();
      ctx.arc(1.1, 1.5, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.32, 0.5, 0, 0, r);
    if (tier === 2) {
      grad.addColorStop(0, '#FFFAC2');
      grad.addColorStop(0.48, '#FFD347');
      grad.addColorStop(1, '#C98414');
    } else if (tier === 1) {
      grad.addColorStop(0, '#FFF1A0');
      grad.addColorStop(0.52, '#F2BA2E');
      grad.addColorStop(1, '#B57010');
    } else {
      grad.addColorStop(0, '#F5D678');
      grad.addColorStop(0.55, '#D69820');
      grad.addColorStop(1, '#94570B');
    }

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Embossed inner coin rim
    ctx.strokeStyle = tier === 2 ? 'rgba(255, 252, 224, 0.85)' : 'rgba(255, 240, 180, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    // Tiny stamped emblem cross/crown inside coin
    ctx.strokeStyle = 'rgba(138, 80, 12, 0.55)';
    ctx.lineWidth = 1;
    const s = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.stroke();

    // Crisp specular arc on top-left edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, -2.5, -1.3);
    ctx.stroke();

    ctx.restore();
  }

  _drawTieredDoubloons(ctx) {
    // Tier 0: scattered outer perimeter & base coins
    const tier0 = [
      [-30, 8, 5.2, 0.2], [-27, -12, 5.0, -0.3], [-16, -24, 5.4, 0.4],
      [4, -26, 5.2, 0.1], [23, -21, 5.1, -0.5], [31, -4, 5.3, 0.3],
      [28, 14, 5.0, 0.6], [14, 25, 5.4, -0.2], [-8, 26, 5.2, 0.5],
      [-23, 21, 4.9, -0.4], [33, -15, 4.3, 0.2], [-32, -3, 4.2, 0.7],
      [2, 30, 4.4, 0.1],
    ];
    for (const [x, y, r, rot] of tier0) {
      this._drawDoubloon(ctx, x, y, r, 0, rot);
    }

    // Tier 1: middle sloped ring of overlapping doubloons
    const tier1 = [
      [-19, 3, 5.8, 0.3], [-16, -11, 5.7, -0.2], [-4, -18, 5.9, 0.5],
      [11, -15, 5.8, -0.4], [20, -4, 5.7, 0.2], [17, 10, 5.8, 0.6],
      [5, 18, 5.9, -0.1], [-10, 17, 5.7, 0.4],
    ];
    for (const [x, y, r, rot] of tier1) {
      this._drawDoubloon(ctx, x, y, r, 1, rot);
    }

    // Tier 2: bright gleaming apex coins at the peak of the heap
    const tier2 = [
      [-8, -4, 6.2, -0.3], [7, -6, 6.1, 0.4], [9, 6, 6.0, -0.2],
      [-6, 8, 6.1, 0.5], [0, 0, 6.5, 0.15],
    ];
    for (const [x, y, r, rot] of tier2) {
      this._drawDoubloon(ctx, x, y, r, 2, rot);
    }
  }

  _drawStarSparkles(ctx) {
    const drawStar = (x, y, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(255, 224, 102, 0.9)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? s : s * 0.26;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawStar(-3, -3, 7.2);
    drawStar(16, -12, 5.4);
    drawStar(-18, 12, 4.8);
    drawStar(11, 16, 4.4);
  }
}

export default Goldcoinpileobject;
