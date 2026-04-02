# Frontend Agent Prompt: Interactive Landing Page For `workflow-os-mcp`

Use this prompt as the exact build brief for a frontend-focused agent.

The instructions below are intentionally strict. Follow them closely and do not skip any requirement.

---

# Prompt

You are designing and implementing an interactive landing page for a developer tool project named `workflow-os-mcp`.

Your job is to create a polished, production-quality landing page that explains the product clearly, demonstrates its capabilities honestly, and helps developers understand how to adopt it quickly.

You must follow every instruction below strictly.

## 0. Required Frontend Stack

This is mandatory.

The implementation must use:

- plain HTML
- SCSS
- TailwindCSS

Do not use:

- React
- Next.js
- Vue
- Nuxt
- Svelte
- Astro
- Angular
- any SPA framework unless explicitly embedded only for tooling and not for page architecture

The landing page should be built as a conventional static frontend implementation, with HTML structure first, Tailwind utility classes for layout and styling, and SCSS for organized custom styling, variables, enhancements, and component-level polish.

If JavaScript is needed for interactivity, keep it lightweight and framework-free.

Use minimal vanilla JavaScript only where needed for:

- tabs
- accordions
- animated section state
- scrollspy or sticky navigation
- small interactive demos

Do not convert this into a component-framework project.

## 1. Product Identity

This product is:

- an MCP server named `workflow-os`
- built for the `workflow-os` prompt and execution system
- designed to help an MCP client route a task, run one main workflow, optionally apply one utility pass, and return one immediate next action

This is not a generic AI app, not a hosted SaaS dashboard, and not a chat UI.

It is an infrastructure/developer product for MCP-compatible clients and tools.

## 2. Source-Of-Truth Facts You Must Preserve

You must not invent capabilities that are not present in the project.

You must accurately reflect these product facts:

- The server supports two transports:
  - `stdio`
  - `http`
- The HTTP transport exposes:
  - `GET /livez`
  - `GET /readyz`
  - `GET /health`
  - `GET /docs`
  - `GET /docs-api.json`
  - `POST /mcp`
  - `GET /mcp`
  - `DELETE /mcp`
- The landing page should mention that Swagger UI is available in HTTP mode at `/docs`, and the raw OpenAPI JSON is available at `/docs-api.json`.
- The server exposes tools for routing and execution.
- The main tools are:
  - `route_task`
  - `select_domain_workflow`
  - `run_workflow_sequence`
  - `apply_utility_prompt`
  - `generate_next_action`
- The server also exposes prompts and resources.
- The intended flow is:
  1. route the task
  2. optionally inspect/select workflow resources
  3. run one main workflow
  4. optionally apply one utility prompt
  5. end with one immediate next action
- The bundled workflow resources include:
  - `workflow://os/v4`
  - `workflow://freelancing/v4`
  - `workflow://products/v4`
  - `workflow://content/v4`
  - `workflow://execution/v4`
  - `workflow://investing/v4`
  - `workflow://utility/v4`
  - `workflow://execute-referencing/v4`
- It supports generic MCP client configuration patterns for:
  - Codex app
  - Codex VS Code extension
  - Claude Code VS Code extension
  - Claude web
  - ChatGPT web
  - Kimi web
  - Kimi Code VS Code extension
  - Kimi Claw
  - Open Claw
- The server can be run locally, in Docker, with docker-compose, and on Kubernetes.
- The server is stateless per request in HTTP mode.
- `MCP_PORT` is configurable and should not be presented as permanently fixed to `3000`.

## 3. Things You Must Not Claim

Do not claim or imply any of the following unless you are explicitly representing them as future ideas, and even then, do so cautiously:

- hosted cloud platform
- team collaboration dashboard
- user authentication
- analytics dashboard
- billing or subscriptions
- database-backed memory
- background job orchestration UI
- visual workflow builder
- multi-tenant SaaS
- proprietary enterprise integrations that are not present
- mobile app

Do not present the product as if it is only for Claude Desktop.

Do not hard-code `http://localhost:3000` as if it were the only valid URL.

Do not design the page around a fake chat conversation as the main experience.

## 4. Primary Goal Of The Page

The landing page must make a technically literate developer understand:

- what `workflow-os-mcp` is
- why it is useful
- how it works at a glance
- what tools/resources/prompts it exposes
- what clients it can integrate with
- how to run it
- how to explore its HTTP docs
- how to deploy it

The page should feel credible, precise, and implementation-aware.

## 5. Audience

Primary audience:

- developers
- AI tool builders
- MCP integrators
- engineers using local AI clients or editor extensions

Secondary audience:

- technical product builders evaluating MCP tools

The page should speak to an audience that appreciates:

- practical examples
- technical specificity
- clean architecture
- trustworthy product claims

## 6. Design Direction

Avoid generic AI startup aesthetics.

The page must feel:

- technical
- premium
- sharp
- interactive
- intentional
- not template-like

Visual direction requirements:

- no purple-on-white default AI aesthetic
- no bland SaaS hero with floating cards and meaningless gradients
- use a clear design system with CSS variables
- use strong typography choices
- use motion sparingly but meaningfully
- create visual hierarchy that helps scanning
- ensure excellent desktop and mobile behavior

The tone should be:

- confident
- precise
- developer-friendly
- not overhyped

## 7. Landing Page Structure

The landing page must include the following sections.

### Hero

Must communicate:

- the product name: `workflow-os-mcp`
- that it is an MCP server for workflow routing and execution
- that it works across MCP-capable clients
- that it can run in `stdio` or `http` mode

Include:

- one strong headline
- one concise supporting paragraph
- a primary CTA
- a secondary CTA

Recommended CTA meanings:

- primary: explore docs or quick start
- secondary: view client configuration or deployment

### “How It Works” Section

Show the actual workflow:

1. route the task
2. choose or inspect workflow resources
3. run one workflow
4. apply one utility pass if needed
5. produce one next action

This section should be highly visual and interactive.

Use a stepper, flow diagram, or animated sequence, but keep it grounded in the actual product behavior.

### Tools Section

Present the five main tools clearly:

- `route_task`
- `select_domain_workflow`
- `run_workflow_sequence`
- `apply_utility_prompt`
- `generate_next_action`

For each tool, show:

- name
- short purpose
- where it fits in the sequence

Optional but encouraged:

- code-style cards
- hover states
- sequence highlighting

### Prompts And Resources Section

Explain that the server also exposes prompts and resources.

You should mention:

- mode prompts
- domain prompts
- front-door prompt `route_and_run`
- workflow resources
- section-based workflow resource URIs

Do not dump everything in a wall of text. Organize it cleanly.

### Client Compatibility Section

This section is mandatory.

It must communicate that this server is not tied to one client.

It must visually present support for:

- Codex app
- Codex VS Code extension
- Claude Code VS Code extension
- Claude web
- ChatGPT web
- Kimi web
- Kimi Code VS Code extension
- Kimi Claw
- Open Claw

Do not imply that every client has identical UX.

Instead, explain that the same MCP contract can be configured across multiple clients, even though the UI and setup surface may differ.

### HTTP API / Swagger Section

This section is mandatory.

It must explain:

- HTTP mode exposes operational and MCP endpoints
- Swagger UI is available at `/docs`
- OpenAPI JSON is available at `/docs-api.json`
- the port is configurable via `MCP_PORT`

This section should include a code snippet or endpoint list.

### Deployment Section

Must cover:

- local use
- Docker
- docker-compose
- Kubernetes

This section should communicate that the project can move from local developer workflows to deployable environments without changing its core contract.

### Quick Start Section

Include a concise command-oriented setup experience:

- `pnpm install`
- `pnpm run build`
- `node dist/index.js`
- `MCP_TRANSPORT=http MCP_PORT=<port> node dist/index.js`

Make it easy to copy mentally, even if you are not literally adding copy buttons.

### Documentation / CTA Footer

Include final CTA links or cards that point to:

- how to use
- generic MCP client configuration
- local setup
- deployment
- Swagger/OpenAPI docs in HTTP mode

## 8. Interactivity Requirements

The page must not be static marketing copy only.

Include meaningful interactive elements such as:

- animated workflow step sequence
- expandable tool cards
- tabbed code/config examples
- client compatibility toggles or grouped views
- endpoint explorer preview
- sticky table of contents or progressive nav state

Interactivity must clarify the product.

Do not add novelty interactions that distract from comprehension.

## 9. Content Requirements

Use technically accurate copy.

You must explicitly communicate these ideas:

- one main workflow per request
- utility prompts are supporting tools, not the primary entry point
- bundled workflow markdown files are the source of truth
- HTTP mode has interactive docs
- the server is MCP-native
- the server can be integrated through a generic MCP configuration contract

You should include at least one compact code/config example for:

- local startup
- generic MCP client configuration
- HTTP endpoint usage

## 10. UX Requirements

The landing page must:

- load well on mobile and desktop
- have strong information hierarchy
- support quick scanning by developers
- avoid excessive paragraph walls
- use spacing intentionally
- maintain readability in code blocks
- preserve contrast and accessibility

If a dark theme is used, it must still be highly readable.

If a light theme is used, it must not feel washed out or generic.

## 11. Implementation Constraints

You must preserve honesty about the product.

You must not:

- fabricate product features
- omit major actual features listed above
- reduce the page to a shallow marketing shell
- hide technical detail behind vague slogans

You should favor:

- real feature architecture
- accurate developer workflows
- clear endpoint references
- correct naming
- concrete examples

## 12. Copy Guidance

Headline and body copy should feel like a real developer platform page, not ad copy.

Good qualities:

- precise
- useful
- calm
- technically persuasive

Bad qualities:

- exaggerated
- vague
- empty buzzwords
- “revolutionary AI” style copy

## 13. Deliverable Requirements

Your deliverable must include:

- the full landing page implementation
- plain HTML templates/pages
- SCSS source
- TailwindCSS integration
- all layout, styling, and interactions
- responsive behavior
- realistic copy
- sections listed above

If working from scratch:

- create a clean static frontend structure
- keep the architecture simple and maintainable
- organize styles so Tailwind and SCSS complement each other instead of fighting each other
- use vanilla JavaScript only where interactive behavior requires it

Suggested output shape:

- one main HTML page
- one or more SCSS files
- Tailwind configuration if needed
- minimal JavaScript for interactions

Do not introduce unnecessary build complexity.

## 14. Non-Negotiable Accuracy Checklist

Before finalizing, confirm that the page includes all of the following:

- `workflow-os-mcp` name
- MCP server framing
- `stdio` and `http` transport modes
- tools section with all five tools
- prompts/resources mention
- client compatibility section
- Swagger/OpenAPI docs mention
- Docker/Compose/Kubernetes deployment mention
- configurable port framing
- one-main-workflow-per-request framing
- utility prompts as supporting tools framing

If any of these are missing, the output is incomplete.

## 15. Final Instruction

Follow these requirements exactly.

Do not simplify the scope.

Do not omit a section because it feels repetitive.

Do not replace concrete product facts with generic marketing abstractions.

The final landing page should feel like it was designed by someone who actually read and understood the project.

---

# Notes For The Frontend Agent

Useful product references inside this repo:

- `README.md`
- `HOW_TO_USE.md`
- `docs/mcp-client-configuration.md`
- `docs/deployment.md`
- `src/server.ts`
- `src/openapi/spec.ts`

When in doubt, prefer those project facts over invention.
