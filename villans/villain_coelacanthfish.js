/**
 * Villain Prehistoric Coelacanth (Latimeria chalumnae — Cursed Obsidian-Sapphire Titan Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Ancient cursed obsidian-sapphire armored titan with glowing cyan bone-rune flecks, clawed lobed fins, jagged triple-lobed tail.
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
  breathing:  { bend: 0,     lobeSwing: 0.18, jaw: 0.08, rune: 0.55, wagFreq: 1.9,  wagAmp: 0.10 },
  swimming:   { bend: 0,     lobeSwing: 0.65, jaw: 0.14, rune: 0.85, wagFreq: 5.5,  wagAmp: 0.28 },
  relax:      { bend: 0.04,  lobeSwing: 0.08, jaw: 0.0,  rune: 0.30, wagFreq: 1.1,  wagAmp: 0.05 },
  left_turn:  { bend: -0.52, lobeSwing: 0.78, jaw: 0.15, rune: 0.80, wagFreq: 4.4,  wagAmp: 0.22 },
  right_turn: { bend: 0.52,  lobeSwing: 0.78, jaw: 0.15, rune: 0.80, wagFreq: 4.4,  wagAmp: 0.22 },
  eating:     { bend: 0,     lobeSwing: 0.90, jaw: 1.0,  rune: 1.0,  wagFreq: 7.8,  wagAmp: 0.22 },
  hungry:     { bend: 0,     lobeSwing: 0.65, jaw: 0.58, rune: 0.95, wagFreq: 5.0,  wagAmp: 0.22 },
  stress:     { bend: 0,     lobeSwing: 0.75, jaw: 0.35, rune: 0.92, wagFreq: 12.5, wagAmp: 0.14 },
  fear:       { bend: 0,     lobeSwing: 0.92, jaw: 0.30, rune: 0.22, wagFreq: 14.5, wagAmp: 0.18 },
  shock:      { bend: 0,     lobeSwing: 1.0,  jaw: 0.85, rune: 1.0,  wagFreq: 16.5, wagAmp: 0.12 },
  happy:      { bend: 0,     lobeSwing: 0.55, jaw: 0.28, rune: 0.90, wagFreq: 4.2,  wagAmp: 0.20 },
  sad:        { bend: -0.05, lobeSwing: -0.1, jaw: 0.0,  rune: 0.18, wagFreq: 1.0,  wagAmp: 0.05 },
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

export class VillainCoelacanthfish {
  static metadata = {
    name: 'Villain Prehistoric Coelacanth',
    category: 'villain_fish',
    baseLength: 170,
    baseWidth: 66,
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
      ctx.translate(Math.sin(t * 54) * mag, Math.cos(t * 60) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Cursed Ancient Cyan-Obsidian Miasma Aura
    this._drawMiasma(ctx, t, p.rune);

    // 2. Jagged Triple-Lobed Prehistoric Tail (Iconic Diphycercal Coelacanth Tail)
    this._drawTripleLobedTail(ctx, bend, p.rune);

    // 3. Clawed Lobed Fins (2 Pairs of Muscular Stalked Limb-Fins)
    this._drawClawedLobedFins(ctx, p.lobeSwing, wag, p.rune, t);

    // 4. Ancient Cursed Obsidian-Sapphire Armored Titan Body + Glowing Cyan Bone-Rune Flecks
    this._drawArmoredTitanBody(ctx, bend, p.jaw, p.rune, t);

    // 5. Spiky Dual Dorsal Crests
    this._drawDorsalCrests(ctx, bend, p.rune);

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX & Ancient Fangs
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, rune) {
    ctx.save();
    const grad = ctx.createRadialGradient(4, 0, 14, -4, 0, 82);
    grad.addColorStop(0, 'rgba(12, 14, 34, 0.58)');
    grad.addColorStop(0.58, `rgba(24, 196, 235, ${0.12 + rune * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 82 + Math.sin(t * 2.8) * 3, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTripleLobedTail(ctx, bend, rune) {
    ctx.save();
    ctx.translate(-56, bend * 9);
    ctx.rotate(bend * 0.65);

    const g = ctx.createLinearGradient(0, 0, -28, 0);
    g.addColorStop(0, '#1B2847');
    g.addColorStop(0.6, '#273D66');
    g.addColorStop(1, '#26D6F0');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    // Upper & lower jagged fan lobes + protruding central epicaudal third lobe
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.lineTo(-18, -22);
    ctx.lineTo(-15, -13);
    ctx.lineTo(-20, -9);
    ctx.lineTo(-14, -4.5);
    // Central third lobe spear
    ctx.lineTo(-29, -2.5);
    ctx.lineTo(-32, 0);
    ctx.lineTo(-29, 2.5);
    ctx.lineTo(-14, 4.5);
    ctx.lineTo(-20, 9);
    ctx.lineTo(-15, 13);
    ctx.lineTo(-18, 22);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cyan rune glow on central tail lobe
    ctx.strokeStyle = `rgba(64, 240, 255, ${0.5 + rune * 0.45})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-28, 0);
    ctx.stroke();

    ctx.restore();
  }

  _drawClawedLobedFins(ctx, swing, wag, rune, t) {
    const stepCycle = Math.sin(t * 5.2) * 0.14 * swing;

    const drawLobe = (x, y, side, scale, phase) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side * (0.35 + swing * 0.35 + phase) + wag * 0.2);
      ctx.scale(scale, scale);

      // Muscular armored limb stalk
      ctx.fillStyle = '#1E2D52';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(4, side * 12, -2, side * 17);
      ctx.lineTo(-12, side * 16);
      ctx.quadraticCurveTo(-8, side * 6, -4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3 Wicked pale-cyan bone claws at tip of lobe fin
      ctx.fillStyle = '#B8F6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const cx = -1 - i * 4.5;
        ctx.beginPath();
        ctx.moveTo(cx + 1.8, side * 15);
        ctx.lineTo(cx - 1.5, side * 22.5);
        ctx.lineTo(cx - 2.2, side * 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Glowing cyan rune dot on stalk
      ctx.fillStyle = `rgba(56, 242, 255, ${0.5 + rune * 0.45})`;
      ctx.beginPath();
      ctx.arc(-2, side * 9, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Front pectoral clawed lobes
    drawLobe(18, -22, -1, 1.0, stepCycle);
    drawLobe(18,  22,  1, 1.0, -stepCycle);
    // Rear pelvic clawed lobes
    drawLobe(-18, -17, -1, 0.85, -stepCycle);
    drawLobe(-18,  17,  1, 0.85, stepCycle);
  }

  _drawArmoredTitanBody(ctx, bend, jaw, rune, t) {
    ctx.save();
    const snout = 72 + jaw * 2.5;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      ctx.bezierCurveTo(68, -19, 44, -29, 10, -27);
      ctx.bezierCurveTo(-22, -25, -42, -15 + bend * 4, -58, -7 + bend * 9);
      ctx.lineTo(-58, 7 + bend * 9);
      ctx.bezierCurveTo(-42, 15 + bend * 4, -22, 25, 10, 27);
      ctx.bezierCurveTo(44, 29, 68, 19, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(70, -26, -56, 26);
    g.addColorStop(0, '#2B4275');
    g.addColorStop(0.42, '#1A294D');
    g.addColorStop(0.85, '#111933');
    g.addColorStop(1, '#0C1024');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Heavy prehistoric cosmoid armor plates
    ctx.strokeStyle = 'rgba(110, 165, 235, 0.28)';
    ctx.lineWidth = 1.6;
    for (let x = 36; x >= -44; x -= 13) {
      ctx.beginPath();
      ctx.moveTo(x + 6, -28);
      ctx.lineTo(x, 0 + (x < 0 ? bend * 4 : 0));
      ctx.lineTo(x + 6, 28);
      ctx.stroke();
    }

    // Glowing Cyan Bone-Rune Flecks scattered across obsidian-sapphire armor
    const flecks = [
      [42, -12, 2.5], [42, 12, 2.5], [26, -18, 2.8], [26, 18, 2.8],
      [12, -14, 2.4], [12, 14, 2.4], [-4, -18, 2.6], [-4, 18, 2.6],
      [-20, -12, 2.3], [-20, 12, 2.3], [-36, -9, 2.0], [-36, 9, 2.0],
      [2, 0, 2.8], [-28, 0, 2.2],
    ];
    const pulse = 0.65 + 0.35 * Math.sin(t * 4.2);
    for (let i = 0; i < flecks.length; i++) {
      const [fx, fy, fr] = flecks[i];
      const by = fy + (fx < -8 ? bend * 3.5 : 0);
      ctx.fillStyle = `rgba(40, 235, 255, ${(0.25 + rune * 0.3) * pulse})`;
      ctx.beginPath();
      ctx.arc(fx, by, fr * 1.7, 0, Math.PI * 2);
      ctx.fill();

      // Diamond bone-rune fleck
      ctx.fillStyle = `rgba(175, 250, 255, ${0.7 + rune * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(fx + fr, by);
      ctx.lineTo(fx, by - fr * 0.7);
      ctx.lineTo(fx - fr, by);
      ctx.lineTo(fx, by + fr * 0.7);
      ctx.closePath();
      ctx.fill();
    }

    // Ancient cracked skull-plate rune on forehead
    ctx.strokeStyle = `rgba(72, 244, 255, ${0.65 * pulse})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.lineTo(46, -6);
    ctx.lineTo(36, 0);
    ctx.lineTo(46, 6);
    ctx.closePath();
    ctx.stroke();

    // Glossy sapphire highlight
    ctx.fillStyle = 'rgba(160, 215, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(22, -13, 22, 5.2, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across left armor plate
    ctx.strokeStyle = '#C8F8FF';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(18, -22);
    ctx.lineTo(28, -12);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalCrests(ctx, bend, rune) {
    ctx.save();
    ctx.fillStyle = '#243B6E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    // First spiky dorsal fin
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(4, -5.5);
    ctx.lineTo(-4, 0.5);
    ctx.lineTo(-10, -4.5);
    ctx.lineTo(-8, 3.5);
    ctx.lineTo(6, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Second rear dorsal fin
    ctx.beginPath();
    ctx.moveTo(-22, bend * 3);
    ctx.lineTo(-32, -4.5 + bend * 5);
    ctx.lineTo(-42, 0.5 + bend * 7);
    ctx.lineTo(-36, 3.5 + bend * 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(72, 240, 255, ${0.45 + rune * 0.4})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-8, 0);
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(48.5, side * 14.5);

      if (st === 'stress') {
        ctx.strokeStyle = '#40F0FF';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, side * -2.5);
        ctx.lineTo(2.3, 0);
        ctx.lineTo(-3.2, side * 2.5);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 5.6 : 4.7;
      ctx.fillStyle = st === 'shock' ? '#F0FFFF' : '#120C22';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.9, 0, 1.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Cursed glowing cyan-gold prehistoric iris
        ctx.fillStyle = st === 'hungry' ? '#FF2A55' : '#32E8FF';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.8, 0, 0.9, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.7, -1.2, 1.1, 0, Math.PI * 2);
        ctx.arc(-0.7, 1.3, 0.55, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#1A294D';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.25, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Armored prehistoric V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.6, side * 5.2);
        ctx.lineTo(3.8, side * 2.8);
      } else {
        ctx.moveTo(-3.6, side * 2.6);
        ctx.lineTo(4.0, side * 5.6);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#E8FFFF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(69 + jaw * 2, side * (4.8 + snap));
        ctx.lineTo(76 + jaw * 2 + snap * 1.6, side * 2.0);
        ctx.lineTo(69 + jaw * 2, side * 1.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const sx = 40 + Math.cos(a) * 32;
        const sy = Math.sin(a) * 30;
        const s = 2.9 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#32E8FF' : '#C084FC';
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
      const b = Math.abs(Math.sin(t * 16)) * 3.0;
      ctx.fillStyle = '#FF2A55';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(49, -34 - b, 4.2, 10.5, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(51.1, -20.5 - b, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(39, -30 - drop * 0.3);
      ctx.quadraticCurveTo(43.5, -25, 39, -23.5);
      ctx.quadraticCurveTo(34.5, -25, 39, -30 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(38, -26);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.5, 1.5);
        ctx.quadraticCurveTo(2.9, 2.9, 5.2, 1.8);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(48.5, 21 + fall * 0.4);
      ctx.quadraticCurveTo(51.5, 24.5 + fall * 0.4, 48.5, 26 + fall * 0.4);
      ctx.quadraticCurveTo(45.5, 24.5 + fall * 0.4, 48.5, 21 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainCoelacanthfish;
