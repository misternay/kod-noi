/* ==========================================================================
   โค้ดน้อย (Kod Noi) — app.js
   โมดูลกลาง: เสียง (สังเคราะห์เอง), จัดเก็บความก้าวหน้า, เอฟเฟกต์, HUD
   ไม่โหลดไฟล์จากภายนอกเลย (ทำงานได้ใต้ CSP เข้มงวด)
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- เสียง: สังเคราะห์ด้วย Web Audio (ไม่ใช้ไฟล์เสียง) ------- */
  var ctx = null;
  var enabled = true;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, delay, vol) {
    if (!enabled) return;
    var a = ac();
    if (!a) return;
    dur = dur || 0.16;
    type = type || 'sine';
    delay = delay || 0;
    vol = vol == null ? 0.11 : vol;
    var t0 = a.currentTime + delay;
    var osc = a.createOscillator();
    var gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  var audio = {
    isOn: function () { return enabled; },
    set: function (v) { enabled = !!v; if (enabled) { ac(); tone(660, 0.1, 'sine'); } },
    unlock: function () { ac(); },
    tap: function () { tone(720, 0.09, 'triangle', 0, 0.10); },
    step: function () { tone(430, 0.12, 'sine', 0, 0.09); },
    pop: function () { tone(940, 0.11, 'sine'); tone(1240, 0.1, 'sine', 0.06, 0.07); },
    star: function () { tone(1180, 0.1, 'sine'); tone(1560, 0.14, 'sine', 0.08, 0.09); },
    oops: function () { tone(300, 0.2, 'sine', 0, 0.07); tone(230, 0.26, 'sine', 0.12, 0.06); },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone(f, 0.34, 'triangle', i * 0.11, 0.10);
      });
      tone(1568, 0.5, 'sine', 0.48, 0.07);
    },
    note: function (freq, dur) { tone(freq, dur || 0.42, 'triangle', 0, 0.09); }
  };

  /* ---------------- คำพูด (มีเฉพาะเมื่อเครื่องมีเสียงไทย) ---------------- */
  var speechOn = true;
  var thaiVoice = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    var vs = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < vs.length; i++) {
      var l = (vs[i].lang || '').toLowerCase();
      if (l.indexOf('th') === 0) { thaiVoice = vs[i]; return; }
    }
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function say(text) {
    if (!speechOn || !text) return;
    if (!('speechSynthesis' in window) || !thaiVoice) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH';
      u.voice = thaiVoice;
      u.rate = 0.96;
      u.pitch = 1.2;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* เงียบไว้ ไม่ให้รบกวนเกม */ }
  }

  var speech = {
    isOn: function () { return speechOn && !!thaiVoice; },
    available: function () { return !!thaiVoice; },
    set: function (v) { speechOn = !!v; if (!speechOn && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }
  };

  /* ---------------- คลังเก็บความก้าวหน้า (localStorage) ---------------- */
  var KEY = 'kodnoi.v1';
  var data;

  function blank() {
    return {
      stars: 0,
      sound: true,
      speech: true,
      robotLevel: 0,
      patternBest: 0,
      sortBest: 0,
      studioLoops: 0,
      stickers: [],
      rooms: {},
      gallery: []
    };
  }

  function readRaw() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return blank();
      var out = blank();
      Object.keys(out).forEach(function (k) {
        if (parsed[k] !== undefined) out[k] = parsed[k];
      });
      if (!Array.isArray(out.stickers)) out.stickers = [];
      if (!out.rooms || typeof out.rooms !== 'object' || Array.isArray(out.rooms)) out.rooms = {};
      if (!Array.isArray(out.gallery)) out.gallery = [];
      return out;
    } catch (e) { return blank(); }
  }

  data = readRaw();
  enabled = data.sound !== false;
  speechOn = data.speech !== false;

  var STICKERS = [
    { at: 3, icon: '🐣', name: 'ดาวดวงแรก' },
    { at: 8, icon: '🚀', name: 'นักบินน้อย' },
    { at: 15, icon: '🐬', name: 'เพื่อนหุ่นยนต์' },
    { at: 25, icon: '🦄', name: 'ผู้วิเศษโค้ด' },
    { at: 40, icon: '👑', name: 'ราชาแห่งการเล่น' }
  ];

  var store = {
    data: data,
    stickers: STICKERS,
    save: function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    },
    addStars: function (n) {
      data.stars += n;
      var gained = [];
      STICKERS.forEach(function (s) {
        if (data.stars >= s.at && data.stickers.indexOf(s.icon) === -1) {
          data.stickers.push(s.icon);
          gained.push(s);
        }
      });
      store.save();
      return gained;
    },
    setSound: function (v) { data.sound = !!v; enabled = !!v; store.save(); },
    setSpeech: function (v) { data.speech = !!v; speechOn = !!v; if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel(); store.save(); },
    set: function (k, v) { data[k] = v; store.save(); },
    /* บันทึกผลการเล่นรายห้อง: คะแนนสูงสุด จำนวนครั้ง เวลาล่าสุด */
    recordPlay: function (roomId, score) {
      var r = data.rooms[roomId];
      if (!r) r = { best: 0, plays: 0, last: 0, lastScore: 0 };
      var sc = Math.max(0, Math.round(score || 0));
      r.plays += 1;
      r.lastScore = sc;
      r.last = Date.now();
      if (sc > r.best) r.best = sc;
      data.rooms[roomId] = r;
      store.save();
      return r;
    },
    getRoom: function (roomId) {
      return data.rooms[roomId] || { best: 0, plays: 0, last: 0, lastScore: 0 };
    },
    allRooms: function () { return data.rooms; }
  };

  /* ---------------- เอฟเฟกต์บนจอ ---------------- */
  var ui = {
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
    sleep: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },

    toast: function (msg, ms) {
      var el = document.getElementById('toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add('on');
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove('on'); }, ms || 2400);
    },

    confetti: function (count) {
      count = count || 46;
      var colors = ['#FF6B6B', '#FFD93D', '#3FC1C9', '#9B7BFF', '#5BC97E', '#7BC6FF'];
      for (var i = 0; i < count; i++) {
        var d = document.createElement('div');
        d.className = 'confetti';
        d.style.left = Math.random() * 100 + 'vw';
        d.style.background = colors[i % colors.length];
        d.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
        d.style.animationDelay = (Math.random() * 0.5) + 's';
        d.style.width = (8 + Math.random() * 10) + 'px';
        d.style.height = (12 + Math.random() * 14) + 'px';
        document.body.appendChild(d);
        (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3400); })(d);
      }
    },

    /* จุดความคืบหน้า ●●●○○ — ให้เด็กที่ยังอ่านไม่ออกเห็นความคืบหน้าเป็นภาพ */
    dots: function (el, cur, total) {
      if (!el) return;
      var n = Math.max(0, total | 0);
      var c = Math.min(Math.max(0, cur | 0), n);
      var h = '';
      for (var i = 0; i < n; i++) h += '<i' + (i < c ? ' class="on"' : '') + '></i>';
      el.innerHTML = h;
    },

    /* ทำซ้ำไอคอนเป็นแถว (เช่น แครอท 🥕 ที่ชนะสะสม) */
    icons: function (el, count, icon, max) {
      if (!el) return;
      var n = Math.max(0, count | 0);
      var m = max || 8;
      var h = '';
      for (var i = 0; i < Math.min(n, m); i++) h += '<i>' + icon + '</i>';
      if (n > m) h += '<b>×' + n + '</b>';
      el.innerHTML = h;
    }
  };

  /* ---------------- หน้าต่างฉลองชัย ---------------- */
  function ensureCelebrate() {
    var el = document.getElementById('celebrate');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'celebrate';
    el.className = 'celebrate';
    el.innerHTML =
      '<div class="celebrate__box" role="dialog" aria-modal="true" aria-labelledby="celTitle">' +
      '<div class="celebrate__pair">' +
        '<img class="celebrate__mascot" src="assets/img/mascot.svg" alt="น้องบอทหัวเมฆ">' +
        '<div class="emo emo--lg" id="celIcon">🌟</div>' +
      '</div>' +
      '<h3 id="celTitle">เยี่ยมมาก!</h3>' +
      '<p id="celText" class="lead"></p>' +
      '<div class="btn-row" style="justify-content:center" id="celActions"></div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function celebrate(opts) {
    opts = opts || {};
    var el = ensureCelebrate();
    document.getElementById('celIcon').textContent = opts.icon || '🌟';
    document.getElementById('celTitle').textContent = opts.title || 'เยี่ยมมาก!';
    document.getElementById('celText').textContent = opts.text || '';
    var acts = document.getElementById('celActions');
    acts.innerHTML = '';
    (opts.actions || [{ label: 'เล่นต่อ', cls: 'btn btn--teal' }]).forEach(function (a) {
      var b = document.createElement('button');
      b.className = a.cls || 'btn';
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', function () {
        audio.tap();
        el.classList.remove('on');
        if (typeof a.onClick === 'function') a.onClick();
      });
      acts.appendChild(b);
    });
    el.classList.add('on');
    if (opts.sound !== false) audio.win();
    if (opts.confetti !== false) ui.confetti();
    if (opts.say) say(opts.say);
  }

  window.KN = { audio: audio, speech: speech, store: store, ui: ui, say: say, celebrate: celebrate };

  /* ---------------- HUD ของหน้าเล่น ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var starEl = document.getElementById('starCount');
    var shelfEl = document.getElementById('shelf');

    function paint() {
      if (starEl) starEl.textContent = data.stars;
      if (shelfEl) {
        shelfEl.innerHTML = '';
        STICKERS.forEach(function (s) {
          var sp = document.createElement('span');
          sp.textContent = s.icon;
          sp.title = s.name + ' (สะสม ' + s.at + ' ดาว)';
          if (data.stickers.indexOf(s.icon) !== -1) sp.className = 'on';
          shelfEl.appendChild(sp);
        });
      }
    }
    window.KN.paintHud = paint;
    paint();

    var btnSound = document.getElementById('btnSound');
    if (btnSound) {
      btnSound.setAttribute('aria-pressed', String(store.data.sound !== false));
      btnSound.textContent = store.data.sound !== false ? '🔊' : '🔇';
      btnSound.addEventListener('click', function () {
        var on = !(store.data.sound !== false);
        store.setSound(on);
        btnSound.setAttribute('aria-pressed', String(on));
        btnSound.textContent = on ? '🔊' : '🔇';
        if (on) audio.tap();
      });
    }

    var btnVoice = document.getElementById('btnVoice');
    if (btnVoice) {
      btnVoice.setAttribute('aria-pressed', String(speech.isOn() && store.data.speech !== false));
      btnVoice.textContent = '🗣️';
      btnVoice.title = speech.available() ? 'เสียงพูดผู้ช่วย' : 'เครื่องนี้ยังไม่มีเสียงพูดภาษาไทย';
      btnVoice.addEventListener('click', function () {
        var on = !(store.data.speech !== false);
        store.setSpeech(on);
        btnVoice.setAttribute('aria-pressed', String(on && speech.available()));
        if (on) say('สวัสดีจ้า');
      });
    }

    // ปลดล็อกระบบเสียงเมื่อมีการแตะครั้งแรก
    var unlock = function () { audio.unlock(); document.removeEventListener('pointerdown', unlock); };
    document.addEventListener('pointerdown', unlock);

    /* ตารางบนมือถือ: ฝังชื่อคอลัมน์ลงในแต่ละ td เพื่อแสดงเป็นการ์ด (ดู CSS ส่วน .tablewrap)
       ถ้าไม่มี JS ตารางจะเลื่อนแนวนอนได้ตามเดิม */
    ui.$$('.tablewrap table').forEach(function (t) {
      var heads = ui.$$('thead th', t).map(function (th) { return th.textContent.trim(); });
      if (!heads.length) return;
      ui.$$('tbody tr', t).forEach(function (tr) {
        ui.$$('td', tr).forEach(function (td, i) { if (heads[i]) td.dataset.label = heads[i]; });
      });
    });
  });
})();
