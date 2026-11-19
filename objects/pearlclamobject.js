/**
 * Giant Iridescent Pearl Clam (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Pearlclamobject {
  static metadata = {
    name: 'Giant Iridescent Pearl Clam',
    category: 'object',
    baseLength: 90,
    baseWidth: 82,
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
    this._drawHingeEars(ctx);
    this._drawUpperOpenShellValve(ctx);
    this._drawLowerShellValve(ctx);
    this._drawIridescentMantle(ctx);
    this._drawGiantPearl(ctx);
    this._drawStarGlints(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 5, 10, 0, 5, 45);
    grad.addColorStop(0, 'rgba(18, 14, 40, 0.52)');
    grad.addColorStop(0.68, 'rgba(18, 14, 40, 0.22)');
    grad.addColorStop(1, 'rgba(18, 14, 40, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 5, 43, 38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _scallopFanPath(ctx, cx, cy, rx, ry, startAngle, endAngle, lobes) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const total = endAngle - startAngle;
    const step = total / lobes;
    for (let i = 0; i < lobes; i++) {
      const a0 = startAngle + i * step;
      const aMid = a0 + step * 0.5;
      const a1 = a0 + step;
      const x0 = cx + Math.cos(a0) * rx * 0.92;
      const y0 = cy + Math.sin(a0) * ry * 0.92;
      const xm = cx + Math.cos(aMid) * rx * 1.08;
      const ym = cy + Math.sin(aMid) * ry * 1.08;
      const x1 = cx + Math.cos(a1) * rx * 0.92;
      const y1 = cy + Math.sin(a1) * ry * 0.92;
      if (i === 0) ctx.lineTo(x0, y0);
      ctx.quadraticCurveTo(xm, ym, x1, y1);
    }
    ctx.closePath();
  }

  _drawHingeEars(ctx) {
    // Classic scallop hinge "ears" behind the shell apex (-Y)
    ctx.save();
    const earGrad = ctx.createLinearGradient(0, -34, 0, -20);
    earGrad.addColorStop(0, '#B566A8');
    earGrad.addColorStop(1, '#6C3273');

    ctx.fillStyle = earGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, -28);
    ctx.lineTo(16, -28);
    ctx.lineTo(12, -18);
    ctx.lineTo(-12, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawUpperOpenShellValve(ctx) {
    ctx.save();
    // Upper hinged scalloped valve tilted open behind the pearl (top side)
    const cx = 0;
    const cy = -24;
    this._scallopFanPath(ctx, cx, cy, 38, 19, Math.PI * 1.12, Math.PI * 1.88, 7);

    const grad = ctx.createLinearGradient(0, -44, 0, -20);
    grad.addColorStop(0, '#E69BD8');
    grad.addColorStop(0.55, '#B65FA8');
    grad.addColorStop(1, '#753375');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Radial fluted ridges on upper valve
    ctx.strokeStyle = 'rgba(62, 22, 72, 0.55)';
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 7; i++) {
      const a = Math.PI * 1.12 + (i / 7) * Math.PI * 0.76;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 35, cy + Math.sin(a) * 17.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawLowerShellValve(ctx) {
    ctx.save();
    // Large lower scalloped shell cradle resting open on the seabed
    const cx = 0;
    const cy = -20;
    this._scallopFanPath(ctx, cx, cy, 42, 54, Math.PI * 0.08, Math.PI * 0.92, 7);

    const outerGrad = ctx.createRadialGradient(-8, 2, 6, 0, 8, 48);
    outerGrad.addColorStop(0, '#FFE3F6');
    outerGrad.addColorStop(0.45, '#DF8EC9');
    outerGrad.addColorStop(0.82, '#A54E96');
    outerGrad.addColorStop(1, '#6E2B6B');

    ctx.fillStyle = outerGrad;
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Inner pearlescent nacre shell lining
    this._scallopFanPath(ctx, cx, cy + 3, 35, 45, Math.PI * 0.1, Math.PI * 0.9, 7);
    const nacreGrad = ctx.createRadialGradient(0, 6, 4, 0, 8, 38);
    nacreGrad.addColorStop(0, '#FFF5FD');
    nacreGrad.addColorStop(0.5, '#F2C6E8');
    nacreGrad.addColorStop(0.85, '#C47BB8');
    nacreGrad.addColorStop(1, '#8A4086');
    ctx.fillStyle = nacreGrad;
    ctx.fill();

    // Radial fluted ridge grooves fanning out from hinge
    ctx.strokeStyle = 'rgba(116, 48, 114, 0.45)';
    ctx.lineWidth = 1.8;
    for (let i = 1; i < 7; i++) {
      const a = Math.PI * 0.08 + (i / 7) * Math.PI * 0.84;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2);
      ctx.lineTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 49);
      ctx.stroke();
    }

    // Crisp rim cel highlights along front scalloped petals
    ctx.strokeStyle = 'rgba(255, 240, 252, 0.72)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 4, 31, 0.55, 2.55);
    ctx.stroke();

    ctx.restore();
  }

  _drawIridescentMantle(ctx) {
    ctx.save();
    // Soft ruffled iridescent violet-cyan fleshy clam mantle cradling the pearl
    const mantleGrad = ctx.createRadialGradient(0, 4, 4, 0, 5, 24);
    mantleGrad.addColorStop(0, '#78F0E8');
    mantleGrad.addColorStop(0.55, '#9F6EE8');
    mantleGrad.addColorStop(1, '#5B2C8A');

    ctx.fillStyle = mantleGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const waves = 12;
    for (let i = 0; i <= waves; i++) {
      const a = (i / waves) * Math.PI * 2;
      const rX = 22 + (i % 2 === 0 ? 2.5 : -2.2);
      const rY = 18 + (i % 2 === 0 ? 2.2 : -2.0);
      const px = Math.cos(a) * rX;
      const py = 5 + Math.sin(a) * rY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iridescent turquoise rim dots on mantle
    ctx.fillStyle = 'rgba(170, 255, 248, 0.85)';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 19.5, 5 + Math.sin(a) * 15.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawGiantPearl(ctx) {
    ctx.save();
    const px = 0;
    const py = 4;
    const r = 13.5;

    // Soft cast shadow under giant pearl
    ctx.fillStyle = 'rgba(42, 16, 68, 0.42)';
    ctx.beginPath();
    ctx.ellipse(px + 1.5, py + 3.5, r, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main lustrous pearlescent sphere with subtle pink-aqua iridescence
    const pGrad = ctx.createRadialGradient(px - 4.5, py - 4.5, 1.5, px, py, r);
    pGrad.addColorStop(0, '#FFFFFF');
    pGrad.addColorStop(0.42, '#FFF8FE');
    pGrad.addColorStop(0.72, '#E2D6F5');
    pGrad.addColorStop(0.9, '#B9C8EA');
    pGrad.addColorStop(1, '#8D86B8');

    ctx.fillStyle = pGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Warm rose-aqua bounce light crescent on lower-right of pearl
    ctx.strokeStyle = 'rgba(155, 248, 244, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(px, py, r - 2.6, 0.35, 1.65);
    ctx.stroke();

    // Glossy oval cel-highlight + secondary dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(px - 4.8, py - 5.2, 4.4, 2.7, -0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - 1.5, py - 8.2, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawStarGlints(ctx) {
    const drawStar = (x, y, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(205, 245, 255, 0.9)';
      ctx.lineWidth = 0.8;
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
      ctx.stroke();
      ctx.restore();
    };

    drawStar(-6, -2, 6.8);
    drawStar(10, 9, 4.6);
  }
}

export default Pearlclamobject;
