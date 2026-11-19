// Giant Amazon Water Platter — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Amazonplatterflora {
  static metadata = {
    name: 'Giant Amazon Water Platter',
    category: 'flora',
    baseLength: 175,
    baseWidth: 175,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Glistening chibi water droplets resting on the ribbed jade platter
    this._droplets = [
      { x: -34, y: -22, r: 5.2, phase: 0.3 },
      { x: -24, y: -33, r: 3.0, phase: 1.4 },
      { x: 32, y: -26, r: 4.4, phase: 2.2 },
      { x: 24, y: 31, r: 4.8, phase: 3.5 },
      { x: -38, y: 20, r: 3.8, phase: 4.4 },
      { x: 6, y: -44, r: 2.8, phase: 5.3 },
    ];
  }

  play(_name) {
    this._state = 'idle';
  }

  update(dt) {
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    this.time += step;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) {
      this.angle = radians;
    }
  }

  setDirection(dx, dy) {
    if (Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'idle';
  }

  onFinished(_name, _callback) {
    // Safe no-op
  }

  _traceNotchedCircle(ctx, r, notchA, notchB, notchHalf, notchDepth) {
    const steps = 96;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      let rad = r * (1 + 0.008 * Math.sin(a * 16));
      for (const na of [notchA, notchB]) {
        let diff = Math.atan2(Math.sin(a - na), Math.cos(a - na));
        if (Math.abs(diff) < notchHalf) {
          const factor = Math.cos((diff / notchHalf) * (Math.PI * 0.5));
          rad -= notchDepth * factor * factor;
        }
      }
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  draw(ctx) {
    const t = this.time;
    const bobX = Math.sin(t * 0.9) * 1.6;
    const bobY = Math.cos(t * 0.78) * 1.3;
    const driftRot = Math.sin(t * 0.65) * 0.032;
    const breath = 1 + Math.sin(t * 1.5) * 0.015;

    const outerR = 77 * breath;
    const innerR = 68.5 * breath;
    const notchA = 0.42;
    const notchB = 0.42 + Math.PI;

    ctx.save();
    ctx.translate(this.x + bobX, this.y + bobY);
    ctx.rotate(this.angle + driftRot);
    ctx.scale(this.scale, this.scale);

    // 1. Gently expanding water ripples around the giant platter
    for (let i = 0; i < 2; i++) {
      const p = (t * 0.24 + i * 0.5) % 1;
      const rr = outerR + 2 + p * 11;
      const alpha = (1 - p) * 0.26;
      ctx.strokeStyle = `rgba(212, 248, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, TAU);
      ctx.stroke();
    }

    // 2. Deep water-surface drop shadow
    ctx.save();
    ctx.translate(3.5, 5.2);
    this._traceNotchedCircle(ctx, outerR + 1.5, notchA, notchB, 0.13, 11);
    ctx.fillStyle = 'rgba(12, 24, 32, 0.40)';
    ctx.fill();
    ctx.restore();

    // 3. Raised upturned outer rim wall (rich crimson-bronze & emerald bevel)
    this._traceNotchedCircle(ctx, outerR, notchA, notchB, 0.13, 11);
    const rimGrad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
    rimGrad.addColorStop(0, '#9E4B52');
    rimGrad.addColorStop(0.32, '#5E9E58');
    rimGrad.addColorStop(0.68, '#2C7548');
    rimGrad.addColorStop(1, '#6B2C38');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Bold dark-plum outer rim ink outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Crisp sunlit lip highlight along upper-left upturned wall
    ctx.save();
    ctx.strokeStyle = 'rgba(218, 255, 186, 0.52)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, outerR - 2.4, -Math.PI * 0.88, -Math.PI * 0.12);
    ctx.stroke();
    ctx.restore();

    // 4. Inner recessed jade-green platter basin
    ctx.save();
    this._traceNotchedCircle(ctx, innerR, notchA, notchB, 0.11, 7);

    const basinGrad = ctx.createRadialGradient(-16, -18, 6, 0, 0, innerR * 1.08);
    basinGrad.addColorStop(0, '#8CE87C');
    basinGrad.addColorStop(0.38, '#3CB868');
    basinGrad.addColorStop(0.78, '#1E8A54');
    basinGrad.addColorStop(1, '#155D40');
    ctx.fillStyle = basinGrad;
    ctx.fill();

    ctx.clip();

    // Inner ambient occlusion shadow cast by the raised rim wall
    const wallAO = ctx.createRadialGradient(0, 0, innerR * 0.78, 0, 0, innerR);
    wallAO.addColorStop(0, 'rgba(12, 42, 30, 0)');
    wallAO.addColorStop(0.7, 'rgba(12, 42, 30, 0.24)');
    wallAO.addColorStop(1, 'rgba(14, 24, 30, 0.56)');
    ctx.fillStyle = wallAO;
    ctx.fillRect(-innerR - 4, -innerR - 4, innerR * 2 + 8, innerR * 2 + 8);

    // 5. Geometric concentric cross-veins (architectural Victoria amazonica ribs)
    const ringFracs = [0.26, 0.48, 0.68, 0.86];
    for (let rIdx = 0; rIdx < ringFracs.length; rIdx++) {
      const rr = innerR * ringFracs[rIdx];
      ctx.strokeStyle = rIdx % 2 === 0 ? 'rgba(190, 255, 168, 0.36)' : 'rgba(164, 245, 148, 0.28)';
      ctx.lineWidth = 1.4 - rIdx * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, TAU);
      ctx.stroke();
    }

    // 6. Primary & bifurcating radial structural ribs
    const ribCount = 16;
    for (let i = 0; i < ribCount; i++) {
      const ra = (i / ribCount) * TAU + 0.12;
      const cosR = Math.cos(ra);
      const sinR = Math.sin(ra);
      const endX = cosR * (innerR * 0.96);
      const endY = sinR * (innerR * 0.96);

      // Subtle rib shadow for 3D embossed look
      ctx.strokeStyle = 'rgba(14, 52, 36, 0.35)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(1.2, 1.5);
      ctx.lineTo(endX + 1.2, endY + 1.5);
      ctx.stroke();

      // Main bright jade-lime rib
      ctx.strokeStyle = 'rgba(198, 255, 164, 0.62)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Bifurcating Y-fork near outer ring
      const forkX = cosR * (innerR * 0.62);
      const forkY = sinR * (innerR * 0.62);
      ctx.strokeStyle = 'rgba(186, 250, 156, 0.42)';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(forkX, forkY);
      ctx.lineTo(Math.cos(ra + 0.11) * (innerR * 0.95), Math.sin(ra + 0.11) * (innerR * 0.95));
      ctx.moveTo(forkX, forkY);
      ctx.lineTo(Math.cos(ra - 0.11) * (innerR * 0.95), Math.sin(ra - 0.11) * (innerR * 0.95));
      ctx.stroke();
    }

    // Soft glossy sunlit sheen across upper-left basin
    ctx.fillStyle = 'rgba(232, 255, 206, 0.14)';
    ctx.beginPath();
    ctx.ellipse(-24, -24, 34, 20, -0.7, 0, TAU);
    ctx.fill();

    ctx.restore(); // end basin clip

    // Crisp inner rim edge outline
    this._traceNotchedCircle(ctx, innerR, notchA, notchB, 0.11, 7);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // 7. Central umbilicus stem dimple
    const hubGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9.5);
    hubGrad.addColorStop(0, '#D8FFA6');
    hubGrad.addColorStop(0.55, '#5DD468');
    hubGrad.addColorStop(1, '#1E7A48');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 8.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 236, 0.78)';
    ctx.beginPath();
    ctx.arc(-2.5, -2.5, 2.2, 0, TAU);
    ctx.fill();

    // 8. Glistening chibi water droplets
    for (let i = 0; i < this._droplets.length; i++) {
      const d = this._droplets[i];
      const wobble = 1 + Math.sin(t * 2.4 + d.phase) * 0.055;
      const rx = d.r * wobble;
      const ry = d.r / wobble;

      ctx.fillStyle = 'rgba(12, 46, 32, 0.36)';
      ctx.beginPath();
      ctx.ellipse(d.x + 1.3, d.y + 1.7, rx, ry, 0.25, 0, TAU);
      ctx.fill();

      const dGrad = ctx.createRadialGradient(d.x - rx * 0.3, d.y - ry * 0.3, 0.5, d.x, d.y, rx * 1.15);
      dGrad.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
      dGrad.addColorStop(0.45, 'rgba(182, 246, 255, 0.72)');
      dGrad.addColorStop(1, 'rgba(54, 182, 162, 0.52)');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, rx, ry, 0.25, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = 'rgba(30, 20, 43, 0.65)';
      ctx.lineWidth = 1.05;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(d.x - rx * 0.32, d.y - ry * 0.32, Math.max(1.0, d.r * 0.28), 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Amazonplatterflora;
