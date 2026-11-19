/**
 * Seabed Silt & Dust Mound (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Dustcloudobject {
  static metadata = {
    name: 'Seabed Silt & Dust Mound',
    category: 'object',
    baseLength: 95,
    baseWidth: 85,
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
    this._drawOuterSiltHalo(ctx);
    this._drawCartoonDustPuffs(ctx);
    this._drawSwirlLines(ctx);
    this._drawEmbeddedPebbles(ctx);
    this._drawSedimentGrains(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 10, 0, 4, 47);
    grad.addColorStop(0, 'rgba(54, 40, 26, 0.42)');
    grad.addColorStop(0.68, 'rgba(54, 40, 26, 0.18)');
    grad.addColorStop(1, 'rgba(54, 40, 26, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 46, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawOuterSiltHalo(ctx) {
    // Soft diffusing silt cloud aura
    const grad = ctx.createRadialGradient(-4, -3, 8, 0, 0, 44);
    grad.addColorStop(0, 'rgba(240, 219, 174, 0.72)');
    grad.addColorStop(0.6, 'rgba(216, 182, 128, 0.42)');
    grad.addColorStop(1, 'rgba(196, 158, 102, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 38, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCartoonDustPuffs(ctx) {
    // Outer chunky cloud lobes (base layer - warm ochre)
    const outerPuffs = [
      [-22, 8, 16.5], [-16, -15, 16], [8, -19, 17],
      [25, -4, 15.5], [18, 16, 16.5], [-3, 20, 15.5],
    ];

    // Draw united dark-espresso outline first by stroking all lobes, then filling
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.6;
    for (const [px, py, r] of outerPuffs) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const baseGrad = ctx.createRadialGradient(-6, -8, 6, 2, 4, 40);
    baseGrad.addColorStop(0, '#F5E2B8');
    baseGrad.addColorStop(0.55, '#DFBC82');
    baseGrad.addColorStop(1, '#BA8E52');
    ctx.fillStyle = baseGrad;
    for (const [px, py, r] of outerPuffs) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Mid-layer warm cream-sand puffs with soft cel-crescent shading
    const midPuffs = [
      [-11, -5, 14.5], [10, -7, 14], [10, 9, 13.5], [-8, 10, 13.5], [0, 0, 15],
    ];
    for (const [px, py, r] of midPuffs) {
      const pGrad = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, 1.5, px, py, r);
      pGrad.addColorStop(0, '#FFF4D8');
      pGrad.addColorStop(0.65, '#ECD09A');
      pGrad.addColorStop(1, '#CFA66B');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle internal puff contour arcs (chibi cartoon cloud feel)
    ctx.strokeStyle = 'rgba(130, 88, 44, 0.55)';
    ctx.lineWidth = 1.9;
    const arcs = [
      [-12, -5, 12.5, 2.2, 4.4],
      [11, -7, 11.5, -1.6, 0.5],
      [9, 10, 11, 0.2, 2.2],
      [-9, 11, 11, 1.3, 3.2],
    ];
    for (const [ax, ay, r, s, e] of arcs) {
      ctx.beginPath();
      ctx.arc(ax, ay, r, s, e);
      ctx.stroke();
    }

    // Soft bright top-left cel highlight puffs
    ctx.fillStyle = 'rgba(255, 250, 232, 0.72)';
    ctx.beginPath();
    ctx.ellipse(-10, -10, 7.5, 4.5, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, -13, 6.2, 3.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSwirlLines(ctx) {
    // Expressive cartoon spiral wind/current lines
    const drawSpiral = (cx, cy, scale, rot, flip = 1) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(scale * flip, scale);
      ctx.strokeStyle = '#7A5026';
      ctx.lineWidth = 2.1 / scale;
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2.5; t += 0.15) {
        const r = 1.6 + t * 1.45;
        const x = Math.cos(t) * r;
        const y = Math.sin(t) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawSpiral(-2, 1, 0.92, -0.4, 1);
    drawSpiral(17, -11, 0.56, 0.8, -1);
    drawSpiral(-20, 10, 0.52, 2.1, 1);

    // Outer curving breeze wisps
    ctx.strokeStyle = 'rgba(130, 88, 44, 0.5)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, 36, -0.65, -0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 37, 2.35, 2.85);
    ctx.stroke();
  }

  _drawEmbeddedPebbles(ctx) {
    const pebbles = [
      { x: -24, y: 18, rx: 4.5, ry: 3.2, rot: 0.3, c1: '#A7A09A', c2: '#6B6463' },
      { x: 25, y: 14, rx: 4.0, ry: 3.0, rot: -0.4, c1: '#958E8C', c2: '#5B5557' },
      { x: 18, y: -22, rx: 3.4, ry: 2.5, rot: 0.6, c1: '#B8AC9E', c2: '#756A61' },
      { x: -28, y: -6, rx: 3.2, ry: 2.4, rot: -0.2, c1: '#9E9690', c2: '#605959' },
      { x: -4, y: 24, rx: 3.8, ry: 2.6, rot: 0.15, c1: '#ACA39A', c2: '#6A625E' },
    ];
    for (const p of pebbles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const grad = ctx.createRadialGradient(-1, -1, 0.4, 0, 0, p.rx);
      grad.addColorStop(0, p.c1);
      grad.addColorStop(1, p.c2);
      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawSedimentGrains(ctx) {
    // Scattered fine silt particles & mini floating dust puffs around perimeter
    const grains = [
      [-37, -14, 2.4], [-39, 5, 1.8], [-32, 26, 2.1], [-12, 32, 2.3],
      [13, 30, 1.9], [34, 22, 2.5], [40, 2, 1.8], [36, -16, 2.2],
      [22, -31, 2.0], [-4, -33, 2.4], [-25, -28, 1.9],
      [-7, -18, 1.4], [14, 2, 1.5], [-14, 4, 1.3], [4, 16, 1.4],
    ];
    for (const [gx, gy, r] of grains) {
      ctx.fillStyle = r > 2.0 ? '#E8CA93' : '#B8894D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = r > 2.0 ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
      if (r > 1.8) ctx.stroke();
    }
  }
}

export default Dustcloudobject;
