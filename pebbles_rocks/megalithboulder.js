/**
 * Colossal Cracked Seabed Monolith — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 185x160px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Megalithboulder {
  static metadata = {
    name: 'Colossal Cracked Seabed Monolith',
    category: 'pebble_rock',
    baseLength: 185,
    baseWidth: 160
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(_name) {}
  update(_dt) {}

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(_name, _callback) {}

  _traceRoundedPoly(ctx, pts, radius = 9) {
    const n = pts.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const v1x = p0[0] - p1[0];
      const v1y = p0[1] - p1[1];
      const v2x = p2[0] - p1[0];
      const v2y = p2[1] - p1[1];
      const l1 = Math.hypot(v1x, v1y) || 1;
      const l2 = Math.hypot(v2x, v2y) || 1;
      const r = Math.min(radius, l1 * 0.36, l2 * 0.36);
      const sx = p1[0] + (v1x / l1) * r;
      const sy = p1[1] + (v1y / l1) * r;
      const ex = p1[0] + (v2x / l2) * r;
      const ey = p1[1] + (v2y / l2) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
      ctx.quadraticCurveTo(p1[0], p1[1], ex, ey);
    }
    ctx.closePath();
  }

  _drawRubblePebble(ctx, x, y, rx, ry, rot, light, mid, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.fillStyle = 'rgba(14, 12, 28, 0.28)';
    ctx.beginPath();
    ctx.ellipse(1.5, 2.2, rx * 1.05, ry * 0.98, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, Math.max(rx, ry) * 1.15);
    grad.addColorStop(0, light);
    grad.addColorStop(0.55, mid);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = 'rgba(230, 245, 255, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.28, -ry * 0.28, rx * 0.32, ry * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Colossal seabed monolith split into two massive weathered halves by a deep zig-zag canyon crack
    const leftHalf = [
      [-78, -14], [-64, -52], [-22, -68], [16, -64],
      [6, -34], [18, -8], [-4, 18], [10, 44], [-8, 66],
      [-48, 62], [-74, 34]
    ];

    const rightHalf = [
      [26, -62], [60, -48], [80, -14], [76, 26],
      [54, 58], [12, 66], [22, 42], [8, 16],
      [30, -10], [18, -36]
    ];

    // Deep seabed ambient shadow bed beneath monolith & rubble ring
    const bedGrad = ctx.createRadialGradient(4, 6, 30, 4, 6, 94);
    bedGrad.addColorStop(0, 'rgba(12, 10, 26, 0.44)');
    bedGrad.addColorStop(0.74, 'rgba(14, 16, 34, 0.18)');
    bedGrad.addColorStop(1, 'rgba(14, 16, 34, 0)');
    ctx.fillStyle = bedGrad;
    ctx.beginPath();
    ctx.ellipse(3, 6, 90, 76, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- RING OF SMALLER WEATHERED RUBBLE PEBBLES AROUND THE MONOLITH ---
    const rubble = [
      [-80, -34, 8.5, 6.2,  0.4,  '#8494A6', '#5A697B', '#384352'],
      [-74,  52, 9.2, 6.8, -0.3,  '#7D8F9E', '#526272', '#333F4D'],
      [-26,  71, 8.0, 5.5,  0.2,  '#8A9BA8', '#5E6E7E', '#3A4654'],
      [ 36,  68, 9.8, 6.6, -0.25, '#7A8C9C', '#516070', '#313C4A'],
      [ 82,  38, 7.6, 5.8,  0.55, '#8697A6', '#5B6A7C', '#384452'],
      [ 83, -30, 8.8, 6.2, -0.45, '#7F91A0', '#546474', '#333E4C'],
      [ 46, -66, 7.8, 5.4,  0.32, '#8A9CA8', '#607080', '#3B4756'],
      [-46, -65, 7.4, 5.2, -0.38, '#8E9FAD', '#627384', '#3D4958']
    ];
    for (const [rx, ry, a, b, rot, l, m, d] of rubble) {
      this._drawRubblePebble(ctx, rx, ry, a, b, rot, l, m, d);
    }

    // --- DEEP SHADED ZIG-ZAG CANYON CHASM CORE (visible between the two monolith halves) ---
    ctx.beginPath();
    ctx.moveTo(14, -64);
    ctx.lineTo(28, -62);
    ctx.lineTo(20, -36);
    ctx.lineTo(32, -10);
    ctx.lineTo(10, 16);
    ctx.lineTo(24, 42);
    ctx.lineTo(14, 66);
    ctx.lineTo(-10, 66);
    ctx.lineTo(8, 44);
    ctx.lineTo(-6, 18);
    ctx.lineTo(16, -8);
    ctx.lineTo(4, -34);
    ctx.closePath();
    const chasmGrad = ctx.createLinearGradient(0, -64, 24, 66);
    chasmGrad.addColorStop(0, '#0E1220');
    chasmGrad.addColorStop(0.5, '#131A2C');
    chasmGrad.addColorStop(1, '#0A0D18');
    ctx.fillStyle = chasmGrad;
    ctx.fill();

    // Subtle deep-sea teal glow deep inside the canyon floor
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.20)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(16, -54);
    ctx.lineTo(12, -34);
    ctx.lineTo(24, -9);
    ctx.lineTo(2, 17);
    ctx.lineTo(16, 43);
    ctx.lineTo(4, 60);
    ctx.stroke();

    // Helper to render each monumental half with multi-plane facets & ancient erosion grooves
    const drawMonolithHalf = (pts, isLeft) => {
      // Cast shadow onto seabed
      ctx.save();
      ctx.translate(4.5, 6.5);
      this._traceRoundedPoly(ctx, pts, 8);
      ctx.fillStyle = 'rgba(12, 10, 26, 0.34)';
      ctx.fill();
      ctx.restore();

      // Base ancient seabed stone fill (cool slate-teal weathered grey)
      this._traceRoundedPoly(ctx, pts, 8);
      const grad = ctx.createLinearGradient(-74, -64, 76, 64);
      grad.addColorStop(0, isLeft ? '#94A6B4' : '#8596A6');
      grad.addColorStop(0.5, isLeft ? '#687989' : '#5C6C7C');
      grad.addColorStop(1, '#3B4756');
      ctx.fillStyle = grad;
      ctx.fill();

      // Clipped sculpted facets, ancient carved erosion grooves & weathered pitting
      ctx.save();
      this._traceRoundedPoly(ctx, pts, 8);
      ctx.clip();

      if (isLeft) {
        // Sunlit north-west upper terrace
        ctx.fillStyle = 'rgba(218, 232, 244, 0.28)';
        ctx.beginPath();
        ctx.moveTo(-80, -16); ctx.lineTo(-66, -54); ctx.lineTo(-22, -70);
        ctx.lineTo(16, -64); ctx.lineTo(-6, -24); ctx.lineTo(-42, -10);
        ctx.closePath();
        ctx.fill();

        // Deep shaded lower-left cliff slope
        ctx.fillStyle = 'rgba(20, 26, 42, 0.34)';
        ctx.beginPath();
        ctx.moveTo(-76, 34); ctx.lineTo(-34, 18); ctx.lineTo(12, 44);
        ctx.lineTo(-8, 68); ctx.lineTo(-50, 64);
        ctx.closePath();
        ctx.fill();

        // Elevated flat crown plateau on left half
        const crownL = [[-54, -28], [-22, -48], [2, -40], [-4, -14], [-34, 8], [-58, -6]];
        this._traceRoundedPoly(ctx, crownL, 5);
        ctx.fillStyle = 'rgba(182, 198, 212, 0.24)';
        ctx.fill();

        // Crisp sunlit bevel along crown & canyon lip
        ctx.strokeStyle = 'rgba(228, 242, 252, 0.52)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-54, -8); ctx.lineTo(-52, -28); ctx.lineTo(-22, -47); ctx.lineTo(0, -40);
        ctx.stroke();

        // Faint ancient carved spiral & geometric erosion grooves
        ctx.strokeStyle = 'rgba(28, 38, 52, 0.45)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-46, -22); ctx.lineTo(-24, -34); ctx.lineTo(-10, -24); ctx.lineTo(-24, -12);
        ctx.moveTo(-42, 16); ctx.lineTo(-20, 14); ctx.lineTo(-14, 34); ctx.lineTo(-36, 40);
        ctx.stroke();

        // Pale teal mineral inlay highlight beside carved grooves
        ctx.strokeStyle = 'rgba(153, 246, 228, 0.28)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-45, -20.5); ctx.lineTo(-23, -32.5); ctx.lineTo(-10, -22.5);
        ctx.moveTo(-41, 17.5); ctx.lineTo(-19, 15.5); ctx.lineTo(-13, 35.5);
        ctx.stroke();
      } else {
        // Sunlit canyon lip edge on right half
        ctx.fillStyle = 'rgba(206, 222, 236, 0.22)';
        ctx.beginPath();
        ctx.moveTo(26, -64); ctx.lineTo(62, -48); ctx.lineTo(44, -14); ctx.lineTo(18, -36);
        ctx.closePath();
        ctx.fill();

        // Deep shadow south-east monolith face
        ctx.fillStyle = 'rgba(18, 22, 38, 0.42)';
        ctx.beginPath();
        ctx.moveTo(82, -14); ctx.lineTo(78, 28); ctx.lineTo(54, 60);
        ctx.lineTo(10, 68); ctx.lineTo(26, 22); ctx.lineTo(48, 2);
        ctx.closePath();
        ctx.fill();

        // Elevated weathered crown on right half
        const crownR = [[28, -42], [54, -28], [60, 4], [38, 26], [16, 14], [32, -10]];
        this._traceRoundedPoly(ctx, crownR, 5);
        ctx.fillStyle = 'rgba(162, 178, 194, 0.20)';
        ctx.fill();

        // Sunlit rim highlight along right canyon wall
        ctx.strokeStyle = 'rgba(224, 240, 252, 0.58)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(26, -60); ctx.lineTo(19, -36); ctx.lineTo(31, -10); ctx.lineTo(9, 16); ctx.lineTo(22, 42);
        ctx.stroke();

        // Faint ancient carved erosion grooves on right monolith
        ctx.strokeStyle = 'rgba(24, 34, 48, 0.48)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(34, -26); ctx.lineTo(52, -18); ctx.lineTo(46, 4); ctx.lineTo(28, 8);
        ctx.moveTo(32, 28); ctx.lineTo(50, 26); ctx.lineTo(44, 44);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(153, 246, 228, 0.24)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(35, -24.5); ctx.lineTo(51, -16.5); ctx.lineTo(45, 5.5);
        ctx.stroke();
      }

      // Weathered seabed pitting & barnacle-like mineral specks
      const specks = isLeft
        ? [[-60, 4, 2.4], [-34, -42, 2.2], [-46, 36, 2.6], [-18, 48, 2.0], [-14, -4, 2.2], [-64, -26, 1.9]]
        : [[64, -18, 2.4], [58, 24, 2.6], [36, 46, 2.1], [42, -40, 2.0], [66, 8, 1.9], [24, 34, 2.2]];
      for (const [sx, sy, sr] of specks) {
        ctx.fillStyle = 'rgba(22, 28, 42, 0.42)';
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // end monolith half clip

      // Bold expressive monolith outline (#1E142B)
      this._traceRoundedPoly(ctx, pts, 8);
      ctx.strokeStyle = '#1E142B';
      ctx.lineWidth = 3.2;
      ctx.stroke();
    };

    drawMonolithHalf(leftHalf, true);
    drawMonolithHalf(rightHalf, false);

    // Subtle sea-moss / lichen tufts clinging near the top canyon rim
    const lichen = [
      [-14, -52, 4.5], [-7, -50, 3.6], [42, -38, 4.2], [48, -34, 3.2], [-48, 44, 4.8], [-40, 48, 3.5]
    ];
    for (const [lx, ly, lr] of lichen) {
      ctx.fillStyle = 'rgba(52, 148, 118, 0.65)';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(134, 239, 172, 0.45)';
      ctx.beginPath();
      ctx.arc(lx - lr * 0.25, ly - lr * 0.25, lr * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Megalithboulder;
