import type { Plugin } from "@opencode-ai/plugin"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { readdir } from "node:fs/promises"

export interface Rule {
  match: (v: string) => boolean
  prompt: string
  reject?: boolean // only first toolcall; retry is allowed
}

const DEFAULT_RULES_DIR = join(dirname(fileURLToPath(import.meta.url)), "rules")

export async function loadUserRules(dir = DEFAULT_RULES_DIR): Promise<Rule[]> {
  const names = await readdir(dir).catch(() => [] as string[])
  const rules: Rule[] = []
  for (const name of names.filter((n) => /\.(ts|js)$/.test(n) && !n.startsWith("_")).sort()) {
    try {
      const mod = await import(pathToFileURL(join(dir, name)).href)
      rules.push(...(mod.default ?? []))
    } catch (e) {
      console.warn(`[stream-rules] failed to load ${name}:`, e)
    }
  }
  return rules
}

function strings(v: unknown): string[] {
  if (typeof v === "string") return [v]
  if (Array.isArray(v)) return v.flatMap(strings)
  if (v && typeof v === "object") return Object.values(v).flatMap(strings)
  return []
}

const notified = new Set<string>()

export const StreamRules: Plugin = async ({ client }, options) => {
  const RULES = await loadUserRules(typeof options?.rules === "string" ? options.rules : DEFAULT_RULES_DIR)

  return {
    "tool.execute.before": async (input, output) => {
      const i = RULES.findIndex((r) => r.match(strings(output.args).join(" ")))
      if (i === -1) return

      const key = `${input.sessionID}#${i}`
      if (notified.has(key)) return
      notified.add(key)

      const { reject, prompt } = RULES[i]
      if (reject) throw new Error(prompt)
      await client.session.prompt({
        path: { id: input.sessionID },
        body: { noReply: true, parts: [{ type: "text", text: `SYSTEM NOTICE: ${prompt}` }] },
      })
    },
  }
}
