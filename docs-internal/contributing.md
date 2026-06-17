# Contributing

This is an internal contributor guide for humans and AI agents working
on Plinth.

## Branching

Lovable manages git internally; do not run stateful git commands. Make
focused commits via the platform.

## Commit style

- Imperative subject, ≤ 60 chars: "Add webhooks docs page".
- Body: what and why, not how.
- One concern per commit when possible.

## Plan vs build mode

- **Plan mode** for anything with multiple files, schema changes, or
  cross-role impact (e.g. brand + docs + copy).
- **Build mode** for narrow, well-scoped edits.

## Where to put things

| Adding...                          | Goes in                                      |
| ---------------------------------- | -------------------------------------------- |
| A public page                      | `src/routes/<name>.tsx`                      |
| A docs page                        | `src/routes/docs.<name>.tsx` + sidebar link  |
| A dashboard page                   | `src/routes/_authenticated/dashboard.<name>.tsx` |
| A REST endpoint                    | `src/routes/api/v1/<name>.ts`                |
| A webhook receiver                 | `src/routes/api/public/<name>.ts`            |
| A client-callable server function  | `src/lib/<area>.functions.ts`                |
| A server-only helper               | `src/lib/<area>.server.ts`                   |
| A migration                        | via `supabase--migration` tool               |
| An image / font / binary asset     | upload via `lovable-assets`, write `.asset.json` |

## Before you ship (checklist)

- [ ] No em dashes in copy (`rg "—" src/` returns nothing outside JSON examples).
- [ ] Every new public table has GRANTs and RLS policies in the migration.
- [ ] Every authed server function chains `requireSupabaseAuth`.
- [ ] Every new route has its own `head()` with title, description, og:title, og:description.
- [ ] Public route loaders do NOT call protected server functions.
- [ ] Logo, favicon, OG image still render (smoke check at `/`).
- [ ] Any new wedge / table / surface is reflected in the matching
      `docs-internal/*.md`.
- [ ] `docs-internal/README.md` updated if a load-bearing rule changed.

## Asking the user

Use the questions tool when scope or preference is genuinely ambiguous.
Do not ask about defaults (Lovable Cloud, Lovable AI Gateway).

---
Last reviewed: 2026-06-17.
