/**
 * Sunken Naval Cannon & Cannonballs (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Cannonobject {
  static metadata = {
    name: 'Sunken Naval Cannon & Cannonballs',
    category: 'object',
    baseLength: 95,
    baseWidth: 60,
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
    this._drawCannonballStack(ctx);
    this._drawTimberCarriage(ctx);
    this._drawCannonBarrel(ctx);
    this._drawGlints(ctx);

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

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(-2, 4, 8, 0, 4, 48);
    grad.addColorStop(0, 'rgba(14, 16, 34, 0.52)');
    grad.addColorStop(0.68, 'rgba(14, 16, 34, 0.22)');
    grad.addColorStop(1, 'rgba(14, 16, 34, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 46, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCannonball(ctx, x, y, r) {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.6, x, y, r);
    grad.addColorStop(0, '#8D9BB2');
    grad.addColorStop(0.35, '#4A5568');
    grad.addColorStop(0.8, '#282F3D');
    grad.addColorStop(1, '#1A1F2B');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crisp glossy specular dot
    ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.32, r * 0.24, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCannonballStack(ctx) {
    // Neat stacked pyramid of glossy iron cannonballs tucked behind-right of carriage
    const cx = -32;
    const cy = 15;
    // Base triangle of 3 balls
    this._drawCannonball(ctx, cx - 5.5, cy + 4, 6.2);
    this._drawCannonball(ctx, cx + 6.5, cy + 4, 6.2);
    this._drawCannonball(ctx, cx + 0.5, cy - 5.5, 6.2);
    // Top apex cannonball
    this._drawCannonball(ctx, cx + 0.5, cy + 0.5, 6.0);
  }

  _drawTimberCarriage(ctx) {
    ctx.save();
    // Slight offset so barrel sits centered nicely
    ctx.translate(4, -3);

    // 4 chunky wooden truck wheels protruding from axles
    const wheelXs = [-16, 13];
    for (const wx of wheelXs) {
      for (const side of [-1, 1]) {
        const wy = side * 19.5;
        ctx.fillStyle = '#5C3317';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.2;
        this._roundRect(ctx, wx - 6, wy - 3.5, 12, 7, 2.5);
        ctx.fill();
        ctx.stroke();

        // Iron tire rim stripe
        ctx.fillStyle = '#4B5568';
        ctx.fillRect(wx - 4, wy + (side > 0 ? 1 : -3), 8, 2);
      }
    }

    // Main oak carriage cheeks (chunky stepped timber frame)
    const woodGrad = ctx.createLinearGradient(0, -18, 0, 18);
    woodGrad.addColorStop(0, '#C48448');
    woodGrad.addColorStop(0.5, '#9A5F2D');
    woodGrad.addColorStop(1, '#6C3D1A');

    this._roundRect(ctx, -26, -16.5, 50, 33, 5);
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.fill();
    ctx.stroke();

    // Wood plank grain lines on carriage
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-24, -10.5);
    ctx.lineTo(22, -10.5);
    ctx.moveTo(-24, 10.5);
    ctx.lineTo(22, 10.5);
    ctx.stroke();

    // Riveted iron bracket straps across carriage cheeks
    for (const sx of [-19, 12]) {
      ctx.fillStyle = '#4D586C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.fillRect(sx, -16.5, 6, 33);
      ctx.strokeRect(sx, -16.5, 6, 33);

      ctx.fillStyle = '#A8B7CE';
      for (const ry of [-13.2, 13.2]) {
        ctx.beginPath();
        ctx.arc(sx + 3, ry, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Rear iron breech ring
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(-28, 0, 3.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#6D7A91';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  _drawCannonBarrel(ctx) {
    ctx.save();
    ctx.translate(4, -3);

    // Barrel cast shadow on carriage
    ctx.fillStyle = 'rgba(16, 12, 26, 0.42)';
    ctx.beginPath();
    ctx.ellipse(7, 3, 35, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunnion pegs holding barrel to carriage
    ctx.fillStyle = '#3C4657';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    this._roundRect(ctx, -4, -15, 8, 30, 2.5);
    ctx.fill();
    ctx.stroke();

    // Cascabel knob at breech (rear)
    const knobGrad = ctx.createRadialGradient(-30, -2, 1, -28, 0, 7);
    knobGrad.addColorStop(0, '#7F8EA6');
    knobGrad.addColorStop(0.6, '#434E61');
    knobGrad.addColorStop(1, '#232936');
    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.arc(-28.5, 0, 5.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Main tapered dark cast-iron cannon barrel
    const barrelGrad = ctx.createLinearGradient(0, -12, 0, 12);
    barrelGrad.addColorStop(0, '#7A89A1');
    barrelGrad.addColorStop(0.28, '#535F75');
    barrelGrad.addColorStop(0.68, '#323A4A');
    barrelGrad.addColorStop(1, '#1E232E');

    ctx.fillStyle = barrelGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-24, -10.5);
    ctx.lineTo(31, -7.2);
    ctx.lineTo(36, -9.8);
    ctx.quadraticCurveTo(40, 0, 36, 9.8);
    ctx.lineTo(31, 7.2);
    ctx.lineTo(-24, 10.5);
    ctx.quadraticCurveTo(-28, 0, -24, -10.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Raised reinforcement rings along barrel
    const rings = [
      { x: -19, h: 21.5 },
      { x: 1, h: 19.2 },
      { x: 20, h: 16.8 },
    ];
    for (const ring of rings) {
      ctx.fillStyle = '#5D6A82';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      this._roundRect(ctx, ring.x - 2.4, -ring.h / 2, 4.8, ring.h, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Brass-rimmed touchhole near breech
    ctx.fillStyle = '#D9A43B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-12, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#181422';
    ctx.beginPath();
    ctx.arc(-12, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Subtle rust patina blotches on iron barrel
    ctx.fillStyle = 'rgba(196, 94, 34, 0.55)';
    ctx.beginPath();
    ctx.ellipse(10, 4.5, 5.5, 2.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(-6, -5.5, 4.2, 2.2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Crisp cel-shaded top specular highlight bar along barrel
    ctx.strokeStyle = 'rgba(225, 238, 255, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -5.8);
    ctx.lineTo(28, -4.1);
    ctx.stroke();

    ctx.restore();
  }

  _drawGlints(ctx) {
    // Small kawaii 4-point glint on top cannonball
    ctx.save();
    ctx.translate(-33.5, 13);
    ctx.fillStyle = '#FFFFFF';
    const s = 4.2;
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
    ctx.restore();
  }
}

export default Cannonobject;
