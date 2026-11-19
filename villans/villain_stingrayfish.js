/**
 * Villain Blue-Spotted Ribbontail Ray (Taeniura lymma — Radioactive-Violet Toxic Disc Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Dark charcoal-umber disc dotted with glowing radioactive-violet/magenta toxic rings, jagged venomous spiked ribbontail.
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
  breathing:  { bend: 0,     rippleAmp: 2.2, toxicGlow: 0.55, wagFreq: 2.4, wagAmp: 0.14 },
  swimming:   { bend: 0,     rippleAmp: 5.5, toxicGlow: 0.82, wagFreq: 6.5, wagAmp: 0.34 },
  relax:      { bend: 0.04,  rippleAmp: 1.2, toxicGlow: 0.32, wagFreq: 1.4, wagAmp: 0.08 },
  left_turn:  { bend: -0.55, rippleAmp: 4.8, toxicGlow: 0.78, wagFreq: 5.0, wagAmp: 0.24 },
  right_turn: { bend: 0.55,  rippleAmp: 4.8, toxicGlow: 0.78, wagFreq: 5.0, wagAmp: 0.24 },
  eating:     { bend: 0,     rippleAmp: 6.2, toxicGlow: 1.0,  wagFreq: 8.2, wagAmp: 0.26 },
  hungry:     { bend: 0,     rippleAmp: 4.5, toxicGlow: 0.95, wagFreq: 5.6, wagAmp: 0.25 },
  stress:     { bend: 0,     rippleAmp: 5.0, toxicGlow: 0.92, wagFreq: 13.0, wagAmp: 0.18 },
  fear:       { bend: 0,     rippleAmp: 6.5, toxicGlow: 0.22, wagFreq: 15.0, wagAmp: 0.22 },
  shock:      { bend: 0,     rippleAmp: 7.0, toxicGlow: 1.0,  wagFreq: 16.5, wagAmp: 0.14 },
  happy:      { bend: 0,     rippleAmp: 4.2, toxicGlow: 0.90, wagFreq: 4.6, wagAmp: 0.25 },
  sad:        { bend: -0.05, rippleAmp: 0.8, toxicGlow: 0.20, wagFreq: 1.1, wagAmp: 0.06 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.64,
  right_turn: 0.64,
  eating: 0.56,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainStingrayfish {
  static metadata = {
    name: 'Villain Blue-Spotted Ribbontail Ray',
    category: 'villain_fish',
    baseLength: 135,
    baseWidth: 115,
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
      const mag = st === 'shock' ? 1.8 : 0.8;
      ctx.translate(Math.sin(t * 56) * mag, Math.cos(t * 62) * mag);
    }

    // 1. Toxic Violet-Magenta Miasma Aura
    this._drawMiasma(ctx, t, p.toxicGlow);

    // 2. Jagged Venomous Spiked Ribbontail
    this._drawVenomRibbontail(ctx, p.bend, p.wagFreq, p.wagAmp, p.toxicGlow, t);

    // 3. Dark Charcoal-Umber Undulating Disc + Radioactive-Violet/Magenta Toxic Rings
    this._drawToxicDisc(ctx, p.rippleAmp, p.toxicGlow, t);

    // 4. Elevated Villain Chibi Eyes + Spiracles
    this._drawEyes(ctx, st, t);

    // 5. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, glow) {
    ctx.save();
    const grad = ctx.createRadialGradient(8, 0, 14, 4, 0, 62);
    grad.addColorStop(0, 'rgba(18, 10, 26, 0.54)');
    grad.addColorStop(0.58, `rgba(205, 32, 224, ${0.14 + glow * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(6, 0, 56 + Math.sin(t * 3) * 2.5, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawVenomRibbontail(ctx, bend, freq, amp, glow, t) {
    ctx.save();
    const segs = 11;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const tx = lerp(-18, -86, u);
      const ty = Math.sin(t * freq - u * 5.0) * amp * 22 * u + bend * 24 * u * u;
      pts.push({ x: tx, y: ty, w: Math.max(1.4, 7.2 * (1 - u * 0.78)) });
    }

    // Jagged glowing magenta ribbon membrane along tail sides
    ctx.fillStyle = `rgba(218, 38, 224, ${0.55 + glow * 0.35})`;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y - pts[1].w);
    for (let i = 2; i < pts.length; i++) {
      const jag = i % 2 === 0 ? 4.8 : 1.5;
      ctx.lineTo(pts[i].x, pts[i].y - pts[i].w - jag);
    }
    for (let i = pts.length - 1; i >= 2; i--) {
      const jag = i % 2 === 0 ? 4.8 : 1.5;
      ctx.lineTo(pts[i].x, pts[i].y + pts[i].w + jag);
    }
    ctx.lineTo(pts[1].x, pts[1].y + pts[1].w);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central charcoal armored tail stalk
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - pts[0].w);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y - pts[i].w);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
    ctx.closePath();
    ctx.fillStyle = '#261D2E';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // Twin serrated venomous stinger barbs mid-tail
    const mid = pts[4];
    ctx.fillStyle = '#FF38D4';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(mid.x + 3, mid.y + side * 3);
      ctx.lineTo(mid.x - 10, mid.y + side * 12);
      ctx.lineTo(mid.x - 4, mid.y + side * 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawToxicDisc(ctx, rippleAmp, glow, t) {
    ctx.save();

    const buildDisc = () => {
      ctx.beginPath();
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        // Rounded chibi oval ray disc with undulating outer wing edges
        const ripple = Math.sin(t * 6.5 - cos * 4.5) * rippleAmp * Math.abs(sin);
        const rx = 46 + (cos > 0 ? 4 : -4);
        const ry = 50 + ripple;
        const px = 10 + cos * rx;
        const py = sin * ry;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(14, -6, 8, 8, 0, 56);
    g.addColorStop(0, '#45383E');
    g.addColorStop(0.55, '#2C232C');
    g.addColorStop(0.88, '#1D1522');
    g.addColorStop(1, '#3B1845');

    buildDisc();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildDisc();
    ctx.clip();

    // Glowing Radioactive-Violet / Magenta Toxic Rings dotted across disc
    const spots = [
      [34, -18, 5.2], [34, 18, 5.2], [20, -32, 5.8], [20, 32, 5.8],
      [4, -38, 5.5],  [4, 38, 5.5],  [-12, -30, 5.0], [-12, 30, 5.0],
      [-20, -14, 4.4], [-20, 14, 4.4], [8, -18, 4.6], [8, 18, 4.6],
      [-4, 0, 4.8],   [26, 0, 4.0],
    ];
    const pulse = 0.65 + 0.35 * Math.sin(t * 4.8);
    for (let i = 0; i < spots.length; i++) {
      const [sx, sy, sr] = spots[i];
      // Outer toxic aura
      ctx.fillStyle = `rgba(217, 42, 255, ${(0.22 + glow * 0.25) * pulse})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Dark center + glowing radioactive ring
      ctx.fillStyle = '#251133';
      ctx.strokeStyle = i % 2 === 0 ? '#E84CFF' : '#FF2EB8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cel-shade rim + glossy dome highlight
    ctx.fillStyle = 'rgba(235, 190, 255, 0.16)';
    ctx.beginPath();
    ctx.ellipse(22, -12, 18, 6.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across right disc shoulder
    ctx.strokeStyle = '#FFA8E8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, -24);
    ctx.lineTo(24, -16);
    ctx.stroke();

    ctx.restore();

    buildDisc();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(31, side * 12.5);

      // Spiracle vent just behind each eye
      ctx.fillStyle = '#140B1C';
      ctx.beginPath();
      ctx.ellipse(-7.5, side * 1.5, 3.0, 2.0, side * 0.3, 0, Math.PI * 2);
      ctx.fill();

      if (st === 'stress') {
        ctx.strokeStyle = '#FF38D4';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.0, side * -2.4);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-3.0, side * 2.4);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 5.2 : 4.4;
      ctx.fillStyle = st === 'shock' ? '#FFF5FF' : '#190B24';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF1F8F' : '#E040FB';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 0.85, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.6, -1.1, 1.0, 0, Math.PI * 2);
        ctx.arc(-0.6, 1.2, 0.5, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#2C232C';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.4, side * 4.8);
        ctx.lineTo(3.6, side * 2.6);
      } else {
        ctx.moveTo(-3.4, side * 2.4);
        ctx.lineTo(3.8, side * 5.2);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(54, side * (4.5 + snap));
        ctx.lineTo(60 + snap * 1.5, side * 2.0);
        ctx.lineTo(54, side * 1.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const sx = 24 + Math.cos(a) * 32;
        const sy = Math.sin(a) * 32;
        const s = 2.8 + Math.sin(t * 8 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#FF2EB8' : '#C084FC';
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
      const b = Math.abs(Math.sin(t * 16)) * 3;
      ctx.fillStyle = '#FF2EB8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(32, -32 - b, 4.2, 10.5, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(34.1, -18.5 - b, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(24, -28 - drop * 0.3);
      ctx.quadraticCurveTo(28.5, -23, 24, -21.5);
      ctx.quadraticCurveTo(19.5, -23, 24, -28 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(23, -25);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.4, 1.4);
        ctx.quadraticCurveTo(2.8, 2.8, 5.0, 1.8);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(31, 18.5 + fall * 0.4);
      ctx.quadraticCurveTo(34, 22 + fall * 0.4, 31, 23.5 + fall * 0.4);
      ctx.quadraticCurveTo(28, 22 + fall * 0.4, 31, 18.5 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainStingrayfish;
