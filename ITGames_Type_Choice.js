/* ITGames_Type_Choice — أسئلة الاختيار: اكتشف الخطأ، سيناريوهات الأمان الرقمي، غرفة الهروب */
ITG.renderers.mcq = function (stage, it) {
  var type = ITG.info.type, letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
  ITG.context(stage, it.context);
  stage.appendChild(ITG.el('div', 'q', it.q));
  var box = ITG.el('div', 'opts'); stage.appendChild(box);
  var btns = it.o.map(function (txt, k) {
    var b = ITG.el('button', 'opt');
    b.appendChild(ITG.el('span', 'l', letters[k] + ')'));
    b.appendChild(ITG.el('span', '', txt));
    b.onclick = function () { choose(k); };
    box.appendChild(b);
    return b;
  });
  var fbBox = ITG.el('div'); stage.appendChild(fbBox);

  function choose(k) {
    btns.forEach(function (b) { b.disabled = true; });
    ITG.check(k).then(function (res) {
      fbBox.innerHTML = '';
      if (res.ok) {
        btns[k].classList.add('correct');
        ITG.feedback(fbBox, true, res.feedback || (type === 'escape' ? '🔓 فُتح القفل!' : '✔ إجابة صحيحة!'));
        if (res.explain) ITG.feedback(fbBox, true, '💡 ' + res.explain);
        ITG.nextButton(fbBox);
      } else {
        btns[k].classList.add('wrong');
        if (type === 'escape') {
          /* في غرفة الهروب يحاول الطالب مرة أخرى حتى يفتح القفل (الدرجة للمحاولة الأولى فقط) */
          ITG.feedback(fbBox, false, '🔒 القفل لم يُفتح. حاول مرة أخرى.');
          btns.forEach(function (b, j) { if (!b.classList.contains('wrong')) b.disabled = false; else b.classList.add('dim'); });
          return;
        }
        if (res.correct !== undefined && res.correct >= 0) btns[res.correct].classList.add('correct');
        ITG.feedback(fbBox, false, res.feedback || '✘ إجابة غير صحيحة.');
        if (res.explain) ITG.feedback(fbBox, true, '💡 ' + res.explain);
        ITG.nextButton(fbBox);
      }
    }).catch(function () { btns.forEach(function (b) { b.disabled = false; }); });
  }
};
