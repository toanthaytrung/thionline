/* =========================================================================
   PHIẾU TRẢ LỜI – LỚP TOÁN THẦY TRUNG
   Một nguồn duy nhất cho vị trí mọi ô tô (đơn vị mm, khổ A4 210 x 297):
   - dùng để VẼ phiếu khi in
   - và để ĐỌC phiếu khi quét bằng điện thoại (cùng toạ độ, không lệch nhau)
   ========================================================================= */
(function (root) {
  'use strict';

  var VERSION = 1;
  var R = 1.8;            // bán kính ô tô (đường kính 3,6 mm)
  var CORNER = 7;         // cạnh ô vuông định vị ở 4 góc
  // tâm 4 ô vuông góc: dùng để nắn thẳng ảnh chụp
  var CORNERS = [[12.5, 12.5], [197.5, 12.5], [12.5, 284.5], [197.5, 284.5]];

  // ---------------------------------------------------------------- mã nhận dạng (thay cho QR)
  // 24 ô vuông: ô đầu và ô cuối luôn đen; giữa là mã đợt (12 bit), lớp (5 bit), loại trang (2 bit), kiểm tra (3 bit)
  var ID_CELLS = 24, ID_SIZE = 3, ID_PITCH = 3.6;
  function encodeId(dot, lop, loai) {
    var bits = [];
    function push(v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); }
    push(dot, 12); push(lop, 5); push(loai, 2);
    var ones = bits.reduce(function (a, b) { return a + b; }, 0);
    push(ones % 8, 3);
    return [1].concat(bits, [1]);
  }
  function decodeId(cells) {
    if (cells.length !== ID_CELLS || !cells[0] || !cells[ID_CELLS - 1]) return null;
    var b = cells.slice(1, ID_CELLS - 1);
    function take(s, n) { var v = 0; for (var i = 0; i < n; i++) v = v * 2 + (b[s + i] ? 1 : 0); return v; }
    var ones = b.slice(0, 19).reduce(function (a, x) { return a + (x ? 1 : 0); }, 0);
    if (take(19, 3) !== ones % 8) return null;
    return { dot: take(0, 12), lop: take(12, 5), loai: take(17, 2) };
  }

  // ---------------------------------------------------------------- bố cục
  // cfg: { p1: số câu phần I (≤40), p2: số câu phần II (≤6), p3: số câu phần III (≤6),
  //        ten: tên đợt, lop: tên lớp, dot: mã đợt (số), lopIdx: số thứ tự lớp trong đợt }
  function front(cfg) {
    var L = { page: 'TN', marks: [], bubbles: [], texts: [], boxes: [], lines: [] };
    var y0;
    header(L, 'PHIẾU TRẢ LỜI TRẮC NGHIỆM', cfg, 0);

    // số báo danh: 6 cột chữ số (6 số cuối SĐT), mã đề: 3 cột
    digitColumns(L, 'sbd', 'Số báo danh', '(6 số cuối SĐT)', 132, 6);
    digitColumns(L, 'made', 'Mã đề', '', 172, 3);

    // PHẦN I: cột 10 câu, tối đa 4 cột
    y0 = 82;
    L.texts.push({ x: 16, y: y0, t: 'PHẦN I', b: true, s: 3.6 });
    for (var q = 0; q < cfg.p1; q++) {
      var col = Math.floor(q / 10), row = q % 10, x0 = 22 + col * 44;
      if (row === 0) {
        L.marks.push(mark(x0 - 6, y0 + 3));
        ['A', 'B', 'C', 'D'].forEach(function (c, k) {
          L.texts.push({ x: x0 + 8 + k * 5.4, y: y0 + 6.2, t: c, s: 2.6, c: true, b: true });
        });
        var last = Math.min(10, cfg.p1 - col * 10);
        L.marks.push(mark(x0 - 6, y0 + 9 + last * 5));
      }
      var y = y0 + 11 + row * 5;
      L.texts.push({ x: x0 + 3, y: y + 1, t: String(q + 1), s: 2.8, r: true });
      ['A', 'B', 'C', 'D'].forEach(function (c, k) {
        L.bubbles.push({ g: 'p1', q: q + 1, v: c, x: x0 + 8 + k * 5.4, y: y });
      });
    }

    // PHẦN II: mỗi câu một khối Đ/S x 4 ý
    y0 = 82 + 11 + 10 * 5 + 8;              // 151
    if (cfg.p2) L.texts.push({ x: 16, y: y0, t: 'PHẦN II', b: true, s: 3.6 });
    for (var c2 = 0; c2 < cfg.p2; c2++) {
      var bx = 22 + c2 * 30;
      L.texts.push({ x: bx + 8, y: y0 + 5, t: 'Câu ' + (c2 + 1), s: 2.8, c: true });
      L.marks.push(mark(bx - 6, y0 + 7));
      L.texts.push({ x: bx + 8, y: y0 + 10.2, t: 'Đ', s: 2.6, c: true, b: true });
      L.texts.push({ x: bx + 13.4, y: y0 + 10.2, t: 'S', s: 2.6, c: true, b: true });
      'abcd'.split('').forEach(function (it, k) {
        var y = y0 + 15 + k * 5;
        L.texts.push({ x: bx + 3, y: y + 1, t: it + ')', s: 2.8, r: true });
        L.bubbles.push({ g: 'p2', q: c2 + 1, it: it, v: 'Đ', x: bx + 8, y: y });
        L.bubbles.push({ g: 'p2', q: c2 + 1, it: it, v: 'S', x: bx + 13.4, y: y });
      });
      L.marks.push(mark(bx - 6, y0 + 33));
    }

    // PHẦN III: mỗi câu: dấu trừ, dấu phẩy, 4 cột chữ số (như phiếu thi tốt nghiệp)
    y0 = cfg.p2 ? 151 + 38 : 151;          // 189
    if (cfg.p3) L.texts.push({ x: 16, y: y0, t: 'PHẦN III', b: true, s: 3.6 });
    for (var c3 = 0; c3 < cfg.p3; c3++) {
      var px = 20 + c3 * 30.5;
      L.texts.push({ x: px + 12, y: y0 + 5, t: 'Câu ' + (c3 + 1), s: 2.8, c: true });
      for (var k = 0; k < 4; k++) L.boxes.push({ x: px + 3.4 + k * 4.8, y: y0 + 6.5, w: 4.8, h: 5 });
      L.marks.push(mark(px - 4, y0 + 13));
      var yy = y0 + 18;
      L.texts.push({ x: px + 1.2, y: yy + 1, t: '–', s: 2.8, r: true });
      L.bubbles.push({ g: 'p3', q: c3 + 1, col: 0, v: '-', x: px + 5.8, y: yy });
      yy += 4.8;
      L.texts.push({ x: px + 1.2, y: yy + 1, t: ',', s: 3.2, r: true, b: true });
      L.bubbles.push({ g: 'p3', q: c3 + 1, col: 1, v: ',', x: px + 5.8 + 4.8, y: yy });
      L.bubbles.push({ g: 'p3', q: c3 + 1, col: 2, v: ',', x: px + 5.8 + 9.6, y: yy });
      for (var d = 0; d <= 9; d++) {
        var ydd = yy + 4.8 * (d + 1);
        L.texts.push({ x: px + 1.2, y: ydd + 1, t: String(d), s: 2.8, r: true });
        for (var cc = 0; cc < 4; cc++) {
          L.bubbles.push({ g: 'p3', q: c3 + 1, col: cc, v: String(d), x: px + 5.8 + cc * 4.8, y: ydd });
        }
      }
      L.marks.push(mark(px - 4, yy + 4.8 * 10 + 4));
    }
    footer(L, 'Tô kín MỘT ô bằng bút chì 2B. Phần III: ghi số vào ô rồi tô; dấu trừ ở dòng "–", dấu phẩy ở dòng ",". Không gạch xóa, không làm bẩn 4 ô vuông góc.');
    idStrip(L, cfg, 0);
    return L;
  }

  // mặt sau / tờ làm thêm: giấy kẻ dòng để làm tự luận
  function essay(cfg, extra) {
    var L = { page: extra ? 'TL+' : 'TL', marks: [], bubbles: [], texts: [], boxes: [], lines: [] };
    header(L, extra ? 'TỜ LÀM THÊM – TỰ LUẬN' : 'BÀI LÀM TỰ LUẬN', cfg, 1);
    // số báo danh nằm ngang: 6 hàng (chữ số thứ 1..6) x 10 cột (0..9)
    var x0 = 116, y0 = 17;
    L.texts.push({ x: x0 + 26, y: 14.5, t: 'Số báo danh (6 số cuối SĐT)', s: 2.6, c: true, b: true });
    for (var c = 0; c <= 9; c++) L.texts.push({ x: x0 + 8 + c * 4.6, y: y0 + 1.6, t: String(c), s: 2.4, c: true });
    L.marks.push(mark(x0 - 6, y0 - 1.5));
    for (var r = 0; r < 6; r++) {
      var y = y0 + 6 + r * 4.6;
      L.boxes.push({ x: x0 - 1.4, y: y - 2.3, w: 4.6, h: 4.6 });
      for (var d = 0; d <= 9; d++) L.bubbles.push({ g: 'sbd', col: r, v: String(d), x: x0 + 8 + d * 4.6, y: y });
    }
    L.marks.push(mark(x0 - 6, y0 + 6 + 6 * 4.6 - 1));
    if (extra) {
      // tờ số 2..9
      var tx = 174;
      L.texts.push({ x: tx + 9, y: 14.5, t: 'Tờ số', s: 2.6, c: true, b: true });
      for (var t = 2; t <= 9; t++) {
        var yy = y0 + 2 + (t - 2) * 4.4;
        L.texts.push({ x: tx + 5.2, y: yy + 0.9, t: String(t), s: 2.6, r: true });
        L.bubbles.push({ g: 'to', v: String(t), x: tx + 9, y: yy });
      }
    } else {
      L.texts.push({ x: 183, y: 30, t: 'Tờ 1', s: 4, c: true, b: true });
    }
    // dòng kẻ
    for (var ly = 64; ly <= 264; ly += 8) L.lines.push({ x1: 18, y1: ly, x2: 192, y2: ly, d: true });
    L.lines.push({ x1: 30, y1: 58, x2: 30, y2: 266 });
    footer(L, extra ? 'Ghi đủ Lớp, Họ tên, tô Số báo danh và Tờ số. Hết giấy thì xin thêm tờ làm thêm.'
                    : 'Trình bày lời giải phần tự luận. Hết giấy thì xin thêm tờ làm thêm, nhớ tô Số báo danh và Tờ số.');
    idStrip(L, cfg, extra ? 2 : 1);
    return L;
  }

  // ---------------------------------------------------------------- phần chung
  function mark(x, y) { return { x: x, y: y, s: 3.5 }; }   // ô vuông định vị nhỏ của từng khối

  function header(L, title, cfg, loai) {
    L.texts.push({ x: 60, y: 19, t: title, s: 4.6, c: true, b: true });
    L.texts.push({ x: 18, y: 28, t: 'Bài kiểm tra: ' + (cfg.ten || '..............................................'), s: 3 });
    L.texts.push({ x: 18, y: 35, t: 'Lớp: ' + (cfg.lop || '.........') + '        Ngày: ...... / ...... / 20......', s: 3 });
    L.texts.push({ x: 18, y: 42, t: 'Họ và tên: .......................................................', s: 3 });
    if (loai === 0) L.texts.push({ x: 18, y: 49, t: 'Chữ ký học sinh: ...................', s: 3 });
  }

  function digitColumns(L, g, title, sub, x0, n) {
    var y0 = 24;
    L.texts.push({ x: x0 + (n - 1) * 2.5, y: 14.5, t: title, s: 2.8, c: true, b: true });
    if (sub) L.texts.push({ x: x0 + (n - 1) * 2.5, y: 18, t: sub, s: 2.2, c: true });
    for (var c = 0; c < n; c++) L.boxes.push({ x: x0 + c * 5 - 2.5, y: 19.5, w: 5, h: 5.5 });
    L.marks.push(mark(x0 - 9, y0 + 3));
    for (var d = 0; d <= 9; d++) {
      var y = y0 + 6 + d * 4.6;
      L.texts.push({ x: x0 - 4, y: y + 0.9, t: String(d), s: 2.6, r: true });
      for (var c2 = 0; c2 < n; c2++) L.bubbles.push({ g: g, col: c2, v: String(d), x: x0 + c2 * 5, y: y });
    }
    L.marks.push(mark(x0 - 9, y0 + 6 + 10 * 4.6 - 1));
  }

  function idStrip(L, cfg, loai) {
    var bits = encodeId(cfg.dot || 0, cfg.lopIdx || 0, loai);
    var x0 = 60, y0 = 277.5;
    L.id = { x0: x0, y0: y0, size: ID_SIZE, pitch: ID_PITCH, bits: bits };
    L.texts.push({ x: x0 - 2, y: y0 + 2.4, t: 'Mã phiếu', s: 2.4, r: true });
    L.texts.push({ x: x0 + ID_CELLS * ID_PITCH + 2, y: y0 + 2.4,
                   t: (cfg.lop ? 'Lớp ' + cfg.lop + ' · ' : '') + 'Đợt ' + (cfg.dot || 0) + ' · v' + VERSION, s: 2.4 });
  }

  function footer(L, text) {
    L.texts.push({ x: 105, y: 271.5, t: text, s: 2.3, c: true, i: true });
  }

  // ---------------------------------------------------------------- vẽ SVG
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function svg(L) {
    var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" width="210mm" height="297mm" ' +
             'font-family="Arial, Helvetica, sans-serif" class="phieu">'];
    o.push('<rect x="0" y="0" width="210" height="297" fill="#fff"/>');
    o.push('<rect x="8" y="8" width="194" height="281" fill="none" stroke="#000" stroke-width="0.35"/>');
    CORNERS.forEach(function (p) {
      o.push('<rect x="' + (p[0] - CORNER / 2) + '" y="' + (p[1] - CORNER / 2) + '" width="' + CORNER + '" height="' + CORNER + '" fill="#000"/>');
    });
    L.marks.forEach(function (m) { o.push('<rect x="' + (m.x - m.s / 2) + '" y="' + (m.y - m.s / 2) + '" width="' + m.s + '" height="' + m.s + '" fill="#000"/>'); });
    L.boxes.forEach(function (b) { o.push('<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" fill="none" stroke="#000" stroke-width="0.25"/>'); });
    L.lines.forEach(function (l) {
      o.push('<line x1="' + l.x1 + '" y1="' + l.y1 + '" x2="' + l.x2 + '" y2="' + l.y2 + '" stroke="' + (l.d ? '#9a9a9a' : '#c0392b') +
             '" stroke-width="' + (l.d ? 0.2 : 0.25) + '"' + (l.d ? ' stroke-dasharray="0.6 0.9"' : '') + '/>');
    });
    L.bubbles.forEach(function (b) { o.push('<circle cx="' + b.x + '" cy="' + b.y + '" r="' + R + '" fill="none" stroke="#000" stroke-width="0.25"/>'); });
    if (L.id) {
      L.id.bits.forEach(function (bit, i) {
        o.push('<rect x="' + (L.id.x0 + i * L.id.pitch) + '" y="' + L.id.y0 + '" width="' + L.id.size + '" height="' + L.id.size + '" ' +
               (bit ? 'fill="#000"' : 'fill="none" stroke="#000" stroke-width="0.15"') + '/>');
      });
    }
    L.texts.forEach(function (t) {
      o.push('<text x="' + t.x + '" y="' + t.y + '" font-size="' + t.s + '"' + (t.b ? ' font-weight="bold"' : '') + (t.i ? ' font-style="italic"' : '') +
             (t.c ? ' text-anchor="middle"' : t.r ? ' text-anchor="end"' : '') + '>' + esc(t.t) + '</text>');
    });
    o.push('</svg>');
    return o.join('');
  }

  root.PHIEU = { VERSION: VERSION, R: R, CORNERS: CORNERS, front: front, essay: essay, svg: svg,
                 encodeId: encodeId, decodeId: decodeId, ID_CELLS: ID_CELLS };
})(typeof window !== 'undefined' ? window : globalThis);
