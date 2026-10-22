/* Rally Studio · sincronización por secciones
 *
 * El estado completo vive en localStorage como caché. Al servidor solo viajan
 * las secciones que cambiaron, con la versión sobre la que se editó. Si otra
 * persona ya guardó, el servidor responde 409 y aquí se muestra el conflicto
 * con las dos versiones; nunca se fusiona en silencio.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "rally_studio_production_state_2026_v3";
  const META_KEY = "rally_section_sync_meta_v1";
  const CHANNEL_NAME = "rally_studio_auto_sync";
  const POLL_MS = 1000;
  const FLUSH_MS = 650;
  const LOCK_TTL_MIN = 10;

  const SECTION_LABELS = {
    certamen: "Certamen", team: "Identidad del equipo", team_roster: "Integrantes",
    challenges: "Retos", solution: "Solución", impact_alignment: "Impacto y ODS",
    pautado: "Pautado", budget: "Presupuesto", script: "Guion",
    model_canvas: "Modelo Canvas", resources: "Recursos", tasks: "Despacho Multi-IA",
    deliverables: "Entregables", authorship: "Autoría", shot_plan: "Plan de tomas",
    "pautado.problema": "Pautado · Problema",
    "pautado.solucion": "Pautado · Solución",
    "pautado.impacto": "Pautado · Impacto",
    "pautado.innovacion": "Pautado · Innovación",
    "pautado.prefactibilidad": "Pautado · Prefactibilidad",
    "script.acto1": "Guion · Acto 1", "script.acto2": "Guion · Acto 2",
    "script.acto3": "Guion · Acto 3", "script.acto4": "Guion · Acto 4",
  };

  const NESTED = new Set(["pautado", "script"]);
  const LOCAL_ONLY = new Set(["active_tab", "_sync_ts", "authorship", "active_locks"]);
  // Campos de reloj/configuracion: se sincronizan, pero no se bloquean ni
  // ensucian la barra de presencia con un "esta editando" falso.
  const NO_LOCK = new Set([
    "rally_type", "exchange_rate_bcn", "start_timestamp", "official_start_time", "hours_remaining",
    "hours_total", "rally_started", "category", "local_ip", "voice_engine",
    "voice_preset", "team_members_count", "team_has_female", "team_has_engineering",
  ]);

  let ready = false;
  let applyingRemote = false;
  let serverAvailable = true;
  let lastSeq = 0;
  let versions = {};
  let baseline = {};
  let dirty = new Set();
  let pending = {};
  let blocked = new Set();
  let locks = {};
  let activeLock = "";
  let activeLockUntil = 0;
  let scanTimer = 0;
  let flushTimer = 0;
  let pollTimer = 0;
  let syncing = false;
  let conflictQueue = [];
  let conflictOpen = false;
  let channel = null;
  let statusEl = null;
  let hasMeta = false;
  let triedInitialSave = false;
  let accessRevoked = false;
  let serverHasContent = false;

  function projectId() {
    try {
      const fromUrl = new URLSearchParams(location.search).get("project");
      const stored = localStorage.getItem("rally_project");
      const project = ((fromUrl || stored || "main") + "").trim() || "main";
      localStorage.setItem("rally_project", project);
      return project;
    } catch (e) { return "main"; }
  }

  function sessionToken() {
    try { return localStorage.getItem("rally_session_token") || ""; }
    catch (e) { return ""; }
  }

  function memberRole() {
    try { return (localStorage.getItem("rally_member_role") || "").trim(); }
    catch (e) { return ""; }
  }

  const canSeed = () => memberRole() === "admin" || memberRole() === "operator";

  const actor = () => {
    try {
      return (localStorage.getItem("rally_member_name") || localStorage.getItem("rally_user_name") || "").trim() || "Invitado";
    } catch (e) { return "Invitado"; }
  };

  const actorId = () => {
    try {
      const member = localStorage.getItem("rally_member_id");
      if (member) return member;
      let id = localStorage.getItem("rally_sync_client_id");
      if (!id) {
        id = "cli_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
        localStorage.setItem("rally_sync_client_id", id);
      }
      return id;
    } catch (e) { return "cli_local"; }
  };

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeState(next) {
    applyingRemote = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (channel) channel.postMessage({ type: "AUTO_SYNC_STATE", state: next });
    } catch (e) {
      applyingRemote = false;
      return;
    }
    setTimeout(function () { applyingRemote = false; }, 30);
  }

  function splitSections(state) {
    const out = {};
    if (!state || typeof state !== "object") return out;
    Object.keys(state).forEach(function (key) {
      if (!key || key.charAt(0) === "_" || LOCAL_ONLY.has(key)) return;
      const value = state[key];
      if (NESTED.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
        Object.keys(value).forEach(function (sub) {
          if (!sub || sub.charAt(0) === "_") return;
          out[key + "." + sub] = value[sub];
        });
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function applySection(state, key, value) {
    const dot = key.indexOf(".");
    if (dot > 0) {
      const root = key.slice(0, dot);
      const sub = key.slice(dot + 1);
      if (NESTED.has(root)) {
        if (!state[root] || typeof state[root] !== "object") state[root] = {};
        state[root][sub] = value;
        return;
      }
    }
    state[key] = value;
  }

  function same(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
  }

  function saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({
        versions: versions,
        dirty: Array.from(dirty),
        seq: lastSeq,
        initialized: true,
      }));
    } catch (e) {}
  }

  function loadMeta() {
    try {
      const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      if (meta && typeof meta === "object") {
        versions = meta.versions && typeof meta.versions === "object" ? meta.versions : {};
        lastSeq = Number(meta.seq) || 0;
        if (Array.isArray(meta.dirty)) dirty = new Set(meta.dirty);
        hasMeta = !!meta.initialized;
      }
    } catch (e) {}
  }

  function labelFor(key) {
    return SECTION_LABELS[key] || key.replace(/\./g, " · ");
  }

  function setStatus(text, mood) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.mood = mood || "idle";
    statusEl.hidden = false;
  }

  function withProject(path) {
    const sep = path.indexOf("?") >= 0 ? "&" : "?";
    return path + sep + "project=" + encodeURIComponent(projectId());
  }

  async function api(path, options) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 6000);
    const opts = Object.assign({
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    }, options || {});
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    const token = sessionToken();
    if (token) headers.Authorization = "Bearer " + token;
    opts.headers = headers;
    try {
      const res = await fetch(withProject(path), opts);
      const text = await res.text();
      let body = {};
      try { body = text ? JSON.parse(text) : {}; } catch (e) { body = {}; }
      if (res.status === 401) {
        accessRevoked = true;
        serverAvailable = false;
        setStatus("Acceso revocado · tus cambios quedan en este equipo", "offline");
      }
      return { status: res.status, ok: res.ok, body: body };
    } finally {
      clearTimeout(timer);
    }
  }

  function sectionPath(key) {
    return "/api/sections/" + encodeURIComponent(key);
  }

  async function initialSync() {
    const local = readState();
    if (!local) {
      if (!triedInitialSave && typeof window.saveState === "function") {
        triedInitialSave = true;
        try { window.saveState(); } catch (e) {}
      }
      setTimeout(initialSync, 250);
      return;
    }
    setStatus("Conectando con el equipo…", "syncing");
    let res;
    try {
      res = await api("/api/sections?since=0");
    } catch (e) {
      serverAvailable = false;
      setStatus("Sin conexión · tus cambios se guardan en este equipo", "offline");
      ready = true;
      schedulePoll(8000);
      return;
    }
    if (res.status === 404 || res.status === 405) {
      serverAvailable = false;
      setStatus("Modo local · sin servidor de equipo", "local");
      ready = true;
      return;
    }
    if (!res.ok) {
      serverAvailable = false;
      if (accessRevoked) { ready = true; return; }
      setStatus("Sin conexión · tus cambios se guardan en este equipo", "offline");
      ready = true;
      schedulePoll(8000);
      return;
    }

    const serverSections = res.body.sections || {};
    serverHasContent = Object.keys(serverSections).length > 0;
    if (!serverHasContent && canSeed()) {
      const imported = await api("/api/sections/import", {
        method: "POST",
        body: JSON.stringify({ state: local, actor: actor(), actor_id: actorId() }),
      });
      if (imported.ok) {
        res = await api("/api/sections?since=0");
      }
      if (accessRevoked) { ready = true; return; }
    }

    const remote = (res && res.body && res.body.sections) || {};
    const state = readState() || local;
    const keepLocal = new Set(dirty);
    const conflicts = [];

    Object.keys(remote).forEach(function (key) {
      const item = remote[key];
      if (!item) return;
      if (item.data === null) {
        const localNull = getSection(state, key);
        versions[key] = Number(item.version) || 0;
        if (localNull === undefined || localNull === null) {
          baseline[key] = "null";
          locks[key] = item;
          return;
        }
        // Hay contenido local y el servidor aun no lo tiene: se empuja abajo.
        dirty.add(key);
        pending[key] = localNull;
        locks[key] = item;
        return;
      }
      if (keepLocal.has(key)) {
        const localValue = getSection(state, key);
        if (Number(item.version) !== Number(versions[key] || 0)) {
          dirty.add(key);
          pending[key] = localValue;
          blocked.add(key);
          conflicts.push({ key: key, current: item, mine: localValue });
        }
      } else {
        applySection(state, key, item.data);
      }
      versions[key] = Number(item.version) || 0;
      baseline[key] = JSON.stringify(item.data);
      locks[key] = item;
    });

    if (res && res.body) lastSeq = Number(res.body.seq) || lastSeq;
    writeState(state);
    ready = true;
    saveMeta();
    renderLocks();
    setStatus("Sincronizado · equipo en vivo", "ok");

    conflicts.forEach(function (c) { queueConflict(c.key, c.mine, c.current); });
    if (dirty.size && !conflicts.length) flushSoon(200);
    schedulePoll();
  }

  function getSection(state, key) {
    const dot = key.indexOf(".");
    if (dot > 0) {
      const root = key.slice(0, dot);
      const sub = key.slice(dot + 1);
      if (state && state[root] && typeof state[root] === "object") return state[root][sub];
    }
    return state ? state[key] : undefined;
  }

  function schedulePoll(ms) {
    clearTimeout(pollTimer);
    if (!serverAvailable || accessRevoked) return;
    pollTimer = setTimeout(poll, ms || POLL_MS);
  }

  async function poll() {
    if (!serverAvailable || !ready || accessRevoked) return;
    let res;
    try {
      res = await api("/api/sections?since=" + encodeURIComponent(lastSeq));
    } catch (e) {
      serverAvailable = false;
      setStatus("Sin conexión · tus cambios se guardan en este equipo", "offline");
      schedulePoll(6000);
      return;
    }
    if (res.status === 404) {
      serverAvailable = false;
      setStatus("Modo local · sin servidor de equipo", "local");
      return;
    }
    if (!res.ok) {
      if (accessRevoked) return;
      schedulePoll(6000);
      return;
    }
    serverAvailable = true;
    const changed = res.body.sections || {};
    if (Object.keys(changed).length) serverHasContent = true;
    const state = readState();
    const incoming = {};
    Object.keys(changed).forEach(function (key) {
      const item = changed[key];
      if (!item || LOCAL_ONLY.has(key)) return;
      versions[key] = Number(item.version) || 0;
      locks[key] = item;
      renderLockBadge(key, item);
      if (item.data === null) {
        const localNull = getSection(state, key);
        if (localNull === undefined || localNull === null) baseline[key] = "null";
        return;
      }
      if (dirty.has(key) || activeLock === key) return;
      if (baseline[key] !== undefined && JSON.stringify(item.data) === baseline[key]) return;
      incoming[key] = item.data;
      baseline[key] = JSON.stringify(item.data);
    });
    if (Object.keys(incoming).length) {
      Object.keys(incoming).forEach(function (key) { applySection(state, key, incoming[key]); });
      writeState(state);
      setStatus("Actualizado por el equipo", "ok");
      setTimeout(function () { setStatus("Sincronizado · equipo en vivo", "ok"); }, 2200);
    }
    lastSeq = Number(res.body.seq) || lastSeq;
    renderLocks();
    saveMeta();
    if (dirty.size) flushSoon(500);
    schedulePoll();
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanLocal, 180);
  }

  function scanLocal() {
    if (!ready || applyingRemote) return;
    const state = readState();
    if (!state) return;
    const sections = splitSections(state);
    Object.keys(sections).forEach(function (key) {
      if (!same(sections[key], baseline[key] === undefined ? undefined : JSON.parse(baseline[key]))) {
        dirty.add(key);
        pending[key] = sections[key];
      }
    });
    if (dirty.size) {
      saveMeta();
      flushSoon(FLUSH_MS);
    }
  }

  function flushSoon(ms) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, ms || FLUSH_MS);
  }

  async function flush() {
    if (!ready || syncing || !serverAvailable || applyingRemote || accessRevoked) return;
    if (!canSeed() && !serverHasContent) return;
    const keys = Array.from(dirty).filter(function (k) { return !blocked.has(k); });
    if (!keys.length) return;
    syncing = true;
    setStatus("Guardando cambios…", "syncing");
    let failed = false;
    for (const key of keys) {
      const data = pending[key] !== undefined ? pending[key] : getSection(readState(), key);
      try {
        const locked = NO_LOCK.has(key) ? { status: 200, body: {} } : await api(sectionPath(key) + "/lock", {
          method: "POST",
          body: JSON.stringify({ actor: actor(), actor_id: actorId(), ttl_minutes: LOCK_TTL_MIN }),
        });
        if (accessRevoked) { failed = true; break; }
        if (locked.status === 423) {
          blocked.add(key);
          setStatus((locked.body.lock && locked.body.lock.lock_owner ? locked.body.lock.lock_owner : "Otra persona") + " está editando " + labelFor(key), "locked");
          continue;
        }
        const res = await api(sectionPath(key), {
          method: "POST",
          body: JSON.stringify({
            data: data,
            base_version: Number(versions[key] || 0),
            actor: actor(),
            actor_id: actorId(),
            ttl_minutes: LOCK_TTL_MIN,
          }),
        });
        if (accessRevoked) { failed = true; break; }
        if (res.status === 409) {
          blocked.add(key);
          queueConflict(key, data, res.body.current);
          continue;
        }
        if (res.status === 423) {
          blocked.add(key);
          setStatus("Otra persona está editando " + labelFor(key), "locked");
          continue;
        }
        if (!res.ok) {
          failed = true;
          continue;
        }
        const section = res.body.section || {};
        versions[key] = Number(section.version) || (Number(versions[key] || 0) + 1);
        baseline[key] = JSON.stringify(data);
        dirty.delete(key);
        delete pending[key];
        blocked.delete(key);
        locks[key] = section;
        renderLockBadge(key, section);
        if (!NO_LOCK.has(key)) {
          api(sectionPath(key) + "/unlock", {
            method: "POST",
            body: JSON.stringify({ actor: actor(), actor_id: actorId() }),
          }).catch(function () {});
        }
      } catch (e) {
        failed = true;
        serverAvailable = false;
        setStatus("Sin conexión · tus cambios se guardan en este equipo", "offline");
        break;
      }
    }
    syncing = false;
    saveMeta();
    if (!failed && !blocked.size) setStatus("Sincronizado · equipo en vivo", "ok");
    if (dirty.size) schedulePoll(2500);
  }

  function queueConflict(key, mine, current) {
    conflictQueue.push({ key: key, mine: mine, current: current });
    if (!conflictOpen) showNextConflict();
  }

  function pretty(value) {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value, null, 2); } catch (e) { return String(value); }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function showNextConflict() {
    const item = conflictQueue.shift();
    if (!item) { conflictOpen = false; return; }
    conflictOpen = true;
    closeConflict();
    if (!item.current) {
      blocked.delete(item.key);
      showNextConflict();
      return;
    }
    const who = item.current.updated_by || "Otra persona";
    const wrapper = document.createElement("div");
    wrapper.id = "rally-conflict-modal";
    wrapper.className = "rally-conflict-backdrop";
    wrapper.innerHTML =
      '<div class="rally-conflict" role="dialog" aria-modal="true" aria-labelledby="rally-conflict-title">' +
        '<header><div><span class="rally-conflict-kicker">Edición simultánea</span>' +
        '<h2 id="rally-conflict-title">' + esc(labelFor(item.key)) + '</h2></div>' +
        '<button type="button" class="rally-conflict-x" aria-label="Cerrar">×</button></header>' +
        '<p>' + esc(who) + ' guardó otra versión mientras trabajabas. Elige una. No se fusiona automáticamente.</p>' +
        '<div class="rally-conflict-grid">' +
          '<section><h3>Tu versión</h3><pre>' + esc(pretty(item.mine)) + '</pre></section>' +
          '<section><h3>Versión de ' + esc(who) + '</h3><pre>' + esc(pretty(item.current.data)) + '</pre></section>' +
        '</div>' +
        '<footer><button type="button" class="rally-conflict-theirs">Usar la del servidor</button>' +
        '<button type="button" class="rally-conflict-mine">Conservar la mía</button></footer>' +
      '</div>';
    document.body.appendChild(wrapper);
    wrapper.querySelector(".rally-conflict-mine").focus();
    wrapper.querySelector(".rally-conflict-x").addEventListener("click", function () {
      blocked.delete(item.key);
      closeConflict();
      conflictOpen = false;
      setStatus("Conflicto pendiente · tu texto sigue local", "locked");
    });
    wrapper.querySelector(".rally-conflict-theirs").addEventListener("click", function () {
      applyServerVersion(item);
      closeConflict();
      conflictOpen = false;
      showNextConflict();
    });
    wrapper.querySelector(".rally-conflict-mine").addEventListener("click", function () {
      keepMine(item);
    });
  }

  function closeConflict() {
    const old = document.getElementById("rally-conflict-modal");
    if (old) old.remove();
  }

  function applyServerVersion(item) {
    const state = readState();
    if (!state) return;
    applySection(state, item.key, item.current.data);
    versions[item.key] = Number(item.current.version) || versions[item.key];
    baseline[item.key] = JSON.stringify(item.current.data);
    dirty.delete(item.key);
    delete pending[item.key];
    blocked.delete(item.key);
    writeState(state);
    saveMeta();
    setStatus("Usaste la versión de " + (item.current.updated_by || "el equipo"), "ok");
  }

  async function keepMine(item) {
    const locked = await api(sectionPath(item.key) + "/lock", {
      method: "POST",
      body: JSON.stringify({ actor: actor(), actor_id: actorId(), ttl_minutes: LOCK_TTL_MIN }),
    });
    if (locked.status === 423) {
      setStatus("No se pudo recuperar el bloqueo; inténtalo en un momento.", "locked");
      return;
    }
    const res = await api(sectionPath(item.key), {
      method: "POST",
      body: JSON.stringify({
        data: item.mine,
        base_version: Number(item.current.version) || 0,
        actor: actor(),
        actor_id: actorId(),
        ttl_minutes: LOCK_TTL_MIN,
      }),
    });
    if (res.status === 409) {
      const current = res.body.current || item.current;
      closeConflict();
      conflictOpen = false;
      queueConflict(item.key, item.mine, current);
      return;
    }
    if (!res.ok) {
      setStatus("No se pudo guardar tu versión; el texto sigue local.", "offline");
      return;
    }
    const section = res.body.section || {};
    versions[item.key] = Number(section.version) || Number(item.current.version) + 1;
    baseline[item.key] = JSON.stringify(item.mine);
    dirty.delete(item.key);
    delete pending[item.key];
    blocked.delete(item.key);
    locks[item.key] = section;
    renderLockBadge(item.key, section);
    saveMeta();
    closeConflict();
    conflictOpen = false;
    setStatus("Tu versión quedó guardada", "ok");
    showNextConflict();
  }

  function lockSection(key) {
    if (!key || !serverAvailable || accessRevoked || NO_LOCK.has(key)) return;
    if (activeLock === key && activeLockUntil > Date.now()) return;
    if (activeLock && activeLock !== key) releaseLock(activeLock);
    activeLock = key;
    activeLockUntil = Date.now() + LOCK_TTL_MIN * 60000;
    api(sectionPath(key) + "/lock", {
      method: "POST",
      body: JSON.stringify({ actor: actor(), actor_id: actorId(), ttl_minutes: LOCK_TTL_MIN }),
    }).then(function (res) {
      if (res.status === 200 && res.body.section) {
        locks[key] = res.body.section;
        renderLockBadge(key, res.body.section);
      } else if (res.status === 423) {
        activeLock = "";
        setStatus((res.body.lock && res.body.lock.lock_owner ? res.body.lock.lock_owner : "Otra persona") + " está editando " + labelFor(key), "locked");
      }
    }).catch(function () {});
  }

  function releaseLock(key) {
    if (!key) return;
    if (key === activeLock) {
      activeLock = "";
      activeLockUntil = 0;
    }
    if (dirty.has(key)) return;
    api(sectionPath(key) + "/unlock", {
      method: "POST",
      body: JSON.stringify({ actor: actor(), actor_id: actorId() }),
    }).catch(function () {});
  }

  function fieldToSection(fieldId) {
    if (!fieldId) return "";
    if (fieldId.indexOf("pautado-") === 0) return "pautado." + fieldId.slice(8);
    if (fieldId.indexOf("script-acto") === 0) return "script." + fieldId.slice(7);
    return fieldId;
  }

  function sectionFromElement(el) {
    if (!el || !el.closest) return "";
    const lockable = el.closest("[data-lockable]");
    if (lockable) return fieldToSection(lockable.getAttribute("data-lockable"));
    if (el.id && el.id.indexOf("pt-") === 0) return "pautado." + el.id.slice(3);
    if (el.id && /^sc-a[1-4]$/.test(el.id)) return "script.acto" + el.id.slice(-1);
    if (el.closest(".budget-table, #budget-table, [data-view='budget']")) return "budget";
    if (el.id && el.id.indexOf("sol-") === 0) return "solution";
    if (el.closest(".canvas-grid, #canvas-grid")) return "model_canvas";
    if (el.id && el.id.indexOf("team-") === 0) return "team";
    if (el.id && el.id.indexOf("impact-") === 0) return "impact_alignment";
    return "";
  }

  function bindEditors() {
    document.addEventListener("focusin", function (ev) {
      if (!ready || !serverAvailable) return;
      const key = sectionFromElement(ev.target);
      if (key) lockSection(key);
    });
    document.addEventListener("focusout", function (ev) {
      const key = sectionFromElement(ev.target);
      if (!key) return;
      setTimeout(function () {
        const next = sectionFromElement(document.activeElement);
        if (next !== key) releaseLock(key);
      }, 120);
    });
  }

  function ensureStatus() {
    if (statusEl) return;
    statusEl = document.createElement("div");
    statusEl.id = "rally-sync-status";
    statusEl.className = "rally-sync-status";
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
    statusEl.hidden = true;
    document.body.appendChild(statusEl);
  }

  function activeOtherLocks() {
    const now = Date.now();
    return Object.keys(locks).map(function (key) {
      const item = locks[key];
      if (!item || !item.lock_owner_id || item.lock_owner_id === actorId()) return null;
      if (Number(item.lock_until || 0) * 1000 <= now) return null;
      return { key: key, item: item, minutes: Math.max(1, Math.ceil((Number(item.lock_until) * 1000 - now) / 60000)) };
    }).filter(Boolean);
  }

  function renderLocks() {
    const active = activeOtherLocks();
    if (!active.length) {
      if (statusEl && statusEl.dataset.mood === "locked") setStatus("Sincronizado · equipo en vivo", "ok");
    } else {
      const first = active[0];
      setStatus(first.item.lock_owner + " está editando " + labelFor(first.key) + " · " + first.minutes + " min", "locked");
    }
    const seen = {};
    document.querySelectorAll(".rally-section-lock").forEach(function (node) {
      const key = node.getAttribute("data-section-lock");
      if (!active.some(function (x) { return x.key === key; })) node.remove();
    });
    active.forEach(function (x) {
      seen[x.key] = true;
      renderLockBadge(x.key, x.item);
    });
  }

  function renderLockBadge(key, section) {
    const host = document.querySelector('[data-lockable="' + key.replace(".", "-") + '"]');
    if (!host || !section || !section.lock_owner_id || section.lock_owner_id === actorId()) return;
    if (Number(section.lock_until || 0) * 1000 <= Date.now()) return;
    let badge = host.querySelector(".rally-section-lock");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "rally-section-lock";
      badge.setAttribute("data-section-lock", key);
      host.insertBefore(badge, host.firstChild);
    }
    const minutes = Math.max(1, Math.ceil((Number(section.lock_until) * 1000 - Date.now()) / 60000));
    badge.textContent = section.lock_owner + " está editando · " + minutes + " min";
  }

  function injectStyles() {
    if (document.getElementById("rally-sync-styles")) return;
    const style = document.createElement("style");
    style.id = "rally-sync-styles";
    style.textContent = [
      ".rally-sync-status{position:fixed;left:16px;bottom:16px;z-index:1300;max-width:min(420px,calc(100vw - 32px));padding:8px 11px;border:1px solid #DCE7F5;background:#fff;color:#13213A;font:600 11px/1.35 'Plus Jakarta Sans',sans-serif;letter-spacing:.01em;box-shadow:0 2px 10px rgba(13,27,53,.08)}",
      ".rally-sync-status[data-mood='ok']{color:#047857;border-color:#BBE7D0}",
      ".rally-sync-status[data-mood='syncing']{color:#0866F5;border-color:#C7DCFE}",
      ".rally-sync-status[data-mood='offline'],.rally-sync-status[data-mood='local']{color:#8A5A00;border-color:#F1D7A8;background:#FFFDF7}",
      ".rally-sync-status[data-mood='locked']{color:#9A3412;border-color:#FED7AA;background:#FFF7ED}",
      ".rally-section-lock{margin:6px 0 8px;padding:5px 8px;border:1px solid #FED7AA;background:#FFF7ED;color:#9A3412;font:700 10.5px/1.4 'JetBrains Mono',monospace;text-transform:uppercase}",
      ".rally-conflict-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(13,27,53,.42);display:flex;align-items:center;justify-content:center;padding:18px}",
      ".rally-conflict{width:min(940px,100%);max-height:calc(100dvh - 36px);overflow:auto;background:#fff;border:1px solid #DCE7F5;box-shadow:0 18px 50px rgba(13,27,53,.22);padding:20px}",
      ".rally-conflict header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid #DCE7F5;padding-bottom:12px}",
      ".rally-conflict-kicker{display:block;font:700 10px/1 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#9A3412;margin-bottom:5px}",
      ".rally-conflict h2{margin:0;font-size:20px;line-height:1.2;color:#0D1B35}",
      ".rally-conflict p{margin:12px 0 14px;font-size:12px;line-height:1.55;color:#475569;max-width:78ch}",
      ".rally-conflict-x{width:34px;height:34px;border:1px solid #DCE7F5;background:#fff;color:#475569;font-size:20px;line-height:1;cursor:pointer}",
      ".rally-conflict-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      ".rally-conflict-grid section{border-top:1px solid #DCE7F5;min-width:0}",
      ".rally-conflict-grid h3{margin:8px 0;font:700 10px/1 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#64748B}",
      ".rally-conflict-grid pre{margin:0;max-height:42dvh;overflow:auto;padding:10px;background:#F8FAFC;border:1px solid #E7EEF8;font:11.5px/1.5 'JetBrains Mono',monospace;white-space:pre-wrap;word-break:break-word;color:#13213A}",
      ".rally-conflict footer{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;border-top:1px solid #DCE7F5;padding-top:14px}",
      ".rally-conflict footer button{min-height:42px;padding:0 14px;font:700 12px 'Plus Jakarta Sans',sans-serif;cursor:pointer;border:1px solid #0866F5}",
      ".rally-conflict-theirs{background:#fff;color:#0866F5}",
      ".rally-conflict-mine{background:#0866F5;color:#fff}",
      "@media(max-width:760px){.rally-sync-status{bottom:72px;left:10px;right:10px;max-width:none}.rally-conflict{padding:14px}.rally-conflict-grid{grid-template-columns:1fr}.rally-conflict-grid pre{max-height:26dvh}.rally-conflict footer{flex-direction:column-reverse}.rally-conflict footer button{width:100%}}",
    ].join("");
    document.head.appendChild(style);
  }

  function hooks() {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = function (ev) {
      if (ev.data && ev.data.type === "AUTO_SYNC_STATE") scheduleScan();
    };
    window.addEventListener("online", function () {
      serverAvailable = true;
      setStatus("Conexión recuperada · sincronizando", "syncing");
      schedulePoll(200);
      flushSoon(600);
    });
    window.addEventListener("offline", function () {
      serverAvailable = false;
      setStatus("Sin conexión · tus cambios se guardan en este equipo", "offline");
    });
    window.addEventListener("beforeunload", function () {
      if (activeLock && !accessRevoked) {
        try {
          const headers = { "Content-Type": "application/json" };
          const token = sessionToken();
          if (token) headers.Authorization = "Bearer " + token;
          fetch(withProject(sectionPath(activeLock) + "/unlock"), {
            method: "POST", keepalive: true,
            headers: headers,
            body: JSON.stringify({ actor: actor(), actor_id: actorId() }),
          });
        } catch (e) {}
      }
    });
    bindEditors();
  }

  window.RallySectionSync = {
    onLocalSave: function () { if (ready) scheduleScan(); },
    lock: function (fieldId) { lockSection(fieldToSection(fieldId)); },
    release: function (fieldId) { releaseLock(fieldToSection(fieldId)); },
    status: function () {
      return {
        ready: ready, server: serverAvailable, seq: lastSeq,
        dirty: Array.from(dirty), versions: Object.assign({}, versions),
        locks: activeOtherLocks(),
      };
    },
    flush: flush,
  };

  function boot() {
    injectStyles();
    ensureStatus();
    loadMeta();
    hooks();
    initialSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
