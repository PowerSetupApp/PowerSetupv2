---

## name: algorithm-architect

description: Use when the user wants to design or implement an algorithm that turns inputs into a computed result, recommendation, ranking, or sized setup. Covers sizing/scheduling/scoring/optimization/data-transform algorithms and rules-based calculators in any domain (engineering, finance, energy, logistics, etc.). Trigger even when the user doesn't say the word "algorithm" but is describing a rules-based calculation or decision procedure — e.g. "figure out what X I need based on Y", "rank these by…", "estimate how much Z given these inputs", "given this list of appliances tell me what battery I need". If the task resembles a worked example in `references/worked-examples/`, read that reference and adapt the pattern.

# Algorithm Architect

Help the user go from a vague "I want an algorithm that…" to a working, tested implementation they trust. The skill is deliberately domain-agnostic — the same process works for sizing a camper-van power setup, scoring candidates, scheduling tasks, or pricing a product.

## Why a process at all

Most "algorithm" failures aren't about clever tricks. They're about silent assumptions: wrong units, a forgotten edge case, a hard-coded constant that only worked for the first example the user mentioned. This skill trades a couple of minutes of explicit thinking for a result the user can actually use and extend.

## When to use this skill

Use it whenever the request is essentially "inputs → computed outputs with rules", even when the word "algorithm" isn't spoken. Some shapes that qualify:

- **Sizing / dimensioning**: "given these appliances, what battery / cable / pipe do I need?"
- **Estimation**: "how much fuel / power / money over a month given this usage?"
- **Ranking / scoring**: "rank these N things by criteria X, Y, Z with weights…"
- **Scheduling / assignment**: "assign N items to M slots minimizing / maximizing something"
- **Decision procedure**: "given these inputs, output yes/no plus a reason"

If the request is clearly a one-liner (e.g. "sum this list"), don't force the full process — collapse it (see *Scaling to task size* below).

## When not to use this skill

Some requests look adjacent but are a poor fit — the process adds ceremony without catching the kind of bugs it's built to catch. Skip it (or use a more appropriate skill) for:

- **ML model training / hyperparameter tuning** — the work is empirical, not rules-based.
- **UI state machines and event handlers** — correctness lives in state transitions, not in a formula.
- **String parsing / regex problems** — the design-doc overhead doesn't match the failure modes.
- **Prompt engineering / LLM orchestration** — no closed-form inputs→outputs contract to validate.
- **Pure data plumbing (ETL glue)** — if there is no computed rule, there is no algorithm to architect.

If the task sits on the border (e.g. a scoring function embedded in a UI, or a rule engine inside an ETL), apply the skill only to the rules-based core and leave the rest to its natural idiom.

## The process

Seven steps. Follow them in order for non-trivial algorithms. Tell the user what you're doing at each step so they can course-correct early.

### 1. Clarify the problem

Nail down before designing:

- **Inputs**: names, types, units, allowed ranges, optional vs required.
- **Outputs**: what shape, what units, what's the success criterion?
- **Constraints**: hard limits (physical, legal, business) vs soft preferences.
- **Edge cases the user cares about**: empty input, zero values, simultaneous-use / contention, precision requirements.

If anything important is ambiguous, **ask the user now**, not after implementation. A 30-second question beats a rewrite. Only use defaults silently for things the user is unlikely to care about; name any defaults you take in the design doc so the user sees what they're signing off on.

### 2. Check for a matching worked example

Skim `references/worked-examples/`. If the task resembles one — same shape, e.g. a sizing calculator, a scoring function — read that file and adapt the pattern. The worked examples show what a good design doc + implementation + test plan look like in this skill. If nothing matches, proceed from first principles.

### 3. Write a short design doc

Use the template in `[references/design-doc-template.md](references/design-doc-template.md)`:

- Problem statement (one paragraph)
- Inputs / Outputs with units and types
- Approach in prose (1–3 paragraphs — what formulas or logic, and why)
- Rejected alternatives (what you considered and chose not to use, with reasons — especially important for optimization/assignment problems)
- Pseudocode (10–40 lines — the executable shape of the solution)
- Complexity (time, space)
- Edge cases and how each is handled
- Validation rules (what makes input invalid, what the function does when it is)
- Named constants (name, value, unit, source)
- Assumptions and defaults (anything you chose on the user's behalf)
- Open questions (things to confirm with the user)

Show the design doc to the user and get sign-off before writing code. This is where most misunderstandings surface, cheaply.

### 4. Ask which language to implement in

The skill is configured to always ask rather than assume. Honor explicit requests (e.g. "in TypeScript"). If the user hasn't said, ask briefly; you may suggest Python as a default *after* asking, since it is usually the lowest-friction choice for input-driven calculators.

### 5. Implement

- Mirror the pseudocode 1:1 where practical. If the code diverges from the design, update the design first — don't let them drift apart.
- **Validate inputs** at the function boundary. Fail loud on invalid input, not silently.
- **Name constants**. Magic numbers like `1.25`, `0.8`, `230` should become `SAFETY_FACTOR`, `DEPTH_OF_DISCHARGE`, `AC_VOLTAGE_EU`. The name is the documentation.
- **Parameterize what the user will want to tweak**. Domain constants (standards, physical limits) live at module top with a name, unit, and source comment. But values the user is likely to change later — prices, weights, safety factors, thresholds — should *also* be function arguments, with the module-level constant as the default. That way calling `compute(x)` uses the sensible default and `compute(x, price_per_kwh=0.42)` overrides without editing source.
- **Make tie-breakers explicit**. For any ranking, assignment, or sorting step, decide up front what happens when two items score equally — a secondary key, then input index, then a documented fallback. Never rely on dict iteration order, set order, or float jitter. Non-deterministic output is a silent bug that only shows up when the user re-runs and gets a different answer.
- **Docstring** the public function with the problem statement, inputs, outputs, and a pointer to the design doc.
- Keep pure-calculation code separated from I/O (reading files, printing, plotting) so it's testable.
- **Show your work**. For sizing / scoring / ranking algorithms, the user almost always wants to audit *why* the number came out the way it did — which inputs dominated, which constants were applied, which branch was taken. Either return a small breakdown struct alongside the final number, or expose a `verbose=True` / `explain=True` flag that logs the intermediate quantities. Keep the pure numeric return path clean; the explanation is additive.

### 6. Test

Generate at least:

- One **hand-computable case** the user can verify with a pocket calculator.
- One **edge case** per edge case listed in the design doc.
- One **invalid-input case** (confirms validation fires).

Two more test shapes are disproportionately useful for this class of algorithm — add them whenever they apply:

- **Monotonicity / property tests**. Pick a property the algorithm *must* preserve, then assert it on random-ish inputs. Adding an appliance must never reduce the required battery capacity. Increasing a candidate's score must never lower their rank. Doubling every task duration must (roughly) double total completion time. These catch whole families of formula bugs — wrong sign, swapped variables, accidental subtraction — that a handful of spot-checks will miss.
- **Unit round-trip test**. If the algorithm converts units internally (W ↔ Wh ↔ Ah, kWh ↔ MJ, kg ↔ lb), assert that a known value round-trips. Most unit bugs are a factor of 10, 60, 1000, or a forgotten voltage — a single round-trip test surfaces them immediately.

For calculators, also print a worked example at the bottom of the module so the user can run it and eyeball the numbers.

### 7. Review

Walk the design doc top to bottom. For each requirement, point at the line of code that satisfies it. If you can't, fix the code — or the design. Surface any assumption that wasn't in the user's original request: units, defaults, implicit safety margins, rounding choices.

## Scaling to task size

Not every algorithm needs the full ceremony. Use judgment:

- **Trivial** (sum, filter, lookup): skip the design doc, write the code + one test, done. Still name constants and validate inputs.
- **Small** (single formula, few inputs): collapse Clarify + Design into a 3-bullet sketch in your reply, then code + tests.
- **Non-trivial** (multiple inputs, branching logic, domain constants, safety factors): full process.
- **Complex** (optimization, multiple interacting formulas, regulatory constraints): full process, plus explicitly ask the user to confirm the design doc before writing any code.

The process exists to surface hidden assumptions. If there are none, skip ahead — don't perform the process for its own sake.

## Anti-patterns

These are the failure modes the rest of the skill is quietly trying to prevent. Keep them in mind while writing the design doc and reviewing the code — if you catch yourself doing any of them, stop and fix it before moving on. The longer catalog (with symptoms, fixes, and bad/good examples) lives in [references/anti-patterns.md](references/anti-patterns.md); read it whenever the task touches rounding, unit conversion, assignment/scheduling, or scoring.

- **Magic numbers** — constants appearing inline (`* 1.25`, `/ 230`) with no name or source. The reader can't tell intent from value.
- **Silent defaults** — picking a value for the user (e.g. price per kWh, safety margin) without listing it in the assumptions block. The user signs off on a number they never saw.
- **Mixed units in one formula** — adding kW to kWh, or Ah to Wh, without an explicit voltage step. Compiles fine, answers are nonsense.
- **Wrong rounding direction** — rounding a *required capacity* down, or a *tolerable voltage drop* up. Rounding direction is a safety decision, not a formatting decision.
- **Float equality / drifting sums** — `if total == limit:` and summing hundreds of floats without awareness of accumulated error. Use a tolerance or use integers scaled to the smallest unit.
- **Mutating inputs** — reordering or modifying the caller's list. Breaks reruns and makes monotonicity tests lie.
- **Parse + compute + print in one function** — makes the calculation untestable and couples the formula to a specific input format.
- **Greedy where the problem needs exact** — assigning tasks to workers by "pick best available" when the global optimum needs Hungarian / ILP / DP. Works on small examples, fails on the user's real data.
- **Copy-pasted formula drift** — the same calculation pasted into two branches, then one branch changes. Extract the shared formula into a named function before the drift happens.
- **Overfitting to the first example** — the formula only works because of the specific numbers the user happened to type. Test with a second, different-shape example before shipping.
- **Non-deterministic tie-breakers** — ranking/assignment output depends on dict iteration order or float jitter. Same input, different output across runs is a bug even when the number is "close enough".

## Output format

Present to the user in this order:

1. Clarifying questions (if any) — ask and wait.
2. Design doc — as a readable markdown block in the reply, not just in a file.
3. Language confirmation.
4. Code — one or more files, with the main function docstringed.
5. Tests — either a test file, or test cases inline in a `if __name__ == "__main__"` block (Python) or equivalent.
6. Short review paragraph: "Here's what I made, here are the assumptions I baked in, here's what I'd change first if a requirement shifts."

## Growing the skill

When a request pattern starts repeating (you've now done three sizing calculators, or five scoring functions), add a new file under `references/worked-examples/` so future runs can pattern-match instead of deriving from scratch. Each worked example should cover all seven steps for one concrete case.

## References

- `[references/design-doc-template.md](references/design-doc-template.md)` — fillable template for step 3.
- `[references/anti-patterns.md](references/anti-patterns.md)` — catalog of failure modes this skill is designed to prevent, organized by category (correctness, units, structure, algorithmic choice, testing, domain drift). Read it when the design doc touches rounding, unit conversion, assignment/scheduling, or scoring.
- `[references/worked-examples/power-setup.md](references/worked-examples/power-setup.md)` — end-to-end example: a mobile-home / camper power-setup calculator (appliance list → battery capacity, inverter size, cable gauge, breaker rating). Use as a pattern for any sizing / dimensioning calculator.