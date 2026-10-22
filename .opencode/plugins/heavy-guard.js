// heavy-guard.js -- Hook que bloquea llamadas DIRECTAS a binarios pesados.
//
// Todo comando de shell pasa por scripts/heavy_guard.py:
//   codigo 0 = permitir, 2/3 = bloqueado (la llamada debe ir por gpu_lock.py run).
// La lista de binarios vive en env.json (blocked_binaries); env.example.json
// es la plantilla. Ver docs/superpowers/specs/2026-10-21-orquestacion-especialistas-design.md (D2).
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

export const HeavyGuardPlugin = async ({ client, directory }) => {
  await client.app.log({
    body: {
      service: "heavy-guard",
      level: "info",
      message: "Guardia de binarios pesados activo (scripts/heavy_guard.py)",
    },
  })
  return {
    "tool.execute.before": async (input, output) => {
      const nombre = String(input?.tool || "").toLowerCase()
      if (nombre !== "shell" && nombre !== "bash") return
      const cmd = String(output?.args?.command ?? "")
      if (!cmd.trim()) return
      const res = spawnSync("python", [resolve(directory, "scripts", "heavy_guard.py"), "--str", cmd],
        { encoding: "utf8" })
      const salida = `${res.stdout || ""}${res.stderr || ""}`.trim()
      if (res.status === 3) throw new Error(`[GUARD] ${salida || "comando pesado directo bloqueado"}.`)
      if (res.status == null) {
        // el guardia no se pudo ejecutar: fallar cerrado, con mensaje claro
        throw new Error(
          "[GUARD] El guardia no se pudo ejecutar (¿falta python en PATH? tipea el error: "
          + `${salida || res.error?.message || "desconocido"}).`,
        )
      }
    },
  }
}
