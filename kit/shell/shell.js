/* Оболочка превью: подключается в <head> page.html сразу после site-blocks.js.
   В архив для разработчика не попадает. */
(function () {
  // 1. Ошибки JS — чекер считает их ошибками сборки
  window.__c2lErrors = [];
  window.addEventListener('error', function (e) {
    window.__c2lErrors.push((e.message || 'error') + ' @ ' + (e.filename || '').split('/').pop() + ':' + (e.lineno || 0));
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__c2lErrors.push('unhandledrejection: ' + String(e.reason));
  });

  // 2. Снимок глобальных имён — чтобы поймать утечки из landing.js
  window.__c2lGlobals = Object.keys(window);

  document.addEventListener('DOMContentLoaded', function () {
    // 3а. Настоящие шапка и футер сайта вместо заглушек page.html
    //     (снимок в kit/site-blocks/site-blocks.js → C2L_SITE_CHROME)
    var chrome = window.C2L_SITE_CHROME;
    if (chrome) {
      [['body > header.header', chrome.header], ['body > footer.footer', chrome.footer]].forEach(function (pair) {
        var old = document.querySelector(pair[0]);
        if (!old || !pair[1]) return;
        var t = document.createElement('template');
        t.innerHTML = pair[1].trim();
        old.replaceWith(t.content.firstElementChild);
      });
    }

    // 3. Стандартные блоки сайта: <div data-c2l-site-block="callback"></div>
    //    заменяется настоящей разметкой блока (kit/site-blocks/site-blocks.js)
    var registry = window.C2L_SITE_BLOCKS || {};
    document.querySelectorAll('.wrapper__content > [data-c2l-site-block]').forEach(function (slot) {
      var name = slot.getAttribute('data-c2l-site-block');
      var def = registry[name];
      if (!def) {
        window.__c2lErrors.push('Неизвестный блок сайта: ' + name);
        slot.textContent = 'Неизвестный блок сайта: ' + name;
        return;
      }
      var tpl = document.createElement('template');
      tpl.innerHTML = def.html.trim();
      var el = tpl.content.firstElementChild;
      el.setAttribute('data-c2l-site-block', name);
      slot.replaceWith(el);
    });
  });
})();
