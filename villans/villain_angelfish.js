/**
 * Villain Freshwater Angelfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Tarnished dark-silver disc body, jagged crimson-edged black war-stripes,
 * razor-tipped swept-back fins, glowing ruby eyes.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_SET = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const SHOT_DUR = { left_turn: 0.56, right_turn: 0.56, eating: 0.62, shock: 0.72 };

const POSE_TABLE = {
  breathing:  { tailHz: 2.8, tailMag: 0.16, finSweep: 0.45, bend: 0.0,  mouth: 0.10, brow: 0.52, eyeH: 1.0,  aura: 0.50, vib: 0.0 },
  swimming:   { tailHz: 6.5, tailMag: 0.34, finSweep: 0.25, bend: 0.0,  mouth: 0.16, brow: 0.64, eyeH: 1.0,  aura: 0.72, vib: 0.0 },
  relax:      { tailHz: 1.6, tailMag: 0.10, finSweep: 0.66, bend: 0.0,  mouth: 0.06, brow: 0.28, eyeH: 0.46, aura: 0.36, vib: 0.0 },
  left_turn:  { tailHz: 6.0, tailMag: 0.28, finSweep: 0.58, bend: -0.58, mouth: 0.15, brow: 0.58, eyeH: 1.0,  aura: 0.65, vib: 0.0 },
  right_turn: { tailHz: 6.0, tailMag: 0.28, finSweep: 0.58, bend: 0.58,  mouth: 0.15, brow: 0.58, eyeH: 1.0,  aura: 0.65, vib: 0.0 },
  eating:     { tailHz: 7.8, tailMag: 0.28, finSweep: 0.62, bend: 0.0,  mouth: 1.0,  brow: 0.84, eyeH: 1.05, aura: 0.88, vib: 0.16 },
  hungry:     { tailHz: 5.2, tailMag: 0.24, finSweep: 0.52, bend: 0.0,  mouth: 0.70, brow: 0.88, eyeH: 1.12, aura: 0.92, vib: 0.12 },
  stress:     { tailHz: 8.8, tailMag: 0.15, finSweep: 0.38, bend: 0.0,  mouth: 0.32, brow: 0.92, eyeH: 0.30, aura: 0.80, vib: 1.15 },
  fear:       { tailHz: 10.2, tailMag: 0.22, finSweep: 0.78, bend: 0.0, mouth: 0.54, brow: -0.46, eyeH: 1.34, aura: 0.22, vib: 1.38 },
  shock:      { tailHz: 1.9, tailMag: 0.06, finSweep: 0.88, bend: 0.0,  mouth: 0.80, brow: -0.58, eyeH: 1.46, aura: 0.20, vib: 1.62 },
  happy:      { tailHz: 5.2, tailMag: 0.30, finSweep: 0.72, bend: 0.0,  mouth: 0.58, brow: 0.38, eyeH: 0.72, aura: 0.96, vib: 0.0 },
  sad:        { tailHz: 1.2, tailMag: 0.08, finSweep: 0.16, bend: 0.0,  mouth: 0.04, brow: -0.34, eyeH: 0.66, aura: 0.22, vib: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainAngelfish {
  static metadata = {
    name: 'Villain Freshwater Angelfish',
    category: 'villain_fish',
    baseLength: 90,
    baseWidth: 55,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prev = 'breathing';
    this._stateAge = 0;
    this._t = 0;
    this._tailPhase = 0;

    this._blendDur = 0.15;
    this._blendAge = 0.15;
    this._from = { ...POSE_TABLE.breathing };
    this._to = { ...POSE_TABLE.breathing };
    this._pose = { ...POSE_TABLE.breathing };
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
    const key = ALIASES[name] || name;
    if (!this._cbs.has(key)) this._cbs.set(key, []);
    this._cbs.get(key).push(callback);
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!POSE_TABLE[next]) return;

    if ((this._state === 'shock' || this._state === 'fear') && LOCK_BLOCKED.has(next)) {
      return;
    }
    if (next === this._state && !ONE_SHOT_SET.has(next)) return;

    if (ONE_SHOT_SET.has(next) && !ONE_SHOT_SET.has(this._state)) {
      this._prev = this._state;
    }
    this._state = next;
    this._stateAge = 0;
    this._from = { ...this._pose };
    this._to = { ...POSE_TABLE[next] };
    this._blendAge = 0;
  }

  update(dt) {
    const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._t += d;
    this._stateAge += d;

    if (this._blendAge < this._blendDur) {
      this._blendAge = Math.min(this._blendDur, this._blendAge + d);
      const u = cubic(this._blendAge / this._blendDur);
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._from[k] + (this._to[k] - this._from[k]) * u;
      }
    } else {
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._to[k];
      }
    }

    this._tailPhase += d * this._pose.tailHz;

    if (ONE_SHOT_SET.has(this._state) && this._stateAge >= SHOT_DUR[this._state]) {
      const done = this._state;
      const back = POSE_TABLE[this._prev] && !ONE_SHOT_SET.has(this._prev) ? this._prev : 'breathing';
      this._state = back;
      this._stateAge = 0;
      this._from = { ...this._pose };
      this._to = { ...POSE_TABLE[back] };
      this._blendAge = 0;

      const list = this._cbs.get(done);
      if (list) for (const fn of list) fn(done);
    }
  }

  draw(ctx) {
    const p = this._pose;
    const t = this._t;
    const halfL = VillainAngelfish.metadata.baseLength * 0.5;
    const halfW = VillainAngelfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._tailPhase) * p.tailMag + p.bend * 0.65;
    const sway = Math.sin(this._tailPhase - 0.7) * p.tailMag * 0.25 + p.bend * 0.3;
    const jx = p.vib > 0 ? Math.sin(t * 60) * p.vib * 1.1 : 0;
    const jy = p.vib > 0 ? Math.cos(t * 65) * p.vib * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark metallic ruby-shadow aura
    this._drawShadowAura(ctx, halfL, halfW, p.aura, t);

    // 2. Razor-tipped swept-back angelic villain wing fins (iconic diamond-blade silhouette)
    this._drawRazorWingFin(ctx, 2, -halfW * 0.44, -1, p.finSweep, wag, t);
    this._drawRazorWingFin(ctx, 2, halfW * 0.44, 1, p.finSweep, wag, t);

    // 3. Lyre-tipped razor crescent tail
    this._drawRazorTail(ctx, -halfL * 0.50, sway * 8, wag, t);

    // 4. Tarnished dark-silver chunky disc body with jagged crimson-edged black war-stripes
    this._drawSilverDiscBody(ctx, halfL, halfW, sway, t);

    // 5. Blade-like dorsal keel ridge
    this._drawBladeKeel(ctx, sway, wag);

    // 6. Sharp beak-like villain fangs
    this._drawSharpMouth(ctx, halfL, p.mouth, t);

    // 7. Glowing ruby villain eyes with V-brows
    this._drawRubyEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawShadowAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.06 + Math.sin(t * 2.1) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 6, -4, 0, r);
    g.addColorStop(0, `rgba(20, 10, 30, ${0.44 * aura})`);
    g.addColorStop(0.55, `rgba(170, 15, 45, ${0.20 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawRazorWingFin(ctx, ox, oy, side, sweep, wag, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const wave = Math.sin(this._tailPhase * 0.8 + side) * 0.14;
    ctx.rotate(side * (0.18 + sweep * 0.36 + wave) + wag * 0.25);

    const g = ctx.createLinearGradient(8, 0, -28, side * 26);
    g.addColorStop(0, '#7B8296');
    g.addColorStop(0.42, '#343648');
    g.addColorStop(0.78, '#1B1424');
    g.addColorStop(1, '#B31234');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(4, side * 14, -26, side * 28);
    // Razor-sharp serrated trailing edge
    ctx.lineTo(-16, side * 17);
    ctx.lineTo(-22, side * 14);
    ctx.lineTo(-12, side * 8);
    ctx.lineTo(-16, side * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing crimson blade edge highlight
    ctx.strokeStyle = `rgba(255, 42, 82, ${0.65 + Math.sin(t * 5) * 0.2})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(6, side * 3);
    ctx.quadraticCurveTo(1, side * 13, -24, side * 26.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawRazorTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.9);

    const g = ctx.createLinearGradient(0, 0, -24, 0);
    g.addColorStop(0, '#474B5E');
    g.addColorStop(0.55, '#1D1828');
    g.addColorStop(1, '#C91438');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.quadraticCurveTo(-8, -11, -23, -16);
    ctx.lineTo(-14, -5);
    ctx.lineTo(-19, 0);
    ctx.lineTo(-14, 5);
    ctx.lineTo(-23, 16);
    ctx.quadraticCurveTo(-8, 11, 2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 62, 96, ${0.55 + Math.sin(t * 4.5) * 0.2})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(-19, -13);
    ctx.moveTo(-2, 2);
    ctx.lineTo(-19, 13);
    ctx.stroke();
    ctx.restore();
  }

  _drawSilverDiscBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 5.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.86, 0);
    ctx.bezierCurveTo(halfL * 0.68, -halfW * 0.72, halfL * 0.08, -halfW * 0.76, -halfL * 0.25, -halfW * 0.44 + sy * 0.4);
    ctx.quadraticCurveTo(-halfL * 0.44, -halfW * 0.26 + sy, -halfL * 0.54, -halfW * 0.16 + sy);
    ctx.lineTo(-halfL * 0.54, halfW * 0.16 + sy);
    ctx.quadraticCurveTo(-halfL * 0.44, halfW * 0.26 + sy, -halfL * 0.25, halfW * 0.44 + sy * 0.4);
    ctx.bezierCurveTo(halfL * 0.08, halfW * 0.76, halfL * 0.68, halfW * 0.72, halfL * 0.86, 0);
    ctx.closePath();

    // Tarnished dark-silver metallic gradient
    const sg = ctx.createLinearGradient(halfL * 0.8, -halfW * 0.6, -halfL * 0.5, halfW * 0.6);
    sg.addColorStop(0, '#B5BED0');
    sg.addColorStop(0.35, '#767E94');
    sg.addColorStop(0.72, '#3D4154');
    sg.addColorStop(1, '#1E1A2B');
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Cel-shaded shadow side
    ctx.fillStyle = 'rgba(18, 10, 28, 0.34)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.52, halfL * 0.78, halfW * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged crimson-edged black war-stripes (3 iconic angelfish vertical bars, villainized)
    this._drawWarStripe(ctx, 18, halfW * 0.85, 5.2);
    this._drawWarStripe(ctx, 2, halfW * 0.88, 6.8);
    this._drawWarStripe(ctx, -13, halfW * 0.65, 5.0);

    // Metallic battle scratch marks
    ctx.strokeStyle = 'rgba(235, 242, 255, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.lineTo(5, -2);
    ctx.moveTo(12, -5.5);
    ctx.lineTo(7, -0.5);
    ctx.stroke();

    // Glossy metallic chibi highlight
    ctx.fillStyle = 'rgba(238, 245, 255, 0.38)';
    ctx.beginPath();
    ctx.ellipse(12, -halfW * 0.30, 15, 4.2, -0.14, 0, Math.PI * 2);
    ctx.fill();

    // Faint glowing crimson rune on forehead
    ctx.strokeStyle = `rgba(255, 36, 78, ${0.55 + Math.sin(t * 4) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(24, -2.5);
    ctx.lineTo(21, 0);
    ctx.lineTo(24, 2.5);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawWarStripe(ctx, cx, halfH, w) {
    const hw = w * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - hw, -halfH);
    ctx.lineTo(cx - hw + 2.2, -halfH * 0.42);
    ctx.lineTo(cx - hw - 1.8, 0);
    ctx.lineTo(cx - hw + 2.0, halfH * 0.46);
    ctx.lineTo(cx - hw, halfH);
    ctx.lineTo(cx + hw, halfH);
    ctx.lineTo(cx + hw + 1.8, halfH * 0.42);
    ctx.lineTo(cx + hw - 1.5, 0);
    ctx.lineTo(cx + hw + 2.2, -halfH * 0.42);
    ctx.lineTo(cx + hw, -halfH);
    ctx.closePath();

    ctx.strokeStyle = '#E01A42';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = '#181022';
    ctx.fill();
    ctx.restore();
  }

  _drawBladeKeel(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#262336';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(4, -3.2 + sway * 1.5);
    ctx.lineTo(-10, -2.2 + sway * 3.5);
    ctx.lineTo(-24, wag * 6);
    ctx.lineTo(-10, 2.2 + sway * 3.5);
    ctx.lineTo(4, 3.2 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#D9E2F5';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-22, wag * 5.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawSharpMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.80;
    const open = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (open > 0.2 || this._state === 'happy') {
      const w = 2.6 + open * 3.8;
      ctx.save();
      ctx.fillStyle = '#24081A';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, 0, 2.0 + open * 2.4, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      for (const fy of [-w * 0.5, 0, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.6, fy - 1.1);
        ctx.lineTo(mx + 4.0 + open, fy);
        ctx.lineTo(mx + 0.6, fy + 1.1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawRubyEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.52;
    const ey = halfW * 0.34;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, -side * 2.5);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-2.6, side * 2.5);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.4 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.9 * Math.max(0.45, Math.min(1.36, p.eyeH));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F8F2F6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing ruby iris
      const ir = this._state === 'shock' ? 1.4 : 2.7;
      const rg = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      rg.addColorStop(0, '#FF88A4');
      rg.addColorStop(0.5, '#EE113D');
      rg.addColorStop(1, '#58061C');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.25, 0.9, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.25 - 1.1, 1.0, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 1.0, 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#2B2B3D';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.55, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      // Sharp angular V-brow
      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.4, -side * (2.8 - tilt * 2.5));
      ctx.lineTo(4.8, -side * (1.5 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 50, 88, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0.8, -4.8);
        ctx.lineTo(0.8, 4.8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.2 + i * 1.57;
        const sx = 4 + Math.cos(a) * (halfL * 0.68);
        const sy = Math.sin(a) * (halfW * 0.85);
        const r = 3.0 + Math.sin(t * 7 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#E81748' : '#8A2BE2';
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
      ctx.translate(halfL * 0.60, -halfW * 0.78);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-2.1, -10.5, 4.2, 8.0, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 10;
        const x = 16 - i * 9;
        const y = -halfW * 0.68 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.6);
        ctx.quadraticCurveTo(x + 2.8, y + 1, x, y + 3.2);
        ctx.quadraticCurveTo(x - 2.8, y + 1, x, y - 3.6);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(14, -halfW * 0.68);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF204E';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(2.0, 4.6, 5.4, 4.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.48, halfW * 0.54 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 + 2.5, halfW * 0.54 + 4 + dy * 0.5, halfL * 0.48, halfW * 0.54 + 5.8 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 - 2.5, halfW * 0.54 + 4 + dy * 0.5, halfL * 0.48, halfW * 0.54 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainAngelfish;
