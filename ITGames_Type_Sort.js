/* ITGames_Type_Sort — صنّف في السلال */
ITG.renderers.sort = function (stage, it) {
  stage.appendChild(ITG.el('div', 'q', it.q));
  var choice = it.cards.map(function () { return -1; });
  var box = ITG.el('div', 'cards'); stage.appendChild(box);
  var rows = it.cards.map(function (txt, k) {
    var row = ITG.el('div', 'scard');
    row.appendChild(ITG.el('div', 't', txt));
    var chips = ITG.el('div', 'chips');
    var bs = it.buckets.map(function (bname, j) {
      var c = ITG.el('button', 'chip', bname);
      c.onclick = function () {
        choice[k] = j;
        bs.forEach(function (x, m) { x.classList.toggle('on', m === j); });
        chk.disabled = choice.indexOf(-1) >= 0;
      };
      chips.appendChild(c);
      return c;
    });
    row.appendChild(chips); box.appendChild(row);
    row._chips = bs;
    return row;
  });

  var acts = ITG.el('div', 'actions'), chk = ITG.el('button', 'btn blue', 'تحقق ✔');
  chk.disabled = true;
  acts.appendChild(chk); stage.appendChild(acts);
  var fbBox = ITG.el('div'); stage.appendChild(fbBox);
  chk.onclick = function () {
    chk.disabled = true;
    rows.forEach(function (r) { r._chips.forEach(function (c) { c.disabled = true; }); });
    ITG.check(choice).then(function (res) {
      rows.forEach(function (r, k) { r.classList.add(res.right[k] ? 'right' : 'wrongb'); });
      acts.remove();
      var n = res.right.filter(function (x) { return x; }).length;
      ITG.feedback(fbBox, res.ok, res.ok ? '✔ كل البطاقات في مكانها الصحيح!' : 'صنّفت ' + n + ' من ' + it.cards.length + ' بطاقات بشكل صحيح. البطاقات باللون الأحمر في السلة الخطأ.');
      ITG.nextButton(fbBox);
    }).catch(function () {
      chk.disabled = false;
      rows.forEach(function (r) { r._chips.forEach(function (c) { c.disabled = false; }); });
    });
  };
};
