# Adding or Updating Workflow Domains

## Adding a New Domain

### 1. Add the Markdown file

Drop the v4 workflow file in `workflows/`:
```
workflows/WORKFLOW_MYNEWTHING_v4.md
```

### 2. Register it in `src/core/catalog.ts`

Add to `DOMAIN_FILES`, `DOMAIN_URI_MAP`, `DOMAIN_SEQUENCES`, and `STATIC_RESOURCES`:

```typescript
// DOMAIN_FILES
mynewthing: 'WORKFLOW_MYNEWTHING_v4.md',

// DOMAIN_URI_MAP
mynewthing: 'workflow://mynewthing/v4',

// DOMAIN_SEQUENCES
mynewthing: ['stage1', 'stage2', 'stage3'],

// STATIC_RESOURCES
{
  id: 'workflow-mynewthing',
  domain: 'mynewthing',
  uri: DOMAIN_URI_MAP.mynewthing,
  fileName: DOMAIN_FILES.mynewthing,
  title: 'Workflow My New Thing v4',
  description: 'Short description.',
  mimeType: 'text/markdown',
},
```

### 3. Add it to the `Domain` type in `src/schemas/types.ts`

```typescript
export type Domain = 'os' | ... | 'mynewthing';
```

### 4. Add routing keywords in `src/core/router.ts`

In `inferDomain()`, add a new case:
```typescript
if (/(keyword1|keyword2|keyword3)/.test(text)) return 'mynewthing';
```
Place it in priority order (before the `os` fallback).

### 5. Add Zod schema enum values in `src/schemas/tools.ts`

Update all `z.enum([...])` that include domain values to include `'mynewthing'`.

### 6. Register a domain prompt in `src/prompts/domain.ts`

Add `run_mynewthing_workflow` following the same pattern as existing domain prompts.

### 7. Update tests

Add cases to `tests/unit/core/router.test.ts` covering the new keywords and sequence.

---

## Updating an Existing Workflow File

Just replace the file in `workflows/`. The server reads files at request time so no rebuild is needed in development. For production/Docker, rebuild the image.

---

## Updating Stage Sequences

Edit `DOMAIN_SEQUENCES` in `src/core/catalog.ts`. Stage names must match exactly what is used in tool calls and prompts (lowercase, underscore-separated).
