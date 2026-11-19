/**
 * Villain Giant Arapaima — 2D Top-Down Expressive Chibi Villain Fish
 * Colossal charcoal-black river tyrant with blazing molten-crimson edged
 * mosaic armor scales and scarred broad head.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.64, right_turn: 0.64, eating: 0.68, shock: 0.74 };

function cubicOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function poseFor(state) {
  switch (state) {
    case 'swimming':
      return { freq: 5.2, amp: 0.24, bend: 0, ember: 1.0, mouth: 0.16, fin: 0.28, shake: 0 };
    case 'relax':
      return { freq: 1.5, amp: 0.05, bend: 0, ember: 0.56, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 4.8, amp: 0.18, bend: -0.36, ember: 1.08, mouth: 0.18, fin: 0.42, shake: 0 };
    case 'right_turn':
      return { freq: 4.8, amp: 0.18, bend: 0.36, ember: 1.08, mouth: 0.18, fin: 0.42, shake: 0 };
    case 'eating':
      return { freq: 4.6, amp: 0.14, bend: 0, ember: 1.35, mouth: 0.96, fin: 0.52, shake: 0.02 };
    case 'hungry':
      return { freq: 4.4, amp: 0.17, bend: 0, ember: 1.28, mouth: 0.58, fin: 0.42, shake: 0.015 };
    case 'stress':
      return { freq: 8.4, amp: 0.11, bend: 0, ember: 1.42, mouth: 0.32, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 10.2, amp: 0.15, bend: 0, ember: 0.48, mouth: 0.46, fin: 0.76, shake: 0.085 };
    case 'shock':
      return { freq: 11.8, amp: 0.09, bend: 0, ember: 1.5, mouth: 0.84, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.3, amp: 0.12, bend: 0.05, ember: 1.15, mouth: 0.25, fin: 0.34, shake: 0 };
    case 'sad':
      return { freq: 1.2, amp: 0.04, bend: -0.05, ember: 0.35, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.0, amp: 0.07, bend: 0, ember: 0.85, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

export class VillainArapaimafish {
  static metadata = {
    name: 'Villain Giant Arapaima',
    category: 'villain_fish',
    baseLength: 235,
    baseWidth: 68
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
    this._phase = 0;

    this._blendDur = 0.15;
    this._blendElapsed = 0.15;
    this._from = poseFor('breathing');
    this._to = poseFor('breathing');
    this._pose = { ...this._to };
    this._listeners = new Map();
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!VALID_STATES.has(next)) return this;
    if (LOCKED.has(this._state) && BLOCKED.has(next)) return this;
    if (next === this._state && !ONE_SHOTS.has(next)) return this;

    if (!ONE_SHOTS.has(this._state)) this._prevState = this._state;
    this._from = { ...this._pose };
    this._to = poseFor(next);
    this._blendElapsed = 0;
    this._state = next;
    this._stateTime = 0;
    return this;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.1);
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDur) {
      this._blendElapsed = Math.min(this._blendDur, this._blendElapsed + step);
      const t = cubicOut(this._blendElapsed / this._blendDur);
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = lerp(this._from[k], this._to[k], t);
      }
    } else {
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._to[k];
      }
    }

    this._phase += step * this._pose.freq;

    if (ONE_SHOTS.has(this._state)) {
      const dur = ONE_SHOT_DUR[this._state] || 0.64;
      if (this._stateTime >= dur) {
        const done = this._state;
        const ret = this._prevState || 'breathing';
        this._from = { ...this._pose };
        this._to = poseFor(ret);
        this._blendElapsed = 0;
        this._state = ret;
        this._stateTime = 0;
        this._emit(done);
      }
    }
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) this.angle = Math.atan2(dy, dx);
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return this;
    const key = ALIASES[name] || name;
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
    return this;
  }

  _emit(name) {
    const arr = this._listeners.get(name);
    if (!arr) return;
    for (const cb of arr.slice()) cb(name, this);
  }

  draw(ctx) {
    if (!ctx) return;
    const p = this._pose;
    const t = this._time;
    const wag = Math.sin(this._phase) * p.amp;
    const bend = p.bend + wag * 0.34;
    const ember = (0.72 + 0.28 * Math.sin(t * 4.0)) * p.ember;
    const sx = p.shake ? Math.sin(t * 58) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 62) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Colossal molten-crimson river tyrant miasma
    const aura = ctx.createRadialGradient(-4, 0, 14, -4, 0, 124);
    aura.addColorStop(0, `rgba(14, 6, 18, ${0.58 * Math.min(1.2, p.ember)})`);
    aura.addColorStop(0.55, `rgba(224, 24, 38, ${0.24 * ember})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 122, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Broad paddle-shaped molten-rimmed river tyrant tail
    ctx.save();
    ctx.translate(-90, bend * 24);
    ctx.rotate(-bend * 0.85 - wag * 1.2);
    const tg = ctx.createLinearGradient(0, 0, -28, 0);
    tg.addColorStop(0, '#221C29');
    tg.addColorStop(0.55, '#6B0C1D');
    tg.addColorStop(1, '#FF2E38');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(-18, -22, -26, -10);
    ctx.lineTo(-20, -3); // battle notch
    ctx.lineTo(-28, 2);
    ctx.quadraticCurveTo(-22, 22, 6, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Heavy armored pectoral & rear pelvic fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.28 + Math.sin(this._phase + side) * 0.08;
      ctx.translate(46, side * 26);
      ctx.rotate(side * (0.42 + flap) + bend * 0.2);
      const fg = ctx.createLinearGradient(0, 0, -10, side * 20);
      fg.addColorStop(0, '#2B2433');
      fg.addColorStop(1, '#9E1226');
      ctx.fillStyle = fg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.quadraticCurveTo(6, side * 20, -8, side * 19);
      ctx.lineTo(-10, side * 13);
      ctx.lineTo(-16, side * 14);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(-44, side * 18 + bend * 12);
      ctx.rotate(side * 0.55);
      ctx.fillStyle = '#401122';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-3, side * 12);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Colossal charcoal-black river tyrant body
    const breath = 1 + Math.sin(t * 2.4) * 0.018;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(104, -28, -94, 28);
    bodyGrad.addColorStop(0, '#3D3747');
    bodyGrad.addColorStop(0.4, '#241F2B');
    bodyGrad.addColorStop(0.78, '#1B1422');
    bodyGrad.addColorStop(1, '#3D0B19');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(106, 0);
    ctx.quadraticCurveTo(104, -22, 74, -28);
    ctx.quadraticCurveTo(22, -31, -36, -24 + bend * 8);
    ctx.quadraticCurveTo(-72, -18, -92, -10 + bend * 22);
    ctx.lineTo(-92, 10 + bend * 22);
    ctx.quadraticCurveTo(-72, 18, -36, 24 + bend * 8);
    ctx.quadraticCurveTo(22, 31, 74, 28);
    ctx.quadraticCurveTo(104, 22, 106, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Blazing molten-crimson edged mosaic armor scales (iconic Arapaima red-trimmed scales!)
    for (let col = 0; col < 9; col++) {
      const xPos = 42 - col * 15;
      const bendOff = col > 2 ? bend * (col - 2) * 3.0 : 0;
      const rows = col > 6 ? 1 : 2;
      for (let r = -rows; r <= rows; r++) {
        const yPos = r * 9.5 + (col % 2 === 0 ? 0 : 2.5) + bendOff;
        if (Math.abs(yPos - bendOff) > 24 - col * 1.4) continue;
        const heat = Math.min(1, (col / 8) * 1.15); // hotter crimson toward the rear!
        ctx.fillStyle = '#1C1624';
        ctx.strokeStyle = `rgba(255, ${Math.round(70 - heat * 35)}, 36, ${(0.45 + heat * 0.52) * ember})`;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(xPos, yPos, 6.4, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.quadraticCurveTo(xPos - 5, yPos, xPos + 1, yPos - 6.2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 6. Scarred broad armored skull plate
    ctx.fillStyle = '#2E2838';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(102, 0);
    ctx.quadraticCurveTo(96, -20, 62, -23);
    ctx.lineTo(54, 0);
    ctx.lineTo(62, 23);
    ctx.quadraticCurveTo(96, 20, 102, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Deep battle scars across broad head
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(86, -12);
    ctx.lineTo(68, 6);
    ctx.moveTo(80, -14);
    ctx.lineTo(65, -2);
    ctx.stroke();

    // Glossy obsidian head sheen
    ctx.fillStyle = 'rgba(220, 210, 240, 0.16)';
    ctx.beginPath();
    ctx.ellipse(80, -11, 16, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. Massive bone-crushing Arapaima jaw with fangs
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 18))
      : this._state === 'hungry'
        ? 0.45 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(104, 0);
    if (chomp > 0.14 || this._state === 'happy') {
      const mh = 8 + chomp * 10;
      ctx.fillStyle = '#380614';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-4, -mh * 0.78);
      ctx.quadraticCurveTo(7 + chomp * 4, 0, -4, mh * 0.78);
      ctx.quadraticCurveTo(-8, 0, -4, -mh * 0.78);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF5EB';
      ctx.lineWidth = 1.1;
      for (const fy of [-mh * 0.5, -mh * 0.17, mh * 0.17, mh * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(-3, fy - 1.9);
        ctx.lineTo(3.4 + chomp * 1.8, fy);
        ctx.lineTo(-3, fy + 1.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-2, -13);
      ctx.quadraticCurveTo(3, 0, -2, 13);
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive Molten-Crimson Villain Eyes
    this._drawEyes(ctx, t, ember);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, ember) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 76;
      const ey = side * 15.5;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF3838';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - side * 3);
        ctx.lineTo(ex + 3.4, ey);
        ctx.lineTo(ex - 4, ey + side * 3);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.6 : 5.5;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#1E0610';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(ex + 1, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 4.0);
        ig.addColorStop(0, '#FFF29C');
        ig.addColorStop(0.55, '#FF2E38');
        ig.addColorStop(1, '#750414');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.8, ey, 4.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.2, ey, 1.4, 2.9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.3, ey - side * 1.3, 1.3, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.3, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2E2838';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 4.2, ey + side * 4.0);
        ctx.lineTo(ex + 4.6, ey + side * 6.2);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.4, ey + side * 7.2);
        ctx.lineTo(ex + 4.2, ey + side * 7.2);
      } else {
        ctx.moveTo(ex + 5.0, ey - side * 2.2);
        ctx.lineTo(ex - 4.4, ey + side * 5.4);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 46, 56, ${0.75 * ember})`;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.2 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const x = 44 + Math.cos(a) * 58;
        const y = Math.sin(a) * 32;
        const s = 3.6 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E38' : '#A442FF';
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 0.35, y - s * 0.35);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x + s * 0.35, y + s * 0.35);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s * 0.35, y + s * 0.35);
        ctx.lineTo(x - s, y);
        ctx.lineTo(x - s * 0.35, y - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 18)) * 4;
      ctx.save();
      ctx.translate(92 + b, -26);
      ctx.fillStyle = '#FF2E38';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(-2.5, -13, 5, 11, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.2, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 11) % 14;
        const dx = 68 - i * 26;
        const dy = (i === 0 ? -34 : 34) + (i === 0 ? -d * 0.35 : d * 0.35);
        ctx.fillStyle = '#7EE8FF';
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx, dy - 5);
        ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy + 4.5);
        ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy - 5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (st === 'stress') {
      const s = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(74, -28);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(3.5, 5.5, 7, 5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const d = (t * 10) % 9;
      ctx.fillStyle = '#75DAFF';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(76, 22 + d * 0.4);
      ctx.quadraticCurveTo(79.5, 26 + d * 0.4, 76, 29 + d * 0.4);
      ctx.quadraticCurveTo(72.5, 26 + d * 0.4, 76, 22 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainArapaimafish;
