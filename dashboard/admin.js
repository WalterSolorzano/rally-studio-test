(function () {
  "use strict";

  const statusEl = document.getElementById("admin-status");
  const listEl = document.getElementById("members-list");
  const inviteBtn = document.getElementById("create-invite");
  const copyBtn = document.getElementById("copy-invite");
  const inviteOut = document.getElementById("invite-url");
  const tokenInput = document.getElementById("admin-token");
  const saveTokenBtn = document.getElementById("save-token");
  const sessionState = document.getElementById("session-state");

  function project() {
    const fromUrl = new URLSearchParams(location.search).get("project");
    return (fromUrl || localStorage.getItem("rally_project") || "main").trim() || "main";
  }

  function token() {
    return localStorage.getItem("rally_session_token") || "";
  }

  function role() {
    return (localStorage.getItem("rally_member_role") || "").trim();
  }

  function status(text) {
    statusEl.textContent = text || "";
  }

  function conProyecto(path) {
    return path + (path.indexOf("?") >= 0 ? "&" : "?") + "project=" + encodeURIComponent(project());
  }

  async function api(path, options) {
    const opts = Object.assign({ cache: "no-store", headers: {} }, options || {});
    opts.headers = Object.assign({}, opts.headers);
    if (opts.body) opts.headers["Content-Type"] = "application/json";
    const t = token();
    if (t) opts.headers.Authorization = "Bearer " + t;
    const res = await fetch(conProyecto(path), opts);
    const body = await res.json().catch(function () { return {}; });
    return { status: res.status, ok: res.ok, body: body };
  }

  function fecha(ts) {
    const n = Number(ts);
    if (!n) return "sin registro";
    try {
      return new Date(n * 1000).toLocaleString("es", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      });
    } catch (e) { return "sin registro"; }
  }

  function fila(member) {
    const row = document.createElement("div");
    row.className = "member-row" + (member.revoked ? " is-revoked" : "");
    row.dataset.memberId = member.id;

    const name = document.createElement("span");
    name.className = "member-name";
    name.textContent = member.name;

    const rol = document.createElement("span");
    rol.className = "member-role";
    rol.textContent = member.revoked ? "retirado" : (member.role === "operator" ? "operador" : member.role === "admin" ? "admin" : "miembro");

    const seen = document.createElement("span");
    seen.className = "member-seen";
    seen.textContent = "Último acceso: " + fecha(member.last_seen);

    row.appendChild(name);
    row.appendChild(rol);
    row.appendChild(seen);

    if (!member.revoked) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "danger";
      btn.textContent = "Retirar";
      btn.setAttribute("data-member-id", member.id);
      btn.addEventListener("click", function () { revocar(member); });
      row.appendChild(btn);
    }
    return row;
  }

  async function cargarMiembros() {
    if (!token()) {
      status("Abre tu enlace de invitación para entrar al proyecto.");
      return;
    }
    status("Cargando equipo...");
    try {
      const res = await api("/api/members", { method: "GET" });
      if (res.status === 401) { status("Tu acceso ya no está activo. Pide un enlace nuevo."); return; }
      if (res.status === 403) { status("Sin permiso: solo el administrador o un operador pueden ver esta página."); return; }
      if (!res.ok) { status("No se pudo cargar el equipo."); return; }
      const members = res.body.members || [];
      listEl.innerHTML = "";
      members.forEach(function (m) { listEl.appendChild(fila(m)); });
      status("");
    } catch (e) {
      status("No se pudo contactar al servidor.");
    }
  }

  async function crearInvitacion() {
    if (role() !== "admin" && role() !== "operator") {
      status("Sin permiso para crear enlaces.");
      return;
    }
    inviteBtn.disabled = true;
    status("Creando enlace...");
    try {
      const res = await api("/api/invites", { method: "POST", body: JSON.stringify({ ttl_hours: 48 }) });
      if (!res.ok) {
        status(res.status === 403 ? "Sin permiso para crear enlaces." : "No se pudo crear el enlace.");
        return;
      }
      const url = location.origin + "/" + res.body.url_path;
      inviteOut.textContent = url;
      copyBtn.hidden = false;
      copyBtn.dataset.url = url;
      status("Enlace creado. Sirve una sola vez y vence en 48 horas.");
    } catch (e) {
      status("No se pudo contactar al servidor.");
    } finally {
      inviteBtn.disabled = false;
    }
  }

  async function revocar(member) {
    const ok = window.confirm("¿Retirar el acceso de " + member.name + "? Su trabajo ya guardado se conserva.");
    if (!ok) return;
    try {
      const res = await api("/api/members/" + encodeURIComponent(member.id) + "/revoke", {
        method: "POST", body: JSON.stringify({}),
      });
      if (!res.ok) {
        status(res.body.error === "ultimo-admin" ? "No puedes retirar al único administrador." : "No se pudo retirar el acceso.");
        return;
      }
      status("Acceso retirado a " + member.name + ".");
      cargarMiembros();
    } catch (e) {
      status("No se pudo contactar al servidor.");
    }
  }

  async function cargarSesion() {
    if (!token()) {
      sessionState.textContent = "Sin sesión: pega el token que imprimió crear_proyecto.py.";
      return false;
    }
    try {
      const res = await api("/api/session");
      if (!res.ok) {
        sessionState.textContent = "La sesión venció o no es válida. Pega un token nuevo.";
        return false;
      }
      localStorage.setItem("rally_project", res.body.project || project());
      localStorage.setItem("rally_member_id", res.body.member.id);
      localStorage.setItem("rally_member_name", res.body.member.name);
      localStorage.setItem("rally_member_role", res.body.member.role);
      sessionState.textContent = "Sesión: " + res.body.member.name + " · " + res.body.member.role;
      return true;
    } catch (e) {
      sessionState.textContent = "No se pudo contactar al servidor.";
      return false;
    }
  }

  async function guardarSesion() {
    const value = (tokenInput.value || "").trim();
    if (!value) {
      status("Pega el token del operador.");
      return;
    }
    localStorage.setItem("rally_session_token", value);
    saveTokenBtn.disabled = true;
    const ok = await cargarSesion();
    saveTokenBtn.disabled = false;
    tokenInput.value = "";
    if (ok) {
      status("");
      cargarMiembros();
    }
  }

  copyBtn.addEventListener("click", async function () {
    const url = copyBtn.dataset.url || "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      status("Enlace copiado.");
    } catch (e) {
      status("Copia manualmente el enlace de arriba.");
    }
  });

  inviteBtn.addEventListener("click", crearInvitacion);
  saveTokenBtn.addEventListener("click", guardarSesion);
  cargarSesion().then(function (ok) { if (ok) cargarMiembros(); });
})();
