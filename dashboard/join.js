(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const token = (params.get("t") || "").trim();
  const form = document.getElementById("join-form");
  const input = document.getElementById("join-name");
  const button = document.getElementById("join-submit");
  const status = document.getElementById("join-status");

  function mostrar(text) {
    status.textContent = text || "";
  }

  if (!token) {
    mostrar("Este enlace no trae invitación. Pide uno nuevo al administrador del equipo.");
    button.disabled = true;
  } else {
    input.focus();
  }

  function deviceId() {
    let id = localStorage.getItem("rally_device_id");
    if (!id) {
      id = "dev_" + crypto.randomUUID();
      localStorage.setItem("rally_device_id", id);
    }
    return id;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = (input.value || "").trim();
    if (!name) {
      mostrar("Escribe tu nombre.");
      input.focus();
      return;
    }
    button.disabled = true;
    mostrar("Entrando...");
    try {
      const res = await fetch("/api/project/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, name: name, device_id: deviceId() }),
      });
      const body = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        mostrar(body.error || "No se pudo entrar. El enlace pudo vencer o ya fue usado.");
        button.disabled = false;
        return;
      }
      const previous = localStorage.getItem("rally_project") || "main";
      if (previous !== body.project) {
        localStorage.removeItem("rally_studio_production_state_2026_v3");
        localStorage.removeItem("rally_section_sync_meta_v1");
      }
      localStorage.setItem("rally_session_token", body.session);
      localStorage.setItem("rally_project", body.project);
      localStorage.setItem("rally_member_id", body.member.id);
      localStorage.setItem("rally_member_name", body.member.name);
      localStorage.setItem("rally_member_role", body.member.role);
      location.replace("/?project=" + encodeURIComponent(body.project));
    } catch (error) {
      mostrar("No se pudo contactar al servidor. Revisa la conexión e intenta de nuevo.");
      button.disabled = false;
    }
  });
})();
