/**
 * Villain Giant Manta Ray (Mobula birostris — Obsidian Stealth-Bomber Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Obsidian-black stealth-bomber diamond wings with glowing crimson shoulder runes, razor-tipped curled cephalic horns, barbed whip tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_STATES = new Set(['shock', 'fear']);
const BLOCKED_WHEN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const STATE_ALIASES = {
  idle: 'breathing',
  hunger: 'hungry',
};

const VALID_STATES = new Set([
  'breathing',
  'swimming',
  'relax',
  'left_turn',
  'right_turn',
  'eating',
  'hungry',
  'stress',
  'fear',
  'shock',
  'happy',
  'sad',
]);

const POSE_TARGETS = {
  breathing:  { bend: 0,     wingSweep: 0.15, hornCurl: 0.20, runeGlow: 0.55, flapFreq: 1.8, flapAmp: 0.14 },
  swimming:   { bend: 0,     wingSweep: 0.50, hornCurl: 0.35, runeGlow: 0.80, flapFreq: 4.6, flapAmp: 0.42 },
  relax:      { bend: 0.04,  wingSweep: 0.05, hornCurl: 0.10, runeGlow: 0.30, flapFreq: 1.1, flapAmp: 0.08 },
  left_turn:  { bend: -0.50, wingSweep: 0.65, hornCurl: 0.45, runeGlow: 0.78, flapFreq: 3.8, flapAmp: 0.28 },
  right_turn: { bend: 0.50,  wingSweep: 0.65, hornCurl: 0.45, runeGlow: 0.78, flapFreq: 3.8, flapAmp: 0.28 },
  eating:     { bend: 0,     wingSweep: 0.75, hornCurl: 1.0,  runeGlow: 1.0,  flapFreq: 6.2, flapAmp: 0.35 },
  hungry:     { bend: 0,     wingSweep: 0.55, hornCurl: 0.85, runeGlow: 0.95, flapFreq: 4.2, flapAmp: 0.32 },
  stress:     { bend: 0,     wingSweep: 0.70, hornCurl: 0.65, runeGlow: 0.90, flapFreq: 10.5, flapAmp: 0.20 },
  fear:       { bend: 0,     wingSweep: -0.25, hornCurl: -0.2, runeGlow: 0.20, flapFreq: 12.0, flapAmp: 0.24 },
  shock:      { bend: 0,     wingSweep: 0.95, hornCurl: 0.90, runeGlow: 1.0,  flapFreq: 14.0, flapAmp: 0.18 },
  happy:      { bend: 0,     wingSweep: 0.48, hornCurl: 0.55, runeGlow: 0.90, flapFreq: 3.6, flapAmp: 0.30 },
  sad:        { bend: -0.05, wingSweep: -0.2, hornCurl: -0.15, runeGlow: 0.18, flapFreq: 1.0, flapAmp: 0.06 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.66,
  right_turn: 0.66,
  eating: 0.58,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainMantarayfish {
  static metadata = {
    name: 'Villain Giant Manta Ray',
    category: 'villain_fish',
    baseLength: 175,
    baseWidth: 220,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._time = 0;
    this._stateTime = 0;

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = { ...POSE_TARGETS.breathing };
    this._pose = { ...POSE_TARGETS.breathing };
    this._callbacks = new Map();
  }

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const normalized = STATE_ALIASES[name] || name;
    if (!this._callbacks.has(normalized)) {
      this._callbacks.set(normalized, []);
    }
    this._callbacks.get(normalized).push(callback);
  }

  play(name) {
    const target = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(target)) return false;

    if (LOCKED_STATES.has(this._state) && BLOCKED_WHEN_LOCKED.has(target)) {
      return false;
    }

    if (target === this._state && !ONE_SHOT_STATES.has(target)) {
      return true;
    }

    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }

    this._fromPose = { ...this._pose };
    this._state = target;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = Math.max(0, Math.min(dt || 0, 0.1));
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + step);
      const t = easeCubic(this._blendElapsed / this._blendDuration);
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = lerp(this._fromPose[key], target[key], t);
      }
    } else {
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = target[key];
      }
    }

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state];
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = this._prevState || 'breathing';
        this._fromPose = { ...this._pose };
        this._state = returnTo;
        this._stateTime = 0;
        this._blendElapsed = 0;

        const list = this._callbacks.get(finished);
        if (list && list.length) {
          for (const cb of [...list]) cb(finished);
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    const t = this._time;
    const p = this._pose;
    const st = this._state;

    if (st === 'stress' || st === 'fear' || st === 'shock') {
      const mag = st === 'shock' ? 2.0 : 0.9;
      ctx.translate(Math.sin(t * 54) * mag, Math.cos(t * 60) * mag);
    }

    const flap = Math.sin(t * p.flapFreq) * p.flapAmp;

    // 1. Stealth Shadow Miasma Aura
    this._drawMiasma(ctx, t, p.runeGlow, flap);

    // 2. Barbed Whip Tail
    this._drawBarbedWhipTail(ctx, p.bend, flap, t);

    // 3. Razor-Tipped Curled Cephalic Horns
    this._drawCephalicHorns(ctx, p.hornCurl, st, t);

    // 4. Obsidian-Black Stealth-Bomber Diamond Wings + Glowing Crimson Shoulder Runes
    this._drawStealthWings(ctx, flap, p.wingSweep, p.bend, p.runeGlow, t);

    // 5. Dorsal Spine Crest
    this._drawSpineCrest(ctx, p.runeGlow);

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, glow, flap) {
    ctx.save();
    const ry = 104 - flap * 14;
    const grad = ctx.createRadialGradient(8, 0, 18, 0, 0, 108);
    grad.addColorStop(0, 'rgba(14, 6, 22, 0.56)');
    grad.addColorStop(0.58, `rgba(175, 16, 44, ${0.12 + glow * 0.12})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(2, 0, 74 + Math.sin(t * 2.5) * 3, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBarbedWhipTail(ctx, bend, flap, t) {
    ctx.save();
    const segs = 10;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const tx = lerp(-26, -94, u);
      const ty = Math.sin(t * 4.5 - u * 4.5) * 9 * u + bend * 24 * u * u + flap * 6 * u;
      pts.push({ x: tx, y: ty, w: Math.max(1.0, 5.2 * (1 - u * 0.85)) });
    }

    // Venomous crimson barbs near tail base
    ctx.fillStyle = '#D91B3A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const idx of [2, 4, 6]) {
      const pt = pts[idx];
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(pt.x + 2, pt.y + side * pt.w);
        ctx.lineTo(pt.x - 6, pt.y + side * (pt.w + 5.5));
        ctx.lineTo(pt.x - 4, pt.y + side * pt.w);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Whip body
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y - pts[i].w);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
    ctx.closePath();
    ctx.fillStyle = '#1B1426';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawCephalicHorns(ctx, curl, st, t) {
    ctx.save();
    const spread = (st === 'eating' ? Math.abs(Math.sin(t * 20)) * 5 : curl * 5);

    for (const side of [-1, 1]) {
      const g = ctx.createLinearGradient(52, side * 14, 84, side * 20);
      g.addColorStop(0, '#231A30');
      g.addColorStop(0.65, '#3E1C38');
      g.addColorStop(1, '#E62242');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.3;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(50, side * 12);
      ctx.bezierCurveTo(64, side * (16 + spread), 78, side * (22 + spread), 84, side * (12 + spread * 0.4));
      ctx.bezierCurveTo(78, side * (10 + spread * 0.3), 68, side * (11 + spread * 0.4), 56, side * 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Razor crimson inner edge
      ctx.strokeStyle = '#FF385C';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(60, side * 14);
      ctx.quadraticCurveTo(74, side * (17 + spread * 0.8), 82, side * (12.5 + spread * 0.4));
      ctx.stroke();
    }

    // Snapping villain fangs inside wide manta maw when hungry / eating
    if (st === 'eating' || st === 'hungry') {
      ctx.fillStyle = '#FFF5F7';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      for (const fy of [-9, -3, 3, 9]) {
        ctx.beginPath();
        ctx.moveTo(55, fy - 1.5);
        ctx.lineTo(61.5, fy);
        ctx.lineTo(55, fy + 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawStealthWings(ctx, flap, sweep, bend, runeGlow, t) {
    ctx.save();
    const span = 104 - flap * 16;
    const tipX = -8 - sweep * 12;

    const buildWings = () => {
      ctx.beginPath();
      // Broad menacing stealth nose
      ctx.moveTo(58, -14);
      ctx.quadraticCurveTo(62, 0, 58, 14);

      // Right stealth-bomber diamond wing (side = +1)
      ctx.bezierCurveTo(46, 42, 24, span * 0.78, tipX + bend * 14, span);
      // Notched stealth trailing edge
      ctx.lineTo(tipX - 8 + bend * 12, span * 0.76);
      ctx.lineTo(tipX - 3 + bend * 10, span * 0.65);
      ctx.lineTo(tipX - 14 + bend * 8, span * 0.55); // battle notch
      ctx.quadraticCurveTo(-22, span * 0.30, -28, 14);

      // Tail base
      ctx.lineTo(-34, 6);
      ctx.lineTo(-34, -6);
      ctx.lineTo(-28, -14);

      // Left stealth-bomber diamond wing (side = -1)
      ctx.quadraticCurveTo(-22, -span * 0.30, tipX - 14 - bend * 8, -span * 0.55);
      ctx.lineTo(tipX - 3 - bend * 10, -span * 0.65);
      ctx.lineTo(tipX - 8 - bend * 12, -span * 0.76);
      ctx.lineTo(tipX - bend * 14, -span);
      ctx.bezierCurveTo(24, -span * 0.78, 46, -42, 58, -14);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(18, 0, 12, 0, 0, 112);
    g.addColorStop(0, '#2B213A');
    g.addColorStop(0.45, '#191324');
    g.addColorStop(0.85, '#100C18');
    g.addColorStop(1, '#261028');

    buildWings();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildWings();
    ctx.clip();

    // Stealth-bomber angular armor panel seams
    ctx.strokeStyle = 'rgba(110, 88, 155, 0.30)';
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(42, side * 14);
      ctx.lineTo(14, side * 46);
      ctx.lineTo(-14, side * 36);
      ctx.stroke();
    }

    // Glowing Crimson Shoulder Runes (iconic manta chevrons turned villainous)
    const rPulse = 0.6 + 0.4 * Math.sin(t * 4.5);
    for (const side of [-1, 1]) {
      // Soft crimson glow halo
      ctx.strokeStyle = `rgba(255, 24, 64, ${(0.25 + runeGlow * 0.35) * rPulse})`;
      ctx.lineWidth = 7.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(42, side * 22);
      ctx.lineTo(20, side * 52);
      ctx.lineTo(2, side * 38);
      ctx.lineTo(-10, side * 48);
      ctx.stroke();

      // Sharp bright crimson rune core
      ctx.strokeStyle = `rgba(255, 72, 102, ${0.65 + runeGlow * 0.35})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(42, side * 22);
      ctx.lineTo(20, side * 52);
      ctx.lineTo(2, side * 38);
      ctx.lineTo(-10, side * 48);
      ctx.stroke();

      // Secondary wingtip rune triangle
      ctx.fillStyle = `rgba(255, 42, 78, ${0.55 + runeGlow * 0.4})`;
      ctx.beginPath();
      ctx.moveTo(8, side * (span * 0.72));
      ctx.lineTo(-4, side * (span * 0.80));
      ctx.lineTo(-2, side * (span * 0.66));
      ctx.closePath();
      ctx.fill();
    }

    // Glossy obsidian fuselage highlight
    ctx.fillStyle = 'rgba(180, 155, 235, 0.16)';
    ctx.beginPath();
    ctx.ellipse(24, -12, 22, 7.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across left wing
    ctx.strokeStyle = '#FF90A8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(26, -34);
    ctx.lineTo(36, -24);
    ctx.stroke();

    ctx.restore();

    buildWings();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawSpineCrest(ctx, glow) {
    ctx.save();
    ctx.fillStyle = '#261433';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-18, -5.5);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-18, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 42, 78, ${0.5 + glow * 0.4})`;
    ctx.beginPath();
    ctx.arc(-4, 0, 2.5, 0, Math.PI * 2);
    ctx.arc(-14, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(45, side * 20.5);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2A55';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.4, side * -2.6);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.4, side * 2.6);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 5.8 : 4.8;
      ctx.fillStyle = st === 'shock' ? '#FFF5F8' : '#160821';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.9, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF143C' : '#FF385C';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.8, 0, 0.95, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.8, -1.2, 1.15, 0, Math.PI * 2);
        ctx.arc(-0.7, 1.3, 0.55, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#191324';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.25, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Stealth angled V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.8, side * 5.4);
        ctx.lineTo(4.0, side * 3.0);
      } else {
        ctx.moveTo(-3.8, side * 2.8);
        ctx.lineTo(4.2, side * 5.8);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.5 + i * 1.57;
        const sx = 32 + Math.cos(a) * 36;
        const sy = Math.sin(a) * 36;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2448' : '#C084FC';
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.35, sy - s * 0.35);
        ctx.lineTo(sx + s, sy);
        ctx.lineTo(sx + s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx, sy + s);
        ctx.lineTo(sx - s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx - s, sy);
        ctx.lineTo(sx - s * 0.35, sy - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 16)) * 3.5;
      ctx.fillStyle = '#FF2448';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(46, -42 - b, 4.6, 12, 2.0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(48.3, -26 - b, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 12;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(36, -36 - drop * 0.3);
      ctx.quadraticCurveTo(41, -30, 36, -28);
      ctx.quadraticCurveTo(31, -30, 36, -36 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(34, -32);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.6, 1.6);
        ctx.quadraticCurveTo(3.2, 3.2, 5.8, 2.0);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 8;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(45, 27 + fall * 0.4);
      ctx.quadraticCurveTo(48.5, 31 + fall * 0.4, 45, 33 + fall * 0.4);
      ctx.quadraticCurveTo(41.5, 31 + fall * 0.4, 45, 27 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainMantarayfish;
