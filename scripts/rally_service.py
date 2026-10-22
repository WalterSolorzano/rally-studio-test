#!/usr/bin/env python3
"""
rally_service.py -- Backend HTTP ligero y autónomo para Rally Studio & Workbench.
Provee:
1. /api/telemetry : Métricas en tiempo real de CPU, RAM, latencia, tiempo de actividad y estado.
2. /api/scan-sources : Ingesta de archivos fuente (PDF, DOCX, TXT, MD, enlaces, patentes) en rallysistem y knowledge/.
3. /api/compile-docx : Compilación de secciones directamente en la plantilla Word (.docx) oficial del Rally.
4. Servidor de estáticos para dashboard/ y site/.
"""

import http.server
import socketserver
import socket
import json
import os
import sys
import time
import pathlib
import io
import ipaddress
import re
import urllib.parse
import urllib.request
import urllib.error
import shutil
import subprocess
import threading
import uuid
import psutil
import docx

import base64
import unicodedata
import zipfile

try:
    from content_store import ContentStore, validate_envelope
    from member_store import MemberStore
    from nube_store import (
        NubeStore,
        NubeConflict,
        NubeError,
        BUZON_PREFIX,
        DECISIONES_PREFIX,
    )
    from section_store import (
        SQLiteSectionStore,
        SectionConflict,
        SectionLocked,
        estado_a_secciones,
    )
except ImportError:  # cuando se importa como paquete (tests)
    from scripts.content_store import ContentStore, validate_envelope
    from scripts.member_store import MemberStore
    from scripts.nube_store import (
        NubeStore,
        NubeConflict,
        NubeError,
        BUZON_PREFIX,
        DECISIONES_PREFIX,
    )
    from scripts.section_store import (
        SQLiteSectionStore,
        SectionConflict,
        SectionLocked,
        estado_a_secciones,
    )

_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        _easyocr_reader = easyocr.Reader(['es'], gpu=False, verbose=False)
    return _easyocr_reader

def run_ocr_on_base64(base64_str):
    if not base64_str:
        return "", []
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    try:
        img_bytes = base64.b64decode(base64_str, validate=False)
    except Exception as exc:
        raise ValueError(f"La imagen no llego completa o no es valida ({exc}).") from exc
    if not img_bytes:
        raise ValueError("La imagen llego vacia.")
    # Verificar que la imagen se puede abrir antes de gastar tiempo en el OCR
    try:
        from PIL import Image
        import io as _io
        Image.open(_io.BytesIO(img_bytes)).verify()
    except Exception as exc:
        raise ValueError(
            "La imagen esta danada o a medio subir (no se pudo leer el archivo). "
            "Vuelve a subir la foto, recortala o pega el texto a mano en el cuadro de Pegar Texto."
        ) from exc
    reader = get_easyocr_reader()
    try:
        lines = reader.readtext(img_bytes, detail=0)
    except Exception as exc:
        raise ValueError(
            "El OCR no pudo leer esta imagen (formato o calidad no soportada). "
            "Prueba con una captura recortada o pega el texto a mano."
        ) from exc
    lines = [str(l).strip() for l in lines if str(l).strip()]
    full_text = "\n".join(lines)
    return full_text, lines

PORT = 8000
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
DASHBOARD_DIR = BASE_DIR / "dashboard"
SITE_DIR = BASE_DIR / "site"
SOURCES_DIR = BASE_DIR

# Datos del usuario (buzón de propuestas + espejo de estado). Va aparte del
# código para poder excluirlo del despliegue y para que las pruebas usen tmp.
DATA_DIR = pathlib.Path(os.environ.get("RALLY_DATA_DIR", str(DASHBOARD_DIR / "data")))
CONTENT_STORE = ContentStore(DATA_DIR)
NUBE_STORE = NubeStore(DATA_DIR / "nube.db")
SECTION_STORE = SQLiteSectionStore(DATA_DIR / "sections.db")
MEMBER_STORE = MemberStore(DATA_DIR / "members.db")

# --- Presencia en vivo (Fase 2.2): quien esta en la pizarra y que edita ------
_PRESENCE_LOCK = threading.Lock()
_PRESENCE = {}  # actor -> {"actor", "tab", "editing", "ts"}
PRESENCE_TTL_SEC = 20.0


def presence_beat(actor: str, tab: str = "", editing: str = "", now: float | None = None) -> dict:
    """Marca latido de un actor. Devuelve la fila normalizada."""
    nombre = str(actor or "").strip()[:40] or "anonimo"
    momento = time.time() if now is None else now
    with _PRESENCE_LOCK:
        _PRESENCE[nombre] = {
            "actor": nombre,
            "tab": str(tab or "").strip()[:40],
            "editing": str(editing or "").strip()[:80],
            "ts": momento,
        }
        return dict(_PRESENCE[nombre])


def presence_list(now: float | None = None) -> dict:
    """Actores con latido reciente, ordenados por nombre."""
    momento = time.time() if now is None else now
    with _PRESENCE_LOCK:
        vivos = {k: v for k, v in _PRESENCE.items() if momento - v.get("ts", 0) <= PRESENCE_TTL_SEC}
        _PRESENCE.clear()
        _PRESENCE.update(vivos)
    actores = sorted(
        (
            {
                "actor": v["actor"],
                "tab": v.get("tab", ""),
                "editing": v.get("editing", ""),
                "secs": max(0, int(momento - v.get("ts", momento))),
            }
            for v in vivos.values()
        ),
        key=lambda x: x["actor"],
    )
    return {"ok": True, "actors": actores}


# --- Espejo de buzón de la nube en disco (Fase 2.3) --------------------------
# Los sobres que llegan por /api/sync/push a content/<id>.json se escriben en el
# content dir real para que /api/content/manifest los publique en la web sin
# tocar la logica del ContentStore.


def espejo_nube_contenido(rel_path: str, content: str | None) -> bool:
    """Escribe (content≠None) o borra (content=None) el sobre espejado. Solo rutas del buzón."""
    LIMPIO = str(rel_path or "").replace("\\", "/")
    if LIMPIO.startswith(BUZON_PREFIX):
        destino = DATA_DIR / LIMPIO
        destino.parent.mkdir(parents=True, exist_ok=True)
        if content is None:
            try:
                destino.unlink(missing_ok=True)
            except OSError as exc:
                print(f"[nube] no se borro el sobre {LIMPIO!r}: {exc}", flush=True)
                return False
            return True
        try:
            destino.write_text(str(content), encoding="utf-8")
            return True
        except OSError as exc:
            print(f"[nube] no se espejo el sobre {LIMPIO!r}: {exc}", flush=True)
            return False
    if LIMPIO.startswith(DECISIONES_PREFIX):
        if content is None:
            # una decision borrada ya no aplica; no toca el local
            return True
        destino = DATA_DIR / LIMPIO
        destino.parent.mkdir(parents=True, exist_ok=True)
        try:
            destino.write_text(str(content), encoding="utf-8")
            return True
        except OSError as exc:
            print(f"[nube] no se espejo la decision {LIMPIO!r}: {exc}", flush=True)
            return False
    return False
_SECTION_MIGRATION_LOCK = threading.Lock()
_SECTION_MIGRATED = False


def ensure_section_migration() -> None:
    """Importa una sola vez el state.json legado, sin pisar secciones nuevas."""
    global _SECTION_MIGRATED
    if _SECTION_MIGRATED:
        return
    with _SECTION_MIGRATION_LOCK:
        if _SECTION_MIGRATED:
            return
        try:
            legacy = CONTENT_STORE.read_state()
        except Exception as exc:
            print(f"[secciones] no se pudo leer state.json legado: {exc}", flush=True)
            legacy = None
        if isinstance(legacy, dict) and legacy:
            try:
                SECTION_STORE.import_state("main", legacy, "migracion", "servidor")
            except Exception as exc:
                print(f"[secciones] migracion inicial fallo: {exc}", flush=True)
        _SECTION_MIGRATED = True


def mirror_state_to_disk(project_id: str = "main") -> None:
    """Mantiene dashboard/data/state.json como espejo legible/exportable.

    Solo el proyecto `main` usa el espejo global: escribir el estado de otro
    proyecto encima borraría la exportación de quien trabaja en local.
    """
    if project_id != "main":
        return
    try:
        state = SECTION_STORE.read_state(project_id)
        if state:
            CONTENT_STORE.write_state(state)
    except Exception as exc:
        print(f"[secciones] no se pudo actualizar el espejo state.json: {exc}", flush=True)

START_TIME = time.time()

# Matrices Oficiales de Rúbrica: Nacional (Nicaragua Innova) y LATAM (100 Puntos)
RALLY_RUBRICS = {
    "latam": {
        "title": "Rúbrica Internacional Oficial (Rally LATAM - 28H)",
        "total_points": 100,
        "criteria": {
            "innovacion": {
                "title": "Grado de innovación de la solución propuesta",
                "weight": 30,
                "items": [
                    "La solución es innovadora (arquitectura no trivial y disrupción frente al estado del arte)",
                    "El equipo mostró capacidad creativa y diferenciación radical (Efecto Wow)",
                    "El equipo utiliza tecnologías apropiadas para el desafío",
                    "Grado de usabilidad y ergonomía de la solución propuesta"
                ]
            },
            "impacto": {
                "title": "Impacto positivo de la propuesta en la sociedad",
                "weight": 20,
                "items": [
                    "La propuesta da solución a una problemática específica regional",
                    "La propuesta tiene un valor social por encima de su valor de mercado",
                    "La propuesta mejora la calidad de vida de los ciudadanos a escala"
                ]
            },
            "prefactibilidad": {
                "title": "Prefactibilidad económica y social y sustentabilidad ambiental",
                "weight": 20,
                "items": [
                    "La propuesta es sustentable desde el punto de vista económico ($4,000 - $6,000 USD lote piloto sin subsidio permanente)",
                    "La propuesta contempla la eficiencia energética y apela a fuentes renovables",
                    "La propuesta optimiza el uso de recursos y principios de economía circular",
                    "La propuesta presenta alternativas de mejora a una problemática ambiental específica"
                ]
            },
            "viabilidad": {
                "title": "Viabilidad técnica de la propuesta",
                "weight": 20,
                "items": [
                    "Base teórica sólida y documentada con citas técnicas / patentes internacionales",
                    "El concepto utiliza recursos y componentes de fácil obtención regional",
                    "La propuesta es acorde a las necesidades de los potenciales usuarios",
                    "La solución está técnicamente validada (sin suposiciones energéticas o térmicas inviables)"
                ]
            },
            "presentacion": {
                "title": "Calidad de la presentación (Pitch 120s & Pautado SIRLI)",
                "weight": 10,
                "items": [
                    "La presentación demuestra capacidad de síntesis (conteo estricto de caracteres con espacios)",
                    "La presentación transmite con claridad la solución propuesta en 120s exactos",
                    "La propuesta de valor es clara y se ajusta rigurosamente al desafío",
                    "Las ilustraciones / diagramas / CAD 3D son claros y pertinentes"
                ]
            }
        }
    },
    "nacional": {
        "title": "Rúbrica Oficial Jurado Nacional (Nicaragua Innova - 24H)",
        "total_points": 100,
        "criteria": {
            "innovacion_nac": {
                "title": "Grado de Innovación, Creatividad y Hibridación Tecnológica",
                "weight": 25,
                "items": [
                    "Originalidad y diferenciación frente a soluciones convencionales en el entorno local",
                    "Hibridación tecnológica accesible (IoT ESP32/LoRa, gemelos digitales, IA, bio-materiales locales)",
                    "Capacidad creativa y prototipo conceptual/físico presentado",
                    "Adaptabilidad de la tecnología a la infraestructura y conectividad nacional"
                ]
            },
            "impacto_territorial": {
                "title": "Impacto Social, Territorial y Alineación con Políticas Públicas (PNDH)",
                "weight": 25,
                "items": [
                    "Alineación explícita con el Plan Nacional de Lucha contra la Pobreza y Desarrollo Humano 2022-2026",
                    "Articulación con programas nacionales (Ciudades Creativas, Soberanía Alimentaria, Ley 763)",
                    "Anclaje territorial específico (municipios reales, microparques, zonas vulnerables)",
                    "Cuantificación del impacto social (familias, cooperativas, empleos directos beneficiados)"
                ]
            },
            "viabilidad_local": {
                "title": "Viabilidad Técnica, Operativa y Uso de Recursos Locales",
                "weight": 20,
                "items": [
                    "Factibilidad de implementación en talleres locales, centros tecnológicos INATEC o laboratorios CNU",
                    "Aprovechamiento de materias primas o pasivos ambientales locales (residuos autóctonos)",
                    "Sustentación teórica y técnica del diseño con rigor metodológico",
                    "Claridad operativa y rol de los beneficiarios en el mantenimiento de la solución"
                ]
            },
            "prefactibilidad_canvas": {
                "title": "Prefactibilidad Económica, Sostenibilidad y Modelo Comunitario / Canvas",
                "weight": 15,
                "items": [
                    "Presupuesto de inversión aterrizado a la economía nacional (desglose unitario en C$ y USD)",
                    "Modelo de sostenibilidad financiera viable (cooperativas, alcaldías municipales, MEFCCA)",
                    "Eficiencia en la relación costo-beneficio para pequeños productores o entidades públicas",
                    "Plan de implementación por fases a 12 meses con indicadores de cumplimiento medibles"
                ]
            },
            "calidad_entregables": {
                "title": "Calidad del Documento Técnico (hasta 10 págs.), Video Pitch y Naming Dual",
                "weight": 15,
                "items": [
                    "Documento técnico estructurado con normas APA y fuentes oficiales (BCN, INIDE, ministerios)",
                    "Video pitch de 2 minutos claro, persuasivo, con dicción fluida y calidad audiovisual",
                    "Naming dual efectivo (nombre de squad cultural/patriótico + marca registrable de la solución)",
                    "Identidad cultural y comunicación empática con el jurado interinstitucional"
                ]
            }
        }
    }
}
RALLY_RUBRIC_SPEC = RALLY_RUBRICS["latam"]["criteria"]

class RallyApiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, format, *args):
        message = format % args
        message = re.sub(r"([?&]t=)[^&\s\"]+", r"\1***", message)
        super().log_message("%s", message)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        req_path = urllib.parse.unquote(url.path)
        if not self.project_param_ok(url.query):
            return
        if req_path == "/api/telemetry":
            self.send_telemetry()
        elif req_path in ("/health", "/api/health"):
            self.send_json_response(200, {
                "status": "ok",
                "service": "rally_service",
                "port": self.server.server_address[1],
                "ai": ai_provider_label(),
                "uptime_sec": int(time.time() - START_TIME),
                "timestamp": int(time.time() * 1000),
            })
        elif req_path == "/api/scan-sources":
            self.send_sources()
        elif req_path == "/api/rubric":
            self.send_rubric()
        elif req_path == "/api/template-status":
            self.send_json_response(200, pautado_template_status())
        elif req_path == "/api/ai/status":
            result = ai_provider_summary()
            self.send_json_response(200, result)
        elif req_path == "/api/ai/models":
            models = []
            summary = ai_provider_summary()
            if summary.get("provider") == "OpenCode":
                models = _list_opencode_models()
            env = _env_endpoint_config()
            if env:
                for m in _probe_openai_models(env["url"]):
                    if m not in models:
                        models.append(m)
            self.send_json_response(200, {"status": "ok", "models": models})
        elif req_path == "/api/ai/progress":
            params = urllib.parse.parse_qs(url.query)
            job_id = (params.get("job", [""])[0] or "").strip()
            job = AI_JOBS.get(job_id)
            if not job:
                self.send_json_response(404, {"status": "error", "message": "Trabajo de IA no encontrado"})
                return
            self.send_json_response(200, {
                "status": job.get("status"),
                "text": job.get("text", ""),
                "chars": len(job.get("text", "")),
                "provider": job.get("provider"),
                "model": job.get("model"),
                "done": job.get("status") in ("done", "error"),
                "message": job.get("message"),
            })
        elif req_path == "/api/state":
            ensure_section_migration()
            project = self.project_id(url.query)
            if self.require_member(project) is None:
                return
            state = SECTION_STORE.read_state(project)
            if not state and project == "main":
                state = CONTENT_STORE.read_state() or {}
            self.send_json_response(200, {"state": state, "project": project}, cors=False)
        elif req_path == "/api/sections":
            ensure_section_migration()
            project = self.project_id(url.query)
            if self.require_member(project) is None:
                return
            params = urllib.parse.parse_qs(url.query)
            try:
                since = int(params.get("since", ["0"])[0] or 0)
            except ValueError:
                since = 0
            seq, sections = SECTION_STORE.read_sections(project, since)
            self.send_json_response(200, {
                "ok": True, "project": project, "seq": seq, "sections": sections,
            }, cors=True)
        elif req_path == "/api/events":
            ensure_section_migration()
            project = self.project_id(url.query)
            if self.require_member(project) is None:
                return
            params = urllib.parse.parse_qs(url.query)
            try:
                since = int(params.get("since", ["0"])[0] or 0)
                limit = int(params.get("limit", ["100"])[0] or 100)
            except ValueError:
                since, limit = 0, 100
            self.send_json_response(200, {
                "ok": True, "project": project,
                "events": SECTION_STORE.events(project, since, limit),
            }, cors=True)
        elif req_path == "/api/session":
            project = self.project_id(url.query)
            member = self.require_member(project)
            if member is None:
                return
            self.send_json_response(200, {
                "ok": True, "project": project, "member": member,
            }, cors=True)
        elif req_path == "/api/members":
            project = self.project_id(url.query)
            member = self.require_member(project, ("admin", "operator"))
            if member is None:
                return
            self.send_json_response(200, {
                "ok": True, "project": project, "members": MEMBER_STORE.list_members(project),
            }, cors=True)
        elif req_path == "/api/content/schema":
            self.send_json_response(200, CONTENT_STORE.schema(), cors=False)
        elif req_path == "/api/content/manifest":
            self.send_json_response(200, CONTENT_STORE.manifest(), cors=False)
        elif req_path == "/api/presence":
            self.send_json_response(200, presence_list(), cors=True)
        elif req_path == "/api/sync/files":
            if not sync_authorized(self):
                self.send_json_response(403, {"ok": False, "error": "sync-no-autorizado"})
                return
            project = self.project_id(url.query)
            self.send_json_response(200, {
                "ok": True, "project": project, "files": NUBE_STORE.list_files(project),
            }, cors=True)
        elif req_path == "/api/sync/file":
            if not sync_authorized(self):
                self.send_json_response(403, {"ok": False, "error": "sync-no-autorizado"})
                return
            project = self.project_id(url.query)
            params = urllib.parse.parse_qs(url.query)
            rel_path = (params.get("path", [""])[0] or "").strip()
            try:
                data = NUBE_STORE.read_file(project, rel_path)
            except NubeError as exc:
                self.send_json_response(400, {"ok": False, "error": str(exc)})
                return
            if data is None:
                self.send_json_response(404, {"ok": False, "error": "archivo-vacio-en-nube"})
                return
            self.send_json_response(200, {"ok": True, "project": project, "file": data}, cors=True)
        elif req_path == "/api/sync/changes":
            if not sync_authorized(self):
                self.send_json_response(403, {"ok": False, "error": "sync-no-autorizado"})
                return
            project = self.project_id(url.query)
            params = urllib.parse.parse_qs(url.query)
            try:
                since = int(params.get("since", ["0"])[0] or 0)
                limit = int(params.get("limit", ["200"])[0] or 200)
            except ValueError:
                since, limit = 0, 200
            feed = NUBE_STORE.changes(project, since=since, limit=limit)
            self.send_json_response(200, {"ok": True, "project": project, **feed}, cors=True)
        elif req_path.startswith("/api/content/"):
            self.serve_content_item(req_path[len("/api/content/"):])
        else:
            # Normalizar ruta dashboard
            clean_path = req_path
            if clean_path.startswith("/dashboard/"):
                clean_path = clean_path[len("/dashboard"):]
            elif clean_path == "/dashboard":
                clean_path = "/"

            rel = clean_path.lstrip("/")
            if self.private_static(rel):
                self.send_json_response(404, {"ok": False, "error": "no-encontrado"}, cors=False)
                return
            if not rel or rel == "index.html":
                target = DASHBOARD_DIR / "index.html"
                if target.exists():
                    self.serve_custom_file(target)
                    return

            target_dash = DASHBOARD_DIR / rel
            if target_dash.exists() and target_dash.is_file():
                self.serve_custom_file(target_dash)
                return

            # Probar en BASE_DIR (para /budget, /site, /docs, /knowledge)
            base_rel = req_path.lstrip("/")
            target_base = BASE_DIR / base_rel
            if target_base.exists() and target_base.is_file():
                self.serve_custom_file(target_base)
                return
            # Directorios: servir su index.html (ej. /site/ → site/index.html)
            if target_base.exists() and target_base.is_dir():
                dir_index = target_base / "index.html"
                if dir_index.exists():
                    self.serve_custom_file(dir_index)
                    return

            super().do_GET()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if not self.project_param_ok(url.query):
            return
        if url.path == "/api/ai":
            ok, extra, msg = ai_rate_check(self)
            if not ok:
                body = json.dumps({"status": "rate-limit", "message": msg}).encode("utf-8")
                self.send_response(429)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                for k, v in extra.items():
                    self.send_header(k, v)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(body)
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
                prompt = (data.get("prompt") or "").strip()
                model = (data.get("model") or "").strip()
                if not prompt:
                    self.send_json_response(400, {"status": "error", "message": "Prompt vacio"})
                    return
                summary = ai_provider_summary()
                if summary.get("status") != "ok":
                    self.send_json_response(200, {"status": "no-provider", "message": summary.get("message", "Sin IA conectada")})
                    return
                job_id = uuid.uuid4().hex[:10]
                AI_JOBS[job_id] = {"status": "queued", "text": "", "model": model, "provider": None,
                                   "message": None, "ts": time.time()}
                t = threading.Thread(target=_ai_job_worker, args=(job_id, prompt, model), daemon=True)
                t.start()
                # Limpieza: conservar solo los 20 trabajos mas recientes
                if len(AI_JOBS) > 20:
                    for old in sorted(AI_JOBS, key=lambda k: AI_JOBS[k].get("ts", 0))[: len(AI_JOBS) - 20]:
                        AI_JOBS.pop(old, None)
                self.send_json_response(200, {"status": "started", "job": job_id, "model": model or summary.get("model", "auto")})
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/ai/design":
            ok, extra, msg = ai_rate_check(self)
            if not ok:
                body = json.dumps({"status": "rate-limit", "message": msg}).encode("utf-8")
                self.send_response(429)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                for k, v in extra.items():
                    self.send_header(k, v)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(body)
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body) if body else {}
                colors = data.get("colors") or []
                image = data.get("image")
                result = ai_design_suggest(colors, image=image)
                self.send_json_response(200, result)
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/compile-docx":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                data = json.loads(body)
                result = compile_pautado_docx(data)
                self.send_json_response(200, result)
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/template-upload":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
                result = save_pautado_template(data)
                self.send_json_response(200 if result.get("status") == "ok" else 400, result)
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/presence":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = {}
            if not isinstance(data, dict):
                data = {}
            presence_beat(data.get("actor"), data.get("tab", ""), data.get("editing", ""))
            self.send_json_response(200, {"ok": True}, cors=True)
        elif url.path == "/api/sync/push":
            if not sync_authorized(self):
                self.send_json_response(403, {"ok": False, "error": "sync-no-autorizado"})
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = None
            if not isinstance(data, dict) or not isinstance(data.get("files"), list) or not data["files"]:
                self.send_json_response(400, {"ok": False, "error": "cuerpo-invalido",
                                              "message": "Se espera {\"files\":[{path, content, old_hash}], actor}"})
                return
            project = self.project_id(url.query)
            actor = str(data.get("actor") or "puente").strip()[:60]
            results = []
            any_error = False
            for item in data["files"]:
                if not isinstance(item, dict):
                    results.append({"status": "error", "error": "item-invalido"})
                    any_error = True
                    continue
                rel_path = item.get("path")
                content = item.get("content")
                old_hash = item.get("old_hash")
                try:
                    pushed = NUBE_STORE.push(project, rel_path, content, old_hash, actor)
                    results.append({"path": pushed["path"], "status": "pushed",
                                    "sha256": pushed["sha256"], "version": pushed["version"]})
                    espejo_nube_contenido(pushed["path"], content)
                except NubeConflict as cond:
                    results.append({"path": rel_path, "status": "conflict",
                                    "remote": cond.remote})
                except NubeError as exc:
                    results.append({"path": rel_path, "status": "error", "error": str(exc)})
                    any_error = True
                except Exception as exc:
                    results.append({"path": rel_path, "status": "error",
                                    "error": str(exc)[:200]})
                    any_error = True
            pushed_count = sum(1 for r in results if r.get("status") == "pushed")
            code = 200 if not any_error and pushed_count == len(results) else 207
            self.send_json_response(code, {"ok": True, "project": project, "actor": actor,
                                           "results": results}, cors=True)
        elif url.path == "/api/asset-upload":
            project = self.project_id(url.query)
            if self.require_member(project) is None:
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", urllib.parse.unquote(self.headers.get("X-Asset-Name", "recurso.bin")))[:90]
                asset_id = uuid.uuid4().hex[:8]
                updir = BASE_DIR / "dashboard" / "assets_uploads"
                updir.mkdir(parents=True, exist_ok=True)
                out = updir / f"{asset_id}__{safe_name}"
                with open(out, "wb") as fh:
                    fh.write(body)
                self.send_json_response(200, {
                    "status": "ok",
                    "id": asset_id,
                    "name": safe_name,
                    "size": len(body),
                    "url": f"/dashboard/assets_uploads/{out.name}",
                    "timestamp": int(time.time() * 1000),
                })
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/asset-delete":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
                aid = data.get("id", "")
                updir = BASE_DIR / "dashboard" / "assets_uploads"
                removed = 0
                for f in updir.glob(aid + "__*"):
                    try:
                        f.unlink()
                        removed += 1
                    except OSError:
                        pass
                self.send_json_response(200, {"status": "ok", "removed": removed})
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/ocr":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                data = json.loads(body)
                img_data = data.get("image", "")
                # Capa 1: OCR semantico con modelo vision (endpoint de entorno)
                vision = None
                try:
                    vision = run_vision_ocr(img_data)
                except Exception:
                    vision = None
                if vision is not None:
                    challenges, raw_text = vision
                    self.send_json_response(200, {
                        "status": "ok",
                        "source": "ai",
                        "challenges": challenges,
                        "text": raw_text,
                    })
                    return
                # Capa 2: EasyOCR local (red de seguridad, sin IA conectada)
                text_result, lines_result = run_ocr_on_base64(img_data)
                self.send_json_response(200, {
                    "status": "ok",
                    "source": "easyocr",
                    "note": AI_VISION_LAST_ERROR,
                    "text": text_result,
                    "lines": lines_result
                })
            except ValueError as e:
                # Imagen danada o ilegible: avisar con claridad (la UI ofrece pegar el texto a mano)
                self.send_json_response(422, {"status": "bad-image", "message": str(e)})
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/ai/quick":
            ok, extra, msg = ai_rate_check(self)
            if not ok:
                body = json.dumps({"status": "rate-limit", "message": msg}).encode("utf-8")
                self.send_response(429)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                for k, v in extra.items():
                    self.send_header(k, v)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(body)
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
                text = (data.get("text") or "").strip()
                task = (data.get("task") or "polish").strip()
                if not text:
                    self.send_json_response(400, {"status": "error", "message": "Texto vacio"})
                    return
                self.send_json_response(200, ai_quick_task(task, text))
            except Exception as e:
                self.send_json_response(500, {"status": "error", "message": str(e)})
        elif url.path == "/api/project/claim":
            self.handle_claim_invite()
        elif url.path == "/api/invites":
            self.handle_create_invite(url)
        elif url.path.startswith("/api/members/") and url.path.endswith("/revoke"):
            self.handle_revoke_member(url)
        elif url.path == "/api/state":
            self.handle_post_state()
        elif url.path == "/api/sections/import":
            self.handle_post_sections_import(url)
        elif url.path.startswith("/api/sections/"):
            self.handle_post_sections(url)
        elif url.path.startswith("/api/content/"):
            self.handle_post_content(url.path)
        else:
            self.send_error(404, "Endpoint no encontrado")

    # ── Buzón de contenido y espejo de estado ───────────────────────────

    def serve_content_item(self, item_id):
        try:
            env = CONTENT_STORE.read(item_id)
        except KeyError:
            self.send_json_response(404, {"ok": False, "error": "no-encontrado"}, cors=False)
            return
        except Exception:
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=False)
            return
        self.send_json_response(200, env, cors=False)

    def project_id(self, query: str = "") -> str:
        params = urllib.parse.parse_qs(query or "")
        project = (params.get("project", ["main"])[0] or "main").strip()
        if not re.match(r"^[A-Za-z0-9_-]{1,64}$", project):
            return "main"
        return project

    def project_param_ok(self, query: str = "") -> bool:
        """Rechaza ids de proyecto inválidos en vez de caer en `main`."""
        params = urllib.parse.parse_qs(query or "")
        if "project" not in params:
            return True
        raw = (params.get("project", [""])[0] or "").strip()
        if re.match(r"^[A-Za-z0-9_-]{1,64}$", raw):
            return True
        self.send_json_response(400, {"ok": False, "error": "proyecto-invalido"}, cors=True)
        return False

    def private_static(self, rel: str) -> bool:
        """Nada privado del proyecto se sirve como archivo estático."""
        rel = (rel or "").replace("\\", "/").lower()
        if rel.startswith("data/"):
            name = rel.rsplit("/", 1)[-1]
            if rel.startswith("data/content/"):
                return True
            if name == "state.json" or name.startswith("state_") and name.endswith(".json"):
                return True
            if name.endswith((".db", ".db-wal", ".db-shm", ".sqlite")):
                return True
        if rel.startswith("assets_uploads/"):
            ext = rel.rsplit(".", 1)[-1] if "." in rel.rsplit("/", 1)[-1] else ""
            if ext in ("html", "htm", "svg", "xml"):
                return True
        return False

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8", errors="replace") if length else "{}"
        try:
            data = json.loads(raw)
        except ValueError:
            return {}
        return data if isinstance(data, dict) else {}

    def actor_from(self, data: dict) -> tuple[str, str]:
        actor = str(data.get("actor") or self.headers.get("X-Rally-Actor") or "Invitado")[:80]
        actor_id = str(data.get("actor_id") or self.headers.get("X-Rally-Actor-Id") or "")[:80]
        return actor, actor_id

    def bearer_token(self) -> str:
        raw = (self.headers.get("Authorization") or "").strip()
        return raw[7:].strip() if raw.lower().startswith("bearer ") else ""

    def require_member(self, project: str, roles: tuple[str, ...] = ()) -> dict | None:
        if not MEMBER_STORE.has_members(project):
            return {"id": "legacy", "name": "Local", "role": "legacy"}
        member = MEMBER_STORE.authenticate(project, self.bearer_token())
        if member is None:
            self.send_json_response(401, {"ok": False, "error": "no-autenticado"}, cors=True)
            return None
        if roles and member["role"] not in roles:
            self.send_json_response(403, {"ok": False, "error": "sin-permiso"}, cors=True)
            return None
        return member

    def member_or_actor(self, project: str, data: dict) -> tuple[str, str, dict] | None:
        member = self.require_member(project)
        if member is None:
            return None
        if member["id"] == "legacy":
            actor, actor_id = self.actor_from(data)
            return actor, actor_id, member
        actor, actor_id = self.actor_from(data)
        if actor_id.lower() == "ia" or actor.upper().startswith("IA"):
            return actor, actor_id, member
        return member["name"], member["id"], member

    def handle_claim_invite(self):
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        data = self.read_json_body()
        name = str(data.get("name") or "").strip()
        if not 1 <= len(name) <= 40:
            self.send_json_response(400, {"ok": False, "error": "nombre-invalido"}, cors=True)
            return
        try:
            result = MEMBER_STORE.claim_invite(
                str(data.get("token") or ""), name, str(data.get("device_id") or "")[:80]
            )
        except ValueError as exc:
            self.send_json_response(400, {"ok": False, "error": str(exc)}, cors=True)
            return
        except Exception as exc:
            print(f"[miembros] claim fallo: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, **result}, cors=True)

    def handle_create_invite(self, url) -> None:
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        project = self.project_id(url.query)
        member = self.require_member(project, ("admin", "operator"))
        if member is None:
            return
        data = self.read_json_body()
        try:
            ttl_hours = int(data.get("ttl_hours", 48))
        except (TypeError, ValueError):
            ttl_hours = 48
        ttl_hours = max(1, min(168, ttl_hours))
        try:
            result = MEMBER_STORE.create_invite(project, member["id"], ttl_hours)
        except ValueError as exc:
            self.send_json_response(400, {"ok": False, "error": str(exc)}, cors=True)
            return
        except Exception as exc:
            print(f"[miembros] crear invitacion fallo: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, "project": project, **result}, cors=True)

    def handle_revoke_member(self, url) -> None:
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        project = self.project_id(url.query)
        member = self.require_member(project, ("admin", "operator"))
        if member is None:
            return
        rest = urllib.parse.unquote(url.path[len("/api/members/"):])
        member_id = rest[:-len("/revoke")].strip("/")
        if not member_id:
            self.send_json_response(400, {"ok": False, "error": "miembro-requerido"}, cors=True)
            return
        try:
            result = MEMBER_STORE.revoke_member(project, member_id)
        except ValueError as exc:
            self.send_json_response(400, {"ok": False, "error": str(exc)}, cors=True)
            return
        except Exception as exc:
            print(f"[miembros] revocar fallo: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, "project": project, "member": result}, cors=True)

    def handle_post_state(self):
        """Compatibilidad: un cliente viejo solo puede importar secciones faltantes."""
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        data = self.read_json_body()
        state = data.get("state") if isinstance(data, dict) else None
        if not isinstance(state, dict):
            self.send_json_response(400, {"ok": False, "error": "state-invalido"}, cors=True)
            return
        project = self.project_id(urllib.parse.urlparse(self.path).query)
        if self.require_member(project, ("admin", "operator")) is None:
            return
        try:
            ensure_section_migration()
            result = SECTION_STORE.import_state(project, state, "cliente-legado", "legacy")
            mirror_state_to_disk(project)
        except Exception as exc:
            print(f"[secciones] no se pudo importar el estado legado: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, "mode": "legacy-import", **result}, cors=True)

    def handle_post_sections_import(self, url) -> None:
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        data = self.read_json_body()
        state = data.get("state")
        if not isinstance(state, dict):
            self.send_json_response(400, {"ok": False, "error": "state-invalido"}, cors=True)
            return
        project = self.project_id(url.query)
        if self.require_member(project, ("admin", "operator")) is None:
            return
        actor, actor_id = self.actor_from(data)
        try:
            ensure_section_migration()
            result = SECTION_STORE.import_state(project, state, actor, actor_id)
            mirror_state_to_disk(project)
        except Exception as exc:
            print(f"[secciones] import fallo: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, "project": project, **result}, cors=True)

    def handle_post_sections(self, url) -> None:
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=True)
            return
        rest = urllib.parse.unquote(url.path[len("/api/sections/"):]).strip("/")
        action = "write"
        if rest.endswith("/lock"):
            rest, action = rest[:-5].rstrip("/"), "lock"
        elif rest.endswith("/unlock"):
            rest, action = rest[:-7].rstrip("/"), "unlock"
        if not rest:
            self.send_json_response(404, {"ok": False, "error": "seccion-requerida"}, cors=True)
            return
        data = self.read_json_body()
        project = self.project_id(url.query)
        authorship = self.member_or_actor(project, data)
        if authorship is None:
            return
        actor, actor_id, _member = authorship
        try:
            ensure_section_migration()
            if action == "lock":
                section = SECTION_STORE.lock(
                    project, rest, actor, actor_id, data.get("ttl_minutes", 15)
                )
            elif action == "unlock":
                section = SECTION_STORE.unlock(project, rest, actor_id)
            else:
                section = SECTION_STORE.write_section(
                    project, rest, data.get("data"), data.get("base_version", 0),
                    actor, actor_id, data.get("ttl_minutes", 15),
                )
                mirror_state_to_disk(project)
        except SectionConflict as exc:
            self.send_json_response(409, {
                "ok": False, "error": "conflicto", "key": rest,
                "base_version": exc.base_version, "current": exc.current,
                "yours": {"data": data.get("data"), "base_version": data.get("base_version", 0)},
            }, cors=True)
            return
        except SectionLocked as exc:
            self.send_json_response(423, {
                "ok": False, "error": "bloqueada", "key": rest, "lock": exc.lock,
            }, cors=True)
            return
        except ValueError as exc:
            self.send_json_response(400, {"ok": False, "error": str(exc)}, cors=True)
            return
        except Exception as exc:
            print(f"[secciones] fallo {action} {rest!r}: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=True)
            return
        self.send_json_response(200, {"ok": True, "action": action, "section": section}, cors=True)

    def handle_post_content(self, path):
        if not self.origen_permitido():
            self.send_json_response(403, {"ok": False, "error": "origen-no-permitido"}, cors=False)
            return
        rest = path[len("/api/content/"):]
        parts = rest.split("/")
        if len(parts) != 2 or parts[1] not in ("apply", "discard") or not parts[0]:
            self.send_json_response(404, {"ok": False, "error": "no-encontrado"}, cors=False)
            return
        item_id, action = parts
        try:
            if action == "apply":
                CONTENT_STORE.apply(item_id)
            else:
                CONTENT_STORE.discard(item_id)
        except KeyError:
            self.send_json_response(404, {"ok": False, "error": "no-encontrado"}, cors=False)
            return
        except Exception as exc:
            print(f"[content] fallo al {action} {item_id!r}: {exc}", flush=True)
            self.send_json_response(500, {"ok": False, "error": "error-interno"}, cors=False)
            return
        # --- buzón cooperativo (Fase 2.3): publicar la decisión en la nube ----
        # La web decidió; el host local (agente) se entera por el feed:
        # 1) registra la decisión (content_decisiones/<id>.json, actor humano:web)
        # 2) saca el sobre pendiente (content/<id>.json) para que el manifiesto
        #    no lo vuelva a ofrecer en la pizarra.
        try:
            decision = {"action": action, "id": item_id, "decision_by": "humano:web"}
            previa = NUBE_STORE.read_file("main", DECISIONES_PREFIX + item_id + ".json")
            NUBE_STORE.push(
                "main",
                DECISIONES_PREFIX + item_id + ".json",
                json.dumps(decision, ensure_ascii=False),
                previa["sha256"] if previa else "",
                actor="humano:web",
            )
        except Exception as exc:
            print(f"[nube] decision {item_id!r} no se publico: {exc}", flush=True)
        try:
            sobra = NUBE_STORE.read_file("main", BUZON_PREFIX + item_id + ".json")
            if sobra:
                NUBE_STORE.delete_file(
                    "main", BUZON_PREFIX + item_id + ".json", sobra["sha256"], actor="humano:web"
                )
        except Exception as exc:
            print(f"[nube] sobre {item_id!r} no se retiro de la nube: {exc}", flush=True)
        self.send_json_response(200, {"ok": True}, cors=False)

    def send_telemetry(self):
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        uptime_sec = int(time.time() - START_TIME)
        payload = {
            "status": "online",
            "cpu_percent": cpu,
            "ram_used_mb": round((mem.total - mem.available) / (1024 * 1024), 1),
            "ram_percent": mem.percent,
            "uptime_sec": uptime_sec,
            "timestamp": int(time.time() * 1000)
        }
        self.send_json_response(200, payload)

    def send_rubric(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        rubric_type = query.get("type", ["latam"])[0].lower()
        if rubric_type in RALLY_RUBRICS:
            self.send_json_response(200, {
                "active_type": rubric_type,
                "rubric": RALLY_RUBRICS[rubric_type],
                "all_rubrics": RALLY_RUBRICS
            })
        else:
            self.send_json_response(200, {
                "active_type": "latam",
                "rubric": RALLY_RUBRICS["latam"],
                "all_rubrics": RALLY_RUBRICS
            })

    def send_sources(self):
        scan_results = []
        target_dirs = [SOURCES_DIR, BASE_DIR / "knowledge"]
        for d in target_dirs:
            if not d.exists():
                continue
            for item in d.iterdir():
                if item.is_file() and not item.name.startswith("."):
                    ext = item.suffix.lower()
                    cat = "document"
                    if ext in [".png", ".jpg", ".jpeg", ".svg", ".avif"]:
                        cat = "image"
                    elif ext in [".docx", ".doc"]:
                        cat = "pautado"
                    elif ext in [".pdf"]:
                        cat = "analysis"
                    elif ext in [".md", ".txt"]:
                        cat = "research"
                    
                    scan_results.append({
                        "name": item.name,
                        "size": item.stat().st_size,
                        "category": cat,
                        "ext": ext,
                        "path": str(item)
                    })
        self.send_json_response(200, {"sources": scan_results, "total": len(scan_results)})

    def serve_custom_file(self, target_path):
        mimetypes_map = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".pdf": "application/pdf",
            ".md": "text/markdown; charset=utf-8",
            ".txt": "text/plain; charset=utf-8"
        }
        mime = mimetypes_map.get(target_path.suffix.lower(), "application/octet-stream")

        content = target_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        if target_path.suffix.lower() in [".docx", ".xlsx", ".pdf"]:
            self.send_header("Content-Disposition", f'attachment; filename="{target_path.name}"')
        self.end_headers()
        self.wfile.write(content)

    def cors_origin(self) -> str | None:
        """Devuelve el Origin exacto si es local o de una red privada.

        No se usa comodin: el estado del proyecto puede viajar por la red del
        campus, pero solo between equipos de la misma red privada.
        """
        origin = (self.headers.get("Origin") or "").strip()
        if not origin:
            return None
        env = [x.strip().rstrip("/") for x in os.environ.get("RALLY_ALLOWED_ORIGINS", "").split(",") if x.strip()]
        if env:
            return origin if origin in env else None
        try:
            parsed = urllib.parse.urlparse(origin)
            host = (parsed.hostname or "").strip().lower()
        except Exception:
            return None
        if parsed.scheme not in ("http", "https") or not host:
            return None
        host_header = (self.headers.get("Host") or "").strip().lower()
        same_host = ""
        if host_header:
            try:
                same_host = (urllib.parse.urlsplit("//" + host_header).hostname or "").strip().lower()
            except Exception:
                same_host = ""
        if same_host and host == same_host:
            return origin
        if host in ("localhost", "127.0.0.1", "::1"):
            return origin
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            return None
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return origin
        return None

    def send_cors_headers(self, origin: str | None = None) -> None:
        origin = origin if origin is not None else self.cors_origin()
        if not origin:
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Rally-Actor, X-Rally-Actor-Id")
        self.send_header("Access-Control-Max-Age", "600")

    def do_OPTIONS(self):
        if not self.origen_permitido():
            self.send_response(403)
            self.end_headers()
            return
        self.send_response(204)
        self.send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_json_response(self, code, obj, cors=True):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        # Las rutas del buzon y del espejo no se anuncian a otros origenes.
        if cors:
            self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def origen_permitido(self):
        """Solo el propio servidor o una IP privada pueden mutar estado."""
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return self.cors_origin() == origin

# ── PLANTILLA PAUTADO OFICIAL: secciones, reglas y anclajes por evento ───────
# Cada evento trae su propio documento y sus propias reglas.
#   limit   = tope de caracteres CON espacios (None = el evento no fija tope por sección).
#   anchors = encabezados que identifican la sección (comparados sin acentos).
PAUTADO_SECTIONS = {
    "latam": {
        "problema":        {"label": "Definición del Problema", "limit": 1250,
                            "anchors": ["DESCRIPCION DE LA PROBLEMATICA", "PROBLEMATICA"]},
        "solucion":        {"label": "Solución Propuesta", "limit": 1250,
                            "anchors": ["DESCRIPCION DE LA SOLUCION", "SOLUCION PROPUESTA", "SOLUCION"]},
        "impacto":         {"label": "Impacto Social y Ambiental", "limit": 1000,
                            "anchors": ["IMPACTO"]},
        "innovacion":      {"label": "Grado de Innovación", "limit": 1000,
                            "anchors": ["INNOVACION"]},
        "prefactibilidad": {"label": "Prefactibilidad y Sostenibilidad", "limit": 1500,
                            "anchors": ["PRE FACTIBILIDAD", "PREFACTIBILIDAD", "FACTIBILIDAD"]},
    },
    "nacional": {
        "problema":        {"label": "Planteamiento del Problema", "limit": None,
                            "anchors": ["PLANTEAMIENTO DEL PROBLEMA", "IDENTIFICACION DEL PROBLEMA", "DEFINICION DEL PROBLEMA"]},
        "solucion":        {"label": "Propuesta de Valor", "limit": None,
                            "anchors": ["PROPUESTA DE VALOR", "DESCRIPCION DE LA SOLUCION"]},
        "innovacion":      {"label": "Contribución Innovadora", "limit": None,
                            "anchors": ["CONTRIBUCION INNOVADORA", "GRADO DE INNOVACION", "INNOVACION"]},
        "impacto":         {"label": "Evaluación de Impacto", "limit": None,
                            "anchors": ["EVALUACION DE IMPACTO", "IMPACTO"]},
        "prefactibilidad": {"label": "Prefactibilidad y Sostenibilidad", "limit": None,
                            "anchors": ["PRESUPUESTO", "PLAN DE IMPLEMENTACION", "PREFACTIBILIDAD"]},
    },
}

# Orden de las 5 secciones tal como se escriben en la plataforma.
PAUTADO_ORDER = ["problema", "solucion", "impacto", "innovacion", "prefactibilidad"]

# Palabras que delatan un párrafo de instrucciones (no es la respuesta del equipo).
_PAUTADO_INSTRUCTION_MARKERS = ("DESCRIBA", "FUNDAMENTE", "ENUMERE", "ESCRIBA", "MENCIONE", "JUSTIFIQUE")


def _plain(text):
    """Normaliza a MAYÚSCULAS sin acentos para comparar encabezados."""
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in decomposed if not unicodedata.combining(c)).upper().strip()


def _looks_like_heading(paragraph):
    """Detecta encabezados en MAYÚSCULAS (p. ej. PROPUESTAS, REFERENCIAS, BIBLIOGRAFÍA)."""
    txt = (paragraph.text or "").strip()
    if not txt or len(txt) > 110 or txt.endswith("."):
        return False
    letters = [c for c in txt if c.isalpha()]
    if not letters:
        return False
    return sum(1 for c in letters if c.isupper()) / len(letters) >= 0.7


def _user_template_path(rally_type):
    tpl_type = rally_type if rally_type in ("latam", "nacional") else "latam"
    return BASE_DIR / "knowledge" / f"user_template_{tpl_type}.docx"


def _reference_template_path(rally_type):
    name = "pautado_latam_ref.docx" if rally_type == "latam" else "pautado_nacional_ref.docx"
    return BASE_DIR / "knowledge" / name


def _event_sections(rally_type):
    return PAUTADO_SECTIONS.get(rally_type, PAUTADO_SECTIONS["latam"])


def _event_anchors(rally_type):
    anchors = []
    for spec in _event_sections(rally_type).values():
        anchors.extend(spec["anchors"])
    return anchors


def pautado_template_status():
    """Estado de plantillas: la subida por el usuario y la de referencia del evento."""
    templates = {}
    for tpl_type in ("latam", "nacional"):
        user = _user_template_path(tpl_type)
        ref = _reference_template_path(tpl_type)
        templates[tpl_type] = {
            "user": ({"name": user.name, "size": user.stat().st_size} if user.exists() else None),
            "reference": (ref.name if ref.exists() else None),
        }
    return {"status": "ok", "templates": templates}


def save_pautado_template(data):
    """Guarda o borra la plantilla .docx del evento que sube el equipo."""
    rally_type = (data.get("rally_type") or "latam").lower()
    if rally_type not in ("latam", "nacional"):
        rally_type = "latam"
    user = _user_template_path(rally_type)

    if data.get("clear"):
        if user.exists():
            user.unlink()
        return {"status": "ok", "cleared": True, "rally_type": rally_type}

    b64 = (data.get("data") or "").strip()
    if b64.lower().startswith("data:") and "," in b64:
        b64 = b64.split(",", 1)[1]
    if not b64:
        return {"status": "error", "message": "No se recibió ningún archivo."}
    try:
        raw = base64.b64decode(b64)
    except Exception as exc:
        return {"status": "error", "message": f"Archivo dañado (base64 inválido): {exc}"}
    if raw[:2] != b"PK":
        return {"status": "error", "message": "El archivo no es un .docx válido (no es un paquete ZIP)."}
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            if "word/document.xml" not in zf.namelist():
                return {"status": "error", "message": "El .docx no contiene word/document.xml."}
    except Exception as exc:
        return {"status": "error", "message": f"No se pudo abrir el .docx: {exc}"}

    user.parent.mkdir(parents=True, exist_ok=True)
    user.write_bytes(raw)
    safe_name = re.sub(r"[^A-Za-z0-9._ -]", "_", str(data.get("name") or user.name))[:80]
    return {"status": "ok", "rally_type": rally_type, "name": safe_name,
            "size": len(raw), "saved_as": user.name}


def _is_heading(paragraph, anchor):
    norm = _plain(paragraph.text)
    if anchor not in norm:
        return False
    return not any(marker in norm for marker in _PAUTADO_INSTRUCTION_MARKERS)


def _section_heading_index(paragraphs, key, rally_type):
    """Devuelve el índice del encabezado de la sección `key`, o -1."""
    anchors = _event_sections(rally_type).get(key, {}).get("anchors", [])
    # 1ª pasada: encabezado que menciona explícitamente los caracteres de la rúbrica.
    for idx, para in enumerate(paragraphs):
        norm = _plain(para.text)
        if any(a in norm for a in anchors) and "CARACTERES" in norm:
            return idx
    # 2ª pasada: cualquier bloque con el anclaje y sin texto de instrucciones.
    for idx, para in enumerate(paragraphs):
        if any(_is_heading(para, a) for a in anchors):
            return idx
    return -1


def _region_end(paragraphs, start, rally_type):
    """Primer encabezado (de cualquier sección) tras `start`: delimita el casillero."""
    anchors = _event_anchors(rally_type)
    for idx in range(start + 1, len(paragraphs)):
        para = paragraphs[idx]
        if any(_is_heading(para, a) for a in anchors) or _looks_like_heading(para):
            return idx
    return len(paragraphs)


def _fill_section(paragraphs, key, value, rally_type, warnings):
    """Escribe `value` en el casillero de la sección `key` del documento."""
    start = _section_heading_index(paragraphs, key, rally_type)
    if start < 0:
        warnings.append(f"No se encontró el encabezado de '{key}' en la plantilla; se adjuntó al final.")
        return False

    end = _region_end(paragraphs, start, rally_type)
    region = paragraphs[start + 1:end]
    content_slots = [p for p in region if not any(m in _plain(p.text) for m in _PAUTADO_INSTRUCTION_MARKERS)]

    # 1) Reemplazar la respuesta previa (el párrafo de contenido existente).
    long_slots = sorted(content_slots, key=lambda p: len(p.text.strip()), reverse=True)
    if long_slots and len(long_slots[0].text.strip()) >= 40:
        long_slots[0].text = value
        # Limpiar respuestas sobrantes de la misma sección (plantillas ya rellenadas).
        for extra in long_slots[1:]:
            if len(extra.text.strip()) >= 40:
                extra.text = ""
        return True

    # 2) Usar el primer casillero vacío que dejó la plantilla en blanco.
    for p in content_slots:
        if not p.text.strip():
            p.text = value
            return True

    # 3) Insertar un párrafo nuevo justo después del encabezado.
    try:
        from docx.oxml.ns import qn
        from docx.text.paragraph import Paragraph
        new_el = paragraphs[start]._p.makeelement(qn("w:p"), {})
        paragraphs[start]._p.addnext(new_el)
        Paragraph(new_el, paragraphs[start]._parent).text = value
        return True
    except Exception as exc:
        warnings.append(f"No se pudo insertar '{key}' en la plantilla: {exc}")
        return False


def compile_pautado_docx(data):
    rally_type = (data.get("rally_type") or "latam").lower()
    if rally_type not in ("latam", "nacional"):
        rally_type = "latam"
    pautado = data.get("pautado") or {}
    team = (data.get("team_name") or "EQUIPO").upper()
    sede = (data.get("university") or "SEDE").upper()
    challenge = (data.get("challenge_title") or "DESAFÍO").strip()
    proj = (data.get("project_name") or "PROYECTO").upper()

    warnings = []
    counts = {}

    # ── Reglas de rúbrica: conteo estricto de caracteres CON espacios ──────────
    clean = {}
    sections = _event_sections(rally_type)
    for key in PAUTADO_ORDER:
        spec = sections.get(key)
        if not spec:
            continue
        limit = spec.get("limit")
        val = (pautado.get(key) or "").strip()
        raw_len = len(val)
        if limit and raw_len > limit:
            val = val[:limit].rstrip()
            warnings.append(f"'{key}' excedía {limit} caracteres y fue recortada al límite oficial.")
        if not val:
            warnings.append(f"'{key}' está vacía: el jurado la evaluará como no entregada.")
        clean[key] = val
        counts[key] = {"chars": raw_len, "limit": limit,
                       "ok": raw_len > 0 and (limit is None or raw_len <= limit)}

    # ── Plantilla: la subida en el request > la guardada por el usuario > referencia ──
    user_tpl = _user_template_path(rally_type)
    uploaded = (data.get("template_b64") or "").strip()
    if uploaded:
        try:
            payload = uploaded.split(",", 1)[1] if uploaded.lower().startswith("data:") else uploaded
            raw = base64.b64decode(payload)
            if raw[:2] == b"PK":
                user_tpl.parent.mkdir(parents=True, exist_ok=True)
                user_tpl.write_bytes(raw)
            else:
                warnings.append("La plantilla enviada no es un .docx válido; se usará la de referencia.")
        except Exception as exc:
            warnings.append(f"No se pudo leer la plantilla enviada ({exc}); se usará la de referencia.")

    if user_tpl.exists():
        template_path, template_source = user_tpl, "usuario"
    else:
        template_path, template_source = _reference_template_path(rally_type), "referencia"

    if template_path.exists():
        doc = docx.Document(str(template_path))
    else:
        doc = docx.Document()
        warnings.append("No hay plantilla del evento disponible: se generó un documento base.")

    # ── Metadatos de cabecera ─────────────────────────────────────────────────
    for p in doc.paragraphs:
        txt = p.text
        if "EQUIPO:" in txt:
            p.text = f"EQUIPO: \t{team}"
        elif "SEDE:" in txt:
            p.text = f"SEDE: \t{sede}"
        elif "DESAFÍO SELECCIONADO:" in txt or "DESAFIO SELECCIONADO:" in txt:
            p.text = f"DESAFÍO SELECCIONADO: \t{challenge}"

    # ── Inyección de las 5 secciones oficiales en su casillero ─────────────────
    filled = 0
    for key in PAUTADO_ORDER:
        if clean.get(key) and _fill_section(doc.paragraphs, key, clean[key], rally_type, warnings):
            filled += 1

    if filled == 0:
        doc.add_heading(f"PROYECTO: {proj}", level=0)
        doc.add_paragraph(f"Equipo: {team} | Sede: {sede}\nDesafío: {challenge}")
        for key in PAUTADO_ORDER:
            if clean.get(key):
                doc.add_heading(sections[key]["label"], level=1)
                doc.add_paragraph(clean[key])

    out_path = DASHBOARD_DIR / "docs" / "pautado_draft.docx"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(out_path))
    return {
        "status": "ok",
        "file": "/docs/pautado_draft.docx",
        "template_source": template_source,
        "filled_sections": filled,
        "counts": counts,
        "warnings": warnings,
        "size": out_path.stat().st_size,
        "timestamp": int(time.time()),
    }

# ── PUENTE DE IA AUTOMATICO (sin copy-paste, sin hardcode) ─────────────────
# Descubrimiento dinamico en tiempo de ejecucion (nada de claves, rutas ni
# modelos fijados en el codigo; esto se publica en GitHub):
#  1. CLI de OpenCode si esta en PATH (`opencode run` + `opencode models`)
#  2. Endpoint OpenAI-compatible de capa gratuita via RALLY_AI_URL / RALLY_AI_KEY / RALLY_AI_MODEL
#  3. La UI ofrece chips de chats web gratis (ChatGPT, Claude, Gemini...) como ultimo recurso.
# Los trabajos corren en segundo plano y el navegador consulta /api/ai/progress
# para pintar el texto EN VIVO en el cuadro de destino.

AI_PROVIDER_TIMEOUT_GENERATE = 600
AI_PROVIDER_TIMEOUT_PROBE = 8
AI_MODELS_TTL = 600
AI_ARG_CHAR_LIMIT = 7000  # limite practico de argumentos en Windows

AI_JOBS = {}
AI_MODELS_CACHE = {"ts": 0.0, "models": [], "source": ""}
# Etiqueta del proveedor de IA ya conocida. /health NO debe lanzar la CLI
# `opencode models` (tarda y satura cuando hay varios servicios a la vez):
# solo lee lo que el hilo de arranque ya cacheo.
AI_PROVIDER_LABEL = {"value": "no-provider"}

_ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")

def _strip_ansi(text):
    return _ANSI_RE.sub("", text or "")

def _http_json_post(url, payload, timeout):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))

def _probe_openai_models(base_url):
    """Descubre modelos en un endpoint estilo /v1/models sin quemar cuota."""
    try:
        with urllib.request.urlopen(base_url.rstrip("/") + "/models", timeout=AI_PROVIDER_TIMEOUT_PROBE) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            return [m.get("id") for m in data.get("data", []) if m.get("id")]
    except Exception:
        return []

def _env_endpoint_config():
    url = os.environ.get("RALLY_AI_URL", "").strip()
    if not url:
        return None
    # Rotacion de claves: RALLY_AI_KEYS (CSV) es la lista de respaldo.
    # RALLY_AI_KEY sigue siendo la principal para no romper la config actual.
    keys = []
    for raw in (os.environ.get("RALLY_AI_KEYS", "") or "").split(","):
        k = raw.strip()
        if k and k not in keys:
            keys.append(k)
    main_key = os.environ.get("RALLY_AI_KEY", "").strip()
    if main_key and main_key not in keys:
        keys.insert(0, main_key)
    return {
        "url": url,
        "key": main_key or (keys[0] if keys else ""),
        "keys": keys or ([main_key] if main_key else []),
        "model": os.environ.get("RALLY_AI_MODEL", ""),
    }


# ---------- LIMITE DE USO (cuota compartida de la isla) ----------
# La isla es un unico servicio para todas las paginas publicadas. Sin este
# limite, una sola pagina podria agotar la cuota gratuita del proveedor.
# Configuracion por entorno:
#   RALLY_AI_RATE_LIMIT  = peticiones de IA por ventana y por IP (0 = sin limite)
#   RALLY_AI_RATE_WINDOW = segundos de la ventana (default 3600)
AI_RATE_LIMIT = int(os.environ.get("RALLY_AI_RATE_LIMIT", "0") or 0)
AI_RATE_WINDOW = int(os.environ.get("RALLY_AI_RATE_WINDOW", "3600") or 3600)
AI_RATE_STATE = {}
AI_RATE_LOCK = threading.Lock()
# Capa por-USUARIO (identidad voluntaria del header X-Rally-Actor, la misma
# identidad que usan los chips de presencia). Protege que un usuario muy
# activo devore la cuota de la isla sin cotar al resto. 0 = sin limite.
AI_USER_RATE_LIMIT = int(os.environ.get("RALLY_AI_USER_RATE_LIMIT", "0") or 0)
AI_USER_RATE_STATE = {}


def _client_ip(handler):
    """IP del cliente: respeta X-Forwarded-For si hay proxy delante."""
    try:
        fwd = (handler.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
        if fwd:
            return fwd
    except Exception:
        pass
    try:
        return handler.client_address[0]
    except Exception:
        return "desconocida"


def sync_authorized(handler) -> bool:
    """Autorizacion del puente de sincronizacion de archivos.

    Reglas honestas:
    - Si existe RALLY_SYNC_TOKEN (isla publicada), la peticion DEBE traer el
      token en el header X-Rally-Sync-Token. Sin token, rechaza.
    - Si no hay token configurado (modo local), solo pasa desde 127.0.0.1:
      la nube de archivos no tiene abierta la puerta a la Internet abierta.
    """
    expected = (os.environ.get("RALLY_SYNC_TOKEN") or "").strip()
    provided = (handler.headers.get("X-Rally-Sync-Token") or "").strip()
    if expected:
        return bool(provided) and provided == expected
    return _client_ip(handler) in ("127.0.0.1", "::1", "localhost")


def ai_rate_check(handler):
    """Devuelve (ok, headers_extra, mensaje). Dos capas consecutivas:

    1. Por usuario (X-Rally-Actor, identidad voluntaria): RALLY_AI_USER_RATE_LIMIT.
    2. Por IP (compartida): RALLY_AI_RATE_LIMIT (0 = sin limite).

    Ambos contadores viven solo en memoria (se reinician al reiniciar la isla)."""
    headers = {}
    if AI_USER_RATE_LIMIT > 0:
        try:
            actor = ((handler.headers.get("X-Rally-Actor") or "").strip())[:80]
        except Exception:
            actor = ""
        if actor:
            now = time.time()
            with AI_RATE_LOCK:
                if len(AI_USER_RATE_STATE) > 2048:
                    for k in [k for k, v in AI_USER_RATE_STATE.items() if now - v[0] > AI_RATE_WINDOW]:
                        AI_USER_RATE_STATE.pop(k, None)
                uent = AI_USER_RATE_STATE.get(actor)
                if not uent or now - uent[0] >= AI_RATE_WINDOW:
                    uent = (now, 0)
                ucount = uent[1]
                if ucount >= AI_USER_RATE_LIMIT:
                    reset = int(AI_RATE_WINDOW - (now - uent[0]))
                    return False, {
                        "Retry-After": str(max(1, reset)),
                        "X-RateLimit-Limit": str(AI_USER_RATE_LIMIT),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Scope": "usuario",
                    }, (f"Limite de {AI_USER_RATE_LIMIT} peticiones de IA por {AI_RATE_WINDOW // 60} min alcanzado "
                        f"para este usuario. Se restablece en {max(1, reset // 60 + 1)} min. "
                        f"El equipo puede seguir editando a mano o usar los chats web gratis.")
                AI_USER_RATE_STATE[actor] = (uent[0], ucount + 1)
                headers.update({
                    "X-RateLimit-Scope": "usuario",
                    "X-RateLimit-Limit": str(AI_USER_RATE_LIMIT),
                    "X-RateLimit-Remaining": str(max(0, AI_USER_RATE_LIMIT - ucount - 1)),
                })
    if AI_RATE_LIMIT <= 0:
        return True, headers, ""
    ip = _client_ip(handler)
    now = time.time()
    with AI_RATE_LOCK:
        # Purga de ventanas vencidas (evita que la memoria crezca sin fin).
        if len(AI_RATE_STATE) > 2048:
            for k in [k for k, v in AI_RATE_STATE.items() if now - v[0] > AI_RATE_WINDOW]:
                AI_RATE_STATE.pop(k, None)
        ent = AI_RATE_STATE.get(ip)
        if not ent or now - ent[0] >= AI_RATE_WINDOW:
            ent = (now, 0)
        count = ent[1]
        if count >= AI_RATE_LIMIT:
            reset = int(AI_RATE_WINDOW - (now - ent[0]))
            return False, {
                "Retry-After": str(max(1, reset)),
                "X-RateLimit-Limit": str(AI_RATE_LIMIT),
                "X-RateLimit-Remaining": "0",
            }, (f"Limite de {AI_RATE_LIMIT} peticiones de IA por {AI_RATE_WINDOW // 60} min alcanzado "
                f"para esta conexion. Se restablece en {max(1, reset // 60 + 1)} min. "
                f"El equipo puede seguir editando a mano o usar los chats web gratis.")
        AI_RATE_STATE[ip] = (ent[0], count + 1)
        if headers:
            # Ambas capas activas: los headers de IP mandan, se anexan los del usuario.
            merged = dict(headers)
            merged["X-RateLimit-Limit-IP"] = str(AI_RATE_LIMIT)
            merged["X-RateLimit-Remaining-IP"] = str(max(0, AI_RATE_LIMIT - count - 1))
            return True, merged, ""
        return True, {
            "X-RateLimit-Limit": str(AI_RATE_LIMIT),
            "X-RateLimit-Remaining": str(max(0, AI_RATE_LIMIT - count - 1)),
        }, ""


def _ai_key_candidates(env):
    """Claves a probar en orden: la principal y las de respaldo."""
    keys = list((env or {}).get("keys") or [])
    main = (env or {}).get("key", "")
    if main and main not in keys:
        keys.insert(0, main)
    return keys or [""]

def _list_opencode_models():
    """Descubre modelos de la CLI de OpenCode (cache TTL; sin nada hardcodeado)."""
    exe = shutil.which("opencode")
    if not exe:
        AI_MODELS_CACHE["models"] = []
        return []
    now = time.time()
    if now - AI_MODELS_CACHE.get("ts", 0) < AI_MODELS_TTL:
        return AI_MODELS_CACHE.get("models", [])
    ids = []
    try:
        args = [exe, "models"]
        if exe.lower().endswith((".cmd", ".bat", ".ps1")):
            args = ["cmd", "/c", exe, "models"]
        proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        _stdin = None
        out, _err = proc.communicate(timeout=30)
        for line in out.decode("utf-8", errors="replace").splitlines():
            clean = line.strip()
            if re.match(r"^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$", clean):
                ids.append(clean)
    except Exception:
        ids = []
    AI_MODELS_CACHE.update(ts=now, models=ids, source="opencode" if ids else "")
    AI_PROVIDER_LABEL["value"] = "OpenCode" if ids else AI_PROVIDER_LABEL["value"]
    return ids


def ai_provider_label():
    """Nombre del proveedor de IA sin lanzar procesos (para /health)."""
    cached = AI_MODELS_CACHE.get("models")
    if cached:
        return "OpenCode"
    env = _env_endpoint_config()
    if env and (env.get("model") or env.get("url")):
        return "Endpoint configurado"
    return AI_PROVIDER_LABEL.get("value", "no-provider")

def ai_provider_summary():
    """Resumen barato del estado del puente (sin gastar cuota ni ejecutar llamadas de pago)."""
    models = _list_opencode_models()
    if models:
        return {"status": "ok", "provider": "OpenCode", "model": "auto", "models": len(models)}
    env = _env_endpoint_config()
    if env:
        found = _probe_openai_models(env["url"])
        if env["model"] or found:
            return {"status": "ok", "provider": "Endpoint configurado",
                    "model": env["model"] or (found[0] if found else "auto"),
                    "models": len(found) or 1}
    return {
        "status": "no-provider",
        "message": (
            "Sin IA automatica conectada. Opciones GRATIS para activar la IA visual/pulido: "
            "1) FreeLLMAPI local (login basico en su panel, 34 proveedores gratis en un solo endpoint) apuntando RALLY_AI_URL a http://localhost:3001/v1; "
            "2) cualquier endpoint gratuito OpenAI-compatible (OpenRouter/Gemini AI Studio/Groq) en RALLY_AI_URL + RALLY_AI_KEY + RALLY_AI_MODEL; "
            "3) OpenCode CLI en PATH (`opencode auth login`, se detecta solo). "
            "Sin nada de esto el OCR cae a EasyOCR local y la UI ofrece chips de chats web (ChatGPT, Claude, Gemini, OpenCode Web, Antigravity)."
        ),
    }

def _run_ai_job_cmd(job, cmd, stdin_text):
    """Ejecuta un comando de IA y acumula el stdout en vivo dentro del job."""
    try:
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE if stdin_text else None,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except Exception as exc:
        job["status"] = "error"
        job["message"] = f"No se pudo iniciar la IA: {exc}"
        return
    job["status"] = "running"
    if stdin_text:
        try:
            proc.stdin.write(stdin_text.encode("utf-8", errors="replace"))
            proc.stdin.close()
        except Exception:
            pass
    for raw in iter(lambda: proc.stdout.readline(), b""):
        job["text"] += raw.decode("utf-8", errors="replace")
    err = _strip_ansi(proc.stderr.read().decode("utf-8", errors="replace")).strip()
    code = proc.wait()
    if code == 0 and job["text"].strip():
        job["status"] = "done"
    else:
        job["status"] = "error"
        tail = [l for l in err.splitlines() if l.strip()]
        job["message"] = tail[-1] if tail else "El comando de IA termino sin salida."
        if _detected_stdin_rejection(err):
            job["message"] += " (Tu build de OpenCode no acepta prompt por stdin; reinicia el intento.)"

def _detected_stdin_rejection(err_text):
    low = err_text.lower()
    return "unrecognized" in low or "no such option" in low or "unexpected argument" in low

def _pick_models_for(purpose, models, limit=3):
    """Candidatos ordenados para el proposito (vision / quick). Preferencia: capa gratis.

    Devuelve una lista (no un solo modelo) porque los proveedores gratis se
    saturan seguido ("rate limit exceeded") y conviene reintentar con otro.
    """
    patterns = {
        "vision": ["gemini", "flash", "vision", "gpt-4o", "glm-4v", "pixtral", "llava", "internvl", "qwen2-vl"],
        "quick": ["flash", "haiku", "mini", "fast", "turbo", "1b", "3b", "8b"],
    }.get(purpose, [])
    ranked, seen = [], set()
    free = [m for m in models if "free" in m.lower()]
    for pool in (free, models):
        for p in patterns:
            for m in pool:
                if m not in seen and p in m.lower():
                    seen.add(m)
                    ranked.append(m)
    for m in models:  # relleno: cualquier otro modelo sirve como ultimo recurso
        if m not in seen:
            seen.add(m)
            ranked.append(m)
    return ranked[:max(1, limit)]


def _pick_model_for(purpose, models):
    """Primer candidato del catalogo para el proposito (compatibilidad)."""
    candidates = _pick_models_for(purpose, models, limit=1)
    return candidates[0] if candidates else ""


def _endpoint_chat_raw(messages, timeout, model=None, purpose=None):
    """Llamada OpenAI-compatible al endpoint de entorno.

    Devuelve (texto, error). El error se conserva para poder decir la verdad
    cuando el proveedor gratis responde 429/rate limit en vez de fingir
    que no hay ninguna IA conectada.
    """
    env = _env_endpoint_config()
    if not env:
        return None, None
    chosen = model or env["model"]
    if not chosen:
        models = _probe_openai_models(env["url"])
        chosen = _pick_model_for(purpose or "", models)
    payload = {"model": chosen, "messages": messages, "stream": False}
    last_err = None
    # Rotacion de claves: si una clave esta agotada o rechazada, se prueba la
    # siguiente. Solo se rota ante errores de cuota/autenticacion.
    for key in _ai_key_candidates(env):
        headers = {"Content-Type": "application/json"}
        if key:
            headers["Authorization"] = f"Bearer {key}"
        req = urllib.request.Request(
            env["url"].rstrip("/") + "/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="replace"))
            text = ((data.get("choices") or [{}])[0].get("message", {}) or {}).get("content", "").strip()
            return (text or None), None
        except Exception as exc:
            detail = ""
            body = getattr(exc, "read", None)
            if callable(body):
                try:
                    detail = body().decode("utf-8", errors="replace")[:300]
                except Exception:
                    detail = ""
            last_err = detail or str(exc)
            low = last_err.lower()
            rotable = any(k in low for k in ("401", "403", "429", "quota", "rate limit",
                                             "rate-limit", "too many requests", "unauthorized",
                                             "invalid api key", "forbidden"))
            if not rotable:
                break
    return None, last_err


def _endpoint_chat(messages, timeout, purpose=None, force_model=None):
    """Una llamada OpenAI-compatible al endpoint de entorno. Devuelve texto o None."""
    text, _err = _endpoint_chat_raw(messages, timeout, model=force_model, purpose=purpose)
    return text


def _is_rate_limit(text):
    """Detecta saturacion/cuota agotada en la salida del proveedor o de la CLI."""
    low = (text or "").lower()
    return any(k in low for k in ("rate limit", "rate-limit", "429", "too many requests", "quota", "overloaded"))


# Tarea de pulido rapido (POST /api/ai/quick)
AI_QUICK_TASKS = {
    "polish": (
        "Eres un editor experto. Reescribe el texto del usuario: corrige redaccion, ortografia y puntuacion, "
        "organizalo con jerarquia clara (frases cortas, separacion entre ideas). NO agregues contenido nuevo, "
        "NO cambies el sentido ni inventes datos. Manten el idioma original. Texto:\n\n"
    ),
    "reframe": (
        "Convierte el texto del usuario en una instruccion precisa y completa para una IA: objetivo explicito, "
        "contexto minimo, formato de salida esperado. NO ejecutes la solicitud, solo reformula. "
        "Idioma: el del usuario. Texto:\n\n"
    ),
}


def ai_quick_task(task, text):
    """Pulido sincronico de prompts/textos: modelo mini del endpoint de entorno,
    con caida a la CLI de OpenCode si no hay endpoint configurado.

    Los proveedores gratis se saturan ("rate limit exceeded") con frecuencia,
    asi que se reintenta con varios modelos antes de rendirse, y si aun asi
    falla se devuelve el motivo real en vez de fingir que no hay IA conectada.
    """
    instruction = AI_QUICK_TASKS.get(task, AI_QUICK_TASKS["polish"])
    prompt_text = instruction + text
    errors = []

    # Capa 1: endpoint OpenAI-compatible de entorno (mini/free), con reintentos
    env = _env_endpoint_config()
    if env:
        candidates = ([env["model"]] if env.get("model") else []) or _pick_models_for(
            "quick", _probe_openai_models(env["url"]), limit=3
        )
        for model in candidates:
            out, err = _endpoint_chat_raw(
                [{"role": "user", "content": prompt_text}],
                timeout=90,
                model=model,
                purpose="quick",
            )
            if out:
                return {"status": "ok", "task": task, "text": out, "model": model}
            if err:
                errors.append(err)

    # Capa 2: CLI de OpenCode en PATH (un disparo sincrono por modelo)
    exe = shutil.which("opencode")
    if exe:
        models = _pick_models_for("quick", _list_opencode_models(), limit=3)
        base = [exe, "run"]
        if exe.lower().endswith((".cmd", ".bat", ".ps1")):
            base = ["cmd", "/c", exe, "run"]
        for model in (models or [""]):
            cmd = base + (["--model", model] if model else []) + [prompt_text]
            if len(prompt_text) > AI_ARG_CHAR_LIMIT:
                cmd = base + (["--model", model] if model else [])
            stdin_payload = prompt_text.encode("utf-8", errors="replace") if len(prompt_text) > AI_ARG_CHAR_LIMIT else None
            try:
                proc = subprocess.run(
                    cmd,
                    input=stdin_payload,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=120,
                )
                ans = _strip_ansi(proc.stdout.decode("utf-8", errors="replace")).strip()
                if ans and proc.returncode == 0:
                    return {"status": "ok", "task": task, "text": ans, "model": model or "auto"}
                tail = _strip_ansi(proc.stderr.decode("utf-8", errors="replace")).strip()
                errors.append(tail or f"La CLI termino con codigo {proc.returncode} sin respuesta.")
            except Exception as exc:
                errors.append(str(exc))

    if not env and not exe:
        return {"status": "no-provider",
                "message": "Sin IA rapida conectada. Instala OpenCode o define RALLY_AI_URL (FreeLLMAPI local u OpenRouter/Gemini/Groq)."}

    last = next((e for e in reversed(errors) if e), "")
    reason = "rate-limit" if _is_rate_limit(last) else "provider-error"
    friendly = (
        "Los modelos gratis estan saturados ahora mismo (rate limit). Reintenta en unos segundos"
        " o conecta FreeLLMAPI local / otro endpoint en RALLY_AI_URL."
        if reason == "rate-limit"
        else "La IA conectada respondio con error; revisa el detalle. EasyOCR sigue disponible como red de seguridad."
    )
    return {"status": "error", "task": task, "reason": reason, "message": friendly,
            "detail": (last.splitlines()[-1] if last else "")[:300]}


def _hex_to_rgb(c):
    c = str(c or "").strip().lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        return None
    try:
        return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))
    except ValueError:
        return None


def _rel_lum(rgb):
    def ch(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def _contrast(a, b):
    la, lb = _rel_lum(a), _rel_lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _hue_of(rgb):
    r, g, b = [v / 255.0 for v in rgb]
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return None
    if mx == r:
        h = ((g - b) / (mx - mn)) % 6
    elif mx == g:
        h = (b - r) / (mx - mn) + 2
    else:
        h = (r - g) / (mx - mn) + 4
    h *= 60
    return h + 360 if h < 0 else h


def _is_purple(rgb):
    h = _hue_of(rgb)
    return h is not None and 258 <= h <= 345


def _to_hex(rgb):
    return "#" + "".join("%02X" % max(0, min(255, int(round(v)))) for v in rgb)


def _darken(rgb, factor):
    f = factor if factor is not None else 0.5
    return tuple(v * f for v in rgb)


def _lighten(rgb, factor):
    f = factor if factor is not None else 0.4
    return tuple(v + (255 - v) * f for v in rgb)


def _rotate_hue(rgb, target):
    """Rota el tono HSL a `target` conservando saturacion y luz."""
    import colorsys
    r, g, b = [v / 255.0 for v in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    nr, ng, nb = colorsys.hls_to_rgb(target / 360.0, l, s)
    return (nr * 255, ng * 255, nb * 255)


_TONOS_SEGUROS = ["#0866F5", "#0F766E", "#15803D", "#B45309", "#C2410C", "#B91C1C"]


def _color_de_marca_seguro(primary, bg):
    """Elige un color de marca con contraste real contra el fondo y la tinta."""
    mejor = None
    mejor_ratio = -1.0
    for c in _TONOS_SEGUROS:
        rgb = _hex_to_rgb(c)
        if rgb is None or _is_purple(rgb):
            continue
        cr = _contrast(rgb, bg)
        cp = _contrast(rgb, primary) if primary else 99.0
        if cr >= 3 and cp >= 2:
            return rgb
        m = min(cr / 3.0, cp / 2.0)
        if m > mejor_ratio:
            mejor_ratio = m
            mejor = rgb
    return mejor or _hex_to_rgb("#0866F5")


def _es_casi_negro(rgb):
    """Negro o casi negro: el detalle de texto tipografico del logo."""
    if rgb is None:
        return False
    mx, mn = max(rgb), min(rgb)
    sat = 0.0 if mx == 0 else (mx - mn) / mx
    return _rel_lum(rgb) <= 0.08 and sat <= 0.35


def _saturacion(rgb):
    mx, mn = max(rgb), min(rgb)
    return 0.0 if mx == 0 else (mx - mn) / mx


def sanitize_design_palette(pal):
    """Convierte la paleta cruda de la IA en la paleta canonica de la marca.

    Entrada (IA): {primary, secondary, accent, bg, text} - primary/secondary/
    accent son colores de marca, text es el color del texto del logo.
    Salida (canonica): {bg, primary(tinta), secondary(fondo 2), accent(marca)}.

    Reglas: nada de morado/violeta, el negro del logo manda como tinta,
    el color de marca debe contrastar con la tinta y con el fondo.
    Devuelve (paleta_limpia, avisos).
    """
    pal = dict(pal or {})
    notes = []

    def leer(key):
        v = pal.get(key)
        return _hex_to_rgb(v) if v else None

    # 1. Fondo: claro o blanco.
    bg = leer("bg") or _hex_to_rgb("#FFFFFF")
    if _rel_lum(bg) < 0.85:
        bg = _hex_to_rgb("#FFFFFF")
        notes.append("fondo forzado a blanco")

    # 2. Candidatos de color de marca (los que la IA propuso).
    crudos = [leer("primary"), leer("secondary"), leer("accent")]
    crudos = [c for c in crudos if c is not None]

    # 3. Tinta: primero el negro real (texto del logo), si no el mas oscuro.
    texto = leer("text")
    negros = [c for c in crudos if _es_casi_negro(c)]
    if texto is not None and _es_casi_negro(texto):
        tinta = texto
        notes.append("tinta = negro del logo")
    elif negros:
        tinta = min(negros, key=_rel_lum)
        notes.append("tinta = negro del logo")
    elif crudos:
        tinta = min(crudos, key=_rel_lum)
    else:
        tinta = _hex_to_rgb("#0D1B35")
    if _is_purple(tinta):
        tinta = _hex_to_rgb("#0D1B35")
        notes.append("tinta morada -> tinta neutra")
    if _rel_lum(tinta) > 0.30:
        f = 0.6
        while f > 0.05 and _rel_lum(_darken(tinta, f)) > 0.30:
            f -= 0.05
        tinta = _darken(tinta, f)
        notes.append("tinta oscurecida para legibilidad")

    # 4. Color de marca: el que mas contraste da con la tinta, sin morado.
    # Se respeta la jerarquia de la IA (primary > secondary > accent).
    marcas = [c for c in crudos if not _es_casi_negro(c) and not _is_purple(c)]
    morados = [c for c in crudos if _is_purple(c)]
    marca = None
    for c in marcas:
        if _contrast(c, tinta) >= 3:
            marca = c
            break
    if marca is None and marcas:
        marca = max(marcas, key=_saturacion)
    elif marca is None and morados:
        marca = _rotate_hue(morados[0], 214)
        notes.append("marca morada -> azul")
    elif marca is None:
        marca = _color_de_marca_seguro(tinta, bg)
        notes.append("marca de contraste real")
    if _is_purple(marca):
        marca = _rotate_hue(marca, 214)
        notes.append("marca morada -> azul")
    if _contrast(marca, tinta) < 2:
        seguro = _color_de_marca_seguro(tinta, bg)
        if _contrast(seguro, tinta) >= 2 and _contrast(seguro, bg) >= 3:
            marca = seguro
            notes.append("marca con contraste real")
    # Legibilidad sobre el fondo: es dura (3:1).
    if _contrast(marca, bg) < 3.0:
        cand = marca
        for f in [x / 100.0 for x in range(85, 4, -5)]:
            cand = _darken(marca, f)
            if _contrast(cand, bg) >= 3.0:
                break
        else:
            cand = _lighten(marca, 0.5)
        marca = cand

    # 5. Fondo 2: tinte claro derivado de la marca.
    fondo2 = _lighten(marca, 0.88)
    if _rel_lum(fondo2) <= 0.85:
        fondo2 = _lighten(marca, 0.93)

    return {
        "bg": _to_hex(bg),
        "primary": _to_hex(tinta),
        "secondary": _to_hex(fondo2),
        "accent": _to_hex(marca),
    }, notes


def ai_design_suggest(colors, image=None):
    """Sugiere paleta + fuentes desde colores dominantes del logo usando el endpoint de IA.
    Si se pasa `image` (data URL base64), usa un modelo vision para analizar el logo real
    (incluyendo tipografia aproximada) en vez de solo los colores."""
    env = _env_endpoint_config()
    if not (env and (env.get("base_url") or env.get("api_key"))):
        return {"status": "no-provider", "message": "Sin IA conectada (RALLY_AI_URL)."}
    if image:
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": (
                    "Analiza este logo de un equipo de rally de innovacion. "
                    "Identifica colores dominantes (incluyendo negro y blanco si aparecen), estilo visual y tipografia aproximada. "
                    "Sugiere una paleta (primary, secondary, accent, bg, text) con buen contraste WCAG AA. "
                    "REGLA 1 - NEGRO: si el logo tiene detalles negros o casi negros, "
                    "el primary DEBE ser ese negro (por ejemplo #111111 o #0D1B35). "
                    "No reemplaces el negro por el color de marca si el logo claramente usa negro para el texto. "
                    "REGLA 2 - CONTRASTE: elige tambien colores de contraste, no solo el color dominante. "
                    "El accent debe contrastar claramente con el primary (ratio >= 3:1) y ser legible sobre bg. "
                    "REGLA 3 - SIN MORADO: PROHIBIDO morado, violeta, lila y magenta en cualquier rol, "
                    "tambien prohibidos cream/beige sobre fondo blanco. "
                    "Sugiere un par de fuentes de Google Fonts (title, body) coherentes con el estilo del logo. "
                    'Responde SOLO JSON valido, sin markdown: '
                    '{"palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","bg":"#ffffff","text":"#111111"},'
                    '"fonts":{"title":"NombreFuente","body":"NombreFuente"},"rationale":"texto breve"}'
                )},
                {"type": "image_url", "image_url": {"url": image}},
            ],
        }]
        timeout = 60
    else:
        prompt = (
            "Eres un disenador de identidad visual. Colores dominantes del logo: "
            + str(colors) + ". "
            "Sugiere una paleta (primary, secondary, accent, bg, text) con buen contraste WCAG AA. "
            "REGLA 1 - NEGRO: si el logo tiene detalles negros o casi negros, "
            "el primary DEBE ser ese negro (por ejemplo #111111 o #0D1B35). "
            "No reemplaces el negro por el color de marca si el logo claramente usa negro para el texto. "
            "REGLA 2 - CONTRASTE: elige tambien colores de contraste, no solo el color dominante. "
            "El accent debe contrastar claramente con el primary (ratio >= 3:1) y ser legible sobre bg. "
            "REGLA 3 - SIN MORADO: PROHIBIDO morado, violeta, lila y magenta en cualquier rol, "
            "tambien prohibidos cream/beige sobre fondo blanco. "
            "y un par de fuentes de Google Fonts (title, body) coherentes con el estilo. "
            'Responde SOLO JSON valido, sin markdown: '
            '{"palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","bg":"#ffffff","text":"#111111"},'
            '"fonts":{"title":"NombreFuente","body":"NombreFuente"},"rationale":"texto breve"}'
        )
        messages = [
            {"role": "system", "content": "Responde exclusivamente JSON valido, sin bloques de codigo."},
            {"role": "user", "content": prompt},
        ]
        timeout = 45
    try:
        if image:
            env2 = _env_endpoint_config()
            models = _probe_openai_models(env2["url"]) if env2 else []
            chosen = _pick_model_for("vision", models) or (env2.get("model") if env2 else None)
            text, err = _endpoint_chat_raw(messages, timeout=timeout, model=chosen, purpose="vision")
        else:
            text, err = _endpoint_chat_raw(messages, timeout=timeout, purpose="design")
    except Exception as e:
        return {"status": "error", "message": str(e)}
    if err or not text:
        return {"status": "error", "message": err or "sin respuesta"}
    obj = _extract_json_object(text)
    if not obj:
        return {"status": "error", "message": "respuesta no JSON", "raw": text[:300]}
    # Saneo del servidor: la paleta que sale de la IA nunca lleva morado
    # ni colores sin contraste, aunque el modelo se lo pidan.
    pal = obj.get("palette") or {}
    if isinstance(pal, dict) and pal:
        clean, notes = sanitize_design_palette(pal)
        obj["palette"] = clean
        if notes:
            obj["palette_notes"] = notes
    return {"status": "ok", **obj}


# OCR semantico: la imagen viaja al modelo vision del endpoint de entorno y
# regresa jerarquizada en JSON. EasyOCR queda como red de seguridad local.
AI_VISION_TIMEOUT = 120
# Motivo por el que la capa vision no pudo usarse en el ultimo intento
# (rate limit, sin endpoint, etc.). La UI lo muestra para no dejar al usuario
# creyendo que el OCR local es lo unico que existe.
AI_VISION_LAST_ERROR = ""
_OCR_VISION_PROMPT = (
    "Analiza la imagen: es una convocatoria, poster o captura con retos/desafios de un rally de innovacion. "
    "1) Transcribe TODO el texto legible en 'texto'. 2) Identifica cada reto individual y devuelvelo jerarquizado. "
    "Responde EXCLUSIVAMENTE un JSON valido, sin explicaciones, con esta forma:\n"
    '{"texto": "<transcripcion fiel y limpia del texto de la imagen>",\n'
    ' "retos": [{"titulo": "<titulo corto del reto>", "demanda": "<demanda/descripcion tecnica del reto>", '
    '"ods": ["ODS 9"], "categoria": "Innovacion | Impacto Social | Prefactibilidad"}]}\n'
    "Si la imagen solo contiene un reto, devuelve un solo elemento en 'retos'. "
    "Si no hay retos identificables, devuelve 'retos': []. Siempre incluye 'texto'."
)


def _extract_json_object(text):
    """Primer balanceo llave-llave de un texto que puede traer razon de mas."""
    t = (text or "").strip()
    t = re.sub(r"^```(?:json)?|```$", "", t, flags=re.IGNORECASE).strip()
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        return json.loads(t[start:end + 1])
    except Exception:
        return None


def _norm_ods_list(ods):
    out = []
    if isinstance(ods, str):
        ods = [ods]
    for o in ods or []:
        s = str(o).strip().upper()
        if not s:
            continue
        if not s.startswith("ODS"):
            s = "ODS " + s.lstrip("#.: ").upper()
        out.append(s)
    seen, uniq = set(), []
    for s in out:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


def run_vision_ocr(base64_data_url):
    """Capa 1 del OCR: modelo vision del endpoint de entorno.
    Devuelve (challenges, texto_transcrito) o None si no hay endpoint/de modelo.
    Reintenta con varios modelos vision porque los gratis se saturan seguido."""
    global AI_VISION_LAST_ERROR
    AI_VISION_LAST_ERROR = ""
    if not base64_data_url:
        AI_VISION_LAST_ERROR = "No llego imagen para el OCR con IA."
        return None
    env = _env_endpoint_config()
    if not env:
        AI_VISION_LAST_ERROR = "Sin endpoint de IA configurado (RALLY_AI_URL); usando EasyOCR local."
        return None
    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": _OCR_VISION_PROMPT},
            {"type": "image_url", "image_url": {"url": base64_data_url}},
        ],
    }]
    forced = os.environ.get("RALLY_VISION_MODEL", "").strip()
    candidates = [forced] if forced else _pick_models_for(
        "vision", _probe_openai_models(env["url"]), limit=3
    )
    raw = None
    errors = []
    for model in candidates:
        raw, err = _endpoint_chat_raw(messages, timeout=AI_VISION_TIMEOUT, model=model, purpose="vision")
        if raw:
            break
        if err:
            errors.append(err)
    if not raw:
        last = next((e for e in reversed(errors) if e), "")
        if _is_rate_limit(last):
            AI_VISION_LAST_ERROR = "Los modelos vision gratis estan saturados (rate limit); se uso EasyOCR local."
        elif last:
            AI_VISION_LAST_ERROR = f"El modelo vision fallo ({last.splitlines()[-1][:160]}); se uso EasyOCR local."
        else:
            AI_VISION_LAST_ERROR = "El modelo vision no respondio; se uso EasyOCR local."
        return None
    data = _extract_json_object(raw)
    clean_text = ""
    challenges = []
    if isinstance(data, dict):
        clean_text = str(data.get("texto") or data.get("text") or "").strip()
        for item in data.get("retos") or []:
            if not isinstance(item, dict):
                continue
            title = str(item.get("titulo") or item.get("title") or "").strip()
            if not title:
                continue
            challenges.append({
                "title": title[:90],
                "demand": str(item.get("demanda") or item.get("demand") or "").strip(),
                "ods": _norm_ods_list(item.get("ods")),
                "category": str(item.get("categoria") or item.get("category") or "Innovacion").strip(),
            })
    if not clean_text:
        # El modelo respondio texto plano (sin JSON util): sirve como OCR de alta calidad
        clean_text = raw
    return challenges, clean_text


def _env_endpoint_call(job, prompt):
    env = _env_endpoint_config()
    if not env:
        return False
    try:
        models = _probe_openai_models(env["url"])
        model = env["model"] or (models[0] if models else "openrouter/auto")
        payload = {"model": model, "messages": [{"role": "user", "content": prompt}], "stream": False}
        headers = {"Content-Type": "application/json"}
        if env["key"]:
            headers["Authorization"] = f"Bearer {env['key']}"
        req = urllib.request.Request(
            env["url"].rstrip("/") + "/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=AI_PROVIDER_TIMEOUT_GENERATE) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        text = ((data.get("choices") or [{}])[0].get("message", {}) or {}).get("content", "").strip()
        if not text:
            raise ValueError("respuesta vacia del endpoint configurado")
        job.update({"status": "done", "text": text, "provider": "Endpoint configurado", "model": model})
        return True
    except Exception as exc:
        job["message"] = f"Endpoint por entorno fallo: {exc}"
        return False

def _ai_job_worker(job_id, prompt, model):
    job = AI_JOBS.get(job_id)
    if not job:
        return
    exe = shutil.which("opencode")
    if exe:
        cmd = [exe, "run"]
        if exe.lower().endswith((".cmd", ".bat", ".ps1")):
            cmd = ["cmd", "/c", exe, "run"]
        if model:
            cmd += ["--model", model]
        if len(prompt) <= AI_ARG_CHAR_LIMIT:
            cmd.append(prompt)
            stdin_text = None
        else:
            stdin_text = prompt
        _run_ai_job_cmd(job, cmd, stdin_text)
        if job.get("status") == "done":
            job["provider"] = "OpenCode"
            job["model"] = model or "auto"
            return
        if _env_endpoint_call(job, prompt):
            return
    elif _env_endpoint_call(job, prompt):
        return
    if job.get("status") != "done":
        job["status"] = "error"
        if not job.get("message"):
            job["message"] = ai_provider_summary().get("message")
        job["hint"] = "chips"

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    # En Windows, allow_reuse_address=True deja que DOS procesos escuchen el mismo
    # puerto a la vez: el SO reparte las conexiones y una instancia vieja responde
    # con codigo obsoleto (sintoma: "ya reinicie y sigue igual"). En Windows
    # entonces reservamos el puerto en exclusiva; en Linux/Mac se conserva el
    # comportamiento clasico para sobrevivir a reinicios con TIME_WAIT.
    allow_reuse_address = os.name != "nt"
    allow_reuse_port = False
    daemon_threads = True

    def server_bind(self):
        if os.name == "nt":
            try:
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            except Exception:
                pass
        super().server_bind()

    def handle_error(self, request, client_address):
        # Ignorar desconexiones abruptas del navegador
        pass

def _port_is_busy(port):
    """True si algun proceso ya escucha ese puerto (comprobacion SIN reuse)."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        if os.name == "nt":
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        probe.bind(("", port))
        return False
    except OSError:
        return True
    finally:
        try:
            probe.close()
        except Exception:
            pass

if __name__ == "__main__":
    # Salida tolerante a acentos/emoji y a consolas cerradas (evita muertes silenciosas)
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    # Precaalentar descubrimiento de modelos de IA (hilo aparte; no bloquea el arranque)
    threading.Thread(target=_list_opencode_models, daemon=True).start()
    port_env = os.environ.get("RALLY_SERVICE_PORT", "").strip()
    candidates = [int(port_env)] if port_env.isdigit() else [8000, 8080, 8001, 8008]
    selected_port = None
    httpd = None

    for p in candidates:
        if _port_is_busy(p):
            print(f"Puerto {p} ocupado por otro proceso: probando el siguiente.", flush=True)
            continue
        try:
            addr = ("", p)
            httpd = ThreadedTCPServer(addr, RallyApiHandler)
            selected_port = p
            break
        except Exception as exc:
            print(f"No se pudo abrir el puerto {p}: {exc}", flush=True)
            continue

    if httpd and selected_port:
        print(f"Rally Service activo y escuchando en http://localhost:{selected_port}", flush=True)
        while True:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServidor detenido.", flush=True)
                break
            except Exception as exc:
                try:
                    print(f"Aviso interno atendido, el servicio continua: {exc}", flush=True)
                except Exception:
                    pass
                time.sleep(0.5)
    else:
        print("Error: No se pudo abrir ninguno de los puertos candidatos (8000, 8080, 8001).", flush=True)
