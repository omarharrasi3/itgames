/* ITGames_Type_Order — رتّب الخطوات */
ITG.renderers.order = function (stage, it) {
  stage.appendChild(ITG.el('div', 'q', it.q));
  var order = it.steps.map(function (t, k) { return k; });   // ترتيب الطالب الحالي (أرقام الخطوات كما وصلت)
  var list = ITG.el('div', 'steps'); stage.appendChild(list);
  var locked = false;

  function draw(marks) {
    list.innerHTML = '';
    order.forEach(function (id, pos) {
      var row = ITG.el('div', 'step' + (marks ? (marks[pos] ? ' right' : ' wrongpos') : ''));
      row.appendChild(ITG.el('span', 'n', String(pos + 1)));
      row.appendChild(ITG.el('span', 't', it.steps[id]));
      var mv = ITG.el('div', 'mv');
      var up = ITG.el('button', '', '▲'), down = ITG.el('button', '', '▼');
      up.title = 'تحريك لأعلى'; down.title = 'تحريك لأسفل';
      up.disabled = locked || pos === 0; down.disabled = locked || pos === order.length - 1;
      up.onclick = function () { swap(pos, pos - 1); };
      down.onclick = function () { swap(pos, pos + 1); };
      mv.appendChild(up); mv.appendChild(down); row.appendChild(mv);
      list.appendChild(row);
    });
  }
  function swap(a, b) { var t = order[a]; order[a] = order[b]; order[b] = t; draw(); }
  draw();

  var acts = ITG.el('div', 'actions'), chk = ITG.el('button', 'btn blue', 'تحقق ✔');
  acts.appendChild(chk); stage.appendChild(acts);
  var fbBox = ITG.el('div'); stage.appendChild(fbBox);
  chk.onclick = function () {
    chk.disabled = true; locked = true;
    ITG.check(order).then(function (res) {
      draw(res.right);
      acts.remove();
      ITG.feedback(fbBox, res.ok, res.ok ? '✔ ترتيب صحيح!' : '✘ الترتيب غير صحيح. الخطوات باللون الأحمر في غير مكانها.');
      ITG.nextButton(fbBox);
    }).catch(function () { chk.disabled = false; locked = false; draw(); });
  };
};
