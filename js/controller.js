/* =====================================================================
   CONTROLLER — listens to the user, updates the Model, tells the View.
   ===================================================================== */

const Controller = {

  transitioning: false,
  audioUnlocked: false,

  init() {
    View.init();
    this.bindMenu();
    this.bindKeyboard();
    this.bindAudioUnlock();
  },

  /* ---------- Navigation ---------- */
  goTo(screen) {
    if (this.transitioning || !screen || screen === Model.state.screen) return;
    this.transitioning = true;
    this.play();

    View.wipe(
      () => {                       // mid-wipe: swap screens while covered
        Model.state.screen = screen;
        View.showScreen(screen);
        if (screen === "projects") this.loadProjects();
        if (screen === "skills") this.loadSkills();
      },
      () => { this.transitioning = false; }
    );
  },

  toggleTheme() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.play();
    const next = document.documentElement.dataset.theme === "p3" ? "p5" : "p3";
    // Persona 5 sits on the left stop, Persona 3 on the right.
    const dir = next === "p3" ? "right" : "left";
    View.setThemeLabel(next);
    document.documentElement.classList.add("theme-swap");
    View.wipe(
      () => {
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch (e) {}
      },
      () => {
        document.documentElement.classList.remove("theme-swap");
        this.transitioning = false;
      },
      dir
    );
  },

  select(index) {
    const n = View.els.menuItems.length;
    const next = (index + n) % n;
    if (next !== Model.state.menuIndex) this.play();
    Model.state.menuIndex = next;
    View.setMenuSelection(next);
  },

  /* ---------- Screen data loading ---------- */
  async loadProjects() {
    View.renderFeatured(Model.featured);
    if (Model.state.reposLoaded) return;
    const { repos, live } = await Model.fetchRepos();
    const status = live ? "Synced live from GitHub" : "Pinned repositories";
    View.renderRepos(repos, status, Model);
    Model.state.reposLoaded = true;
  },

  loadSkills() {
    if (Model.state.skillsBuilt) return;
    View.renderSkills(Model.skills);
    Model.state.skillsBuilt = true;
  },

  /* ---------- Sound (browsers block audio until first user gesture) ---------- */
  play() {
    if (this.audioUnlocked && !View.muted) View.playSelect();
  },

  bindAudioUnlock() {
    const unlock = () => { this.audioUnlocked = true; };
    addEventListener("pointerdown", unlock, { once: true, capture: true });
    addEventListener("keydown", unlock, { once: true, capture: true });

    const muteBtn = document.getElementById("audio-toggle");
    if (muteBtn) {
      muteBtn.addEventListener("click", e => {
        e.stopPropagation();
        View.toggleMute();
        this.audioUnlocked = true;
        if (!View.muted) this.play();
      });
    }
  },

  /* ---------- Input bindings ---------- */
  bindMenu() {
    View.els.menuItems.forEach((item, i) => {
      item.addEventListener("mouseenter", () => this.select(i));
      item.addEventListener("click", () => this.goTo(item.dataset.target));
    });

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", () => this.toggleTheme());

    document.querySelectorAll("[data-back]").forEach(b =>
      b.addEventListener("click", () => this.goTo("home")));

    // Cards render after load, so in-page links are delegated.
    document.addEventListener("click", e => {
      const link = e.target.closest("[data-goto], [data-back-to]");
      if (!link) return;
      e.preventDefault();
      this.goTo(link.dataset.goto || link.dataset.backTo);
    });

    // Clicking the name always takes you home
    document.getElementById("big-name").addEventListener("click", () => {
      if (Model.state.screen !== "home") this.goTo("home");
      else this.play();
    });
  },

  bindKeyboard() {
    addEventListener("keydown", e => {
      if (Model.state.screen === "home") {
        if (e.key === "ArrowDown") { this.select(Model.state.menuIndex + 1); e.preventDefault(); }
        else if (e.key === "ArrowUp") { this.select(Model.state.menuIndex - 1); e.preventDefault(); }
        else if (e.key === "Enter" && !(e.target && e.target.closest && e.target.closest("#theme-toggle"))) {
          this.goTo(View.els.menuItems[Model.state.menuIndex].dataset.target);
        }
      } else if (e.key === "Escape") {
        const parent = View.els.screens[Model.state.screen].dataset.parent;
        this.goTo(parent || "home");
      }
    });
  },
};

Controller.init();
