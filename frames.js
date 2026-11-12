/* ===== Khung vẽ tay (SVG) — thay cho icon/emoji: khung top, huy chương, vòng nguyệt quế, khung quà, góc trang trí =====
   Tất cả là hình vector vẽ bằng code, có chiều sâu: viền kim loại vát cạnh, bóng, viên ngọc, ánh sáng. */
(function () {
  'use strict';
  const G = window.G; let uid = 0;
  const TH = {
    1: { m: ['#fff7cf', '#f4c542', '#8f5a06'], glow: '#ffcf4a', deep: '#2a1a02', gem: '#ff4b6a' },
    2: { m: ['#ffffff', '#c3d0e6', '#5f6f8c'], glow: '#9fd0ff', deep: '#0d1830', gem: '#4aa8ff' },
    3: { m: ['#ffe3c4', '#e0893f', '#7a3a12'], glow: '#ff9a52', deep: '#2a1206', gem: '#ffb02e' },
    4: { m: ['#f1e6ff', '#a47bff', '#4a2a9a'], glow: '#b48cff', deep: '#150a38', gem: '#7de9ff' },
  };
  const th = r => TH[r] || TH[4];
  const cham = (x, y, w, h, c) => `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}H${x + c}L${x} ${y + h - c}V${y + c}Z`;
  const mgrad = (id, m) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset=".42" stop-color="${m[1]}"/><stop offset=".56" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[1]}"/></linearGradient>`;
  // tạo bảng màu kim loại từ một màu bất kỳ (dùng cho khung quà theo màu đội)
  const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mixc = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
  const tint = c => ({ m: [mixc(c, '#ffffff', 0.7), mixc(c, '#ffffff', 0.1), mixc(c, '#000000', 0.5)], glow: c, deep: mixc(c, '#000000', 0.82), gem: mixc(c, '#ffffff', 0.5) });

  /* ---- tấm khung chính (thân kính tối + viền kim loại vát + hạt ngọc trai + 4 góc) ---- */
  function plate(id, w, h, t, o) {
    o = o || {}; const c = o.cut || 24, m = t.m;
    let s = `<defs>${mgrad('m' + id, m)}
      <linearGradient id="b${id}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${t.glow}" stop-opacity=".30"/><stop offset=".5" stop-color="${t.deep}" stop-opacity=".9"/><stop offset="1" stop-color="#07030f" stop-opacity=".96"/></linearGradient>
      <pattern id="p${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="none"/><rect width="1.4" height="8" fill="#fff" opacity=".05"/></pattern>
      <linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><filter id="f${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>`;
    s += `<path d="${cham(6, 6, w - 12, h - 12, c)}" fill="none" stroke="${t.glow}" stroke-width="12" opacity=".6" filter="url(#f${id})"/>`;
    s += `<path d="${cham(6, 6, w - 12, h - 12, c)}" fill="url(#b${id})"/><path d="${cham(6, 6, w - 12, h - 12, c)}" fill="url(#p${id})"/>`;
    s += `<path d="${cham(8, 8, w - 16, (h - 16) * 0.5, c - 2)}" fill="url(#s${id})"/>`;
    s += `<path d="${cham(6, 6, w - 12, h - 12, c)}" fill="none" stroke="${t.deep}" stroke-width="15"/>`;
    s += `<path d="${cham(6, 6, w - 12, h - 12, c)}" fill="none" stroke="url(#m${id})" stroke-width="9" stroke-linejoin="round"/>`;
    s += `<path d="${cham(10.5, 10.5, w - 21, h - 21, c - 4)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4"/>`;
    s += `<path d="${cham(19, 19, w - 38, h - 38, Math.max(8, c - 10))}" fill="none" stroke="${m[1]}" stroke-opacity=".8" stroke-width="1.6"/>`;
    s += `<path d="${cham(27, 27, w - 54, h - 54, Math.max(6, c - 16))}" fill="none" stroke="${m[0]}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
    if (o.corners !== false) for (const [x, y, sx, sy] of [[10, 10, 1, 1], [w - 10, 10, -1, 1], [10, h - 10, 1, -1], [w - 10, h - 10, -1, -1]])
      s += `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M-4 54V18Q-4 -4 18 -4H54" fill="none" stroke="${t.deep}" stroke-width="10" stroke-linecap="round"/><path d="M-4 54V18Q-4 -4 18 -4H54" fill="none" stroke="url(#m${id})" stroke-width="6" stroke-linecap="round"/><path d="M12 42V28Q12 12 28 12H42" fill="none" stroke="${m[0]}" stroke-opacity=".9" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="8" r="8" fill="${t.deep}"/><circle cx="8" cy="8" r="6" fill="${t.gem}" stroke="${m[0]}" stroke-width="1.6"/><circle cx="6" cy="6" r="2" fill="#fff" opacity=".85"/></g>`;
    return s;
  }
  const wrap = (w, h, top, body, cls) => `<svg class="${cls || 'fr'}" viewBox="0 ${-top} ${w} ${h + top}" width="${w}" height="${h + top}" style="position:absolute;left:0;top:${-top}px;overflow:visible;pointer-events:none">${body}</svg>`;

  /* ---- khung TOP (hạng 1-3: cánh + huy hiệu + vương miện) ---- */
  function crest(id, rank, t) {
    const m = t.m; let s = '';
    for (const sd of [-1, 1]) {
      s += `<g transform="scale(${sd} 1)">`;
      for (let i = 4; i >= 0; i--) s += `<path transform="rotate(${i * 11 - 8}) scale(${1 - i * 0.1} ${1 - i * 0.04})" d="M40 -4C70 -26 124 -26 160 -4C122 -10 76 -6 40 9Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="2" stroke-linejoin="round"/><path transform="rotate(${i * 11 - 8}) scale(${1 - i * 0.1} ${1 - i * 0.04})" d="M48 -3C80 -18 120 -18 150 -5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>`;
      s += `</g>`;
    }
    if (rank === 1) s += `<g transform="translate(0 -86)"><path d="M-44 20L-50 -22L-25 -3L0 -36L25 -3L50 -22L44 20Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="3.5" stroke-linejoin="round"/><path d="M-44 20H44V32H-44Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="3" stroke-linejoin="round"/><path d="M-36 8L-40 -14L-22 -1" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>${[[-50, -22], [0, -36], [50, -22]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${m[0]}" stroke="${t.deep}" stroke-width="2.4"/>`).join('')}${[[-24, 12, '#4aa8ff'], [0, 8, t.gem], [24, 12, '#3de39a']].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5.4" fill="${p[2]}" stroke="${t.deep}" stroke-width="2"/><circle cx="${p[0] - 1.6}" cy="${p[1] - 1.8}" r="1.6" fill="#fff" opacity=".9"/>`).join('')}</g>`;
    else if (rank === 2) s += `<g transform="translate(0 -78)"><path d="M0 -26L8 -8L28 -8L12 4L18 24L0 12L-18 24L-12 4L-28 -8L-8 -8Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="3" stroke-linejoin="round"/></g>`;
    else s += `<g transform="translate(0 -80)"><path d="M-30 -8L0 -26L30 -8V4L0 -14L-30 4Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="3" stroke-linejoin="round"/><path d="M-30 14L0 -4L30 14V26L0 8L-30 26Z" fill="url(#m${id})" stroke="${t.deep}" stroke-width="3" stroke-linejoin="round"/></g>`;
    s += `<circle r="50" fill="${t.deep}" opacity=".5" cy="3"/><circle r="48" fill="${t.deep}"/><circle r="45" fill="url(#m${id})"/><circle r="36" fill="${t.deep}"/><circle r="36" fill="url(#r${id})"/><circle r="36" fill="none" stroke="${m[0]}" stroke-opacity=".8" stroke-width="1.5"/>`;
    s += `<text y="16" text-anchor="middle" font-size="48" font-weight="800" fill="${m[0]}" stroke="${t.deep}" stroke-width="5" paint-order="stroke" style="font-family:inherit">${rank}</text>`;
    s += `<path d="M-30 -14A36 36 0 0 1 8 -34" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  }
  G.frames = {
    th, tint,
    card(rank, w, h) {
      const id = 'k' + (++uid), t = th(rank);
      return wrap(w, h, 150, `<defs><radialGradient id="r${id}" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="${t.glow}" stop-opacity=".95"/><stop offset="1" stop-color="${t.deep}"/></radialGradient></defs>` + plate(id, w, h, t, { cut: 28 }) + `<g transform="translate(${w / 2} 4)">${crest(id, rank, t)}</g>`);
    },
    // khung dải ngang (hạng 4-10): có huy hiệu số bên phải
    bar(rank, w, h) {
      const id = 'k' + (++uid), t = th(4);
      return wrap(w, h, 0, `<defs><radialGradient id="r${id}" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.deep}"/></radialGradient></defs>` + plate(id, w, h, t, { cut: 20, corners: false }) +
        `<g transform="translate(${w - 62} ${h / 2})"><circle r="30" fill="${t.deep}"/><circle r="27" fill="url(#m${id})"/><circle r="20" fill="url(#r${id})"/><text y="9" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" stroke="${t.deep}" stroke-width="4" paint-order="stroke" style="font-family:inherit">${rank}</text></g>`);
    },
    // khung quà: màu theo đội
    plate(w, h, color, cut) {
      const id = 'k' + (++uid), t = tint(color);
      return wrap(w, h, 0, plate(id, w, h, t, { cut: cut || 22, corners: true }));
    },
    // vòng nguyệt quế quanh avatar
    wreath(rank, size) {
      const id = 'k' + (++uid), t = th(rank), m = t.m, c = size / 2, R = size * 0.43;
      let s = `<defs>${mgrad('m' + id, m)}</defs>`;
      for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) {
        const ph = (22 + i * 15) * Math.PI / 180, x = c + sd * R * Math.sin(ph), y = c + R * Math.cos(ph);
        const ang = Math.atan2(-Math.sin(ph), sd * Math.cos(ph)) * 180 / Math.PI + sd * -22;
        s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(13 - i * 0.55).toFixed(1)}" ry="5.4" transform="rotate(${ang.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#m${id})" stroke="${t.deep}" stroke-width="1.4"/>`;
      }
      s += `<circle cx="${c}" cy="${c}" r="${size * 0.335}" fill="none" stroke="${t.deep}" stroke-width="11"/><circle cx="${c}" cy="${c}" r="${size * 0.335}" fill="none" stroke="url(#m${id})" stroke-width="7"/><circle cx="${c}" cy="${c}" r="${size * 0.305}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/>`;
      return `<svg class="wr" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${s}</svg>`;
    },
    // 4 góc trang trí cho bảng (đặt trong phần tử position:relative)
    corners(c1, c2) {
      const id = 'k' + (++uid), g = `<linearGradient id="m${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2 || '#fff'}"/><stop offset="1" stop-color="${c1 || '#a47bff'}"/></linearGradient>`;
      const one = cls => `<i class="cn ${cls}"><svg viewBox="0 0 40 40" width="40" height="40"><defs>${g}</defs><path d="M3 38V14Q3 3 14 3H38" fill="none" stroke="#0008" stroke-width="9" stroke-linecap="round"/><path d="M3 38V14Q3 3 14 3H38" fill="none" stroke="url(#m${id})" stroke-width="5" stroke-linecap="round"/><circle cx="8" cy="8" r="5" fill="${c1 || '#a47bff'}" stroke="#fff" stroke-width="1.6"/><circle cx="6.6" cy="6.4" r="1.5" fill="#fff"/></svg></i>`;
      return one('tl') + one('tr') + one('bl') + one('br');
    },
    medal(i, size) {
      if (i > 2) return `<em class="mn">${i + 1}</em>`;
      const id = 'k' + (++uid), t = th(i + 1), s = size || 24;
      return `<svg class="md" viewBox="0 0 28 28" width="${s}" height="${s}"><defs>${mgrad('m' + id, t.m)}</defs><path d="M8 0L14 10L20 0Z" fill="${t.gem}" opacity=".9"/><circle cx="14" cy="16" r="11" fill="${t.deep}"/><circle cx="14" cy="16" r="9.6" fill="url(#m${id})"/><circle cx="14" cy="16" r="6.6" fill="none" stroke="${t.deep}" stroke-opacity=".55" stroke-width="1.2"/><text x="14" y="20.4" text-anchor="middle" font-size="12" font-weight="800" fill="${t.deep}" style="font-family:inherit">${i + 1}</text></svg>`;
    },
    stars(n, c) {
      let s = ''; for (let i = 0; i < n; i++) s += `<svg viewBox="-12 -12 24 24" width="17" height="17"><path d="M0 -10L3 -3.4L10 -3L4.6 1.8L6.2 9L0 5.2L-6.2 9L-4.6 1.8L-10 -3L-3 -3.4Z" fill="${c || '#ffd24a'}" stroke="#0007" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      return `<span class="stars">${s}</span>`;
    },
    glyph(name, size, c1, c2) {
      const id = 'k' + (++uid), a = c1 || '#fff3a8', b = c2 || '#ffb02e', sz = size || 20;
      const P = {
        crown: `<path d="M3 18L2 7l6 5 4-8 4 8 6-5-1 11z"/><path d="M3 19.5h18V22H3z"/>`,
        coin: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#0006" stroke-width="1.6"/><path d="M9 9.6l3-1.8 3 1.8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>`,
        trophy: `<path d="M7 3h10v5.5a5 5 0 0 1-10 0z"/><path d="M7 5H3.6v2.2A3.6 3.6 0 0 0 7 10.6M17 5h3.4v2.2a3.6 3.6 0 0 1-3.4 3.4" fill="none" stroke="${b}" stroke-width="2"/><path d="M10.6 13.4h2.8V17h-2.8z"/><path d="M7.4 17.4h9.2V21H7.4z"/>`,
        gift: `<path d="M3 10h18v11H3z"/><path d="M2 7h20v4H2z"/><path d="M11 7h2v14h-2z" fill="${b}"/><path d="M12 7C9 7 7.5 3.6 9.6 3S12.6 5 12 7zM12 7c3 0 4.5-3.4 2.4-4S11.4 5 12 7z" fill="none" stroke="${a}" stroke-width="1.8"/>`,
        chat: `<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>`,
        heart: `<path d="M12 21s-8-5.4-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.6-8 11-8 11z"/>`,
        bolt: `<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>`,
        star: `<path d="M12 2l3 7 7.4.6-5.6 4.8 1.8 7.2L12 17.8 5.4 21.6l1.8-7.2L1.6 9.6 9 9z"/>`,
        sword: `<path d="M19 3l2 2-9.5 9.5-2-2z"/><path d="M5 19l3-3 2 2-3 3z"/><path d="M8 14l2 2" stroke="${b}" stroke-width="2"/>`,
      };
      return `<svg class="gl" viewBox="0 0 24 24" width="${sz}" height="${sz}" style="vertical-align:-${Math.round(sz * 0.2)}px"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><g fill="url(#g${id})" stroke="#0009" stroke-width="1.3" stroke-linejoin="round">${P[name] || P.star}</g></svg>`;
    },
  };
})();
