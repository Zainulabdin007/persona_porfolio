/* Phone UI. Runs the looping pager only when the phone media query matches,
   which is the same query css/phone.css uses to show #phone. */
const Phone = {
  query: "(hover: none) and (pointer: coarse) and (max-width: 540px), (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px)",
  order: ["home", "work", "projects", "lab", "skills", "stats", "about", "contact", "credits"],
  labels: {
    home: "Apps", work: "Work", projects: "Projects", lab: "Lab",
    skills: "Skills", stats: "Stats", about: "About", contact: "Contact", credits: "Credits",
  },
  index: 0,
  ready: false,

  init() {
    this.mq = matchMedia(this.query);
    this.root = document.getElementById("phone");
    if (!this.root) return;
    const apply = () => {
      const on = this.mq.matches;
      document.documentElement.classList.toggle("is-phone", on);
      this.root.setAttribute("aria-hidden", on ? "false" : "true");
      const shell = document.getElementById("shell");
      if (shell) {
        shell.setAttribute("aria-hidden", on ? "true" : "false");
        if ("inert" in shell) shell.inert = on;
      }
      if (on) this.boot();
      else this.stopClock();
    };
    this.mq.addEventListener("change", apply);
    apply();
  },

  boot() {
    if (this.ready) { this.startClock(); this.place(false); return; }
    this.ready = true;
    this.view = document.getElementById("ph-view");
    this.track = document.getElementById("ph-track");
    this.frame = document.getElementById("ph-frame");
    this.label = document.getElementById("ph-label");
    this.count = document.getElementById("ph-count");
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.getElementById("ph-theme").addEventListener("click", () => {
      this.syncThemeLabel();
      Controller.toggleTheme();
    });
    document.getElementById("ph-prev").addEventListener("click", () => this.move(-1));
    document.getElementById("ph-next").addEventListener("click", () => this.move(1));
    document.getElementById("ph-home").addEventListener("click", () => this.go(0));
    this.root.addEventListener("click", e => {
      const go = e.target.closest("[data-ph-go]");
      if (go) { this.go(go.dataset.phGo); return; }
      if (e.target.closest("[data-ph-open]")) { this.openFrame(); return; }
      if (e.target.closest("[data-ph-close]")) this.closeFrame();
    });
    this.bindSwipe();
    addEventListener("resize", () => { if (this.mq.matches) this.place(false); });
    new MutationObserver(() => this.syncThemeLabel()).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"],
    });

    this.renderSkills();
    this.renderFeatured();
    this.loadRepos();
    this.syncThemeLabel();
    this.place(false);
    this.startClock();
  },

  syncThemeLabel() {
    const btn = document.getElementById("ph-theme");
    if (!btn) return;
    const p3 = document.documentElement.dataset.theme === "p3";
    btn.setAttribute("aria-label", p3 ? "Switch to Persona 5" : "Switch to Persona 3");
  },

  startClock() {
    if (this.clock || document.hidden) return;
    const tick = () => {
      const el = document.getElementById("ph-clock");
      if (!el) return;
      el.textContent = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
      });
    };
    tick();
    this.clock = setInterval(tick, 1000);
    if (!this.watching) {
      this.watching = true;
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.stopClock();
        else if (this.mq.matches) this.startClock();
      });
    }
  },

  stopClock() {
    clearInterval(this.clock);
    this.clock = 0;
  },

  bindSwipe() {
    let x = 0, y = 0, dx = 0, active = false, axis = "";
    this.view.addEventListener("touchstart", e => {
      if (!this.frame.hidden) return;
      const t = e.touches[0];
      if (t.clientX < 28) return;
      x = t.clientX; y = t.clientY; dx = 0; active = true; axis = "";
    }, { passive: true });

    this.view.addEventListener("touchmove", e => {
      if (!active) return;
      const t = e.touches[0];
      const mx = t.clientX - x, my = t.clientY - y;
      if (!axis) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      }
      if (axis !== "x") return;
      dx = mx;
      const n = this.order.length;
      const edge = (this.index === 0 && dx > 0) || (this.index === n - 1 && dx < 0);
      this.track.style.transition = "none";
      this.track.style.transform = `translate3d(${-this.index * this.view.clientWidth + (edge ? dx * 0.3 : dx)}px,0,0)`;
    }, { passive: true });

    const end = () => {
      if (!active) return;
      active = false;
      if (axis === "x" && Math.abs(dx) > 48) this.move(dx < 0 ? 1 : -1);
      else this.place(true);
    };
    this.view.addEventListener("touchend", end);
    this.view.addEventListener("touchcancel", end);
  },

  move(step) {
    if (!this.frame.hidden) { this.closeFrame(); return; }
    this.go(this.index + step);
  },

  go(target) {
    const n = this.order.length;
    const i = typeof target === "number" ? target : this.order.indexOf(target);
    if (i < 0) return;
    const next = (i % n + n) % n;
    const wrap = Math.abs(next - this.index) > 1;
    this.index = next;
    this.closeFrame(true);
    this.place(!wrap);
    const panel = this.track.children[this.index];
    const scroller = panel && panel.querySelector(".ph-home, .ph-scroll");
    if (scroller) scroller.scrollTop = 0;
    const name = this.order[this.index];
    if (name === "projects") this.loadRepos();
    try { Controller.play(); } catch (e) {}
  },

  place(animate) {
    const w = this.view.clientWidth;
    this.track.style.transition = animate && !this.reduced
      ? "transform .38s cubic-bezier(.2,.8,.2,1)" : "none";
    this.track.style.transform = `translate3d(${-this.index * w}px,0,0)`;
    const name = this.order[this.index];
    this.label.textContent = this.labels[name];
    this.count.textContent = this.index === 0 ? "Swipe" : this.index + " / " + (this.order.length - 1);
  },

  openFrame() {
    this.frame.hidden = false;
    const sc = this.frame.querySelector(".ph-scroll");
    if (sc) sc.scrollTop = 0;
    try { Controller.play(); } catch (e) {}
  },

  closeFrame(silent) {
    if (this.frame.hidden) return;
    this.frame.hidden = true;
    if (!silent) { try { Controller.play(); } catch (e) {} }
  },

  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  },

  renderSkills() {
    const host = document.getElementById("ph-skills");
    if (!host || host.childElementCount) return;
    host.innerHTML = Model.skills.map(g => `
      <section class="ph-skill">
        <h2>${this.esc(g.group)}</h2>
        <div>${g.items.map(name => `<span>${this.esc(name)}</span>`).join("")}</div>
      </section>`).join("");
  },

  renderFeatured() {
    const host = document.getElementById("ph-feat");
    if (!host || host.childElementCount) return;
    host.innerHTML = Model.featured.map(f => {
      const actions = [
        f.dive ? `<button type="button" data-ph-open="frame">Deep dive ↗</button>` : "",
        f.site ? `<a href="${this.esc(f.site)}" target="_blank" rel="noopener">${f.live ? "Live ↗" : "Site ↗"}</a>` : "",
        f.repo ? `<a class="alt" href="${this.esc(f.repo)}" target="_blank" rel="noopener">GitHub ↗</a>` : "",
      ].join("");
      const first = f.title.split(" ")[0];
      const img = f.img
        ? `<img src="${this.esc(f.img)}" alt="" loading="lazy" onerror="this.remove()">`
        : "";
      return `
        <article class="ph-proj">
          ${img}
          <div>
            <span class="tag">${this.esc(f.tag)}</span>
            <h2><em>${this.esc(first)}</em>${this.esc(f.title.slice(first.length))}</h2>
            <p>${this.esc(f.desc)}</p>
            <p class="stack">${this.esc(f.stack)}</p>
            <div class="row">${actions}</div>
          </div>
        </article>`;
    }).join("");
  },

  async loadRepos() {
    if (this.reposLoaded) return;
    this.reposLoaded = true;
    const host = document.getElementById("ph-repos");
    const status = document.getElementById("ph-repo-status");
    const { repos, live } = await Model.fetchRepos();
    Model.state.reposLoaded = true;
    if (status) status.textContent = live ? "Synced live from GitHub" : "Pinned repositories";
    if (!host) return;
    host.innerHTML = repos.map(r => {
      const pretty = r.name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const blurb = r.description || Model.repoBlurbs[r.name] || "No description on GitHub yet.";
      const img = Model.projectImages[r.name] || `assets/projects/${r.name}.png`;
      return `
        <a class="ph-proj" href="${this.esc(r.html_url)}" target="_blank" rel="noopener">
          <img src="${this.esc(img)}" alt="" loading="lazy" onerror="this.remove()">
          <div>
            <span class="tag">${this.esc(r.language || "Repo")}</span>
            <h2>${this.esc(pretty)}</h2>
            <p>${this.esc(blurb)}</p>
            <p class="stack">★ ${r.stargazers_count || 0}</p>
          </div>
        </a>`;
    }).join("");
  },
};

Phone.init();
