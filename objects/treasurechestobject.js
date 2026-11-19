/**
 * Overflowing Treasure Chest (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Treasurechestobject {
  static metadata = {
    name: 'Overflowing Treasure Chest',
    category: 'object',
    baseLength: 85,
    baseWidth: 65,
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

    this._drawShadow(ctx);
    this._drawSpilledLoot(ctx);
    this._drawOpenLid(ctx);
    this._drawChestBody(ctx);
    this._drawOverflowingTreasure(ctx);
    this._drawPearlStrands(ctx);
    this._drawPadlock(ctx);
    this._drawSparkles(ctx);

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  _drawShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 8, 0, 4, 44);
    grad.addColorStop(0, 'rgba(14, 18, 36, 0.52)');
    grad.addColorStop(0.68, 'rgba(14, 18, 36, 0.24)');
    grad.addColorStop(1, 'rgba(14, 18, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 5, 42, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpilledLoot(ctx) {
    // Stray doubloons spilled onto the seabed
    const coins = [
      [-34, 16, 4.4], [-26, 24, 4.0], [31, 18, 4.5],
      [22, 25, 3.8], [36, 8, 3.9], [-36, 4, 3.6],
    ];
    for (const [cx, cy, r] of coins) {
      this._drawCoin(ctx, cx, cy, r);
    }
  }

  _drawOpenLid(ctx) {
    ctx.save();
    // Chunky arched wooden lid popped open behind chest (top side in top-down view)
    const lidGrad = ctx.createLinearGradient(0, -30, 0, -10);
    lidGrad.addColorStop(0, '#A66634');
    lidGrad.addColorStop(0.5, '#7F4720');
    lidGrad.addColorStop(1, '#582E12');

    this._roundRect(ctx, -31, -29, 62, 18, 6);
    ctx.fillStyle = lidGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Lid plank seams
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-29, -23);
    ctx.lineTo(29, -23);
    ctx.moveTo(-29, -17);
    ctx.lineTo(29, -17);
    ctx.stroke();

    // Iron straps with rivets on lid
    for (const sx of [-22, 0, 22]) {
      ctx.fillStyle = '#4B566A';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.fillRect(sx - 4, -29, 8, 18);
      ctx.strokeRect(sx - 4, -29, 8, 18);

      // Rivets
      ctx.fillStyle = '#9BA8BC';
      for (const ry of [-25.5, -14.5]) {
        ctx.beginPath();
        ctx.arc(sx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Specular highlight along curved lid top
    ctx.strokeStyle = 'rgba(255, 226, 175, 0.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-25, -26.5);
    ctx.lineTo(25, -26.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawChestBody(ctx) {
    ctx.save();
    // Outer chunky oak frame
    const woodGrad = ctx.createLinearGradient(0, -12, 0, 24);
    woodGrad.addColorStop(0, '#B5743D');
    woodGrad.addColorStop(0.6, '#8B5024');
    woodGrad.addColorStop(1, '#5E3214');

    this._roundRect(ctx, -33, -12, 66, 36, 7);
    ctx.fillStyle = woodGrad;
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Dark recessed interior cavity
    this._roundRect(ctx, -27, -7, 54, 24, 4);
    ctx.fillStyle = '#2B1914';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Iron corner & center bands along front rim
    const ironGrad = ctx.createLinearGradient(0, 14, 0, 24);
    ironGrad.addColorStop(0, '#6B788E');
    ironGrad.addColorStop(1, '#3D4657');

    for (const sx of [-24, 16]) {
      ctx.fillStyle = ironGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.fillRect(sx, 15, 8, 9);
      ctx.strokeRect(sx, 15, 8, 9);

      ctx.fillStyle = '#B7C4D8';
      ctx.beginPath();
      ctx.arc(sx + 4, 19.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side brass carry handles
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#DFAA3E';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 34.5, 5, 3.2, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCoin(ctx, x, y, r) {
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
    grad.addColorStop(0, '#FFF1A6');
    grad.addColorStop(0.55, '#F5BE33');
    grad.addColorStop(1, '#B87412');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner embossed rim
    ctx.strokeStyle = 'rgba(255, 248, 200, 0.65)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawFacetedGem(ctx, x, y, rx, ry, rot, cLight, cMid, cDark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Outer hexagonal / diamond gem silhouette
    const pts = [
      [0, -ry],
      [rx * 0.85, -ry * 0.4],
      [rx * 0.85, ry * 0.4],
      [0, ry],
      [-rx * 0.85, ry * 0.4],
      [-rx * 0.85, -ry * 0.4],
    ];
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();

    const grad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    grad.addColorStop(0, cLight);
    grad.addColorStop(0.5, cMid);
    grad.addColorStop(1, cDark);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Inner table facet
    ctx.fillStyle = cLight;
    ctx.beginPath();
    pts.forEach(([px, py], i) =>
      i === 0 ? ctx.moveTo(px * 0.48, py * 0.48) : ctx.lineTo(px * 0.48, py * 0.48)
    );
    ctx.closePath();
    ctx.fill();

    // Specular glint dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-rx * 0.25, -ry * 0.25, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawOverflowingTreasure(ctx) {
    // Rich golden mound base
    const moundGrad = ctx.createRadialGradient(-4, -2, 4, 0, 4, 28);
    moundGrad.addColorStop(0, '#FFE985');
    moundGrad.addColorStop(0.6, '#EAB02A');
    moundGrad.addColorStop(1, '#A66510');

    ctx.fillStyle = moundGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 4, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Layered stamped gold doubloons
    const coinPositions = [
      [-18, 6, 4.6], [-11, 10, 4.8], [-2, 11, 5.0], [9, 10, 4.7], [18, 7, 4.5],
      [-21, 0, 4.5], [-13, 2, 5.0], [-4, 4, 5.1], [6, 3, 4.9], [16, 1, 4.6],
      [-15, -4, 4.4], [-5, -5, 4.8], [5, -4, 4.7], [14, -5, 4.3],
      [-8, -1, 4.7], [2, 0, 5.0], [11, 5, 4.5],
    ];
    for (const [cx, cy, r] of coinPositions) {
      this._drawCoin(ctx, cx, cy, r);
    }

    // Faceted ruby, emerald, and sapphire gems nestled in gold
    this._drawFacetedGem(ctx, -11, -1, 6.2, 5.2, -0.3, '#FF8AA8', '#E62452', '#8C0B2C'); // Ruby
    this._drawFacetedGem(ctx, 11, -1, 6.0, 5.0, 0.35, '#86FFBE', '#1BB868', '#0D6A3B'); // Emerald
    this._drawFacetedGem(ctx, 0, 6, 5.8, 4.8, 0.1, '#92D5FF', '#2878F0', '#123D8A'); // Sapphire
  }

  _drawPearlStrands(ctx) {
    // Lustrous pearl necklace draped over the front-right rim
    const pearls = [
      [15, 7], [19, 11], [23, 15], [25, 20], [21, 23], [16, 22],
    ];
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const [px, py] of pearls) {
      const pGrad = ctx.createRadialGradient(px - 1, py - 1, 0.4, px, py, 3);
      pGrad.addColorStop(0, '#FFFFFF');
      pGrad.addColorStop(0.6, '#F4ECF8');
      pGrad.addColorStop(1, '#BFAEC9');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  _drawPadlock(ctx) {
    ctx.save();
    // Chunky brass lockplate & padlock hanging off front lip
    const grad = ctx.createLinearGradient(-7, 14, 7, 28);
    grad.addColorStop(0, '#FFE47D');
    grad.addColorStop(0.55, '#E4A82B');
    grad.addColorStop(1, '#9E6610');

    // Lock hasp
    this._roundRect(ctx, -6, 14, 12, 13, 3.5);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(0, 19.2, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.1, 20);
    ctx.lineTo(1.1, 20);
    ctx.lineTo(1.6, 24.2);
    ctx.lineTo(-1.6, 24.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawSparkles(ctx) {
    const drawStar = (x, y, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(255, 230, 120, 0.85)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? s : s * 0.28;
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

    drawStar(-15, -8, 6);
    drawStar(16, -6, 5);
    drawStar(-2, 12, 4.5);
  }
}

export default Treasurechestobject;
