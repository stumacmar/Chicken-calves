(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Nav: scrolled state, mobile menu, active link */
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 30), { passive: true });
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$("a", navLinks).forEach(a => a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$("a", navLinks).forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => sectionObs.observe(s));

  /* Reveal on scroll */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealObs.observe(el);
  });

  /* Count-up stats */
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || "";
      const start = performance.now(), dur = reduceMotion ? 0 : 1400;
      const tick = now => {
        const p = dur ? Math.min((now - start) / dur, 1) : 1;
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObs.unobserve(el);
    });
  });
  $$("[data-count]").forEach(el => countObs.observe(el));

  /* Anatomy */
  const muscles = {
    gastro: {
      name: "Gastrocnemius",
      latin: "The diamond. The show muscle.",
      body: "The two-headed muscle at the top of the calf that makes the diamond shape. It crosses the knee, so it works hardest when your leg is straight.",
      rows: [["Best with", "Straight knee: standing, leg-press and donkey calf raises"], ["Fibre type", "Mixed, with plenty of fast-twitch fibres. Responds to heavy loads and hard sets."], ["Guru cue", "“Lock the knee, drop the heel, sit in the stretch.”"]]
    },
    soleus: {
      name: "Soleus",
      latin: "The engine underneath.",
      body: "A broad, flat muscle under the gastrocnemius that adds width and thickness to the lower calf. It doesn't cross the knee, so it takes over when the knee is bent.",
      rows: [["Best with", "Bent knee: seated calf raises, bent-knee raises on a step"], ["Fibre type", "Mostly slow-twitch. Handles high reps and long time under tension."], ["Guru cue", "“Bend the knee, slow it down, chase the burn.”"]]
    }
  };
  const svg = $("#calfSvg"), info = $("#muscleInfo");
  const showMuscle = key => {
    const m = muscles[key];
    svg.dataset.active = key;
    $$(".seg button").forEach(b => b.setAttribute("aria-selected", b.dataset.muscle === key));
    info.setAttribute("aria-labelledby", "tab-" + key);
    info.innerHTML = `<div class="fade-in"><h3>${m.name}</h3><p class="latin">${m.latin}</p><p>${m.body}</p>
      <dl>${m.rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`;
  };
  $$(".seg button").forEach(b => b.addEventListener("click", () => showMuscle(b.dataset.muscle)));
  showMuscle("gastro");

  /* Program */
  const program = [
    {
      goal: "Learn the movement and build up your Achilles tendon. No bouncing, and every rep starts from a pause.",
      ex: [
        ["Standing calf raise", "Off a step, straight knee", "3", "12–15", "2s pause at the bottom"],
        ["Seated calf raise", "Or bent-knee raise on a step", "2", "15–20", "Slow, constant tension"],
        ["Tibialis raise", "Back against a wall", "2", "15–20", "Balances the shin"]
      ]
    },
    {
      goal: "Spend more time in the stretch. Every last set ends with lengthened partials to failure.",
      ex: [
        ["Leg-press calf raise", "Deep stretch at the bottom", "4", "10–12", "+ bottom-half partials to failure"],
        ["Single-leg standing raise", "Dumbbell in one hand", "3", "8–12", "3s lower"],
        ["Seated calf raise", "Heavy", "3", "12–15", "Pause at the top"]
      ]
    },
    {
      goal: "Peak volume with 12–16 hard weekly sets. Go past failure and keep the reps strict.",
      ex: [
        ["Smith or machine standing raise", "Heaviest load you can control", "4", "8–10", "+ partials past failure"],
        ["Donkey calf raise", "Hips hinged, maximum stretch", "3", "10–15", "2s pause in the stretch"],
        ["Seated calf raise", "Drop set on the final set", "3", "15–20", "Burn finisher"]
      ]
    }
  ];
  const phaseBody = $("#phaseBody");
  const showPhase = i => {
    const p = program[i];
    $$(".phases button").forEach(b => b.setAttribute("aria-selected", +b.dataset.phase === i));
    phaseBody.innerHTML = `<div class="fade-in"><p class="goal">${p.goal}</p>
      <table class="exercise-table"><thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Technique</th></tr></thead><tbody>
      ${p.ex.map(([n, d, s, r, t]) => `<tr><td>${n}<small>${d}</small></td><td data-label="Sets">${s}</td><td data-label="Reps">${r}</td><td data-label="Technique">${t}</td></tr>`).join("")}
      </tbody></table></div>`;
  };
  $$(".phases button").forEach(b => b.addEventListener("click", () => showPhase(+b.dataset.phase)));
  showPhase(0);

  /* Tempo coach */
  const C = 540.35;
  const phases = [
    { label: "Up", sub: "Drive through the big toe", ms: 2000, color: "#d0642f", heel: -46 },
    { label: "Squeeze", sub: "Hold at the very top", ms: 1000, color: "#e8834a", heel: -46 },
    { label: "Down", sub: "Lower under control", ms: 2000, color: "#b3a896", heel: 0 },
    { label: "Stretch", sub: "Sit in it. No bounce.", ms: 2000, color: "#a9b84a", heel: 0 }
  ];
  const tempoBtn = $("#tempoBtn"), dialFg = $("#dialFg"), phaseLabel = $("#phaseLabel"),
    phaseSub = $("#phaseSub"), repCount = $("#repCount"), heel = $("#heel");
  let running = false, raf = 0;
  const resetTempo = (label = "Ready", sub = "Heels below the step") => {
    running = false;
    cancelAnimationFrame(raf);
    tempoBtn.textContent = "Start a set";
    phaseLabel.textContent = label;
    phaseSub.textContent = sub;
    dialFg.style.strokeDashoffset = C;
    heel.style.transform = "";
  };
  tempoBtn.addEventListener("click", () => {
    if (running) return resetTempo("Paused", "Shake it out and go again");
    running = true;
    tempoBtn.textContent = "Stop";
    let rep = 0, pi = 0, phaseStart = performance.now();
    repCount.textContent = 0;
    const enter = () => {
      const p = phases[pi];
      phaseLabel.textContent = p.label;
      phaseSub.textContent = p.sub;
      dialFg.style.stroke = p.color;
      heel.style.transform = `translateY(${p.heel}px)`;
    };
    enter();
    const loop = now => {
      if (!running) return;
      const p = phases[pi];
      const t = Math.min((now - phaseStart) / p.ms, 1);
      dialFg.style.strokeDashoffset = C * (1 - t);
      if (t >= 1) {
        pi++;
        if (pi === phases.length) {
          pi = 0;
          repCount.textContent = ++rep;
          if (rep >= 12) return resetTempo("Done", "Now add partials until failure");
        }
        phaseStart = now;
        enter();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });

  /* Plan builder */
  const daysInput = $("#days"), daysOut = $("#daysOut");
  daysInput.addEventListener("input", () => (daysOut.textContent = daysInput.value));
  const lib = {
    home: {
      straight: ["Single-leg calf raise off a step", "Double-leg calf raise off a stair, backpack loaded"],
      bent: ["Bent-knee calf raise off a step", "Wall-sit calf raise"],
      extra: "Tibialis wall raise"
    },
    dumbbell: {
      straight: ["Single-leg dumbbell calf raise", "Goblet-hold calf raise off a plate stack"],
      bent: ["Dumbbell-on-knees seated raise", "Bent-knee single-leg raise"],
      extra: "Dumbbell tibialis raise"
    },
    gym: {
      straight: ["Standing machine calf raise", "Leg-press calf raise", "Smith machine calf raise"],
      bent: ["Seated calf raise machine"],
      extra: "Donkey calf raise"
    }
  };
  const levels = {
    chicken: { title: "Operation: Drumstick", weekly: 8, reps: "12–15", note: "Start conservatively, because your Achilles tendon needs a few weeks to catch up. Add one set per week as long as nothing feels sore." },
    average: { title: "Operation: Diamond", weekly: 12, reps: "10–15", note: "Twelve hard sets a week is the sweet spot from the volume research. End your last straight-knee set with lengthened partials." },
    cow: { title: "Operation: Bovine", weekly: 16, reps: "8–12", note: "You're advanced, so go past failure. Finish your last two sets with stretched partials until you can't lift your heel." }
  };
  $("#builderForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const lv = levels[f.get("level")], eq = lib[f.get("equip")], days = +f.get("days");
    const perDay = Math.max(3, Math.round(lv.weekly / days));
    let total = 0;
    const dayNames = ["Day A", "Day B", "Day C", "Day D"];
    const plan = Array.from({ length: days }, (_, i) => {
      const straight = eq.straight[i % eq.straight.length];
      const bent = eq.bent[i % eq.bent.length];
      const sSets = Math.ceil(perDay * 0.6), bSets = Math.max(2, perDay - sSets);
      total += sSets + bSets;
      const items = [
        `${straight} <span>· ${sSets} × ${lv.reps}, 2s pause in the stretch</span>`,
        `${bent} <span>· ${bSets} × 15–20, slow tempo</span>`
      ];
      if (i % 2 === 1 || days === 1) items.push(`${eq.extra} <span>· 2 × 15</span>`);
      return `<div class="plan-day"><h4>${dayNames[i]}</h4><ul>${items.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
    }).join("");
    $("#builderResult").innerHTML = `<div class="fade-in">
      <div class="plan-head"><img src="assets/guru-face.jpg" alt=""><div><h3>${lv.title}</h3><p>${total} hard sets a week · ${days} day${days > 1 ? "s" : ""}</p></div></div>
      <div class="plan-days">${plan}</div>
      <p class="plan-note">“${lv.note}” — The Guru</p></div>`;
    if (matchMedia("(max-width: 860px)").matches) $("#builderResult").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  /* Join */
  $("#joinForm").addEventListener("submit", e => {
    e.preventDefault();
    $("#joinMsg").textContent = "You're in. The Guru has noticed you. Go do some calf raises.";
    e.target.reset();
  });
})();

/* Proof pins: tap to toggle on touch screens */
document.querySelectorAll(".pin").forEach(pin => pin.addEventListener("click", () => {
  const on = !pin.classList.contains("on");
  document.querySelectorAll(".pin").forEach(p => p.classList.remove("on"));
  pin.classList.toggle("on", on);
}));
