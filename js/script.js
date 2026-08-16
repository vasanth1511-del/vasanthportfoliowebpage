(() => {
  "use strict";
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;
  const touch = window.matchMedia("(pointer:coarse)").matches;

  // ---------- Boot sequence ----------
  const boot = $("#bootScreen");
  const bootLog = $("#bootLog");
  const bootFill = $("#bootBarFill");
  const bootReady = $("#bootReady");
  const bootSeenKey = "vm-portfolio-boot-v2";
  const bootLines = [
    "INITIALIZING VASANTH.OS...",
    "Loading developer profile ██████████ 100%",
    "Loading skills ██████████ 100%",
    "Loading projects ██████████ 100%"
  ];

  const finishBoot = () => boot?.classList.add("done");
  if (reduce || sessionStorage.getItem(bootSeenKey)) {
    finishBoot();
  } else if (boot && bootLog && bootFill) {
    let i = 0;
    const next = () => {
      if (i < bootLines.length) {
        const line = document.createElement("div");
        line.className = "boot-line";
        line.innerHTML = i === 0 ? `<b>${bootLines[i]}</b>` : bootLines[i];
        bootLog.appendChild(line);
        bootFill.style.width = `${Math.round(((i + 1) / bootLines.length) * 100)}%`;
        i += 1;
        window.setTimeout(next, 150);
      } else {
        bootReady?.classList.add("show");
        sessionStorage.setItem(bootSeenKey, "1");
        window.setTimeout(finishBoot, 230);
      }
    };
    next();
  }

  // ---------- Navigation ----------
  const header = $("#header");
  const menu = $("#menuToggle");
  const nav = $("#navLinks");
  const progress = $("#scrollProgress");

  const closeMenu = () => {
    nav?.classList.remove("open");
    menu?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("aria-label", "Open navigation");
  };
  menu?.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $$(".nav-link", nav).forEach(link => link.addEventListener("click", closeMenu));

  let scrollTick = false;
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    header?.classList.toggle("scrolled", window.scrollY > 20);
    scrollTick = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTick) {
      requestAnimationFrame(updateScrollUI);
      scrollTick = true;
    }
  }, { passive: true });
  updateScrollUI();

  // ---------- Section reveal + active nav ----------
  const reveals = $$(".reveal");
  if (reduce) reveals.forEach(el => el.classList.add("in-view"));
  else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 25, 220)}ms`;
      revealObserver.observe(el);
    });
  }

  const sectionLinks = $$(".nav-link");
  const sections = $$("main section[id]");
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  sections.forEach(section => sectionObserver.observe(section));

  // ---------- Hero role transition (fade/morph, not type/delete) ----------
  const roleText = $("#roleText");
  const roles = ["Frontend Developer", "Web Creator", "CSE Student", "Freelance Developer"];
  let roleIndex = 0;
  if (!reduce && roleText) {
    window.setInterval(() => {
      roleText.style.opacity = "0";
      roleText.style.transform = "translateY(7px)";
      window.setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        roleText.textContent = roles[roleIndex];
        roleText.style.transform = "translateY(-7px)";
        requestAnimationFrame(() => {
          roleText.style.opacity = "1";
          roleText.style.transform = "translateY(0)";
        });
      }, 180);
    }, 2500);
  }

  // ---------- Lightweight particle field with pointer repulsion ----------
  const canvas = $("#particleCanvas");
  const ctx = canvas?.getContext("2d", { alpha: true });
  if (canvas && ctx && !reduce) {
    let width = 0, height = 0, dpr = 1, particles = [];
    const pointer = { x: -9999, y: -9999, active: false };
    const countFor = () => touch ? Math.min(22, Math.floor((window.innerWidth * window.innerHeight) / 26000)) : Math.min(56, Math.floor((window.innerWidth * window.innerHeight) / 20000));
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: countFor() }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14, r: Math.random() * 1.2 + .25 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10 || p.x > width + 10) p.vx *= -1;
        if (p.y < -10 || p.y > height + 10) p.vy *= -1;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < 16000 && d2 > 10) { const d = Math.sqrt(d2); const force = (1 - d / 126) * .018; p.x += (dx / d) * force * 12; p.y += (dy / d) * force * 12; }
        }
        ctx.fillStyle = "rgba(167,139,250,.38)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      const maxLink = touch ? 72 : 95;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < maxLink) {
            ctx.strokeStyle = `rgba(139,92,246,${(1 - d / maxLink) * .08})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize, { passive: true });
    if (finePointer) {
      window.addEventListener("pointermove", e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; }, { passive: true });
      window.addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
    }
  }

  // ---------- Desktop cursor ----------
  const cursorDot = $("#cursorDot"), cursorRing = $("#cursorRing"), cursorLabel = $("#cursorLabel");
  if (finePointer && !reduce && cursorDot && cursorRing) {
    let tx = innerWidth / 2, ty = innerHeight / 2, rx = tx, ry = ty;
    window.addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; cursorDot.style.left = `${tx}px`; cursorDot.style.top = `${ty}px`; }, { passive: true });
    const loop = () => { rx += (tx - rx) * .16; ry += (ty - ry) * .16; cursorRing.style.left = `${rx}px`; cursorRing.style.top = `${ry}px`; requestAnimationFrame(loop); };
    loop();
    $$('a,button,input,textarea,select,[tabindex="0"]').forEach(el => {
      el.addEventListener("pointerenter", () => cursorRing.classList.add("hover"));
      el.addEventListener("pointerleave", () => { cursorRing.classList.remove("hover", "labeled"); if (cursorLabel) cursorLabel.textContent = ""; });
      el.addEventListener("pointermove", () => {
        const label = el.dataset.cursor;
        if (label) { cursorRing.classList.add("labeled"); if (cursorLabel) cursorLabel.textContent = label; }
      });
    });
  }

  // ---------- Magnetic controls ----------
  if (finePointer && !reduce) {
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) * .08; const y = (e.clientY - r.top - r.height / 2) * .08; el.style.transform = `translate3d(${x}px,${y}px,0)`; });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // ---------- Playground ----------
  const codeInput = $("#codeInput"), frame = $("#previewFrame"), resetPlayground = $("#resetPlayground");
  const defaultCode = codeInput?.value || "";
  const renderPreview = () => {
    if (!codeInput || !frame) return;
    const escaped = codeInput.value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on[a-z]+\s*=\s*([\"']).*?\1/gi, "");
    const safeDoc = `<!doctype html><html><head><style>body{margin:0;padding:28px;background:#07090f;color:#f7f8fb;font-family:system-ui,sans-serif}.demo-card{max-width:480px;margin:auto;padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(145deg,#111827,#0b1018);box-shadow:0 20px 50px #0008}.demo-kicker{color:#a78bfa;font-size:10px;letter-spacing:.18em;font-weight:800}.demo-card h3{font-size:clamp(26px,5vw,40px);line-height:1;letter-spacing:-.05em;margin:10px 0}.demo-card p:last-child{color:#929dad;line-height:1.7}</style></head><body>${escaped}</body></html>`;
    frame.srcdoc = safeDoc;
  };
  codeInput?.addEventListener("input", renderPreview);
  resetPlayground?.addEventListener("click", () => { if (codeInput) codeInput.value = defaultCode; renderPreview(); });
  renderPreview();

  // ---------- Process line ----------
  const processTrack = $(".process-track"), processFill = $("#processLineFill");
  if (processTrack && processFill && !reduce) {
    const updateProcess = () => {
      const rect = processTrack.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewport * .78 - rect.top) / Math.max(rect.height * .7, 1)));
      processFill.style.width = `${progress * 100}%`;
    };
    window.addEventListener("scroll", updateProcess, { passive: true }); updateProcess();
  } else if (processFill) processFill.style.width = "100%";

  // ---------- Local time ----------
  const localTime = $("#localTime");
  const updateTime = () => { if (localTime) localTime.textContent = `Local time — ${new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date())}`; };
  updateTime(); window.setInterval(updateTime, 30000);

  // ---------- Command palette ----------
  const palette = $("#commandPalette"), commandInput = $("#commandInput"), commandList = $("#commandList");
  let paletteButtons = [], paletteIndex = 0, lastFocus = null;
  const getVisibleCommands = () => $$("button", commandList).filter(b => b.style.display !== "none");
  const openPalette = () => { if (!palette) return; lastFocus = document.activeElement; palette.classList.add("open"); palette.setAttribute("aria-hidden", "false"); commandInput.value = ""; $$("button", commandList).forEach(b => b.style.display = "grid"); paletteButtons = getVisibleCommands(); paletteIndex = 0; setSelected(); setTimeout(() => commandInput?.focus(), 20); };
  const closePalette = () => { if (!palette) return; palette.classList.remove("open"); palette.setAttribute("aria-hidden", "true"); lastFocus?.focus?.(); };
  const setSelected = () => { paletteButtons.forEach((b, i) => b.classList.toggle("selected", i === paletteIndex)); };
  const activateCommand = button => {
    if (!button) return;
    if (button.dataset.action === "terminal") { closePalette(); openTerminal(); return; }
    const target = $(button.dataset.target);
    if (target) { closePalette(); target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  };
  $$("#commandList button").forEach(button => button.addEventListener("click", () => activateCommand(button)));
  commandInput?.addEventListener("input", () => { const q = commandInput.value.trim().toLowerCase(); $$("#commandList button").forEach(b => b.style.display = !q || b.textContent.toLowerCase().includes(q) ? "grid" : "none"); paletteButtons = getVisibleCommands(); paletteIndex = 0; setSelected(); });
  commandInput?.addEventListener("keydown", e => { paletteButtons = getVisibleCommands(); if (e.key === "ArrowDown") { e.preventDefault(); paletteIndex = Math.min(paletteIndex + 1, paletteButtons.length - 1); setSelected(); } else if (e.key === "ArrowUp") { e.preventDefault(); paletteIndex = Math.max(paletteIndex - 1, 0); setSelected(); } else if (e.key === "Enter") { e.preventDefault(); activateCommand(paletteButtons[paletteIndex]); } });
  $("#navCommand")?.addEventListener("click", openPalette); $("#footerCommand")?.addEventListener("click", openPalette); $$('[data-close-palette]').forEach(el => el.addEventListener("click", closePalette));

  // ---------- Terminal Easter egg ----------
  const terminalDock = $("#terminalDock"), terminalForm = $("#terminalForm"), terminalInput = $("#terminalInput"), terminalOutput = $("#terminalOutput");
  const terminalCommands = {
    help: () => ["Available commands:", "about · projects · skills · contact · github · clear", "Try: sudo hire vasanth"],
    about: () => ["Vasanth M", "Frontend Web Developer · CSE Student", "Learning • Building • Shipping"],
    projects: () => ["01  My Portfolio Website", "A responsive, animated developer portfolio."],
    skills: () => ["Frontend: HTML5 · CSS3 · JavaScript · Responsive Design · UI Animation", "Learning: React · TypeScript · Next.js · GSAP"],
    contact: () => ["Email: vasanthm1504@gmail.com", "LinkedIn: linkedin.com/in/vasanth1504", "Phone: +91 7604838719"],
    github: () => ["GitHub is listed in the supplied skills/content, but no public profile URL was provided in the source files."],
    "sudo hire vasanth": () => ["✓ Request received.", "Let's build something great."],
    clear: () => []
  };
  const printTerminal = (lines, cls = "") => { if (!terminalOutput) return; lines.forEach(line => { const p = document.createElement("p"); p.className = cls; p.textContent = line; terminalOutput.appendChild(p); }); terminalOutput.scrollTop = terminalOutput.scrollHeight; };
  const openTerminal = () => { terminalDock?.classList.add("open"); terminalDock?.setAttribute("aria-hidden", "false"); if (terminalOutput && !terminalOutput.children.length) printTerminal(["Optional developer terminal — type 'help' to begin."], "muted"); setTimeout(() => terminalInput?.focus(), 20); };
  const closeTerminal = () => { terminalDock?.classList.remove("open"); terminalDock?.setAttribute("aria-hidden", "true"); };
  terminalForm?.addEventListener("submit", e => { e.preventDefault(); const command = terminalInput.value.trim().toLowerCase(); if (!command) return; printTerminal([`$ ${command}`]); const result = terminalCommands[command]; if (result) { const lines = result(); if (command === "clear") { terminalOutput.innerHTML = ""; } else printTerminal(lines, command.startsWith("sudo") ? "ok" : ""); } else printTerminal([`Command not found: ${command}`, "Type 'help' for available commands."], "muted"); terminalInput.value = ""; });
  $$('[data-close-terminal]').forEach(el => el.addEventListener("click", closeTerminal));

  // ---------- Keyboard shortcuts ----------
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette?.classList.contains("open") ? closePalette() : openPalette(); }
    if (e.key === "Escape") { closePalette(); closeTerminal(); }
    if (!palette?.classList.contains("open") && !terminalDock?.classList.contains("open") && e.key === "`" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { e.preventDefault(); openTerminal(); }
  });

  // ---------- Contact form: preserve original endpoint ----------
  const form = $("#inquiryForm"), status = $("#formStatus"), submit = $("#submitBtn");
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby099f5FmoeHSO7bAscWKtj_pxXxt7Ocen6yzNBU8qB2Cs4yqF9dr5ehrDpzvG2R3oJ/exec";
  form?.addEventListener("submit", async e => {
    e.preventDefault(); if (!submit) return; submit.disabled = true; if (status) { status.textContent = "Sending..."; status.className = "form-status"; }
    const data = new FormData(form), params = new URLSearchParams(); data.forEach((v, k) => params.append(k, v));
    try { await fetch(`${SCRIPT_URL}?${params.toString()}`, { method: "GET", mode: "no-cors" }); if (status) status.textContent = "Thanks! Your inquiry has been sent."; form.reset(); }
    catch { if (status) { status.textContent = "Please email me directly — the form could not connect."; status.className = "form-status error"; } }
    finally { submit.disabled = false; }
  });

  // ---------- Back to top + visibility title ----------
  $("#backTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "👋 Come back soon!" : "Vasanth M — Frontend Web Developer"; });
})();

/* =========================================================
   V4 ambient background motion
   ========================================================= */
(() => {
  const root = document.documentElement;
  const body = document.body;
  let ticking = false;

  const updateAmbient = () => {
    const y = window.scrollY || 0;
    root.style.setProperty('--scroll-glow', `${Math.min(y * -0.025, 0)}px`);

    const hero = document.querySelector('.hero-stage');
    if (hero && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const amount = Math.min(y * 0.035, 18);
      hero.style.setProperty('--ambient-shift', `${amount}px`);
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateAmbient);
      ticking = true;
    }
  }, { passive: true });

  updateAmbient();
})();
