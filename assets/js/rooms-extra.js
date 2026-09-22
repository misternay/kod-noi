/* ==========================================================================
   โค้ดน้อย (Kod Noi) — rooms-extra.js
   ห้องเล่นเพิ่มเติม 6 ห้อง: จับคู่ลูกโป่ง / บันไดดนตรี / ตลาดนับของ /
   ตามรอยรูปร่าง / เขาวงกตเสียง / อารมณ์ตัวอักษร
   วิธีเพิ่มห้องใหม่ ดูคู่มือได้ที่ docs/HANDBOOK-ROOMS.md
   ใช้ร่วมกับ app.js (window.KN) และทะเบียนห้อง ROOMS ใน games.js
   ========================================================================== */
(function () {
  'use strict';
  var KN = window.KN;
  var audio = KN.audio, ui = KN.ui, store = KN.store, say = KN.say, celebrate = KN.celebrate;
  var $ = ui.$, sleep = ui.sleep;

  function reward(n) {
    var KNn = window.KN;
    var list = KNn.store.addStars(n);
    if (list && list.length) {
      KNn.paintHud && KNn.paintHud();
      ui.toast('ได้สติกเกอร์ใหม่ ' + list[0].icon + ' ' + list[0].name + '!');
      audio.star();
    }
    KNn.paintHud && KNn.paintHud();
  }

  function finishRoom(roomId, score) {
    store.recordPlay(roomId, score);
    window.KN.paintHud && window.KN.paintHud();
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ======================================================================
     ห้อง 6 — จับคู่ลูกโป่ง (ความจำ)
     ====================================================================== */
  var SCALE_BEEP = [330, 392, 440, 494, 523];
  var MEM_ICONS = ['🍓', '🐟', '⭐', '🚗', '🐸', '🌙'];
  var mg = { grid: $('#mGrid'), hint: $('#mHint'), label: $('#mCount'), btn: $('#mRestart'),
             cards: [], open: [], matched: 0, moves: 0, lock: false, started: false };

  function startMemory() {
    mg.cards = shuffle(MEM_ICONS.concat(MEM_ICONS).map(function (ic, i) { return { ic: ic, key: i }; }));
    mg.open = []; mg.matched = 0; mg.moves = 0; mg.lock = false; mg.started = false;
    mg.grid.innerHTML = '';
    mg.cards.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'memcard';
      b.dataset.i = i;
      b.setAttribute('aria-label', 'ลูกโป่งลับ ' + (i + 1));
      b.textContent = '🎈';
      b.addEventListener('click', function () { flipCard(b); });
      mg.grid.appendChild(b);
    });
    if (mg.label) mg.label.textContent = 'คู่ที่จับได้ 0 / 6 · แตะ ' + mg.moves + ' ครั้ง';
    mg.hint.textContent = 'แตะลูกโป่งทีละใบ จำภาพให้ดี แล้วหาคู่ของมัน 🎈';
    mg.hint.className = 'banner';
  }

  function flipCard(btn) {
    if (mg.lock || btn.classList.contains('open') || btn.classList.contains('done')) return;
    if (!mg.started) { mg.started = true; }
    var i = +btn.dataset.i;
    btn.classList.add('open');
    btn.textContent = mg.cards[i].ic;
    audio.note(SCALE_BEEP[mg.open.length % SCALE_BEEP.length], 0.25);
    mg.open.push({ i: i, btn: btn });
    if (mg.open.length < 2) return;

    mg.moves++;
    var a = mg.open[0], b = mg.open[1];
    if (mg.cards[a.i].ic === mg.cards[b.i].ic) {
      a.btn.classList.add('done'); b.btn.classList.add('done');
      a.btn.classList.remove('open'); b.btn.classList.remove('open');
      mg.matched++;
      mg.open = [];
      audio.pop();
      reward(1);
      if (mg.label) mg.label.textContent = 'คู่ที่จับได้ ' + mg.matched + ' / 6 · แตะ ' + mg.moves + ' ครั้ง';
      if (mg.matched >= MEM_ICONS.length) {
        finishRoom('balloon', Math.max(10, 120 - mg.moves * 5));
        say('เก่งมาก จับคู่ครบทุกคู่');
        celebrate({
          icon: '🎈', title: 'จับคู่ครบทุกคู่!',
          text: 'ใช้ ' + mg.moves + ' ครั้ง จับคู่ครบ 6 คู่ ได้ดาวโบนัส ⭐',
          say: 'จับคู่ครบทุกคู่ เก่งมาก',
          actions: [{ label: 'เล่นอีกครั้ง ▶', cls: 'btn btn--teal', onClick: startMemory },
                    { label: 'กลับล็อบบี้', cls: 'btn btn--ghost', onClick: function () { goTab('lobby'); } }]
        });
      }
    } else {
      mg.lock = true;
      audio.oops();
      setTimeout(function () {
        a.btn.classList.remove('open'); b.btn.classList.remove('open');
        a.btn.textContent = '🎈'; b.btn.textContent = '🎈';
        mg.open = []; mg.lock = false;
      }, 750);
    }
    if (mg.label) mg.label.textContent = 'คู่ที่จับได้ ' + mg.matched + ' / 6 · แตะ ' + mg.moves + ' ครั้ง';
  }

  if (mg.grid) {
    if (mg.btn) mg.btn.addEventListener('click', startMemory);
    startMemory();
  }

  /* ======================================================================
     ห้อง 7 — บันไดดนตรี (ฟังเสียง + ลำดับ)
     ====================================================================== */
  var NOTES = [
    { f: 261.63, label: 'โด' }, { f: 293.66, label: 'เร' }, { f: 329.63, label: 'มี' },
    { f: 349.23, label: 'ฟา' }, { f: 392.00, label: 'ซอล' }, { f: 440.00, label: 'ลา' },
    { f: 493.88, label: 'ที' }, { f: 523.25, label: 'โดสูง' }
  ];
  var mu = { pads: $('#nPads'), hint: $('#nHint'), label: $('#nCount'), btn: $('#nRestart'), btnPlay: $('#nPlay'),
             seq: [], input: [], level: 1, playing: false };

  function muLabel() {
    if (mu.label) mu.label.textContent = 'รอบที่ ' + mu.level + ' · ทำนองยาว ' + (mu.level + 1) + ' เสียง';
  }

  async function muPlay() {
    if (mu.playing) return;
    mu.playing = true;
    mu.seq = [];
    for (var i = 0; i <= mu.level; i++) mu.seq.push(Math.floor(Math.random() * NOTES.length));
    mu.input = [];
    mu.hint.textContent = 'ฟังดี ๆ นะ… 🎧';
    mu.hint.className = 'banner';
    var pads = ui.$$('#nPads .notebtn');
    for (var j = 0; j < mu.seq.length; j++) {
      var p = pads[mu.seq[j]];
      if (p) p.classList.add('sing');
      audio.note(NOTES[mu.seq[j]].f, 0.42);
      await sleep(620);
      if (p) p.classList.remove('sing');
      await sleep(120);
    }
    mu.hint.textContent = 'ถึงตาหนูแล้ว แตะบันไดซ้ำตามที่ได้ยิน 👆';
    mu.playing = false;
  }

  function muTap(idx) {
    if (mu.playing || !mu.seq.length) return;
    var pads = ui.$$('#nPads .notebtn');
    audio.note(NOTES[idx].f, 0.35);
    pads[idx].classList.add('sing');
    setTimeout(function () { pads[idx].classList.remove('sing'); }, 220);
    mu.input.push(idx);
    var k = mu.input.length - 1;
    if (mu.input[k] !== mu.seq[k]) {
      audio.oops();
      mu.hint.textContent = 'ยังไม่ใช่เสียงนี้ ลองฟังใหม่อีกครั้งนะ 🎧';
      mu.hint.className = 'banner warn';
      mu.input = [];
      return;
    }
    if (mu.input.length === mu.seq.length) {
      finishRoom('music', mu.level * 25);
      reward(2);
      mu.level = Math.min(mu.level + 1, 6);
      muLabel();
      mu.hint.textContent = 'ถูกต้องทั้งท่อน! 🎉 กดปุ่มฟังเพื่อเล่นรอบถัดไป';
      mu.hint.className = 'banner good';
      say('ถูกต้องทั้งท่อนเลย');
      audio.win();
      ui.confetti(24);
    } else {
      mu.hint.textContent = 'ถูกแล้ว ' + mu.input.length + ' / ' + mu.seq.length + ' เสียง ต่อไป…';
      mu.hint.className = 'banner good';
    }
  }

  function buildMusic() {
    mu.pads.innerHTML = '';
    NOTES.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'notebtn';
      b.style.setProperty('--h', (46 + i * 9) + '%');
      b.innerHTML = '<b>' + n.label + '</b>';
      b.setAttribute('aria-label', 'เสียง ' + n.label);
      b.addEventListener('click', function () { muTap(i); });
      mu.pads.appendChild(b);
    });
  }

  if (mu.pads) {
    buildMusic();
    muLabel();
    if (mu.btn) mu.btn.addEventListener('click', function () { mu.level = 1; muLabel(); startMusicRound(); });
    if (mu.btnPlay) mu.btnPlay.addEventListener('click', startMusicRound);
  }

  function startMusicRound() {
    mu.seq = []; mu.input = [];
    muPlay();
  }

  /* ======================================================================
     ห้อง 8 — ตลาดนับของ (การนับ)
     ====================================================================== */
  var CNT_ICONS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥕'];
  var cn = { tray: $('#cTray'), choices: $('#cChoices'), hint: $('#cHint'), label: $('#cCount'), btn: $('#cRestart'),
             round: 0, right: 0, answer: 0, icon: '🍎', locked: false };

  function startCount() {
    cn.round = 0; cn.right = 0;
    nextCount();
  }

  function nextCount() {
    cn.icon = CNT_ICONS[Math.floor(Math.random() * CNT_ICONS.length)];
    cn.answer = 1 + Math.floor(Math.random() * 6);
    cn.tray.innerHTML = '';
    for (var i = 0; i < cn.answer; i++) {
      var s = document.createElement('span');
      s.className = 'cntitem';
      s.style.animationDelay = (i * 0.07) + 's';
      s.textContent = cn.icon;
      cn.tray.appendChild(s);
    }
    var opts = shuffle([cn.answer, ...poolAround(cn.answer)]);
    cn.choices.innerHTML = '';
    opts.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'numbtn';
      b.textContent = n;
      b.setAttribute('aria-label', 'จำนวน ' + n);
      b.addEventListener('click', function () { answerCount(n, b); });
      cn.choices.appendChild(b);
    });
    cn.round++;
    if (cn.label) cn.label.textContent = 'ข้อ ' + cn.round + ' / 8';
    cn.hint.textContent = 'นับของในตะกร้า แล้วแตะตัวเลขให้ถูกจำนวน 🔢';
    cn.hint.className = 'banner';
    cn.locked = false;
  }

  function poolAround(n) {
    var s = new Set();
    while (s.size < 2) {
      var x = 1 + Math.floor(Math.random() * 6);
      if (x !== n) s.add(x);
    }
    return Array.from(s);
  }

  function answerCount(n, btn) {
    if (cn.locked) return;
    if (n === cn.answer) {
      cn.locked = true;
      btn.classList.add('right');
      audio.pop();
      reward(1);
      cn.right++;
      cn.hint.textContent = 'ถูกต้อง! มี ' + cn.icon + ' ' + cn.answer + ' ชิ้น 👏';
      cn.hint.className = 'banner good';
      say('ถูกต้อง นับเก่งมาก');
      setTimeout(function () {
        if (cn.round >= 8) {
          finishRoom('count', cn.right * 15);
          reward(3);
          celebrate({
            icon: '🧮', title: 'นับครบทุกข้อ!',
            text: 'ตอบถูก ' + cn.right + ' จาก 8 ข้อ ได้ 3 ดาวโบนัส ⭐',
            say: 'นับเก่งมาก ครบทุกข้อ',
            actions: [{ label: 'เล่นอีกครั้ง ▶', cls: 'btn btn--teal', onClick: startCount },
                      { label: 'กลับล็อบบี้', cls: 'btn btn--ghost', onClick: function () { goTab('lobby'); } }]
          });
        } else nextCount();
      }, 800);
    } else {
      btn.classList.add('wrong');
      audio.oops();
      cn.hint.textContent = 'ยังไม่ใช่จำนวนนี้ ลองชี้นับทีละชิ้นอีกครั้งนะ ☝️';
      cn.hint.className = 'banner warn';
      setTimeout(function () { btn.classList.remove('wrong'); }, 500);
    }
  }

  if (cn.tray) {
    if (cn.btn) cn.btn.addEventListener('click', startCount);
    startCount();
  }

  /* ======================================================================
     ห้อง 9 — ตามรอยรูปร่าง (รูปร่าง + รูปแบบ)
     ====================================================================== */
  var SHAPES = [
    { ic: '🔵', name: 'วงกลม' }, { ic: '🟥', name: 'สี่เหลี่ยม' },
    { ic: '🔺', name: 'สามเหลี่ยม' }, { ic: '⭐', name: 'ดาว' },
    { ic: '🟪', name: 'สี่เหลี่ยมม่วง' }, { ic: '🟡', name: 'วงกลมเหลือง' }
  ];
  var sh = { row: $('#hRow'), choices: $('#hChoices'), hint: $('#hHint'), label: $('#hCount'), btn: $('#hRestart'),
             round: 0, right: 0, seq: [], answer: 0 };

  function startShape() {
    sh.round = 0; sh.right = 0;
    nextShape();
  }

  function nextShape() {
    var base = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    var other = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    while (other.ic === base.ic) other = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    var patternType = Math.random() < 0.5 ? 'ab' : 'aab';
    var seq;
    if (patternType === 'ab') {
      seq = [base, other, base, other, base];
      sh.answer = other;
    } else {
      seq = [base, base, other, base, base];
      sh.answer = other;
    }
    sh.seq = seq;
    sh.row.innerHTML = '';
    seq.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'shapeslot';
      d.textContent = s.ic;
      sh.row.appendChild(d);
    });
    var q = document.createElement('div');
    q.className = 'shapeslot ask';
    q.textContent = '?';
    sh.row.appendChild(q);

    var opts = shuffle([sh.answer, base, SHAPES.filter(function (s) { return s.ic !== base.ic && s.ic !== sh.answer.ic; })[0]]);
    sh.choices.innerHTML = '';
    opts.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'shapebtn';
      b.textContent = s.ic;
      b.setAttribute('aria-label', s.name);
      b.addEventListener('click', function () { answerShape(s, b); });
      sh.choices.appendChild(b);
    });
    sh.round++;
    if (sh.label) sh.label.textContent = 'ข้อ ' + sh.round + ' / 8';
    sh.hint.textContent = 'ดูจังหวะรูปร่างที่ซ้ำกัน แล้วหาว่าช่อง “?” คือรูปไหน 🔍';
    sh.hint.className = 'banner';
  }

  function answerShape(s, btn) {
    if (s.ic === sh.answer.ic) {
      btn.classList.add('right');
      audio.pop();
      reward(1);
      sh.right++;
      sh.hint.textContent = 'ถูกต้อง! ช่องนี้คือ ' + sh.answer.name + ' ' + sh.answer.ic;
      sh.hint.className = 'banner good';
      say('ถูกต้อง');
      setTimeout(function () {
        ui.$$('#hChoices .shapebtn').forEach(function (b) { b.classList.remove('right'); });
        if (sh.round >= 8) {
          finishRoom('shape', sh.right * 15);
          reward(3);
          celebrate({
            icon: '🔷', title: 'ครบทุกรอบ!',
            text: 'ตอบถูก ' + sh.right + ' จาก 8 ข้อ ได้ 3 ดาวโบนัส ⭐',
            say: 'เก่งมาก ครบทุกข้อ',
            actions: [{ label: 'เล่นอีกครั้ง ▶', cls: 'btn btn--teal', onClick: startShape },
                      { label: 'กลับล็อบบี้', cls: 'btn btn--ghost', onClick: function () { goTab('lobby'); } }]
          });
        } else nextShape();
      }, 800);
    } else {
      btn.classList.add('wrong');
      audio.oops();
      sh.hint.textContent = 'ยังไม่ใช่รูปนี้ ลองอ่านแถวจากซ้ายไปขวาอีกทีนะ 🙂';
      sh.hint.className = 'banner warn';
      setTimeout(function () { btn.classList.remove('wrong'); }, 500);
    }
  }

  if (sh.row) {
    if (sh.btn) sh.btn.addEventListener('click', startShape);
    startShape();
  }

  /* ======================================================================
     ห้อง 10 — เขาวงกตเสียง (นำทาง)
     ====================================================================== */
  var MAZE_MAP = [
    'S....',
    '.###.',
    '..#..',
    '#..#.',
    '..#.G'
  ];
  var mz = { grid: $('#zGrid'), hint: $('#zHint'), label: $('#zCount'), btn: $('#zRestart'),
             r: 0, c: 0, bunny: null, steps: 0, wins: 0, running: false };

  function mazeRows() { return MAZE_MAP; }
  function mazeWidth() { return MAZE_MAP[0].length; }
  function mazeHeight() { return MAZE_MAP.length; }
  function isWall(r, c) {
    if (r < 0 || c < 0 || r >= mazeHeight() || c >= mazeWidth()) return true;
    return MAZE_MAP[r][c] === '#';
  }

  function renderMaze() {
    mz.grid.innerHTML = '';
    mz.grid.style.gridTemplateColumns = 'repeat(' + mazeWidth() + ',1fr)';
    mz.grid.style.gridTemplateRows = 'repeat(' + mazeHeight() + ',1fr)';
    for (var r = 0; r < mazeHeight(); r++) {
      for (var c = 0; c < mazeWidth(); c++) {
        var d = document.createElement('div');
        d.className = 'zcell' + (isWall(r, c) ? ' wall' : '');
        if (MAZE_MAP[r][c] === 'G') { d.classList.add('goal'); d.textContent = '🥕'; }
        if (MAZE_MAP[r][c] === 'S') { d.classList.add('start'); }
        mz.grid.appendChild(d);
      }
    }
    mz.bunny = document.createElement('div');
    mz.bunny.className = 'zbunny';
    mz.bunny.textContent = '🐰';
    mz.grid.appendChild(mz.bunny);
    placeBunny(0, 2);
  }

  function placeBunny(r, c) {
    mz.r = r; mz.c = c;
    mz.bunny.style.setProperty('--r', r);
    mz.bunny.style.setProperty('--c', c);
  }

  async function moveBunny(dir) {
    if (mz.running) return;
    var D = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
    var dr = D[dir][0], dc = D[dir][1];
    var nr = mz.r + dr, nc = mz.c + dc;
    if (isWall(nr, nc)) {
      mz.bunny.classList.add('bump');
      audio.oops();
      setTimeout(function () { mz.bunny.classList.remove('bump'); }, 400);
      return;
    }
    mz.running = true;
    placeBunny(nr, nc);
    audio.note(SCALE_BEEP[mz.steps % SCALE_BEEP.length], 0.22);
    mz.steps++;
    if (mz.label) mz.label.textContent = 'เดินแล้ว ' + mz.steps + ' ช่อง · ชนะ ' + mz.wins + ' ครั้ง';
    await sleep(300);
    mz.running = false;
    if (MAZE_MAP[nr][nc] === 'G') {
      mz.wins++;
      finishRoom('maze', Math.max(20, 200 - mz.steps * 5));
      reward(3);
      mz.bunny.classList.add('cheer');
      say('ถึงแครอทแล้ว เก่งมาก');
      audio.win();
      ui.confetti(30);
      mz.hint.textContent = 'ถึงแครอทแล้ว! 🥕🎉 กด “เริ่มใหม่” เพื่อเล่นอีกครั้ง';
      mz.hint.className = 'banner good';
    }
  }

  if (mz.grid) {
    renderMaze();
    if (mz.label) mz.label.textContent = 'เดินแล้ว 0 ช่อง · ชนะ 0 ครั้ง';
    ui.$$('#zPad .key[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { moveBunny(b.dataset.dir); });
    });
    if (mz.btn) mz.btn.addEventListener('click', function () {
      mz.steps = 0;
      placeBunny(0, 2);
      renderMaze();
      mz.hint.textContent = 'พากระต่ายน้อยเดินไปหาแครอท 🥕 ชนกำแพงไม่เป็นไรนะ';
      mz.hint.className = 'banner';
    });
  }

  /* ======================================================================
     ห้อง 11 — อารมณ์ตัวอักษร (สังเกตความต่าง)
     ====================================================================== */
  var WD_ROWS = [
    { base: 'ก', odd: 'ฆ', hint: 'ตัว ก กับ ฆ เหมือนกันเกือบทุกอย่าง แต่ฆ มีหัวเป็นสองชั้น' },
    { base: 'บ', odd: 'ป', hint: 'บ ไม่มีหางบน แต่ป มีหางโค้งบน' },
    { base: 'ข', odd: 'ช', hint: 'ข มีหนวดหนึ่งเส้น ช มีหนวดสองเส้น' },
    { base: 'ม', odd: 'น', hint: 'ม กับ น ต่างกันที่หัว ลองดูดี ๆ' },
    { base: 'ง', odd: 'ธ', hint: 'ง โค้งเดียว ธ มีวงกลมกลางตัว' },
    { base: 'ค', odd: 'ท', hint: 'ค กับ ท ต่างกันที่หัว ลองสังเกตดู' }
  ];
  var wd = { row: $('#wRow'), hint: $('#wHint'), label: $('#wCount'), btn: $('#wRestart'),
             round: 0, right: 0, odd: null };

  function startWord() {
    wd.round = 0; wd.right = 0;
    nextWord();
  }

  function nextWord() {
    var set = WD_ROWS[Math.floor(Math.random() * WD_ROWS.length)];
    wd.odd = set.odd;
    var len = 6;
    var oddIdx = Math.floor(Math.random() * len);
    wd.row.innerHTML = '';
    for (var i = 0; i < len; i++) {
      (function (i) {
        var ch = i === oddIdx ? set.odd : set.base;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'charbtn';
        b.textContent = ch;
        b.setAttribute('aria-label', 'ตัวอักษร ' + ch);
        b.addEventListener('click', function () {
          if (ch === set.odd) {
            b.classList.add('right');
            audio.pop();
            reward(1);
            wd.right++;
            wd.hint.textContent = 'ถูกต้อง! ' + set.hint;
            wd.hint.className = 'banner good';
            say('ถูกต้อง สังเกตเก่งมาก');
            setTimeout(function () {
              ui.$$('#wRow .charbtn').forEach(function (x) { x.classList.remove('right'); });
              if (wd.round >= 6) {
                finishRoom('word', wd.right * 20);
                reward(3);
                celebrate({
                  icon: '🔤', title: 'หาเจอทุกรอบ!',
                  text: 'ตอบถูก ' + wd.right + ' จาก 6 รอบ ได้ 3 ดาวโบนัส ⭐',
                  say: 'สังเกตเก่งมาก ครบทุกรอบ',
                  actions: [{ label: 'เล่นอีกครั้ง ▶', cls: 'btn btn--teal', onClick: startWord },
                            { label: 'กลับล็อบบี้', cls: 'btn btn--ghost', onClick: function () { goTab('lobby'); } }]
                });
              } else nextWord();
            }, 1100);
          } else {
            b.classList.add('wrong');
            audio.oops();
            wd.hint.textContent = 'ยังไม่ใช่ตัวนี้ ลองเทียบทีละตัวดูนะ 👀';
            wd.hint.className = 'banner warn';
            setTimeout(function () { b.classList.remove('wrong'); }, 500);
          }
        });
        wd.row.appendChild(b);
      })(i);
    }
    wd.round++;
    if (wd.label) wd.label.textContent = 'รอบที่ ' + wd.round + ' / 6';
    wd.hint.textContent = 'มีตัวอักษรหนึ่งตัวที่ไม่เหมือนเพื่อน หาเจอไหม? 🔍';
    wd.hint.className = 'banner';
  }

  if (wd.row) {
    if (wd.btn) wd.btn.addEventListener('click', startWord);
    startWord();
  }
})();
