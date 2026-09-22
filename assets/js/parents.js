/* ==========================================================================
   โค้ดน้อย (Kod Noi) — parents.js
   งานเล็ก ๆ เฉพาะหน้าผู้ปกครอง: ล้างความก้าวหน้าที่เก็บไว้ในเครื่อง
   ========================================================================== */
(function () {
  'use strict';
  var btn = document.getElementById('resetProgress');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var yes = window.confirm('ล้างดาวและสติกเกอร์ทั้งหมดของเด็กในอุปกรณ์นี้ ใช่ไหม?');
    if (!yes) return;

    try { window.localStorage.removeItem('kodnoi.v1'); } catch (e) {}

    if (window.KN && window.KN.store && window.KN.store.data) {
      window.KN.store.data.stars = 0;
      window.KN.store.data.stickers = [];
      window.KN.store.data.robotLevel = 0;
      window.KN.store.data.patternBest = 0;
      window.KN.store.data.sortBest = 0;
      window.KN.store.data.studioLoops = 0;
      window.KN.store.save();
      if (window.KN.paintHud) window.KN.paintHud();
    }

    btn.textContent = '✅ ล้างเรียบร้อยแล้ว';
    btn.disabled = true;
    if (window.KN && window.KN.ui) {
      window.KN.ui.toast('ล้างความก้าวหน้าเรียบร้อยแล้ว เริ่มนับดาวใหม่ได้เลย');
    }
  });
})();
