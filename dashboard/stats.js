/* Rally Studio · Resumen de partida
   Renderiza dashboard/data/stats.generated.js, calculado desde el proyecto.
   No hay telemetría de demostración ni mezcla silenciosa de fuentes. */
(() => {
  "use strict";

  const data = window.RALLY_STATS;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);
  const captureMode = params.has("capture") || params.has("snapshot") || navigator.webdriver;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

  const nf = (value, digits = 0) => Number(value || 0).toLocaleString("es-NI", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const setHTML = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  };

  const svgUse = (id, className = "icon") =>
    `<svg class="${className}" aria-hidden="true" focusable="false"><use href="#${id}"></use></svg>`;

  const iconMap = {
    clock: "i-clock",
    shield: "i-shield",
    leaf: "i-leaf",
    spark: "i-spark",
    alert: "i-alert",
    check: "i-check"
  };

  const state = {
    selectedBar: 0,
    tooltipVisible: false,
    live: null
  };

  function showFatal(message) {
    document.body.classList.add("is-empty");
    setText("hero-meta", "Sin datos de sesión");
    setText("hero-title", "La partida, sin datos.");
    setText("hero-lede", message);
    setText("score-label", "sin cálculo");
    setText("score-note-text", "ejecuta el generador");
    setText("score-note-tag", "pendiente");
    setText("mode-label", "Sin datos");
    setText("mode-short", "sin datos");
    const chip = $("#mode-chip");
    if (chip) chip.classList.remove("is-real");
    $$(".block, .mvp-band, .closing").forEach((el) => el.classList.add("reveal", "is-visible"));
  }

  function renderPhase() {
    const hours = Number(data.session.hours_remaining || 0);
    const phase = data.phase || (hours <= 0 ? "final" : hours <= 1 ? "t-1h" : "mid");
    const banner = $("#phase-banner");
    if (!banner) return;
    if (phase === "mid") {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    banner.dataset.phase = phase;
    if (phase === "final") {
      setText("phase-kicker", "Cierre");
      setText("phase-title", "Resumen final generado automáticamente");
      setText("phase-copy", "La sesión terminó. Este resumen queda como evidencia de lo que se movió, lo que quedó abierto y lo que conviene repetir.");
    } else {
      setText("phase-kicker", "T-1 h");
      setText("phase-title", "Queda una hora: resumen generado automáticamente");
      setText("phase-copy", "Es la última lectura completa antes del cierre. Revisa los frentes abiertos y decide qué se congela.");
    }
  }

  function renderIdentity() {
    const s = data.session;
    const h = data.headline;
    const rally = s.rally_type === "nacional"
      ? "Rally Nacional 2026"
      : s.rally_type === "latam"
        ? "Rally Latam 2026"
        : "Rally Studio";
    const project = s.project_name || "Tu proyecto";
    const team = s.team_name || "Tu equipo";
    const challenge = s.challenge_title || "Reto sin registrar";

    const idle = data.phase === "idle";
    document.title = `${project} · Resumen de partida — Rally Studio`;
    const meta = $("#meta-description");
    if (meta) {
      meta.setAttribute("content", idle
        ? `${project} — ${team}: sin sesión activa.`
        : `${project} — ${team}: ${nf(h.elapsed_h, 1)} h transcurridas, ${nf(h.deliverables_done)} de ${nf(h.deliverables_total)} entregables, ${nf(h.critical_count)} frentes abiertos.`);
    }

    setText("hero-meta", `${rally} · ${idle ? "sin sesión" : `${nf(s.duration_h)} h`} · ${s.city || "Ciudad sin registrar"}`);
    const hero = $(".hero");
    if (hero) hero.dataset.duration = nf(s.duration_h);
    setHTML("hero-title", `${esc(project)},<br>en datos.`);
    const challengeLine = s.challenge_title
      ? `Reto ${s.challenge_id || "—"} · ${challenge}.`
      : "Reto sin registrar.";
    const progressLine = idle
      ? "La partida todavía no ha arrancado."
      : Number(s.duration_h) > 0
        ? `${nf(h.elapsed_h, 1)} h transcurridas de ${nf(s.duration_h)}; ${nf(h.deliverables_done)} de ${nf(h.deliverables_total)} entregables cerrados.`
        : "La sesión todavía no tiene una ventana de horas.";
    setText("hero-lede", `${challengeLine} ${progressLine}`);
    setText("hero-solution", s.solution_simple || s.solution || "La solución todavía no está escrita en la sesión.");
    setText("footer-date", s.date_label || "—");

    const id = $("#hero-id");
    if (id) {
      id.innerHTML = [team, s.university, s.city]
        .filter(Boolean)
        .map((item) => `<span>${esc(item)}</span>`)
        .join("");
    }

    const score = Number(h.readiness || 0);
    const scoreEl = $("#score-number");
    if (scoreEl) {
      scoreEl.dataset.count = String(score);
      scoreEl.dataset.target = String(score);
    }
    setText("score-label", "índice de preparación");
    setText("score-note-text", idle
      ? "sin sesión · 0/100"
      : `${score}/100 · ${nf(h.deliverables_done)}/${nf(h.deliverables_total)} entregables`);
    setText("score-note-tag", "calculado");
    const scoreBox = $("#hero-score");
    if (scoreBox) {
      scoreBox.setAttribute("aria-label", `Índice de preparación: ${score} sobre 100. ${nf(h.deliverables_done)} de ${nf(h.deliverables_total)} entregables cerrados.`);
    }
    const orbit = $("#orbit-accent");
    if (orbit) {
      orbit.style.strokeDasharray = `${Math.max(2, score)} 100`;
      orbit.style.strokeDashoffset = "0";
    }

    const values = {
      duration: s.duration_h,
      deliverables: h.deliverables_done,
      pautado: h.pautado_sections,
      readiness: h.readiness
    };
    $$("[data-stat]").forEach((el) => {
      const key = el.dataset.stat;
      if (values[key] === undefined) return;
      el.dataset.count = String(values[key]);
    });
    const dens = {
      deliverables: `/${nf(h.deliverables_total)}`,
      pautado: `/${nf(h.pautado_total)}`,
      readiness: "/100"
    };
    $$("[data-den]").forEach((el) => {
      if (dens[el.dataset.den]) el.textContent = dens[el.dataset.den];
    });

    const chip = $("#mode-chip");
    if (chip) {
      chip.classList.add("is-real");
      setText("mode-label", data._meta && data._meta.simulated ? "Demo · datos simulados" : "Sesión real · calculado");
      setText("mode-short", data._meta && data._meta.simulated ? "demo" : "real");
    }
    renderPhase();
  }

  function renderParade() {
    const list = $("#parade-list");
    if (!list) return;
    const people = Array.isArray(data.people) ? data.people : [];
    const placeholders = Array.isArray(data.placeholders) ? data.placeholders : [];
    list.innerHTML = [
      ...people.map((person, index) => `
        <li class="parade-item${person.mvp ? " is-mvp" : ""}" style="--i:${index}" title="${esc(person.name)} · ${esc(person.role)}">
          <img src="${esc(person.avatar)}" alt="Avatar ilustrativo de ${esc(person.name)}" width="48" height="48">
          <span>${esc(person.name.split(" ")[0])}</span>
        </li>
      `),
      ...placeholders.map((person, index) => `
        <li class="parade-item is-placeholder" style="--i:${people.length + index}" title="${esc(person.name)}">
          <img src="${esc(person.avatar || "assets/stats/avatar-empty.svg")}" alt="" width="48" height="48">
          <span>${esc(person.name || "Sin registro")}</span>
        </li>
      `)
    ].join("");
    const registered = Number((data.roster_gap || {}).registered ?? people.length);
    const declared = Number((data.roster_gap || {}).declared ?? people.length + placeholders.length);
    setText("parade-note", registered
      ? `${nf(registered)} de ${nf(declared)} con registro`
      : "Sin integrantes registrados");
  }

  function peakSummary() {
    const rhythm = data.rhythm || {};
    const note = String(rhythm.peak_note || "");
    const names = (data.people || [])
      .filter((person) => note.includes(person.name))
      .map((person) => person.name.split(" ")[0]);
    let who = "";
    if (names.length === 1) who = names[0];
    else if (names.length === 2) who = `${names[0]} y ${names[1]}`;
    else if (names.length > 2) who = `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
    return {
      names,
      text: who
        ? `${who} movieron ${nf(rhythm.peak_count)} frentes en esa hora.`
        : `${nf(rhythm.peak_count)} señales registradas en esa hora.`
    };
  }

  function renderRhythm() {
    const rhythm = data.rhythm || {};
    const hours = Array.isArray(rhythm.hours) ? rhythm.hours : [];
    const peak = String(rhythm.peak_hour || "—").split(":");
    const summary = peakSummary();

    setText("rhythm-title", "La partida, hora por hora");
    setText("rhythm-copy", `${nf((data.headline || {}).signals)} señales en ${nf((data.session || {}).duration_h)} h. El pico es ${rhythm.peak_hour || "—"}, calculado con los movimientos registrados.`);
    setText("peak-hour", peak[0] || "—");
    setText("peak-minute", peak[1] || "—");
    setText("peak-note", hours.length ? summary.text : "Todavía no hay señales registradas.");
    setText("peak-people", `${summary.names.length || (data.people || []).length} personas con señal`);
    setText("peak-frentes", `${nf(rhythm.peak_count)} señales`);
    setText("chart-caption", `Señales registradas por hora · ${(data.session || {}).date_label || "—"}`);
    setText("chart-key-label", `${nf(rhythm.threshold)}% del pico`);
    setText("chart-day-1", hours[0] ? `${hours[0].day} ${hours[0].date}` : "—");
    setText("chart-day-2", hours[hours.length - 1] ? `${hours[hours.length - 1].day} ${hours[hours.length - 1].date}` : "—");

    const bars = $("#rhythm-bars");
    const axis = $("#chart-axis");
    if (!bars || !axis) return;

    const active = hours.filter((hour) => Number(hour.count) > 0).length;
    const future = hours.filter((hour) => hour.future).length;
    const threshold = Number(rhythm.threshold || 50);
    const max = Math.max(1, ...hours.map((hour) => Number(hour.value) || 0));
    const peakIndex = hours.findIndex((hour) => hour.label === peak[0] && !hour.future);

    bars.innerHTML = hours.map((hour, index) => {
      const value = Number(hour.value) || 0;
      const isPeak = !hour.future && (value === max || index === peakIndex);
      let cls = "zero";
      if (hour.future) cls = "future";
      else if (isPeak) cls = "peak";
      else if (value > 0 && value >= threshold) cls = "high";
      else if (value > 0) cls = "low";
      const note = hour.future ? "Aún no ocurre" : Number(hour.count) > 0 ? hour.note : "Sin señales registradas";
      return `
        <div class="bar ${cls}" role="presentation" aria-hidden="true"
          style="--v:${value};--i:${index}"
          data-index="${index}" data-hour="${esc(hour.label)}" data-day="${esc(hour.day)}" data-date="${esc(hour.date)}"
          data-count="${Number(hour.count) || 0}" data-value="${value}" data-note="${esc(note)}">
          ${isPeak ? `<span class="bar-bolt" aria-hidden="true">${svgUse("i-bolt")}</span>` : ""}
        </div>
      `;
    }).join("");

    axis.innerHTML = hours.map((hour, index) => {
      const show = index % 4 === 0 || index === hours.length - 1;
      const midnight = hour.label === "00";
      return `<span class="${midnight ? "is-midnight" : ""}">${show ? esc(hour.label) : ""}</span>`;
    }).join("");

    const thresholdLine = $("#threshold-line");
    if (thresholdLine) thresholdLine.style.bottom = `${threshold}%`;
    setText("threshold-label", `${threshold}%`);

    const chart = $("#rhythm-chart");
    if (chart) {
      chart.setAttribute("aria-label", `Gráfico de ${hours.length} horas, de ${hours[0] ? hours[0].label : "—"}:00 del ${hours[0] ? hours[0].date : "—"} a ${hours[hours.length - 1] ? hours[hours.length - 1].label : "—"}:00 del ${hours[hours.length - 1] ? hours[hours.length - 1].date : "—"}. Pico a las ${rhythm.peak_hour || "—"} con ${nf(rhythm.peak_count)} señales. ${active} horas con señal y ${future} por delante. Usa las flechas izquierda y derecha para recorrer las horas.`);
    }

    setText("chart-foot", hours.length
      ? `${active} horas con señal · ${future} horas por delante. Cada barra es una hora; las horas futuras quedan en línea base.`
      : "Todavía no hay horas registradas para este proyecto.");

    setHTML("chart-table", `
      <table class="chart-table">
        <caption>Señales registradas por hora</caption>
        <thead><tr><th scope="col">Día</th><th scope="col">Hora</th><th scope="col">Señales</th><th scope="col">Detalle</th></tr></thead>
        <tbody>
          ${hours.map((hour) => `
            <tr${hour.future ? ' class="is-future"' : ""}>
              <td>${esc(hour.day)} ${esc(hour.date)}</td>
              <td>${esc(hour.label)}:00</td>
              <td>${nf(hour.count)}</td>
              <td>${esc(hour.future ? "Aún no ocurre" : Number(hour.count) > 0 ? hour.note : "Sin señales")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `);

    state.selectedBar = peakIndex >= 0 ? peakIndex : 0;
    bindChart();
  }

  function tooltipFor(index) {
    const bar = $(`.bar[data-index="${index}"]`);
    if (!bar) return null;
    return {
      bar,
      hour: bar.dataset.hour,
      day: bar.dataset.day,
      date: bar.dataset.date,
      count: bar.dataset.count,
      value: bar.dataset.value,
      note: bar.dataset.note
    };
  }

  function positionTooltip(tip) {
    const tooltip = $("#chart-tooltip");
    if (!tooltip || !tip) return;
    const rect = tip.bar.getBoundingClientRect();
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    const tipRect = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.top - tipRect.height - 12;
    left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, left));
    if (top < 8) top = rect.bottom + 12;
    if (top + tipRect.height > window.innerHeight - 8) top = window.innerHeight - tipRect.height - 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showTooltip(index) {
    const tip = tooltipFor(index);
    const tooltip = $("#chart-tooltip");
    if (!tip || !tooltip) return;
    state.selectedBar = index;
    $$(".bar.is-selected").forEach((bar) => bar.classList.remove("is-selected"));
    tip.bar.classList.add("is-selected");
    tooltip.innerHTML = `<strong>${esc(tip.day)} ${esc(tip.date)} · ${esc(tip.hour)}:00</strong><span>${nf(tip.count)} señales</span><span>${esc(tip.note)}</span>`;
    tooltip.classList.add("is-visible");
    tooltip.setAttribute("aria-hidden", "false");
    state.tooltipVisible = true;
    positionTooltip(tip);
    requestAnimationFrame(() => positionTooltip(tip));
    if (state.live) {
      state.live.textContent = `${tip.day} ${tip.date}, ${tip.hour}:00, ${nf(tip.count)} señales. ${tip.note}`;
    }
  }

  function hideTooltip() {
    const tooltip = $("#chart-tooltip");
    if (tooltip) {
      tooltip.classList.remove("is-visible");
      tooltip.setAttribute("aria-hidden", "true");
    }
    state.tooltipVisible = false;
    $$(".bar.is-selected").forEach((bar) => bar.classList.remove("is-selected"));
  }

  function repositionTooltip() {
    if (!state.tooltipVisible) return;
    const tip = tooltipFor(state.selectedBar);
    if (tip) positionTooltip(tip);
  }

  function bindChart() {
    const chart = $("#rhythm-chart");
    if (!chart) return;

    if (chart.dataset.bound !== "1") {
      chart.dataset.bound = "1";
      const wrap = $(".chart-wrap");
      if (wrap && !$("#chart-live")) {
        state.live = document.createElement("p");
        state.live.id = "chart-live";
        state.live.className = "sr-only";
        state.live.setAttribute("aria-live", "polite");
        wrap.appendChild(state.live);
      }
      chart.addEventListener("focus", () => showTooltip(state.selectedBar));
      chart.addEventListener("blur", hideTooltip);
      chart.addEventListener("keydown", (event) => {
        const total = $$(".bar", chart).length;
        if (!total) return;
        let next = state.selectedBar;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = Math.min(total - 1, next + 1);
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = Math.max(0, next - 1);
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = total - 1;
        else return;
        event.preventDefault();
        showTooltip(next);
      });
    }

    $$(".bar", chart).forEach((bar) => {
      const index = Number(bar.dataset.index);
      bar.addEventListener("mouseenter", () => showTooltip(index));
      bar.addEventListener("mouseleave", hideTooltip);
      bar.addEventListener("click", () => showTooltip(index));
    });
  }

  function burstSvg(index) {
    const points = [];
    for (let i = 0; i < 24; i += 1) {
      const radius = i % 2 === 0 ? 30 : 21;
      const angle = (Math.PI / 12) * i - Math.PI / 2;
      points.push(`${(32 + radius * Math.cos(angle)).toFixed(2)},${(32 + radius * Math.sin(angle)).toFixed(2)}`);
    }
    return `
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <polygon class="burst-fill" points="${points.join(" ")}"/>
        <text class="burst-num" x="32" y="38" text-anchor="middle">${index + 1}</text>
      </svg>
    `;
  }

  function renderCritical() {
    const list = $("#critical-list");
    if (!list) return;
    const critical = Array.isArray(data.critical) ? data.critical : [];
    const total = Number((data.headline || {}).critical_count || critical.length);
    if (!critical.length) {
      const idle = data.phase === "idle";
      setText("critical-title", idle ? "Sin sesión activa" : "Sin frentes críticos abiertos");
      setText("critical-copy", idle
        ? "Cuando arranque la partida, este espacio muestra las brechas reales de la sesión."
        : "La sesión no tiene brechas registradas en este momento. Sigue así y vuelve a generar el resumen al cierre.");
      list.innerHTML = `<li class="critical-empty">${idle ? "Todavía no hay una partida en curso." : "No hay nada bloqueando la partida ahora mismo."}</li>`;
      return;
    }
    setText("critical-title", "Los frentes que siguen abiertos");
    setText(
      "critical-copy",
      critical.length < total
        ? `${nf(critical.length)} de ${nf(total)} frentes requieren una decisión. No son una derrota: son el mapa de la siguiente hora.`
        : `${nf(total)} frentes requieren una decisión. No son una derrota: son el mapa de la siguiente hora.`
    );
    list.innerHTML = critical.map((item, index) => `
      <li class="critical-item">
        <span class="critical-burst">${burstSvg(index)}</span>
        <div class="critical-time">
          <span>${esc(item.time)}</span>
          <span class="critical-severity">${item.severity === "alta" ? "alta" : "media"}</span>
        </div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.desc)}</p>
        <span class="critical-resolution is-open">${svgUse("i-arrow")}${esc(item.action || item.status || "Revisar")}</span>
      </li>
    `).join("");
  }

  function renderMvp() {
    const band = $(".mvp-band");
    if (!band) return;
    if (!data.mvp || !data.mvp.name) {
      band.hidden = true;
      return;
    }
    band.hidden = false;
    setText("mvp-badge", data.mvp.badge || "Mayor carga registrada");
    setText("mvp-note", "calculado");
    setText("mvp-title", data.mvp.name);
    setText("mvp-role", data.mvp.role);
    setText("mvp-reason", data.mvp.reason);
    setText("mvp-frentes", nf(data.mvp.frentes));
    setText("mvp-signals", nf(data.mvp.signals));
    setText("mvp-coverage", nf(data.mvp.coverage));
    const avatar = $("#mvp-avatar");
    if (avatar) {
      avatar.src = data.mvp.avatar || "assets/stats/avatar-empty.svg";
      avatar.alt = `Avatar ilustrativo de ${data.mvp.name}`;
    }
  }

  function renderRoster() {
    const body = $("#roster-body");
    const table = $("#roster-table");
    if (!body || !table) return;
    const people = Array.isArray(data.people) ? data.people : [];
    const placeholders = Array.isArray(data.placeholders) ? data.placeholders : [];
    const gap = data.roster_gap || {};
    setText("roster-copy", `${nf(gap.registered || people.length)} integrantes con asignaciones registradas. ${nf(gap.declared || people.length + placeholders.length)} declarados en la sesión.`);
    setText("roster-gap", gap.note || "");

    const rows = [
      ...people.map((person, index) => ({ ...person, kind: "person", index })),
      ...placeholders.map((person, index) => ({ ...person, kind: "placeholder", index: people.length + index }))
    ];

    if (!rows.length) {
      body.innerHTML = `<div class="roster-empty" role="row"><span role="cell">Todavía no hay integrantes registrados en esta sesión.</span></div>`;
      table.setAttribute("aria-rowcount", "2");
      table.setAttribute("aria-colcount", "5");
      return;
    }

    body.innerHTML = rows.map((person, index) => {
      const isPlaceholder = person.kind === "placeholder";
      const isMvp = Boolean(person.mvp);
      return `
        <div class="roster-row${isMvp ? " is-mvp" : ""}${isPlaceholder ? " is-placeholder" : ""}${index === rows.length - 1 ? " is-last" : ""}"
          role="row" aria-rowindex="${index + 2}">
          <span class="rank" role="cell">${isPlaceholder ? "—" : String(person.rank || index + 1).padStart(2, "0")}</span>
          <div class="player-cell" role="cell">
            <img class="player-avatar" src="${esc(person.avatar || "assets/stats/avatar-empty.svg")}" alt="${isPlaceholder ? "" : `Avatar ilustrativo de ${esc(person.name)}`}" width="44" height="44" loading="lazy">
            <div>
              <div class="player-name">${esc(person.name || "Integrante sin registro")}${isMvp ? `<span class="mvp-star" aria-label="Mayor carga registrada">${svgUse("i-star")}</span>` : ""}</div>
              <div class="mobile-role">${esc(person.role || "Sin asignaciones")}</div>
            </div>
          </div>
          <span class="role-cell" role="cell">${esc(person.role || "Sin asignaciones")}</span>
          <div class="player-stats" role="cell" aria-label="${nf(person.frentes)} frentes, ${nf(person.signals)} señales, ${nf(person.coverage)}% de carga">
            <span class="metric">
              <span class="metric-num">${nf(person.frentes)}</span>
              <span class="metric-sub">frentes</span>
              <span class="mini-bar" aria-hidden="true"><span style="--w:${Math.max(0, Math.min(100, Number(person.coverage) || 0))}%"></span></span>
            </span>
            <span class="metric">
              <span class="metric-num">${nf(person.signals)}</span>
              <span class="metric-sub">señales</span>
            </span>
            <span class="metric">
              <span class="metric-num">${nf(person.coverage)}<span class="metric-pct">%</span></span>
              <span class="metric-sub">carga</span>
            </span>
          </div>
          <span class="superpower" role="cell"><span class="tag-dot" aria-hidden="true"></span>${esc(person.tag || "Sin señal")}</span>
        </div>
      `;
    }).join("");

    table.setAttribute("aria-rowcount", String(rows.length + 1));
    table.setAttribute("aria-colcount", "5");
  }

  function renderSplit() {
    const stack = $("#stack-bar");
    const legend = $("#split-legend");
    const achievements = $("#achievements");
    if (!stack || !legend || !achievements) return;
    const split = Array.isArray(data.time_split) ? data.time_split : [];
    stack.setAttribute("aria-label", split.map((item) => `${item.label}: ${Number(item.pct)}%`).join(", "));
    stack.innerHTML = split.map((item, index) => `
      <span class="stack-seg" style="--w:${Number(item.pct)}%;background:${esc(item.color)};--i:${index}" title="${esc(item.label)}: ${Number(item.pct)}%"></span>
    `).join("");
    legend.innerHTML = split.map((item) => `
      <li>
        <span class="legend-swatch" style="background:${esc(item.color)}"></span>
        <span class="legend-label">${esc(item.label)}</span>
        <span class="legend-pct">${Number(item.pct)}%</span>
      </li>
    `).join("");

    const list = Array.isArray(data.achievements) ? data.achievements : [];
    achievements.innerHTML = list.length
      ? list.map((item) => `
        <li class="achievement">
          <span class="achievement-icon" aria-hidden="true">${svgUse(iconMap[item.icon] || "i-spark")}</span>
          <div>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.desc)}</p>
          </div>
        </li>
      `).join("")
      : `<li class="achievement"><span class="achievement-icon" aria-hidden="true">${svgUse("i-spark")}</span><div><h3>Sin logros registrados</h3><p>Cuando la sesión registre entregables o material, aparecerán aquí.</p></div></li>`;
  }

  function renderClosing() {
    const h = data.headline || {};
    const hours = Number(h.hours_remaining || 0);
    const critical = Array.isArray(data.critical) ? data.critical : [];
    const next = critical[0] && critical[0].action ? critical[0].action : "Cerrar los frentes abiertos y congelar lo que ya está listo.";
    const idle = data.phase === "idle" || !Number(h.duration_h);
    const final = data.phase === "final" || hours <= 0;
    let line;
    if (idle) {
      line = `Sin sesión activa. <span id="closing-sub">Cuando arranque la partida, este resumen se llena solo.</span>`;
    } else if (final) {
      line = `La sesión cerró. <span id="closing-sub">El resumen queda como evidencia de lo que se movió y lo que sigue abierto.</span>`;
    } else {
      line = `Quedan ${nf(hours, 1)} h. <span id="closing-sub">Siguiente frente: ${esc(next)}</span>`;
    }
    setHTML("closing-line", line);
  }

  function renderProvenance() {
    const h = data.headline || {};
    const s = data.session || {};
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
    const parts = Array.isArray(h.readiness_parts) ? h.readiness_parts : [];
    const generated = (data._meta || {}).generated_at || "—";
    setText("provenance-copy", `Calculado desde la sesión y los archivos del proyecto: ${nf(h.deliverables_done)}/${nf(h.deliverables_total)} entregables, ${nf(h.pautado_sections)}/${nf(h.pautado_total)} secciones de pautado, ${nf(h.script_acts)}/${nf(h.script_total)} actos de guion y ${nf(h.signals)} señales. Los avatares son ilustrativos.`);
    setText("footer-real", `${generated} · ${nf(h.signals)} señales · ${(data._meta || {}).simulated ? "datos simulados" : "sin datos simulados"}`);
    setHTML("provenance-body", `
      <p><strong>Fórmula.</strong> ${esc((data._meta || {}).formula || "Índice ponderado de entregables, pautado, guion, presupuesto, fuentes y guardrails.")}</p>
      <ul class="readiness-list">
        ${parts.map((part) => `<li><span>${esc(part.label)}</span><span>${nf(part.value)}% × ${nf(part.weight)}% = <strong>${nf(part.points, 1)}</strong></span></li>`).join("")}
      </ul>
      <p><strong>Fuentes.</strong></p>
      <ul class="source-list">
        ${sources.map((source) => `<li><code>${esc(source.path)}</code><span>${source.exists ? esc(source.mtime || "leído") : "no encontrado"}</span></li>`).join("")}
      </ul>
      ${conflicts.length ? `<p><strong>Conflictos detectados.</strong></p><ul class="conflict-list">${conflicts.map((item) => `<li><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span></li>`).join("")}</ul>` : ""}
      <p><strong>Procedencia.</strong> Reales: ${esc((data.provenance || {}).real?.join(", ") || "—")}. Derivados: ${esc((data.provenance || {}).derived?.join(", ") || "—")}. Ilustrativos: ${esc((data.provenance || {}).illustrative?.join(", ") || "—")}.</p>
      <p><strong>Ventana.</strong> ${esc(s.start_label || "—")} — ${esc(s.end_label || "—")} · última señal ${esc(s.last_signal_label || "—")}.</p>
    `);
  }

  function animateValue(el, target, digits = 0) {
    if (!el) return;
    if (reduceMotion || captureMode) {
      el.textContent = nf(target, digits);
      return;
    }
    const from = 0;
    const duration = 950;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = nf(Math.round(from + (target - from) * eased), digits);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = nf(target, digits);
    };
    requestAnimationFrame(tick);
  }

  function animateCounts() {
    $$("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      animateValue(el, target);
    });
  }

  function setupReveals() {
    const targets = $$(".block, .mvp-band, .closing");
    if (!targets.length) return;
    targets.forEach((el) => el.classList.add("reveal"));
    if (reduceMotion || captureMode || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    targets.forEach((el) => observer.observe(el));
  }

  function revealVisibleNow() {
    $$(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("is-visible");
    });
  }

  function replay() {
    renderRhythm();
    renderSplit();
    animateCounts();
    revealVisibleNow();
    const button = $("#replay-btn");
    if (button) {
      button.classList.add("is-done");
      window.setTimeout(() => button.classList.remove("is-done"), 900);
    }
  }

  function renderAll() {
    renderIdentity();
    renderParade();
    renderRhythm();
    renderCritical();
    renderMvp();
    renderRoster();
    renderSplit();
    renderClosing();
    renderProvenance();
  }

  function init() {
    if (!data) {
      showFatal("No se encontró data/stats.generated.js. Ejecuta python scripts/build_stats.py y recarga la página.");
      return;
    }
    renderAll();
    document.body.classList.add("js-anim");
    if (captureMode) document.body.classList.add("capture");
    setupReveals();
    animateCounts();

    const replayBtn = $("#replay-btn");
    if (replayBtn) replayBtn.addEventListener("click", replay);
    ["print-btn", "print-btn-2"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => window.print());
    });

    window.addEventListener("resize", repositionTooltip);
    window.addEventListener("scroll", repositionTooltip, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
