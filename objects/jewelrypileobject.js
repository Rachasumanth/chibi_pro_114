/**
 * Royal Jewelry & Crown Hoard (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Jewelrypileobject {
  static metadata = {
    name: 'Royal Jewelry & Crown Hoard',
    category: 'object',
    baseLength: 70,
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
    this._drawSapphireNecklace(ctx);
    this._drawEmeraldSignetRings(ctx);
    this._drawRubyBrooch(ctx);
    this._drawRoyalCrown(ctx);
    this._drawStarGlints(ctx);

    ctx.restore();
  }

  _drawShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 3, 6, 0, 3, 35);
    grad.addColorStop(0, 'rgba(16, 14, 36, 0.48)');
    grad.addColorStop(0.7, 'rgba(16, 14, 36, 0.22)');
    grad.addColorStop(1, 'rgba(16, 14, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 3, 34, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSapphireNecklace(ctx) {
    ctx.save();
    // Graceful loop of beaded sapphire & gold necklace around left & bottom
    const pts = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * Math.PI * 1.45 + 1.1;
      const px = -5 + Math.cos(t) * 24;
      const py = 5 + Math.sin(t) * 21;
      pts.push([px, py]);
    }

    // Gold chain thread
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();

    ctx.strokeStyle = '#F0BE42';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Alternating lustrous gold beads & deep sapphires
    pts.forEach(([x, y], i) => {
      const isSapphire = i % 2 === 0;
      const r = isSapphire ? 3.4 : 2.3;
      const grad = ctx.createRadialGradient(x - 1, y - 1, 0.3, x, y, r);
      if (isSapphire) {
        grad.addColorStop(0, '#9BE0FF');
        grad.addColorStop(0.55, '#256FE8');
        grad.addColorStop(1, '#102F78');
      } else {
        grad.addColorStop(0, '#FFF2A6');
        grad.addColorStop(0.6, '#E8AE2A');
        grad.addColorStop(1, '#9E630D');
      }
      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Teardrop sapphire pendant at bottom
    const px = -14;
    const py = 23;
    ctx.fillStyle = '#F2C144';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(px, py, 5.2, 6.2, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const sGrad = ctx.createRadialGradient(px - 1.2, py - 1.5, 0.5, px, py, 4.2);
    sGrad.addColorStop(0, '#B0EAFF');
    sGrad.addColorStop(0.5, '#216CE6');
    sGrad.addColorStop(1, '#0F2E75');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(px, py, 3.4, 4.3, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEmeraldSignetRings(ctx) {
    const drawRing = (x, y, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);

      // Gold band
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#F5C443';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Inner band highlight
      ctx.strokeStyle = '#FFF0A8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 7.2, -2.2, -0.8);
      ctx.stroke();

      // Square-cut emerald signet bezel
      ctx.fillStyle = '#E5AA27';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.fillRect(-4.2, -10.5, 8.4, 6.6);
      ctx.strokeRect(-4.2, -10.5, 8.4, 6.6);

      const eGrad = ctx.createLinearGradient(-3, -10, 3, -5);
      eGrad.addColorStop(0, '#9AFFC8');
      eGrad.addColorStop(0.5, '#19B867');
      eGrad.addColorStop(1, '#0B6336');
      ctx.fillStyle = eGrad;
      ctx.fillRect(-2.8, -9.2, 5.6, 4.2);

      // Gem glint
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-1.2, -8, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawRing(18, 17, 0.55);
    drawRing(24, 2, 1.35);
  }

  _drawRubyBrooch(ctx) {
    ctx.save();
    ctx.translate(-21, -13);
    ctx.rotate(-0.4);

    // Ornate scalloped gold bezel
    ctx.fillStyle = '#F2BF3C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const petals = 8;
    for (let i = 0; i < petals * 2; i++) {
      const a = (i * Math.PI) / petals;
      const r = i % 2 === 0 ? 10.5 : 8.2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Faceted oval ruby center
    const rGrad = ctx.createRadialGradient(-2, -2, 0.6, 0, 0, 6.5);
    rGrad.addColorStop(0, '#FF9AB3');
    rGrad.addColorStop(0.45, '#E41E4F');
    rGrad.addColorStop(1, '#7D0926');
    ctx.fillStyle = rGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.2, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner facet diamond + specular
    ctx.fillStyle = 'rgba(255, 200, 215, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(3.2, 0);
    ctx.lineTo(0, 3);
    ctx.lineTo(-3.2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-1.8, -1.6, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawRoyalCrown(ctx) {
    ctx.save();
    ctx.translate(3, -5);

    // Shadow under crown
    ctx.fillStyle = 'rgba(18, 12, 32, 0.38)';
    ctx.beginPath();
    ctx.arc(1.5, 2.5, 19.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer jeweled golden crown rim (chunky chibi top-down ring)
    const rimGrad = ctx.createRadialGradient(-5, -6, 4, 0, 0, 20);
    rimGrad.addColorStop(0, '#FFF29C');
    rimGrad.addColorStop(0.55, '#F2BA32');
    rimGrad.addColorStop(1, '#B37110');

    ctx.fillStyle = rimGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 18.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Plush royal crimson velvet cap interior
    const velvetGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 13.5);
    velvetGrad.addColorStop(0, '#D92B52');
    velvetGrad.addColorStop(0.65, '#991538');
    velvetGrad.addColorStop(1, '#590820');

    ctx.fillStyle = velvetGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crossed golden crown arches over velvet
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 13);
    ctx.stroke();

    ctx.strokeStyle = '#FAD055';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 8 crown rim pearls / fleur-de-lis tips & embedded gems
    const gemColors = ['#FF3B6B', '#2782F5', '#21C973', '#FF3B6B', '#2782F5', '#21C973', '#FF3B6B', '#2782F5'];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const gx = Math.cos(a) * 15.8;
      const gy = Math.sin(a) * 15.8;

      // Little golden crown prong
      const px = Math.cos(a) * 19.6;
      const py = Math.sin(a) * 19.6;
      ctx.fillStyle = '#FFE680';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rim jewel
      ctx.fillStyle = gemColors[i];
      ctx.beginPath();
      ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Center golden orb finial
    const orbGrad = ctx.createRadialGradient(-1.5, -1.5, 0.5, 0, 0, 5.2);
    orbGrad.addColorStop(0, '#FFF8C4');
    orbGrad.addColorStop(0.55, '#F5BE32');
    orbGrad.addColorStop(1, '#A6670C');
    ctx.fillStyle = orbGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawStarGlints(ctx) {
    const drawStar = (x, y, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(255, 224, 120, 0.85)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? s : s * 0.27;
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

    drawStar(14, -18, 6.2);
    drawStar(-25, -18, 5.0);
    drawStar(22, 14, 4.8);
    drawStar(-15, 22, 4.2);
  }
}

export default Jewelrypileobject;
