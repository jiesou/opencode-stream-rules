import type { Plugin } from "@opencode-ai/plugin"
import { RULES } from "./rules.ts"

export { isBlockedTmp } from "./rules.ts"

export interface Rule {
  match: (v: string) => boolean
  notice: string
  reject?: boolean  // feature not bug: only reject first time, agent call again to bypass
}

function collectStrings(v: unknown, out: string[]): void {
  if (typeof v === "string") out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out))
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectStrings(x, out))
}

function scanArgs(args: unknown, match: Rule["match"]): boolean {
  const parts: string[] = []
  collectStrings(args, parts)
  return match(parts.join(" "))
}

const notified = new Set<string>()
const SYSTEM_PREFIX = "SYSTEM NOTICE: "

const matchRule = (rule: Rule, args: unknown): boolean => scanArgs(args, rule.match)

export const StreamRules: Plugin = async ({ client }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = input.sessionID
      const ruleIndex = RULES.findIndex((r) => matchRule(r, output.args))
      if (ruleIndex === -1) return

      const rule = RULES[ruleIndex]
      const key = `${sessionID}#${ruleIndex}`

      const notice = `${SYSTEM_PREFIX}${rule.notice}`

      if (notified.has(key)) return
      notified.add(key)

      if (rule.reject) {
        throw new Error(rule.notice)
      } else {
        await client.session.prompt({
          path: { id: sessionID },
          body: {
            noReply: true,
            parts: [{ type: "text", text: notice }],
          },
        })
      }
    },
  }
}