// Shared navigation, accessible guided tours and illustrative interaction demos.
(function () {
  "use strict";
  var root = document.documentElement;
  // Reveal screenshot containers after their pixels are decoded, so the dark
  // backing surface never flashes as an empty phone during an entrance.
  document.querySelectorAll(".app-shot").forEach(function (container) {
    var image = container.querySelector("img");
    if (!image) return;
    container.classList.add("image-loading");
    var reveal = function () { requestAnimationFrame(function () { container.classList.remove("image-loading"); }); };
    if (image.decode) image.decode().then(reveal, reveal);
    else if (image.complete) reveal();
    else { image.addEventListener("load", reveal, { once: true }); image.addEventListener("error", reveal, { once: true }); }
  });
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionListeners = [];
  function motionPaused() { return root.classList.contains("motion-paused") || reducedMotion.matches; }
  function syncMotion() {
    if (motionPaused() && document.getAnimations) document.getAnimations().forEach(function (animation) { animation.cancel(); });
    document.querySelectorAll("[data-motion-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(motionPaused()));
      button.textContent = motionPaused() ? "動きを再開する" : "動きを止める";
      button.disabled = reducedMotion.matches;
      if (reducedMotion.matches) button.textContent = "端末の設定で動きを抑えています";
    });
    motionListeners.forEach(function (fn) { fn(); });
  }
  document.querySelectorAll("[data-motion-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      root.classList.toggle("motion-paused");
      try { localStorage.setItem("sync-site-motion", root.classList.contains("motion-paused") ? "paused" : "playing"); } catch (_) {}
      syncMotion();
    });
  });
  reducedMotion.addEventListener("change", syncMotion);

  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () { header.classList.toggle("is-scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-navigation a").forEach(function (link) {
    var group = ["speed-pitch.html", "reverb.html", "normalize.html", "visualizer.html"].includes(here) ? "sound.html" : here;
    if (link.getAttribute("href") === group) link.setAttribute("aria-current", "page");
  });
  var menuToggle = document.querySelector(".menu-toggle");
  var navigation = document.querySelector(".site-navigation");
  if (menuToggle && navigation) {
    function closeMenu() {
      navigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "メニュー";
    }
    menuToggle.addEventListener("click", function () {
      var open = !navigation.classList.contains("is-open");
      navigation.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.textContent = open ? "閉じる" : "メニュー";
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) { closeMenu(); menuToggle.focus(); }
    });
    document.addEventListener("click", function (event) { if (!header.contains(event.target)) closeMenu(); });
    window.addEventListener("pageshow", closeMenu);
  }

  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    var panels = Array.from(group.querySelectorAll('[role="tabpanel"]'));
    var active = 0;
    function select(index, focus) {
      active = (index + tabs.length) % tabs.length;
      tabs.forEach(function (tab, i) {
        tab.setAttribute("aria-selected", String(i === active));
        tab.tabIndex = i === active ? 0 : -1;
        panels[i].hidden = i !== active;
      });
      if (focus) tabs[active].focus({ preventScroll: true });
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { select(index, false); });
      tab.addEventListener("keydown", function (event) {
        var next = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
        if (next !== null) { event.preventDefault(); select(next, true); }
      });
    });
    group.querySelectorAll("[data-tour-prev],[data-tour-next]").forEach(function (button) {
      button.addEventListener("click", function () { select(active + (button.hasAttribute("data-tour-prev") ? -1 : 1), true); });
    });
    panels.forEach(function (panel) {
      panel.querySelectorAll("[data-point]").forEach(function (button) {
        button.addEventListener("click", function () {
          var point = button.getAttribute("data-point");
          panel.querySelectorAll("[data-point]").forEach(function (b) {
            var selected = b.getAttribute("data-point") === point;
            b.setAttribute("aria-pressed", String(selected));
            b.classList.toggle("is-active", selected);
          });
          panel.querySelectorAll("[data-point-description]").forEach(function (description) {
            description.hidden = description.getAttribute("data-point-description") !== point;
          });
        });
      });
    });
  });

  var dialog = document.querySelector(".image-dialog");
  if (dialog) {
    document.querySelectorAll("[data-zoom]").forEach(function (button) {
      button.addEventListener("click", function () {
        var image = dialog.querySelector("img");
        image.src = button.getAttribute("data-zoom");
        image.alt = button.getAttribute("data-zoom-alt");
        dialog.showModal();
      });
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        var box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
      }
    });
  }

  function fillRange(input) {
    input.style.setProperty("--fill", ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100) + "%");
  }
  document.querySelectorAll('input[type="range"]').forEach(function (input) { fillRange(input); input.addEventListener("input", function () { fillRange(input); }); });

  var lab = document.querySelector("[data-sound-lab]");
  if (lab) {
    var speed = lab.querySelector("#speed-range");
    var pitch = lab.querySelector("#pitch-range");
    var linked = lab.querySelector("#pitch-link");
    var wet = lab.querySelector("#reverb-range");
    var speedOutput = lab.querySelector("#speed-output");
    var pitchOutput = lab.querySelector("#pitch-output");
    var reverbOutput = lab.querySelector("#reverb-output");
    var presets = {
      night: { speed: 80, pitch: 0, linked: true, wet: 40, text: "少しスローに、余韻を添えて。夜に浸る一曲へ。" },
      energy: { speed: 125, pitch: 0, linked: true, wet: 10, text: "テンポもキーも軽やかに。気持ちを上げたい一曲へ。" },
      practice: { speed: 70, pitch: 0, linked: false, wet: 0, text: "原曲のキーのまま、ゆっくりと。一音ずつ確かめる時間に。" }
    };
    function numberWithUnit(output, value, unit) {
      output.replaceChildren(document.createTextNode(value));
      var suffix = document.createElement("span"); suffix.textContent = unit; output.appendChild(suffix);
    }
    function renderLab(custom, animate) {
      var rate = Number(speed.value) / 100;
      var semitones = linked.checked ? 12 * Math.log2(rate) : Number(pitch.value) / 10;
      numberWithUnit(speedOutput, rate.toFixed(2), "×");
      numberWithUnit(pitchOutput, (semitones < 0 ? "−" : "+") + Math.abs(semitones).toFixed(1), " st");
      if (wet) numberWithUnit(reverbOutput, wet.value, "%");
      pitch.disabled = linked.checked;
      lab.querySelector("[data-link-state]").textContent = linked.checked ? "ON" : "OFF";
      lab.querySelector("[data-pitch-hint]").textContent = linked.checked ? "連動をオフにすると、キーだけを調整できます。" : "テンポを保ちながら、キーだけを変えられます。";
      lab.querySelectorAll('input[type="range"]').forEach(fillRange);
      if (animate && !motionPaused()) lab.querySelectorAll("output").forEach(function (output) {
        if (output.animate) output.animate([{ opacity: .35, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(.2,.7,.15,1)" });
      });
      if (custom) {
        lab.querySelectorAll("[data-mood]").forEach(function (button) { button.setAttribute("aria-pressed", "false"); });
        lab.querySelector("[data-mood-description]").textContent = "自分好みのバランスを調整中。音の変化はアプリで楽しめます。";
      }
      lab.dispatchEvent(new Event("signalchange"));
    }
    lab.querySelectorAll("[data-mood]").forEach(function (button) {
      button.addEventListener("click", function () {
        var preset = presets[button.getAttribute("data-mood")];
        speed.value = preset.speed; pitch.value = preset.pitch; linked.checked = preset.linked; if (wet) wet.value = preset.wet;
        lab.querySelectorAll("[data-mood]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
        lab.querySelector("[data-mood-description]").textContent = preset.text;
        renderLab(false, true);
      });
    });
    [speed, pitch, wet].filter(Boolean).forEach(function (input) { input.addEventListener("input", function () { renderLab(true); }); });
    linked.addEventListener("change", function () { renderLab(true, true); });
    lab.querySelector("[data-sound-reset]").addEventListener("click", function () {
      speed.value = 100; pitch.value = 0; linked.checked = true; if (wet) wet.value = 0;
      renderLab(true, true);
      lab.querySelector("[data-mood-description]").textContent = "等速・キー ±0・余韻なし。原曲のバランスから始めましょう。";
    });
    renderLab(false);
  }

  var reverbRange = !lab && document.querySelector("#reverb-range");
  if (reverbRange) reverbRange.addEventListener("input", function () {
    var output = document.querySelector("#reverb-output");
    output.replaceChildren(document.createTextNode(reverbRange.value));
    var percent = document.createElement("span"); percent.textContent = "%"; output.appendChild(percent);
  });

  var normalizeToggle = document.querySelector("[data-normalize-toggle]");
  if (normalizeToggle) normalizeToggle.addEventListener("click", function () {
    var active = normalizeToggle.getAttribute("aria-pressed") !== "true";
    normalizeToggle.setAttribute("aria-pressed", String(active));
    normalizeToggle.querySelector(".toggle-state").textContent = active ? "ON" : "OFF";
    var levels = [58, 62, 60];
    var originalLabels = ["小さめ", "大きめ", "中くらい"];
    document.querySelectorAll("[data-volume-level]").forEach(function (bar, index) {
      bar.style.setProperty("--level", (active ? levels[index] : bar.getAttribute("data-volume-level")) + "%");
      bar.parentElement.nextElementSibling.textContent = active ? "目標へ" : originalLabels[index];
    });
    document.querySelector(".normalization-status").textContent = active ? "小さな曲を持ち上げ、大きな曲を抑えるイメージです。アプリでは測定した曲ごとの補正量を使います。" : "スイッチを入れて、音量差の変化を見てください。";
  });

  // Canvases are explanatory signal plots, not captured audio or app screenshots.
  document.querySelectorAll("canvas[data-signal]").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var type = canvas.getAttribute("data-signal");
    var scope = canvas.closest(".feature-interaction,.sound-lab");
    var toggle = scope.querySelector("[data-signal-toggle]");
    var running = true, visible = false, raf = 0, phase = 0, previous = 0, mode = "bar";
    function draw() {
      var w = canvas.width, h = canvas.height;
      var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      var rateInput = scope.querySelector("#speed-range");
      var wetInput = scope.querySelector("#reverb-range");
      var rate = rateInput ? Number(rateInput.value) / 100 : 1;
      var wetValue = wetInput ? Number(wetInput.value) / 100 : .4;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = type === "visualizer" ? "#efeeea" : "#242423";
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.3 * pixelRatio;
      if (type === "visualizer" && mode === "bar") {
        for (var i = 0; i < 52; i++) {
          var f = i / 51;
          var strength = .12 + .76 * Math.abs(Math.sin(f*9 + phase*2.1)*.6 + Math.sin(f*21-phase*3.4)*.4);
          var height = strength * h * .83;
          var width = w/52*.43;
          ctx.fillRect((i+.5)/52*w-width/2, (h-height)/2, width, height);
        }
      } else if (type === "visualizer" && mode === "pulse") {
        var amplitude = .35 + .2 * Math.sin(phase * 3.8);
        for (var ring = 0; ring < 3; ring++) {
          ctx.beginPath(); ctx.globalAlpha = 1-ring*.28;
          ctx.arc(w/2,h/2,h*(amplitude+ring*.09)*.65,0,Math.PI*2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        for (var x=0; x<=w; x+=2) {
          var progress=x/w;
          var envelope= type === "reverb" ? Math.exp(-progress*(9-wetValue*7)) : Math.sin(progress*Math.PI);
          var frequency= type === "speed" ? 8*rate : type === "reverb" ? 17 : 3;
          var v=Math.sin(progress*Math.PI*2*frequency-phase*2)*.7+Math.sin(progress*Math.PI*2*frequency*1.6+phase)*.3;
          var y=h/2-v*envelope*h*.34;
          if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    }
    function frame(now) {
      raf=0;
      if(!running || !visible || document.hidden || motionPaused()) { draw(); return; }
      if(previous) phase+= Math.min(now-previous,80)/1000;
      previous=now;
      draw(); raf=requestAnimationFrame(frame);
    }
    function reconcile() {
      if(raf)cancelAnimationFrame(raf); raf=0; previous=0;
      if(running && visible && !document.hidden && !motionPaused()) raf=requestAnimationFrame(frame); else draw();
      toggle.setAttribute("aria-pressed",String(running && !motionPaused()));
      toggle.textContent = motionPaused() ? "動きを抑えています" : running ? "動きを停止" : "動きを再生";
      toggle.disabled=motionPaused();
    }
    function size() {
      var box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.round(box.width*dpr)); canvas.height=Math.max(1,Math.round(box.height*dpr)); draw();
    }
    new ResizeObserver(size).observe(canvas);
    new IntersectionObserver(function(entries){ visible=entries[0].isIntersecting; reconcile(); },{threshold:.05}).observe(canvas);
    toggle.addEventListener("click",function(){ running=!running; reconcile(); });
    scope.querySelectorAll("[data-viz-mode]").forEach(function(button){
      button.addEventListener("click",function(){
        mode=button.getAttribute("data-viz-mode");
        scope.querySelectorAll("[data-viz-mode]").forEach(function(b){b.setAttribute("aria-pressed",String(b===button));});
        draw();
      });
    });
    scope.querySelectorAll('input[type="range"]').forEach(function(input){input.addEventListener("input",draw);});
    scope.addEventListener("signalchange",draw);
    document.addEventListener("visibilitychange",reconcile);
    motionListeners.push(reconcile);
    size();
  });

  var download = document.querySelector("[data-apk-download]");
  if (download) {
    download.addEventListener("click", function () {
      document.getElementById("download-status").textContent = "ダウンロードを開始しました。完了後、APK ファイルを開いてください。";
    });
  }
  var copyButton = document.querySelector("[data-copy-hash]");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(document.getElementById("download-hash"));
      selection.removeAllRanges();
      selection.addRange(range);
      document.getElementById("copy-status").textContent = "ハッシュを選択しました。コピーしてお使いください。";
    });
  }
  syncMotion();
})();
