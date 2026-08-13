# opencode-stream-rules

Inject rules when needed, without wasting context.

<img height="700" alt="image" src="https://github.com/user-attachments/assets/f716fbe3-dbe8-4547-925d-b482eac01eaf" />

You can write custom streaming rules for the agent.

These rules are injected only as a steering notice after a pattern match, then agent retry from the same point.
This allows you to control the boundaries of agent behavior, without wasting context.

Similar to oh-my-pi's "Time-traveling stream rules", but with a very simple and compact code implementation.

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

You can start with:

```sh
mv rules/rules.ts.example rules/rules.local.ts
```

- Rules live in the `rules/` directory next to this plugin (e.g. `~/.config/opencode/plugins/stream-rules`)
  - Files starting with `_` are skipped.
  - To point at a different rules directory: `{ "plugin": [["opencode-stream-rules", { "rules": "path/to/your/rules" }]] }`
- Using `.ts` as rules makes it easier to write pattern match functions without being limited to regx. Code is cheap; let your agent write the code!
- A rule with `reject: true` will only be rejected on the first toolcall; subsequent attempts by the agent will be allowed. This provides steering while avoiding overly restricting the model (e.g., allowing `pip install` if it's already in a container).

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
    match: (v: string) => v.includes("curl") && v.includes("api.github.com"),
    prompt:
      "Prefer using `gh` cli over `curl https://api.github.com/...`. gh offers more requests limits.",
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


