# Design

## Direction: Editorial Warm

Print-press warmth, typographic confidence, no SaaS gloss. Generous
whitespace, rules and hairlines instead of cards-with-shadows. Mono used
as accent, not as the dominant voice.

## Colour tokens

Defined as `oklch` in `src/styles.css`. Use the token, never a hex.

| Token              | Role                                |
| ------------------ | ----------------------------------- |
| `--background`     | Cream page background               |
| `--surface`        | Slightly raised panel               |
| `--foreground`     | Deep navy text                      |
| `--muted-foreground` | Secondary text                    |
| `--signal`         | Terracotta accent (CTAs, highlights)|
| `--verified`       | Cool green (rare; payment states)   |
| `--hairline`       | Border colour                       |
| `--stone`          | Italic editorial text               |

Never hardcode `text-white`, `bg-black`, or bracket hex utilities.

## Typography

- **Display:** Instrument Serif (regular + italic). Use for H1/H2 and
  any feature number.
- **Body:** Inter 400/500/600/700.
- **Mono:** JetBrains Mono for code, labels, section markers (`§02`),
  and small uppercase chrome.

Apply `text-balance` to every H1 and H2. Multi-line marketing text
should breathe; never use hardcoded `<br/>`.

## Logo

The wordmark and "p." mark are CDN assets at:

- `src/assets/plinth-logo.png.asset.json`: wordmark (header/footer)
- `src/assets/favicon.png.asset.json`: square mark (favicon, apple-touch)
- `src/assets/og-image.png.asset.json`: 1200×630 social card

Header logo height: 28px. Footer logo height: 24px. Never recolour the
logo in CSS; if a new tint is needed, upload a new asset.

## Voice

- Plain, editorial, declarative. Short sentences. Prefer a period over
  an em dash.
- Never use the em dash (—). Use a period, a comma, parentheses, or a
  middle dot (·). This rule is mechanical; `rg "—" src/` should return
  nothing outside JSON code examples.
- Title separator is the middle dot (·), e.g. "Plinth · Product data
  for agents".
- Honest before clever. "Price is a band" beats "real-time pricing".

### On-brand vs off-brand

| Off-brand                                              | On-brand                                                |
| ------------------------------------------------------ | ------------------------------------------------------- |
| "AI-powered next-gen product intelligence."            | "Typed product object, confidence per field."           |
| "Real-time pricing across the entire web."             | "Price as a band, with as_of and n_sources."            |
| "Unleash your agents with our seamless API!"           | "Agents can discover the MCP server and pay per call."  |
| "Trusted by leading enterprises."                      | (omit; use a real customer logo or nothing)             |

---
Last reviewed: 2026-06-17.
