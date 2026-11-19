/**
 * Brass Navigator's Compass (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Compassobject {
  static metadata = {
    name: "Brass Navigator's Compass",
    category: 'object',
    baseLength: 52,
    baseWidth: 52,
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
    this._drawHingedRing(ctx);
    this._drawBrassCase(ctx);
    this._drawCompassRoseDial(ctx);
    this._drawNeedle(ctx);
    this._drawCrackedGlassOverlay(ctx);
    this._drawStarGlint(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 3, 4, 0, 3, 26);
    grad.addColorStop(0, 'rgba(16, 14, 34, 0.52)');
    grad.addColorStop(0.7, 'rgba(16, 14, 34, 0.22)');
    grad.addColorStop(1, 'rgba(16, 14, 34, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 3, 25, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHingedRing(ctx) {
    ctx.save();
    // Hinged brass pendant ring & stem at top (-Y)
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.arc(0, -21.5, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#EAB844';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Knurled brass crown stem
    ctx.fillStyle = '#D99E2C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-3, -22, 6, 4.5);
    ctx.strokeRect(-3, -22, 6, 4.5);
    ctx.restore();
  }

  _drawBrassCase(ctx) {
    ctx.save();
    // Chunky antique brass bezel
    const caseGrad = ctx.createRadialGradient(-6, -6, 3, 0, 2, 22);
    caseGrad.addColorStop(0, '#FFF1A6');
    caseGrad.addColorStop(0.45, '#E4AD34');
    caseGrad.addColorStop(0.82, '#A86E16');
    caseGrad.addColorStop(1, '#70440B');

    ctx.fillStyle = caseGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 2, 20.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Recessed inner brass bevel ring
    ctx.strokeStyle = '#7A4B0E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 2, 16.5, 0, Math.PI * 2);
    ctx.stroke();

    // 4 tiny decorative brass bezel studs
    ctx.fillStyle = '#FFF0A8';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 18.5, 2 + Math.sin(a) * 18.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawCompassRoseDial(ctx) {
    ctx.save();
    ctx.translate(0, 2);

    // Aged cream parchment dial face
    const dialGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
    dialGrad.addColorStop(0, '#FFFDF2');
    dialGrad.addColorStop(0.75, '#F0E2BE');
    dialGrad.addColorStop(1, '#CEB584');

    ctx.fillStyle = dialGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 15.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 16-point degree tick marks around dial perimeter
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const isMajor = i % 4 === 0;
      const isMid = i % 2 === 0;
      const rIn = isMajor ? 12.2 : isMid ? 13.0 : 13.8;
      ctx.strokeStyle = isMajor ? '#2B1F36' : 'rgba(64, 48, 36, 0.65)';
      ctx.lineWidth = isMajor ? 1.5 : 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
      ctx.lineTo(Math.cos(a) * 15.3, Math.sin(a) * 15.3);
      ctx.stroke();
    }

    // Sub-intercardinal 8 minor compass rose points (thin bronze rays)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      ctx.fillStyle = '#B88940';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 9.2, Math.sin(a) * 9.2);
      ctx.lineTo(Math.cos(a + 0.16) * 3, Math.sin(a + 0.16) * 3);
      ctx.lineTo(Math.cos(a - 0.16) * 3, Math.sin(a - 0.16) * 3);
      ctx.closePath();
      ctx.fill();
    }

    // Intercardinal 4 points (NE, SE, SW, NW)
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.fillStyle = '#6E5138';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 11.2, Math.sin(a) * 11.2);
      ctx.lineTo(Math.cos(a + 0.22) * 3.4, Math.sin(a + 0.22) * 3.4);
      ctx.lineTo(Math.cos(a - 0.22) * 3.4, Math.sin(a - 0.22) * 3.4);
      ctx.closePath();
      ctx.fill();
    }

    // Cardinal 4 points (N, E, S, W) split-shaded star rose
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 - Math.PI / 2;
      // Right half darker, left half lighter
      ctx.fillStyle = '#2F253D';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 12.6, Math.sin(a) * 12.6);
      ctx.lineTo(Math.cos(a + 0.35) * 3.5, Math.sin(a + 0.35) * 3.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = i === 0 ? '#D93848' : '#C9973E';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 12.6, Math.sin(a) * 12.6);
      ctx.lineTo(Math.cos(a - 0.35) * 3.5, Math.sin(a - 0.35) * 3.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  _drawNeedle(ctx) {
    ctx.save();
    ctx.translate(0, 2);
    // Slightly angled magnetic needle pointing NE-ish for dynamic charm
    ctx.rotate(0.45);

    // Subtle needle shadow on dial
    ctx.fillStyle = 'rgba(24, 18, 36, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0.8, -11.5);
    ctx.lineTo(3.6, 0.8);
    ctx.lineTo(0.8, 12.2);
    ctx.lineTo(-2.2, 0.8);
    ctx.closePath();
    ctx.fill();

    // Red North pointer
    ctx.fillStyle = '#EE364B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12.2);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Obsidian South pointer
    ctx.fillStyle = '#2B3245';
    ctx.beginPath();
    ctx.moveTo(0, 12.2);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brass center pivot cap
    ctx.fillStyle = '#FFE480';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawCrackedGlassOverlay(ctx) {
    ctx.save();
    ctx.translate(0, 2);
    ctx.beginPath();
    ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
    ctx.clip();

    // Diagonal glass specular reflection band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(4, -16);
    ctx.lineTo(12, -16);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(15, -12);
    ctx.lineTo(16, -9);
    ctx.lineTo(-13, 14);
    ctx.closePath();
    ctx.fill();

    // Fine diagonal glass crack across lower-right crystal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(6, 3);
    ctx.lineTo(8, 8);
    ctx.lineTo(2, 15);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(30, 20, 43, 0.45)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(14.6, -3.5);
    ctx.lineTo(6.6, 3.5);
    ctx.lineTo(8.6, 8.5);
    ctx.lineTo(2.6, 15.5);
    ctx.stroke();

    ctx.restore();
  }

  _drawStarGlint(ctx) {
    ctx.save();
    ctx.translate(-11, -10);
    ctx.fillStyle = '#FFFFFF';
    const s = 4.8;
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
    ctx.restore();
  }
}

export default Compassobject;
