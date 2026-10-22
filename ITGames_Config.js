/* =====================================================================
   ITGames_Config — إعداد مشترك لكل مواقع الألعاب ولوحة المعلم
   ضع هنا رابط Web app من Google Apps Script (ينتهي بـ /exec).
   هذا هو الملف الوحيد الذي تحتاج إلى تعديله في موقع GitHub.
   ===================================================================== */
var ITGAMES_API_URL = 'https://script.google.com/macros/s/AKfycbxO2gegIw5g3L2gOBGOdnT-6JZT1mU3XX-fw6Ph3_EMabi_YGExcsjoFsrY_yk9Hs1I/exec';

/* يستدعي دالة في خادم النتائج ويعيد النتيجة (وعد) */
function itgamesCall(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  var mock = window.ITGAMES_MOCK;
  try { if (!mock && window.parent !== window) mock = window.parent.ITGAMES_MOCK; } catch (e) {}
  if (mock) return mock(fn, args);
  if (!/^https:\/\/script\.google\.com\//.test(ITGAMES_API_URL)) {
    return Promise.reject(new Error('لم يُضبط رابط الخادم بعد في الملف ITGames_Config.js'));
  }
  return fetch(ITGAMES_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn: fn, args: args })
  }).then(function (r) { return r.json(); }, function () {
    throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى.');
  }).then(function (d) {
    if (!d || !d.ok) throw new Error((d && d.error) || 'حدث خطأ في الخادم.');
    return d.result;
  });
}
