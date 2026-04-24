# API Reference

## Resources

All resources use the `workflow://` URI scheme and return `text/markdown`.

| URI                                 | File                                 |
| ----------------------------------- | ------------------------------------ |
| `workflow://os/v1`                  | `WORKFLOW_OS_v1.md`                  |
| `workflow://freelancing/v1`         | `WORKFLOW_FREELANCING_v1.md`         |
| `workflow://products/v1`            | `WORKFLOW_PRODUCTS_v1.md`            |
| `workflow://content/v1`             | `WORKFLOW_CONTENT_v1.md`             |
| `workflow://execution/v1`           | `WORKFLOW_EXECUTION_v1.md`           |
| `workflow://investing/v1`           | `WORKFLOW_INVESTING_v1.md`           |
| `workflow://utility/v1`             | `UTILITY_PROMPTS_v1.md`              |
| `workflow://execute-referencing/v1` | `WORKFLOW_EXECUTE_REFERENCING_v1.md` |

### Subsection resources

Fetch only a specific section of a workflow file:

```
workflow://{domain}/v1/execution/input
workflow://{domain}/v1/execution/decision-rule
workflow://{domain}/v1/execution/sequence
workflow://{domain}/v1/execution/command-format
workflow://{domain}/v1/execution/operating-rules
workflow://{domain}/v1/output/response-shape
workflow://{domain}/v1/output/output-rules
workflow://{domain}/v1/output/completion-rule
```

---

## Prompts

### Mode prompts

| Name                 | Purpose                        | Key arguments                                |
| -------------------- | ------------------------------ | -------------------------------------------- |
| `clarify_task`       | Clarify a vague/fuzzy task     | `task`, `goal?`, `audience?`, `constraints?` |
| `strategize_task`    | Select direction or priorities | `task`, `domain?`, `context?`                |
| `build_output`       | Convert idea to asset          | `task`, `domain?`, `context?`                |
| `improve_persuasion` | Strengthen copy/messaging      | `task`, `audience?`, `platform?`             |
| `force_execution`    | Break through overwhelm        | `task`, `energy_level?`                      |
| `review_optimize`    | Tighten an existing output     | `task`, `domain?`, `content?`                |

### Domain prompts

| Name                       | Domain      | Stage argument values                                                                                                                                                                                       |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run_freelancing_workflow` | freelancing | `skill \| niche \| offer \| pricing \| portfolio \| outreach \| first_client \| premium \| growth`                                                                                                          |
| `run_products_workflow`    | products    | `idea \| validate \| build \| value \| pricing \| offer \| first_sale`                                                                                                                                      |
| `run_content_workflow`     | content     | `audience_pain \| direction \| ideas \| hooks \| write \| improve \| optimize \| consistency`                                                                                                               |
| `run_execution_workflow`   | execution   | `do_now \| organize \| simplify \| unblock \| sprint \| priorities \| momentum`                                                                                                                             |
| `run_investing_workflow`   | investing   | `analyze \| watchlist \| news \| trade_setup \| red_flags \| trade_review \| system`                                                                                                                        |
| `run_utility_workflow`     | utility     | `clarity_rewrite \| conversion_rewrite \| tone_calibration \| structure_rebuild \| audience_rewrite \| impact_compressor \| blind_spot_finder \| shortcut_strategy \| ultra_leverage \| momentum_amplifier` |

### Front-door prompt

**`route_and_run`** — classifies and runs in one call.

```json
{
  "task": "string (required)",
  "goal": "string (optional)",
  "audience": "string (optional)",
  "constraints": ["string"],
  "preferred_mode": "auto | clarify | strategy | build | persuasion | execution | review",
  "preferred_domain": "auto | os | freelancing | products | content | execution | investing | utility | pentest-web | pentest-mobile | pentest-api | pentest-infra"
}
```

---

## Tools

### `route_task`

Classify a task into mode + domain + sequence. **Call this first.**

**Input:**

```json
{
  "task": "string",
  "goal": "string (optional)",
  "audience": "string (optional)",
  "constraints": ["string"],
  "preferred_mode": "auto | clarify | strategy | build | persuasion | execution | review",
  "preferred_domain": "auto | os | freelancing | products | content | execution | investing | utility | pentest-web | pentest-mobile | pentest-api | pentest-infra"
}
```

**Output:**

```json
{
  "mode": "build",
  "domain": "products",
  "confidence": 0.82,
  "reason": "Detected build mode for the products domain from task language: ...",
  "sequence": ["idea", "validate", "build", "value", "pricing", "offer", "first_sale"],
  "use_utility": true,
  "utility_candidates": ["structure_rebuild", "audience_rewrite"]
}
```

---

### `select_domain_workflow`

Resolve which resource URI and stage to use.

**Input:**

```json
{
  "domain": "products",
  "stage": "pricing"
}
```

**Output:**

```json
{
  "resource_uri": "workflow://products/v1",
  "subsection_uri": "workflow://products/v1/execution/sequence",
  "stage": "pricing",
  "command_format": "RUN: <mode> | <domain> | <task> | <stage?> | <constraints?>",
  "response_shape": "{ mode, domain, main_deliverable, supporting_notes?, optimization_applied, next_action }"
}
```

---

### `run_workflow_sequence`

**Main workhorse.** Runs the workflow and returns one deliverable + one next action.

**Input:**

```json
{
  "mode": "strategy",
  "domain": "products",
  "task": "I want a simple product to sell this weekend",
  "context": "Beginner, no audience yet",
  "stage": "auto",
  "optimize_once": true,
  "next_action_required": true
}
```

**Output:**

```json
{
  "mode": "strategy",
  "domain": "products",
  "main_deliverable": "Mode: strategy\nDomain: products\nStage: auto\nTask: ...\nSequence: idea -> validate -> ...\nUse the resource workflow://products/v1 as the source-of-truth workflow reference.",
  "applied_sequence": ["idea", "validate", "build", "value", "pricing", "offer", "first_sale"],
  "optimization_applied": true,
  "next_action": "Write the one-sentence product promise and list the first five components."
}
```

---

### `apply_utility_prompt`

Apply one supporting utility **after** a primary workflow has run.

**Input:**

```json
{
  "utility_name": "blind_spot_finder",
  "content": "Premium AI ad management service for $3k/month",
  "context": "Need to check risks before finalizing"
}
```

**Output:**

```json
{
  "utility_name": "blind_spot_finder",
  "revised_content": "...",
  "issues_found": ["Potential hidden assumption: target audience and proof level may be underspecified."]
}
```

Available `utility_name` values:
`clarity_rewrite` · `conversion_rewrite` · `tone_calibration` · `structure_rebuild` · `audience_rewrite` · `impact_compressor` · `blind_spot_finder` · `shortcut_strategy` · `ultra_leverage` · `momentum_amplifier`

---

## Operational HTTP Endpoints

### `GET /health`

Returns readiness state plus workflow file metadata.

### `GET /metrics`

Returns lightweight in-memory counters and duration aggregates for the HTTP transport. This is intended for operational inspection and basic monitoring.

### `GET /metrics/prometheus`

Returns the current in-process metrics in Prometheus text exposition format.

### `GET /docs-api.json`

Returns the generated OpenAPI document. In production, set `PUBLIC_BASE_URL` so the documented server URL does not depend on request headers.

---

### `generate_next_action`

Return exactly one immediate next step.

**Input:**

```json
{
  "domain": "freelancing",
  "current_output": "Service offer drafted for backend consulting",
  "constraints": ["no portfolio yet", "need first client fast"]
}
```

**Output:**

```json
{
  "next_action": "Turn the current freelancing output into a one-page offer brief while respecting: no portfolio yet, need first client fast.",
  "why_this_next": "It is the smallest concrete move that advances the current workflow without branching into multiple decisions."
}
```

---

## Recommended Call Sequence

```
1. route_task          → get mode + domain + sequence
2. run_workflow_sequence → get main_deliverable + next_action
3. apply_utility_prompt  → (optional) one polish pass
4. generate_next_action  → (optional) standalone next step
```
