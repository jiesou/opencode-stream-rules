import type { Plugin } from "@opencode-ai/plugin"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { readdir } from "node:fs/promises"

export interface Rule {
  match: (v: string) => boolean
  prompt: string
  reject?: boolean  // feature not bug: only reject first time, agent call again to bypass
}

const DEFAULT_RULES_DIR = join(dirname(fileURLToPath(import.meta.url)), "rules")

/** Load `*.ts` / `*.js` from a directory. Default: `./rules` next to this file. */
export async function loadUserRules(dir = DEFAULT_RULES_DIR): Promise<Rule[]> {
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return []
  }

  const rules: Rule[] = []
  // skip files start with `_`
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

function collectStrings(v: unknown, out: string[]): void {
  if (typeof v === "string") out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out))
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectStrings(x, out))
}

const notified = new Set<string>()

export const StreamRules: Plugin = async ({ client }, options) => {
  const RULES = await loadUserRules(typeof options?.rules === "string" ? options.rules : DEFAULT_RULES_DIR)

  return {
    "tool.execute.before": async (input, output) => {
      const parts: string[] = []
      collectStrings(output.args, parts)
      const ruleIndex = RULES.findIndex((r) => r.match(parts.join(" ")))
      if (ruleIndex === -1) return

      const rule = RULES[ruleIndex]
      const key = `${input.sessionID}#${ruleIndex}`
      if (notified.has(key)) return
      notified.add(key)

      if (rule.reject) throw new Error(rule.prompt)
      await client.session.prompt({
        path: { id: input.sessionID },
        body: {
          noReply: true,
          parts: [{ type: "text", text: `SYSTEM NOTICE: ${rule.prompt}` }],
        },
      })
    },
  }
}
