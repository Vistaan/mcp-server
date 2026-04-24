# UTILITY PROMPTS v1 — Machine-Grade

## 1. PURPOSE
Provide subordinate utility operations that sharpen outputs from the main workflows without replacing the primary file selection logic.

## 2. WHEN TO USE
Use only after a primary workflow is chosen, or when the task is clearly a rewrite, compression, restructuring, leverage scan, blind-spot check, or optimization pass.

## 3. EXECUTION
### 3.1 INPUT
Accept an existing draft, plan, idea, decision, or workflow output. Also accept the exact operation needed: clarify, compress, restructure, optimize, adapt, scan, or simplify.

### 3.2 DECISION RULE
Use utility prompts as secondary tools, not primary workflow replacements. Choose one operation that improves the current asset without reopening the whole decision tree.

### 3.3 SEQUENCE
1. Identify the asset to improve.
2. Select one utility operation.
3. Apply the operation once.
4. Preserve the core meaning or objective.
5. Return the tightened result.
6. End with one next action.

### 3.4 COMMAND FORMAT
RUN: execute the utility workflow.
STAGE: [clarify|compress|restructure|optimize|adapt|blind_spots|simplify]
TASK: [insert task]
INPUTS: [draft, output, or plan]
CONSTRAINTS: [insert constraints or none]

### 3.5 OPERATING RULES
Utilities support the main workflows. They do not replace routing, domain logic, or stage sequencing. Improve one dimension at a time.

## 4. OUTPUT
### 4.1 RESPONSE SHAPE
# RESPONSE
## STAGE
## ORIGINAL ASSET
## IMPROVED ASSET
## CHANGE SUMMARY
## NEXT ACTION

### 4.2 OUTPUT RULES
Keep edits targeted and justified by usefulness. Preserve intent unless the request explicitly asks for a strategic rewrite.

### 4.3 COMPLETION RULE
Finish only when the improved asset is immediately usable and the next action is obvious.
