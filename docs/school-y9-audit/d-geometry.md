# Year 9 school audit — geometry, rates & probability (pages 10, 11, 12, 14, 15)

The school's knowledge organisers were used only to find out what pupils must be able to do. All question wording, examples and teaching text in the app is original.
Engine: `packages/engine/maths-y9s/d-geometry.cjs` · Learn: `packages/content-seed/maths-learn/y9s/d-geometry.cjs`.
Each topic below also has a teaching section called "School-style worked examples". For existing topics it is added through `__extraSections`.

Key: ✅ covered · 🆕 added in this audit · ⚠️ practised only by reading, choosing or calculating, because the app cannot check drawing.

## p10 Rotation & Translation → `y9-transformations`

| School item | App coverage | Status |
|---|---|---|
| Identify the order of rotational symmetry | y9-transformations-1 Order of rotational symmetry | ✅ |
| Rotational symmetry with tracing paper (count fits in 360°) | y9-transformations-1 (diagram + smallest angle of turn) | ✅ |
| Rotate a shape about a point on the shape | y9-transformations-5 (rotate about own vertex); y9-transformations-6 Choosing the correct rotated image | 🆕 ⚠️ |
| Rotate a shape about a point not on the shape | y9-transformations-5 (rotate point about C); y9-transformations-6 | 🆕 ⚠️ |
| Rotations about the origin (90° cw/acw, 180°) | y9-transformations-4 Rotating about the origin | ✅ |
| Translate by a given vector | y9-transformations-2 Translating by a column vector | ✅ |
| Translation and vector notation (find the vector) | y9-transformations-3 Finding the translation vector | ✅ |
| Compare rotations and reflections | y9-transformations-5 (reflection variant); y9-transformations-7 Describing & comparing transformations | 🆕 |
| Information needed for a reflection / rotation | y9-transformations-7 (MCQ "which information is needed") | 🆕 |
| Keywords: invariant point | y9-transformations-5 (invariant centre / mirror line) | ✅ |

## p11 Pythagoras' theorem → `y9-pythagoras` (existing)

| School item | App coverage | Status |
|---|---|---|
| Use square and cube roots | y9-pythagoras-6 Squares, square roots and cube roots | 🆕 |
| Squares and square roots (square numbers to 100) | y9-pythagoras-6 | 🆕 |
| Identify the hypotenuse | y9-pythagoras-7 Identifying the hypotenuse & checking for a right angle | 🆕 |
| Determine if a triangle is right-angled | y9-pythagoras-7 (yes/no from a² + b² = c²) | 🆕 |
| Calculate the hypotenuse | y9-pythagoras-1 Finding the hypotenuse | ✅ |
| Calculate missing (shorter) sides | y9-pythagoras-2 Finding a shorter side | ✅ |
| Pythagoras on a coordinate axis (read segment from grid, check scale) | y9-pythagoras-3 Distance between two points; y9-pythagoras-8 Pythagoras on a coordinate grid | 🆕 |
| Polygons split into right-angled triangles (diagonals) | y9-pythagoras-4, y9-pythagoras-5 (rectangle diagonals) | ✅ |
| Explore proofs of Pythagoras' theorem (squares on sides) | y9-pythagoras-7 (areas of squares on the sides) | 🆕 ⚠️ |

## p12 Enlargement & Similarity → `y9-enlargement`

| School item | App coverage | Status |
|---|---|---|
| Recognise enlargement and similarity | y9-enlargement-1 Recognising similar shapes | ✅ |
| Enlarge a shape by a positive scale factor | y9-enlargement-3 Enlarging lengths by a scale factor | ✅ ⚠️ |
| Enlarge a shape from a point (scaled distances / rays) | y9-enlargement-4 Enlarging from a centre; y9-enlargement-6 Choosing the correct enlargement | 🆕 ⚠️ |
| Enlarge a shape by a fractional scale factor | y9-enlargement-2, -3, -4, -6 (½, ⅓, ⅕, 3⁄2, 5⁄2) | ✅ |
| Scale factor from corresponding sides | y9-enlargement-2 Finding the scale factor | ✅ |
| Work out missing sides and angles in similar shapes | y9-enlargement-5 Missing sides and angles in similar shapes | ✅ |

## p14 Rates → `y9-rates-graphs`, `y9-speed-distance-time`, `y9-density` (existing)

| School item | App coverage | Status |
|---|---|---|
| Solve speed, distance, time questions | y9-speed-distance-time-1 … -5 | ✅ |
| Speed/distance/time with unit conversion (minutes ↔ hours) | y9-speed-distance-time-1, -2, -3 | ✅ |
| Double number line / bar model for speed | y9-speed-distance-time-1 (same calculation); school-style section | ✅ |
| Use distance–time graphs (gradient = speed) | y9-rates-graphs-1 Speed from a distance–time graph | ✅ |
| Distance–time graphs: stationary, return journey | y9-rates-graphs-2 Reading distance–time graphs | ✅ |
| Solve density, mass, volume problems | y9-density-1 … -4 | ✅ |
| Volume of prism = area of cross-section × depth (with density) | y9-density-5 Density of prisms | 🆕 |
| Solve flow problems | y9-rates-graphs-3 Flow rates and filling times | ✅ |
| Use flow graphs (container shape → graph shape) | y9-rates-graphs-6 Flow graphs: depth against time | 🆕 ⚠️ |
| Convert units in rates (m ↔ km, capacity) | y9-rates-graphs-4 Converting rates between units | ✅ |
| Interpret rates of change and their units | y9-rates-graphs-5 Rates of change and their units | ✅ |

## p15 Probability → `y9-probability-diagrams`, `y9-relative-frequency`, `y9-listing-outcomes` (existing)

| School item | App coverage | Status |
|---|---|---|
| The probability scale (0 to 1, words, intervals) | y9-probability-diagrams-6 The probability scale & single events | 🆕 |
| Find single event probability | y9-probability-diagrams-6 (bag of counters) | 🆕 |
| P(not A) = 1 − P(A); probabilities sum to 1 (table with missing value) | y9-probability-diagrams-1 Probabilities that sum to 1 | ✅ |
| Find relative frequency | y9-relative-frequency-2 Relative frequency | ✅ |
| Relative frequency from a frequency table; RF × trials | y9-relative-frequency-5 Relative frequency from a table | 🆕 |
| Find expected outcomes | y9-relative-frequency-1; y9-probability-diagrams-1 (table × trials) | ✅ |
| Find independent events (P(A) × P(B)) | y9-probability-diagrams-2 Independent events | ✅ |
| Use diagrams: Venn diagrams | y9-probability-diagrams-3 Probability from a Venn diagram | ✅ |
| Use diagrams: two-way tables | y9-probability-diagrams-4 Two-way tables | ✅ |
| Use diagrams: sample space (coin & dice) | y9-probability-diagrams-5 Sample spaces for two events; y9-listing-outcomes-2 | ✅ |

## Summary

- 46 school items in total: 30 ✅ covered already and 16 🆕 added (counting ✅ ⚠️ rows as ✅ and 🆕 ⚠️ rows as 🆕).
- 6 of these items are also marked ⚠️: drawing is practised only by reading, choosing or calculating.
- 10 new styles:
  - y9-transformations-6 and -7
  - y9-enlargement-6
  - y9-rates-graphs-6
  - y9-probability-diagrams-6
  - y9-pythagoras-6, -7 and -8
  - y9-density-5
  - y9-relative-frequency-5
