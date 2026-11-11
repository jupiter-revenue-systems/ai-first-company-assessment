/*
 * AI-First Company Assessment
 * Vanilla JavaScript, no dependencies. Renders into <main id="app">.
 * Data: window.AIFA_DATA (from src/data.js, generated from assessment.json).
 * MIT License. Jupiter Revenue Systems, https://ekaistone.com
 */
(function () {
  "use strict";

  var D = window.AIFA_DATA;
  var app = document.getElementById("app");
  var STORE = "aifa-v2";
  var FULL_REPORT = "https://ekaistone.com/ai-first-assessment?utm_source=github&utm_medium=assessment";
  var state = load() || { type: "", answers: [], step: 0 };

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || "null");
      return s && typeof s.step === "number" ? s : null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (e) {
      /* storage blocked: the assessment still works */
    }
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function type() {
    for (var i = 0; i < D.types.length; i++) if (D.types[i].key === state.type) return D.types[i];
    return null;
  }
  function pillarName(key) {
    for (var i = 0; i < D.pillars.length; i++) if (D.pillars[i].key === key) return D.pillars[i].name;
    return key;
  }

  /* Score: each question is 0 to 3. Pillars are summed, the total is a percentage, and the lowest pillar is where to start. */
  function score(t, answers) {
    var per = {};
    D.pillars.forEach(function (p) {
      per[p.key] = { got: 0, max: 0 };
    });
    t.questions.forEach(function (q, i) {
      per[q.pillar].max += 3;
      per[q.pillar].got += answers[i] || 0;
    });
    var got = 0, max = 0;
    var pillars = D.pillars.map(function (p) {
      got += per[p.key].got;
      max += per[p.key].max;
      return { key: p.key, name: p.name, got: per[p.key].got, max: per[p.key].max, pct: per[p.key].max ? per[p.key].got / per[p.key].max : 0 };
    });
    var pct = max ? Math.round((got / max) * 100) : 0;
    var band = D.bands.filter(function (b) {
      return pct >= b[0] && pct <= b[1];
    })[0] || D.bands[0];
    var low = pillars.slice().sort(function (a, b) {
      return a.pct - b.pct;
    })[0];
    return { pct: pct, band: band, pillars: pillars, low: low };
  }

  function go(step) {
    state.step = step;
    save();
    render();
    var top = document.getElementById("top");
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: "smooth" });
  }

  function progress(t) {
    var n = t.questions.length;
    var at = Math.min(state.step, n);
    return (
      '<div class="prog"><div class="prog-top"><span>' + esc(t.label) + "</span><span>" +
      (state.step <= n ? "Question " + at + " of " + n : "Done") +
      '</span></div><i><s style="width:' + (Math.min(state.step - 1, n) / n) * 100 + '%"></s></i></div>'
    );
  }

  function viewPick() {
    return (
      '<section class="card"><p class="k">Step 1 · What do you run?</p><p class="q">Pick the one closest to your business. Your questions are written for it.</p><div class="types">' +
      D.types
        .map(function (t, i) {
          return '<button type="button" class="type" data-type="' + t.key + '"><span class="idx">0' + (i + 1) + '</span><span class="tt">' + esc(t.label) + '</span><span class="td">' + esc(t.sub) + "</span></button>";
        })
        .join("") +
      '</div><ul class="scale">' +
      D.scale
        .map(function (s) {
          return "<li><b>" + s[0] + "</b>" + esc(s[2]) + "</li>";
        })
        .join("") +
      "</ul></section>"
    );
  }

  function viewQuestion(t) {
    var i = state.step - 1;
    var q = t.questions[i];
    return (
      progress(t) +
      '<section class="card"><p class="k">' + esc(pillarName(q.pillar)) + '</p><p class="q big">' + esc(q.text) + '</p><div class="opts" role="group" aria-label="Your answer">' +
      D.scale
        .map(function (s) {
          return '<button type="button" data-score="' + s[0] + '" aria-pressed="' + (state.answers[i] === s[0]) + '"><b>' + s[0] + "</b><span>" + esc(s[1]) + "</span><small>" + esc(s[2]) + "</small></button>";
        })
        .join("") +
      '</div><div class="nav"><button type="button" class="link" data-go="' + (state.step - 1) + '">Back</button>' +
      (state.answers[i] !== undefined ? '<button type="button" class="link" data-go="' + (state.step + 1) + '">Next</button>' : "") +
      "</div></section>"
    );
  }

  function viewResult(t) {
    var r = score(t, state.answers);
    var next = D.next[r.low.key];
    var text = "My AI-First Company score: " + r.pct + "% (" + r.band[2] + "). Lowest pillar: " + r.low.name + ". Take it free: https://jupiter-revenue-systems.github.io/ai-first-company-assessment/";
    return (
      '<section class="card result"><p class="k lime">Your AI-First score · ' + esc(t.label) + '</p><div class="score"><b>' + r.pct + '%</b><div><span class="band">' + esc(r.band[2]) + '</span><span class="band-d">' + esc(r.band[3]) + '</span></div></div><div class="bars">' +
      r.pillars
        .map(function (p) {
          return '<div class="' + (p.key === r.low.key ? "low" : "") + '"><span>' + esc(p.name) + '</span><i><s style="width:' + Math.round(p.pct * 100) + '%"></s></i><em>' + p.got + "/" + p.max + "</em></div>";
        })
        .join("") +
      '</div><div class="next"><p class="k or">Start here · ' + esc(r.low.name) + '</p><p class="next-t">' + esc(D.why[r.low.key]) + "</p>" +
      '<div class="ctas"><a class="btn" href="' + FULL_REPORT + '">Email me the full report</a><a class="link" href="https://ekaistone.com' + next[1] + '?utm_source=github&utm_medium=assessment">See ' + esc(next[0]) + "</a></div></div>" +
      '<div class="acts"><button type="button" class="ghost" id="copy" data-text="' + esc(text) + '">Copy my score</button><button type="button" class="ghost" data-go="0" data-reset="1">Start over</button></div></section>'
    );
  }

  function render() {
    var t = type();
    if (!t || state.step === 0) app.innerHTML = viewPick();
    else if (state.step <= t.questions.length) app.innerHTML = viewQuestion(t);
    else app.innerHTML = viewResult(t);
  }

  app.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.type) {
      state = { type: b.dataset.type, answers: [], step: 1 };
      return go(1);
    }
    if (b.dataset.score !== undefined) {
      var t = type();
      state.answers[state.step - 1] = Number(b.dataset.score);
      save();
      render();
      return setTimeout(function () {
        go(state.step + 1 <= t.questions.length ? state.step + 1 : t.questions.length + 1);
      }, 200);
    }
    if (b.dataset.reset) {
      state = { type: "", answers: [], step: 0 };
      return go(0);
    }
    if (b.dataset.go !== undefined) return go(Number(b.dataset.go));
    if (b.id === "copy" && navigator.clipboard) {
      navigator.clipboard.writeText(b.dataset.text).then(function () {
        b.textContent = "Copied";
      });
    }
  });

  render();
})();
