/* =====================================================================
   ITGames_Common — المحرك المشترك لكل الألعاب (عدا من سيربح المليون)
   الصفحة تستدعي:  ITG.boot('رمز اللعبة')
   ويُحمَّل معه ملف نوع اللعبة (ITGames_Type_*.js) الذي يعرّف ITG.renderers[kind]
   ===================================================================== */
var ITG = {
  renderers: {},
  info: null, token: null, items: null, i: 0, pts: 0, max: 0, timer: null, timeLeft: 0, ended: false
};

ITG.$ = function (id) { return document.getElementById(id); };
ITG.el = function (tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
ITG.toast = function (msg) {
  var t = ITG.el('div', 'toast', msg); document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 3200);
};
ITG.busy = function (on) { ITG.$('itgOverlay').classList.toggle('hidden', !on); };
ITG.show = function (id) {
  ['itgStart', 'itgPlay', 'itgEnd'].forEach(function (s) { ITG.$(s).classList.toggle('hidden', s !== id); });
  window.scrollTo(0, 0);
};
ITG.call = function () { return itgamesCall.apply(null, arguments); };
ITG.icons = { sort: '🧺', order: '🔢', spot: '🔍', scenario: '🛡️', escape: '🔐' };

/* لكل نوع لعبة واجهة مختلفة: رسمة البداية، نص زر البدء، أيقونات النهاية */
ITG.themes = {
  sort:     { hero: '<div class="hero"><span>🍎</span><span>🧺</span><span>🍊</span></div>',
              start: 'ابدأ التصنيف 🧺', top: '', end: ['🧺', '🍏', '🌱'] },
  order:    { hero: '<div class="hero"><b>1</b><i>←</i><b>2</b><i>←</i><b>3</b></div>',
              start: 'ابدأ الترتيب 📐', top: '', end: ['🏗️', '📐', '🔧'] },
  spot:     { hero: '<div class="hero"><span>🔍</span></div>',
              start: 'افتح الملف 🗂️', top: '<div class="tape"><span>⚠ تحقيق جارٍ — ابحث عن الخطأ ⚠</span></div>', end: ['🕵️', '🔎', '📁'] },
  escape:   { hero: '<div class="hero"><div class="vault"><span>🔒</span></div></div>',
              start: 'ادخل الغرفة 🚪', top: '', end: ['🏃', '🔓', '⏳'] },
  scenario: { hero: '<div class="hero"><div class="bubble b1">ماذا تفعل؟</div><div class="bubble b2">🤔</div></div>',
              start: 'ابدأ القصة 📖', top: '', end: ['🦸', '🛡️', '📚'] }
};

/* ---------- بناء الصفحة ---------- */
ITG.boot = function (gameId, type) {
  ITG.gameId = gameId;
  var th = ITG.themes[type] || { hero: '<div class="badge">🎮</div>', start: 'ابدأ ▶', top: '', end: ['🏆', '⭐', '💪'] };
  ITG.theme = th;
  document.body.className = 'theme-' + type;
  document.body.innerHTML =
    '<section id="itgStart" class="screen">' + th.top +
    '  ' + th.hero + '<h1 id="itgTitle">…</h1><p class="subtitle" id="itgSub">جارٍ التحميل…</p>' +
    '  <div class="card">' +
    '    <label for="itgName">اسمك (الاسم الأول واسم العائلة)</label>' +
    '    <input id="itgName" maxlength="60" placeholder="مثال: أحمد البلوشي" autocomplete="off">' +
    '    <div class="hint">اكتب اسمك بالطريقة نفسها في كل مرة.</div>' +
    '    <label for="itgClass">الشعبة</label><select id="itgClass"><option value="">اختر شعبتك</option></select>' +
    '    <button class="btn block" id="itgStartBtn" disabled>' + th.start + '</button>' +
    '    <div class="status" id="itgStatus"></div><div class="rules" id="itgRules"></div>' +
    '  </div></section>' +
    '<section id="itgPlay" class="screen hidden">' +
    '  <div class="topbar"><span class="pill" id="itgCounter"></span><span class="pill score" id="itgScore">0 ✔</span><span class="pill time hidden" id="itgTime"></span></div>' +
    '  <div class="progress"><div id="itgBar" style="width:0"></div></div>' +
    '  <div id="itgLocks" class="locks hidden"></div>' +
    '  <div class="card wide" id="itgStage"></div>' +
    '</section>' +
    '<section id="itgEnd" class="screen hidden">' +
    '  <div class="badge" id="itgEndIcon">🏆</div>' +
    '  <div class="card"><div class="result-msg" id="itgEndMsg"></div><div class="result-score" id="itgEndScore"></div>' +
    '  <div class="result-sub" id="itgEndSub"></div><div class="status ok" id="itgSaved"></div><div class="review" id="itgReview"></div>' +
    '  <button class="btn block" id="itgAgain">العودة إلى البداية</button></div></section>' +
    '<div id="itgOverlay" class="overlay hidden">لحظة من فضلك…</div>';

  ITG.$('itgStartBtn').onclick = ITG.start;
  ITG.$('itgName').addEventListener('keydown', function (e) { if (e.key === 'Enter') ITG.start(); });
  ITG.$('itgAgain').onclick = function () { location.reload(); };

  ITG.call('getGameInfo', gameId).then(function (info) {
    ITG.info = info;
    document.title = info.title;
    ITG.$('itgTitle').textContent = info.title;
    ITG.$('itgSub').textContent = info.subtitle;
    info.classes.forEach(function (c) { var o = ITG.el('option', '', c); o.value = c; ITG.$('itgClass').appendChild(o); });
    var r = ITG.$('itgRules');
    [info.instructions,
     'عدد الأسئلة: ' + info.count + '.',
     info.timeLimit ? 'الوقت المتاح: ' + Math.round(info.timeLimit / 60) + ' دقائق.' : '',
     'المحاولة الأولى فقط هي التي تُحتسب درجةً.'].forEach(function (t) {
      if (t) { var d = ITG.el('div', '', '• ' + t); r.appendChild(d); }
    });
    ITG.$('itgStartBtn').disabled = false;
  }).catch(function (e) { ITG.$('itgSub').textContent = ''; var s = ITG.$('itgStatus'); s.className = 'status err'; s.textContent = e.message; });
};

/* ---------- بدء اللعب ---------- */
ITG.start = function () {
  var name = ITG.$('itgName').value.replace(/\s+/g, ' ').trim(), cls = ITG.$('itgClass').value;
  if (name.split(' ').length < 2) { ITG.$('itgName').focus(); ITG.toast('اكتب اسمك الأول واسم العائلة'); return; }
  if (!cls) { ITG.$('itgClass').focus(); ITG.toast('اختر شعبتك'); return; }
  ITG.name = name;
  ITG.busy(true);
  ITG.call('startGame', ITG.gameId, name, cls).then(function (res) {
    ITG.busy(false);
    ITG.token = res.token; ITG.items = res.items; ITG.i = 0; ITG.pts = 0;
    ITG.max = res.items.reduce(function (n, it) { return n + (it.kind === 'sort' ? it.cards.length : 1); }, 0);
    if (ITG.info.type === 'escape') {
      var L = ITG.$('itgLocks'); L.classList.remove('hidden'); L.innerHTML = '';
      res.items.forEach(function (x, k) { var s = ITG.el('span', 'lock', '🔒'); s.id = 'itgLock' + k; L.appendChild(s); });
    }
    if (ITG.info.timeLimit) ITG.startTimer(ITG.info.timeLimit);
    ITG.show('itgPlay');
    ITG.render();
  }).catch(function (e) { ITG.busy(false); ITG.toast(e.message); });
};

ITG.startTimer = function (sec) {
  ITG.timeLeft = sec;
  var t = ITG.$('itgTime'); t.classList.remove('hidden');
  var draw = function () {
    var m = Math.floor(ITG.timeLeft / 60), s = ITG.timeLeft % 60;
    t.textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
    t.classList.toggle('danger', ITG.timeLeft <= 60);
  };
  draw();
  ITG.timer = setInterval(function () {
    ITG.timeLeft--; draw();
    if (ITG.timeLeft <= 0) { clearInterval(ITG.timer); ITG.toast('⏰ انتهى الوقت!'); ITG.finish(); }
  }, 1000);
};

ITG.render = function () {
  var it = ITG.items[ITG.i];
  ITG.$('itgCounter').textContent = 'السؤال ' + (ITG.i + 1) + ' من ' + ITG.items.length;
  ITG.$('itgBar').style.width = (ITG.i * 100 / ITG.items.length) + '%';
  ITG.$('itgScore').textContent = ITG.pts + ' / ' + ITG.max + ' ✔';
  if (ITG.info.type === 'escape') {
    ITG.items.forEach(function (x, k) { var l = ITG.$('itgLock' + k); l.classList.toggle('cur', k === ITG.i); });
  }
  var stage = ITG.$('itgStage'); stage.innerHTML = '';
  ITG.renderers[it.kind](stage, it, ITG.i);
};

/* يرسل إجابة العنصر الحالي إلى الخادم */
ITG.check = function (answer) {
  ITG.busy(true);
  return ITG.call('checkItem', ITG.token, ITG.i, answer).then(function (res) {
    ITG.busy(false);
    if (res.counted !== undefined && !ITG['done' + ITG.i]) { ITG['done' + ITG.i] = true; ITG.pts += res.counted; }
    ITG.$('itgScore').textContent = ITG.pts + ' / ' + ITG.max + ' ✔';
    return res;
  }).catch(function (e) { ITG.busy(false); ITG.toast(e.message); throw e; });
};

/* زر التالي / الإنهاء */
ITG.nextButton = function (stage) {
  var last = ITG.i === ITG.items.length - 1;
  var b = ITG.el('button', 'btn', last ? 'إنهاء وعرض النتيجة 🏁' : 'التالي ◀');
  b.onclick = function () {
    if (ITG.info.type === 'escape') ITG.$('itgLock' + ITG.i).textContent = '🔓', ITG.$('itgLock' + ITG.i).classList.add('open');
    if (last) ITG.finish(); else { ITG.i++; ITG.render(); }
  };
  var a = ITG.el('div', 'actions'); a.appendChild(b); stage.appendChild(a);
  b.focus();
};

ITG.feedback = function (stage, ok, text) {
  var f = ITG.el('div', 'feedback ' + (ok ? 'ok' : 'bad'), text);
  stage.appendChild(f);
};

/* ---------- النهاية ---------- */
ITG.finish = function () {
  if (ITG.ended) return;
  ITG.ended = true;
  if (ITG.timer) clearInterval(ITG.timer);
  ITG.busy(true);
  ITG.call('finishGame', ITG.token).then(function (res) {
    ITG.busy(false);
    var pct = res.total ? res.correct / res.total : 0;
    ITG.$('itgEndIcon').textContent = ITG.theme.end[pct >= 0.9 ? 0 : pct >= 0.6 ? 1 : 2];
    ITG.$('itgEndMsg').textContent = ITG.name + ' — ' + (pct >= 0.9 ? 'أداء ممتاز!' : pct >= 0.6 ? 'أحسنت!' : 'راجع الدرس جيدًا وحاول مرة أخرى');
    ITG.$('itgEndScore').textContent = res.correct + ' / ' + res.total;
    ITG.$('itgEndSub').textContent = res.counts ? 'هذه محاولتك الأولى، وهي التي تُحتسب درجةً.'
      : 'هذه محاولتك رقم ' + res.attempt + ' (للتدريب فقط؛ الدرجة المعتمدة هي المحاولة الأولى).';
    ITG.$('itgSaved').textContent = '✅ تم حفظ نتيجتك.';
    var rv = ITG.$('itgReview'); rv.innerHTML = '';
    (res.review || []).forEach(function (x, k) { rv.appendChild(ITG.el('div', x.ok ? 'g' : 'r', (x.ok ? '✔ ' : '✘ ') + (k + 1) + '. ' + x.q)); });
    rv.classList.toggle('hidden', !(res.review || []).length);
    ITG.show('itgEnd');
    if (pct >= 0.9) ITG.confetti();
  }).catch(function (e) { ITG.busy(false); ITG.ended = false; ITG.toast('تعذّر حفظ النتيجة: ' + e.message + ' — حاول مرة أخرى.'); });
};

ITG.confetti = function () {
  var colors = ['#ffc832', '#ff6b6b', '#43d17f', '#4fc3f7', '#ffffff', '#ba68c8'];
  for (var i = 0; i < 110; i++) {
    var c = ITG.el('div', 'confetti');
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = (2.5 + Math.random() * 2.5) + 's'; c.style.animationDelay = Math.random() * 1.5 + 's';
    document.body.appendChild(c);
    (function (el) { setTimeout(function () { el.remove(); }, 7000); })(c);
  }
};

/* سياق السؤال: نص أو قائمة سطور مرقمة */
ITG.context = function (stage, ctx) {
  if (!ctx || (Array.isArray(ctx) && !ctx.length)) return;
  var box = ITG.el('div', 'context');
  if (Array.isArray(ctx) && ctx.length > 1) {
    var ol = ITG.el('ol');
    ctx.forEach(function (line) { ol.appendChild(ITG.el('li', '', line)); });
    box.appendChild(ol);
  } else {
    box.appendChild(ITG.el('p', '', Array.isArray(ctx) ? ctx[0] : ctx));
  }
  stage.appendChild(box);
};
