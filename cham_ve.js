/* =========================================================================
   VẼ NÉT CHẤM lên ảnh bài làm (dùng chung: trang chấm tự luận và trang học sinh xem bài)
   Toạ độ tính theo điểm ảnh của ảnh bài đã nắn thẳng (A4, 5 điểm ảnh / mm = 1050 x 1485).
   Các loại nét:
     {t:'p', c:màu, w:độ dày, d:[x,y,lực bút, x,y,lực bút, ...]}   nét bút
     {t:'v', x, y, s}  dấu đúng      {t:'x', x, y, s}  dấu sai
     {t:'d', i:câu, x, y}  ô điểm câu i      {t:'T', x, y}  ô tổng điểm tự luận
   ========================================================================= */
(function (root) {
  'use strict';
  var W = 1050, H = 1485, DO = '#d93025';
  var TONG_MAC_DINH = { x: 905, y: 270 };   // góc phải trên trang tự luận tờ 1, dưới chữ "Tờ 1"

  function fmt(x) {
    if (x === null || x === undefined || x === '') return '…';
    return String(Math.round(Number(x) * 100) / 100).replace('.', ',');
  }

  function doDay(w, p) { return w * (0.45 + 0.9 * (p == null ? 0.5 : p)); }

  // nét bút: vẽ từng đoạn để độ dày theo lực nhấn bút
  function veNet(ctx, it) {
    var d = it.d, n = d.length / 3;
    ctx.strokeStyle = it.c || DO; ctx.fillStyle = it.c || DO; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (n === 1) {
      ctx.beginPath(); ctx.arc(d[0], d[1], doDay(it.w, d[2]) / 2, 0, Math.PI * 2); ctx.fill(); return;
    }
    var px = d[0], py = d[1];
    for (var i = 1; i < n; i++) {
      var x = d[i * 3], y = d[i * 3 + 1], p = d[i * 3 + 2];
      var mx = i < n - 1 ? (x + d[i * 3 + 3]) / 2 : x, my = i < n - 1 ? (y + d[i * 3 + 4]) / 2 : y;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(x, y, mx, my);
      ctx.lineWidth = doDay(it.w, (d[i * 3 - 1] + p) / 2); ctx.stroke();
      px = mx; py = my;
    }
  }

  function veDung(ctx, it) {
    var s = it.s || 1;
    ctx.save(); ctx.translate(it.x, it.y); ctx.scale(s, s);
    ctx.strokeStyle = it.c || DO; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 14); ctx.lineTo(20, -18); ctx.stroke(); ctx.restore();
  }
  function veSai(ctx, it) {
    var s = it.s || 1;
    ctx.save(); ctx.translate(it.x, it.y); ctx.scale(s, s);
    ctx.strokeStyle = it.c || DO; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14); ctx.stroke(); ctx.restore();
  }

  function o(ctx, x, y, text, big) {
    ctx.save();
    ctx.font = (big ? '700 30px' : '700 26px') + ' "Segoe UI", Arial, sans-serif';
    var w = ctx.measureText(text).width + 22, h = big ? 46 : 40;
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = DO; ctx.lineWidth = big ? 3.5 : 2.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 9); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill(); ctx.stroke();
    if (big) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y + h / 2 - 7); ctx.lineTo(x + w / 2 - 8, y + h / 2 - 7); ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = DO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + (big ? -2 : 1));
    ctx.restore();
    return { w: w, h: h };
  }

  // opt: {cau:[{ten,max}], diem:[...], tl, tlMax, tongMacDinh:true|false}
  function ve(ctx, items, opt) {
    opt = opt || {};
    var coTong = false;
    (items || []).forEach(function (it) {
      if (it.t === 'p') veNet(ctx, it);
      else if (it.t === 'v') veDung(ctx, it);
      else if (it.t === 'x') veSai(ctx, it);
      else if (it.t === 'd') {
        var c = (opt.cau || [])[it.i];
        if (c) o(ctx, it.x, it.y, c.ten + ': ' + fmt((opt.diem || [])[it.i]) + (opt.hienMax ? '/' + fmt(c.max) : ''));
      } else if (it.t === 'T') { coTong = true; veTong(ctx, it.x, it.y, opt); }
    });
    if (!coTong && opt.tongMacDinh) veTong(ctx, TONG_MAC_DINH.x, TONG_MAC_DINH.y, opt);
  }
  function veTong(ctx, x, y, opt) { o(ctx, x, y, 'Tự luận: ' + fmt(opt.tl) + (opt.tlMax ? '/' + fmt(opt.tlMax) : ''), true); }

  // tìm nét gần điểm (x, y) nhất trong bán kính r (dùng cho cục tẩy)
  function cham(items, x, y, r) {
    for (var k = items.length - 1; k >= 0; k--) {
      var it = items[k];
      if (it.t === 'p') {
        var d = it.d, rr = r + it.w;
        for (var i = 0; i < d.length; i += 3) {
          if (Math.abs(d[i] - x) < rr && Math.abs(d[i + 1] - y) < rr) return k;
          if (i + 3 < d.length && kc(x, y, d[i], d[i + 1], d[i + 3], d[i + 4]) < rr) return k;
        }
      } else if (it.t === 'd' || it.t === 'T') {
        if (Math.abs(it.x - x) < 70 + r && Math.abs(it.y - y) < 24 + r) return k;
      } else if (Math.abs(it.x - x) < 22 * (it.s || 1) + r && Math.abs(it.y - y) < 22 * (it.s || 1) + r) return k;
    }
    return -1;
  }
  function kc(px, py, ax, ay, bx, by) {   // khoảng cách điểm - đoạn thẳng
    var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  // thứ tự trang: tự luận tờ 1, 2, … rồi phiếu tô
  function thuTuTrang(list) {
    return (list || []).slice().sort(function (a, b) {
      var na = a === 'TN' ? 99 : Number(a.slice(2)) || 0, nb = b === 'TN' ? 99 : Number(b.slice(2)) || 0;
      return na - nb;
    });
  }
  function tenTrang(t) { return t === 'TN' ? 'Phiếu tô' : 'Tự luận tờ ' + t.slice(2); }

  // ---------------------------------------------------------------- tô màu kết quả lên phiếu trắc nghiệm
  // L: bố cục phiếu (PHIEU.front), b: {traLoi, dung, dapAn|null, p1, p2, p3, tn, max, cauTruc}
  var XANH = '#188038', K = 5;
  function vong(ctx, bb, mau, day) {
    ctx.beginPath(); ctx.arc(bb.x * K, bb.y * K, 13, 0, Math.PI * 2);
    ctx.strokeStyle = mau; ctx.lineWidth = day || 3.5; ctx.stroke();
  }
  function chu(ctx, x, y, t, mau, co, canh) {
    ctx.save(); ctx.font = '700 ' + (co || 22) + 'px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = canh || 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(t, x, y);
    ctx.fillStyle = mau; ctx.fillText(t, x, y); ctx.restore();
  }
  function veTN(ctx, L, b) {
    var tl = b.traLoi || {}, dg = b.dung || {}, da = b.dapAn, tim = {};
    L.bubbles.forEach(function (bb) {
      var k = bb.g + '|' + bb.q + '|' + (bb.it || bb.col || '') + '|' + bb.v;
      if (bb.g === 'p1' || bb.g === 'p2') tim[k] = bb;
      if (bb.g === 'p3') (tim['p3|' + bb.q] = tim['p3|' + bb.q] || []).push(bb);
    });
    Object.keys(dg.p1 || {}).forEach(function (q) {
      var em = (tl.p1 || {})[q], ok = dg.p1[q], o = em && tim['p1|' + q + '||' + em];
      if (o) vong(ctx, o, ok ? XANH : DO);
      if (!ok && da && da.p1 && da.p1[q]) { var d = tim['p1|' + q + '||' + da.p1[q]]; if (d) vong(ctx, d, XANH, 4.5); }
      if (!ok && !em && !da) { var a = tim['p1|' + q + '||A']; if (a) chu(ctx, a.x * K - 30, a.y * K, '✗', DO, 22); }
    });
    Object.keys(dg.p2 || {}).forEach(function (q) {
      ['a', 'b', 'c', 'd'].forEach(function (y) {
        var em = ((tl.p2 || {})[q] || {})[y], ok = (dg.p2[q] || {})[y], o = em && tim['p2|' + q + '|' + y + '|' + em];
        if (o) vong(ctx, o, ok ? XANH : DO);
        var dk = da && da.p2 && da.p2[q] && da.p2[q][y];
        if (!ok && dk) { var d = tim['p2|' + q + '|' + y + '|' + dk]; if (d) vong(ctx, d, XANH, 4.5); }
        if (!ok && !em && !dk) { var a = tim['p2|' + q + '|' + y + '|S']; if (a) chu(ctx, a.x * K + 30, a.y * K, '✗', DO, 22); }
      });
    });
    Object.keys(dg.p3 || {}).forEach(function (q) {
      var ds = tim['p3|' + q]; if (!ds) return;
      var ok = dg.p3[q], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      ds.forEach(function (bb) { x0 = Math.min(x0, bb.x); x1 = Math.max(x1, bb.x); y0 = Math.min(y0, bb.y); y1 = Math.max(y1, bb.y); });
      ctx.save(); ctx.strokeStyle = ok ? XANH : DO; ctx.lineWidth = 4;
      ctx.beginPath();
      var rx = (x0 - 4.2) * K, ry = (y0 - 3.6) * K, rw = (x1 - x0 + 8.4) * K, rh = (y1 - y0 + 7) * K;
      if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 12); else ctx.rect(rx, ry, rw, rh);
      ctx.stroke(); ctx.restore();
      var em = (tl.p3 || {})[q], dk = da && da.p3 ? da.p3[q] : null;
      chu(ctx, (x0 + x1) / 2 * K, (y1 + 6) * K, ok ? '✓ Đúng' : (dk != null ? 'ĐA: ' + dk : '✗ Sai'), ok ? XANH : (dk != null ? XANH : DO), 21);
      if (!ok) chu(ctx, (x0 + x1) / 2 * K, (y0 - 5.6) * K, '✗ ' + (em ? em : 'không có đáp số'), DO, 19);
    });
    // điểm từng phần ở khoảng trống dưới phần họ tên
    var mx = b.max || {}, ct = b.cauTruc || {}, p = [];
    if (ct.p1) p.push('Phần I: ' + fmt(b.p1) + '/' + fmt(mx.p1));
    if (ct.p2) p.push('Phần II: ' + fmt(b.p2) + '/' + fmt(mx.p2));
    if (ct.p3) p.push('Phần III: ' + fmt(b.p3) + '/' + fmt(mx.p3));
    chu(ctx, 18 * K, 58 * K, p.join('  ·  '), DO, 21, 'left');
    chu(ctx, 18 * K, 65 * K, 'Trắc nghiệm: ' + fmt(b.tn) + ' điểm', DO, 30, 'left');
  }

  root.CHAMVE = { W: W, H: H, DO: DO, TONG_MAC_DINH: TONG_MAC_DINH, ve: ve, veNet: veNet, cham: cham, fmt: fmt, veTN: veTN,
                  thuTuTrang: thuTuTrang, tenTrang: tenTrang };
})(typeof window !== 'undefined' ? window : globalThis);
