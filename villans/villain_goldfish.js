/**
 * Villain Oranda Goldfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Dark molten-copper chubby body, horned spiky crimson-obsidian head wen crown,
 * tattered shadowy double-veil tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.58, right_turn: 0.58, eating: 0.64, shock: 0.74 };

const POSES = {
  breathing:  { hz: 2.8, amp: 0.20, veil: 2.6, fin: 0.52, bend: 0.0,  mouth: 0.12, brow: 0.52, eye: 1.0,  aura: 0.52, jit: 0.0 },
  swimming:   { hz: 6.4, amp: 0.38, veil: 6.0, fin: 0.32, bend: 0.0,  mouth: 0.18, brow: 0.64, eye: 1.0,  aura: 0.74, jit: 0.0 },
  relax:      { hz: 1.6, amp: 0.12, veil: 1.5, fin: 0.72, bend: 0.0,  mouth: 0.06, brow: 0.26, eye: 0.46, aura: 0.38, jit: 0.0 },
  left_turn:  { hz: 5.8, amp: 0.30, veil: 5.2, fin: 0.62, bend: -0.58, mouth: 0.15, brow: 0.56, eye: 1.0,  aura: 0.66, jit: 0.0 },
  right_turn: { hz: 5.8, amp: 0.30, veil: 5.2, fin: 0.62, bend: 0.58,  mouth: 0.15, brow: 0.56, eye: 1.0,  aura: 0.66, jit: 0.0 },
  eating:     { hz: 7.8, amp: 0.28, veil: 7.0, fin: 0.68, bend: 0.0,  mouth: 1.0,  brow: 0.85, eye: 1.06, aura: 0.90, jit: 0.16 },
  hungry:     { hz: 5.2, amp: 0.26, veil: 4.8, fin: 0.56, bend: 0.0,  mouth: 0.72, brow: 0.88, eye: 1.12, aura: 0.94, jit: 0.12 },
  stress:     { hz: 9.0, amp: 0.16, veil: 8.4, fin: 0.38, bend: 0.0,  mouth: 0.34, brow: 0.94, eye: 0.28, aura: 0.82, jit: 1.16 },
  fear:       { hz: 10.2, amp: 0.24, veil: 9.2, fin: 0.82, bend: 0.0, mouth: 0.54, brow: -0.46, eye: 1.35, aura: 0.22, jit: 1.40 },
  shock:      { hz: 1.8, amp: 0.06, veil: 2.0, fin: 0.92, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.62 },
  happy:      { hz: 5.4, amp: 0.34, veil: 5.0, fin: 0.78, bend: 0.0,  mouth: 0.60, brow: 0.38, eye: 0.72, aura: 0.98, jit: 0.0 },
  sad:        { hz: 1.2, amp: 0.08, veil: 1.1, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainGoldfish {
  static metadata = {
    name: 'Villain Oranda Goldfish',
    category: 'villain_fish',
    baseLength: 78,
    baseWidth: 44,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prev = 'breathing';
    this._stateT = 0;
    this._t = 0;
    this._phase = 0;
    this._veilPhase = 0;

    this._blendDur = 0.15;
    this._blendT = 0.15;
    this._from = { ...POSES.breathing };
    this._to = { ...POSES.breathing };
    this._cur = { ...POSES.breathing };
    this._cbs = new Map();
  }

  getState() {
    return this._state;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const k = ALIASES[name] || name;
    if (!this._cbs.has(k)) this._cbs.set(k, []);
    this._cbs.get(k).push(callback);
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!POSES[next]) return;
    if ((this._state === 'shock' || this._state === 'fear') && LOCK_IGNORED.has(next)) return;
    if (next === this._state && !ONE_SHOTS.has(next)) return;

    if (ONE_SHOTS.has(next) && !ONE_SHOTS.has(this._state)) {
      this._prev = this._state;
    }
    this._state = next;
    this._stateT = 0;
    this._from = { ...this._cur };
    this._to = { ...POSES[next] };
    this._blendT = 0;
  }

  update(dt) {
    const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._t += d;
    this._stateT += d;

    if (this._blendT < this._blendDur) {
      this._blendT = Math.min(this._blendDur, this._blendT + d);
      const u = cubic(this._blendT / this._blendDur);
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._from[k] + (this._to[k] - this._from[k]) * u;
      }
    } else {
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._to[k];
      }
    }

    this._phase += d * this._cur.hz;
    this._veilPhase += d * this._cur.veil;

    if (ONE_SHOTS.has(this._state) && this._stateT >= DURATIONS[this._state]) {
      const done = this._state;
      const back = POSES[this._prev] && !ONE_SHOTS.has(this._prev) ? this._prev : 'breathing';
      this._state = back;
      this._stateT = 0;
      this._from = { ...this._cur };
      this._to = { ...POSES[back] };
      this._blendT = 0;

      const list = this._cbs.get(done);
      if (list) for (const fn of list) fn(done);
    }
  }

  draw(ctx) {
    const p = this._cur;
    const t = this._t;
    const halfL = VillainGoldfish.metadata.baseLength * 0.5;
    const halfW = VillainGoldfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 58) * p.jit * 1.1 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 64) * p.jit * 1.25 : 0;
    const puff = 1 + Math.sin(t * 3.0) * 0.025;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Molten-copper & dark-shadow aura
    this._drawMoltenAura(ctx, halfL, halfW, p.aura, t);

    // 2. Tattered shadowy double-veil tail (split twin ribbons!)
    this._drawDoubleVeilTail(ctx, -halfL * 0.34, sway * 7, wag, p.fin, t);

    // 3. Chubby tattered veil pectorals
    this._drawOrandaPectoral(ctx, 8, -halfW * 0.72, -1, p.fin);
    this._drawOrandaPectoral(ctx, 8, halfW * 0.72, 1, p.fin);

    // 4. Chubby dark molten-copper body
    ctx.save();
    ctx.scale(1, puff);
    this._drawCopperBody(ctx, halfL, halfW, sway, t);

    // 5. Horned spiky crimson-obsidian head wen crown (iconic Oranda villain wen!)
    this._drawHornedWenCrown(ctx, halfL, t);

    // 6. Shadowy dorsal crest
    this._drawDorsalVeil(ctx, sway, wag);

    // 7. Snapping little villain mouth
    this._drawOrandaMouth(ctx, halfL, p.mouth, t);

    // 8. Glowing molten-gold villain eyes
    this._drawOrandaEyes(ctx, halfL, halfW, p, t);
    ctx.restore();

    // 9. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawMoltenAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.08 + Math.sin(t * 2.3) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 5, -4, 0, r);
    g.addColorStop(0, `rgba(26, 8, 28, ${0.46 * aura})`);
    g.addColorStop(0.55, `rgba(196, 72, 22, ${0.22 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawDoubleVeilTail(ctx, tx, ty, wag, fin, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.88);

    const len = 26 + fin * 5;
    const wave = Math.sin(this._veilPhase) * 3.0;

    // Two symmetrical tattered shadowy veil lobes (double-tail Oranda)
    for (const side of [-1, 1]) {
      const g = ctx.createLinearGradient(0, 0, -len, side * 14);
      g.addColorStop(0, '#B84A18');
      g.addColorStop(0.45, '#5E1824');
      g.addColorStop(1, '#180B22');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(2, side * 2);
      ctx.bezierCurveTo(-8, side * 12 + wave * side, -len * 0.72, side * 21 - wave, -len, side * 18 + wave);
      ctx.lineTo(-len * 0.76, side * 10);
      ctx.lineTo(-len * 1.05, side * 6 - wave * 0.5);
      ctx.lineTo(-len * 0.70, side * 2);
      ctx.quadraticCurveTo(-10, side * 4, 2, side * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Molten copper sheen vein
      ctx.strokeStyle = `rgba(255, 146, 56, ${0.5 + Math.sin(t * 5 + side) * 0.2})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-2, side * 3);
      ctx.quadraticCurveTo(-len * 0.5, side * 11, -len * 0.88, side * 15);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawOrandaPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._veilPhase * 1.1 + side) * 0.18;
    ctx.rotate(side * (0.30 + fin * 0.52 + flut));

    const g = ctx.createLinearGradient(0, 0, -10, side * 17);
    g.addColorStop(0, '#D4621C');
    g.addColorStop(0.6, '#5A1624');
    g.addColorStop(1, '#1A0B22');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(4, side * 13, -4, side * 17);
    ctx.lineTo(-7, side * 11);
    ctx.lineTo(-12, side * 14);
    ctx.quadraticCurveTo(-13, side * 6, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawCopperBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 4.5;
    ctx.save();
    ctx.beginPath();
    // Plump round chubby Oranda body
    ctx.moveTo(halfL * 0.86, 0);
    ctx.bezierCurveTo(halfL * 0.82, -halfW * 1.02, halfL * 0.02, -halfW * 1.10, -halfL * 0.24, -halfW * 0.58 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.36, -halfW * 0.32 + sy, -halfL * 0.44, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.44, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.36, halfW * 0.32 + sy, -halfL * 0.24, halfW * 0.58 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.02, halfW * 1.10, halfL * 0.82, halfW * 1.02, halfL * 0.86, 0);
    ctx.closePath();

    // Dark molten-copper metallic gradient
    const bg = ctx.createRadialGradient(8, -5, 4, 2, 0, halfL * 0.78);
    bg.addColorStop(0, '#F58529');
    bg.addColorStop(0.45, '#B84214');
    bg.addColorStop(0.82, '#5E1820');
    bg.addColorStop(1, '#240B1E');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Dark metallic scale arcs across plump back
    ctx.strokeStyle = 'rgba(28, 10, 26, 0.38)';
    ctx.lineWidth = 1.1;
    for (let sx = 10; sx >= -10; sx -= 6) {
      for (let syOff = -10; syOff <= 10; syOff += 6.5) {
        ctx.beginPath();
        ctx.arc(sx, syOff, 3.2, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
      }
    }

    // Cel-shade shadow edge
    ctx.fillStyle = 'rgba(20, 8, 26, 0.32)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.68, halfL * 0.72, halfW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Molten specular shine
    ctx.fillStyle = 'rgba(255, 224, 175, 0.38)';
    ctx.beginPath();
    ctx.ellipse(6, -halfW * 0.42, 12, 4.6, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Glowing ember crack on back
    ctx.strokeStyle = `rgba(255, 160, 48, ${0.55 + Math.sin(t * 4.5) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(4, -3);
    ctx.lineTo(-2, 1);
    ctx.lineTo(-8, -2);
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawHornedWenCrown(ctx, halfL, t) {
    // Iconic Oranda head wen reimagined as a lumpy crimson-obsidian horned villain crown!
    ctx.save();
    ctx.translate(halfL * 0.56, 0);

    // Lumpy crimson-obsidian wen base
    const wg = ctx.createRadialGradient(2, 0, 1, 0, 0, 12);
    wg.addColorStop(0, '#E61E40');
    wg.addColorStop(0.65, '#8A0E28');
    wg.addColorStop(1, '#260A1E');
    ctx.fillStyle = wg;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;

    const lobes = [
      { x: 4, y: 0, r: 6.2 },
      { x: 1, y: -6.2, r: 5.2 },
      { x: 1, y: 6.2, r: 5.2 },
      { x: -3.5, y: -3.5, r: 4.8 },
      { x: -3.5, y: 3.5, r: 4.8 },
    ];
    ctx.beginPath();
    for (const l of lobes) {
      ctx.moveTo(l.x + l.r, l.y);
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Two sharp curved obsidian-gold villain horns sprouting from the wen crown
    ctx.fillStyle = '#1E1128';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(1, side * 5);
      ctx.quadraticCurveTo(6, side * 12, -2, side * 14.5);
      ctx.quadraticCurveTo(-1, side * 9, -4, side * 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing crown ember gem in center
    ctx.fillStyle = `rgba(255, 210, 68, ${0.75 + Math.sin(t * 5.5) * 0.25})`;
    ctx.beginPath();
    ctx.arc(3.5, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawDorsalVeil(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#381024';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(-4, -4.0 + sway * 2, -16, wag * 5);
    ctx.quadraticCurveTo(-4, 4.0 + sway * 2, 6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawOrandaMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.82;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.6 + snap * 3.8;
      ctx.save();
      ctx.fillStyle = '#240718';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, 0, 2.0 + snap * 2.4, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7E8';
      for (const fy of [-w * 0.5, 0, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.6, fy - 1.0);
        ctx.lineTo(mx + 4.0 + snap, fy);
        ctx.lineTo(mx + 0.6, fy + 1.0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawOrandaEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.46;
    const ey = halfW * 0.54;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.5, -side * 2.5);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-2.5, side * 2.5);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.3 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.9 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF6E8';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.4 : 2.6;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#FFF275');
      ig.addColorStop(0.55, '#FF7B1A');
      ig.addColorStop(1, '#7A120E');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.25, 0.9, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.25 - 1.0, 1.0, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 0.9, 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#4A121C';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.2, -side * (2.6 - tilt * 2.5));
      ctx.lineTo(4.6, -side * (1.4 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 195, 50, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0.8, -4.6);
        ctx.lineTo(0.8, 4.6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.3 + i * 1.57;
        const sx = 5 + Math.cos(a) * (halfL * 0.68);
        const sy = Math.sin(a) * (halfW * 1.08);
        const r = 2.9 + Math.sin(t * 7 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#FF5E1E' : '#C41848';
        ctx.beginPath();
        ctx.moveTo(sx, sy - r);
        ctx.quadraticCurveTo(sx, sy, sx + r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy + r);
        ctx.quadraticCurveTo(sx, sy, sx - r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy - r);
        ctx.fill();
      }
    } else if (this._state === 'shock') {
      ctx.save();
      ctx.translate(halfL * 0.60, -halfW * 0.98);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-2.0, -10, 4.0, 7.6, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.3, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 9;
        const x = 14 - i * 8;
        const y = -halfW * 0.88 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.quadraticCurveTo(x + 2.6, y + 1, x, y + 3);
        ctx.quadraticCurveTo(x - 2.6, y + 1, x, y - 3.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(12, -halfW * 0.86);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.7, 1.7);
        ctx.quadraticCurveTo(1.9, 4.4, 5.1, 4.7);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.44, halfW * 0.72 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 + 2.4, halfW * 0.72 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.72 + 5.6 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 - 2.4, halfW * 0.72 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.72 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainGoldfish;
