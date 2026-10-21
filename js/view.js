/* =====================================================================
   VIEW — everything that draws to the screen. No app logic lives here;
   the Controller tells the View what to show.
   ===================================================================== */

const View = {

  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,

  els: {
    screens:    {},   // filled in init()
    menuItems:  [],
    wipe:       document.getElementById("wipe"),
    featGrid:   document.getElementById("feat-grid"),
    repoGrid:   document.getElementById("repo-grid"),
    repoStatus: document.getElementById("repo-status"),
    skillsBody: document.getElementById("skills-body"),
    sfx:        document.getElementById("sfx-select"),
    cursor:     document.getElementById("cursor"),
    clock:      document.getElementById("clock"),
    audioToggle: document.getElementById("audio-toggle"),
  },

  muted: false,

  init() {
    document.querySelectorAll(".screen").forEach(s => {
      this.els.screens[s.id.replace("screen-", "")] = s;
    });
    this.els.menuItems = [...document.querySelectorAll(".menu-item")];
    const theme = document.documentElement.dataset.theme === "p3" ? "p3" : "p5";
    document.documentElement.dataset.theme = theme;
    this.setThemeLabel(theme);
    document.querySelectorAll("[data-ransom]").forEach(el => this.ransomize(el));
    this.els.sfx.volume = 0.45;
    try { this.muted = localStorage.getItem("audio-muted") === "1"; } catch (e) {}
    this.applyMute(false);
    this.startClock();
    this.startParallax();
    this.startCursor();
    document.addEventListener("visibilitychange", () => {
      document.documentElement.classList.toggle("page-hidden", document.hidden);
    });
    document.body.classList.add("loaded");
  },

  applyMute(animate) {
    const btn = this.els.audioToggle;
    if (!btn) return;
    btn.classList.toggle("is-muted", this.muted);
    btn.setAttribute("aria-pressed", this.muted ? "true" : "false");
    btn.setAttribute("aria-label", this.muted ? "Unmute sound" : "Mute sound");
    if (this.els.sfx) this.els.sfx.muted = this.muted;
    if (animate && !this.reducedMotion) {
      btn.classList.remove("audio-pop");
      void btn.offsetWidth;
      btn.classList.add("audio-pop");
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem("audio-muted", this.muted ? "1" : "0"); } catch (e) {}
    this.applyMute(true);
  },

  // Deterministic pseudo-random hash (so letters look the same every visit)
  hash(str) {
    let h = 9;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 387420489);
    return (h ^ h >>> 9) >>> 0;
  },

  /* ---------- Ransom-note lettering ---------- */
  ransomize(el) {
    const text = el.dataset.ransom || el.textContent;
    el.textContent = "";
    [...text].forEach((c, i) => {
      const span = document.createElement("span");
      span.className = "ch display";
      span.textContent = c;
      const h = this.hash(text + i);
      const rot = (h % 17) - 8;                 // -8..8 degrees
      const scale = 0.86 + ((h >> 3) % 30) / 100; // 0.86..1.15
      const dy = ((h >> 5) % 9) - 4;            // -4..4 px
      const t = `rotate(${rot}deg) scale(${scale}) translateY(${dy}px)`;
      span.style.setProperty("--t", t);
      span.style.transform = t;
      const variant = (h >> 7) % 10;
      if (variant === 0) span.classList.add("box");
      else if (variant === 1) span.classList.add("boxw");
      else if (variant === 2) span.classList.add("red");
      el.appendChild(span);
    });
  },

  /* ---------- Screens & menu ---------- */
  showScreen(name) {
    const s = this.els.screens;
    Object.values(s).forEach(sc => sc.classList.remove("active"));
    s[name].classList.add("active");
    s[name].scrollTop = 0;
    document.body.dataset.screen = name;
  },

  setMenuSelection(index) {
    this.els.menuItems.forEach((m, j) => m.classList.toggle("sel", j === index));
  },

  setThemeLabel(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const current = theme === "p3" ? "p3" : "p5";
    btn.dataset.pos = current;
    const other = current === "p3" ? "Persona 5" : "Persona 3";
    btn.setAttribute("aria-label", "Switch to " + other);
    requestAnimationFrame(() => btn.classList.add("ready"));
  },

  // Diagonal wipe; calls swap() mid-way while the screen is covered.
  // dir "left" sends the panes the other way, matching the theme switch.
  wipe(swap, done, dir) {
    if (this.reducedMotion) { swap(); done(); return; }
    const w = this.els.wipe;
    w.classList.remove("go", "to-left");
    void w.offsetWidth;  // restart animation
    if (dir === "left") w.classList.add("to-left");
    w.classList.add("go");
    setTimeout(swap, 340);
    setTimeout(() => {
      w.classList.remove("go", "to-left");
      done();
    }, 720);
  },

  /* ---------- Sound ---------- */
  playSelect() {
    if (this.muted) return;
    try {
      this.els.sfx.currentTime = 0;
      const p = this.els.sfx.play();
      if (p && p.catch) p.catch(() => {});  // blocked before first user gesture — fine
    } catch {}
  },

  /* ---------- Project cards ---------- */
  cardThumb(src) {
    return `<div class="thumb"><img src="${src}" alt="" loading="lazy"
      onerror="this.closest('.thumb').remove()"></div>`;
  },

  // Split "Medical Image…" so the first word renders red
  splitTitle(title) {
    const first = title.split(" ")[0];
    return `<em>${first}</em>${title.slice(first.length)}`;
  },

  renderFeatured(list) {
    if (this.els.featGrid.childElementCount) return;
    list.forEach((f, i) => {
      const card = document.createElement("article");
      card.className = "card feat" + (f.wide ? " wide" : "");
      card.style.setProperty("--tilt", ((this.hash(f.title) % 5) - 2) * (f.wide ? 0.25 : 0.8) + "deg");
      card.style.setProperty("--d", i * 70 + "ms");
      const links = [
        f.site && { href: f.site, label: f.live ? "Live ↗" : "Site ↗" },
        f.repo && { href: f.repo, label: "GitHub ↗" },
      ].filter(Boolean);
      const actions = (f.dive ? `<a class="go dive" href="#" data-goto="${f.dive}">Deep dive →</a>` : "") +
        links.map(link =>
          `<a class="go" href="${link.href}" target="_blank" rel="noopener">${link.label}</a>`
        ).join("");
      const status = f.live
        ? '<span class="status live"><span class="live-dot"></span>Live</span>'
        : '<span class="status">Open source</span>';
      card.innerHTML = `
        ${f.img ? this.cardThumb(f.img) : ""}
        <span class="lang" style="--lc:${f.color}">${f.tag}</span>
        <h3><a href="${links[0].href}" target="_blank" rel="noopener">${this.splitTitle(f.title)}</a></h3>
        <p>${f.desc}</p>
        <div class="stack">${f.stack}</div>
        <div class="meta">${status}<span class="actions">${actions}</span></div>`;
      this.els.featGrid.appendChild(card);
    });
  },

  renderRepos(repos, statusText, model) {
    this.els.repoStatus.textContent = statusText;
    this.els.repoGrid.innerHTML = "";
    repos.forEach((r, i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.style.setProperty("--tilt", ((this.hash(r.name) % 5) - 2) * 0.8 + "deg");
      a.style.setProperty("--d", i * 70 + "ms");
      a.style.setProperty("--lc", model.langColors[r.language] || "#e60012");
      const pretty = r.name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const img = model.projectImages[r.name] || `assets/projects/${r.name}.png`;
      a.innerHTML = `
        ${this.cardThumb(img)}
        <span class="lang">${r.language || "Repo"}</span>
        <h3>${this.splitTitle(pretty)}</h3>
        <p>${r.description || model.repoBlurbs[r.name] || "No description on GitHub yet."}</p>
        <div class="meta">
          <span>★ ${r.stargazers_count || 0}</span>
          <span class="go">GitHub ↗</span>
        </div>`;
      this.els.repoGrid.appendChild(a);
    });
  },

  /* ---------- Skills ---------- */
  renderSkills(groups) {
    groups.forEach(g => {
      const div = document.createElement("div");
      div.className = "skill-group";
      div.innerHTML = `<h3>${g.group}</h3>`;
      const row = document.createElement("div");
      row.className = "skill-chips";
      g.items.forEach(name => {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.textContent = name;
        row.appendChild(chip);
      });
      div.appendChild(row);
      this.els.skillsBody.appendChild(div);
    });
  },

  /* ---------- Ambient: clock, parallax, animated cursor ---------- */
  startClock() {
    setInterval(() => {
      this.els.clock.textContent =
        new Date().toLocaleTimeString("en-CA", {
          hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
        }) + " · ET";
    }, 1000);
  },

  startParallax() {
    if (this.reducedMotion) return;
    const stripes = document.getElementById("bg-stripes");
    const halftone = document.getElementById("bg-halftone");
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false, shown = null;

    const artForScreen = () => {
      const screen = document.body.dataset.screen;
      if (!{ home: 1, projects: 1, skills: 1, about: 1, contact: 1 }[screen]) return null;
      const p3 = document.documentElement.dataset.theme === "p3";
      if (p3 && screen === "projects") return null;
      return document.getElementById("art-" + screen + (p3 ? "-p3" : ""));
    };

    const syncBackdrop = () => {
      const art = artForScreen();
      document.body.classList.toggle("art-covered", !!(art && art.isConnected));
    };

    const paint = () => {
      stripes.style.transform = `translate3d(${cx * 22}px, ${cy * 14}px, 0)`;
      halftone.style.transform = `translate3d(${cx * -34}px, ${cy * -22}px, 0)`;
      const art = artForScreen();
      if (shown && shown !== art) shown.style.transform = "";
      shown = art;
      if (art && art.isConnected)
        art.style.transform = `translate3d(${cx * 14}px, ${cy * 9}px, 0) scale(1.04)`;
    };

    const loop = () => {
      if (document.hidden) { running = false; return; }
      const dx = tx - cx, dy = ty - cy;
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        cx = tx; cy = ty;
        paint();
        running = false;
        return;
      }
      cx += dx * 0.06;
      cy += dy * 0.06;
      paint();
      requestAnimationFrame(loop);
    };

    addEventListener("pointermove", e => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
      if (document.hidden || running) return;
      running = true;
      requestAnimationFrame(loop);
    }, { passive: true });

    const restyle = () => { syncBackdrop(); if (!running) paint(); };
    restyle();
    new MutationObserver(restyle).observe(document.body, {
      attributes: true, attributeFilter: ["data-screen"],
    });
    new MutationObserver(restyle).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"],
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) running = false;
    });
  },

  // 30-frame sprite-strip cursor. Position updates once per pointer move.
  // The sprite only advances while the pointer is moving, then stops.
  startCursor() {
    if (!matchMedia("(pointer:fine)").matches || this.reducedMotion) return;
    const cur = this.els.cursor;
    document.body.classList.add("cursor-on");
    let x = -100, y = -100, frame = 0, visible = false, queued = false, sprite = 0, idle = 0;

    const stopSprite = () => { clearInterval(sprite); sprite = 0; clearTimeout(idle); };
    const startSprite = () => {
      if (sprite) return;
      sprite = setInterval(() => {
        frame = (frame + 1) % 30;
        cur.style.backgroundPosition = -frame * 48 + "px 0";
      }, 50);
    };
    const place = () => {
      queued = false;
      cur.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY;
      if (!visible) { cur.style.display = "block"; visible = true; }
      if (!document.hidden) startSprite();
      clearTimeout(idle);
      idle = setTimeout(stopSprite, 160);
      const t = e.target;
      const overLink = t.closest &&
        t.closest("a,button,.card,.menu-item,.back-hint,.contact-chip,#big-name");
      cur.classList.toggle("link", !!overLink);
      if (!queued) { queued = true; requestAnimationFrame(place); }
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
      cur.style.display = "none"; visible = false; stopSprite();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopSprite();
    });
  },
};
