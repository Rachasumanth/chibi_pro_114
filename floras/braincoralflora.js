// Grooved Brain Coral — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Braincoralflora {
  static metadata = {
    name: 'Grooved Brain Coral',
    category: 'flora',
    baseLength: 120,
    baseWidth: 120,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Hand-authored meandroid labyrinthine ridges (normalized coordinates scaled by domeR)
    this._ridges = [
      // Central S-curve gyrus
      {
        hue: 'teal',
        pts: [
          [-0.26, -0.14],
          [-0.08, -0.24],
          [0.10, -0.08],
          [-0.04, 0.10],
          [0.18, 0.22],
          [0.32, 0.08],
        ],
      },
      // Upper crescent gyrus
      {
        hue: 'violet',
        pts: [
          [-0.56, -0.34],
          [-0.36, -0.54],
          [-0.08, -0.58],
          [0.20, -0.50],
          [0.44, -0.36],
        ],
      },
      // Upper-inner arch
      {
        hue: 'teal',
        pts: [
          [-0.44, -0.18],
          [-0.28, -0.38],
          [0.02, -0.40],
          [0.28, -0.26],
          [0.52, -0.14],
        ],
      },
      // Left sweeping lobe
      {
        hue: 'violet',
        pts: [
          [-0.72, -0.12],
          [-0.64, 0.14],
          [-0.46, 0.06],
          [-0.38, 0.28],
          [-0.58, 0.44],
        ],
      },
      // Lower-left to bottom-center meander
      {
        hue: 'teal',
        pts: [
          [-0.44, 0.60],
          [-0.20, 0.48],
          [-0.18, 0.28],
          [0.04, 0.36],
          [0.06, 0.62],
        ],
      },
      // Bottom-right sweeping gyrus
      {
        hue: 'violet',
        pts: [
          [0.22, 0.58],
          [0.42, 0.46],
          [0.34, 0.26],
          [0.56, 0.22],
          [0.68, 0.02],
        ],
      },
      // Outer top-left rim fold
      {
        hue: 'teal',
        pts: [
          [-0.68, -0.36],
          [-0.48, -0.64],
          [-0.16, -0.74],
        ],
      },
      // Outer top-right rim fold
      {
        hue: 'teal',
        pts: [
          [0.14, -0.72],
          [0.46, -0.60],
          [0.68, -0.34],
        ],
      },
      // Outer bottom-right rim fold
      {
        hue: 'teal',
        pts: [
          [0.72, 0.22],
          [0.56, 0.56],
          [0.26, 0.72],
        ],
      },
      // Outer bottom-left rim fold
      {
        hue: 'violet',
        pts: [
          [-0.14, 0.74],
          [-0.48, 0.66],
          [-0.70, 0.36],
        ],
      },
    ];

    // Tiny pulsing bioluminescent polyps nestled inside the coral valleys
    this._polyps = [
      { x: -0.16, y: -0.31, phase: 0.2, r: 3.1, color: '#8CFDF0' },
      { x: 0.16, y: -0.34, phase: 1.1, r: 2.8, color: '#E2A6FF' },
      { x: -0.34, y: -0.04, phase: 2.0, r: 3.2, color: '#8CFDF0' },
      { x: 0.02, y: 0.01, phase: 2.8, r: 3.4, color: '#A5FFE8' },
      { x: 0.38, y: -0.06, phase: 3.5, r: 3.0, color: '#E2A6FF' },
      { x: -0.26, y: 0.36, phase: 4.2, r: 2.9, color: '#8CFDF0' },
      { x: 0.24, y: 0.38, phase: 5.0, r: 3.1, color: '#A5FFE8' },
      { x: -0.52, y: 0.24, phase: 5.7, r: 2.6, color: '#E2A6FF' },
      { x: 0.48, y: 0.34, phase: 0.9, r: 2.7, color: '#8CFDF0' },
      { x: -0.02, y: -0.52, phase: 1.7, r: 2.6, color: '#E2A6FF' },
      { x: -0.06, y: 0.54, phase: 3.1, r: 2.8, color: '#8CFDF0' },
      { x: 0.54, y: -0.26, phase: 4.6, r: 2.5, color: '#A5FFE8' },
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

  _traceSmoothPath(ctx, pts, radius) {
    ctx.beginPath();
    const x0 = pts[0][0] * radius;
    const y0 = pts[0][1] * radius;
    ctx.moveTo(x0, y0);
    for (let i = 1; i < pts.length - 1; i++) {
      const cx = pts[i][0] * radius;
      const cy = pts[i][1] * radius;
      const nx = pts[i + 1][0] * radius;
      const ny = pts[i + 1][1] * radius;
      ctx.quadraticCurveTo(cx, cy, (cx + nx) * 0.5, (cy + ny) * 0.5);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * radius, last[1] * radius);
  }

  _drawScallopedDomePath(ctx, r, t) {
    const lobes = 14;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * TAU;
      const scallop = 1 + 0.032 * Math.sin(a * lobes) + 0.012 * Math.sin(a * 5 + t * 1.2);
      const px = Math.cos(a) * r * scallop;
      const py = Math.sin(a) * r * scallop;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  draw(ctx) {
    const t = this.time;
    const pulse = 1 + Math.sin(t * 2.0) * 0.028;
    const glowPulse = 0.72 + 0.28 * Math.sin(t * 2.4);
    const domeR = 47 * pulse;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(3, 5, 16, 3, 5, 58);
    aoGrad.addColorStop(0, 'rgba(18, 10, 32, 0.52)');
    aoGrad.addColorStop(0.68, 'rgba(20, 12, 36, 0.26)');
    aoGrad.addColorStop(1, 'rgba(20, 12, 36, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(3, 5, 58, 0, TAU);
    ctx.fill();

    // 2. Soft bioluminescent teal-violet halo
    const haloGrad = ctx.createRadialGradient(0, 0, domeR * 0.65, 0, 0, 58);
    haloGrad.addColorStop(0, `rgba(62, 232, 212, ${(0.28 * glowPulse).toFixed(3)})`);
    haloGrad.addColorStop(0.55, `rgba(155, 108, 255, ${(0.16 * glowPulse).toFixed(3)})`);
    haloGrad.addColorStop(1, 'rgba(155, 108, 255, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, TAU);
    ctx.fill();

    // 3. Main dome body (clipped for crisp internal labyrinthine shading)
    ctx.save();
    this._drawScallopedDomePath(ctx, domeR, t);

    const baseGrad = ctx.createRadialGradient(-12, -14, 5, 0, 0, domeR * 1.12);
    baseGrad.addColorStop(0, '#2B6E7D');
    baseGrad.addColorStop(0.45, '#253D69');
    baseGrad.addColorStop(0.82, '#2B2152');
    baseGrad.addColorStop(1, '#1A1332');
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.clip();

    // 4. Deeply shaded labyrinthine ridges (multi-pass per gyrus)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this._ridges.length; i++) {
      const ridge = this._ridges[i];
      const isTeal = ridge.hue === 'teal';
      const shimmer = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.7);

      // Pass A: Deep dark-plum valley trench shadow
      this._traceSmoothPath(ctx, ridge.pts, domeR);
      ctx.strokeStyle = 'rgba(18, 10, 34, 0.88)';
      ctx.lineWidth = 13.5;
      ctx.stroke();

      // Pass B: Thick glowing coral wall body
      this._traceSmoothPath(ctx, ridge.pts, domeR);
      ctx.strokeStyle = isTeal ? '#1FA8A0' : '#7C4FD4';
      ctx.lineWidth = 9.2;
      ctx.stroke();

      // Pass C: Raised luminescent ridge crest
      this._traceSmoothPath(ctx, ridge.pts, domeR);
      ctx.strokeStyle = isTeal
        ? `rgba(116, 252, 232, ${(0.76 + shimmer * 0.22).toFixed(3)})`
        : `rgba(208, 152, 255, ${(0.72 + shimmer * 0.22).toFixed(3)})`;
      ctx.lineWidth = 4.6;
      ctx.stroke();

      // Pass D: Crisp inner top-edge highlight
      this._traceSmoothPath(ctx, ridge.pts, domeR);
      ctx.strokeStyle = isTeal ? 'rgba(222, 255, 250, 0.75)' : 'rgba(246, 224, 255, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Pass E: Fine septal teeth perpendicular across the ridge
      ctx.save();
      ctx.strokeStyle = isTeal ? 'rgba(14, 72, 76, 0.45)' : 'rgba(48, 22, 92, 0.45)';
      ctx.lineWidth = 1.1;
      for (let j = 0; j < ridge.pts.length - 1; j++) {
        const ax = ridge.pts[j][0] * domeR;
        const ay = ridge.pts[j][1] * domeR;
        const bx = ridge.pts[j + 1][0] * domeR;
        const by = ridge.pts[j + 1][1] * domeR;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const steps = Math.max(2, Math.floor(len / 5.5));
        for (let s = 1; s < steps; s++) {
          const f = s / steps;
          const mx = ax + dx * f;
          const my = ay + dy * f;
          ctx.beginPath();
          ctx.moveTo(mx - nx * 4.2, my - ny * 4.2);
          ctx.lineTo(mx + nx * 4.2, my + ny * 4.2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. Spherical dome vignette & rim subsurface sheen
    const domeShade = ctx.createRadialGradient(-14, -16, 10, 0, 0, domeR * 1.05);
    domeShade.addColorStop(0, 'rgba(180, 255, 248, 0.14)');
    domeShade.addColorStop(0.62, 'rgba(20, 14, 42, 0)');
    domeShade.addColorStop(1, 'rgba(18, 10, 32, 0.56)');
    ctx.fillStyle = domeShade;
    ctx.fillRect(-domeR - 4, -domeR - 4, domeR * 2 + 8, domeR * 2 + 8);

    // 6. Softly pulsing tiny translucent polyps nestled in the valleys
    for (let i = 0; i < this._polyps.length; i++) {
      const p = this._polyps[i];
      const px = p.x * domeR;
      const py = p.y * domeR;
      const pPulse = 0.65 + 0.35 * Math.sin(t * 2.8 + p.phase);
      const pr = p.r * (0.85 + 0.3 * pPulse);

      // Polyp glow
      const pg = ctx.createRadialGradient(px, py, 0.5, px, py, pr * 2.4);
      pg.addColorStop(0, p.color);
      pg.addColorStop(1, 'rgba(140, 253, 240, 0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, pr * 2.4, 0, TAU);
      ctx.fill();

      // 6 tiny swaying polyp tentacles
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.05;
      for (let k = 0; k < 6; k++) {
        const ka = (k / 6) * TAU + Math.sin(t * 2.3 + p.phase + k) * 0.25;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(ka) * (pr * 1.45), py + Math.sin(ka) * (pr * 1.45));
        ctx.stroke();
      }

      // Bright polyp center
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.45, 0, TAU);
      ctx.fill();
    }

    // 7. Candy-gloss chibi dome highlight
    ctx.fillStyle = 'rgba(232, 255, 252, 0.26)';
    ctx.beginPath();
    ctx.ellipse(-domeR * 0.34, -domeR * 0.36, domeR * 0.34, domeR * 0.16, -0.72, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
    ctx.beginPath();
    ctx.ellipse(-domeR * 0.42, -domeR * 0.42, domeR * 0.14, domeR * 0.07, -0.72, 0, TAU);
    ctx.fill();

    ctx.restore(); // end clip

    // 8. Bold dark-plum chibi ink outline around scalloped dome
    this._drawScallopedDomePath(ctx, domeR, t);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }
}

export default Braincoralflora;
