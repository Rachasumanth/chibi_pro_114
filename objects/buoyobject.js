/**
 * Striped Harbor Mooring Buoy (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Buoyobject {
  static metadata = {
    name: 'Striped Harbor Mooring Buoy',
    category: 'object',
    baseLength: 72,
    baseWidth: 72,
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
    this._drawAnchorChain(ctx);
    this._drawStripedFloatBody(ctx);
    this._drawWeatheringAndRivets(ctx);
    this._drawBeaconLatticeAndLamp(ctx);
    this._drawStarGlint(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 8, 0, 4, 36);
    grad.addColorStop(0, 'rgba(12, 18, 36, 0.52)');
    grad.addColorStop(0.7, 'rgba(12, 18, 36, 0.22)');
    grad.addColorStop(1, 'rgba(12, 18, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 33, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawAnchorChain(ctx) {
    ctx.save();
    // Heavy linked iron anchor chain trailing out from bottom-right mooring lug
    const links = [
      { x: 19, y: 17, rot: 0.72 },
      { x: 25, y: 22, rot: 0.62 },
      { x: 30, y: 27, rot: 0.85 },
    ];
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.2, 2.8, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = i % 2 === 0 ? '#69778D' : '#4C576B';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  _drawStripedFloatBody(ctx) {
    ctx.save();
    const r = 27;

    // 4 alternating red-and-white nautical metal quadrants
    const sectors = [
      { a0: -Math.PI / 4, a1: Math.PI / 4, red: true },
      { a0: Math.PI / 4, a1: (3 * Math.PI) / 4, red: false },
      { a0: (3 * Math.PI) / 4, a1: (5 * Math.PI) / 4, red: true },
      { a0: (5 * Math.PI) / 4, a1: (7 * Math.PI) / 4, red: false },
    ];

    for (const s of sectors) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, s.a0, s.a1);
      ctx.closePath();

      const grad = ctx.createRadialGradient(-7, -7, 3, 0, 0, r);
      if (s.red) {
        grad.addColorStop(0, '#FF686B');
        grad.addColorStop(0.58, '#E03442');
        grad.addColorStop(1, '#9E1B2B');
      } else {
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.65, '#ECE7DC');
        grad.addColorStop(1, '#C2B9AD');
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Thick rubber/iron bumper fender collar around outer perimeter
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner recessed steel deck ring
    ctx.fillStyle = '#535F73';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular curved rim highlight on upper-left float dome
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, -2.55, -1.35);
    ctx.stroke();

    ctx.restore();
  }

  _drawWeatheringAndRivets(ctx) {
    ctx.save();
    // Weathered paint chips & rust speckles on metal float
    const chips = [
      { x: 17, y: -9, rx: 3.4, ry: 2.0, rot: 0.4 },
      { x: -19, y: 8, rx: 3.8, ry: 2.2, rot: -0.3 },
      { x: 5, y: 20, rx: 3.0, ry: 1.8, rot: 0.2 },
    ];
    for (const c of chips) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = '#9E542B';
      ctx.beginPath();
      ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4B5466';
      ctx.beginPath();
      ctx.ellipse(0.4, 0.3, c.rx * 0.5, c.ry * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 12 riveted metal seam bolts around the float rim
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const rx = Math.cos(a) * 23.2;
      const ry = Math.sin(a) * 23.2;
      ctx.fillStyle = '#C9D3E0';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBeaconLatticeAndLamp(ctx) {
    ctx.save();
    // 4 heavy steel beacon tower struts converging toward center lamp
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const xOuter = Math.cos(a) * 15;
      const yOuter = Math.sin(a) * 15;
      const xInner = Math.cos(a) * 6.5;
      const yInner = Math.sin(a) * 6.5;

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo(xOuter, yOuter);
      ctx.lineTo(xInner, yInner);
      ctx.stroke();

      ctx.strokeStyle = '#8F9DB2';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    // Central steel lamp cage ring
    ctx.fillStyle = '#3D4759';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing amber navigation beacon lens
    const lampGrad = ctx.createRadialGradient(-2, -2, 0.8, 0, 0, 7);
    lampGrad.addColorStop(0, '#FFFAD1');
    lampGrad.addColorStop(0.45, '#FFC533');
    lampGrad.addColorStop(0.85, '#E37A14');
    lampGrad.addColorStop(1, '#9E4208');

    ctx.fillStyle = lampGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 6.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft warm beacon aura
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    glow.addColorStop(0, 'rgba(255, 224, 112, 0.42)');
    glow.addColorStop(1, 'rgba(255, 180, 48, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Glossy lens highlight dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-2.1, -2.1, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawStarGlint(ctx) {
    ctx.save();
    ctx.translate(-3, -3);
    ctx.fillStyle = '#FFFFFF';
    const s = 4.6;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? s : s * 0.25;
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

export default Buoyobject;
