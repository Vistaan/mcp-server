# WORKFLOW_EXECUTE_REFERENCING_v4

## 1. PURPOSE
This file is the execution dispatcher for the v4 machine-grade workflow system.

It tells the agent what to do next after receiving a user request.
It does not replace the seven domain files. It routes into them, controls execution order, enforces minimal branching, and ensures every run ends with one clear next action.

## 2. WHEN TO USE
Use this file first whenever a new task, request, idea, draft, or problem is received.

Use it before choosing any domain workflow.
Use it to decide:
- which file to run
- in what order to run it
- whether a utility prompt is needed
- what the final deliverable must be
- what the immediate next action is

## 3. EXECUTION

### 3.1 INPUT
Expected input:
- user request
- optional context
- optional draft / idea / plan / asset
- optional constraints

Available referenced files:
- `WORKFLOW_OS_v4.md`
- `WORKFLOW_FREELANCING_v4.md`
- `WORKFLOW_PRODUCTS_v4.md`
- `WORKFLOW_CONTENT_v4.md`
- `WORKFLOW_EXECUTION_v4.md`
- `WORKFLOW_INVESTING_v4.md`
- `UTILITY_PROMPTS_v4.md`

### 3.2 DECISION RULE
Apply this routing order exactly.

1. If the request is vague, conflicted, or underspecified, start with `WORKFLOW_OS_v4.md`.
2. If the request is about services, offers, niches, pricing, outreach, portfolio, freelancing, or client acquisition, run `WORKFLOW_FREELANCING_v4.md`.
3. If the request is about product ideas, validation, packaging, pricing, launch, or first sales, run `WORKFLOW_PRODUCTS_v4.md`.
4. If the request is about hooks, copy, messaging, content strategy, posts, persuasion, or conversion, run `WORKFLOW_CONTENT_v4.md`.
5. If the request is about confusion, procrastination, prioritization, momentum, focus, or task simplification, run `WORKFLOW_EXECUTION_v4.md`.
6. If the request is about stocks, watchlists, trade setup, market interpretation, or investing process, run `WORKFLOW_INVESTING_v4.md`.
7. If the request is not a primary workflow but needs rewriting, compression, restructuring, leverage analysis, blind-spot analysis, or tone adaptation, run `UTILITY_PROMPTS_v4.md` only after a primary workflow has produced a main output.
8. If multiple domains appear in one request, choose one primary workflow first, complete the main output there, then use one secondary workflow only if it directly improves the same deliverable.
9. Never start with `UTILITY_PROMPTS_v4.md` when a domain workflow clearly applies.
10. Never run more than one optimization pass unless explicitly requested.

### 3.3 SEQUENCE
Follow this sequence on every run.

1. Parse the request into:
   - goal
   - audience
   - output type
   - constraints
   - urgency
2. Classify the task into one primary workflow.
3. Open and apply the selected workflow's sequence.
4. Produce one main deliverable only.
5. Check whether the output needs one utility-layer improvement.
6. If needed, apply exactly one utility pass from `UTILITY_PROMPTS_v4.md`.
7. Convert the result into an actionable response.
8. End with one immediate next concrete step.

Fallback sequence:
1. Run `WORKFLOW_OS_v4.md` if the request does not map cleanly.
2. Use its routing logic to select the primary domain file.
3. Resume the standard sequence above.

### 3.4 COMMAND FORMAT
Use these command formats internally when deciding what to run next.

```text
RUN: WORKFLOW_OS_v4 -> classify the request -> choose one primary workflow
RUN: WORKFLOW_FREELANCING_v4 -> build service / pricing / outreach / growth output
RUN: WORKFLOW_PRODUCTS_v4 -> build product / validation / offer / first-sale output
RUN: WORKFLOW_CONTENT_v4 -> build copy / hooks / content / persuasion output
RUN: WORKFLOW_EXECUTION_v4 -> build focus / priority / action / sprint output
RUN: WORKFLOW_INVESTING_v4 -> build analysis / watchlist / trade / system output
RUN: UTILITY_PROMPTS_v4 -> improve clarity / persuasion / structure / leverage / compression
```

Allowed chaining patterns:
```text
OS -> FREELANCING
OS -> PRODUCTS
OS -> CONTENT
OS -> EXECUTION
OS -> INVESTING
PRIMARY WORKFLOW -> UTILITY
OS -> PRIMARY WORKFLOW -> UTILITY
```

Disallowed chaining patterns:
```text
UTILITY -> PRIMARY WORKFLOW
UTILITY -> UTILITY -> UTILITY
FREELANCING -> PRODUCTS -> CONTENT in one pass without explicit instruction
any chain that produces multiple unrelated deliverables in one run
```

### 3.5 OPERATING RULES
- Always choose the smallest sufficient workflow path.
- Always produce one main output, not a bundle of loosely related outputs.
- Always prefer a domain workflow over a generic utility prompt.
- Always optimize after the main output, not before it.
- Always keep utility prompts subordinate to the selected domain workflow.
- Always end with one immediate next concrete step.
- Never make the user choose between many prompt options.
- Never dump raw workflow internals unless the user asks for the framework itself.
- Never branch into multiple domains unless the request truly requires it.
- Never confuse routing with execution; choose first, then run.

## 4. OUTPUT

### 4.1 RESPONSE SHAPE
Every execution should produce this response shape:

```text
# RESPONSE
Primary workflow selected:
Reason:
Main deliverable:
Utility pass used:
Immediate next action:
```

If the user asked for the framework itself, produce instead:

```text
# RESPONSE
Primary workflow selected: EXECUTE / ROUTER
Reason:
File map:
Execution order:
Command pattern:
Immediate next action:
```

### 4.2 OUTPUT RULES
- `Primary workflow selected` must contain exactly one primary file name.
- `Reason` must explain the routing logic in one concise paragraph.
- `Main deliverable` must contain the actual useful output, not just a description of what would be done.
- `Utility pass used` must say `None` if no utility layer was needed.
- `Immediate next action` must be singular, concrete, and executable.
- If a second file was referenced, it must be supportive, not competing.
- If the task was unclear, say that routing started from `WORKFLOW_OS_v4.md`.

### 4.3 COMPLETION RULE
A run is complete only when:
1. one primary workflow has been selected,
2. one main output has been produced,
3. at most one utility pass has been applied,
4. the result is concrete and usable,
5. one immediate next action has been stated.

If any of the five conditions is missing, the execution is incomplete and must be corrected before stopping.
