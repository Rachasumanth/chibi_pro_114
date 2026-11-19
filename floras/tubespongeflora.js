// Neon Tube Sponge Cluster — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Tubespongeflora {
  static metadata = {
    name: 'Neon Tube Sponge Cluster',
    category: 'flora',
    baseLength: 88,
    baseWidth: 88,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Chunky upright chimney tubes viewed from above (sorted back-to-front by height)
    this._tubes = [
      { x: -19, y: -15, outerR: 12.2, innerR: 6.2, phase: 0.4, tiltX: -1.4, tiltY: -1.2 },
      { x: 18, y: -16, outerR: 11.4, innerR: 5.8, phase: 1.6, tiltX: 1.3, tiltY: -1.1 },
      { x: -21, y: 12, outerR: 11.8, innerR: 6.0, phase: 2.7, tiltX: -1.5, tiltY: 1.2 },
      { x: 20, y: 14, outerR: 12.6, innerR: 6.5, phase: 3.9, tiltX: 1.6, tiltY: 1.3 },
      { x: -2, y: 21, outerR: 10.6, innerR: 5.2, phase: 5.1, tiltX: -0.2, tiltY: 1.5 },
      { x: 8, y: -3, outerR: 14.0, innerR: 7.4, phase: 0.9, tiltX: 0.6, tiltY: -0.4 },
      { x: -7, y: -2, outerR: 15.6, innerR: 8.4, phase: 2.1, tiltX: -0.5, tiltY: -0.3 },
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

  _traceWobblyRing(ctx, cx, cy, r, seed) {
    const steps = 28;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      const bump = 1 + 0.055 * Math.sin(a * 6 + seed) + 0.03 * Math.cos(a * 9 - seed * 1.4);
      const px = cx + Math.cos(a) * r * bump;
      const py = cy + Math.sin(a) * r * bump;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  _drawTube(ctx, tube, t) {
    const pulse = 1 + Math.sin(t * 2.2 + tube.phase) * 0.045;
    const outerR = tube.outerR * pulse;
    const innerR = tube.innerR * (1 + Math.sin(t * 2.2 + tube.phase - 0.5) * 0.06);
    const swayX = Math.sin(t * 1.4 + tube.phase) * 0.9;
    const swayY = Math.cos(t * 1.2 + tube.phase) * 0.7;
    const cx = tube.x + swayX;
    const cy = tube.y + swayY;

    // 1. Subtle cylindrical side-wall cast shadow
    ctx.fillStyle = 'rgba(20, 14, 30, 0.36)';
    ctx.beginPath();
    ctx.arc(cx + 2.0, cy + 2.8, outerR + 1.0, 0, TAU);
    ctx.fill();

    // 2. Thick textured neon yellow-green chimney body
    this._traceWobblyRing(ctx, cx, cy, outerR, tube.phase);
    const bodyGrad = ctx.createRadialGradient(
      cx - outerR * 0.32,
      cy - outerR * 0.32,
      innerR * 0.5,
      cx,
      cy,
      outerR * 1.12
    );
    bodyGrad.addColorStop(0, '#F6FF8A');
    bodyGrad.addColorStop(0.45, '#B8F03A');
    bodyGrad.addColorStop(0.82, '#5BB32B');
    bodyGrad.addColorStop(1, '#2D6B24');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Bold dark-plum ink outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 3. Porous sponge texture dimples (ostia) around the fleshy wall
    const dimpleCount = 7;
    const midR = (outerR + innerR) * 0.53;
    for (let i = 0; i < dimpleCount; i++) {
      const da = (i / dimpleCount) * TAU + tube.phase;
      const dx = cx + Math.cos(da) * midR;
      const dy = cy + Math.sin(da) * midR;
      ctx.fillStyle = 'rgba(40, 88, 22, 0.42)';
      ctx.beginPath();
      ctx.arc(dx, dy, 1.55, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(246, 255, 168, 0.62)';
      ctx.beginPath();
      ctx.arc(dx - 0.5, dy - 0.5, 0.7, 0, TAU);
      ctx.fill();
    }

    // 4. Glowing beveled rim collar highlight
    ctx.strokeStyle = 'rgba(248, 255, 168, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx + tube.tiltX * 0.25, cy + tube.tiltY * 0.25, innerR + 1.5, -Math.PI * 0.9, Math.PI * 0.15);
    ctx.stroke();

    // 5. Deeply shaded dark hollow osculum opening
    const holeX = cx + tube.tiltX * 0.35;
    const holeY = cy + tube.tiltY * 0.35;
    this._traceWobblyRing(ctx, holeX, holeY, innerR, tube.phase + 2.1);

    const holeGrad = ctx.createRadialGradient(
      holeX + innerR * 0.22,
      holeY + innerR * 0.22,
      0.8,
      holeX,
      holeY,
      innerR * 1.1
    );
    holeGrad.addColorStop(0, '#0E0A18');
    holeGrad.addColorStop(0.55, '#1D291C');
    holeGrad.addColorStop(0.88, '#3B6322');
    holeGrad.addColorStop(1, '#79BD32');
    ctx.fillStyle = holeGrad;
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // 6. Candy-gloss chibi rim sparkle
    ctx.fillStyle = 'rgba(255, 255, 232, 0.90)';
    ctx.beginPath();
    ctx.ellipse(
      cx - outerR * 0.44,
      cy - outerR * 0.44,
      outerR * 0.20,
      outerR * 0.11,
      -0.75,
      0,
      TAU
    );
    ctx.fill();
  }

  draw(ctx) {
    const t = this.time;
    const glowPulse = 0.72 + 0.28 * Math.sin(t * 2.4);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 4, 12, 2, 4, 43);
    aoGrad.addColorStop(0, 'rgba(18, 12, 28, 0.50)');
    aoGrad.addColorStop(0.68, 'rgba(20, 14, 30, 0.22)');
    aoGrad.addColorStop(1, 'rgba(20, 14, 30, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 4, 43, 0, TAU);
    ctx.fill();

    // 2. Neon yellow-green reef bioluminescent halo
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 44);
    auraGrad.addColorStop(0, `rgba(188, 255, 72, ${(0.28 * glowPulse).toFixed(3)})`);
    auraGrad.addColorStop(0.65, `rgba(116, 224, 54, ${(0.12 * glowPulse).toFixed(3)})`);
    auraGrad.addColorStop(1, 'rgba(116, 224, 54, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();

    // 3. Fleshy encrusting sponge base uniting the cluster
    const baseGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, 30);
    baseGrad.addColorStop(0, '#86D632');
    baseGrad.addColorStop(0.7, '#4B8E26');
    baseGrad.addColorStop(1, '#26521E');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(0, 1, 27, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 4. Draw all 7 chunky upright chimney tubes
    for (let i = 0; i < this._tubes.length; i++) {
      this._drawTube(ctx, this._tubes[i], t);
    }

    // 5. Tiny shimmering plankton/filter-feeding motes rising from the main tubes
    for (let i = 0; i < 4; i++) {
      const phase = ((t * 0.55 + i * 0.25) % 1);
      const mx = (i % 2 === 0 ? -7 : 8) + Math.sin(t * 2.5 + i * 2) * 3.5;
      const my = -2 - phase * 12;
      const alpha = Math.sin(phase * Math.PI) * 0.78;
      ctx.fillStyle = `rgba(242, 255, 152, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mx, my, 1.5, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Tubespongeflora;
