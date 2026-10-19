# AGENTS.md — the entry contract

Orientation, the gate, and **which document owns which question**.
Start every session with `genome wake`; find an answer with `genome ask "<question>"`;
end every iteration with `genome close`.

## What this project is

meme-lyr is an AXI-style command-line tool that generates memes from ImgFlip templates, with aspect-ratio support and solid-colour padding for social platforms. The entry point is the `meme-lyr` binary, built with `npm run build`. AI agents call it from a shell, and people can run it by hand after storing ImgFlip credentials in `~/.meme-lyr/config.json`.

## Gate

```
npm test
```

## Routing table — which document answers what

| question | answer lives in |
|---|---|
| what is this / how to build / the rules (for agents) | this file |
| what is this, how do I install and run it (for readers) | `README.md` |
| how does it work, in depth (for readers) | `docs/` |
| where does the project stand right now | `docs/handoff/STATE.md` |
| what does a fresh agent read, in order | `docs/handoff/README.md` |
| what is left to do, and what was decided about each item | `TODO.md` |
| what did we ask the operator, and what did they rule | `docs/kb/ASKS.md` |
| how will we do X (plans) | `docs/plans/` |
| what was audited, what was found | `docs/audit/` |
| what was tried and rejected — do not re-litigate | `docs/kb/CLOSED.md` |
| exact commands, environment traps | `README.md#Manual Install` |
| what happened, session by session | `docs/kb/WORKLOG.md` |
| superseded history | `docs/archive/` |
| cross-agent messages, claims, mentions | `docs/kb/feed.md` |
| in-flight work per workflow | `docs/kb/workflows/` |

## Rules

1. One owner per question; amend the owner, never add a second.
2. Every document has a mutability class; append-only files only gain lines.
3. Nothing is deleted: superseded → `genome archive --reason`.
4. Terminal states name their evidence; numbers cite the artefact they came from.
5. Operator feedback amends its owner doc or record in the same session (`genome q rule ... --applied`).
