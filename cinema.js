/* ===== Điện ảnh: camera (Tele Zoom / góc nhìn 3D) · quà ≥30 xu · TOP NGÀY giữa màn hình · hook mở màn =====
   - G.cam   : máy quay ảo. Phóng to / dịch tâm vẽ thật trên canvas (nét), nghiêng 3D bằng CSS perspective.
   - Nhạc    : mỗi cảnh nhảy tới một đoạn cao trào của nhac_game.mp3 (audio.js → A.stinger) rồi nhạc nền chạy tiếp.
   - MC      : các cảnh phát sự kiện để MC đọc cùng lúc (mc.js). */
(function () {
  'use strict';
  const G = window.G, S = G.S, TM = G.TEAMS, WP = G.WEAPONS, $ = id => document.getElementById(id);
  const C = (G.cine = { bars: 0, barsT: 0, teleCur: null, hookOn: false }), cam = (G.cam = { z: 1, fx: 0, fy: 0, tilt: 0, roll: 0, cur: null, q: [] });
  const rnd = Math.random, PI2 = Math.PI * 2, st = () => G.settings, now = () => performance.now();
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const SW = G.SW, SH = G.SH, TEAM_SAY = ['XANH', 'ĐỎ', 'XANH LÁ', 'VÀNG'];
  const cool = {}; const coolOk = (k, ms) => { const t = now(); if (t - (cool[k] || -1e9) < ms) return false; cool[k] = t; return true; };
  const A = () => G.audio;

  /* =====================================================================
     0) NHỊP ĐỘ: nghe nhạc đang phát (AnalyserNode) → xung nhịp + thanh EQ.
        Không có âm thanh thì chạy theo đồng hồ 142 BPM (đúng nhịp file nhac_game.mp3).
     ===================================================================== */
  const B = (G.beat = { v: 0, bar: 0, n: 0, eq: new Float32Array(20), real: false });
  let an = null, fd = null, avg = 0.05, peak = 0.05, lastHit = 0, clk = -1, lastQ = -1, hudEls = null;
  const BPM_MS = 60000 / 142;
  function hit(strong) { B.v = strong ? 1 : 0.8; B.n++; if (B.n % 4 === 0) B.bar = 1; }
  B.update = function (dt) {
    const au = A(), t = now(); let real = false;
    if (st().beatFx !== false && au && au.ctx && au.ctx.state === 'running' && au.mus) {
      if (!an) { try { an = au.ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = 0.5; au.mus.connect(an); fd = new Uint8Array(an.frequencyBinCount); } catch (e) { an = null; } }
      if (an) {
        an.getByteFrequencyData(fd); let b = 0, tot = 0; for (let i = 1; i < 6; i++) b += fd[i]; b /= 5 * 255; for (let i = 0; i < fd.length; i++) tot += fd[i];
        if (tot > 120) {            // đang có nhạc
          real = true; peak = Math.max(b, peak * 0.995); avg += (b - avg) * 0.06;
          if (b > avg * 1.2 + 0.015 && b > peak * 0.55 && t - lastHit > 240) { lastHit = t; hit(b > peak * 0.85); }
          for (let i = 0; i < 20; i++) { const idx = 1 + ((i * i * 0.09 + i * 0.9) | 0), tgt = Math.min(1, fd[Math.min(fd.length - 1, idx)] / 255 / Math.max(0.2, peak * 1.9)); B.eq[i] += (tgt - B.eq[i]) * 0.5; }
        }
      }
    }
    if (!real) {                    // không có nhạc → đồng hồ
      const k = Math.floor(t / BPM_MS); if (clk !== k) { if (clk >= 0) hit(false), B.v = 0.55; clk = k; }
      const ph = (t % BPM_MS) / BPM_MS; for (let i = 0; i < 20; i++) B.eq[i] += ((0.18 + 0.14 * Math.sin(t / 340 + i * 0.9)) * (0.5 + 0.5 * (1 - ph)) - B.eq[i]) * 0.2;
    }
    B.real = real; B.v *= Math.exp(-dt * 5.5); B.bar *= Math.exp(-dt * 2.6);
    const q = Math.round(B.v * 20) / 20 + Math.round(B.bar * 10) / 100;
    if (q !== lastQ) {              // đẩy xung nhịp xuống CSS (chỉ vài phần tử nhỏ)
      lastQ = q; if (!hudEls) hudEls = ['hud', 'guide', 'cine', 'hook', 'lobbyBox'].map($);
      const v = (Math.round(B.v * 20) / 20).toFixed(2);
      for (const e of hudEls) if (e) e.style.setProperty('--b', v);
    }
  };
  // vẽ trong khung bản đồ: viền sáng nhấp nháy, dải sáng quét mỗi 4 nhịp, thanh EQ sát đáy
  B.drawArena = function (ctx, W, H, tm) {
    if (st().beatFx === false) return;
    const v = B.v, bar = B.bar;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const n = 20, bw = W / n;
    for (let i = 0; i < n; i++) { const h = 5 + B.eq[i] * 36, a = 0.1 + 0.16 * B.eq[i] + 0.1 * v; const g = ctx.createLinearGradient(0, H - h, 0, H); g.addColorStop(0, 'rgba(170,130,255,0)'); g.addColorStop(1, `rgba(150,110,255,${a})`); ctx.fillStyle = g; ctx.fillRect(i * bw + 2, H - h, bw - 4, h); }
    if (bar > 0.03) { const x = (1 - bar) * (W + 220) - 110; const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,240,255,${0.16 * bar})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 90 + 60, 0); ctx.lineTo(x + 90 + 60, 0); ctx.lineTo(x + 90 - 60, H); ctx.lineTo(x - 90 - 60, H); ctx.fill(); }
    ctx.strokeStyle = `rgba(190,140,255,${0.10 + 0.45 * v})`; ctx.lineWidth = 10 + 8 * v; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.stroke();
    ctx.restore();
  };

  /* =====================================================================
     1) MÁY QUAY
     ===================================================================== */
  const neutral = () => ({ z: 1, fx: G.W / 2, fy: G.H / 2, tilt: 0, roll: 0 });
  cam.fx = G.W / 2; cam.fy = G.H / 2;
  G.arenaHooks.push(() => { if (!cam.cur) { cam.fx = G.W / 2; cam.fy = G.H / 2; } });
  function begin(o) {
    const prev = cam.cur; if (prev && prev.onEnd) { const f = prev.onEnd; prev.onEnd = null; try { f(); } catch (e) { } }
    cam.cur = Object.assign({ inT: 0.5, hold: 1.5, outT: 0.7, pri: 1, wob: 0, drift: 0, t: 0, tilt: 0, roll: 0, from: { z: cam.z, fx: cam.fx, fy: cam.fy, tilt: cam.tilt, roll: cam.roll } }, o);
    if (cam.cur.onStart) try { cam.cur.onStart(); } catch (e) { console.error(e); }
  }
  // pri cao hơn chen ngang được; thấp hơn thì xếp hàng (quá 3.5s bị bỏ)
  cam.shot = function (o) {
    o.born = now();
    if (!cam.cur || o.pri > cam.cur.pri) { begin(o); return true; }
    if (cam.q.length < 4) cam.q.push(o); return false;
  };
  cam.cancel = function () {
    cam.q.length = 0;
    if (cam.cur) { cam.cur.t = Math.max(cam.cur.t, cam.cur.inT + cam.cur.hold); cam.cur.onStart = null; }
  };
  function nextFresh() { while (cam.q.length) { const n = cam.q.shift(); if (now() - n.born < 3500) return n; } return null; }
  cam.step = function (dt) {
    let k = cam.cur;
    if (!k) {
      const n = nextFresh(); if (n) begin(n);
      k = cam.cur;
      if (!k) { if (cam.z !== 1 || cam.tilt || cam.roll) { cam.z = 1; cam.tilt = cam.roll = 0; cam.fx = G.W / 2; cam.fy = G.H / 2; } return; }
    }
    k.t += dt;
    const tIn = k.inT, tHold = k.inT + k.hold, tEnd = tHold + k.outT;
    const T = { z: k.z, fx: k.fx, fy: k.fy, tilt: k.tilt, roll: k.roll };
    if (k.t < tIn) { const u = ease(k.t / tIn); for (const p in T) cam[p] = lerp(k.from[p], T[p], u); }
    else if (k.t < tHold) {
      for (const p in T) cam[p] = T[p];
      if (k.wob) { cam.fx += (Math.sin(k.t * 7.3) + 0.4 * Math.sin(k.t * 12.1)) * k.wob; cam.fy += Math.cos(k.t * 6.1) * k.wob; }
      if (k.drift) { const q = k.t - tIn; cam.roll += Math.sin(q * 1.6) * k.drift; cam.tilt += Math.sin(q * 1.1) * k.drift * 0.6; }
    } else {
      const n = nextFresh();
      if (n) { begin(n); return; }                                     // có cảnh kế tiếp → đi thẳng sang, không quay về giữa
      if (k.t < tEnd) { const u = ease((k.t - tHold) / k.outT), N = neutral(); for (const p in T) cam[p] = lerp(T[p], N[p], u); }
      else { const f = k.onEnd; k.onEnd = null; cam.cur = null; cam.z = 1; cam.tilt = cam.roll = 0; cam.fx = G.W / 2; cam.fy = G.H / 2; if (f) try { f(); } catch (e) { } }
    }
  };
  // vùng nhìn thấy: tâm (fx,fy) về giữa khung bản đồ; kẹp để không lộ ra ngoài bản đồ
  cam.view = function (L) {
    const z = cam.z, W = G.W, H = G.H;
    if (z <= 1.0005) return { x: L.x, y: L.y, k: L.k, zoomed: false };
    const hw = W / (2 * z), hh = H / (2 * z), fx = clamp(cam.fx, hw, W - hw), fy = clamp(cam.fy, hh, H - hh), k = L.k * z;
    return { x: L.x + W * L.k / 2 - fx * k, y: L.y + H * L.k / 2 - fy * k, k, zoomed: true };
  };
  function applyCamCss() {
    const cv = $('cv'); if (!cv) return;
    if (Math.abs(cam.tilt) < 0.05 && Math.abs(cam.roll) < 0.05) { if (cv._tf) { cv.style.transform = ''; cv._tf = ''; } return; }
    const tf = `perspective(1150px) rotateX(${cam.tilt.toFixed(2)}deg) rotateZ(${cam.roll.toFixed(2)}deg)`;
    if (cv._tf !== tf) { cv.style.transformOrigin = `${SW / 2}px ${G.layout.cy.toFixed(0)}px`; cv.style.transform = tf; cv._tf = tf; }
  }

  /* =====================================================================
     2) HẠT MÀN HÌNH (canvas #fx2 phủ lên trên HUD)
     ===================================================================== */
  let fx2, c2; const P = [];
  const pp = o => { if (P.length < 520) P.push(Object.assign({ t: 0, l: 1, x: 0, y: 0, vx: 0, vy: 0, g: 0, s: 4, c: '#fff', k: 'dot', r: 0, vr: 0, add: false }, o)); };
  function burst(x, y, n, cols, sp, life, size, kind) { for (let i = 0; i < n; i++) { const a = rnd() * PI2, v = sp * (0.3 + rnd() * 0.7); pp({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 160, l: life * (0.6 + rnd() * 0.6), s: size * (0.6 + rnd() * 0.8), c: cols[(rnd() * cols.length) | 0], k: kind || 'spark', add: true }); } }
  function bolt(x1, y1, x2, y2, col, w) { const pts = [[x1, y1]], n = 9; for (let i = 1; i < n; i++) { const u = i / n; pts.push([lerp(x1, x2, u) + (rnd() - 0.5) * 70 * (1 - Math.abs(u - 0.5)), lerp(y1, y2, u)]); } pts.push([x2, y2]); pp({ k: 'bolt', pts, c: col, s: w || 4, l: 0.28, add: true }); }
  function drawStar(c, s) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.28 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
  function stepP(dt) { for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.l) { P[i] = P[P.length - 1]; P.pop(); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.r += p.vr * dt; } }
  function drawP() {
    c2.clearRect(0, 0, SW, SH);
    for (const p of P) {
      const u = p.t / p.l, a = Math.max(0, 1 - u * u);
      c2.globalAlpha = a; c2.globalCompositeOperation = p.add ? 'lighter' : 'source-over'; c2.fillStyle = c2.strokeStyle = p.c;
      switch (p.k) {
        case 'dot': c2.beginPath(); c2.arc(p.x, p.y, p.s * (1 - 0.4 * u), 0, PI2); c2.fill(); break;
        case 'spark': c2.lineWidth = Math.max(1, p.s * 0.5); c2.beginPath(); c2.moveTo(p.x, p.y); c2.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); c2.stroke(); break;
        case 'coin': { const w = Math.abs(Math.cos(p.r)) * p.s + 1; c2.fillStyle = '#ffd24a'; c2.strokeStyle = '#b8860b'; c2.lineWidth = 2; c2.beginPath(); c2.ellipse(p.x, p.y, w, p.s, 0, 0, PI2); c2.fill(); c2.stroke(); c2.fillStyle = '#fff3a8'; c2.beginPath(); c2.ellipse(p.x - w * 0.2, p.y - p.s * 0.2, w * 0.4, p.s * 0.5, 0, 0, PI2); c2.fill(); break; }
        case 'star': c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); drawStar(c2, p.s); c2.restore(); break;
        case 'petal': c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.beginPath(); c2.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, PI2); c2.fill(); c2.restore(); break;
        case 'bolt': c2.lineWidth = p.s; c2.lineJoin = 'round'; c2.beginPath(); p.pts.forEach((q, i) => i ? c2.lineTo(q[0], q[1]) : c2.moveTo(q[0], q[1])); c2.shadowColor = p.c; c2.shadowBlur = 18; c2.stroke(); c2.shadowBlur = 0; c2.lineWidth = p.s * 0.4; c2.strokeStyle = '#fff'; c2.stroke(); break;
        case 'ring': c2.lineWidth = Math.max(1, 5 * (1 - u)); c2.beginPath(); c2.arc(p.x, p.y, p.s * (0.15 + 0.85 * u), 0, PI2); c2.stroke(); break;
        case 'line': { const r0 = p.vx + (p.vy - p.vx) * u, r1 = r0 + p.s; c2.lineWidth = 2 + 3 * (1 - u); c2.beginPath(); c2.moveTo(p.x + Math.cos(p.r) * r0, p.y + Math.sin(p.r) * r0); c2.lineTo(p.x + Math.cos(p.r) * r1, p.y + Math.sin(p.r) * r1); c2.stroke(); break; }
        case 'glow': { const g = c2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(0,0,0,0)'); c2.fillStyle = g; c2.beginPath(); c2.arc(p.x, p.y, p.s, 0, PI2); c2.fill(); break; }
      }
    }
    c2.globalAlpha = 1; c2.globalCompositeOperation = 'source-over';
  }

  /* =====================================================================
     3) HIỆU ỨNG TRONG BẢN ĐỒ (vẽ cùng hệ toạ độ bản đồ → nghiêng 3D theo camera)
     ===================================================================== */
  const wfx = [], iconCache = {};
  const rgba = (h, a) => { h = h.replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };
  function iconImg(key, team) {
    const k = key + team; if (iconCache[k] !== undefined) return iconCache[k];
    let img = null; try { const u = G.iconURL && G.iconURL(key, team); if (u) { img = new Image(); img.src = u; } } catch (e) { }
    return (iconCache[k] = img);
  }
  C.drawWorld = function (ctx, t) {
    for (let i = wfx.length - 1; i >= 0; i--) {
      const e = wfx[i], ts = Math.max(0, (t - e.t0) / 1000);
      if (ts > e.dur) { wfx.splice(i, 1); continue; }
      ctx.save(); ctx.translate(e.x, e.y);
      const u = ts / e.dur, a = u < 0.12 ? u / 0.12 : u > 0.8 ? Math.max(0, (1 - u) / 0.2) : 1;
      if (e.type === 'summon') drawSummon(ctx, e, ts, a);
      else if (e.type === 'flag') drawFlag(ctx, e, ts, a);
      ctx.restore();
    }
  };
  function drawSummon(ctx, e, ts, a) {
    const col = e.c, R = 34 + e.tier * 9, grow = Math.min(1, ts / 0.35);
    ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.5 * grow); gl.addColorStop(0, rgba(col, 0.55)); gl.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, R * 1.5 * grow, 0, PI2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R * grow, 0, PI2); ctx.stroke();
    ctx.save(); ctx.rotate(ts * 1.6); ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.arc(0, 0, R * 0.74 * grow, 0, PI2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.save(); ctx.rotate(-ts * 2.4); ctx.lineWidth = 2.4;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const an = (i * 2 + k) * Math.PI / 3, x = Math.cos(an) * R * 0.68 * grow, y = Math.sin(an) * R * 0.68 * grow; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    // cột sáng
    const ph = Math.min(1, ts / 0.4) * (80 + e.tier * 24), w = 10 + e.tier * 4, pul = 0.85 + 0.15 * Math.sin(ts * 14);
    const g = ctx.createLinearGradient(0, 0, 0, -ph); g.addColorStop(0, rgba(col, 0.95 * pul)); g.addColorStop(0.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * 0.6, 0); ctx.lineTo(-w, -ph); ctx.lineTo(w, -ph); ctx.lineTo(w * 0.6, 0); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  function drawFlag(ctx, e, ts, a) {
    const col = e.c, t = TM[e.team]; ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const ph = ((ts * 0.9 + k / 3) % 1); ctx.strokeStyle = rgba(col, 0.9 * (1 - ph)); ctx.lineWidth = 4 * (1 - ph) + 1; ctx.beginPath(); ctx.arc(0, 0, 34 + ph * 110, 0, PI2); ctx.stroke(); }
    ctx.save(); ctx.rotate(ts * 1.2); ctx.setLineDash([14, 10]); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 58, 0, PI2); ctx.stroke(); ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, -105); g.addColorStop(0, rgba(col, 0.8)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(-9, -105, 18, 105);
    ctx.globalCompositeOperation = 'source-over';
    const pop = Math.min(1, ts / 0.3); ctx.font = '900 ' + (30 * (0.6 + 0.4 * pop)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText('ĐỘI ' + t.name, 0, -128); ctx.fillStyle = t.light; ctx.fillText('ĐỘI ' + t.name, 0, -128);
    ctx.font = '800 15px system-ui,sans-serif'; ctx.lineWidth = 4; const sub = e.sub || ''; ctx.strokeText(sub, 0, -102); ctx.fillStyle = '#fff'; ctx.fillText(sub, 0, -102);
    ctx.globalAlpha = 1;
  }

  /* =====================================================================
     4) LỚP PHỦ TRÊN CANVAS CHÍNH (tọa độ màn hình): tối viền Tele Zoom, khung ngắm, dải đen điện ảnh
     ===================================================================== */
  C.drawScreen = function (ctx) {
    const L = G.layout, vx = L.x, vy = L.y, vw = G.W * L.k, vh = G.H * L.k;
    const tc = C.teleCur;
    if (tc) {
      const p = clamp((cam.z - 1) / Math.max(0.2, tc.z - 1), 0, 1), t = TM[tc.team];
      if (p > 0.02) {
        ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
        const cx = vx + vw / 2, cy = vy + vh / 2, g = ctx.createRadialGradient(cx, cy, vw * 0.16, cx, cy, vw * 0.9);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (0.62 * p) + ')'); ctx.fillStyle = g; ctx.fillRect(vx, vy, vw, vh);
        const g2 = ctx.createRadialGradient(cx, cy, vw * 0.35, cx, cy, vw * 0.9); g2.addColorStop(0, rgba(t.color, 0)); g2.addColorStop(1, rgba(t.color, 0.3 * p)); ctx.fillStyle = g2; ctx.fillRect(vx, vy, vw, vh);
        ctx.globalAlpha = p; ctx.strokeStyle = t.light; ctx.lineWidth = 3; const m = 12, s = 26;
        for (const [x, y, sx, sy] of [[vx + m, vy + m, 1, 1], [vx + vw - m, vy + m, -1, 1], [vx + m, vy + vh - m, 1, -1], [vx + vw - m, vy + vh - m, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * s); ctx.lineTo(x, y); ctx.lineTo(x + sx * s, y); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '800 14px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = (now() / 450 | 0) % 2 ? '#ff4b4b' : 'rgba(255,75,75,.25)'; ctx.beginPath(); ctx.arc(vx + m + 7, vy + m + 36, 5, 0, PI2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText('TELE ZOOM ×' + cam.z.toFixed(1), vx + m + 18, vy + m + 28);
        ctx.restore();
      }
    }
    if (C.bars > 0.01) {
      const h = vh * 0.085 * C.bars; ctx.fillStyle = '#000'; ctx.fillRect(vx, vy, vw, h); ctx.fillRect(vx, vy + vh - h, vw, h);
    }
  };

  /* =====================================================================
     5) QUÀ ≥ 30 XU: hiệu ứng triệu hồi + camera (nghiêng nhẹ) + thẻ khung vẽ cho quà lớn
     ===================================================================== */
  const cleanN = n => String(n || 'Khán giả').replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 16) || 'Khán giả';
  // quà từ 99 xu (trong trận) dùng thẻ khung lớn → bảng tin nhỏ (ui.gift) bỏ qua để không chồng chữ
  C.heroWill = total => st().fx3d !== false && S.phase === 'battle' && total >= Math.max(99, st().fx3dMin || 30);
  G.on('bigspawn', e => {
    if (st().fx3d === false || !e.ent) return;
    if (e.total < (st().fx3dMin || 30)) return;
    const tier = e.total >= 3000 ? 5 : e.total >= 1000 ? 4 : e.total >= 500 ? 3 : e.total >= 99 ? 2 : 1;
    C.giftFx({ x: e.ent.x, y: e.ent.y, key: e.key, team: e.team, name: e.p ? e.p.name : '', avatar: e.p ? e.p.avatar : '', total: e.total, tier });
    if (st().tele !== false && e.total >= (st().teleMin || 500) && coolOk('tele', 25000)) setTimeout(() => C.tele(e.team, { say: false, pri: 4 }), 120);
  });
  C.giftFx = function (o) {
    const w = WP[o.key]; if (!w) return; const tm = TM[o.team] || TM[0], tier = o.tier, hold = [1.3, 1.7, 2.1, 2.5, 2.9][tier - 1];
    // góc quay chỉ nghiêng nhẹ (mạnh hơn khiến bản đồ bị méo, nhìn như tấm phẳng)
    cam.shot({ fx: o.x, fy: o.y, z: [1.4, 1.55, 1.7, 1.85, 1.8][tier - 1], tilt: [7, 10, 13, 15, 17][tier - 1], roll: (rnd() < 0.5 ? -1 : 1) * (0.8 + tier * 0.45), inT: 0.55, hold, outT: 0.8, pri: 1 + tier, drift: 0.7, name: 'gift' });
    wfx.push({ type: 'summon', x: o.x, y: o.y, t0: now(), dur: hold + 1.2, tier, c: tm.light });
    G.fx.ring(o.x, o.y, 90 + tier * 25, tm.light, 0.9, 6); G.fx.burst(o.x, o.y, tm.light, 20 + tier * 10, 220, 0.9, 4, 80);
    G.fx.shake(0.12 + 0.08 * tier); if (tier >= 2) G.fx.flash(tm.light, 0.1 + 0.04 * tier);
    A().stinger(tier >= 4 ? 'gift3' : tier >= 2 ? 'gift2' : 'gift', { tier });
    if (o.force || C.heroWill(o.total)) heroCard(o, w, tm, hold + 0.8);
    if (tier >= 3) { C.barsT = 1; setTimeout(() => { C.barsT = 0; }, (hold + 0.6) * 1000); }
  };
  // thẻ quà lớn: khung vẽ SVG theo màu đội (không dùng icon)
  function heroCard(o, w, tm, secs) {
    const host = $('cine'); if (!host) return;
    for (const old of host.querySelectorAll('.hc')) old.remove();
    const el = document.createElement('div'); el.className = 'hc t' + o.tier; el.style.setProperty('--c', tm.light); el.style.setProperty('--c2', tm.color); el.style.setProperty('--dur', secs + 's');
    el.style.top = Math.round(G.layout.y + 10) + 'px';
    el.innerHTML = `<div class="hcb">${G.frames.plate(600, 104, tm.color, 22)}<div class="hci">${G.avatar({ name: o.name, avatar: o.avatar }, 'mid')}<div class="hct"><small>${G.esc(cleanN(o.name))} triệu hồi</small><b>${G.esc(w.name.toUpperCase())}</b>${G.frames.stars(o.tier, tm.light)}</div><div class="hcx">${G.frames.glyph('coin', 28)}<b>${G.fmt(o.total)}</b><small>XU</small></div></div></div>`;
    host.appendChild(el); setTimeout(() => el.remove(), secs * 1000 + 300);
  }

  /* =====================================================================
     6) TELE ZOOM vào khu vực của một đội
     ===================================================================== */
  function teamFocus(i) {
    const T = G.T, COLS = G.COLS, ROWS = G.ROWS, b = S.teams[i].base; let sx = 0, sy = 0, n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.owner[r * COLS + c] === i) { sx += c; sy += r; n++; }
    if (!n) return { x: b.x, y: b.y };
    return { x: (sx / n * T + T / 2) * 0.45 + b.x * 0.55, y: (sy / n * T + T / 2) * 0.45 + b.y * 0.55 };
  }
  C.tele = function (team, o) {
    o = o || {}; const tm = S.teams[team]; if (!tm || st().tele === false && !o.force) return false;
    const f = teamFocus(team), z = o.z || (S.tc > 2 ? 2.3 : 2.1), t = TM[team], b = tm.base;
    return cam.shot({
      fx: f.x, fy: f.y, z, tilt: 0, roll: 0, inT: o.inT || 0.55, hold: o.hold || 2.2, outT: 0.6, pri: o.pri || 3, wob: 1.5, name: 'tele',
      onStart() {
        C.teleCur = { team, z };
        const pc = Math.round((tm.pct || 0) * 100);
        wfx.push({ type: 'flag', x: b.x, y: b.y, t0: now(), dur: (o.hold || 2.2) + 0.9, c: t.light, team, sub: `${pc}% lãnh thổ · ${tm.units + tm.structs} đơn vị` });
        G.fx.ring(b.x, b.y, 130, t.light, 0.9, 6); G.fx.burst(b.x, b.y, t.light, 28, 200, 0.9, 4, 60);
        if (!o.noMusic) A().stinger('tele'); else A().play('swoosh');
        G.ev('tele', { team, say: o.say !== false });
        if (o.intro) G.ev('teleintro', { team });
      },
      onEnd() { if (C.teleCur && C.teleCur.team === team) C.teleCur = null; },
    });
  };
  // 4 giây giới thiệu trước trận: lần lượt zoom vào từng đội (kéo dài đếm ngược; MC đọc tên đội)
  const perTeam = () => S.tc <= 2 ? 2.3 : S.tc === 3 ? 1.9 : 1.6;
  C.hasTeleIntro = () => st().tele !== false && st().teleIntro !== false;
  C.introLen = () => (C.hasTeleIntro() ? S.tc * perTeam() + 0.2 : 0);
  G.on('countdown', () => {
    if (!C.hasTeleIntro()) return;
    cam.cancel(); const per = perTeam();
    for (let i = 0; i < S.tc; i++) C.tele(i, { inT: 0.45, hold: per - 0.45, pri: 3, intro: true, say: false, noMusic: i > 0, z: S.tc > 2 ? 2.2 : 2.0 });
  });
  // đổi ngôi đáng kể → zoom vào đội vừa lên đầu
  let leadId = -1;
  function pollLead() {
    if (S.phase !== 'battle' || st().tele === false) { leadId = -1; return; }
    const o = S.teams.slice().sort((a, b) => b.pct - a.pct); const l = o[0], gap = l.pct - (o[1] ? o[1].pct : 0);
    if (leadId < 0) { if (gap > 0.01) leadId = l.id; return; }
    if (l.id !== leadId && gap >= 0.04) { leadId = l.id; if (coolOk('tele', 50000)) C.tele(l.id, { say: true, pri: 3 }); }
  }
  G.on('baseDown', e => {
    const b = e.b; cam.shot({ fx: b.x, fy: b.y, z: 2.3, tilt: 0, roll: 0, inT: 0.35, hold: 1.7, outT: 0.7, pri: 5, wob: 2.6, name: 'base' });
    A().stinger('base'); G.fx.shake(1);
  });
  G.on('result', () => { cam.cancel(); C.teleCur = null; C.barsT = 0; });

  /* =====================================================================
     7) TOP NGÀY xuất hiện giữa màn hình
     ===================================================================== */
  const THEMES = [
    { t: 'HOÀNG ĐẾ', i: '👑', c1: '#ffd24a', c2: '#fff3a8', fx: 'gold', dur: 5.8, slogan: 'Ngai vàng thuộc về tôi!' },
    { t: 'SẤM BẠC', i: '⚡', c1: '#8fc8ff', c2: '#eaf6ff', fx: 'bolt', dur: 4.8, slogan: 'Sét đánh không cần báo trước!' },
    { t: 'HOẢ LONG', i: '🔥', c1: '#ff8a3d', c2: '#ffd9b0', fx: 'fire', dur: 4.6, slogan: 'Đi tới đâu, lửa cháy tới đó!' },
    { t: 'TINH VÂN', i: '🌌', c1: '#c77dff', c2: '#f0d9ff', fx: 'star', dur: 3.7, slogan: 'Vũ trụ này là của tôi!' },
    { t: 'LỤC BẢO', i: '💎', c1: '#2fe39b', c2: '#c8ffe8', fx: 'gem', dur: 3.7, slogan: 'Quý như ngọc, hiếm như vàng!' },
    { t: 'HẢI VƯƠNG', i: '🌊', c1: '#38c8ff', c2: '#c8f0ff', fx: 'wave', dur: 3.7, slogan: 'Sóng lớn gọi tên tôi!' },
    { t: 'ANH ĐÀO', i: '🌸', c1: '#ff7ab8', c2: '#ffd0e8', fx: 'petal', dur: 3.7, slogan: 'Đẹp và mạnh!' },
    { t: 'LÔI ĐIỆN', i: '🌀', c1: '#a8ff4a', c2: '#ecffc4', fx: 'spark', dur: 3.5, slogan: 'Tốc độ là sức mạnh!' },
    { t: 'BĂNG GIÁ', i: '❄️', c1: '#bfe9ff', c2: '#ffffff', fx: 'snow', dur: 3.5, slogan: 'Bình tĩnh, lạnh lùng, chiến thắng!' },
    { t: 'LONG HỔ', i: '🐲', c1: '#ff5252', c2: '#ffc0c0', fx: 'claw', dur: 3.5, slogan: 'Long tranh hổ đấu!' },
  ];
  function vipOf(name) {
    for (const line of String(st().vipRules || '').split('\n')) { const m = /^\s*(.+?)\s*=\s*([^|]+?)\s*(?:\|\s*(.+?))?\s*$/.exec(line); if (m && m[1].toLowerCase() === String(name || '').toLowerCase().trim()) return { icon: m[2], slogan: m[3] || '' }; }
    return null;
  }
  const tq = [], lastTop = new Map(); let tcur = null;
  C.topEntrance = function (p, rank, rise) {
    if (st().dayTop === false) return false;
    const t = now(); if (!rise && (t - (lastTop.get(p.id) || -1e9)) < 360000) return false;   // mỗi người 6 phút mới hiện lại
    if (!rise && rank > 3 && (tq.length >= 2 || (tcur && tcur.rank > 3))) return false;        // top 4-10 không dồn thành hàng dài
    lastTop.set(p.id, t);
    tq.push({ p, rank, rise: !!rise });
    while (tq.length > 3) { let k = 0; for (let i = 1; i < tq.length; i++) if (tq[i].rank > tq[k].rank) k = i; tq.splice(k, 1); }
    runTop(); return true;
  };
  function runTop() {
    if (tcur || C.hookOn || !tq.length) return;
    tq.sort((a, b) => a.rank - b.rank); const it = tq.shift(); playTop(it);
  }
  // video tuỳ chọn cho TOP 1-2-3 (top.mp4 cạnh index.html, hoặc nhúng base64 khi chạy trên Streamlit)
  let vid = null, vidOK = null;
  function ensureVid() {
    if (vid) return vid;
    vid = document.createElement('video'); vid.className = 'tvid'; vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', ''); vid.preload = 'auto'; vid.playsInline = true;
    vid.addEventListener('error', () => { vidOK = false; }); vid.addEventListener('loadeddata', () => { vidOK = true; });
    let url = '';
    try { if (window.GL_TOPVID_B64) { const bin = atob(window.GL_TOPVID_B64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); url = URL.createObjectURL(new Blob([u], { type: 'video/mp4' })); } } catch (e) { }
    vid.src = url || 'top.mp4'; try { vid.load(); } catch (e) { }
    return vid;
  }
  // mỗi hạng lấy một đoạn khác nhau của video + bộ lọc màu riêng (vàng-đỏ / bạc-lam / đồng)
  const VSEG = { 1: { s: 4.2, d: 7.6, f: 'none' }, 2: { s: 9.4, d: 6.2, f: 'hue-rotate(198deg) saturate(.9) brightness(1.08)' }, 3: { s: 0.1, d: 5.8, f: 'sepia(.5) saturate(1.3) hue-rotate(-14deg) brightness(1.1)' } };
  const setVars = (el, r) => { const t = G.frames.th(r); el.style.setProperty('--m0', t.m[0]); el.style.setProperty('--m1', t.m[1]); el.style.setProperty('--m2', t.m[2]); el.style.setProperty('--deep', t.deep); el.style.setProperty('--glow', t.glow); };
  function playTop(it) {
    const { p, rank, rise } = it, th = THEMES[rank - 1], b = G.board[p.id] || {}, vip = vipOf(p.name), host = $('cine'); if (!host) return;
    const useVid = rank <= 3 && st().topVid !== false && vidOK !== false, seg = VSEG[rank];
    const dur = (useVid ? seg.d : th.dur) + (rise ? -0.3 : 0), slogan = (vip && vip.slogan) || th.slogan;
    const el = document.createElement('div'); el.className = 'tf t' + rank + (rank <= 3 ? ' big' : ' cmp'); el.style.setProperty('--c1', th.c1); el.style.setProperty('--c2', th.c2); el.style.setProperty('--dur', dur + 's'); setVars(el, rank);
    const av = G.avatar({ name: p.name, avatar: p.avatar || b.a }, 'big'), tag = (rise ? 'VƯƠN LÊN' : 'XUẤT HIỆN') + ' · TOP ' + rank + ' NGÀY';
    const stat = `${G.frames.glyph('coin', 22)}<b>${G.fmt(b.dc || 0)}</b> xu hôm nay<i></i>${G.frames.glyph('trophy', 22)}<b>${b.w || 0}</b> thắng`;
    if (rank <= 3) {
      const cw = rank === 1 ? 600 : 560, ch = rank === 1 ? 470 : 440;
      el.innerHTML = `<div class="tvbg" style="--vf:${useVid ? seg.f : 'none'}"><div class="tvfall"></div></div><div class="rays"></div>
        <div class="tcard" style="width:${cw}px;height:${ch}px"><div class="tb">${G.frames.card(rank, cw, ch)}<div class="tin"><div class="tav">${G.frames.wreath(rank, 184)}${av}</div><div class="tsub">${tag}</div><div class="ttl"><span>${th.t}</span></div><b class="tnm">${G.esc(p.name)}</b><div class="tst">${stat}</div><em>${G.esc(slogan)}</em></div></div></div>`;
      host.appendChild(el);
      if (useVid) {
        const v = ensureVid(), bg = el.querySelector('.tvbg'); bg.insertBefore(v, bg.firstChild);
        try { v.currentTime = seg.s; } catch (e) { }
        v.muted = st().topVidSound === false; v.volume = 0.85;
        const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; v.play().catch(() => { }); });
      }
    } else {
      el.innerHTML = `<div class="rays"></div><div class="tcard" style="width:620px;height:116px"><div class="tb">${G.frames.bar(rank, 620, 116)}<div class="tin"><div class="tav">${av}</div><div class="tx"><small>${tag}</small><b class="tnm">${G.esc(p.name)}</b><div class="tst">${stat}</div></div></div></div></div>`;
      host.appendChild(el);
    }
    const vsound = useVid && st().topVidSound !== false;
    tcur = { el, th, rank, t0: now(), dur, acc: 0, acc2: 0, vid: useVid };
    A().stinger('top' + rank, { gain: vsound ? 0.4 : (rank === 1 ? 1.35 : 1.2) }); if (rank <= 3 && !vsound) A().play('impact');
    G.fx.flash(th.c1, rank <= 3 ? 0.3 : 0.18); G.fx.shake(rank === 1 ? 0.6 : rank <= 3 ? 0.4 : 0.2);
    burst(SW / 2, G.layout.cy, 26 + (rank <= 3 ? 30 : 0), [th.c1, th.c2, '#fff'], 520, 1.2, 5);
    pp({ k: 'ring', x: SW / 2, y: G.layout.cy, s: 460, l: 0.9, c: th.c1, add: true });
    if (G.mc && G.mc.sayTop) G.mc.sayTop(p, rank, rise, slogan);
    setTimeout(() => { el.classList.add('out'); }, (dur - 0.6) * 1000);
    setTimeout(() => { if (useVid && vid) { try { vid.pause(); } catch (e) { } } el.remove(); tcur = null; setTimeout(runTop, 220); }, dur * 1000);
  }
  // mỗi chủ đề có kiểu hạt riêng
  function themeTick(dt) {
    const T = tcur; if (!T) return; const th = T.th, cx = SW / 2, cy = G.layout.cy, ts = (now() - T.t0) / 1000;
    T.acc += dt; T.acc2 += dt;
    switch (th.fx) {
      case 'gold':
        while (T.acc > (T.vid ? 0.09 : 0.035)) { T.acc -= (T.vid ? 0.09 : 0.035); pp({ k: 'coin', x: 30 + rnd() * 660, y: -20, vx: (rnd() - 0.5) * 60, vy: 260 + rnd() * 200, g: 260, s: 9 + rnd() * 6, r: rnd() * 6, vr: 6 + rnd() * 6, l: 3.2 }); }
        if (T.acc2 > 0.45) { T.acc2 = 0; const x = 90 + rnd() * 540, y = 140 + rnd() * 460; burst(x, y, 30, ['#ffd24a', '#fff3a8', '#ffffff', '#ff9f1a'], 340, 1.1, 4); pp({ k: 'ring', x, y, s: 110, l: 0.6, c: '#ffd24a', add: true }); }
        break;
      case 'bolt':
        if (T.acc > 0.16) { T.acc = 0; const x = 60 + rnd() * 600; bolt(x, -10, cx + (rnd() - 0.5) * 240, cy + (rnd() - 0.5) * 120, rnd() < 0.5 ? th.c1 : '#fff', 4 + rnd() * 3); if (rnd() < 0.3) G.fx.flash('#cfe6ff', 0.15); }
        break;
      case 'fire':
        while (T.acc > 0.012) { T.acc -= 0.012; const x = rnd() * SW; pp({ k: 'dot', x, y: SH + 10, vx: (rnd() - 0.5) * 80, vy: -(320 + rnd() * 420), s: 4 + rnd() * 9, c: ['#ff5a1f', '#ff9f1a', '#ffd24a'][(rnd() * 3) | 0], l: 1.8, add: true }); }
        if (T.acc2 > 0.1) { T.acc2 = 0; pp({ k: 'glow', x: cx + (rnd() - 0.5) * 380, y: cy + 80 + rnd() * 90, s: 70 + rnd() * 50, c: 'rgba(255,120,30,.55)', l: 0.6, vy: -60, add: true }); }
        break;
      case 'star':
        while (T.acc > 0.02) { T.acc -= 0.02; const a = ts * 4 + rnd() * 0.5, R = 230 + rnd() * 60; pp({ k: 'star', x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.7, vx: -Math.sin(a) * 90, vy: Math.cos(a) * 70, s: 5 + rnd() * 6, r: rnd() * 3, vr: 3, c: ['#c77dff', '#f0d9ff', '#fff'][(rnd() * 3) | 0], l: 1.1, add: true }); }
        break;
      case 'gem':
        while (T.acc > 0.04) { T.acc -= 0.04; pp({ k: 'star', x: rnd() * SW, y: -10, vx: (rnd() - 0.5) * 40, vy: 220 + rnd() * 200, s: 7 + rnd() * 7, r: rnd() * 6, vr: 4, c: ['#2fe39b', '#c8ffe8', '#fff'][(rnd() * 3) | 0], l: 3.2, add: true }); }
        break;
      case 'wave':
        if (T.acc2 > 0.4) { T.acc2 = 0; pp({ k: 'ring', x: cx, y: cy, s: 520, l: 1.2, c: th.c1, add: true }); }
        while (T.acc > 0.05) { T.acc -= 0.05; pp({ k: 'dot', x: rnd() * SW, y: SH + 6, vx: Math.sin(rnd() * 6) * 30, vy: -(160 + rnd() * 240), s: 3 + rnd() * 6, c: '#bff0ff', l: 3, add: true }); }
        break;
      case 'petal':
        while (T.acc > 0.04) { T.acc -= 0.04; pp({ k: 'petal', x: rnd() * SW, y: -10, vx: 60 + rnd() * 80, vy: 130 + rnd() * 120, s: 8 + rnd() * 6, r: rnd() * 6, vr: 3 + rnd() * 3, c: ['#ff7ab8', '#ffd0e8', '#ffb0d4'][(rnd() * 3) | 0], l: 3.6 }); }
        break;
      case 'spark':
        if (T.acc > 0.28) { T.acc = 0; const x = 80 + rnd() * 560, y = 120 + rnd() * 500; burst(x, y, 22, [th.c1, '#ecffc4', '#fff'], 420, 0.7, 3.4); bolt(x, y, x + (rnd() - 0.5) * 220, y + (rnd() - 0.5) * 220, th.c1, 3); }
        break;
      case 'snow':
        while (T.acc > 0.03) { T.acc -= 0.03; pp({ k: 'star', x: rnd() * SW, y: -10, vx: (rnd() - 0.5) * 50, vy: 90 + rnd() * 120, s: 4 + rnd() * 6, r: rnd() * 6, vr: 2, c: '#ffffff', l: 5 }); }
        if (T.acc2 > 0.7) { T.acc2 = 0; pp({ k: 'ring', x: cx, y: cy, s: 340, l: 1.0, c: '#bfe9ff', add: true }); }
        break;
      case 'claw':
        if (T.acc2 > 0.55) { T.acc2 = 0; const x0 = 80 + rnd() * 200, y0 = 120 + rnd() * 200; for (let k = 0; k < 3; k++) pp({ k: 'bolt', pts: [[x0 + k * 46, y0], [x0 + 250 + k * 46, y0 + 440]], c: '#ff5252', s: 9, l: 0.42, add: true }); G.fx.shake(0.15); }
        while (T.acc > 0.02) { T.acc -= 0.02; pp({ k: 'dot', x: rnd() * SW, y: SH + 6, vx: (rnd() - 0.5) * 80, vy: -(240 + rnd() * 300), s: 3 + rnd() * 6, c: ['#ff5252', '#ff9f1a'][(rnd() * 2) | 0], l: 1.8, add: true }); }
        break;
    }
  }
  // người chơi vừa bứt lên top 3 ngày (do tặng quà trong trận)
  const risen = new Map();
  G.on('dayrank', e => {
    if (st().dayTop === false || !G.cine) return;
    const p = e.p, list = G.dayRankList(), me = list.find(x => x.id === p.id); if (!me) return;
    const r = list.indexOf(me) + 1, before = me.dc - e.total, prev = before > 0 ? 1 + list.filter(x => x.id !== p.id && x.dc > before).length : 0;
    if (r <= 3 && (prev === 0 || prev > r) && (now() - (risen.get(p.id) || -1e9)) > 60000) { risen.set(p.id, now()); C.topEntrance(p, r, true); }
  });

  /* =====================================================================
     8) HOOK mở màn "bá khí"
     ===================================================================== */
  const HOOK_MS = 8000;
  C.willHook = () => {
    if (st().hookOn === false) return 0; const ev = Math.max(1, st().hookEvery | 0 || 1);
    return ((S.matchCount || 1) - 1) % ev === 0 ? HOOK_MS : 0;
  };
  let hookTimers = [];
  const hk = (ms, fn) => hookTimers.push(setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, ms));
  function hookText(html, cls, vars) {
    const el = $('hkTxt'); if (!el) return; el.className = ''; el.style.cssText = vars || ''; el.innerHTML = html; void el.offsetWidth; el.className = 'on ' + (cls || '');
    G.fx.shake(0.18); A().play('impact');
  }
  C.hookStop = function () { hookTimers.forEach(clearTimeout); hookTimers = []; const h = $('hook'); if (h) { h.className = ''; } $('stage').classList.remove('hooking'); C.hookOn = false; C.barsT = 0; setTimeout(runTop, 200); };
  C.hook = function () {
    const h = $('hook'); if (!h || C.hookOn) return false;
    C.hookStop(); C.hookOn = true; C.hookT0 = now(); $('stage').classList.add('hooking'); cam.cancel(); tq.length = 0; if (tcur) { if (vid) try { vid.pause(); } catch (e) { } tcur.el.remove(); tcur = null; }
    const tc = S.tc, names = S.teams.map((t, i) => TEAM_SAY[i]), cols = S.teams.map((t, i) => TM[i]);
    h.innerHTML = `<div class="hk-dark"></div><div class="hk-beams"></div><div class="hk-bar t"></div><div class="hk-bar b"></div><div class="hk-flash"></div><div id="hkTxt"></div><div class="hk-logo"><small>GAMELIVE</small><b>ĐẠI CHIẾN</b><b>LÃNH THỔ</b></div><div class="hk-cta"><span>${G.frames.glyph('chat', 30)}Gõ ${tc > 2 ? '1 · 2 · 3 · 4' : '1 hoặc 2'} để vào đội</span><span>${G.frames.glyph('gift', 30)}Thả quà = Triệu hồi vũ khí</span><span>${G.frames.glyph('heart', 30, '#ffb0c8', '#ff3d6e')}Chạm màn hình = Gọi lính</span></div>`;
    h.style.setProperty('--cy', G.layout.cy + 'px'); h.className = 'on';
    const base = i => S.bases[i] || S.bases[0], tv = c => `--g1:${c.light};--g2:${c.color};--g3:${c.light};--hc:${c.color}`;
    A().stinger('hook'); if (G.mc) G.mc.hold(HOOK_MS - 300);
    const cx = SW / 2, cy = G.layout.cy;
    // 0.0s: tối đen + camera lao vào căn cứ đội 1
    cam.shot({ fx: base(0).x, fy: base(0).y, z: 2.2, tilt: 16, roll: -2.5, inT: 0.5, hold: 1.6, outT: 0.2, pri: 9, wob: 1.4 });
    hk(150, () => hookText('TRẬN CHIẾN', 'w'));
    hk(950, () => hookText('KHÔNG KHOAN NHƯỢNG', 'r'));
    hk(1850, () => { cam.shot({ fx: base(1).x, fy: base(1).y, z: 2.2, tilt: 16, roll: 2.5, inT: 0.4, hold: 1.5, outT: 0.2, pri: 9, wob: 1.4 }); });
    if (tc <= 2) {
      hk(1900, () => hookText(names[0], 'big', tv(cols[0])));
      hk(2500, () => hookText('VS', 'w'));
      hk(2950, () => hookText(names[1], 'big', tv(cols[1])));
    } else for (let i = 0; i < tc; i++) hk(1900 + i * 440, () => hookText(names[i], 'big', tv(cols[i])));
    hk(3600, () => { cam.shot({ fx: G.W / 2, fy: G.H / 2, z: 1.4, tilt: 10, roll: 0, inT: 0.5, hold: 1.8, outT: 0.1, pri: 9, drift: 1 }); hookText(`GÕ ${tc > 2 ? '1-4' : '1 / 2'} CHỌN ĐỘI`, 'c'); });
    hk(4500, () => hookText('THẢ QUÀ = TRIỆU HỒI', 'g'));
    for (let i = 0; i < 9; i++) hk(4700 + i * 70, () => pp({ k: 'line', x: cx, y: cy, vx: 60 + rnd() * 80, vy: 120 + rnd() * 100, s: 80 + rnd() * 120, r: rnd() * PI2, l: 0.35, c: '#fff', add: true }));
    hk(5250, () => { const f = h.querySelector('.hk-flash'); if (f) f.className = 'hk-flash up'; });
    // 5.4s: DROP
    hk(5400, () => {
      h.classList.add('drop'); const f = h.querySelector('.hk-flash'); if (f) f.className = 'hk-flash down';
      const t = $('hkTxt'); if (t) t.className = ''; cam.cancel(); G.fx.flash('#fff', 0.7); G.fx.shake(1);
      for (let i = 0; i < 4; i++) pp({ k: 'ring', x: cx, y: cy, s: 380 + i * 150, l: 0.7 + i * 0.12, c: i % 2 ? '#ffd24a' : '#ffffff', add: true });
      burst(cx, cy, 70, ['#ffd24a', '#fff3a8', '#fff', '#ff7ad9', '#6ac8ff'], 700, 1.5, 5);
      for (let i = 0; i < 40; i++) pp({ k: 'line', x: cx, y: cy, vx: 120 + rnd() * 60, vy: 560 + rnd() * 260, s: 90 + rnd() * 160, r: rnd() * PI2, l: 0.55, c: '#fff', add: true });
      C.barsT = 0;
    });
    for (let i = 0; i < 6; i++) hk(5700 + i * 260, () => burst(80 + rnd() * 560, 140 + rnd() * 520, 26, [cols[i % tc].light, '#ffd24a', '#fff'], 420, 1.1, 4));
    hk(6700, () => h.classList.add('cta'));
    hk(7500, () => h.classList.add('out'));
    hk(HOOK_MS, () => { C.hookStop(); });
    return true;
  };
  G.on('lobby', e => {
    if (e.keep) return; cam.cancel(); C.hookStop(); C.teleCur = null; wfx.length = 0;
    if (C.willHook()) {           // chờ người dùng chạm màn hình để có tiếng (tối đa 6s), vì hook không có nhạc thì mất hết "bá khí"
      const id = S.matchCount, t0 = now();
      const tryStart = () => {
        if (S.phase !== 'lobby' || S.matchCount !== id) return;
        const au = G.audio, ready = au.ctx && au.ctx.state === 'running';
        if (ready || now() - t0 > 6000) { if (S.phaseT > 7) C.hook(); } else setTimeout(tryStart, 250);
      };
      setTimeout(tryStart, 120);
    }
  });

  /* =====================================================================
     9) vòng lặp
     ===================================================================== */
  let lastPoll = 0, fxActive = false;
  C.update = function (dt) {
    B.update(dt); cam.step(dt); applyCamCss();
    C.bars += (C.barsT - C.bars) * Math.min(1, dt * 6);
    if (!fx2) { fx2 = $('fx2'); if (fx2) { fx2.width = SW; fx2.height = SH; c2 = fx2.getContext('2d'); } }
    if (tcur) themeTick(dt);
    if (c2) { if (P.length) { stepP(dt); drawP(); fxActive = true; } else if (fxActive) { c2.clearRect(0, 0, SW, SH); fxActive = false; } }
    const t = now(); if (t - lastPoll > 1000) { lastPoll = t; pollLead(); }
  };
  // thử nhanh từ menu
  C.demoTop = function (rank) {
    const fake = { id: 'demo_top', name: 'Người Thử Nghiệm', avatar: '' };
    G.board[fake.id] = Object.assign(G.board[fake.id] || { n: fake.name, c: 0, w: 3, m: 0 }, { dc: 12500 - rank * 900, d: G.today() });
    lastTop.delete(fake.id); tq.length = 0; if (tcur) { tcur.el.remove(); tcur = null; }
    C.topEntrance(fake, rank, false); delete G.board[fake.id];
  };
  C.demoGift = function (key, total) {
    const e = { team: 0, key, total, p: { name: 'Người Thử Nghiệm', avatar: '' } }, b = S.bases[0], off = (rnd() - 0.5) * 160, x = clamp((b.x + (S.bases[1] || b).x) / 2 + off, 60, G.W - 60), y = clamp((b.y + (S.bases[1] || b).y) / 2 + off, 60, G.H - 60);
    const tier = total >= 3000 ? 5 : total >= 1000 ? 4 : total >= 500 ? 3 : total >= 99 ? 2 : 1;
    C.giftFx({ x, y, key, team: 0, name: e.p.name, avatar: '', total, tier, force: true });
  };
})();
