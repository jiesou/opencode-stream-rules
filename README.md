# opencode-stream-rules

Inject rules when needed, without wasting context.

## Install

```sh
opencode plugin opencode-stream-rules
```

Or add to `opencode.json`:

```json
{ "plugin": ["opencode-stream-rules"] }
```

## After installing

You need to write the rules in your own `.ts` file. This plugin WON'T WORK by default until you edit the rules.

- Rules live in the `rules/` directory next to this plugin (e.g. `~/.config/opencode/plugins/stream-rules`)
  - To point at a different rules directory: `{ "plugin": [["opencode-stream-rules", { "rules": "path/to/your/rules" }]] }`
- Files starting with `_` are skipped.
- Using `.ts` as rules makes it easier to write match functions without being limited to regx.

You can start with:

```sh
mv rules/rules.ts.example rules/rules.local.ts
```

### Writing rules

Example:

```ts
// rules/rules.local.ts
import type { Rule } from "../index.ts"

export default [
  {
    match: (v) =>
      v.includes("pip") &&
      v.includes("install") &&
      !v.includes("uv pip") &&
      !v.includes("uvx"),
    reject: true,
    prompt: "Use `uvx` or `uv venv` + `uv pip` instead of `pip install` directly",
  },
  {
    match: (v) => v.includes("pdf"),
    prompt: "Use the `markitdown` skill to read PDF files.",
  },
  // add your rules here
]
```

A rule has three fields:

| field    | required | description                                                          |
| -------- | -------- | -------------------------------------------------------------------- |
| `match`  | ✅       | (v: string) => boolean, any responses/toolcalls returned by LLM will attempted to be matched    |
| `prompt` | ✅       | The prompt for steering                  |
| `reject` |          | If `true`, prevent toolcalls first, instead of just steering |

