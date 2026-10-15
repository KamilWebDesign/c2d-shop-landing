/* Chat2Desk для интернет-магазинов — скрипты блоков. Каждый блок — отдельный IIFE, без глобальных имён.
   Из каталога (catalog/src/base.js): ленты, вкладки, появление при прокрутке, бегунок вкладок, живые сюжеты;
   витрина категорий (rail-cards.js); переключатель периода тарифов (pricing.js).
   Повторная инициализация исключена: корень отмечается data-c2l-ready. */

/* Вкладки: [data-c2l-tabs] > [role=tablist] > [role=tab][aria-controls] и [role=tabpanel].
   Стрелки, Home/End; автоматическая активация. */
(() => {
  "use strict";
  document.querySelectorAll("[data-c2l-tabs]").forEach((c2lRoot) => {
    if (c2lRoot.hasAttribute("data-c2l-ready")) return;
    c2lRoot.setAttribute("data-c2l-ready", "");
    const c2lTabs = [...c2lRoot.querySelectorAll('[role="tab"]')];
    if (!c2lTabs.length) return;
    const c2lVertical = c2lRoot.querySelector('[role="tablist"]')?.getAttribute("aria-orientation") === "vertical";
    const c2lSelect = (c2lTab, c2lFocus) => {
      c2lTabs.forEach((c2lItem) => {
        const c2lOn = c2lItem === c2lTab;
        c2lItem.setAttribute("aria-selected", String(c2lOn));
        c2lItem.tabIndex = c2lOn ? 0 : -1;
        const c2lPanel = document.getElementById(c2lItem.getAttribute("aria-controls"));
        if (c2lPanel) c2lPanel.hidden = !c2lOn;
      });
      c2lRoot.dataset.c2lActive = String(c2lTabs.indexOf(c2lTab));
      if (c2lFocus) c2lTab.focus();
    };
    c2lTabs.forEach((c2lTab, c2lIndex) => {
      c2lTab.addEventListener("click", () => c2lSelect(c2lTab, false));
      c2lTab.addEventListener("keydown", (c2lEvent) => {
        const c2lNext = c2lVertical ? "ArrowDown" : "ArrowRight";
        const c2lPrev = c2lVertical ? "ArrowUp" : "ArrowLeft";
        let c2lTarget = null;
        if (c2lEvent.key === c2lNext) c2lTarget = c2lTabs[(c2lIndex + 1) % c2lTabs.length];
        if (c2lEvent.key === c2lPrev) c2lTarget = c2lTabs[(c2lIndex - 1 + c2lTabs.length) % c2lTabs.length];
        if (c2lEvent.key === "Home") c2lTarget = c2lTabs[0];
        if (c2lEvent.key === "End") c2lTarget = c2lTabs[c2lTabs.length - 1];
        if (c2lTarget) {
          c2lEvent.preventDefault();
          c2lSelect(c2lTarget, true);
        }
      });
    });
    c2lSelect(c2lTabs.find((c2lTab) => c2lTab.getAttribute("aria-selected") === "true") || c2lTabs[0], false);
  });
})();

/* Движение (G5). Блок появляется при прокрутке: его части — с короткой задержкой друг за другом.
   Без JS и при prefers-reduced-motion всё видно сразу: скрытое состояние ставит только этот скрипт. */
(() => {
  "use strict";
  const c2lReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (c2lReduce.matches || !("IntersectionObserver" in window)) return;
  const c2lGroups = '[class*="__grid"], [class*="__list"], [class*="__cells"], [class*="__cards"], [class*="__theses"], [class*="__scenes"], [class*="__rows"], [class*="__points"], [class*="__steps"], [class*="__facts"], [class*="__metrics"], [class*="__group"]';
  const c2lStep = 70;
  const c2lMaxDelay = 560;
  const c2lBlocks = [...document.querySelectorAll(".c2l")].filter((c2lBlock) => !c2lBlock.hasAttribute("data-c2l-ready"));
  c2lBlocks.forEach((c2lBlock) => c2lBlock.setAttribute("data-c2l-ready", ""));
  c2lBlocks.forEach((c2lBlock) => {
    let c2lOrder = 0;
    const c2lMark = (c2lEl, c2lDelay) => {
      c2lEl.classList.add("c2l-u");
      c2lEl.style.setProperty("--c2l-d", String(Math.min(c2lDelay, c2lMaxDelay)));
    };
    const c2lWalk = (c2lParent) => {
      [...c2lParent.children].forEach((c2lChild) => {
        if (c2lChild.hidden || c2lChild.matches("script, style, template")) return;
        // Группа карточек раскрывается поштучно; остальное — целиком
        if (c2lChild.matches(c2lGroups) && c2lChild.children.length > 1 && c2lChild.children.length <= 12 && !c2lChild.matches('[role="tablist"]')) {
          [...c2lChild.children].forEach((c2lItem) => c2lMark(c2lItem, c2lOrder++ * c2lStep));
        } else if (c2lChild.children.length && !c2lChild.matches(".c2l-slot, [role='tabpanel'], form, button, a, h1, h2, h3, p, dl, svg") && c2lChild.querySelector(c2lGroups)) {
          c2lWalk(c2lChild);
        } else {
          c2lMark(c2lChild, c2lOrder++ * c2lStep);
        }
      });
    };
    c2lWalk(c2lBlock);
    c2lBlock.classList.add("c2l-anim");
  });
  const c2lObserver = new IntersectionObserver((c2lEntries) => {
    c2lEntries.forEach((c2lEntry) => {
      if (!c2lEntry.isIntersecting) return;
      c2lEntry.target.classList.add("c2l-is-in");
      c2lObserver.unobserve(c2lEntry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
  c2lBlocks.forEach((c2lBlock) => c2lObserver.observe(c2lBlock));
  // Печать и якорные переходы: ничего не остаётся скрытым
  window.addEventListener("beforeprint", () => c2lBlocks.forEach((c2lBlock) => c2lBlock.classList.add("c2l-is-in")));
})();

/* Бегунок вкладок (G5): подложка выбранной вкладки переезжает к новой, а не мигает.
   Работает для горизонтальных групп; вертикальные шаги и группы с data-c2l-noink отмечают выбор своей линией. */
(() => {
  "use strict";
  document.querySelectorAll('[data-c2l-tabs] [role="tablist"]:not([aria-orientation="vertical"]):not([data-c2l-noink])').forEach((c2lList) => {
    if (c2lList.hasAttribute("data-c2l-ready")) return;
    c2lList.setAttribute("data-c2l-ready", "");
    const c2lInk = document.createElement("span");
    c2lInk.className = "c2l-tab-ink";
    c2lInk.setAttribute("aria-hidden", "true");
    c2lList.prepend(c2lInk);
    c2lList.classList.add("c2l-has-ink");
    const c2lPlace = () => {
      const c2lTab = c2lList.querySelector('[role="tab"][aria-selected="true"]');
      if (!c2lTab) return;
      c2lInk.style.inlineSize = `${c2lTab.offsetWidth}px`;
      c2lInk.style.blockSize = `${c2lTab.offsetHeight}px`;
      c2lInk.style.transform = `translate(${c2lTab.offsetLeft}px, ${c2lTab.offsetTop}px)`;
    };
    c2lPlace();
    new MutationObserver(c2lPlace).observe(c2lList, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });
    if ("ResizeObserver" in window) new ResizeObserver(c2lPlace).observe(c2lList);
    document.fonts?.ready.then(c2lPlace);
  });
})();

/* Живая переписка и сюжеты: [data-c2l-play] > [data-c2l-beat]. Реплики появляются по очереди,
   когда сцена видна; перед [data-c2l-type] — «печатает…». Один проход, без повтора.
   Волна 2 (2026-10-06): так же по очереди появляются строки списков, карточки и узлы схем
   (data-c2l-beat="fade" — место занято заранее, раскладка не прыгает; шаг — data-c2l-step).
   Во вкладке сюжет играет заново при каждом открытии панели. Без JS и при reduced motion —
   конечное состояние: скрытое ставит только этот скрипт (.c2l-play-ready). */
(() => {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  document.querySelectorAll("[data-c2l-play]").forEach((c2lRoot) => {
    if (c2lRoot.hasAttribute("data-c2l-ready")) return;
    c2lRoot.setAttribute("data-c2l-ready", "");
    // Порядок — по документу; data-c2l-order переставляет шаг (например, новое обращение сверху списка — в конце сюжета)
    const c2lBeats = [...c2lRoot.querySelectorAll("[data-c2l-beat]")]
      .map((c2lBeat, c2lIndex) => [c2lBeat, Number(c2lBeat.dataset.c2lOrder ?? c2lIndex)])
      .sort((c2lA, c2lB) => c2lA[1] - c2lB[1])
      .map(([c2lBeat]) => c2lBeat);
    if (!c2lBeats.length) return;
    c2lRoot.classList.add("c2l-play-ready");
    const c2lTyping = document.createElement("div");
    c2lTyping.innerHTML = "<i></i><i></i><i></i>";
    let c2lTimer = 0, c2lRun = 0, c2lSeen = false;
    const c2lReset = () => {
      clearTimeout(c2lTimer);
      c2lRun += 1;
      c2lTyping.remove();
      c2lRoot.classList.remove("c2l-play-done");
      c2lBeats.forEach((c2lBeat) => c2lBeat.classList.remove("c2l-on"));
    };
    const c2lPlay = () => {
      c2lReset();
      const c2lMine = c2lRun;
      let c2lIndex = 0;
      const c2lNext = () => {
        if (c2lMine !== c2lRun) return;
        if (c2lIndex >= c2lBeats.length) { c2lRoot.classList.add("c2l-play-done"); return; }
        const c2lBeat = c2lBeats[c2lIndex];
        // Шаг по умолчанию: реплики — 900 мс; строки, карточки и узлы схем — data-c2l-step у корня
        const c2lWait = Number(c2lBeat.dataset.c2lWait) || (c2lIndex ? Number(c2lRoot.dataset.c2lStep) || 900 : 350);
        c2lIndex += 1;
        c2lTimer = setTimeout(() => {
          if (c2lMine !== c2lRun) return;
          if (c2lBeat.hasAttribute("data-c2l-type")) {
            const c2lOut = c2lBeat.matches(".c2l-msgr__msg--out, .c2l-msgr__group--out");
            c2lTyping.className = `c2l-msgr__msg c2l-msgr__msg--${c2lOut ? "out" : "in"} c2l-msgr__typing`;
            c2lBeat.before(c2lTyping);
            c2lTimer = setTimeout(() => {
              if (c2lMine !== c2lRun) return;
              c2lTyping.remove();
              c2lBeat.classList.add("c2l-on");
              c2lNext();
            }, 1100);
          } else {
            c2lBeat.classList.add("c2l-on");
            c2lNext();
          }
        }, c2lWait);
      };
      c2lNext();
    };
    const c2lPanel = c2lRoot.closest('[role="tabpanel"]');
    const c2lVisible = () => !c2lPanel || !c2lPanel.hidden;
    new IntersectionObserver((c2lEntries, c2lObs) => {
      if (!c2lEntries.some((c2lEntry) => c2lEntry.isIntersecting)) return;
      c2lSeen = true;
      c2lObs.disconnect();
      if (c2lVisible()) c2lPlay();
    }, { threshold: c2lPanel ? 0.15 : 0.3 }).observe(c2lPanel ? (c2lRoot.closest(".c2l") || c2lPanel) : c2lRoot);
    if (c2lPanel) {
      new MutationObserver(() => {
        if (!c2lSeen) return;
        if (c2lVisible()) c2lPlay(); else c2lReset();
      }).observe(c2lPanel, { attributes: true, attributeFilter: ["hidden"] });
    }
  });
})();

/* Витрина категорий: стрелки листают ряд карточек на одну карточку. */
(() => {
  "use strict";
  document.querySelectorAll("[data-c2l-rail]").forEach((c2lRoot) => {
    if (c2lRoot.hasAttribute("data-c2l-ready")) return;
    c2lRoot.setAttribute("data-c2l-ready", "");
    const c2lTrack = c2lRoot.querySelector(".c2l-rail-cards__track");
    const c2lPrev = c2lRoot.querySelector("[data-c2l-rail-prev]");
    const c2lNext = c2lRoot.querySelector("[data-c2l-rail-next]");
    if (!c2lTrack || !c2lPrev || !c2lNext) return;
    const c2lStep = () => {
      const c2lCard = c2lTrack.querySelector("li");
      const c2lGap = parseFloat(getComputedStyle(c2lTrack).columnGap) || 0;
      return c2lCard ? c2lCard.offsetWidth + c2lGap : c2lTrack.clientWidth;
    };
    const c2lUpdate = () => {
      const c2lMax = c2lTrack.scrollWidth - c2lTrack.clientWidth - 2;
      c2lPrev.disabled = c2lTrack.scrollLeft <= 2;
      c2lNext.disabled = c2lTrack.scrollLeft >= c2lMax;
    };
    c2lPrev.addEventListener("click", () => c2lTrack.scrollBy({ left: -c2lStep() }));
    c2lNext.addEventListener("click", () => c2lTrack.scrollBy({ left: c2lStep() }));
    c2lTrack.addEventListener("scroll", c2lUpdate, { passive: true });
    window.addEventListener("resize", c2lUpdate);
    c2lUpdate();
  });
})();

/* Тарифы: переключатель периода оплаты [data-c2l-pricing] — как на chat2desk.com/tarifi.
   Скидка периода (data-c2l-discount) пересчитывает цены [data-c2l-price], подпись периода и data-c2l-period кнопок.
   Радиогруппа: стрелки, Home/End, выбор сразу при переходе. */
(() => {
  "use strict";
  const c2lMoney = (c2lValue) => String(c2lValue).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const c2lWord = (c2lMonths) => (c2lMonths === 1 ? "месяц" : c2lMonths < 5 ? "месяца" : "месяцев");
  document.querySelectorAll("[data-c2l-pricing]").forEach((c2lRoot) => {
    if (c2lRoot.hasAttribute("data-c2l-ready")) return;
    c2lRoot.setAttribute("data-c2l-ready", "");
    const c2lOpts = [...c2lRoot.querySelectorAll("[data-c2l-months]")];
    const c2lSave = c2lRoot.querySelector("[data-c2l-save]");
    if (!c2lOpts.length) return;
    const c2lSelect = (c2lOpt, c2lFocus) => {
      const c2lMonths = Number(c2lOpt.dataset.c2lMonths);
      const c2lDiscount = Number(c2lOpt.dataset.c2lDiscount);
      c2lOpts.forEach((c2lItem) => {
        const c2lOn = c2lItem === c2lOpt;
        c2lItem.setAttribute("aria-checked", String(c2lOn));
        c2lItem.tabIndex = c2lOn ? 0 : -1;
      });
      if (c2lFocus) c2lOpt.focus();
      c2lRoot.querySelectorAll("[data-c2l-price]").forEach((c2lPrice) => {
        const c2lBase = Number(c2lPrice.dataset.c2lPrice);
        c2lPrice.textContent = c2lMoney(Math.round((c2lBase * (100 - c2lDiscount)) / 100));
      });
      c2lRoot.querySelectorAll("[data-c2l-old]").forEach((c2lOld) => { c2lOld.hidden = !c2lDiscount; });
      c2lRoot.querySelectorAll("[data-c2l-bill]").forEach((c2lBill) => {
        c2lBill.textContent = "При оплате за " + c2lMonths + " " + c2lWord(c2lMonths);
      });
      c2lRoot.querySelectorAll("[data-c2l-tariff]").forEach((c2lBtn) => { c2lBtn.dataset.c2lPeriod = String(c2lMonths); });
      if (c2lSave) c2lSave.textContent = c2lDiscount ? "Скидка " + c2lDiscount + "%" : "Без скидки";
    };
    c2lOpts.forEach((c2lOpt, c2lIndex) => {
      c2lOpt.addEventListener("click", () => c2lSelect(c2lOpt, false));
      c2lOpt.addEventListener("keydown", (c2lEvent) => {
        const c2lLast = c2lOpts.length - 1;
        const c2lNext = { ArrowRight: c2lIndex + 1, ArrowDown: c2lIndex + 1, ArrowLeft: c2lIndex - 1, ArrowUp: c2lIndex - 1, Home: 0, End: c2lLast }[c2lEvent.key];
        if (c2lNext === undefined) return;
        c2lEvent.preventDefault();
        c2lSelect(c2lOpts[(c2lNext + c2lOpts.length) % c2lOpts.length], true);
      });
    });
  });
})();
