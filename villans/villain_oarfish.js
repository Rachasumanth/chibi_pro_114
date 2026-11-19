/**
 * Villain Giant Oarfish (Regalecus glesne — Phantom Dark-Steel Demon Crown Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Phantom dark-steel ribbon body, blazing fiery-crimson demon crest crown & jagged continuous flame-red dorsal fin.
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
  breathing:  { bend: 0,     crestFlare: 0.30, jaw: 0.05, flame: 0.55, wagFreq: 2.0,  wagAmp: 0.16 },
  swimming:   { bend: 0,     crestFlare: 0.65, jaw: 0.10, flame: 0.85, wagFreq: 5.8,  wagAmp: 0.42 },
  relax:      { bend: 0.05,  crestFlare: 0.12, jaw: 0.0,  flame: 0.30, wagFreq: 1.2,  wagAmp: 0.10 },
  left_turn:  { bend: -0.58, crestFlare: 0.80, jaw: 0.12, flame: 0.80, wagFreq: 4.5,  wagAmp: 0.25 },
  right_turn: { bend: 0.58,  crestFlare: 0.80, jaw: 0.12, flame: 0.80, wagFreq: 4.5,  wagAmp: 0.25 },
  eating:     { bend: 0,     crestFlare: 0.95, jaw: 1.0,  flame: 1.0,  wagFreq: 8.0,  wagAmp: 0.25 },
  hungry:     { bend: 0,     crestFlare: 0.80, jaw: 0.55, flame: 0.95, wagFreq: 5.2,  wagAmp: 0.28 },
  stress:     { bend: 0,     crestFlare: 0.90, jaw: 0.30, flame: 0.92, wagFreq: 12.5, wagAmp: 0.18 },
  fear:       { bend: 0,     crestFlare: 0.20, jaw: 0.30, flame: 0.25, wagFreq: 14.5, wagAmp: 0.22 },
  shock:      { bend: 0,     crestFlare: 1.0,  jaw: 0.80, flame: 1.0,  wagFreq: 16.5, wagAmp: 0.14 },
  happy:      { bend: 0,     crestFlare: 0.72, jaw: 0.25, flame: 0.90, wagFreq: 4.4,  wagAmp: 0.26 },
  sad:        { bend: -0.06, crestFlare: 0.05, jaw: 0.0,  flame: 0.20, wagFreq: 1.0,  wagAmp: 0.08 },
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

export class VillainOarfish {
  static metadata = {
    name: 'Villain Giant Oarfish',
    category: 'villain_fish',
    baseLength: 250,
    baseWidth: 36,
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
      const mag = st === 'shock' ? 1.6 : 0.75;
      ctx.translate(Math.sin(t * 56) * mag, Math.cos(t * 62) * mag);
    }

    // 16-node serpentine ribbon spine from x=+110 (head) to x=-125 (whip tip)
    const nodes = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const nx = lerp(108, -125, u);
      const wave = Math.sin(t * p.wagFreq - u * 7.5) * p.wagAmp * 26 * Math.pow(u, 1.15);
      const turn = p.bend * 38 * u * u;
      // Front-heavy chibi regal head tapering to sleek ribbon
      const w = i === 0 ? 14.5 : (i === 1 ? 16.5 : Math.max(1.5, 13.5 * Math.pow(1 - u, 0.85)));
      nodes.push({ x: nx, y: wave + turn, w, u });
    }

    // 1. Phantom Crimson-Steel Miasma
    this._drawMiasma(ctx, nodes, p.flame);

    // 2. Long Crimson Oar-Shaped Pelvic Streamers
    this._drawOarStreamers(ctx, nodes[1], p.crestFlare, t);

    // 3. Phantom Dark-Steel Ribbon Body
    this._drawRibbonBody(ctx, nodes, p.jaw, t);

    // 4. Jagged Continuous Flame-Red Dorsal Fin Ribbon
    this._drawFlameDorsal(ctx, nodes, p.flame, t);

    // 5. Blazing Fiery-Crimson Demon Crest Crown
    this._drawDemonCrown(ctx, nodes[0], p.crestFlare, p.flame, t);

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX & Fangs
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasma(ctx, nodes, flame) {
    ctx.save();
    ctx.strokeStyle = `rgba(215, 22, 46, ${0.14 + flame * 0.14})`;
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawOarStreamers(ctx, shoulder, flare, t) {
    const wave = Math.sin(t * 5.2) * 0.14;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(shoulder.x - 4, shoulder.y + side * 13);
      ctx.rotate(side * (0.55 + flare * 0.35 + wave));

      // Long crimson oar stalk
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, side * 16, -24, side * 24);
      ctx.stroke();

      ctx.strokeStyle = '#E8263A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, side * 16, -24, side * 24);
      ctx.stroke();

      // Bladed crimson paddle tip
      ctx.fillStyle = '#FF3838';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(-20, side * 21);
      ctx.lineTo(-27, side * 29);
      ctx.lineTo(-31, side * 24);
      ctx.lineTo(-25, side * 19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRibbonBody(ctx, nodes, jaw, t) {
    ctx.save();
    const snout = 122 + jaw * 2.5;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      ctx.quadraticCurveTo(118, -11, nodes[0].x, nodes[0].y - nodes[0].w);
      for (let i = 1; i < nodes.length; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w);
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        ctx.lineTo(nodes[i].x, nodes[i].y + nodes[i].w);
      }
      ctx.quadraticCurveTo(118, 11, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(120, -16, -120, 16);
    g.addColorStop(0, '#6B778D');
    g.addColorStop(0.25, '#424C61');
    g.addColorStop(0.65, '#262D3D');
    g.addColorStop(1, '#181C29');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Phantom dark-steel oblique stripes & glowing crimson fissures
    for (let i = 1; i < nodes.length - 1; i++) {
      const n = nodes[i];
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(20, 11, 28, 0.55)' : 'rgba(255, 58, 72, 0.35)';
      ctx.lineWidth = i % 2 === 0 ? 2.4 : 1.1;
      ctx.beginPath();
      ctx.moveTo(n.x + 5, n.y - n.w - 2);
      ctx.lineTo(n.x - 4, n.y + n.w + 2);
      ctx.stroke();
    }

    // Metallic silver-blue specular ribbon highlight
    ctx.strokeStyle = 'rgba(210, 228, 255, 0.28)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x + 2, nodes[0].y - 6);
    for (let i = 1; i < nodes.length - 2; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w * 0.48);
    }
    ctx.stroke();

    // Battle scar across dark-steel temple
    ctx.strokeStyle = '#FF8A9A';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(95, -12);
    ctx.lineTo(103, -6);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawFlameDorsal(ctx, nodes, flame, t) {
    ctx.save();
    // Jagged continuous flame-red dorsal fin running along full spine
    const grad = ctx.createLinearGradient(100, 0, -125, 0);
    grad.addColorStop(0, '#FF4D1C');
    grad.addColorStop(0.5, '#E01A36');
    grad.addColorStop(1, '#8C0E28');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      const flutter = Math.sin(t * 9 - i * 1.1) * (2.5 + flame * 2.5);
      const spike = (i % 2 === 0 ? -5.5 : 4.5) * (0.65 + flame * 0.45);
      ctx.lineTo(n.x, n.y + spike + flutter);
    }
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      ctx.lineTo(n.x, n.y + 1.8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawDemonCrown(ctx, head, flare, flame, t) {
    ctx.save();
    ctx.translate(head.x + 2, head.y);

    // Blazing fiery-crimson demon crest crown plumes radiating behind/above forehead
    const plumes = [
      { ang: -2.45, len: 22 + flare * 7 },
      { ang: -2.80, len: 28 + flare * 9 },
      { ang:  3.14, len: 31 + flare * 10 },
      { ang:  2.80, len: 28 + flare * 9 },
      { ang:  2.45, len: 22 + flare * 7 },
    ];

    for (let i = 0; i < plumes.length; i++) {
      const pl = plumes[i];
      const sway = Math.sin(t * 7 + i * 0.9) * 0.08;
      const a = pl.ang + sway;
      const ex = Math.cos(a) * pl.len;
      const ey = Math.sin(a) * pl.len;

      const grad = ctx.createLinearGradient(0, 0, ex, ey);
      grad.addColorStop(0, '#9E0F24');
      grad.addColorStop(0.55, '#FF2A3B');
      grad.addColorStop(1, '#FF9E2C');

      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(ex * 0.55 - Math.sin(a) * 4, ey * 0.55 + Math.cos(a) * 4, ex, ey);
      ctx.quadraticCurveTo(ex * 0.55 + Math.sin(a) * 3, ey * 0.55 - Math.cos(a) * 3, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing molten crown jewel at forehead base
    ctx.fillStyle = `rgba(255, 130, 40, ${0.65 + flame * 0.35})`;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(0, -3.6);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, 3.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(110.5, side * 9.5);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF382E';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, side * -2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, side * 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.8 : 4.0;
      ctx.fillStyle = st === 'shock' ? '#FFF6F0' : '#190A20';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF1A2B' : '#FF7E1A';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 0.85, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.0, 0.95, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.1, 0.48, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#424C61';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Regal V-shaped demon brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.0, side * 4.2);
        ctx.lineTo(3.4, side * 2.3);
      } else {
        ctx.moveTo(-3.0, side * 2.2);
        ctx.lineTo(3.6, side * 4.6);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5EE';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(120 + jaw * 2, side * (3.2 + snap));
        ctx.lineTo(125.5 + jaw * 2 + snap, side * 1.4);
        ctx.lineTo(120 + jaw * 2, side * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.7 + i * 2.1;
        const sx = 104 + Math.cos(a) * 20;
        const sy = Math.sin(a) * 20;
        const s = 2.5 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FF3838' : '#C084FC';
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
      const b = Math.abs(Math.sin(t * 16)) * 2.6;
      ctx.fillStyle = '#FF2A3B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(112, -26 - b, 3.8, 9.2, 1.6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(113.9, -13.8 - b, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(104, -22 - drop * 0.3);
      ctx.quadraticCurveTo(108, -17.5, 104, -16);
      ctx.quadraticCurveTo(100, -17.5, 104, -22 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(103, -19);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.3, 1.3);
        ctx.quadraticCurveTo(2.5, 2.5, 4.4, 1.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(110.5, 14 + fall * 0.4);
      ctx.quadraticCurveTo(113, 17 + fall * 0.4, 110.5, 18.5 + fall * 0.4);
      ctx.quadraticCurveTo(108, 17 + fall * 0.4, 110.5, 14 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainOarfish;
