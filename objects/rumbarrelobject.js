/**
 * Pirate Rum Barrel & Cargo Crate (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Rumbarrelobject {
  static metadata = {
    name: 'Pirate Rum Barrel & Cargo Crate',
    category: 'object',
    baseLength: 80,
    baseWidth: 75,
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
    this._drawRumPuddle(ctx);
    this._drawCargoCrate(ctx);
    this._drawRumBarrel(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 8, 0, 4, 42);
    grad.addColorStop(0, 'rgba(16, 14, 32, 0.5)');
    grad.addColorStop(0.7, 'rgba(16, 14, 32, 0.22)');
    grad.addColorStop(1, 'rgba(16, 14, 32, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 40, 36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawRumPuddle(ctx) {
    // Small glossy spilled amber rum puddle peeking out beside barrel
    ctx.save();
    ctx.fillStyle = 'rgba(150, 56, 18, 0.65)';
    ctx.strokeStyle = 'rgba(64, 22, 10, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-22, 22, 11, 7, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 206, 140, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-25, 20, 4, 2, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawCargoCrate(ctx) {
    ctx.save();
    // Slatted wooden cargo crate tucked at top-right, slightly angled
    ctx.translate(16, 9);
    ctx.rotate(0.18);

    const w = 36;
    const h = 36;
    const hw = w / 2;
    const hh = h / 2;

    // Crate shadow
    ctx.fillStyle = 'rgba(18, 12, 28, 0.36)';
    ctx.fillRect(-hw + 2.5, -hh + 3, w, h);

    // Base recessed timber planks
    const baseGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    baseGrad.addColorStop(0, '#C78E52');
    baseGrad.addColorStop(0.55, '#9F6934');
    baseGrad.addColorStop(1, '#784A21');
    ctx.fillStyle = baseGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.fillRect(-hw, -hh, w, h);
    ctx.strokeRect(-hw, -hh, w, h);

    // Individual plank slat lines
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.55)';
    ctx.lineWidth = 1.3;
    for (const sy of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(-hw + 4, sy);
      ctx.lineTo(hw - 4, sy);
      ctx.stroke();
    }

    // Splintered crack & dark gap in lower-right plank
    ctx.fillStyle = '#241626';
    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.lineTo(13, 1);
    ctx.lineTo(14, 9);
    ctx.lineTo(5, 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E5B278';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(9, 6);
    ctx.lineTo(4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Diagonal bracing slat
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw + 4, -hh + 4, w - 8, h - 8);
    ctx.clip();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7.4;
    ctx.beginPath();
    ctx.moveTo(-hw + 3, hh - 3);
    ctx.lineTo(hw - 3, -hh + 3);
    ctx.stroke();
    ctx.strokeStyle = '#BA8148';
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.restore();

    // Chunky outer timber border frame
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#B87D44';
    ctx.strokeRect(-hw + 2.5, -hh + 2.5, w - 5, h - 5);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = OUTLINE;
    ctx.strokeRect(-hw, -hh, w, h);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-hw + 5, -hh + 5, w - 10, h - 10);

    // Corner iron brackets & nail heads
    ctx.fillStyle = '#4B5568';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const [cx, cy] of [
      [-hw, -hh],
      [hw - 6, -hh],
      [-hw, hh - 6],
      [hw - 6, hh - 6],
    ]) {
      ctx.fillRect(cx, cy, 6, 6);
      ctx.strokeRect(cx, cy, 6, 6);
      ctx.fillStyle = '#AAB7CC';
      ctx.beginPath();
      ctx.arc(cx + 3, cy + 3, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4B5568';
    }

    ctx.restore();
  }

  _drawRumBarrel(ctx) {
    ctx.save();
    // Chunky circular wooden rum barrel top at center-left
    const bx = -13;
    const by = -9;
    const r = 22.5;

    // Barrel shadow
    ctx.fillStyle = 'rgba(18, 12, 28, 0.42)';
    ctx.beginPath();
    ctx.arc(bx + 2, by + 3, r + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer rusted iron hoop rim
    const hoopGrad = ctx.createRadialGradient(bx - 6, by - 6, 4, bx, by, r);
    hoopGrad.addColorStop(0, '#6B778D');
    hoopGrad.addColorStop(0.75, '#465063');
    hoopGrad.addColorStop(1, '#2D3442');

    ctx.fillStyle = hoopGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rust patches along iron hoop
    ctx.strokeStyle = 'rgba(204, 96, 36, 0.8)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(bx, by, r - 1.5, -0.4, 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, r - 1.5, 2.2, 3.0);
    ctx.stroke();

    // Recessed wooden barrel lid head
    const innerR = r - 4.2;
    const lidGrad = ctx.createRadialGradient(bx - 5, by - 5, 2, bx, by, innerR);
    lidGrad.addColorStop(0, '#D49A5E');
    lidGrad.addColorStop(0.6, '#A86E38');
    lidGrad.addColorStop(1, '#794920');

    ctx.fillStyle = lidGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(bx, by, innerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Individual vertical lid planks, grain & nail heads
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, innerR - 0.5, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(30, 20, 43, 0.55)';
    ctx.lineWidth = 1.4;
    for (const px of [-10, -3.5, 3.5, 10]) {
      ctx.beginPath();
      ctx.moveTo(bx + px, by - innerR);
      ctx.lineTo(bx + px, by + innerR);
      ctx.stroke();
    }

    // Subtle inner bevel shadow around lid rim
    ctx.strokeStyle = 'rgba(24, 14, 18, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bx, by, innerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Rivets around outer iron hoop
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rx = bx + Math.cos(a) * (r - 2.1);
      const ry = by + Math.sin(a) * (r - 2.1);
      ctx.fillStyle = '#A8B6CC';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cork bung plug on upper-right of barrel head
    const plugX = bx + 8.5;
    const plugY = by - 7.5;
    ctx.fillStyle = '#D9B178';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(plugX, plugY, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFF0CC';
    ctx.beginPath();
    ctx.arc(plugX - 1, plugY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Painted white chibi skull stencil on barrel lid
    ctx.save();
    ctx.translate(bx - 2, by + 2);
    ctx.rotate(-0.2);

    // Crossbones
    ctx.strokeStyle = 'rgba(248, 240, 224, 0.9)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-8.5, -5.5);
    ctx.lineTo(8.5, 5.5);
    ctx.moveTo(8.5, -5.5);
    ctx.lineTo(-8.5, 5.5);
    ctx.stroke();

    // Chibi skull stencil head
    ctx.fillStyle = '#FAF3E6';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -1, 6.2, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye sockets
    ctx.fillStyle = '#4E2C14';
    ctx.beginPath();
    ctx.arc(-2.2, -1, 1.4, 0, Math.PI * 2);
    ctx.arc(2.2, -1, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Specular cel arc on iron rim
    ctx.strokeStyle = 'rgba(225, 238, 255, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(bx, by, r - 1.5, -2.5, -1.4);
    ctx.stroke();

    ctx.restore();
  }
}

export default Rumbarrelobject;
