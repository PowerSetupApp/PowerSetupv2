# Anti-patterns

The failure modes the `algorithm-architect` skill is designed to prevent. The inline list in `SKILL.md` names them briefly; this file is the long version — read it when the task at hand touches any of:

- **Rounding** (capacity, margins, financial amounts)
- **Unit conversion** (power/energy, currency, time, imperial/SI)
- **Assignment / scheduling / optimization** (matching N things to M slots)
- **Ranking / scoring** (weighted criteria, tie-breakers)
- **Any calculator whose output the user will rely on for a real decision**

Each entry uses the same shape so you can scan it:

```
### <name>
Symptom: what it looks like in the code or output.
Why it hurts: the concrete failure it causes.
Fix: what to do instead.
Example: bad → good.
```

The catalog is organized by category. Within each category, the entries are ordered roughly by how often they bite.

---

## Correctness

### Magic numbers

Symptom: constants appear inline in formulas — `voltage * 1.25`, `watts / 230`, `score * 0.8` — with no name and no comment.

Why it hurts: the reader (including future you, and the LLM re-reading the file in six months) cannot tell whether `1.25` is a safety factor, an efficiency correction, a regulatory multiplier, or a typo. When the regulation changes to `1.3`, nobody knows which of the seven `1.25`s in the codebase to update.

Fix: hoist every non-trivial constant to module top with a name, unit, and source comment. The name becomes the documentation.

Example:

```python
capacity_ah = (daily_wh / SYSTEM_VOLTAGE_V) / 0.8 * 1.25
```

becomes

```python
DEPTH_OF_DISCHARGE = 0.8  # LiFePO4 usable fraction; Victron application note AN-003
RESERVE_FACTOR = 1.25     # 25% headroom for cold-weather derating
SYSTEM_VOLTAGE_V = 12

capacity_ah = (daily_wh / SYSTEM_VOLTAGE_V) / DEPTH_OF_DISCHARGE * RESERVE_FACTOR
```

### Silent defaults

Symptom: the function picks a value the user didn't provide (price per kWh, safety factor, default weight) and uses it without telling anyone.

Why it hurts: the user signs off on a number they never saw. Six months later when the price of electricity doubles, the "why is my bill wrong" conversation starts with nobody knowing which default was in play.

Fix: anything chosen on the user's behalf goes in the design doc's *Assumptions and defaults* list, and — if it could change — in the function signature as a parameter with that default. See *Parameterize what the user will want to tweak* in step 5 of the main skill.

### Overfitting to the first example

Symptom: the formula works perfectly on the numbers the user happened to type, and only on those numbers. A hard-coded constant is suspiciously close to one of the inputs; a clamp is conveniently sized around the example; a branch exists that only ever fires for the test case.

Why it hurts: the algorithm looks correct in the review and fails the first time it sees a real input distribution.

Fix: before shipping, mentally (or literally) run the algorithm on a second example with a clearly different shape — twice the scale, half the scale, zero, a single large value, an empty list. If anything breaks or gives a surprising answer, the formula is overfit.

### Mutating inputs

Symptom: the function sorts, re-assigns, or otherwise modifies the caller's list/dict in place.

Why it hurts: the caller expected their data back unchanged. Reruns now produce different answers. Monotonicity tests become unreliable because the "previous" input is no longer the input that was passed in. In scoring/ranking, an input mutation can invalidate an entire batch downstream.

Fix: copy defensively at the boundary (`items = list(items)`, `data = dict(data)`), or explicitly document that the function takes ownership. Default to non-mutation unless there's a measured reason to do otherwise.

---

## Units & numeric

### Mixed units in one formula

Symptom: a formula adds, subtracts, or compares quantities with different units — kW to kWh, A to Ah, Wh to Ah without a voltage, EUR/month to EUR/year, minutes to hours.

Why it hurts: the compiler is happy, the tests might even pass on a specific case, but the answer is nonsense by a factor of 60, 1000, or a system voltage.

Fix: annotate variable names with their unit (`total_wh`, not `total`). Convert at the boundary, not in the middle of formulas. When in doubt, write a unit-round-trip test (see step 6 of the main skill): convert Wh → Ah → Wh at a known voltage and assert the number comes back.

Example:

```python
battery_capacity_ah = daily_consumption_wh
```

becomes

```python
battery_capacity_ah = daily_consumption_wh / SYSTEM_VOLTAGE_V
```

### Wrong rounding direction

Symptom: `round()` or `int()` applied to a safety-critical quantity without thought. Required battery capacity gets rounded to the nearest Ah instead of rounded up. Allowed voltage drop gets rounded up instead of down. Cable gauge gets rounded down instead of up.

Why it hurts: rounding direction is a safety decision. Rounding a *requirement* down leaves the system undersized; rounding a *limit* up lets inputs exceed it. The error is silent and always in the dangerous direction.

Fix: for every round, decide explicitly: am I rounding a requirement (→ up, `math.ceil`) or a budget (→ down, `math.floor`)? Use `round()` only for cosmetic display, never for engineering quantities.

### Float equality and drifting sums

Symptom: `if total == limit:`, or summing hundreds of floats and trusting the last-digit bit.

Why it hurts: `0.1 + 0.2 != 0.3`. Equality comparisons between floats that *should* be equal silently fail; sums of many small floats accumulate error that eventually breaks thresholds.

Fix: use a tolerance (`abs(a - b) < 1e-9`) for equality, or — preferably for money and physical units — store the quantity as an integer in the smallest meaningful unit (cents, milliwatt-hours) and convert only for display.

### Losing precision at the boundary

Symptom: the internal calculation is in doubles; the function returns an `int` via `int(x)` (which truncates) rather than `round(x)`. Or: currency is stored as float throughout and only rounded at the display layer.

Why it hurts: `int(2.9999999)` is `2`, not `3`. Off-by-one errors in capacity/count outputs come from here. Money in floats drifts across arithmetic and produces the classic "my totals don't add up" report.

Fix: choose the rounding mode deliberately at the return boundary. For currency, use `Decimal` or integer minor units end-to-end.

---

## Structure & maintainability

### Parse + compute + print in one function

Symptom: a single function reads a CSV/JSON file, runs the calculation, and prints the result — with no way to invoke just the calculation on in-memory data.

Why it hurts: untestable. The only way to test the formula is to set up a file on disk and capture stdout. Reusing the formula from a notebook, a web server, or a second entry-point requires duplicating it.

Fix: keep the pure calculation in its own function with typed inputs and outputs. I/O (file reading, printing, plotting, logging) wraps the calculation, never runs inside it.

Example:

```python
def compute_monthly_cost(csv_path):
    rows = read_csv(csv_path)
    total = sum(row["watts"] * row["hours"] for row in rows) / 1000 * 0.35
    print(f"Monthly cost: EUR {total:.2f}")
```

becomes

```python
def compute_monthly_cost(appliances, price_per_kwh=PRICE_PER_KWH_DEFAULT):
    kwh = sum(a.watts * a.hours_per_month for a in appliances) / 1000
    return kwh * price_per_kwh

def main(csv_path):
    appliances = load_appliances_from_csv(csv_path)
    cost = compute_monthly_cost(appliances)
    print(f"Monthly cost: EUR {cost:.2f}")
```

### Copy-pasted formula drift

Symptom: the same formula appears in two or three places (different branches, different entry-points). Over time one copy gets updated and the others don't.

Why it hurts: silent inconsistency. The function gives different answers depending on which code path the input took. Hard to spot in review, easy to ship.

Fix: the moment you find yourself typing the same expression a second time, extract it into a named helper. Every branch that needs the formula calls the helper.

### Swallowing validation errors

Symptom: the function catches an invalid input exception and returns `0`, `None`, or a "reasonable" fallback.

Why it hurts: the caller has no way to tell "the answer was genuinely zero" from "the input was garbage". Bad data flows downstream and corrupts aggregates.

Fix: fail loudly at the function boundary. Validate inputs, raise a specific exception (or return a discriminated result type) on invalid input. Let the caller decide how to degrade.

---

## Algorithmic choice

### Greedy where the problem needs exact

Symptom: assigning N tasks to M workers by "pick the best available pair each round"; scheduling by "next earliest deadline"; cable sizing by "smallest gauge that fits the biggest single load".

Why it hurts: greedy heuristics are correct for *some* problem structures (matroids, interval scheduling) and wrong for others (general assignment, bin packing). On the small test examples they almost always look fine. On the user's real workload they silently leave 10-30% performance on the table — or pick an infeasible solution.

Fix: before coding, name the problem class. Assignment with total cost? → Hungarian algorithm is O(n³) and exact. Bin packing? → acknowledge it's NP-hard and use FFD / BFD as a known-quality heuristic, not hand-rolled greedy. Small N? → brute force. Large N with constraints? → consider ILP via `pulp` / `scipy.optimize.linprog`. The *Rejected alternatives* section of the design doc exists for exactly this conversation.

### Hand-rolled where a library exists

Symptom: a from-scratch shortest-path, matrix solve, or interpolation — none of which are particularly interesting to the problem — shows up in the middle of the calculation.

Why it hurts: the bug density on re-implemented standard algorithms is high, and the user is paying for a dependency (reading, testing, maintaining) without the benefit of the ecosystem's fixes.

Fix: if `numpy`, `scipy.optimize`, `networkx`, or a similarly standard library already does the subroutine, use it. Save the hand-rolling for the parts that are actually domain-specific.

### Premature optimization

Symptom: cryptic bit-twiddling, manual loop unrolling, or a complex caching scheme — for a function that runs once per user request on inputs of size 50.

Why it hurts: the code is now harder to read and test, with no measurable benefit. Bugs are more likely. Reviewers can't tell what the algorithm *does* because the performance tricks dominate.

Fix: write the clean version first. Only optimize after measuring that it matters, and leave a comment saying which measurement triggered the optimization.

### Non-deterministic tie-breakers

Symptom: `sorted(items, key=score)` where two items can tie, and the output order changes between runs. `max(items, key=...)` on a list where ties exist. Iteration over `set` or `dict` (pre-3.7) producing ranking output.

Why it hurts: same input, different output. Users lose trust instantly ("why did Alice beat Bob yesterday and Bob beat Alice today, nothing changed?"). Tests become flaky. Downstream systems that assume stable ordering break.

Fix: define the tie-break rule in the design doc, then encode it as a composite sort key — `(primary_score, secondary_score, input_index)`. Document the rule in the function docstring so the user knows it's deterministic.

---

## Testing

### "Works on the example" as the only test

Symptom: one test case, and it's the exact example the user typed into the conversation.

Why it hurts: it proves the code doesn't crash on that input. It proves nothing about correctness. Overfitting (above) slides right through.

Fix: minimum three test shapes — one hand-computable, one edge case, one invalid-input. Beyond that, property/monotonicity tests (see step 6 of the main skill) catch whole families of bugs cheaply.

### Tests that can't fail

Symptom: `assert result is not None`, `assert len(result) >= 0`, `assert isinstance(result, dict)`. Tests that only check the return has a pulse.

Why it hurts: passes by construction, so it gives a false sense of security. The test suite says "100%" but the formula is untested.

Fix: every assertion should have a specific, pre-computed expected value (or a property that could realistically be violated). If you can't state what the output *should* be, you don't understand the formula yet.

### No regression case when a bug is fixed

Symptom: a bug gets found and fixed; the fix ships without a test that would have caught the original bug.

Why it hurts: the same bug comes back six weeks later under a different disguise.

Fix: every bug fix lands with a test that fails before the fix and passes after. It's the cheapest possible regression insurance.

---

## Domain drift

### Pattern-matching to the last problem you solved

Symptom: the user asked for a task-to-worker assignment, and the model returns a design doc that looks suspiciously like a battery-sizing calculator — or vice versa.

Why it hurts: the worked examples in this skill are meant as *patterns*, not templates. If the structure of the problem is different (optimization vs. closed-form formula, ranking vs. sizing), reusing the wrong pattern forces the algorithm into a shape that doesn't fit.

Fix: in step 2 of the process ("Check for a matching worked example"), ask explicitly — does the *shape* of this problem match the worked example, or just the surface keywords? If only the keywords match, work from first principles.

### Leaking a domain assumption into a general function

Symptom: a "generic" scoring function has `if appliance_type == "fridge": ...` buried inside it. A "generic" sizing calculator silently assumes 12V.

Why it hurts: the user asks for a second variant (24V system, a different item type) and the function produces wrong answers without raising.

Fix: domain-specific logic lives in named constants and explicit parameters, not hidden in branches. If the function only works for a specific case, say so in the docstring and raise on other inputs.

### Ignoring the regulation / standard underneath the constants

Symptom: numbers like `1.25`, `0.8`, `230` appear in the code with no pointer to the standard, manufacturer datasheet, or paper they came from.

Why it hurts: when the standard updates — and it will — nobody knows whether a given constant needs to change. The function silently uses out-of-date values.

Fix: every domain constant gets a source comment. Either a standard reference (`IEC 60364-5-52 Table B.52.2`), a manufacturer document (`Victron Cerbo GX manual, rev 3, p. 41`), or "rule of thumb, see design doc §Approach". The *Named constants* table in the design doc is the canonical list.