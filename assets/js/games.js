/* ==========================================================================
   โค้ดน้อย (Kod Noi) — games.js
   5 ห้องเล่นหลัก: หุ่นยนต์เก็บดาว / อะไรต่อนะ / แยกตะกร้า / ห้องแสงสี / เรียงเรื่องราว (+ 6 ห้องใน rooms-extra.js)
   ใช้ร่วมกับ app.js (window.KN)
   ========================================================================== */
(function () {
  'use strict';
  var KN = window.KN;
  var audio = KN.audio, ui = KN.ui, store = KN.store, say = KN.say, celebrate = KN.celebrate;
  var $ = ui.$, sleep = ui.sleep;

  function gainedStickers(list) {
    if (!list || !list.length) return;
    window.KN.paintHud && window.KN.paintHud();
    ui.toast('ได้สติกเกอร์ใหม่ ' + list[0].icon + ' ' + list[0].name + '!');
    audio.star();
    say('ได้สติกเกอร์ใหม่แล้ว');
  }

  function reward(n) {
    gainedStickers(store.addStars(n));
    window.KN.paintHud && window.KN.paintHud();
  }

  /* บันทึกผลจบรอบของห้องหนึ่ง (คะแนนสูงสุด จำนวนครั้ง เวลาล่าสุด) */
  function finishRoom(roomId, score) {
    var r = store.recordPlay(roomId, score);
    window.KN.paintHud && window.KN.paintHud();
    return r;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ==================================================================
     ทะเบียนห้องเล่นทั้งหมด (ใช้ทำล็อบบี้และบันทึกผลรายห้อง)
     วิธีเพิ่มห้องใหม่: ดูคู่มือใน docs/HANDBOOK-ROOMS.md
     ================================================================== */
  var ROOMS = [
    { id: 'robot',   icon: '🤖', name: 'หุ่นยนต์เก็บดาว',  skill: 'ลำดับคำสั่ง',         desc: 'ต่อลูกศรเป็นแผน แล้วให้หุ่นยนต์เดินตาม', how: 'กดลูกศรให้ครบแผน แล้วกด “ลองเลย” ถ้ายังไม่ถึงดาวก็แก้ได้เรื่อย ๆ ไม่มีหักดาว' },
    { id: 'pattern', icon: '🎯', name: 'อะไรต่อนะ',        skill: 'การเห็นรูปแบบ',       desc: 'ทายว่าอะไรจะมาต่อในช่อง “?”', how: 'ดูชุดภาพที่เรียงกัน แล้วแตะคำตอบที่ควรมาต่อ ถ้าคิดไม่ออกให้กดฟังจังหวะ' },
    { id: 'sort',    icon: '🧺', name: 'แยกตะกร้า',        skill: 'การจำแนก · เงื่อนไข', desc: 'แยกของใส่ตะกร้าให้ถูกกลุ่ม', how: 'ดูของที่โผล่มา แล้วแตะตะกร้าที่ใช่ มีทั้งแยกตามสีและแยกตามชนิด' },
    { id: 'studio',  icon: '🎨', name: 'ห้องแสงสี',        skill: 'สร้างสรรค์ · ลูป',     desc: 'แตะช่องให้เกิดสีและเสียง แล้วเล่นย้อนหลัง', how: 'เลือกสีแล้วแตะช่องในกรอบ กด “เล่นจังหวะ” เพื่อฟังเพลงที่หนูสร้าง' },
    { id: 'story',   icon: '📚', name: 'เรียงเรื่องราว',     skill: 'ลำดับเหตุการณ์',       desc: 'เรียงการ์ดให้เป็นเรื่องราว', how: 'แตะการ์ดเรียงจากซ้ายไปขวา ว่าอะไรเกิดก่อนและหลัง' },
    { id: 'balloon', icon: '🎈', name: 'จับคู่ลูกโป่ง',      skill: 'การจับคู่ · ความจำ',   desc: 'เปิดลูกโป่งหาคู่ภาพเดียวกัน', how: 'แตะลูกโป่งทีละใบให้เปิดออก จับคู่ภาพเดียวกันให้ครบทั้ง 6 คู่' },
    { id: 'music',   icon: '🎵', name: 'บันไดดนตรี',       skill: 'ฟังเสียง · ลำดับ',    desc: 'ฟังทำนองแล้วแตะซ้ำตาม', how: 'ฟังเสียงบันไดที่เล่นให้ แล้วแตะบันไดซ้ำตามลำดับจากต่ำไปสูง' },
    { id: 'count',   icon: '🍎', name: 'ตลาดนับของ',       skill: 'การนับ · จำนวน',     desc: 'นับของในตะกร้าให้ถูกจำนวน', how: 'ดูของที่โผล่มา แล้วแตะตัวเลขให้ตรงกับจำนวนที่เห็น' },
    { id: 'shape',   icon: '🔵', name: 'ตามรอยรูปร่าง',     skill: 'รูปร่าง · สมาธิ',     desc: 'หารูปร่างที่หายไปในแถว', how: 'ดูรูปร่างทั้งแถว แล้วหาว่าช่อง “?” ควรเป็นรูปไหน' },
    { id: 'maze',    icon: '🌀', name: 'เขาวงกตเสียง',      skill: 'นำทาง · การฟัง',     desc: 'พากระต่ายน้อยไปหาแครอท', how: 'ใช้ลูกศรนำทางทีละช่อง ชนกำแพงไม่เป็นไร เดินไปจนถึงแครอท 🥕' },
    { id: 'word',    icon: '🔤', name: 'อารมณ์ตัวอักษร',   skill: 'ตัวอักษร · สังเกต',   desc: 'หาตัวอักษรที่ต่างออกไป', how: 'ดูแถวตัวอักษร แล้วแตะตัวที่ไม่เหมือนเพื่อน' }
  ];
  window.KN_ROOMS = ROOMS;

  /* ======================================================================
     ห้อง 1 — หุ่นยนต์เก็บดาว (ลำดับคำสั่ง) · 8 ด่าน มีตัวอย่างทางเดิน
     ====================================================================== */
  var R_LEVELS = [
    { n: 3, start: { r: 2, c: 0 }, goal: { r: 2, c: 2 }, walls: [], items: [], max: 6,
      sol: ['right', 'right'], hint: 'กดลูกศรให้หุ่นยนต์เดินไปหาดาว ⭐' },
    { n: 3, start: { r: 0, c: 0 }, goal: { r: 2, c: 2 }, walls: [{ r: 0, c: 2 }], items: [], max: 8,
      sol: ['down', 'down', 'right', 'right'], hint: 'มีกำแพงขวางทาง ต้องอ้อมลงล่างนะ 🪨' },
    { n: 4, start: { r: 3, c: 0 }, goal: { r: 0, c: 3 },
      walls: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 1, c: 0 }],
      items: [{ r: 2, c: 1, ic: '🍎' }, { r: 2, c: 2, ic: '🍇' }], max: 12,
      sol: ['up', 'right', 'right', 'right', 'up', 'up'], hint: 'เก็บผลไม้ระหว่างทางได้ด้วยนะ 🍎🍇' },
    { n: 4, start: { r: 0, c: 0 }, goal: { r: 3, c: 3 },
      walls: [{ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
      items: [{ r: 1, c: 0, ic: '🍓' }], max: 10,
      sol: ['down', 'down', 'down', 'right', 'right', 'right'], hint: 'คราวนี้เป้าหมายอยู่มุมล่างขวา' },
    { n: 5, start: { r: 4, c: 0 }, goal: { r: 0, c: 4 },
      walls: [{ r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }],
      items: [{ r: 3, c: 2, ic: '🍓' }], max: 14,
      sol: ['up', 'right', 'right', 'right', 'right', 'up', 'up', 'up'],
      hint: 'กระดานใหญ่ขึ้นแล้ว มีแถวกำแพงยาวให้อ้อม 🪨' },
    { n: 5, start: { r: 2, c: 0 }, goal: { r: 2, c: 4 },
      walls: [{ r: 2, c: 1 }, { r: 2, c: 3 }],
      items: [{ r: 1, c: 2, ic: '🍒' }], max: 12,
      sol: ['up', 'right', 'right', 'right', 'right', 'down'],
      hint: 'เดินเลียบแถวบนเพื่อเก็บเชอร์รี่ 🍒' },
    { n: 5, start: { r: 0, c: 2 }, goal: { r: 4, c: 2 },
      walls: [{ r: 1, c: 2 }, { r: 3, c: 2 }],
      items: [{ r: 2, c: 1, ic: '🍌' }], max: 12,
      sol: ['left', 'down', 'down', 'down', 'down', 'right'],
      hint: 'ลงตรง ๆ ไม่ได้ มีกำแพงสองชั้น' },
    { n: 5, start: { r: 4, c: 2 }, goal: { r: 0, c: 0 },
      walls: [{ r: 3, c: 2 }, { r: 2, c: 2 }, { r: 2, c: 1 }],
      items: [{ r: 3, c: 0, ic: '🍇' }, { r: 1, c: 0, ic: '🍓' }], max: 12,
      sol: ['left', 'left', 'up', 'up', 'up', 'up'],
      hint: 'ด่านสุดท้ายแล้ว สู้ ๆ 🚀' }
  ];
  var DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  var ARROW = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };

  var rg = {
    board: $('#rBoard'), bot: $('#rBot'), cmdsEl: $('#rCmds'), pad: $('#rPad'),
    hint: $('#rHint'), levelLabel: $('#rLevel'), runBtn: $('#rRun'),
    lv: 0, cmds: [], running: false, cleared: [], demo: false
  };

  function cellEl(r, c) { return rg.board.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]'); }

  function renderRobotLevel() {
    var L = R_LEVELS[rg.lv];
    rg.cmds = [];
    rg.running = false;
    rg.cleared = [];
    rg.board.style.gridTemplateColumns = 'repeat(' + L.n + ',1fr)';
    rg.board.style.gridTemplateRows = 'repeat(' + L.n + ',1fr)';
    ui.$$('.cell', rg.board).forEach(function (c) { c.parentNode.removeChild(c); });
    for (var r = 0; r < L.n; r++) {
      for (var c = 0; c < L.n; c++) {
        var d = document.createElement('div');
        d.className = 'cell';
        d.dataset.r = r; d.dataset.c = c;
        if (L.walls.some(function (w) { return w.r === r && w.c === c; })) { d.classList.add('wall'); }
        if (L.goal.r === r && L.goal.c === c) { d.classList.add('goal'); d.textContent = '⭐'; }
        var it = L.items.filter(function (x) { return x.r === r && x.c === c; })[0];
        if (it) { d.textContent = it.ic; }
        rg.board.appendChild(d);
      }
    }
    rg.bot.style.setProperty('--n', L.n);
    placeBot(L.start.r, L.start.c);
    rg.hint.textContent = L.hint;
    rg.hint.className = 'banner';
    if (rg.levelLabel) rg.levelLabel.textContent = 'ด่าน ' + (rg.lv + 1) + ' / ' + R_LEVELS.length;
    paintCmds();
    setPad(false);
    paintLevelPick();
  }

  function placeBot(r, c) {
    rg.bot.style.setProperty('--r', r);
    rg.bot.style.setProperty('--c', c);
    rg.bot.dataset.r = r; rg.bot.dataset.c = c;
  }

  function paintLevelPick() {
    var box = $('#rLevels');
    if (!box) return;
    box.innerHTML = '';
    R_LEVELS.forEach(function (L, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lvlbtn';
      b.textContent = i + 1;
      b.setAttribute('aria-label', 'ไปด่านที่ ' + (i + 1));
      b.setAttribute('aria-current', String(i === rg.lv));
      b.addEventListener('click', function () {
        if (rg.running || rg.demo) return;
        rg.lv = i;
        audio.tap();
        renderRobotLevel();
      });
      box.appendChild(b);
    });
  }

  function paintCmds() {
    rg.cmdsEl.innerHTML = '';
    if (!rg.cmds.length) {
      var e = document.createElement('span');
      e.className = 'empty';
      e.textContent = 'ยังไม่มีคำสั่ง — กดลูกศรด้านบนเพื่อเพิ่มได้เลย';
      rg.cmdsEl.appendChild(e);
      return;
    }
    rg.cmds.forEach(function (d, i) {
      var s = document.createElement('div');
      s.className = 'cmdchip';
      s.dataset.i = i;
      s.textContent = ARROW[d];
      rg.cmdsEl.appendChild(s);
    });
  }

  function addCmd(d) {
    if (rg.running || rg.demo) return;
    var L = R_LEVELS[rg.lv];
    if (rg.cmds.length >= L.max) { ui.toast('คำสั่งเต็มแล้ว ลองกด "ลองเลย" ดูก่อนนะ'); audio.oops(); return; }
    rg.cmds.push(d);
    paintCmds();
    audio.tap();
  }

  function setPad(disabled) {
    ui.$$('#rPad .key').forEach(function (b) { b.disabled = disabled; });
    if (rg.runBtn) rg.runBtn.disabled = disabled;
  }

  /* เดินแบบเจาะจง (ใช้ทั้งเล่นจริงและโชว์ตัวอย่าง) */
  async function walkRobot(cmdList, isDemo) {
    var L = R_LEVELS[rg.lv];
    rg.running = true;
    rg.demo = !!isDemo;
    setPad(true);
    if (!isDemo) { rg.hint.textContent = 'หุ่นยนต์กำลังทำงาน…'; rg.hint.className = 'banner'; }

    var r = L.start.r, c = L.start.c;
    placeBot(r, c);
    await sleep(isDemo ? 260 : 320);

    var chips = isDemo ? [] : ui.$$('#rCmds .cmdchip');
    var won = false;

    for (var i = 0; i < cmdList.length; i++) {
      if (chips[i]) {
        chips.forEach(function (ch) { ch.classList.remove('now'); });
        chips[i].classList.add('now');
      }
      var dr = DIRS[cmdList[i]][0], dc = DIRS[cmdList[i]][1];
      var nr = r + dr, nc = c + dc;

      if (nr < 0 || nc < 0 || nr >= L.n || nc >= L.n || L.walls.some(function (w) { return w.r === nr && w.c === nc; })) {
        rg.bot.classList.add('bump');
        setTimeout(function () { rg.bot.classList.remove('bump'); }, 400);
        audio.oops();
        if (!isDemo) {
          rg.hint.textContent = 'อุ๊ย! หุ่นยนต์ไปต่อไม่ได้ ลองแก้คำสั่งอีกทีนะ 💪';
          rg.hint.className = 'banner warn';
          say('ลองแก้อีกทีนะ');
          if (chips[i]) chips[i].classList.remove('now');
        }
        rg.running = false; rg.demo = false; setPad(false);
        return false;
      }

      r = nr; c = nc;
      placeBot(r, c);
      audio.step();

      var cell = cellEl(r, c);
      if (cell) {
        if (isDemo) { cell.classList.add('trail'); }
        if (!isDemo && !cell.classList.contains('done')) {
          var txt = cell.textContent;
          if (txt && txt !== '⭐') {
            cell.textContent = '';
            rg.cleared.push(txt);
            audio.pop();
            reward(1);
            rg.hint.textContent = 'เก็บ ' + txt + ' ได้แล้ว! เก่งมาก 👏';
            rg.hint.className = 'banner good';
          }
        }
      }
      if (chips[i]) { chips[i].classList.remove('now'); chips[i].classList.add('done'); }

      await sleep(isDemo ? 330 : 430);
      if (r === L.goal.r && c === L.goal.c) { won = true; break; }
    }

    rg.running = false;
    rg.demo = false;
    setPad(false);
    if (won && cellEl(L.goal.r, L.goal.c)) cellEl(L.goal.r, L.goal.c).classList.add('done');
    return won;
  }

  async function runRobot() {
    if (rg.running || rg.demo) return;
    var L = R_LEVELS[rg.lv];
    if (!rg.cmds.length) {
      rg.hint.textContent = 'ยังไม่มีคำสั่งเลยนะ กดลูกศรก่อน 👇';
      rg.hint.className = 'banner warn';
      audio.oops(); say('ยังไม่มีคำสั่งเลยจ้ะ');
      return;
    }
    var won = await walkRobot(rg.cmds.slice(), false);
    paintCmds();

    if (won) {
      rg.bot.classList.add('cheer');
      rg.hint.textContent = 'ถึงดาวแล้ว! เยี่ยมมาก 🎉 เก็บได้อีก ' + rg.cleared.length + ' ชิ้น';
      rg.hint.className = 'banner good';
      finishRoom('robot', (rg.lv + 1) * 10 + rg.cleared.length * 5);
      reward(3);
      var last = rg.lv >= R_LEVELS.length - 1;
      celebrate({
        icon: '🎉',
        title: 'ถึงดาวแล้ว! เยี่ยมมาก',
        text: 'ได้ 3 ดาว ⭐ (เก็บผลไม้เพิ่ม ' + rg.cleared.length + ' ชิ้น)',
        say: 'เยี่ยมมาก ถึงดาวแล้ว',
        actions: last
          ? [{ label: 'ไปห้องถัดไป ▶', cls: 'btn btn--teal', onClick: function () { goTab('pattern'); } },
             { label: 'เล่นด่านนี้อีกครั้ง', cls: 'btn btn--ghost', onClick: function () { renderRobotLevel(); } }]
          : [{ label: 'ด่านต่อไป ▶', cls: 'btn btn--teal', onClick: function () { rg.lv++; store.set('robotLevel', rg.lv); renderRobotLevel(); } },
             { label: 'เล่นด่านนี้อีกครั้ง', cls: 'btn btn--ghost', onClick: function () { renderRobotLevel(); } }]
      });
      setTimeout(function () { rg.bot.classList.remove('cheer'); }, 1200);
    } else {
      rg.hint.textContent = rg.hint.classList.contains('warn') ? rg.hint.textContent : 'ยังไม่ถึงดาวเลย ลองเพิ่มหรือแก้คำสั่งอีกนิดนะ 💪';
      say('ลองอีกครั้งนะ');
    }
  }

  async function demoRobot() {
    if (rg.running || rg.demo) return;
    var L = R_LEVELS[rg.lv];
    ui.$$('.cell', rg.board).forEach(function (c) { c.classList.remove('trail'); });
    rg.hint.textContent = 'ดูนะ… นี่คือทางเดินตัวอย่าง 👀 จบแล้วลองทำตามได้เลย';
    rg.hint.className = 'banner';
    say('ดูทางเดินตัวอย่างนะ');
    await walkRobot(L.sol, true);
    await sleep(500);
    renderRobotLevel();
    rg.hint.textContent = 'ได้เวลาของหนูแล้ว! ลองกดลูกศรทำตามที่เห็น 🚀';
  }

  if (rg.board) {
    ui.$$('#rPad .key[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { addCmd(b.dataset.dir); });
    });
    var undo = $('#rUndo');
    if (undo) undo.addEventListener('click', function () {
      if (rg.running || rg.demo) return;
      rg.cmds.pop(); paintCmds(); audio.tap();
    });
    var clr = $('#rClear');
    if (clr) clr.addEventListener('click', function () {
      if (rg.running || rg.demo) return;
      rg.cmds = []; paintCmds(); audio.tap();
    });
    if (rg.runBtn) rg.runBtn.addEventListener('click', runRobot);
    var demoBtn = $('#rDemo');
    if (demoBtn) demoBtn.addEventListener('click', demoRobot);
    var again = $('#rAgain');
    if (again) again.addEventListener('click', function () { renderRobotLevel(); });

    document.addEventListener('keydown', function (e) {
      var tab = document.getElementById('tab-robot');
      if (!tab || !tab.classList.contains('on')) return;
      var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[e.key]) { e.preventDefault(); addCmd(map[e.key]); }
      if (e.key === 'Enter') { e.preventDefault(); runRobot(); }
    });
  }

  /* ======================================================================
     ห้อง 2 — อะไรต่อนะ (รูปแบบ) · 14 ข้อ + ฟังจังหวะช่วยจำ
     ====================================================================== */
  var P_LEVELS = [
    { seq: ['🍎', '🍌', '🍎', '🍌'], ans: '🍎', choices: ['🍇', '🍎', '🍌'] },
    { seq: ['🔴', '🔵', '🔴', '🔵'], ans: '🔴', choices: ['🟢', '🔵', '🔴'] },
    { seq: ['🐶', '🐱', '🐱', '🐶', '🐱'], ans: '🐱', choices: ['🐰', '🐶', '🐱'] },
    { seq: ['⭐', '⭐', '🌙', '⭐', '⭐'], ans: '🌙', choices: ['🌙', '☀️', '⭐'] },
    { seq: ['🟨', '🟩', '🟨', '🟩'], ans: '🟨', choices: ['🟨', '🟦', '🟩'] },
    { seq: ['🐟', '🐠', '🐟', '🐠'], ans: '🐟', choices: ['🐡', '🐠', '🐟'] },
    { seq: ['🟣', '🟣', '🟠', '🟣', '🟣'], ans: '🟠', choices: ['🔵', '🟣', '🟠'] },
    { seq: ['🚗', '🚕', '🚗', '🚕'], ans: '🚗', choices: ['🚌', '🚗', '🚕'] },
    { seq: ['🚀', '🌟', '🚀', '🌟'], ans: '🚀', choices: ['🚀', '🌟', '☄️'] },
    { seq: ['🟧', '🟪', '🟪', '🟧', '🟪'], ans: '🟪', choices: ['🟧', '🟪', '🟦'] },
    { seq: ['🐘', '🐭', '🐭', '🐘', '🐭'], ans: '🐭', choices: ['🐭', '🐘', '🐹'] },
    { seq: ['🌤️', '🌧️', '🌤️', '🌧️'], ans: '🌤️', choices: ['🌤️', '🌧️', '🌈'] },
    { seq: ['🐝', '🐝', '🦋', '🐝', '🐝'], ans: '🦋', choices: ['🦋', '🐝', '🐛'] },
    { seq: ['🔵', '🔴', '🟡', '🔵', '🔴'], ans: '🟡', choices: ['🟢', '🟡', '🔵'] }
  ];

  var pg = { seq: $('#pSeq'), choices: $('#pChoices'), hint: $('#pHint'), label: $('#pCount'), i: 0, score: 0, playing: false };

  function toneOf(icon) {
    var pool = ['🍎', '🔴', '🐶', '⭐', '🟨', '🐟', '🟣', '🚗', '🚀', '🟧', '🐘', '🌤️', '🐝', '🔵'];
    var idx = 0;
    for (var i = 0; i < pool.length; i++) if (icon === pool[i]) { idx = i; break; }
    return [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 622.25, 659.25, 698.46, 783.99, 880.00][idx % 14];
  }

  async function playRhythm() {
    if (pg.playing) return;
    var L = P_LEVELS[pg.i];
    pg.playing = true;
    ui.$$('#pChoices .choice').forEach(function (b) { b.disabled = true; });
    pg.hint.textContent = 'ฟังเสียงจังหวะ… แล้วเลือกว่าอะไรต่อ 🎵';
    pg.hint.className = 'banner';
    var slots = ui.$$('#pSeq .slot');
    for (var i = 0; i < L.seq.length; i++) {
      if (slots[i]) slots[i].classList.add('sing');
      audio.note(toneOf(L.seq[i]), 0.34);
      await sleep(430);
      if (slots[i]) slots[i].classList.remove('sing');
    }
    ui.$$('#pChoices .choice').forEach(function (b) { b.disabled = false; });
    pg.playing = false;
  }

  function renderPattern() {
    var L = P_LEVELS[pg.i];
    pg.seq.innerHTML = '';
    L.seq.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'slot';
      d.textContent = s;
      pg.seq.appendChild(d);
    });
    var q = document.createElement('div');
    q.className = 'slot ask';
    q.id = 'pAsk';
    q.textContent = '?';
    pg.seq.appendChild(q);

    pg.choices.innerHTML = '';
    L.choices.forEach(function (ch) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = ch;
      b.setAttribute('aria-label', 'ตัวเลือก ' + ch);
      b.addEventListener('click', function () { answerPattern(ch, b); });
      pg.choices.appendChild(b);
    });

    if (pg.label) pg.label.textContent = 'ข้อ ' + (pg.i + 1) + ' / ' + P_LEVELS.length;
    pg.hint.textContent = 'ดูให้ดี… แล้วอะไรจะมาต่อจากช่อง "?" เอ่ย?';
    pg.hint.className = 'banner';
  }

  function answerPattern(ch, btn) {
    var L = P_LEVELS[pg.i];
    if (btn.disabled || pg.playing) return;
    if (ch === L.ans) {
      btn.classList.add('right');
      var ask = $('#pAsk');
      if (ask) { ask.classList.remove('ask'); ask.textContent = ch; }
      audio.pop();
      reward(1);
      pg.score++;
      ui.$$('#pChoices .choice').forEach(function (b) { b.disabled = true; });
      pg.hint.textContent = 'ถูกต้อง! ' + L.seq.join('') + ch + ' 🎯';
      pg.hint.className = 'banner good';
      say('ถูกต้อง เก่งมาก');
      setTimeout(function () {
        if (pg.i >= P_LEVELS.length - 1) {
          finishRoom('pattern', 100 + pg.score);
          reward(3);
          celebrate({
            icon: '🏆', title: 'จับรูปแบบครบทุกข้อ!',
            text: 'ตอบถูก ' + pg.score + ' ข้อ ได้ 3 ดาวโบนัส ⭐',
            say: 'เก่งมากเลย จับรูปแบบได้ครบทุกข้อ',
            actions: [{ label: 'ไปห้องถัดไป ▶', cls: 'btn btn--teal', onClick: function () { goTab('sort'); } },
                      { label: 'เล่นอีกครั้ง', cls: 'btn btn--ghost', onClick: function () { pg.i = 0; pg.score = 0; renderPattern(); } }]
          });
        } else {
          pg.i++;
          if (pg.score > store.data.patternBest) store.set('patternBest', pg.score);
          renderPattern();
        }
      }, 900);
    } else {
      btn.classList.add('wrong');
      audio.oops();
      pg.hint.textContent = 'ยังไม่ใช่ ลองกด "ฟังจังหวะ" ดูนะ 🎵';
      pg.hint.className = 'banner warn';
      setTimeout(function () { btn.classList.remove('wrong'); }, 500);
    }
  }

  if (pg.seq) {
    renderPattern();
    var rp = $('#pRhythm');
    if (rp) rp.addEventListener('click', playRhythm);
  }

  /* ======================================================================
     ห้อง 3 — แยกตะกร้า · 2 ชุด: แยกตามสี / แยกตามชนิด
     ====================================================================== */
  var S_SETS = [
    {
      key: 'color', title: 'แยกตามสี', cue: 'ของชิ้นนี้ควรใส่ตะกร้าสีอะไรนะ?',
      cats: [
        { id: 'red', label: 'ตะกร้าสีแดง', cls: 'red' },
        { id: 'yellow', label: 'ตะกร้าสีเหลือง', cls: 'yellow' },
        { id: 'green', label: 'ตะกร้าสีเขียว', cls: 'green' }
      ],
      items: [
        { ic: '🍎', cat: 'red' }, { ic: '🍓', cat: 'red' }, { ic: '🍅', cat: 'red' },
        { ic: '🍌', cat: 'yellow' }, { ic: '🍋', cat: 'yellow' }, { ic: '🌻', cat: 'yellow' },
        { ic: '🥦', cat: 'green' }, { ic: '🥒', cat: 'green' }, { ic: '🍐', cat: 'green' }
      ]
    },
    {
      key: 'kind', title: 'แยกตามชนิด', cue: 'ของชิ้นนี้เป็นประเภทไหนนะ?',
      cats: [
        { id: 'food', label: 'ของกิน 🍽️', cls: 'yellow' },
        { id: 'animal', label: 'สัตว์ 🐾', cls: 'red' },
        { id: 'vehicle', label: 'พาหนะ 🚦', cls: 'green' }
      ],
      items: [
        { ic: '🍞', cat: 'food' }, { ic: '🍚', cat: 'food' }, { ic: '🧀', cat: 'food' },
        { ic: '🐶', cat: 'animal' }, { ic: '🐱', cat: 'animal' }, { ic: '🐸', cat: 'animal' },
        { ic: '🚌', cat: 'vehicle' }, { ic: '🚲', cat: 'vehicle' }, { ic: '✈️', cat: 'vehicle' }
      ]
    }
  ];

  var sgb = { item: $('#sItem'), baskets: $('#sBaskets'), hint: $('#sHint'), label: $('#sCount'), title: $('#sTitle'),
              queue: [], done: 0, right: 0, setIdx: 0 };

  function catLabel(id) {
    var cats = S_SETS[sgb.setIdx].cats;
    for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i].label;
    return id;
  }

  function renderSortBaskets() {
    var set = S_SETS[sgb.setIdx];
    sgb.baskets.innerHTML = '';
    set.cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'basket ' + c.cls;
      b.dataset.cat = c.id;
      b.setAttribute('aria-label', c.label);
      if (set.key === 'color') {
        b.innerHTML = '<span class="swatch"></span>' + c.label;
      } else {
        var icons = { food: '🍽️', animal: '🐾', vehicle: '🚦' };
        b.innerHTML = '<span class="emo" style="font-size:34px">' + (icons[c.id] || '🧺') + '</span>' + c.label;
      }
      b.addEventListener('click', function () { answerSort(b.dataset.cat, b); });
      sgb.baskets.appendChild(b);
    });
  }

  function renderSortItem() {
    if (!sgb.queue.length) return;
    var it = sgb.queue[0];
    sgb.item.textContent = it.ic;
    sgb.item.classList.remove('fly');
    sgb.item.style.animation = 'none';
    void sgb.item.offsetWidth;
    sgb.item.style.animation = '';
    if (sgb.label) sgb.label.textContent = 'ชิ้นที่ ' + (sgb.done + 1) + ' / ' + S_SETS[sgb.setIdx].items.length;
  }

  function startSort() {
    var set = S_SETS[sgb.setIdx];
    sgb.queue = shuffle(set.items.slice());
    sgb.done = 0; sgb.right = 0;
    if (sgb.title) sgb.title.textContent = set.title;
    sgb.hint.textContent = set.cue;
    sgb.hint.className = 'banner';
    renderSortBaskets();
    renderSortItem();
  }

  function answerSort(cat, btn) {
    if (!sgb.queue.length) return;
    var it = sgb.queue[0];
    if (it.cat === cat) {
      btn.classList.add('right');
      audio.pop();
      reward(1);
      sgb.right++;
      sgb.done++;
      sgb.item.classList.add('fly');
      sgb.queue.shift();
      sgb.hint.textContent = 'ถูกต้อง! ' + it.ic + ' ไปที่ "' + catLabel(cat) + '" 👏';
      sgb.hint.className = 'banner good';
      say('ถูกต้อง');
      setTimeout(function () {
        btn.classList.remove('right');
        if (!sgb.queue.length) {
          var isLastSet = sgb.setIdx >= S_SETS.length - 1;
          finishRoom('sort', 100 + sgb.right * 10);
          reward(3);
          celebrate({
            icon: '🧺', title: 'แยกของครบทุกชิ้น!',
            text: 'ชุด "' + S_SETS[sgb.setIdx].title + '" ถูก ' + sgb.right + ' จาก ' + S_SETS[sgb.setIdx].items.length + ' ชิ้น ได้ 3 ดาวโบนัส ⭐',
            say: 'เยี่ยมมาก แยกของได้ครบทุกชิ้น',
            actions: isLastSet
              ? [{ label: 'ไปห้องถัดไป ▶', cls: 'btn btn--teal', onClick: function () { goTab('studio'); } },
                 { label: 'เล่นอีกครั้ง', cls: 'btn btn--ghost', onClick: function () { sgb.setIdx = 0; startSort(); } }]
              : [{ label: 'ชุดต่อไป ▶', cls: 'btn btn--teal', onClick: function () { sgb.setIdx++; startSort(); } },
                 { label: 'เล่นชุดนี้อีกครั้ง', cls: 'btn btn--ghost', onClick: startSort }]
          });
          if (sgb.right > store.data.sortBest) store.set('sortBest', sgb.right);
        } else {
          renderSortItem();
          sgb.hint.textContent = 'ชิ้นต่อไปมาแล้ว ' + (sgb.setIdx === 0 ? 'ดูสีให้ดีนะ' : 'คิดดูว่ามันใช้ยังไง ใช่สิ่งมีชีวิตไหม');
          sgb.hint.className = 'banner';
        }
      }, 700);
    } else {
      btn.classList.add('wrong');
      audio.oops();
      sgb.hint.textContent = sgb.setIdx === 0
        ? 'ยังไม่ใช่ตะกร้านี้ ลองดูสีของชิ้นนั้นอีกทีนะ 🙂'
        : 'ยังไม่ใช่กลุ่มนี้ ลองคิดดูอีกทีนะ 🙂';
      sgb.hint.className = 'banner warn';
      setTimeout(function () { btn.classList.remove('wrong'); }, 500);
    }
  }

  if (sgb.baskets) {
    var rs = $('#sRestart');
    if (rs) rs.addEventListener('click', startSort);
    startSort();
  }

  /* ======================================================================
     ห้อง 4 — ห้องแสงสี · วาดอิสระ + โหมดทำตามแบบ + แกลเลอรี
     ====================================================================== */
  var PALETTE = [
    { c: '#FF6B6B', n: 0 }, { c: '#FFD93D', n: 1 }, { c: '#5BC97E', n: 2 },
    { c: '#7BC6FF', n: 3 }, { c: '#9B7BFF', n: 4 }, { c: '#FFFFFF', n: 5 }
  ];
  var SCALE = [261.63, 293.66, 329.63, 392.00, 440.00];
  var N_TILES = 6;
  var stg = { grid: $('#gGrid'), palette: $('#gPalette'), hint: $('#gHint'), brush: 0,
              events: [], colors: {}, playing: false, quiz: null, gallery: $('#gGallery') };

  function buildStudio() {
    stg.grid.style.gridTemplateColumns = 'repeat(' + N_TILES + ',1fr)';
    stg.grid.style.gridTemplateRows = 'repeat(' + N_TILES + ',1fr)';
    stg.grid.innerHTML = '';
    stg.colors = {};
    stg.events = [];
    for (var i = 0; i < N_TILES * N_TILES; i++) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'gtile';
      t.dataset.i = i;
      t.dataset.r = Math.floor(i / N_TILES);
      t.dataset.c = i % N_TILES;
      t.setAttribute('aria-label', 'ช่องที่ ' + (i + 1));
      t.addEventListener('click', function (e) {
        var el = e.currentTarget;
        if (stg.quiz) { quizTap(el); return; }
        paintTile(el, stg.brush, true);
      });
      stg.grid.appendChild(t);
    }
  }

  function tiles() { return ui.$$('#gGrid .gtile'); }

  function paintTile(el, brushIdx, record) {
    if (stg.playing) return;
    var p = PALETTE[brushIdx];
    el.style.background = p.c;
    el.classList.add('lit');
    var r = +el.dataset.r, c = +el.dataset.c;
    var freq = SCALE[(r + c) % SCALE.length];
    audio.note(freq, 0.36);
    if (record) {
      stg.colors[+el.dataset.i] = brushIdx;
      stg.events.push({ i: +el.dataset.i, freq: freq });
      if (stg.events.length > 120) stg.events.shift();
      stg.hint.textContent = 'มี ' + stg.events.length + ' จังหวะในเพลงของหนู — กด "เล่นจังหวะของฉัน" ฟังได้เลย 🎵';
      stg.hint.className = 'banner good';
    }
  }

  function clearTile(el) {
    el.style.background = '';
    el.classList.remove('lit');
    delete stg.colors[+el.dataset.i];
  }

  function buildPalette() {
    stg.palette.innerHTML = '';
    PALETTE.forEach(function (p, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatchbtn';
      b.style.background = p.c;
      b.setAttribute('aria-pressed', String(idx === stg.brush));
      b.setAttribute('aria-label', 'สีที่ ' + (idx + 1));
      b.addEventListener('click', function () {
        stg.brush = idx;
        ui.$$('#gPalette .swatchbtn').forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === idx)); });
        audio.tap();
      });
      stg.palette.appendChild(b);
    });
  }

  async function playStudio() {
    if (stg.playing) return;
    if (!stg.events.length) {
      ui.toast('ยังไม่ได้แตะช่องไหนเลย ลองแตะก่อนนะ');
      audio.oops(); say('ลองแตะช่องก่อนนะ');
      return;
    }
    stg.playing = true;
    stg.hint.textContent = 'กำลังเล่นเพลงของหนู… 🎶';
    stg.hint.className = 'banner';
    var els = tiles();
    for (var i = 0; i < stg.events.length; i++) {
      var ev = stg.events[i];
      var el = els[ev.i];
      if (el) {
        el.style.transform = 'scale(1.14)';
        (function (node) { setTimeout(function () { node.style.transform = ''; }, 180); })(el);
      }
      audio.note(ev.freq, 0.4);
      await sleep(320);
    }
    stg.playing = false;
    reward(1);
    if (stg.events.length >= 8) finishRoom('studio', stg.events.length * 5);
    stg.hint.textContent = 'เพลงจบแล้ว! อยากทำท่อนต่อไปเพิ่มไหม? 🎨';
    stg.hint.className = 'banner good';
  }

  /* ---- โหมดทำตามแบบ ---- */
  function startQuiz() {
    if (stg.playing) return;
    var els = tiles();
    els.forEach(clearTile);
    stg.events = [];
    var picks = [];
    while (picks.length < 4) {
      var i = Math.floor(Math.random() * N_TILES * N_TILES);
      if (picks.indexOf(i) === -1) picks.push(i);
    }
    var three = [0, 1, 2];
    stg.quiz = picks.map(function (i, k) {
      var brush = three[k % 3];
      return { i: i, brush: brush };
    });
    stg.quiz.done = 0;
    // โชว์แบบตัวอย่าง
    stg.quiz.forEach(function (q) {
      els[q.i].style.background = PALETTE[q.brush].c;
      els[q.i].classList.add('lit', 'remember');
    });
    stg.hint.textContent = 'จำแบบนี้ให้ขึ้นใจ… แล้วทำตามให้เหมือนเดิม 👀';
    stg.hint.className = 'banner';
    say('จำสีและช่องให้ดีนะ');
    setTimeout(function () {
      stg.quiz.forEach(function (q) {
        els[q.i].style.background = '';
        els[q.i].classList.remove('lit', 'remember');
      });
      stg.hint.textContent = 'เอาละ! แตะช่องเดิมด้วยสีเดิมให้ครบทั้ง 4 ช่อง 💪';
    }, 2600);
  }

  function quizTap(el) {
    var q = stg.quiz[stg.quiz.done];
    if (!q) return;
    var idx = +el.dataset.i;
    if (idx === q.i && stg.brush === q.brush) {
      audio.pop();
      reward(1);
      stg.quiz.done++;
      el.classList.add('remember');
      stg.hint.textContent = 'ใช่แล้ว! (' + stg.quiz.done + ' / 4 ช่อง) 🎯';
      stg.hint.className = 'banner good';
      if (stg.quiz.done >= stg.quiz.length) {
        celebrate({
          icon: '🧠', title: 'ทำตามแบบได้เป๊ะ!',
          text: 'จำสีและตำแหน่งครบทั้ง 4 ช่อง ได้ดาวพิเศษ ⭐',
          say: 'จำได้เป๊ะเลย เก่งมาก',
          actions: [{ label: 'ทำแบบใหม่อีก ▶', cls: 'btn btn--teal', onClick: startQuiz },
                    { label: 'วาดอิสระต่อ', cls: 'btn btn--ghost', onClick: exitQuiz }]
        });
      }
    } else {
      audio.oops();
      el.classList.add('wrong');
      setTimeout(function () { el.classList.remove('wrong'); }, 450);
      stg.hint.textContent = idx === q.i ? 'ช่องถูกแล้ว แต่สียังไม่ใช่ ลองเปลี่ยนสีดูนะ 🎨' : 'ยังไม่ใช่ช่องนี้ นึกดูว่าแบบอยู่ตรงไหน 👀';
      stg.hint.className = 'banner warn';
    }
  }

  function exitQuiz() {
    stg.quiz = null;
    tiles().forEach(function (t) { t.classList.remove('remember'); });
    stg.hint.textContent = 'กลับมาโหมดวาดอิสระแล้ว เลือกสีทางขวาแล้วแตะได้เลย ✨';
    stg.hint.className = 'banner';
  }

  /* ---- แกลเลอรีภาพที่บันทึก ---- */
  function saveArt() {
    var snap = [];
    for (var i = 0; i < N_TILES * N_TILES; i++) snap.push(stg.colors[i] === undefined ? null : stg.colors[i]);
    if (snap.every(function (v) { return v === null; })) {
      ui.toast('ยังไม่ได้วาดอะไรเลย ลองแตะสีก่อนนะ');
      audio.oops();
      return;
    }
    var g = store.data.gallery || [];
    g.unshift(snap);
    if (g.length > 6) g.length = 6;
    store.set('gallery', g);
    audio.pop();
    paintGallery();
    stg.hint.textContent = 'เก็บภาพไว้ในแกลเลอรีแล้ว 🖼️';
    stg.hint.className = 'banner good';
  }

  function paintGallery() {
    if (!stg.gallery) return;
    var g = store.data.gallery || [];
    stg.gallery.innerHTML = '';
    if (!g.length) {
      var s = document.createElement('span');
      s.className = 'empty';
      s.textContent = 'ยังไม่มีภาพที่บันทึกไว้ — วาดแล้วกด "เก็บภาพ" ได้เลย';
      stg.gallery.appendChild(s);
      return;
    }
    g.forEach(function (snap) {
      var d = document.createElement('div');
      d.className = 'mini';
      snap.forEach(function (v) {
        var c = document.createElement('span');
        c.style.background = v === null ? '#FCFDF7' : PALETTE[v].c;
        d.appendChild(c);
      });
      stg.gallery.appendChild(d);
    });
  }

  if (stg.grid) {
    buildPalette();
    buildStudio();
    paintGallery();
    var b1 = $('#gPlay'), b2 = $('#gClear'), b3 = $('#gRandom'),
        b4 = $('#gQuiz'), b5 = $('#gSave'), b6 = $('#gFree');
    if (b1) b1.addEventListener('click', playStudio);
    if (b2) b2.addEventListener('click', function () {
      stg.events = [];
      tiles().forEach(function (t) { t.style.background = ''; t.classList.remove('lit', 'remember'); });
      stg.colors = {};
      audio.tap();
      stg.hint.textContent = stg.quiz ? 'ล้างกระดานแล้ว ลองเริ่มโหมดทำตามแบบอีกทีนะ' : 'ล้างแล้ว เริ่มวาดใหม่ได้เลย ✨';
      stg.hint.className = 'banner';
    });
    if (b3) b3.addEventListener('click', function () {
      if (stg.quiz) exitQuiz();
      stg.events = [];
      stg.colors = {};
      tiles().forEach(function (t) {
        t.style.background = '';
        t.classList.remove('lit', 'remember');
        if (Math.random() < 0.45) paintTile(t, Math.floor(Math.random() * (PALETTE.length - 1)), true);
      });
      audio.pop();
    });
    if (b4) b4.addEventListener('click', startQuiz);
    if (b5) b5.addEventListener('click', saveArt);
    if (b6) b6.addEventListener('click', exitQuiz);
  }

  /* ======================================================================
     ห้อง 5 — เรียงเรื่องราว (ลำดับเหตุการณ์)
     ====================================================================== */
  var ST_SETS = [
    { story: ['🌱', '🪴', '🌸'], label: 'เมล็ด → ต้นกล้า → ดอกบาน', said: 'ต้นไม้โตขึ้นทีละขั้น ก่อนจะออกดอก' },
    { story: ['🥚', '🐣', '🐥'], label: 'ไข่ → ลูกไก่ฟัก → ลูกไก่', said: 'ไข่ฟักเป็นลูกไก่ก่อน แล้วจึงโตขึ้น' },
    { story: ['💧', '☁️', '🌈'], label: 'ฝนตก → เมฆ → สายรุ้ง', said: 'หลังฝนตกแดดออก ก็เกิดสายรุ้ง' },
    { story: ['📖', '😴', '🌙'], label: 'อ่านนิทาน → ง่วง → หลับ', said: 'เวลาก่อนนอน อ่านนิทานก่อน แล้วจึงหลับ' },
    { story: ['🍪', '🥛', '😋'], label: 'คุกกี้ → นม → อร่อย', said: 'ทานคุกกี้จิบนม แล้วอร่อยมาก' },
    { story: ['🚗', '🏁', '🏆'], label: 'ออกตัว → เส้นชัย → ถ้วยรางวัล', said: 'วิ่งแข่งถึงเส้นชัยก่อน แล้วจึงได้ถ้วย' }
  ];

  var stb = { slots: $('#tSlots'), cards: $('#tCards'), hint: $('#tHint'), label: $('#tCount'), btn: $('#tRestart'),
              setIdx: 0, placed: [], pool: [] };

  function startStory() {
    var set = ST_SETS[stb.setIdx];
    stb.placed = [];
    stb.pool = shuffle(set.story.slice());
    stb.slots.innerHTML = '';
    for (var i = 0; i < set.story.length; i++) {
      var s = document.createElement('div');
      s.className = 'storyslot';
      s.dataset.pos = i;
      s.textContent = '?';
      stb.slots.appendChild(s);
    }
    stb.cards.innerHTML = '';
    stb.pool.forEach(function (ic) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'storycard';
      c.textContent = ic;
      c.dataset.ic = ic;
      c.setAttribute('aria-label', 'การ์ด ' + ic);
      c.addEventListener('click', function () { pickStory(c); });
      stb.cards.appendChild(c);
    });
    if (stb.label) stb.label.textContent = 'ชุดที่ ' + (stb.setIdx + 1) + ' / ' + ST_SETS.length;
    stb.hint.textContent = 'เรื่องนี้อะไรเกิดก่อน อะไรเกิดทีหลัง? แตะการ์ดเรียงจากซ้ายไปขวา';
    stb.hint.className = 'banner';
  }

  function pickStory(card) {
    if (stb.placed.indexOf(card) !== -1) return;
    var set = ST_SETS[stb.setIdx];
    var pos = stb.placed.length;
    var slot = ui.$$('.storyslot', stb.slots)[pos];
    stb.placed.push(card);
    card.classList.add('used');
    card.disabled = true;
    slot.textContent = card.dataset.ic;
    slot.classList.add('filled');
    audio.note(SCALE[pos % SCALE.length], 0.3);

    if (stb.placed.length === set.story.length) {
      var order = stb.placed.map(function (c) { return c.dataset.ic; }).join('');
      var answer = set.story.join('');
      if (order === answer) {
        audio.win();
        finishRoom('story', (stb.setIdx + 1) * 20);
        reward(2);
        stb.hint.textContent = 'ลำดับถูกต้อง! ' + set.label + ' 🌟';
        stb.hint.className = 'banner good';
        say(set.said);
        setTimeout(function () {
          if (stb.setIdx >= ST_SETS.length - 1) {
            reward(3);
            celebrate({
              icon: '📚', title: 'เรียงเรื่องราวครบทุกชุด!',
              text: 'เข้าใจลำดับเหตุการณ์แล้ว ได้ 3 ดาวโบนัส ⭐',
              say: 'เก่งมาก เรียงเรื่องราวได้ครบทุกชุด',
              actions: [{ label: 'เล่นอีกครั้ง', cls: 'btn btn--teal', onClick: function () { stb.setIdx = 0; startStory(); } },
                        { label: 'ไปห้องแสงสี 🎨', cls: 'btn btn--ghost', onClick: function () { goTab('studio'); } }]
            });
          } else {
            stb.setIdx++;
            startStory();
          }
        }, 1100);
      } else {
        audio.oops();
        stb.hint.textContent = 'ยังไม่ใช่ลำดับนี้ ลองสลับดูใหม่นะ 🙂 คิดว่าอะไรเกิดก่อน?';
        stb.hint.className = 'banner warn';
        setTimeout(function () {
          stb.placed = [];
          ui.$$('.storyslot', stb.slots).forEach(function (s) { s.textContent = '?'; s.classList.remove('filled'); });
          ui.$$('.storycard', stb.cards).forEach(function (c) { c.classList.remove('used'); c.disabled = false; });
        }, 900);
      }
    }
  }

  if (stb.slots) {
    if (stb.btn) stb.btn.addEventListener('click', startStory);
    startStory();
  }

  /* ======================================================================
     แท็บของหน้าเล่น — คุมการสลับห้องกลางย้ายไปที่ games-lobby.js
     ไฟล์นี้เพียงลงทะเบียน callback สำหรับเรียกห้องตอนเข้า
     ====================================================================== */
  window.KN_ON_TAB = function (name) {
    if (name === 'robot' && rg.board) { renderRobotLevel(); }
    if (name === 'pattern' && pg.seq && !pg.seq.children.length) { renderPattern(); }
    if (name === 'sort' && sgb.baskets && !sgb.queue.length) { startSort(); }
    if (name === 'story' && stb.slots && !stb.slots.children.length) { startStory(); }
  };
})();
