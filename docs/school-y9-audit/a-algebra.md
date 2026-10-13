# Year 9 school knowledge organisers — algebra audit (pages p01, p02, p03, p16)

Each item on the school sheets (the "What do I need to be able to do?" bullets and every content box), mapped to the app styles that practise it.
Legend: ✅ covered by an existing style · 🆕 added in this audit · ⚠️ practised only by reading/choosing, not by drawing.
New styles live in `packages/engine/maths-y9s/a-algebra.cjs`. Teaching sections called "School-style worked examples" were added to every topic listed here. For topics that already existed, they are added through `__extraSections` in `packages/content-seed/maths-learn/y9s/a-algebra.cjs`.

## p01 — Straight Line Graphs (y9-straight-line-graphs)

| School item | App coverage (style id + name) | Status |
|---|---|---|
| Bullet: Compare gradients | y9-straight-line-graphs-8 Comparing gradients & intercepts (steepest line, parallel lines) | 🆕 |
| Bullet: Compare intercepts | y9-straight-line-graphs-8 (same y-intercept, coordinates (0, c)); y9-straight-line-graphs-2 | 🆕 |
| Bullet: Understand and use y = mx + c | y9-straight-line-graphs-2 Gradient & intercept from an equation; -3 Equation of a line through two points | ✅ |
| Bullet: Find the equation of a line from a graph | y9-straight-line-graphs-8 (line drawn on a grid → y = mx + c); -3 | 🆕 |
| Bullet: Interpret gradient and intercepts of real-life graphs | y9-straight-line-graphs-5 Linear graphs in context; -6 Lines parallel to the axes & real-life graphs | ✅ |
| Box: Lines parallel to the axes (x = a vertical, y = a horizontal, intersection points) | y9-straight-line-graphs-6 | ✅ |
| Box: Plotting y = mx + c (table of values, coordinate pairs) | y9-straight-line-graphs-7 Tables of values for straight lines (plotting itself ⚠️ by reading) | 🆕 |
| Box: Compare gradients (steeper, parallel = same gradient, positive/negative) | y9-straight-line-graphs-8; -4 Parallel lines | 🆕 |
| Box: Compare intercepts (y-intercept is (0, c); same c crosses at same place) | y9-straight-line-graphs-8 | 🆕 |
| Box: y = mx + c (identify m and c, rearranged forms) | y9-straight-line-graphs-2; y9-formulae-5 Rearranging to find a gradient | ✅ |
| Box: Find the equation from a graph (read intercept, rise ÷ run) | y9-straight-line-graphs-8 (grid mode) | 🆕 |
| Box: Real-life graphs (call-out fee + hourly rate table; intercept = minimum charge, gradient = rate) | y9-straight-line-graphs-6; -5 | ✅ |
| Box: Direct proportion graphs (start at origin, gradient = price per item) | y9-straight-line-graphs-6 | ✅ |

## p02 — Forming and Solving Equations (y9-equations-both-sides, y9-inequalities, y9-formulae)

| School item | App coverage (style id + name) | Status |
|---|---|---|
| Bullet: Solve inequalities with negative numbers | y9-inequalities-2 Inequalities with a negative x term | ✅ |
| Bullet: Solve equations with unknowns on both sides | y9-equations-both-sides-1 Unknowns on both sides; -3 Brackets and unknowns on both sides | ✅ |
| Bullet: Solve inequalities with unknowns on both sides | y9-inequalities-6 Inequalities with unknowns on both sides | 🆕 |
| Bullet: Substitute into formulae and equations | y9-formulae-1 Substituting into formulae; y9-formulae-6 Substituting to form and solve equations | ✅ |
| Bullet: Rearrange formulae | y9-formulae-3 Rearranging formulae (one step); -4 (two steps) | ✅ |
| Box: Solve equations with brackets (bar model) | y9-equations-both-sides-2 Equations with brackets | ✅ |
| Box: Form and solve inequalities ("two more than treble my number…") | y9-inequalities-7 Forming and solving inequalities; number lines in y9-nonlinear-graphs-4 | 🆕 |
| Box: Inequalities with negatives (keep x positive, or divide by a negative and reverse) | y9-inequalities-2 | ✅ |
| Box: Equations with unknown on both sides | y9-equations-both-sides-1 | ✅ |
| Box: Inequalities with unknown on both sides, with "check it" | y9-inequalities-6 (steps include a numerical check) | 🆕 |
| Box: Formulae and equations (substituting values into a formula gives an equation) | y9-formulae-6; y9-formulae-2 Expressions, equations, formulae & identities | 🆕 |
| Box: Rearranging formulae (one step, function machines, fact families) | y9-formulae-3 | ✅ |
| Box: Rearranging formulae (two step; same steps as solving; e.g. xy − s = a) | y9-formulae-4 | ✅ |
| Box: Rearranging to y = mx + c to find a gradient | y9-formulae-5; y9-straight-line-graphs-2 | ✅ |

## p03 — Testing Conjectures (y9-conjectures, y9-expanding-double)

| School item | App coverage (style id + name) | Status |
|---|---|---|
| Bullet: Use factors, multiples and primes | y9-conjectures-6 HCF, LCM & prime factors | 🆕 |
| Bullet: Reason true or false | y9-conjectures-7 True or false? Testing patterns; -2 Counterexamples | 🆕 |
| Bullet: Reason always, sometimes, never true | y9-conjectures-1 Always, sometimes or never true | ✅ |
| Bullet: Show that reasoning | y9-conjectures-3 Odd, even & consecutive numbers in algebra; -4 Identities & verification | ✅ |
| Bullet: Make conjectures about number | y9-conjectures-1; -2 | ✅ |
| Bullet: Expand binomials | y9-expanding-double-1 Expanding (x + a)(x + b); -3 Squaring a bracket; y9-conjectures-4 | ✅ |
| Bullet: Make conjectures with algebra | y9-conjectures-3 | ✅ |
| Bullet: Explore the 100 grid | y9-conjectures-5 Generalising on a number grid | ✅ |
| Box: Factors, multiples and primes (HCF and LCM by listing, prime factor tree) | y9-conjectures-6 | 🆕 |
| Box: True or false / counterexamples (sequence that is not really doubling) | y9-conjectures-7 (sequence traps); -2 | 🆕 |
| Box: Always, sometimes, never (test 0, 1, fractions, negatives) | y9-conjectures-1 | ✅ |
| Box: Show that (numerical verification, algebraic verification, proof) | y9-conjectures-4; -3 | ✅ |
| Box: Conjectures (even = 2n, odd = 2n + 1) | y9-conjectures-3 | ✅ |
| Box: Expanding binomials (algebra tiles, order of the binomial does not matter) | y9-expanding-double-1, -3 (tiles and order shown in the new teaching section) | ✅ |
| Box: Exploring the 100 square (n + 1, n + 10, grid size changes the rule) | y9-conjectures-5 | ✅ |

## p16 — Algebraic Representation (y9-nonlinear-graphs)

| School item | App coverage (style id + name) | Status |
|---|---|---|
| Bullet: Draw quadratic graphs | y9-nonlinear-graphs-1 Tables of values for quadratics (finding the points to plot) | ⚠️ |
| Bullet: Interpret quadratic graphs | y9-nonlinear-graphs-2 Roots, y-intercept & turning point | ✅ |
| Bullet: Interpret other graphs including reciprocals | y9-nonlinear-graphs-3 Recognising graph shapes; -6 Cubic, reciprocal & exponential values | 🆕 |
| Bullet: Represent inequalities | y9-nonlinear-graphs-4 Inequalities on a number line; -5 Representing inequalities on a graph (read/choose, no shading by hand) | ⚠️ |
| Box: Quadratic graphs (table, coordinate pairs, y-axis intersection, symmetry and turning point) | y9-nonlinear-graphs-1, -2 | ✅ |
| Box: Cubic graphs (highest power 3) | y9-nonlinear-graphs-3; -6 | 🆕 |
| Box: Reciprocal graphs (x cannot be 0, asymptote) | y9-nonlinear-graphs-3; -6 | 🆕 |
| Box: Exponential graphs (power of x) | y9-nonlinear-graphs-3; -6 | 🆕 |
| Box: Inequality on a number line (x < 4, open circle) | y9-nonlinear-graphs-4 | ✅ |
| Box: Region x < 4 (dotted line, shading) | y9-nonlinear-graphs-5 | ✅ |
| Box: Region y ≥ 2x + 1 (solid line, shading) | y9-nonlinear-graphs-5 | ✅ |

## Totals

| Status | Count |
|---|---|
| ✅ covered already | 32 |
| 🆕 added | 19 |
| ⚠️ reading only | 2 |
