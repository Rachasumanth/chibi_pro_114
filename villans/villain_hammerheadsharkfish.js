/**
 * Villain Great Hammerhead Shark — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Dark obsidian-slate shark with studded iron-riveted T-hammer head,
 * glowing amber villain eyes on outer tips, notched tall dorsal fin.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.66, right_turn: 0.66, eating: 0.70, shock: 0.78 };

const POSES = {
  breathing:  { hz: 2.0, amp: 0.16, fin: 0.44, bend: 0.0,  mouth: 0.15, brow: 0.62, eye: 1.0,  aura: 0.60, jit: 0.0 },
  swimming:   { hz: 5.0, amp: 0.36, fin: 0.25, bend: 0.0,  mouth: 0.24, brow: 0.72, eye: 1.0,  aura: 0.84, jit: 0.0 },
  relax:      { hz: 1.2, amp: 0.10, fin: 0.64, bend: 0.0,  mouth: 0.08, brow: 0.32, eye: 0.46, aura: 0.44, jit: 0.0 },
  left_turn:  { hz: 4.6, amp: 0.30, fin: 0.56, bend: -0.56, mouth: 0.22, brow: 0.66, eye: 1.0,  aura: 0.76, jit: 0.0 },
  right_turn: { hz: 4.6, amp: 0.30, fin: 0.56, bend: 0.56,  mouth: 0.22, brow: 0.66, eye: 1.0,  aura: 0.76, jit: 0.0 },
  eating:     { hz: 6.6, amp: 0.28, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.88, eye: 1.08, aura: 0.98, jit: 0.20 },
  hungry:     { hz: 4.4, amp: 0.24, fin: 0.52, bend: 0.0,  mouth: 0.76, brow: 0.92, eye: 1.14, aura: 0.96, jit: 0.15 },
  stress:     { hz: 8.0, amp: 0.15, fin: 0.36, bend: 0.0,  mouth: 0.38, brow: 0.96, eye: 0.28, aura: 0.86, jit: 1.38 },
  fear:       { hz: 9.2, amp: 0.22, fin: 0.78, bend: 0.0,  mouth: 0.56, brow: -0.45, eye: 1.36, aura: 0.24, jit: 1.60 },
  shock:      { hz: 1.5, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.84, brow: -0.60, eye: 1.48, aura: 0.22, jit: 1.85 },
  happy:      { hz: 4.4, amp: 0.32, fin: 0.72, bend: 0.0,  mouth: 0.64, brow: 0.42, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.0, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.05, brow: -0.35, eye: 0.66, aura: 0.24, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainHammerheadsharkfish {
  static metadata = {
    name: 'Villain Great Hammerhead Shark',
    category: 'villain_fish',
    baseLength: 210,
    baseWidth: 92,
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
    const halfL = VillainHammerheadsharkfish.metadata.baseLength * 0.5;
    const halfW = VillainHammerheadsharkfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.64;
    const sway = Math.sin(this._phase - 0.82) * p.amp * 0.28 + p.bend * 0.34;
    const jx = p.jit > 0 ? Math.sin(t * 55) * p.jit * 1.4 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 62) * p.jit * 1.6 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Obsidian-slate & molten-amber aura
    this._drawHammerAura(ctx, halfL, halfW, p.aura, t);

    // 2. Swept notched shark pectorals
    this._drawHammerPectoral(ctx, 18, -21, -1, p.fin);
    this._drawHammerPectoral(ctx, 18, 21, 1, p.fin);

    // 3. Notched pelvic fins
    this._drawHammerPelvic(ctx, -28, -13 + sway * 8, -1);
    this._drawHammerPelvic(ctx, -28, 13 + sway * 8, 1);

    // 4. Sweeping jagged sickle-crescent tail
    this._drawHammerTail(ctx, -halfL * 0.66, sway * 14, wag);

    // 5. Dark obsidian-slate body + studded iron-riveted T-hammer head
    this._drawHammerBodyAndHead(ctx, halfL, halfW, sway, t);

    // 6. Iconic notched tall sickle dorsal fin
    this._drawTallNotchedDorsal(ctx, sway, wag);

    // 7. Snapping fanged jaws under T-hammer snout
    this._drawHammerMouth(ctx, halfL, p.mouth, t);

    // 8. Glowing amber villain eyes mounted on the outer tips of the T-hammer!
    this._drawOuterTipEyes(ctx, halfL, halfW, p, t);

    // 9. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawHammerAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.06 + Math.sin(t * 2.0) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 14, -4, 0, r);
    g.addColorStop(0, `rgba(18, 10, 28, ${0.50 * aura})`);
    g.addColorStop(0.55, `rgba(225, 136, 18, ${0.22 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHammerPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.85 + side) * 0.12;
    ctx.rotate(side * (0.16 + fin * 0.28 + flut));

    const g = ctx.createLinearGradient(12, 0, -22, side * 40);
    g.addColorStop(0, '#444C64');
    g.addColorStop(0.55, '#222638');
    g.addColorStop(1, '#120D1E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(8, side * 22, -22, side * 42);
    ctx.lineTo(-19, side * 28);
    ctx.lineTo(-26, side * 24);
    ctx.lineTo(-18, side * 14);
    ctx.lineTo(-20, side * 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawHammerPelvic(ctx, ox, oy, side) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#25293B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.quadraticCurveTo(-1, side * 14, -12, side * 17);
    ctx.lineTo(-11, side * 8);
    ctx.lineTo(-14, side * 5);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawHammerTail(ctx, tx, ty, wag) {
    ctx.save();
    ctx.translate(tx, ty * 0.45);
    ctx.rotate(wag * 0.88);

    const g = ctx.createLinearGradient(0, 0, -40, 0);
    g.addColorStop(0, '#3C4258');
    g.addColorStop(0.55, '#1D2030');
    g.addColorStop(1, '#120B1C');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(-12, -20, -39, -34);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-30, -8);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-30, 8);
    ctx.lineTo(-24, 14);
    ctx.lineTo(-39, 34);
    ctx.quadraticCurveTo(-12, 20, 4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawHammerBodyAndHead(ctx, halfL, halfW, sway, t) {
    const sy = sway * 13;
    const torsoW = 24;

    ctx.save();
    // 1. Sleek obsidian-slate shark torso
    ctx.beginPath();
    ctx.moveTo(halfL * 0.72, 0);
    ctx.bezierCurveTo(halfL * 0.56, -torsoW * 0.92, halfL * 0.10, -torsoW * 1.05, -halfL * 0.24, -torsoW * 0.62 + sy * 0.42);
    ctx.quadraticCurveTo(-halfL * 0.52, -torsoW * 0.30 + sy, -halfL * 0.68, -torsoW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.68, torsoW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.52, torsoW * 0.30 + sy, -halfL * 0.24, torsoW * 0.62 + sy * 0.42);
    ctx.bezierCurveTo(halfL * 0.10, torsoW * 1.05, halfL * 0.56, torsoW * 0.92, halfL * 0.72, 0);
    ctx.closePath();

    const bg = ctx.createLinearGradient(halfL * 0.75, -torsoW, -halfL * 0.7, torsoW);
    bg.addColorStop(0, '#4E5770');
    bg.addColorStop(0.45, '#2A2F44');
    bg.addColorStop(0.82, '#1A1C2C');
    bg.addColorStop(1, '#100C1A');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Glowing amber gill slits (5 per side)
    const pulse = 0.75 + Math.sin(t * 5.2) * 0.25;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = 38 - g * 5.8;
        ctx.strokeStyle = `rgba(255, 170, 28, ${pulse})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx + 1.2, side * 21);
        ctx.lineTo(gx - 1.2, side * 14);
        ctx.stroke();
      }
    }

    // Cel-shade lower flank
    ctx.fillStyle = 'rgba(14, 6, 22, 0.34)';
    ctx.beginPath();
    ctx.ellipse(2, torsoW * 0.65, halfL * 0.72, torsoW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular slate highlight
    ctx.fillStyle = 'rgba(205, 220, 250, 0.26)';
    ctx.beginPath();
    ctx.ellipse(16, -torsoW * 0.36, 36, 5.5, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 2. Studded iron-riveted T-hammer cephalofoil head!
    const hx = halfL * 0.66;
    const hHalfW = halfW * 0.94;
    const hg = ctx.createLinearGradient(hx + 22, 0, hx - 12, 0);
    hg.addColorStop(0, '#6B748F');
    hg.addColorStop(0.45, '#3A4056');
    hg.addColorStop(1, '#1D1F30');

    ctx.fillStyle = hg;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.9;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(hx + 18, 0);
    // Scalloped front edge of hammerhead
    ctx.quadraticCurveTo(hx + 20, -hHalfW * 0.45, hx + 14, -hHalfW * 0.92);
    ctx.quadraticCurveTo(hx + 4, -hHalfW * 1.04, hx - 6, -hHalfW * 0.90);
    ctx.quadraticCurveTo(hx - 11, -hHalfW * 0.42, hx - 14, -15);
    ctx.lineTo(hx - 14, 15);
    ctx.quadraticCurveTo(hx - 11, hHalfW * 0.42, hx - 6, hHalfW * 0.90);
    ctx.quadraticCurveTo(hx + 4, hHalfW * 1.04, hx + 14, hHalfW * 0.92);
    ctx.quadraticCurveTo(hx + 20, hHalfW * 0.45, hx + 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron armor plate seam & metallic rivets across the T-hammer bar
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx + 4, -hHalfW * 0.85);
    ctx.lineTo(hx + 4, hHalfW * 0.85);
    ctx.stroke();

    // Studded iron rivets & front battering studs
    for (let ry = -hHalfW * 0.72; ry <= hHalfW * 0.72; ry += 11) {
      // Rivet dome
      ctx.fillStyle = '#B8C2DB';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx - 2.5, ry, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Front iron battering spike
      ctx.fillStyle = '#D5DFF5';
      ctx.beginPath();
      ctx.moveTo(hx + 16, ry - 2.6);
      ctx.lineTo(hx + 24, ry);
      ctx.lineTo(hx + 16, ry + 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawTallNotchedDorsal(ctx, sway, wag) {
    // Tall battle-notched sickle dorsal fin characteristic of Great Hammerhead
    ctx.save();
    ctx.fillStyle = '#25293C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(2, -7.5 + sway * 3, -30, -4.5 + sway * 6);
    ctx.lineTo(-22, -1 + sway * 5);
    ctx.lineTo(-34, wag * 9);
    ctx.lineTo(-22, 1 + sway * 5);
    ctx.lineTo(-30, 4.5 + sway * 6);
    ctx.quadraticCurveTo(2, 7.5 + sway * 3, 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#FFB422';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-28, wag * 8);
    ctx.stroke();
    ctx.restore();
  }

  _drawHammerMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.78;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 13)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.18 || this._state === 'happy') {
      const w = 5.5 + snap * 8.0;
      ctx.save();
      ctx.fillStyle = '#2A0716';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(mx + 6, 0, 3.8 + snap * 4.2, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7E8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      for (const fy of [-w * 0.62, -w * 0.22, w * 0.22, w * 0.62]) {
        ctx.beginPath();
        ctx.moveTo(mx + 5.5, fy - 1.9);
        ctx.lineTo(mx + 11.5 + snap * 2.2, fy);
        ctx.lineTo(mx + 5.5, fy + 1.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawOuterTipEyes(ctx, halfL, halfW, p, t) {
    // Glowing amber villain eyes mounted on the outer tips of the T-hammer head!
    const ex = halfL * 0.71;
    const ey = halfW * 0.88;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FFB418';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.4, -side * 3.4);
        ctx.lineTo(3.0, 0);
        ctx.lineTo(-3.4, side * 3.4);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 5.6 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 4.8 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.6, ry + 1.4, side * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF7E4';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Glowing molten-amber iris
      const ir = this._state === 'shock' ? 1.8 : 3.4;
      const ig = ctx.createRadialGradient(0.5, 0, 0.4, 0.5, 0, ir);
      ig.addColorStop(0, '#FFF68A');
      ig.addColorStop(0.52, '#FF9E00');
      ig.addColorStop(1, '#7A1C00');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.9, side * 0.3, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(1.1, side * 0.3, 1.15, ir * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(2.1, side * 0.3 - 1.3, 1.25, 0, Math.PI * 2);
      ctx.arc(-0.5, side * 0.3 + 1.2, 0.65, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#2B3046';
        ctx.beginPath();
        ctx.ellipse(-1.1, 0, rx + 0.5, ry * 0.56, side * 0.12, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.58;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5.8, -side * (3.6 - tilt * 3.0));
      ctx.lineTo(6.4, -side * (1.8 + tilt * 3.2));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 200, 48, ${0.7 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(1.0, -6.2);
        ctx.lineTo(1.0, 6.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.0 + i * 1.57;
        const sx = 12 + Math.cos(a) * (halfL * 0.65);
        const sy = Math.sin(a) * (halfW * 0.92);
        const r = 4.2 + Math.sin(t * 7 + i) * 1.2;
        ctx.fillStyle = i % 2 === 0 ? '#FFB800' : '#9B30FF';
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
      ctx.translate(halfL * 0.72, -halfW * 1.12);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(-2.8, -14, 5.6, 10.5, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 2.2, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 8) % 13;
        const x = 52 - i * 16;
        const y = -halfW * 0.96 - d * 0.65;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 5.0);
        ctx.quadraticCurveTo(x + 3.8, y + 1.4, x, y + 4.4);
        ctx.quadraticCurveTo(x - 3.8, y + 1.4, x, y - 5.0);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(54, -halfW * 0.55);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(2.4, 2.4);
        ctx.quadraticCurveTo(2.8, 6.2, 7.2, 6.6);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 9;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.68, halfW * 1.0 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.68 + 3.2, halfW * 1.0 + 5.5 + dy * 0.5, halfL * 0.68, halfW * 1.0 + 8.0 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.68 - 3.2, halfW * 1.0 + 5.5 + dy * 0.5, halfL * 0.68, halfW * 1.0 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainHammerheadsharkfish;
