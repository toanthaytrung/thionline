/* =========================================================================
   DÙNG CHUNG cho khu giáo viên (giao_vien.html) và trang quét phiếu (quet.html)
   - gọi máy chủ chấm điểm (Google Apps Script) bằng khóa quản trị
   - đọc file Excel đáp án nhiều mã đề, ghi file Excel bảng điểm (không cần thư viện ngoài)
   ========================================================================= */
(function (root) {
  'use strict';
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJkUtzD3BE3whKIOuQDHM48kyANvZaqZC_iM0nQnyGaEH3hZn_97YUcBhpx10y87R-/exec';
  var KEY_STORE = 'kt_khoa_quan_tri';

  function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return root.__ktKey || ''; } }
  function setKey(k) { try { if (k) localStorage.setItem(KEY_STORE, k); else localStorage.removeItem(KEY_STORE); } catch (e) {} root.__ktKey = k; }

  function api(action, payload, tries) {
    var body = Object.assign({}, payload || {}, { action: action, adminKey: getKey() });
    tries = tries || 2;
    return fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        if (tries > 1) return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return api(action, payload, tries - 1); });
        throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
      })
      .then(function (res) {
        if (res && res.status === 'DENIED') { var e = new Error('Khóa quản trị không đúng.'); e.denied = true; throw e; }
        return res;
      });
  }

  // ---------------------------------------------------------------- đọc file .xlsx (là file zip chứa XML)
  function u16(d, o) { return d[o] | (d[o + 1] << 8); }
  function u32(d, o) { return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0; }

  function inflate(bytes) {
    var ds = new DecompressionStream('deflate-raw');
    var s = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  function unzip(buf) {
    var d = new Uint8Array(buf), eocd = -1;
    for (var i = d.length - 22; i >= Math.max(0, d.length - 66000); i--) if (u32(d, i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error('Không phải file Excel (.xlsx).'));
    var n = u16(d, eocd + 10), p = u32(d, eocd + 16), jobs = {};
    for (var k = 0; k < n; k++) {
      var method = u16(d, p + 10), csize = u32(d, p + 20), nlen = u16(d, p + 28), elen = u16(d, p + 30), clen = u16(d, p + 32);
      var off = u32(d, p + 42), name = new TextDecoder().decode(d.subarray(p + 46, p + 46 + nlen));
      var lnl = u16(d, off + 26), lel = u16(d, off + 28), data = d.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + csize);
      jobs[name] = method === 0 ? Promise.resolve(data) : inflate(data);
      p += 46 + nlen + elen + clen;
    }
    var names = Object.keys(jobs);
    return Promise.all(names.map(function (nm) { return jobs[nm]; })).then(function (arr) {
      var out = {};
      names.forEach(function (nm, i) { out[nm] = new TextDecoder().decode(arr[i]); });
      return out;
    });
  }

  function colIndex(ref) {   // "AB12" -> 27
    var m = /^([A-Z]+)/.exec(ref), v = 0;
    for (var i = 0; i < m[1].length; i++) v = v * 26 + (m[1].charCodeAt(i) - 64);
    return v - 1;
  }

  // trả về mảng các dòng của trang tính đầu tiên (giá trị dạng chữ)
  function readXlsx(buf) {
    return unzip(buf).then(function (f) {
      var P = new DOMParser(), shared = [];
      if (f['xl/sharedStrings.xml']) {
        var sd = P.parseFromString(f['xl/sharedStrings.xml'], 'application/xml');
        Array.prototype.forEach.call(sd.getElementsByTagName('si'), function (si) {
          shared.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join(''));
        });
      }
      var sheetPath = 'xl/worksheets/sheet1.xml';
      if (f['xl/workbook.xml'] && f['xl/_rels/workbook.xml.rels']) {    // lấy đúng trang tính đầu tiên theo thứ tự
        var wb = P.parseFromString(f['xl/workbook.xml'], 'application/xml');
        var first = wb.getElementsByTagName('sheet')[0];
        var rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
        var rels = P.parseFromString(f['xl/_rels/workbook.xml.rels'], 'application/xml');
        Array.prototype.forEach.call(rels.getElementsByTagName('Relationship'), function (r) {
          if (r.getAttribute('Id') === rid) { var t = r.getAttribute('Target').replace(/^\//, ''); sheetPath = t.indexOf('xl/') === 0 ? t : 'xl/' + t; }
        });
      }
      if (!f[sheetPath]) throw new Error('File Excel không có trang tính.');
      var sx = P.parseFromString(f[sheetPath], 'application/xml'), rows = [];
      Array.prototype.forEach.call(sx.getElementsByTagName('row'), function (rw) {
        var r = +rw.getAttribute('r') - 1, line = rows[r] = rows[r] || [];
        Array.prototype.forEach.call(rw.getElementsByTagName('c'), function (c) {
          var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0], val = '';
          if (t === 's' && v) val = shared[+v.textContent] || '';
          else if (t === 'inlineStr' && is) val = is.textContent;
          else if (v) val = v.textContent;
          line[colIndex(c.getAttribute('r'))] = String(val).trim();
        });
      });
      return rows.map(function (r) { return r || []; });
    });
  }

  // ---------------------------------------------------------------- file đáp án nhiều mã đề
  // Dòng 1: "Đề\câu" | 1..n (phần I) | 1a 1b 1c 1d 2a... (phần II) | 1..m (phần III). Mỗi dòng sau là một mã đề.
  function parseDapAn(rows) {
    var head = rows[0] || [], cols = { p1: [], p2: [], p3: [] }, part = 'p1', errs = [], warns = [];
    for (var i = 1; i < head.length; i++) {
      var h = String(head[i] == null ? '' : head[i]).trim().toLowerCase();
      if (!h) continue;
      var m2 = /^(\d+)\s*([a-d])$/.exec(h);
      if (m2) { part = 'p2'; cols.p2.push({ i: i, q: +m2[1], it: m2[2] }); continue; }
      if (!/^\d+$/.test(h)) { warns.push('Bỏ qua cột "' + head[i] + '"'); continue; }
      if (part === 'p2') part = 'p3';
      cols[part].push({ i: i, q: +h });
    }
    var ct = { p1: cols.p1.length, p2: 0, p3: cols.p3.length }, q2 = {};
    cols.p2.forEach(function (c) { (q2[c.q] = q2[c.q] || []).push(c.it); });
    ct.p2 = Object.keys(q2).length;
    Object.keys(q2).forEach(function (q) { if (q2[q].join('') !== 'abcd') errs.push('Phần II câu ' + q + ' thiếu ý (cần đủ a, b, c, d)'); });
    if (!ct.p1 && !ct.p2 && !ct.p3) errs.push('Dòng tiêu đề không có cột câu hỏi nào.');

    var dapAn = {};
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r] || [], ma = String(row[0] == null ? '' : row[0]).replace(/\D/g, '');
      if (!ma) continue;
      ma = ('000' + ma).slice(-3);
      if (dapAn[ma]) { errs.push('Mã đề ' + ma + ' bị trùng'); continue; }
      var allEmpty = cols.p1.concat(cols.p2, cols.p3).every(function (c) { return String(row[c.i] == null ? '' : row[c.i]).trim() === ''; });
      if (allEmpty) continue;      // dòng mã đề chưa điền gì: bỏ qua
      var k = { p1: {}, p2: {}, p3: {} }, bad = [];
      cols.p1.forEach(function (c) {
        var v = String(row[c.i] || '').trim().toUpperCase();
        if (!/^[ABCD]$/.test(v)) bad.push('I.' + c.q); else k.p1[c.q] = v;
      });
      cols.p2.forEach(function (c) {
        var v = String(row[c.i] || '').trim().toUpperCase();
        var tf = (v === 'Đ' || v === 'D' || v === 'T' || v === 'ĐÚNG') ? 'Đ' : (v === 'S' || v === 'F' || v === 'SAI') ? 'S' : '';
        if (!tf) bad.push('II.' + c.q + c.it); else (k.p2[c.q] = k.p2[c.q] || {})[c.it] = tf;
      });
      cols.p3.forEach(function (c) {
        var v = String(row[c.i] == null ? '' : row[c.i]).trim().replace(/\s+/g, '').replace('.', ',').replace('−', '-');
        if (!/^-?\d+(,\d+)?$/.test(v) || v.length > 4) bad.push('III.' + c.q); else k.p3[c.q] = v;
      });
      if (bad.length) errs.push('Mã đề ' + ma + ': ô trống hoặc sai ký hiệu ở câu ' + bad.join(', '));
      dapAn[ma] = k;
    }
    if (!Object.keys(dapAn).length) errs.push('Không có mã đề nào (cột A từ dòng 2).');
    return { cauTruc: ct, dapAn: dapAn, errors: errs, warnings: warns };
  }

  // ---------------------------------------------------------------- ghi file .xlsx (bảng điểm)
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {     // {tên: chuỗi} -> Blob (không nén, Excel mở bình thường)
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    function le(n, bytes) { var a = []; for (var i = 0; i < bytes; i++) a.push((n >>> (8 * i)) & 255); return a; }
    Object.keys(files).forEach(function (name) {
      var nb = enc.encode(name), data = enc.encode(files[name]), c = crc32(data);
      var head = [].concat(le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(c, 4), le(data.length, 4), le(data.length, 4), le(nb.length, 2), le(0, 2));
      parts.push(new Uint8Array(head), nb, data);
      central.push(new Uint8Array([].concat(le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(c, 4),
        le(data.length, 4), le(data.length, 4), le(nb.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(off, 4))), nb);
      off += head.length + nb.length + data.length;
    });
    var csize = central.reduce(function (s, x) { return s + x.length; }, 0);
    var end = new Uint8Array([].concat(le(0x06054b50, 4), le(0, 2), le(0, 2), le(Object.keys(files).length, 2), le(Object.keys(files).length, 2), le(csize, 4), le(off, 4), le(0, 2)));
    return new Blob(parts.concat(central, [end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xmlEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function colName(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - 1 - m) / 26; } return s; }

  // sheets: [{name, rows: [[...]], widths: [..]}]; số thì ghi dạng số, còn lại dạng chữ; dòng 1 in đậm
  function writeXlsx(sheets) {
    var files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        sheets.map(function (s, i) { return '<sheet name="' + xmlEsc(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F1"/></patternFill></fill></fills>' +
        '<borders count="2"><border/><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom></border></borders>' +
        '<cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf borderId="1" applyBorder="1"/></cellXfs></styleSheet>'
    };
    sheets.forEach(function (s, i) {
      var cols = (s.widths || []).map(function (w, j) { return '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('');
      var body = s.rows.map(function (r, ri) {
        return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
          var ref = colName(ci) + (ri + 1), st = ri === 0 ? 1 : 2;
          if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + st + '"/>';
          if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
          return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t>' + xmlEsc(v) + '</t></is></c>';
        }).join('') + '</row>';
      }).join('');
      files['xl/worksheets/sheet' + (i + 1) + '.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        (cols ? '<cols>' + cols + '</cols>' : '') + '<sheetData>' + body + '</sheetData></worksheet>';
    });
    return zip(files);
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function fmt(x) { return x === '' || x === null || x === undefined ? '' : String(Math.round(x * 100) / 100).replace('.', ','); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------------------------------------------------------------- câu tự luận: "Câu 1: 1; Câu 2: 1; 3a: 0,5"
  function parseTlCau(s, tong) {
    s = String(s || '').trim();
    var parts = /[;\n]/.test(s) || /:/.test(s) ? s.split(/[;\n]+/) : s.split(/\s+/), out = [], err = '';
    parts.map(function (p) { return p.trim(); }).filter(Boolean).forEach(function (p, i) {
      var m = /^(.*?)\s*[:=]\s*([\d.,]+)\s*(đ|điểm)?$/i.exec(p), ten, v;
      if (m) { ten = m[1].trim(); v = m[2]; } else { ten = ''; v = p.replace(/(đ|điểm)$/i, ''); }
      v = Number(String(v).replace(',', '.'));
      if (!isFinite(v) || v <= 0) { err = 'Không hiểu "' + p + '"'; return; }
      if (!ten) ten = 'Câu ' + (out.length + 1);
      else if (/^\d+[a-z]?$/i.test(ten)) ten = 'Câu ' + ten;
      out.push({ ten: ten.slice(0, 24), max: Math.round(v * 100) / 100 });
    });
    var sum = Math.round(out.reduce(function (a, c) { return a + c.max; }, 0) * 100) / 100;
    if (!err && tong != null && Math.abs(sum - tong) > 1e-6) err = 'Tổng các câu là ' + fmt(sum) + ', chưa bằng điểm tự luận ' + fmt(tong) + '.';
    return { cau: out, tong: sum, loi: err };
  }
  function tlCauText(list) { return (list || []).map(function (c) { return c.ten + ': ' + fmt(c.max); }).join('; '); }
  function macDinhTlCau(tong) {
    tong = Number(tong) || 0;
    if (!tong) return [];
    if (Math.abs(tong - Math.round(tong)) < 1e-9 && tong <= 10) { var a = []; for (var i = 1; i <= tong; i++) a.push({ ten: 'Câu ' + i, max: 1 }); return a; }
    return [{ ten: 'Tự luận', max: tong }];
  }

  // gọi máy chủ không kèm khóa (trang học sinh)
  function apiHS(action, payload) {
    var body = Object.assign({}, payload || {}, { action: action });
    return fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); }, function () { throw new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); });
  }

  // ---------------------------------------------------------------- mở trang quét trên điện thoại (mã QR + mã ghép)
  function moDienThoai(dot) {
    var old = document.getElementById('ktGhepBox'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'ktGhepBox';
    box.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    box.innerHTML = '<div style="background:#fff;border-radius:16px;padding:22px;max-width:420px;width:100%;text-align:center;font-family:inherit;color:#1e293b">' +
      '<div style="font-size:18px;font-weight:800;color:#041e49">📱 Mở trang quét trên điện thoại</div>' +
      '<div id="ktGhepNd" style="margin:14px 0;color:#64748b">Đang tạo mã…</div>' +
      '<button style="border:0;border-radius:9px;padding:10px 18px;font:inherit;font-weight:700;background:#0b57d0;color:#fff;cursor:pointer" onclick="document.getElementById(\'ktGhepBox\').remove()">Đóng</button></div>';
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
    document.body.appendChild(box);
    var nd = document.getElementById('ktGhepNd');
    api('ktMaGhep').then(function (r) {
      if (r.status !== 'OK') throw new Error(r.message || 'Máy chủ chưa có chức năng này (cần cập nhật Apps Script).');
      var base = location.origin + location.pathname.replace(/[^\/]*$/, '');
      var url = base + 'quet.html' + (dot ? '?dot=' + dot : '') + '#ghep=' + r.ma, svg = '';
      if (root.qrcode) { var q = root.qrcode(0, 'M'); q.addData(url); q.make(); svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
      nd.innerHTML = (svg ? '<div style="width:240px;margin:0 auto">' + svg + '</div>' : '') +
        '<div style="margin-top:8px">Mở <b>Camera</b> (hoặc Zalo &gt; Quét mã QR) trên điện thoại, quét mã này là vào thẳng trang quét phiếu, không phải gõ khóa.</div>' +
        '<div style="margin-top:10px">Hoặc trên điện thoại mở <b>' + esc(base.replace(/^https?:\/\//, '')) + 'quet.html</b> rồi nhập mã:</div>' +
        '<div style="font-size:34px;font-weight:800;letter-spacing:6px;color:#d93025;margin:4px 0">' + r.ma.slice(0, 3) + ' ' + r.ma.slice(3) + '</div>' +
        '<div style="font-size:13px">Mã dùng một lần, hết hạn sau <b id="ktGhepTg">10:00</b>. Điện thoại sẽ nhớ đăng nhập.</div>';
      var het = Date.now() + 600000, t = setInterval(function () {
        var el = document.getElementById('ktGhepTg'); if (!el) { clearInterval(t); return; }
        var s = Math.max(0, Math.round((het - Date.now()) / 1000)); el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        if (!s) { clearInterval(t); el.textContent = 'đã hết hạn'; }
      }, 1000);
    }).catch(function (e) { nd.innerHTML = '<span style="color:#b3261e">' + esc(e.message) + '</span>'; });
  }
  // điện thoại: nhận khóa bằng mã ghép
  function ghep(ma) {
    return apiHS('ktGhep', { ma: String(ma || '').replace(/\D/g, '') }).then(function (r) {
      if (r.status !== 'OK' || !r.adminKey) throw new Error(r.message || 'Không ghép được.');
      setKey(r.adminKey); return true;
    });
  }

  root.KT = { api: api, apiHS: apiHS, moDienThoai: moDienThoai, ghep: ghep, getKey: getKey, setKey: setKey, readXlsx: readXlsx, parseDapAn: parseDapAn, writeXlsx: writeXlsx,
              download: download, fmt: fmt, esc: esc, SCRIPT_URL: SCRIPT_URL,
              parseTlCau: parseTlCau, tlCauText: tlCauText, macDinhTlCau: macDinhTlCau };
})(typeof window !== 'undefined' ? window : globalThis);
