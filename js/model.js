/* =====================================================================
   MODEL — the data and state of the app. Never touches the DOM.
   Edit your content here: featured projects, skills, image overrides.
   ===================================================================== */

const Model = {

  githubUser: "Zainulabdin007",

  // App state (read/written by the Controller, displayed by the View)
  state: {
    screen: "home",        // which screen is showing
    menuIndex: 0,          // WORK stays selected; Credits is last, under Contact
    reposLoaded: false,
    skillsBuilt: false,
  },

  // ---- Featured projects (hand-written, shown above the GitHub feed) ----
  // Links are only URLs that exist: a public repo, or a live site.
  // `wide` cards span the full row. Leave `repo` empty until a public repo exists.
  featured: [
    {
      title: "Frame",
      tag: "Local AI IDE", color: "#3178c6", wide: true, dive: "frame",
      img: "assets/projects/frame.jpg",
      site: "https://frameide.vercel.app/",
      repo: "https://github.com/Zainulabdin007/Frame_IDE",
      stack: "TypeScript · Python · Electron · llama.cpp · MLX · LoRA · GGUF · RAG",
      desc: "A fully local AI coding IDE. Every request is assembled from a multi-tier memory system, a per-project RAG index, and a workspace knowledge graph, then routed to Qwen2.5-Coder-7B running on-device through llama.cpp, with Metal acceleration on Apple Silicon. A personalization pipeline watches accepts, edits, and reverts, confirms learned preferences through a human-in-the-loop review, and fine-tunes LoRA adapters with MLX, fused and quantized to GGUF for offline inference. No cloud calls, and the code never leaves the machine.",
    },
    {
      title: "Strata",
      tag: "Storage Engine", color: "#dea584",
      repo: "https://github.com/Zainulabdin007/Strata",
      stack: "Rust · Zstd · LZ4 · Parquet",
      desc: "A lossless, compression-first storage engine for structured event data. On 179M Nasdaq records it stores 10% smaller than Parquet with Zstd, and ingests 4.54M records per second, 2.6× faster.",
    },
    {
      title: "FluxCommerce",
      tag: "Reliability", color: "#e60012",
      repo: "https://github.com/Zainulabdin007/FluxCom",
      stack: "Rails · React · PostgreSQL · Redis · k6 · Prometheus · Grafana · OpenTelemetry · Terraform",
      desc: "A resilience lab built around a Rails product API. k6 drives traffic from baseline to Black Friday spikes, while chaos switches inject Redis latency, database stalls, and random 503s. OpenTelemetry, Prometheus, and Grafana show p95 latency, error rate, and recovery. Terraform defines the AWS target: VPC, ALB, ECS Fargate, RDS, and ElastiCache.",
    },
    {
      title: "Wanderers",
      tag: "Hack Canada", color: "#3dff6e", live: true,
      img: "assets/projects/wanderers.jpg",
      site: "https://www.wanderers.space",
      repo: "https://github.com/Kapil-Iyer/Wanderers",
      stack: "Next.js · Supabase · Gemini · FastAPI · scikit-learn · Tailwind",
      desc: "A campus social app with live activity bubbles showing what's happening nearby. Its recommendation engine pairs Gemini with K-means clustering and hits 72.2% Hit Rate@6.",
    },
    {
      title: "CoopTrack",
      tag: "Productivity", color: "#f1e05a", live: true,
      img: "assets/projects/cooptrack.jpg",
      site: "https://cooptrack.vercel.app/",
      repo: "",
      stack: "React · Vite · Supabase · Gemini · Tailwind",
      desc: "An application tracker for co-op recruiting. Gemini parses a job posting into structured fields, and every application moves through a term-based pipeline from Applied to Offered.",
    },
  ],

  // Repos that are featured above, or are coursework, profile, and old experiments, stay out of the feed.
  hiddenRepos: [
    "Frame_IDE", "FluxCom", "Strata",
    "Zainulabdin007", "Improved-portfolio", "my-portfolio-1", "webring.ca",
    "racket-assignments-", "Java-problem-sets", "Python-projects", "MUI-and-FastAPI-practice",
    "fittrack", "Fit-track", "sudoku", "NewsFlash", "Loom_web",
  ],

  // Used when a public repo has no GitHub description.
  repoBlurbs: {
    "end-to-end_ml_pipeline": "California housing price model with a tuned Random Forest, MLflow experiment tracking, and ONNX export for deployment.",
  },

  // Shown if the GitHub API can't be reached.
  fallbackRepos: [
    {
      name: "apex", language: "C++", stargazers_count: 0,
      html_url: "https://github.com/Zainulabdin007/apex",
      description: "C++ price-time matching engine with a synthetic order stream",
    },
    {
      name: "end-to-end_ml_pipeline", language: "Python", stargazers_count: 0,
      html_url: "https://github.com/Zainulabdin007/end-to-end_ml_pipeline",
      description: "",
    },
  ],

  // Optional thumbnail overrides: repo name → image path.
  // Anything not listed is looked up at assets/projects/<RepoName>.png
  projectImages: {},

  langColors: {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    PHP: "#4F5D95", CSS: "#663399", HTML: "#e34c26",
    "Jupyter Notebook": "#DA5B0B", Java: "#b07219", C: "#555", "C++": "#f34b7d",
    Ruby: "#701516", Rust: "#dea584", Racket: "#3c5caa",
  },

  // ---- Skills screen ----
  skills: [
    { group: "Languages", items: [
      "Python", "TypeScript", "JavaScript", "Java", "C", "C++", "Rust", "SQL", "Bash", "PowerShell",
    ]},
    { group: "AI & ML", items: [
      "PyTorch", "scikit-learn", "llama.cpp", "MLX", "LoRA", "GGUF", "RAG", "FAISS",
      "ONNX", "MLflow", "Gemini", "Hermes Agent",
    ]},
    { group: "Infrastructure", items: [
      "Linux", "Docker", "Docker Compose", "Terraform", "AWS", "Prometheus", "Grafana",
      "OpenTelemetry", "k6", "n8n", "Fortinet", "CrowdStrike",
    ]},
    { group: "Backend & Data", items: [
      "FastAPI", "Ruby on Rails", "PostgreSQL", "Redis", "Supabase", "Parquet",
    ]},
    { group: "Frontend", items: [
      "React", "Next.js", "Vite", "Tailwind CSS", "Three.js", "GSAP",
    ]},
    { group: "Tools", items: [
      "Git", "GitHub", "Jira", "Vercel", "Streamlit", "Tableau", "Blender",
    ]},
  ],

  // ---- Data fetching ----
  async fetchRepos() {
    const skip = new Set(this.hiddenRepos);
    try {
      const res = await fetch(
        `https://api.github.com/users/${this.githubUser}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error(res.status);
      const repos = (await res.json()).filter(r => !r.fork && !skip.has(r.name));
      return { repos, live: true };
    } catch {
      return { repos: this.fallbackRepos.filter(r => !skip.has(r.name)), live: false };
    }
  },
};
