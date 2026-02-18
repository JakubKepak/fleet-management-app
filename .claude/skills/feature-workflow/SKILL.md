# Feature Workflow

Structured process for implementing new features with user verification at each step.

## When to Use

Use this skill whenever implementing a new feature, module, or significant change. This is the default workflow for all feature work in this project.

## Process

### Step 1: Plan Before Coding

Before writing any code, create a detailed implementation plan:

1. **Analyze the feature requirements** — understand what needs to be built
2. **Review the Figma designs** if available (designs are in `docs/designs/`)
3. **Check available API data** — verify what endpoints and data support the feature
4. **Write the plan** as a numbered list of **blocks**

### Step 2: Divide Into Testable Blocks

Each block in the plan must be:

- **Self-contained** — delivers a visible, working piece of functionality
- **Testable by the user** — the user can verify it works (e.g., run dev server and see the result)
- **Incremental** — builds on the previous block without breaking it
- **Small enough** to review in one pass

Example block structure:
```
Block 1: API client + data fetching hooks
Block 2: Page layout and navigation
Block 3: Data table with real API data
Block 4: Charts and visualizations
Block 5: AI insight cards
Block 6: i18n translations (cs + en)
```

### Step 3: Get Plan Approval

Present the plan to the user and **wait for explicit approval** before writing any code. Use the `AskUserQuestion` tool or simply ask if the plan looks good.

Do NOT start coding until the user confirms the plan.

### Step 4: Build Block by Block

For each block:

1. **Announce** which block you're starting
2. **Implement** the block fully
3. **Verify** the build passes (`npm run build`)
4. **Commit the block** — run pre-commit security scan, then commit with a descriptive message following the `feat:` / `fix:` / `chore:` convention
5. **Present** the result to the user — explain what was built and how to test it
6. **STOP and wait** for the user to verify and approve before moving to the next block

### Anti-patterns

- **Never implement the entire feature at once** — always break it into blocks
- **Never skip user verification** between blocks
- **Never start the next block before the current one is approved**
- **Never skip the planning step** — even for "simple" features
- **Never present a plan without testable blocks** — each block must produce something the user can see or interact with
