/**
 * Jagged Volcanic Obsidian Shard — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 88x80px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Obsidianrock {
  static metadata = {
    name: 'Jagged Volcanic Obsidian Shard',
    category: 'pebble_rock',
    baseLength: 88,
    baseWidth: 80
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

  _tracePoly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
  }

  _drawSparkle(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#F5F3FF';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
    ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
    ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
    ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
    ctx.closePath();
    ctx.fill();
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

    // Razor-edged angular volcanic glass shard silhouette (fits within 88x80)
    const shardOuter = [
      [-40, -6],
      [-26, -30],
      [-2, -37],
      [26, -24],
      [41, -4],
      [32, 22],
      [8, 36],
      [-22, 30],
      [-37, 14]
    ];

    // Secondary small splinter chip detached slightly at lower-right
    const splinter = [
      [29, 24], [40, 21], [37, 32], [26, 33]
    ];

    // Sharp cast shadow
    ctx.save();
    ctx.translate(4, 5.5);
    this._tracePoly(ctx, shardOuter);
    ctx.fillStyle = 'rgba(14, 10, 28, 0.30)';
    ctx.fill();
    this._tracePoly(ctx, splinter);
    ctx.fill();
    ctx.restore();

    // Base jet-black volcanic glass fill
    this._tracePoly(ctx, shardOuter);
    const baseGrad = ctx.createLinearGradient(-38, -34, 38, 34);
    baseGrad.addColorStop(0, '#2B2242');
    baseGrad.addColorStop(0.42, '#141122');
    baseGrad.addColorStop(1, '#090712');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // Clip to main shard for sharp conchoidal fracture planes & indigo-violet specular highlights
    ctx.save();
    this._tracePoly(ctx, shardOuter);
    ctx.clip();

    // 1. Bright indigo-violet upper-left glass plane
    const facetNW = [[-40, -6], [-26, -30], [-2, -37], [-6, -12], [-22, 2]];
    const gradNW = ctx.createLinearGradient(-38, -32, -8, 0);
    gradNW.addColorStop(0, '#6366F1');
    gradNW.addColorStop(0.45, '#3730A3');
    gradNW.addColorStop(1, '#1E1B4B');
    this._tracePoly(ctx, facetNW);
    ctx.fillStyle = gradNW;
    ctx.fill();

    // 2. North-east steep glass slope
    const facetNE = [[-2, -37], [26, -24], [41, -4], [14, -4], [-6, -12]];
    const gradNE = ctx.createLinearGradient(-2, -36, 32, -6);
    gradNE.addColorStop(0, '#4338CA');
    gradNE.addColorStop(0.55, '#1E1B3A');
    gradNE.addColorStop(1, '#100D1E');
    this._tracePoly(ctx, facetNE);
    ctx.fillStyle = gradNE;
    ctx.fill();

    // 3. Central glossy obsidian crown facet
    const facetCenter = [[-22, 2], [-6, -12], [14, -4], [10, 16], [-10, 18]];
    const gradCenter = ctx.createLinearGradient(-18, -10, 14, 18);
    gradCenter.addColorStop(0, '#4F46E5');
    gradCenter.addColorStop(0.35, '#251E4A');
    gradCenter.addColorStop(1, '#120E24');
    this._tracePoly(ctx, facetCenter);
    ctx.fillStyle = gradCenter;
    ctx.fill();

    // 4. Deep obsidian shadow south-east plane with cool violet rim bounce
    const facetSE = [[14, -4], [41, -4], [32, 22], [8, 36], [10, 16]];
    const gradSE = ctx.createLinearGradient(14, 0, 34, 30);
    gradSE.addColorStop(0, '#130F24');
    gradSE.addColorStop(0.75, '#0B0816');
    gradSE.addColorStop(1, '#2E1F54');
    this._tracePoly(ctx, facetSE);
    ctx.fillStyle = gradSE;
    ctx.fill();

    // 5. Lower-left angular fracture plane
    const facetSW = [[-40, -6], [-22, 2], [-10, 18], [8, 36], [-22, 30], [-37, 14]];
    const gradSW = ctx.createLinearGradient(-34, 2, -4, 32);
    gradSW.addColorStop(0, '#241D44');
    gradSW.addColorStop(0.6, '#141026');
    gradSW.addColorStop(1, '#090714');
    this._tracePoly(ctx, facetSW);
    ctx.fillStyle = gradSW;
    ctx.fill();

    // Conchoidal curved ripple rings (signature volcanic glass fracture arcs!)
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.30)';
    ctx.lineWidth = 1.1;
    const ripples = [
      [-18, -18, 12, 0.1, 1.4],
      [-18, -18, 17, 0.15, 1.35],
      [18, 8, 13, 2.5, 4.1],
      [18, 8, 18, 2.6, 3.95],
      [-12, 20, 11, -1.2, 0.2]
    ];
    for (const [rx, ry, rr, a0, a1] of ripples) {
      ctx.beginPath();
      ctx.arc(rx, ry, rr, a0, a1);
      ctx.stroke();
    }

    // Razor-sharp dramatic indigo-violet & icy-white specular slash reflections
    ctx.fillStyle = 'rgba(196, 181, 253, 0.72)';
    ctx.beginPath();
    ctx.moveTo(-24, -27);
    ctx.lineTo(-4, -34);
    ctx.lineTo(-9, -15);
    ctx.lineTo(-22, -16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(238, 242, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-16, -25);
    ctx.lineTo(-6, -29);
    ctx.lineTo(-10, -18);
    ctx.closePath();
    ctx.fill();

    // Crisp violet glowing edge ridges along internal facet seams
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.78)';
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.lineTo(-6, -12);
    ctx.lineTo(14, -4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(129, 140, 248, 0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-2, -36);
    ctx.moveTo(14, -4);
    ctx.lineTo(10, 16);
    ctx.lineTo(-10, 18);
    ctx.stroke();

    // Secondary cyan-violet glossy streak across center facet
    ctx.strokeStyle = 'rgba(224, 231, 255, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(4, -7);
    ctx.stroke();

    ctx.restore(); // end main shard clip

    // Bold expressive dark-indigo-espresso outline (#1E142B)
    this._tracePoly(ctx, shardOuter);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Render detached obsidian splinter chip
    this._tracePoly(ctx, splinter);
    const spGrad = ctx.createLinearGradient(26, 21, 40, 33);
    spGrad.addColorStop(0, '#4F46E5');
    spGrad.addColorStop(0.5, '#1A1433');
    spGrad.addColorStop(1, '#090712');
    ctx.fillStyle = spGrad;
    ctx.fill();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // Specular edge glint on splinter
    ctx.strokeStyle = 'rgba(196, 181, 253, 0.75)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(30, 24.5);
    ctx.lineTo(38, 22.5);
    ctx.stroke();

    // Sharp crystalline star glints at glass ridge peaks
    this._drawSparkle(ctx, -6, -12, 4.4);
    this._drawSparkle(ctx, -23, -27, 2.8);

    ctx.restore();
  }
}

export default Obsidianrock;
