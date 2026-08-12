# opencode-stream-rules

Inject rules when needed, without wasting context.

The agent learns the rule exactly when it needs it.

## Install

```sh
opencode plugin opencode-stream-rules
```

Or add to `opencode.json`:

```json
{
  "plugin": ["opencode-stream-rules"]
}
```

## Configure rules

Your rules live in **`rules.ts`** — plain TypeScript/JavaScript, so a `match`
can be any function, not just a regex. Edit the `RULES` array; each rule has a
`match` predicate, a `notice`, and an optional `reject`.

```ts
export const RULES: Rule[] = [
  {
    match: (v) => v.includes("pip") && v.includes("install"),
    reject: true,
    notice: "Use `uvx` or `uv venv` + `uv pip` instead of `pip install` directly",
  },
  {
    match: (v) => v.includes("pdf"),
    notice: "Use the `markitdown` skill to read PDF files.",
  },
]
```

### Rule fields

| field    | type                  | description                                                        |
| -------- | --------------------- | ------------------------------------------------------------------ |
| `match`  | `(v: string) => bool` | **Required.** Predicate over the joined tool-call args.            |
| `notice` | `string`              | **Required.** The `SYSTEM NOTICE` injected into the conversation.  |
| `reject` | `boolean`             | If `true`, throw and block the tool call instead of injecting.     |

The `match` predicate receives all string values of the tool call args joined
with a space (so `bash` command, `read` filePath, etc. are all covered). A
handful of helpers — `wildcard`, `isTmpSubPath`, `isBlockedTmp` — are exported
from `rules.ts` for convenience.

### Reject semantics

`reject: true` throws on the *first* match so the tool call is aborted and the
agent sees the notice as the error. The rule is then marked as notified for
the session — if the agent insists and calls the same command again, it passes
through. Rules that don't reject inject the notice as a hidden message instead,
without interrupting.
