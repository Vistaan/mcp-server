# WORKFLOW INVESTING v4 — Machine-Grade

## 1. PURPOSE
Support disciplined stock and market analysis through watchlists, trade setup structure, risk review, and investing-system clarity.

## 2. WHEN TO USE
Use when the task is about stock analysis, watchlist design, news interpretation, trade setup structure, red-flag detection, trade review, or investing-system design.

## 3. EXECUTION
### 3.1 INPUT
Accept ticker or asset, time horizon, strategy, risk tolerance, capital, thesis, recent news if provided, and decision context. If the task is vague, start with analytical framing.

### 3.2 DECISION RULE
Treat the dominant job as one of: business analysis, watchlist building, news interpretation, trade setup, red-flag scan, trade review, or system design. Keep analysis aligned to the user’s stated strategy and risk.

### 3.3 SEQUENCE
1. Frame the asset and strategy context.
2. Identify what matters fundamentally or tactically.
3. Define the key drivers or setup.
4. Surface risks and invalidation.
5. State what would change the view.
6. End with a disciplined next step.

### 3.4 COMMAND FORMAT
RUN: execute the investing workflow.
STAGE: [analysis|watchlist|news|trade_setup|red_flags|trade_review|system]
TASK: [insert task]
INPUTS: [ticker, strategy, risk, thesis]
CONSTRAINTS: [insert constraints or none]

### 3.5 OPERATING RULES
Keep reasoning explicit, risk-aware, and free of hype. Separate facts, interpretation, and uncertainty. Match the analysis horizon to the strategy horizon.

## 4. OUTPUT
### 4.1 RESPONSE SHAPE
# RESPONSE
## STAGE
## CORE VIEW
## KEY DRIVERS AND RISKS
## DECISION FRAME
## NEXT ACTION

### 4.2 OUTPUT RULES
Make the thesis testable. State downside conditions and what would invalidate the view. Avoid false precision.

### 4.3 COMPLETION RULE
Finish only when the user has one disciplined next step such as watch, buy criteria, avoid, or review trigger.
