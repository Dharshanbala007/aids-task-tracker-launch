/* AI&DS Task Tracker launch page
   - Sparkles: dependency-free canvas port of the SparklesCore (tsParticles) component
   - Flow: Play -> film plays -> on end, "Launch app" -> official site */

(() => {
  "use strict";

  const APP_URL = "https://ai-ds-task-tracker.vercel.app/coordinator";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Sparkles                                                            */
  /* Mirrors SparklesCore's options: density per 400x400 area, size range,*/
  /* twinkling opacity (0.1 to 1), slow drift (0.1 to 1 px/frame), wrap  */
  /* at edges, and click to push 4 new particles.                        */
  /* ------------------------------------------------------------------ */
  class Sparkles {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.opts = Object.assign(
        { density: 120, minSize: 1, maxSize: 3, speed: 4, color: "#ffffff", clickPush: true },
        opts
      );
      this.particles = [];
      this.running = false;
      this.last = 0;
      this.rgb = Sparkles.hexToRgb(this.opts.color);

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);

      new ResizeObserver(this.resize).observe(canvas);
      this.resize();

      if (this.opts.clickPush) {
        canvas.style.pointerEvents = "auto";
        canvas.addEventListener("click", (e) => {
          const r = canvas.getBoundingClientRect();
          for (let i = 0; i < 4; i++) this.particles.push(this.make(e.clientX - r.left, e.clientY - r.top));
        });
      }
    }

    static hexToRgb(hex) {
      const h = hex.replace("#", "");
      const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    make(x, y) {
      const { minSize, maxSize, speed } = this.opts;
      const angle = Math.random() * Math.PI * 2;
      const v = 0.1 + Math.random() * 0.9;
      return {
        x: x ?? Math.random() * this.w,
        y: y ?? Math.random() * this.h,
        r: minSize + Math.random() * (maxSize - minSize),
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        o: 0.1 + Math.random() * 0.9,
        dir: Math.random() < 0.5 ? -1 : 1,
        os: (speed * (0.6 + Math.random() * 0.8)) / 3.5, // opacity change per second
      };
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let target = Math.round((this.opts.density * this.w * this.h) / (400 * 400));
      if (reduceMotion) target = Math.round(target * 0.5);
      target = Math.min(target, 1500);
      while (this.particles.length < target) this.particles.push(this.make());
      this.particles.length = target;
      if (!this.running) this.draw(); // static frame
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.tick);
    }

    stop() { this.running = false; }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const motion = reduceMotion ? 0.25 : 1;
      const f = dt * 60 * motion;

      for (const p of this.particles) {
        p.x += p.vx * f;
        p.y += p.vy * f;
        if (p.x < -p.r) p.x = this.w + p.r; else if (p.x > this.w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = this.h + p.r; else if (p.y > this.h + p.r) p.y = -p.r;

        p.o += p.dir * p.os * dt * motion;
        if (p.o >= 1) { p.o = 1; p.dir = -1; }
        else if (p.o <= 0.1) { p.o = 0.1; p.dir = 1; }
      }
      this.draw();
      requestAnimationFrame(this.tick);
    }

    draw() {
      const { ctx, rgb } = this;
      ctx.clearRect(0, 0, this.w, this.h);
      for (const p of this.particles) {
        ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + p.o.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Dense band under the title (SparklesPreview settings)
  const band = new Sparkles(document.getElementById("sparkles-band"), {
    density: 1200, minSize: 0.4, maxSize: 1, speed: 4, color: "#FFFFFF",
  });
  // Faint full-page field (SparklesPreviewDark settings)
  const pageCanvas = document.getElementById("sparkles-page");
  const page = new Sparkles(pageCanvas, {
    density: 100, minSize: 0.6, maxSize: 1.4, speed: 1, color: "#C7D2FE", clickPush: false,
  });
  band.start();
  page.start();
  requestAnimationFrame(() => pageCanvas.classList.add("is-ready"));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { band.stop(); page.stop(); }
    else { if (stage.dataset.state === "intro") band.start(); page.start(); }
  });

  /* ------------------------------------------------------------------ */
  /* Film flow                                                           */
  /* ------------------------------------------------------------------ */
  const stage = document.querySelector(".stage");
  const video = document.getElementById("promo");
  const playBtn = document.getElementById("playBtn");
  const skipBtn = document.getElementById("skipBtn");
  const muteBtn = document.getElementById("muteBtn");
  const replayBtn = document.getElementById("replayBtn");
  const launchBtn = document.getElementById("launchBtn");
  const launchPanel = document.getElementById("launchPanel");
  const progressBar = document.getElementById("progressBar");
  const live = document.getElementById("liveRegion");

  launchBtn.href = APP_URL;

  function setState(state) {
    stage.dataset.state = state;
    document.body.classList.toggle("is-watching", state !== "intro");

    const ended = state === "ended";
    launchPanel.setAttribute("aria-hidden", String(!ended));
    launchBtn.tabIndex = ended ? 0 : -1;
    replayBtn.tabIndex = ended ? 0 : -1;

    if (state === "intro") band.start(); else band.stop();
  }

  async function playFilm() {
    if (filmUnavailable) { setState("playing"); showLaunch(); return; }
    setState("playing");
    video.currentTime = 0;
    try {
      await video.play();
      live.textContent = "Launch film playing.";
    } catch (err) {
      // Autoplay with sound blocked or file missing: fall back to native controls
      video.controls = true;
      live.textContent = "Press play on the video to start the film.";
    }
  }

  function showLaunch() {
    if (stage.dataset.state === "ended") return;
    video.pause();
    video.controls = false;
    progressBar.style.width = "100%";
    setState("ended");
    live.textContent = "Film finished. Launch app is ready.";
    setTimeout(() => launchBtn.focus({ preventScroll: true }), 650);
  }

  playBtn.addEventListener("click", playFilm);
  video.addEventListener("ended", showLaunch);
  skipBtn.addEventListener("click", showLaunch);

  replayBtn.addEventListener("click", () => {
    progressBar.style.width = "0%";
    playFilm();
  });

  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "Unmute" : "Mute";
    muteBtn.setAttribute("aria-pressed", String(video.muted));
  });

  // Click the film to pause / resume
  video.addEventListener("click", () => {
    if (stage.dataset.state !== "playing") return;
    video.paused ? video.play() : video.pause();
  });

  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    progressBar.style.width = ((video.currentTime / video.duration) * 100) + "%";
  });

  // If the film can't load, don't block anyone: Play goes straight to "Launch app"
  let filmUnavailable = false;
  video.addEventListener("error", () => {
    filmUnavailable = true;
    if (stage.dataset.state === "playing") {
      live.textContent = "The film couldn't load. You can open the app directly.";
      showLaunch();
    }
  }, true);

  // Keyboard: Space pauses/resumes, Escape skips to the launch button
  document.addEventListener("keydown", (e) => {
    if (stage.dataset.state !== "playing") return;
    if (e.key === "Escape") { e.preventDefault(); showLaunch(); }
    if (e.key === " " && document.activeElement === document.body) {
      e.preventDefault();
      video.paused ? video.play() : video.pause();
    }
  });

  // Small exit moment before leaving for the app
  launchBtn.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // allow new-tab
    e.preventDefault();
    document.body.style.transition = "opacity .35s ease";
    document.body.style.opacity = "0";
    setTimeout(() => { window.location.href = APP_URL; }, reduceMotion ? 0 : 320);
  });

  setState("intro");
})();
