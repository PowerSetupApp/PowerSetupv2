# Algorithm Design Doc Template

Fill each section. Keep it short — this is a thinking tool, not a deliverable. Delete sections that genuinely don't apply, and note why.

## Problem statement

One paragraph: what are we computing, for whom, to what end? Use the user's words where possible so the doc stays anchored to what they asked for.

## Inputs


| Name | Type | Unit | Range / constraints | Required? | Default |
| ---- | ---- | ---- | ------------------- | --------- | ------- |
|      |      |      |                     |           |         |


## Outputs


| Name | Type | Unit | Meaning |
| ---- | ---- | ---- | ------- |
|      |      |      |         |


## Approach

1–3 paragraphs of prose. What formulas, what logic, why this approach rather than another obvious one. Cite sources for any domain constant or rule (standard number, manufacturer spec, paper, etc.).

## Rejected alternatives

For each approach you seriously considered but did not pick, one bullet. This is where the "why this approach rather than another" from *Approach* pays off — spelling out the rejected options makes the choice reviewable and stops the same debate from being re-run next time the code is touched. Most useful for non-trivial algorithms (optimization, scheduling, anything with a choice between greedy / exact / heuristic).

- `<approach>` — rejected because `<reason>` (complexity, accuracy, domain fit, dependency cost, …).
- `<approach>` — rejected because `<reason>`.

If there was no real alternative (e.g. a single closed-form formula), write "none — only one reasonable approach" and move on.

## Pseudocode

```
function solve(inputs):
    validate(inputs)
    intermediate = ...
    result = ...
    return result
```

Aim for 10–40 lines. Close to executable but language-agnostic. This is the contract the implementation will mirror.

## Complexity

- Time: O(?)
- Space: O(?)

For calculators with fixed input shape this is usually trivial — say so and move on.

## Edge cases

One bullet per case. For each, say what the algorithm does.

- Empty input → …
- All zeros → …
- Single very large value dominates → …
- Boundary of allowed range → …
- Invalid / nonsense input → …

## Validation rules

What makes input invalid? What does the function do on invalid input — raise, return null, clamp, warn? Be explicit.

## Named constants

List domain constants used in the approach, with source.


| Name | Value | Unit | Source / rationale |
| ---- | ----- | ---- | ------------------ |
|      |       |      |                    |


## Assumptions and defaults

Anything you chose for the user without asking. This is the list the user should glance at to confirm nothing surprising slipped in.

- …
- …

## Open questions

Things to confirm with the user before or right after implementing.

- [ ]
- [ ]

