import type { Rule } from "./index.ts"

export const RULES: Rule[] = [
  {
    match: (v) => v.includes("pdf"),
    notice: "Use the `markitdown` skill to read PDF files.",
  },
]
