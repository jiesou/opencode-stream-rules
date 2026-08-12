import type { Rule } from "./index.ts"

export const RULES: Rule[] = [
  {
    match: (v) =>
      v.includes("pip") &&
      v.includes("install") &&
      !v.includes("uv pip") &&
      !v.includes("uvx"),
    reject: true,
    notice: "Use `uvx` or `uv venv` + `uv pip` instead of `pip install` directly",
  },
  {
    match: (v) => v.includes("pdf"),
    notice: "Use the `markitdown` skill to read PDF files.",
  },
  // add your rules here
]
