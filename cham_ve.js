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

  root.CHAMVE = { W: W, H: H, DO: DO, TONG_MAC_DINH: TONG_MAC_DINH, ve: ve, veNet: veNet, cham: cham, fmt: fmt,
                  thuTuTrang: thuTuTrang, tenTrang: tenTrang };
})(typeof window !== 'undefined' ? window : globalThis);
