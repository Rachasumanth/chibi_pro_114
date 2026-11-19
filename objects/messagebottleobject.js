/**
 * Corked Message in a Bottle (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Messagebottleobject {
  static metadata = {
    name: 'Corked Message in a Bottle',
    category: 'object',
    baseLength: 55,
    baseWidth: 32,
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
    this._drawCorkStopper(ctx);
    this._drawBottleBaseGlass(ctx);
    this._drawParchmentScroll(ctx);
    this._drawBottleGlassOverlay(ctx);
    this._drawStarGlint(ctx);

    ctx.restore();
  }

  _bottlePath(ctx) {
    // Chunky chibi rounded glass bottle aligned horizontally (base left, neck right)
    ctx.beginPath();
    ctx.moveTo(-22, -8);
    ctx.quadraticCurveTo(-25, 0, -22, 8);
    ctx.bezierCurveTo(-18, 12.5, -2, 13, 6, 10.5);
    ctx.bezierCurveTo(10, 9, 12, 5.5, 15, 5.2);
    ctx.lineTo(20, 5.2);
    ctx.quadraticCurveTo(22.5, 5.2, 22.5, 0);
    ctx.quadraticCurveTo(22.5, -5.2, 20, -5.2);
    ctx.lineTo(15, -5.2);
    ctx.bezierCurveTo(12, -5.5, 10, -9, 6, -10.5);
    ctx.bezierCurveTo(-2, -13, -18, -12.5, -22, -8);
    ctx.closePath();
  }

  _drawAmbientShadow(ctx) {
    // Soft shadow + faint aqua caustic glow underneath glass bottle
    const grad = ctx.createRadialGradient(-2, 3, 4, 0, 3, 28);
    grad.addColorStop(0, 'rgba(14, 34, 48, 0.44)');
    grad.addColorStop(0.65, 'rgba(24, 96, 104, 0.22)');
    grad.addColorStop(1, 'rgba(14, 34, 48, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 3.5, 27, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCorkStopper(ctx) {
    ctx.save();
    // Ribbed tapered cork stopper protruding from bottle neck
    const grad = ctx.createLinearGradient(19, -5, 19, 5);
    grad.addColorStop(0, '#E3BA82');
    grad.addColorStop(0.55, '#BD8B52');
    grad.addColorStop(1, '#855A2E');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(18.5, -4);
    ctx.lineTo(25.5, -4.6);
    ctx.quadraticCurveTo(27.2, 0, 25.5, 4.6);
    ctx.lineTo(18.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cork grain ribs & speckles
    ctx.strokeStyle = 'rgba(72, 42, 18, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(21.5, -3.5);
    ctx.lineTo(21.5, 3.5);
    ctx.moveTo(24.2, -3.8);
    ctx.lineTo(24.2, 3.8);
    ctx.stroke();
    ctx.restore();
  }

  _drawBottleBaseGlass(ctx) {
    ctx.save();
    this._bottlePath(ctx);
    const glassGrad = ctx.createLinearGradient(0, -13, 0, 13);
    glassGrad.addColorStop(0, 'rgba(182, 248, 240, 0.85)');
    glassGrad.addColorStop(0.45, 'rgba(102, 214, 206, 0.72)');
    glassGrad.addColorStop(1, 'rgba(42, 148, 156, 0.84)');
    ctx.fillStyle = glassGrad;
    ctx.fill();

    // Thick glass punt/base interior depth crescent at left end
    ctx.fillStyle = 'rgba(32, 118, 128, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-18.5, 0, 3.2, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawParchmentScroll(ctx) {
    ctx.save();
    // Rolled aged parchment scroll sitting snugly inside bottle at a slight tilt
    ctx.translate(-5.5, 0.5);
    ctx.rotate(-0.14);

    // Subtle shadow of scroll on lower glass wall
    ctx.fillStyle = 'rgba(20, 56, 68, 0.28)';
    ctx.fillRect(-10.5, -3.2, 21, 9.2);

    // Rolled parchment cylinder
    const scrollGrad = ctx.createLinearGradient(0, -5, 0, 5);
    scrollGrad.addColorStop(0, '#FFF6DA');
    scrollGrad.addColorStop(0.55, '#EBD39E');
    scrollGrad.addColorStop(1, '#C49F62');

    ctx.fillStyle = scrollGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, -4.6);
    ctx.lineTo(11, -4.6);
    ctx.quadraticCurveTo(13, 0, 11, 4.6);
    ctx.lineTo(-11, 4.6);
    ctx.quadraticCurveTo(-13, 0, -11, -4.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Paper roll curl lines at ends
    ctx.strokeStyle = 'rgba(116, 78, 36, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -4.2);
    ctx.quadraticCurveTo(-7.5, 0, -9, 4.2);
    ctx.moveTo(9, -4.2);
    ctx.quadraticCurveTo(10.5, 0, 9, 4.2);
    ctx.stroke();

    // Twine cord wrapped around center of scroll
    ctx.strokeStyle = '#7A4C24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-1.2, -4.8);
    ctx.lineTo(-1.2, 4.8);
    ctx.moveTo(1.2, -4.8);
    ctx.lineTo(1.2, 4.8);
    ctx.stroke();

    // Crimson wax seal stamped on twine knot
    ctx.fillStyle = '#E02944';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 3.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tiny wax highlight
    ctx.fillStyle = '#FF99A8';
    ctx.beginPath();
    ctx.arc(-0.9, -0.9, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawBottleGlassOverlay(ctx) {
    ctx.save();
    // Translucent aqua sheen over scroll so it looks genuinely enclosed in glass
    this._bottlePath(ctx);
    const sheenGrad = ctx.createLinearGradient(0, -12, 0, 12);
    sheenGrad.addColorStop(0, 'rgba(235, 255, 252, 0.42)');
    sheenGrad.addColorStop(0.35, 'rgba(148, 240, 232, 0.12)');
    sheenGrad.addColorStop(0.75, 'rgba(42, 152, 162, 0.16)');
    sheenGrad.addColorStop(1, 'rgba(20, 92, 108, 0.34)');
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    // Crisp outer glass outline
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Molded glass collar lip ring at neck opening
    ctx.fillStyle = 'rgba(165, 242, 235, 0.9)';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(17.5, -6.2, 3.4, 12.4);
    ctx.fill();
    ctx.stroke();

    // Glossy curved specular refraction streaks on upper glass wall
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -7.8);
    ctx.quadraticCurveTo(-4, -9.8, 6, -7.2);
    ctx.stroke();

    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(11, -3.5);
    ctx.lineTo(16, -3.2);
    ctx.stroke();

    // Subtle bottom rim bounce light
    ctx.strokeStyle = 'rgba(190, 255, 248, 0.52)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-15, 8.8);
    ctx.quadraticCurveTo(-4, 10.2, 5, 8.2);
    ctx.stroke();
    ctx.restore();
  }

  _drawStarGlint(ctx) {
    ctx.save();
    ctx.translate(-12, -8.5);
    ctx.fillStyle = '#FFFFFF';
    const s = 4.6;
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

export default Messagebottleobject;
