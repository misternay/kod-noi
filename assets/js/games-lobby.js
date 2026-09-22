/* ==========================================================================
   โค้ดน้อย (Kod Noi) — games-lobby.js
   ผู้จัดการแท็บ/ล็อบบี้กลาง: สร้างการ์ดห้องจากทะเบียน ROOMS,
   แสดงผลการเล่นล่าสุดรายห้อง, ควบคุมการสลับห้อง (รวมกลาง = goTab)
   ต้องโหลด "หลัง" games.js และ rooms-extra.js
   ========================================================================== */
(function () {
  'use strict';
  var KN = window.KN;
  var audio = KN.audio, ui = KN.ui, store = KN.store;
  var ROOMS = window.KN_ROOMS || [];
  var $ = ui.$;

  var lobbyGrid = $('#lobbyGrid');
  var lobbyTotal = $('#lobbyTotal');

  function fmtTime(ts) {
    if (!ts) return 'ยังไม่เคยเล่น';
    var d = new Date(ts);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function buildLobby() {
    if (!lobbyGrid) return;
    lobbyGrid.innerHTML = '';
    if (lobbyTotal) lobbyTotal.textContent = ROOMS.length;
    ROOMS.forEach(function (room) {
      var r = store.getRoom(room.id);
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'roomcard';
      card.dataset.room = room.id;
      card.setAttribute('aria-label', 'เข้าห้อง' + room.name);
      card.innerHTML =
        '<span class="roomcard__icon">' + room.icon + '</span>' +
        '<span class="roomcard__body">' +
          '<b>' + room.name + '</b>' +
          '<span class="roomcard__skill">' + room.skill + '</span>' +
          '<span class="roomcard__desc">' + room.desc + '</span>' +
          '<span class="roomcard__meta">🏆 สถิติสูงสุด ' + r.best + ' · เล่น ' + r.plays + ' ครั้ง · ' + fmtTime(r.last) + '</span>' +
        '</span>' +
        '<span class="roomcard__go">เข้าห้อง ▶</span>';
      card.addEventListener('click', function () { goTab(room.id); });
      lobbyGrid.appendChild(card);
    });
  }

  window.KN_REFRESH_LOBBY = buildLobby;

  function goTab(name) {
    ui.$$('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', String(t.dataset.tab === name));
    });
    ui.$$('.panel').forEach(function (p) {
      p.classList.toggle('on', p.id === 'tab-' + name);
    });
    if (location.hash !== '#' + name) {
      try { history.replaceState(null, '', '#' + name); } catch (e) { location.hash = name; }
    }
    audio.tap();
    if (name === 'lobby' && window.KN_REFRESH_LOBBY) window.KN_REFRESH_LOBBY();
    if (window.KN_ON_TAB) window.KN_ON_TAB(name);
    var anchor = document.getElementById('playTop');
    if (anchor) {
      /* เผื่อระยะ header ตามความสูงจริง ณ ตอนนั้น (มือถือ header สูงกว่าจอใหญ่) */
      var hdr = document.querySelector('.top__in');
      var off = (hdr ? hdr.getBoundingClientRect().height : 70) + 18;
      try { window.scrollTo({ top: Math.max(0, anchor.offsetTop - off), behavior: 'smooth' }); } catch (e) {}
    }
  }
  window.KN_GO_TAB = goTab;
  window.goTab = goTab; /* ให้โค้ดเดิมเรียก goTab(...) ได้เลย */

  var tabEls = ui.$$('.tab');
  tabEls.forEach(function (t) {
    t.addEventListener('click', function () { goTab(t.dataset.tab); });
  });

  /* คีย์บอร์ด: ลูกศรซ้าย–ขวาเลื่อนห้องตามแบบฉบับ tablist */
  tabEls.forEach(function (t, i) {
    t.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabEls[(i + d + tabEls.length) % tabEls.length];
      n.focus();
      goTab(n.dataset.tab);
    });
  });

  /* ปุ่ม “← ล็อบบี้” ในทุกห้อง (delegate เพราะห้องใหม่อาจถูกเพิ่มภายหลัง) */
  document.addEventListener('click', function (e) {
    var back = e.target.closest ? e.target.closest('.backbtn') : null;
    if (!back) return;
    e.preventDefault();
    goTab('lobby');
  });

  /* รองรับการเปลี่ยน hash ตอนอยู่ในหน้าเดิม (เช่น กดลิงก์ #music) */
  window.addEventListener('hashchange', function () {
    var h = (location.hash || '').replace('#', '');
    if (h) goTab(h);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var h = (location.hash || '').replace('#', '');
    var ids = ROOMS.map(function (r) { return r.id; }).concat(['lobby']);
    if (ids.indexOf(h) !== -1) goTab(h);
    else goTab('lobby');
  });
})();
