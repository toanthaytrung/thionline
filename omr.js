/* =========================================================================
   ĐỌC PHIẾU TÔ TỪ ẢNH CHỤP ĐIỆN THOẠI – LỚP TOÁN THẦY TRUNG
   Không cần thư viện ngoài (chạy được cả trên điện thoại yếu).
   Các bước: ảnh xám -> tìm ô vuông đen -> 4 ô góc nắn phối cảnh ->
             ô vuông của từng khối sửa độ cong giấy -> đo độ đậm từng ô tròn.
   Toạ độ các ô lấy từ phieu.js (cùng một nguồn với lúc in).
   ========================================================================= */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- tiện ích ảnh
  function toGray(img, maxSide) {
    // img: {width, height, data: RGBA} -> thu nhỏ (nếu cần) + xám
    var s = Math.min(1, maxSide / Math.max(img.width, img.height));
    var W = Math.round(img.width * s), H = Math.round(img.height * s);
    var g = new Uint8ClampedArray(W * H), d = img.data, iw = img.width;
    for (var y = 0; y < H; y++) {
      var sy = Math.min(img.height - 1, Math.floor(y / s));
      for (var x = 0; x < W; x++) {
        var sx = Math.min(iw - 1, Math.floor(x / s)), i = (sy * iw + sx) * 4;
        g[y * W + x] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
      }
    }
    return { W: W, H: H, g: g, scale: s };
  }

  function integral(G) {
    var W = G.W, H = G.H, I = new Float64Array((W + 1) * (H + 1));
    for (var y = 0; y < H; y++) {
      var row = 0;
      for (var x = 0; x < W; x++) {
        row += G.g[y * W + x];
        I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row;
      }
    }
    return I;
  }

  // điểm tối so với vùng xung quanh (chống bóng đổ, ánh sáng không đều)
  function binarize(G, I, win, k) {
    var W = G.W, H = G.H, B = new Uint8Array(W * H), r = win >> 1;
    for (var y = 0; y < H; y++) {
      var y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      for (var x = 0; x < W; x++) {
        var x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1);
        var sum = I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
        var mean = sum / ((x1 - x0) * (y1 - y0));
        B[y * W + x] = G.g[y * W + x] < mean * k ? 1 : 0;
      }
    }
    return B;
  }

  // các vùng đen liền nhau -> tìm những vùng có dạng ô vuông đặc
  function squares(G, B) {
    var W = G.W, H = G.H, lab = new Int32Array(W * H), out = [], stack = new Int32Array(W * H), n = 0;
    for (var p = 0; p < W * H; p++) {
      if (!B[p] || lab[p]) continue;
      n++;
      var top = 0, area = 0, minx = W, maxx = 0, miny = H, maxy = 0, sx = 0, sy = 0;
      stack[top++] = p; lab[p] = n;
      while (top) {
        var q = stack[--top], x = q % W, y = (q - x) / W;
        area++; sx += x; sy += y;
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
        if (x > 0 && B[q - 1] && !lab[q - 1]) { lab[q - 1] = n; stack[top++] = q - 1; }
        if (x < W - 1 && B[q + 1] && !lab[q + 1]) { lab[q + 1] = n; stack[top++] = q + 1; }
        if (y > 0 && B[q - W] && !lab[q - W]) { lab[q - W] = n; stack[top++] = q - W; }
        if (y < H - 1 && B[q + W] && !lab[q + W]) { lab[q + W] = n; stack[top++] = q + W; }
      }
      var bw = maxx - minx + 1, bh = maxy - miny + 1;
      if (bw < 5 || bh < 5) continue;
      var asp = bw / bh, fill = area / (bw * bh);
      if (asp > 0.6 && asp < 1.65 && fill > 0.6) {   // > 0.6: vẫn nhận ô vuông khi phiếu xoay nghiêng tới ~20 độ
        out.push({ x: sx / area, y: sy / area, side: Math.sqrt(area), bw: bw, bh: bh, fill: fill });
      }
    }
    return out;
  }


  // Bản đồ "màu giấy" từng điểm: sáng nhất trong lân cận r điểm ảnh (thuật toán van Herk, nhanh).
  // Chia ảnh cho bản đồ này thì bóng đổ, ánh sáng lệch bị triệt tiêu.
  function maxFilter1D(src, dst, n, stride, count, offStep, r) {
    var w = 2 * r + 1, g = new Uint8ClampedArray(n + w), h = new Uint8ClampedArray(n + w);
    for (var c = 0; c < count; c++) {
      var base = c * offStep;
      for (var i = 0; i < n + w; i++) {
        var k = Math.min(n - 1, Math.max(0, i - r)), v = src[base + k * stride];
        g[i] = (i % w === 0) ? v : Math.max(g[i - 1], v);
      }
      for (var j = n + w - 1; j >= 0; j--) {
        var k2 = Math.min(n - 1, Math.max(0, j - r)), v2 = src[base + k2 * stride];
        h[j] = (j === n + w - 1 || (j + 1) % w === 0) ? v2 : Math.max(h[j + 1], v2);
      }
      for (var x = 0; x < n; x++) dst[base + x * stride] = Math.max(h[x], g[x + w - 1]);
    }
  }
  function paperMap(G, r) {
    var a = new Uint8ClampedArray(G.W * G.H), b = new Uint8ClampedArray(G.W * G.H);
    maxFilter1D(G.g, a, G.W, 1, G.H, G.W, r);      // theo hàng
    maxFilter1D(a, b, G.H, G.W, G.W, 1, r);        // theo cột
    return b;
  }

  // ---------------------------------------------------------------- phối cảnh (homography)
  function solve(A, b) {           // Gauss, A n x n
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      var t = M[c]; M[c] = M[piv]; M[piv] = t;
      if (Math.abs(M[c][c]) < 1e-12) return null;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === c) continue;
        var f = M[r2][c] / M[c][c];
        for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k];
      }
    }
    return M.map(function (r, i) { return r[n] / r[i]; });
  }

  function homography(src, dst) {   // src[i] (mm) -> dst[i] (px), 4 điểm
    var A = [], b = [];
    for (var i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    var h = solve(A, b);
    if (!h) return null;
    return function (x, y) {
      var w = h[6] * x + h[7] * y + 1;
      return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
    };
  }

  // ---------------------------------------------------------------- tìm 4 ô góc
  function findCorners(G, sq) {
    if (sq.length < 4) return null;
    var maxSide = Math.max.apply(null, sq.map(function (s) { return s.side; }));
    // ô góc to gấp đôi ô của khối; lấy những ô to gần nhất với từng góc ảnh
    var big = sq.filter(function (s) { return s.side > maxSide * 0.55; });
    // góc của phiếu = các ô to nằm ngoài cùng theo 2 đường chéo (đúng cả khi phiếu bị xoay nghiêng)
    function ext(f, sign) {
      var best = null, bv = -1e18;
      big.forEach(function (s) { var v = sign * f(s); if (v > bv) { bv = v; best = s; } });
      return best;
    }
    var res = [ext(function (s) { return s.x + s.y; }, -1), ext(function (s) { return s.x - s.y; }, 1),
               ext(function (s) { return s.x - s.y; }, -1), ext(function (s) { return s.x + s.y; }, 1)];
    if (res.some(function (r, i) { return !r || res.indexOf(r) !== i; })) return null;
    var tl = res[0], tr = res[1], bl = res[2], br = res[3];
    if (!(tr.x > tl.x && br.x > bl.x && bl.y > tl.y && br.y > tr.y)) return null;
    // 4 ô góc phải cách xa nhau (không lấy nhầm ô vuông nhỏ của khối)
    var minEdge = Math.min(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(bl.x - tl.x, bl.y - tl.y));
    if (minEdge < Math.min(G.W, G.H) * 0.35) return null;
    return res;
  }

  // ---------------------------------------------------------------- đọc
  /*  layoutFor(loai) -> bố cục phieu.js của loại trang đó (TN / TL / TL+), hoặc null nếu chưa biết
      Trả về { ok, loai, id, fields, bubbles(đã chấm điểm), warp, debug } */
  function read(img, layoutFor, opt) {
    opt = opt || {};
    var G = toGray(img, opt.maxSide || 1600);
    var I = integral(G);
    var win = Math.round(Math.max(G.W, G.H) / 28) | 1;
    var B = binarize(G, I, win, 0.72);
    var sq = squares(G, B);
    var found4 = findCorners(G, sq);
    if (!found4) return { ok: false, error: 'Không thấy đủ 4 ô vuông ở 4 góc phiếu. Chụp lại cho lọt cả 4 góc.' };
    var C = root.PHIEU.CORNERS;
    var probe = root.PHIEU.front({ p1: 0, p2: 0, p3: 0 });
    // Phiếu có thể bị chụp ngược đầu hoặc xoay ngang: thử 4 hướng, hướng nào đọc được mã phiếu là đúng
    var clock = [found4[0], found4[1], found4[3], found4[2]];      // tl, tr, br, bl theo chiều kim đồng hồ trong ảnh
    var cs = null, H = null, ppm = 0, corr = null, id = null, idBits = null, lastBits = null;
    for (var rot = 0; rot < 4 && !id; rot++) {
      var cw = [0, 1, 2, 3].map(function (i) { return clock[(i + rot) % 4]; });   // TL, TR, BR, BL của phiếu
      var c4 = [cw[0], cw[1], cw[3], cw[2]];                                         // TL, TR, BL, BR (thứ tự CORNERS)
      var H4 = homography(C, c4.map(function (s) { return [s.x, s.y]; }));
      if (!H4) continue;
      var ppm4 = Math.hypot(c4[1].x - c4[0].x, c4[1].y - c4[0].y) / (C[1][0] - C[0][0]);
      var corr4 = C.map(function (c) { return { m: c, r: [0, 0] }; });
      var bits = readId(G, function (x, y) { return correct(H4, corr4, x, y); }, probe.id, ppm4);
      lastBits = bits;
      var d = root.PHIEU.decodeId(bits);
      if (d) { id = d; idBits = bits; cs = c4; H = H4; ppm = ppm4; corr = corr4; }
    }
    if (!id) return { ok: false, error: 'Không đọc được mã phiếu (dãy ô vuông nhỏ ở cuối trang). Chụp lại rõ hơn, không che mép dưới.', idBits: lastBits };
    if (ppm < 3.2) return { ok: false, error: 'Ảnh quá nhỏ hoặc chụp quá xa. Đưa điện thoại lại gần cho phiếu chiếm gần hết khung.' };
    function at(x, y) { return correct(H, corr, x, y); }
    var L = layoutFor(id);
    if (!L) return { ok: false, error: 'Phiếu thuộc đợt kiểm tra khác (đợt ' + id.dot + ').', id: id };

    // sửa độ cong giấy: ghép từng ô vuông nhỏ của khối với vị trí đã biết
    var found = 0;
    L.marks.forEach(function (m) {
      var p = H(m.x, m.y), exp = m.s * ppm, best = null, bd = Math.pow(4.5 * ppm, 2);
      sq.forEach(function (s) {
        if (s.side < exp * 0.5 || s.side > exp * 1.7) return;
        var d = Math.pow(s.x - p[0], 2) + Math.pow(s.y - p[1], 2);
        if (d < bd) { bd = d; best = s; }
      });
      if (best) { corr.push({ m: [m.x, m.y], r: [best.x - p[0], best.y - p[1]] }); found++; }
    });

    // đo độ đậm từng ô (so với màu giấy ngay tại chỗ)
    G.paper = paperMap(G, Math.max(3, Math.round(2.6 * ppm)));
    var bub = L.bubbles.map(function (b) {
      var p = at(b.x, b.y), sc = darkness(G, p[0], p[1], root.PHIEU.R * ppm);
      return Object.assign({}, b, { px: p[0], py: p[1], s: sc });
    });
    var th = thresholds(bub.map(function (b) { return b.s; }));
    bub.forEach(function (b) { b.st = b.s >= th.hi ? 'X' : (b.s >= th.lo ? '?' : ''); });
    return { ok: true, loai: id.loai, id: id, page: L.page, th: th, marksFound: found, marksTotal: L.marks.length,
             bubbles: bub, fields: decode(L, bub), ppm: ppm, corners: cs, size: [G.W, G.H], scale: G.scale,
             layout: L, map: function (x, y) { var q = at(x, y); return [q[0] / G.scale, q[1] / G.scale]; } };
  }

  // nội suy độ lệch theo các ô vuông gần nhất (giấy cong, chụp không phẳng)
  function correct(H, corr, x, y) {
    var p = H(x, y), ws = 0, dx = 0, dy = 0;
    var near = corr.map(function (c) {
      return { c: c, d: Math.pow(c.m[0] - x, 2) + Math.pow(c.m[1] - y, 2) };
    }).sort(function (a, b) { return a.d - b.d; }).slice(0, 4);
    near.forEach(function (n) { var w = 1 / (n.d + 25); ws += w; dx += w * n.c.r[0]; dy += w * n.c.r[1]; });
    return [p[0] + dx / ws, p[1] + dy / ws];
  }

  function readId(G, at, id, ppm) {
    var bits = [];
    for (var i = 0; i < root.PHIEU.ID_CELLS; i++) {
      var cx = id.x0 + i * id.pitch + id.size / 2, cy = id.y0 + id.size / 2;
      var p = at(cx, cy);
      bits.push(darkness(G, p[0], p[1], id.size * 0.5 * ppm, true) > 0.45 ? 1 : 0);
    }
    return bits;
  }

  // 0 = trắng như giấy, 1 = đen kín. Giấy lấy theo vùng sáng xung quanh ô.
  function darkness(G, cx, cy, r, square) {
    var W = G.W, Hh = G.H, rin = square ? r * 0.55 : r * 0.62, rring = r * 1.3, rout = r * 2.3;
    var inner = 0, n = 0, bg = [];
    var x0 = Math.max(0, Math.floor(cx - rout)), x1 = Math.min(W - 1, Math.ceil(cx + rout));
    var y0 = Math.max(0, Math.floor(cy - rout)), y1 = Math.min(Hh - 1, Math.ceil(cy + rout));
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var v = G.g[y * W + x], d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 <= rin * rin) {
        if (G.paper) { var pp = Math.max(40, G.paper[y * W + x]); inner += 255 * Math.max(0, 1 - v / pp); n++; continue; }
        inner += v; n++;
      }
      else if (d2 >= rring * rring && d2 <= rout * rout) bg.push(v);   // vòng giấy sát quanh ô (chịu được bóng đổ)
    }
    if (!n) return 0;
    if (G.paper && !square) return Math.max(0, Math.min(1, inner / n / 255));
    bg.sort(function (a, b) { return a - b; });
    var paper = bg.length ? bg[Math.floor(bg.length * 0.8)] : 255;
    return Math.max(0, Math.min(1, (paper - inner / n) / Math.max(40, paper)));
  }

  // ngưỡng tự điều chỉnh theo từng phiếu (bút chì đậm/nhạt, ánh sáng khác nhau)
  function thresholds(vals) {
    var v = vals.slice().sort(function (a, b) { return a - b; });
    var empty = v[Math.floor(v.length * 0.5)];                // phần lớn ô để trống
    var top = v.filter(function (x) { return x > empty + 0.15; });
    var filled = top.length ? top[Math.floor(top.length * 0.5)] : empty + 0.5;
    var hi = Math.max(empty + 0.17, Math.min(0.45, empty + (filled - empty) * 0.55));
    var lo = Math.max(empty + 0.09, empty + (filled - empty) * 0.3);
    return { empty: empty, filled: filled, hi: hi, lo: Math.min(lo, hi - 0.02) };
  }

  // ---------------------------------------------------------------- ghép ô thành đáp án
  function decode(L, bub) {
    var F = { sbd: [], made: [], to: null, p1: {}, p2: {}, p3: {}, flags: [] };
    function pick(list, label) {
      var x = list.filter(function (b) { return b.st === 'X'; });
      var u = list.filter(function (b) { return b.st === '?'; });
      if (x.length === 1 && !u.length) return { v: x[0].v };
      if (x.length === 1 && u.length) return { v: x[0].v, warn: label + ': có ô tô mờ/tẩy chưa sạch, đã lấy ô đậm nhất' };
      if (x.length > 1) return { v: null, err: label + ': tô ' + x.length + ' ô' };
      if (u.length) return { v: null, err: label + ': ô tô quá mờ, cần xem lại' };
      return { v: '' };
    }
    function group(pred) { return bub.filter(pred); }
    function note(r) { if (r.err) F.flags.push({ lv: 'err', t: r.err }); else if (r.warn) F.flags.push({ lv: 'warn', t: r.warn }); }

    ['sbd', 'made'].forEach(function (g) {
      var cols = {};
      bub.forEach(function (b) { if (b.g === g) (cols[b.col] = cols[b.col] || []).push(b); });
      Object.keys(cols).sort().forEach(function (c) {
        var r = pick(cols[c], (g === 'sbd' ? 'Số báo danh' : 'Mã đề') + ' chữ số ' + (+c + 1));
        note(r); F[g].push(r.v === '' ? (r.err ? '?' : '_') : (r.v === null ? '?' : r.v));
      });
      F[g] = F[g].join('');
    });
    var to = group(function (b) { return b.g === 'to'; });
    if (to.length) { var rt = pick(to, 'Tờ số'); note(rt); F.to = rt.v || null; }

    var qs = {};
    bub.forEach(function (b) { if (b.g === 'p1') (qs[b.q] = qs[b.q] || []).push(b); });
    Object.keys(qs).forEach(function (q) { var r = pick(qs[q], 'Phần I câu ' + q); note(r); F.p1[q] = r.v; });

    var q2 = {};
    bub.forEach(function (b) { if (b.g === 'p2') ((q2[b.q] = q2[b.q] || {})[b.it] = (q2[b.q][b.it] || [])).push(b); });
    Object.keys(q2).forEach(function (q) {
      F.p2[q] = {};
      Object.keys(q2[q]).forEach(function (it) { var r = pick(q2[q][it], 'Phần II câu ' + q + ' ý ' + it); note(r); F.p2[q][it] = r.v; });
    });

    var q3 = {};
    bub.forEach(function (b) { if (b.g === 'p3') (((q3[b.q] = q3[b.q] || {})[b.col]) || (q3[b.q][b.col] = [])).push(b); });
    Object.keys(q3).forEach(function (q) {
      var s = '', bad = false;
      [0, 1, 2, 3].forEach(function (c) {
        var r = pick(q3[q][c] || [], 'Phần III câu ' + q + ' cột ' + (c + 1));
        if (r.err) { bad = true; note(r); } else { note(r); s += r.v || ''; }
      });
      if (!bad && s && !/^-?\d+(,\d+)?$/.test(s)) F.flags.push({ lv: 'err', t: 'Phần III câu ' + q + ': "' + s + '" không phải số hợp lệ' });
      F.p3[q] = bad ? null : s;
    });
    return F;
  }

  // Ảnh phiếu đã nắn thẳng (khổ A4, k điểm ảnh/mm) từ ảnh gốc: để lưu bài và để giáo viên chạm sửa ô
  function warp(img, res, k) {
    k = k || 5;
    var OW = Math.round(210 * k), OH = Math.round(297 * k), step = 3, gw = Math.ceil(210 / step) + 1, gh = Math.ceil(297 / step) + 1;
    var gx = new Float32Array(gw * gh), gy = new Float32Array(gw * gh);
    for (var j = 0; j < gh; j++) for (var i = 0; i < gw; i++) {
      var p = res.map(i * step, j * step); gx[j * gw + i] = p[0]; gy[j * gw + i] = p[1];
    }
    var out = new Uint8ClampedArray(OW * OH * 4), src = img.data, SW = img.width, SH = img.height;
    for (var y = 0; y < OH; y++) {
      var my = y / k / step, j0 = Math.min(gh - 2, Math.floor(my)), fy = my - j0;
      for (var x = 0; x < OW; x++) {
        var mx = x / k / step, i0 = Math.min(gw - 2, Math.floor(mx)), fx = mx - i0, a = j0 * gw + i0;
        var sx = (gx[a] * (1 - fx) + gx[a + 1] * fx) * (1 - fy) + (gx[a + gw] * (1 - fx) + gx[a + gw + 1] * fx) * fy;
        var sy = (gy[a] * (1 - fx) + gy[a + 1] * fx) * (1 - fy) + (gy[a + gw] * (1 - fx) + gy[a + gw + 1] * fx) * fy;
        var o = (y * OW + x) * 4, xi = Math.floor(sx), yi = Math.floor(sy);
        if (xi < 0 || yi < 0 || xi >= SW - 1 || yi >= SH - 1) { out[o] = out[o + 1] = out[o + 2] = 255; out[o + 3] = 255; continue; }
        var ax = sx - xi, ay = sy - yi, q = (yi * SW + xi) * 4;
        for (var c = 0; c < 3; c++) {
          out[o + c] = (src[q + c] * (1 - ax) + src[q + 4 + c] * ax) * (1 - ay) + (src[q + SW * 4 + c] * (1 - ax) + src[q + SW * 4 + 4 + c] * ax) * ay;
        }
        out[o + 3] = 255;
      }
    }
    return { width: OW, height: OH, data: out, k: k };
  }

  root.OMR = { read: read, toGray: toGray, decode: decode, warp: warp };
})(typeof window !== 'undefined' ? window : globalThis);
