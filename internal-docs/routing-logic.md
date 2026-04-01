# Routing Logic

## Overview

Routing is **deterministic** — no LLM involved. It uses regex keyword matching to classify a task into one mode and one domain, then returns the sequence of stages for that domain.

File: [src/core/router.ts](../src/core/router.ts)

## Domain Detection (`inferDomain`)

Evaluated top-to-bottom. First match wins.

| Priority | Domain | Trigger keywords (regex) |
|---|---|---|
| 1 | `investing` | stock, ticker, watchlist, trade, earnings, market, invest |
| 2 | `content` | hook, copy, content, post, cta, audience, landing page, offer copy |
| 3 | `execution` | stuck, overwhelm, procrastinat, priority, sprint, focus, execution |
| 4 | `products` | product, idea, validate, first sale, pricing, buyer, digital product |
| 5 | `freelancing` | freelance, client, portfolio, outreach, retainer, niche, service offer |
| 6 | `utility` | rewrite, compress, tone, blind spot, leverage, optimi[sz]e, improve |
| 7 (default) | `os` | anything else |

> **Note:** `freelance` matches literally — `freelancing` does NOT match the `freelance` regex because 'freelancing' ≠ 'freelance...'. Use `niche`, `outreach`, or `client` for reliable freelancing detection with gerund forms.

## Mode Detection (`inferMode`)

Evaluated after domain is known. First match wins.

| Priority | Mode | Trigger keywords |
|---|---|---|
| 1 | `clarify` | confused, unclear, fuzzy, clarify, not sure |
| 2 | `execution` | stuck, overwhelm, do now, procrastinat, sprint, focus |
| 3 | `review` / `persuasion` | rewrite, improve, optimi[sz]e, review, tighten |
| 4 | `strategy` | strategy, direction, choose, best, validate, niche, opportunity |
| 5 (content default) | `persuasion` | domain === 'content' |
| 6 (execution default) | `execution` | domain === 'execution' |
| 7 (fallback) | `build` | everything else |

Note: When domain is `content` and keywords match review (rewrite/improve/optimize), the mode resolves to `persuasion` not `review`.

## Confidence Scores

| Condition | Confidence |
|---|---|
| Both `preferred_mode` and `preferred_domain` are explicitly set | `0.99` |
| Auto-inferred from keywords | `0.82` |

## Sequence Resolution

Each domain has a fixed ordered sequence. `buildAppliedSequence(domain, stage, fallback)` returns a slice starting from the given `stage`:

```
products: idea → validate → build → value → pricing → offer → first_sale

If stage = "pricing", applied sequence = ["pricing", "offer", "first_sale"]
If stage = "auto",    applied sequence = full sequence (fallback)
```

## Utility Candidates by Mode

After routing, `utilityCandidatesForMode(mode)` returns suggested utility operations:

| Mode | Suggested utilities |
|---|---|
| clarify | clarity_rewrite, structure_rebuild |
| strategy | blind_spot_finder, shortcut_strategy, ultra_leverage |
| build | structure_rebuild, audience_rewrite |
| persuasion | conversion_rewrite, tone_calibration, impact_compressor |
| execution | shortcut_strategy, momentum_amplifier |
| review | clarity_rewrite, impact_compressor, blind_spot_finder |

## Chaining Rules (enforced by `run_workflow_sequence`)

```
Allowed:   OS → domain → utility (support)
Forbidden: utility → domain (utility is never a primary entry point)
Forbidden: utility → utility → utility (no recursive optimization)
Forbidden: domain → domain without explicit user request
```
