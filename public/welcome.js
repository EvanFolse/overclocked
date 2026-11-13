// Welcome screen: top-to-bottom reveal (chip -> title -> subtitle -> steps 1-4 -> info -> START)
// + twinkling canvas star field + breathing chip.
(function () {
  if (document.getElementById("welcome")) { return; }
  var css = `
  #welcome{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;color:#eaf0ff;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    background:radial-gradient(900px 600px at 50% 30%,#14307a 0%,#0a1840 55%,#050b22 100%);transition:opacity .5s}
  #welcome.out{opacity:0;pointer-events:none}
  #wStars{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
  #welcome > *:not(#wStars){position:relative;z-index:1}
  #welcome > .w-hint{margin-top:48px;font-size:16px;letter-spacing:1px;color:#8aa2e6}

  .rv{opacity:0;transform:translateY(18px);transition:opacity .7s ease-out,transform .7s ease-out}
  .rv.show{opacity:1;transform:none}
  #welcome.skip .rv{transition:none}

  .w-chip{width:96px;height:96px;border-radius:22px;background:#0f2a66;border:2px solid #2d5fc4;display:flex;align-items:center;justify-content:center;animation:wChip 2.8s ease-in-out infinite}
  .w-chip.rv{transform:scale(.6)}
  .w-chip.rv.show{transform:none}
  .w-chip i{width:52px;height:52px;border-radius:12px;background:#e4f6ff;animation:wCore 2.8s ease-in-out infinite}
  @keyframes wChip{0%,100%{box-shadow:0 0 60px rgba(92,200,255,.6);border-color:#4a86f0}50%{box-shadow:0 0 14px rgba(92,200,255,.12);border-color:#1f3f8a}}
  @keyframes wCore{0%,100%{opacity:1;background:#e4f6ff;box-shadow:0 0 34px 8px #9fe0ff}50%{opacity:.5;background:#7fb0d8;box-shadow:0 0 6px 1px #4b86b8}}
  .w-chip::before,.w-chip::after{content:'';position:absolute;pointer-events:none}
  .w-chip::before{inset:14px -9px;background:repeating-linear-gradient(to bottom,#2f78c0 0 6px,transparent 6px 14px);-webkit-mask:linear-gradient(to right,#000 0 9px,transparent 9px calc(100% - 9px),#000 calc(100% - 9px));mask:linear-gradient(to right,#000 0 9px,transparent 9px calc(100% - 9px),#000 calc(100% - 9px))}
  .w-chip::after{inset:-9px 14px;background:repeating-linear-gradient(to right,#2f78c0 0 6px,transparent 6px 14px);-webkit-mask:linear-gradient(to bottom,#000 0 9px,transparent 9px calc(100% - 9px),#000 calc(100% - 9px));mask:linear-gradient(to bottom,#000 0 9px,transparent 9px calc(100% - 9px),#000 calc(100% - 9px))}

  #welcome h1{margin:10px 0 0;font-size:clamp(34px,6vw,64px);letter-spacing:6px;font-weight:800;font-family:ui-monospace,Menlo,monospace}
  #welcome .w-sub{margin:0;font-size:clamp(16px,2.2vw,22px);color:#5cc8ff}
  .w-steps{display:flex;align-items:stretch;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px;max-width:1000px}
  .w-step{width:190px;text-align:left;padding:14px;border-radius:16px;border:2px solid var(--c);background:rgba(255,255,255,.05)}
  .w-step.show{box-shadow:0 0 22px -4px var(--c)}
  .w-step b{display:inline-block;min-width:26px;text-align:center;padding:2px 8px;border-radius:999px;background:var(--c);color:#0a1840;font:800 12px ui-monospace,Menlo,monospace;letter-spacing:2px}
  .w-step p{margin:10px 0 0;font-size:14px;line-height:1.45;color:#d6e2ff}
  .w-arrow{align-self:center;font-size:22px;color:#6f86c9}
  .w-meta{margin:20px 0 0;font:800 clamp(16px,2vw,22px) ui-monospace,Menlo,monospace;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(90deg,#5cc8ff,#a98bff,#5fe0a5);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 10px rgba(92,200,255,.45))}
  .w-meta2{margin:0;font-size:14px;color:#5fe0a5}
  #wStart{margin-top:24px;padding:14px 38px;border:0;border-radius:999px;font:800 18px ui-sans-serif,system-ui;cursor:pointer;color:#fff;
    background:linear-gradient(135deg,#22b585,#1a8f6a);box-shadow:0 8px 26px rgba(31,157,115,.45)}
  #wStart.show{animation:wPulse 1.6s ease-in-out infinite}
  @keyframes wPulse{50%{box-shadow:0 8px 42px rgba(60,230,160,.85)}}
  @media (prefers-reduced-motion:reduce){.w-chip,.w-chip i,#wStart.show{animation:none!important}}
  body.reduce .w-chip,body.reduce .w-chip i,body.reduce #wStart.show{animation:none!important}
  `;

  var steps = [
    ["1", "PLAY",    "#5cc8ff", "Beat a short minigame for each part."],
    ["2", "BUILD",   "#a98bff", "Earn a star and the part rises onto your chip."],
    ["3", "UPGRADE", "#5fe0a5", "Spend CP to level it up, from 4-bit to 64-bit."],
    ["4", "LEARN",   "#ffc83d", "Each round ends with one line on why it works."]
  ];

  // data-t = when (ms after load) each piece appears
  var h = '<canvas id="wStars"></canvas>';
  h += '<div class="w-chip rv" data-t="300"><i></i></div>';
  h += '<h1 class="rv" data-t="1300">OVERCLOCKED</h1>';
  h += '<p class="w-sub rv" data-t="2100">Build a CPU from bare silicon.</p>';
  h += '<div class="w-steps">';
  steps.forEach(function (s, i) {
    var t = 3100 + i * 900;
    if (i > 0) { h += '<div class="w-arrow rv" data-t="' + (t - 250) + '">›</div>'; }
    h += '<div class="w-step rv" data-t="' + t + '" style="--c:' + s[2] + '"><b>' + s[0] + ' ' + s[1] + '</b><p>' + s[3] + '</p></div>';
  });
  h += '</div>';
  h += '<p class="w-meta rv" data-t="6800">5 stages · 10 CPU parts · 10 minigames</p>';
  h += '<p class="w-meta2 rv" data-t="7200">Build every part in a stage to open the next one.</p>';
  h += '<button id="wStart" class="rv" data-t="7700">▶ START</button>';
  h += '<div class="w-hint">click anywhere to skip the intro · Enter to start</div>';

  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var box = document.createElement("div"); box.id = "welcome"; box.innerHTML = h; document.body.appendChild(box);

  // ---------- reveal timeline ----------
  var items = box.querySelectorAll(".rv");
  var timers = [];
  var allShown = false;
  var noMotion = (typeof game !== "undefined" && game.reduce) ||
                 (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function showAll() {
    timers.forEach(clearTimeout);
    timers = [];
    box.classList.add("skip");
    for (var i = 0; i < items.length; i++) { items[i].classList.add("show"); }
    allShown = true;
  }
  if (noMotion) {
    showAll();
  } else {
    for (var i = 0; i < items.length; i++) {
      (function (el) {
        timers.push(setTimeout(function () { el.classList.add("show"); }, Number(el.getAttribute("data-t"))));
      })(items[i]);
    }
    timers.push(setTimeout(function () { allShown = true; }, 7700));
  }

  // ---------- star field (canvas) ----------
  var cv = box.querySelector("#wStars");
  var cx = cv.getContext("2d");
  var stars = [], W = 0, H = 0;
  function setup() {
    var d = window.devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
    stars = [];
    var n = Math.round(W * H / 6000);
    for (var i = 0; i < n; i++) {
      var big = Math.random() < 0.15;
      stars.push({ x: Math.random() * W, y: Math.random() * H,
                   r: big ? 1.6 + Math.random() * 1.2 : 0.8 + Math.random() * 0.9,
                   p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.8 });
    }
  }
  function draw(t) {
    if (!box.parentNode) { return; }
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = noMotion ? 0.7 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t / 1000 * s.s + s.p));
      cx.globalAlpha = a;
      cx.fillStyle = "#e6f2ff";
      if (s.r > 1.5) { cx.shadowColor = "#8fd0ff"; cx.shadowBlur = 8; } else { cx.shadowBlur = 0; }
      cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.2832); cx.fill();
    }
    cx.globalAlpha = 1; cx.shadowBlur = 0;
    if (!noMotion) { requestAnimationFrame(draw); }
  }
  setup();
  requestAnimationFrame(draw);
  window.addEventListener("resize", function () { setup(); if (noMotion) { requestAnimationFrame(draw); } });

  // ---------- start / skip ----------
  function start() {
    timers.forEach(clearTimeout);
    box.classList.add("out");
    document.removeEventListener("keydown", onKey, true);
    setTimeout(function () { if (box.parentNode) { box.parentNode.removeChild(box); } }, 600);
  }
  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); e.stopPropagation();
      if (allShown) { start(); } else { showAll(); }
    }
  }
  box.addEventListener("click", function (e) {
    if (e.target.id === "wStart") { start(); }
    else if (!allShown) { showAll(); }
  });
  document.addEventListener("keydown", onKey, true);
})();
