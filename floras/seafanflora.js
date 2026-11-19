// Gorgonian Sea Fan — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Seafanflora {
  static metadata = {
    name: 'Gorgonian Sea Fan',
    category: 'flora',
    baseLength: 115,
    baseWidth: 115,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Horizontal fan architecture: 7 primary gorgonian boughs fanning across a lush 230-degree arc
    this._boughs = [
      { angle: -2.02, len: 50, baseW: 5.2, phase: 0.1 },
      { angle: -1.36, len: 54, baseW: 5.6, phase: 0.6 },
      { angle: -0.68, len: 56, baseW: 6.0, phase: 1.1 },
      { angle: 0.00, len: 57, baseW: 6.2, phase: 1.6 },
      { angle: 0.68, len: 56, baseW: 6.0, phase: 2.1 },
      { angle: 1.36, len: 54, baseW: 5.6, phase: 2.6 },
      { angle: 2.02, len: 50, baseW: 5.2, phase: 3.1 },
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

  _evalBoughPoint(bough, u, t, originX, originY) {
    // Smooth ocean current flexing across the entire fan
    const flex = Math.sin(t * 1.6 + bough.phase * 0.55) * 0.11 * u * u;
    const flutter = Math.sin(t * 2.4 + bough.phase + u * 3.0) * 0.04 * u;
    const a = bough.angle + flex + flutter;
    const r = u * bough.len;
    return {
      x: originX + Math.cos(a) * r,
      y: originY + Math.sin(a) * r,
      a,
      u,
    };
  }

  draw(ctx) {
    const t = this.time;
    const originX = -6;
    const originY = 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 4, 10, 2, 4, 56);
    aoGrad.addColorStop(0, 'rgba(22, 10, 34, 0.44)');
    aoGrad.addColorStop(0.62, 'rgba(26, 12, 38, 0.18)');
    aoGrad.addColorStop(1, 'rgba(26, 12, 38, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 4, 56, 0, TAU);
    ctx.fill();

    // 2. Soft magenta-violet subsurface aura
    const auraGrad = ctx.createRadialGradient(4, 0, 8, 4, 0, 56);
    auraGrad.addColorStop(0, 'rgba(232, 78, 214, 0.22)');
    auraGrad.addColorStop(0.65, 'rgba(138, 56, 224, 0.10)');
    auraGrad.addColorStop(1, 'rgba(138, 56, 224, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(4, 0, 56, 0, TAU);
    ctx.fill();

    // Precompute sample points along each primary bough for accurate cross-webbing
    const rings = 5;
    const boughSamples = this._boughs.map((b) => {
      const pts = [];
      for (let s = 0; s <= rings; s++) {
        pts.push(this._evalBoughPoint(b, s / rings, t, originX, originY));
      }
      return pts;
    });

    const polypSpots = [];

    // 3. Intricate anastomosing lattice web filaments connecting adjacent boughs
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let bIdx = 0; bIdx < boughSamples.length - 1; bIdx++) {
      const leftPts = boughSamples[bIdx];
      const rightPts = boughSamples[bIdx + 1];

      for (let s = 1; s <= rings; s++) {
        const p1 = leftPts[s];
        const p2 = rightPts[s];
        const midX = (p1.x + p2.x) * 0.5 + Math.cos((p1.a + p2.a) * 0.5) * 2.5;
        const midY = (p1.y + p2.y) * 0.5 + Math.sin((p1.a + p2.a) * 0.5) * 2.5;

        // Outer dark-plum outline of lattice strand
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx.strokeStyle = INK;
        ctx.lineWidth = s === rings ? 3.2 : 2.6;
        ctx.stroke();

        // Magenta-violet lattice strand
        ctx.strokeStyle = s >= 4 ? '#F266C8' : '#B542C4';
        ctx.lineWidth = s === rings ? 1.5 : 1.25;
        ctx.stroke();

        // Diagonal secondary web struts for authentic gorgonian mesh
        if (s < rings) {
          const pNext = rightPts[s + 1];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(pNext.x, pNext.y);
          ctx.strokeStyle = 'rgba(226, 98, 212, 0.72)';
          ctx.lineWidth = 1.1;
          ctx.stroke();

          polypSpots.push({ x: midX, y: midY, phase: bIdx * 0.9 + s * 0.7 });
        }
      }
    }

    // 4. Primary branching gorgonian boughs + forked outer tips
    for (let i = 0; i < this._boughs.length; i++) {
      const b = this._boughs[i];
      const pts = boughSamples[i];
      const tip = pts[rings];

      // Secondary dichotomous side forks near the rim
      const forkBase = pts[rings - 1];
      for (const side of [-1, 1]) {
        const fa = forkBase.a + side * 0.34;
        const fx = forkBase.x + Math.cos(fa) * 14;
        const fy = forkBase.y + Math.sin(fa) * 14;

        ctx.beginPath();
        ctx.moveTo(forkBase.x, forkBase.y);
        ctx.lineTo(fx, fy);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 4.2;
        ctx.stroke();
        ctx.strokeStyle = '#E855BE';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        polypSpots.push({ x: fx, y: fy, phase: i * 1.1 + side });
      }

      // Main bough spine
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let s = 1; s <= rings; s++) {
        ctx.lineTo(pts[s].x, pts[s].y);
      }

      // Bold chibi ink outline
      ctx.strokeStyle = INK;
      ctx.lineWidth = b.baseW + 3.2;
      ctx.stroke();

      // Rich violet-to-magenta gradient bough
      const bGrad = ctx.createLinearGradient(originX, originY, tip.x, tip.y);
      bGrad.addColorStop(0, '#5A1B7A');
      bGrad.addColorStop(0.5, '#A634B8');
      bGrad.addColorStop(0.85, '#EE5AC4');
      bGrad.addColorStop(1, '#FF9CE4');
      ctx.strokeStyle = bGrad;
      ctx.lineWidth = b.baseW * 0.72;
      ctx.stroke();

      // Glossy inner highlight line
      ctx.strokeStyle = 'rgba(255, 214, 248, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Collect polyp dot positions along bough
      for (let s = 1; s <= rings; s++) {
        polypSpots.push({ x: pts[s].x, y: pts[s].y, phase: i * 0.7 + s * 0.9 });
      }
    }

    // 5. Tiny glowing white polyp dots pulsing gently across the lattice
    for (let i = 0; i < polypSpots.length; i++) {
      const p = polypSpots[i];
      const pulse = 0.65 + 0.35 * Math.sin(t * 2.8 + p.phase);
      const pr = 1.45 * (0.85 + 0.3 * pulse);

      ctx.fillStyle = `rgba(255, 245, 255, ${(0.72 + 0.28 * pulse).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, pr, 0, TAU);
      ctx.fill();
    }

    // 6. Encrusted violet-plum holdfast base at the fan hub
    const hubGrad = ctx.createRadialGradient(originX - 2.5, originY - 2.5, 1, originX, originY, 11);
    hubGrad.addColorStop(0, '#D466E8');
    hubGrad.addColorStop(0.55, '#7A239A');
    hubGrad.addColorStop(1, '#3B1152');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(originX, originY, 9.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.3;
    ctx.stroke();

    // Candy-gloss holdfast highlight
    ctx.fillStyle = 'rgba(255, 232, 255, 0.78)';
    ctx.beginPath();
    ctx.ellipse(originX - 3.0, originY - 3.0, 3.0, 1.7, -0.7, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

export default Seafanflora;
