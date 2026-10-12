'use strict';
// Year 9 school unit teaching pages: 3D shapes; constructions, loci & congruence; angles in parallel lines & deduction.
const W = (q, steps, a) =>
  `<div class="worked"><div class="wq">${q}</div><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol><div class="wa">Answer: ${a}</div></div>`;
const rule = (t) => `<div class="rule">${t}</div>`;
const note = (t) => `<div class="note">${t}</div>`;
const table = (head, rows) =>
  `<table class="qt"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</table>`;

const C = {};

/* ------------------------------------------------------------------ */
C['y9-3d-shapes'] = {
  overview: `<p>Solids such as cubes, prisms, pyramids and cylinders are everywhere — in packaging, buildings and furniture. In this unit you describe solids using <b>faces, edges and vertices</b>, link them to their flat <b>nets</b>, draw what they look like from above and from the side (<b>plans and elevations</b>), and work out their <b>surface area</b>, including for a cylinder.</p>`,
  objectives: [
    'I can count the faces, edges and vertices of prisms and pyramids.',
    'I can recognise a prism and say why some solids are not prisms.',
    'I can match a net to the solid it makes.',
    'I can describe and count the plan, front elevation and side elevation of a solid.',
    'I can find the surface area of cuboids and triangular prisms.',
    'I can find the surface area of a cylinder, giving answers in terms of π when asked.',
  ],
  keyWords: [
    { term: 'Face', def: 'A flat surface of a solid.' },
    { term: 'Edge', def: 'A line where two faces meet.' },
    { term: 'Vertex', def: 'A corner where edges meet (plural: vertices).' },
    { term: 'Prism', def: 'A solid with flat faces and the same cross-section all the way through, so its two ends are identical.' },
    { term: 'Net', def: 'A flat 2D shape that folds up to make a 3D solid.' },
    { term: 'Plan', def: 'The view of a solid from directly above.' },
    { term: 'Elevation', def: 'The view of a solid from the front or from the side.' },
    { term: 'Surface area', def: 'The total area of all the faces (or surfaces) of a solid, in square units.' },
  ],
  sections: [
    {
      title: 'Faces, edges and vertices',
      html: `<p>Count carefully by thinking about the structure. A prism has two identical ends joined by rectangles; a pyramid has a base and triangles that meet at the apex.</p>
${table(['Solid (n-sided end or base)', 'Faces', 'Edges', 'Vertices'], [['Prism', 'n + 2', '3n', '2n'], ['Pyramid', 'n + 1', '2n', 'n + 1'], ['Cube / cuboid (n = 4)', '6', '12', '8'], ['Triangular prism (n = 3)', '5', '9', '6']])}
${rule("Euler's rule for solids with flat faces: F + V − E = 2")}
${W('How many edges does a hexagonal-based pyramid have?', ['The base is a hexagon, so n = 6.', 'There are 6 edges round the base and 6 going up to the apex.', 'Check: F = 7, V = 7, so E = 7 + 7 − 2 = 12 ✓'], '12 edges')}
${note('A cylinder is not a prism: it has a curved surface rather than flat rectangular faces. A pyramid is not a prism because its cross-section gets smaller towards the top.')}`,
    },
    {
      title: 'Nets',
      html: `<p>To decide what a net makes, count the faces and look at their shapes. Imagine folding it: which faces end up opposite each other?</p>
<svg viewBox="0 0 300 150" width="100%" style="max-width:320px" role="img" aria-label="Net of a triangular prism: three rectangles in a row with a triangle at each end">
<g stroke="currentColor" stroke-width="2" fill="#3b6cf6" fill-opacity="0.08"><rect x="80" y="20" width="140" height="36"/><rect x="80" y="56" width="140" height="36"/><rect x="80" y="92" width="140" height="36"/><polygon points="80,56 80,92 49,74"/><polygon points="220,56 220,92 251,74"/></g>
</svg>
${table(['The net has…', 'It makes a…'], [['6 squares', 'cube'], ['3 pairs of matching rectangles', 'cuboid'], ['2 triangles and 3 rectangles', 'triangular prism'], ['1 square and 4 triangles', 'square-based pyramid'], ['4 triangles', 'tetrahedron'], ['1 rectangle and 2 circles', 'cylinder']])}
${note('Not every arrangement of six squares folds into a cube. If two squares would land on the same side, it is not a net.')}`,
    },
    {
      title: 'Plans and elevations',
      html: `<p>A <b>plan</b> is the view from above; the <b>front elevation</b> and <b>side elevation</b> are the views from the front and side. Each one is a flat 2D shape.</p>
${table(['Solid', 'Plan', 'Front elevation'], [['Cuboid', 'rectangle (length × depth)', 'rectangle (length × height)'], ['Upright cylinder', 'circle', 'rectangle, as wide as the diameter'], ['Square-based pyramid', 'square with both diagonals', 'triangle'], ['Upright cone', 'circle with a dot at the centre', 'triangle, as wide as the diameter']])}
${W('A solid is made from cubes. On its plan the stacks are 2 and 3 in the back row and 1 and 1 in the front row. How many squares are in the front elevation?', ['From the front, each column shows its tallest stack.', 'Left column: tallest of 2 and 1 is 2. Right column: tallest of 3 and 1 is 3.', '2 + 3 = 5'], '5 squares')}`,
    },
    {
      title: 'Surface area of prisms',
      html: `<p>Sketch the net so you do not miss a face. For a prism: area of the two ends + perimeter of the cross-section × length.</p>
${W('A triangular prism has a right-angled cross-section with sides 6 cm, 8 cm and 10 cm. It is 15 cm long. Find its surface area.', ['Two triangles: 2 × ½ × 6 × 8 = 48 cm².', 'Three rectangles: (6 + 8 + 10) × 15 = 360 cm².', 'Total: 48 + 360 = 408 cm².'], '408 cm²')}
${W('An open box (no lid) is 10 cm long, 4 cm wide and 3 cm high. Find the area of card needed.', ['Base: 10 × 4 = 40 cm².', 'Front and back: 2 × 10 × 3 = 60 cm². Ends: 2 × 4 × 3 = 24 cm².', 'Total: 40 + 60 + 24 = 124 cm².'], '124 cm²')}
${note('For the triangles use the perpendicular height; for the rectangles use the actual (sloping) side lengths.')}`,
    },
    {
      title: 'Surface area of a cylinder',
      html: `<p>The net of a closed cylinder is two circles and a rectangle. The rectangle wraps round the circle, so its length is the circumference, πd.</p>
${rule('Surface area of a closed cylinder = 2πr² + πdh &nbsp; (curved surface alone = πdh)')}
${W('A closed cylinder has radius 3 cm and height 10 cm. Find its surface area in terms of π.', ['Two circles: 2 × π × 3² = 18π.', 'Curved surface: π × 6 × 10 = 60π.', 'Total: 18π + 60π = 78π.'], '78π cm² (≈ 245.0 cm²)')}
${note('“In terms of π” means leave π in the answer, like 78π — do not multiply it out.')}`,
    },
  ],
  mistakes: [
    'Mixing up edges and vertices, or counting hidden edges twice.',
    'Calling a cylinder or a pyramid a prism.',
    'Forgetting a face (such as the base) or counting a lid on an open box.',
    'Using the radius instead of the diameter for the curved surface (πdh), or forgetting there are two circles.',
    'Using the sloping side instead of the perpendicular height for a triangle’s area.',
  ],
  examTips: [
    'Sketch the net and list every face with its area before adding.',
    'Write the units as square units (cm², m²) for area.',
    'If a question says “in terms of π”, keep π in the answer and simplify, e.g. 18π + 60π = 78π.',
  ],
  realLife: 'Manufacturers use surface area to work out how much cardboard, metal or label paper is needed for boxes and tins, and architects use plans and elevations to show a building from every side.',
  specRef: 'Edexcel 1MA1 G1, G12, G13, G17',
};

/* ------------------------------------------------------------------ */
C['y9-constructions'] = {
  overview: `<p>Constructions use a ruler, compasses and a protractor to draw accurately. In this unit you use <b>scales</b> on maps and drawings, describe <b>loci</b> (sets of points that follow a rule), use <b>perpendicular and angle bisectors</b>, construct triangles, and decide when two triangles are <b>congruent</b>.</p>`,
  objectives: [
    'I can use map scales and scale drawings to find real and drawn lengths.',
    'I can choose the correct locus for a rule about points or lines.',
    'I can use the properties of perpendicular bisectors and angle bisectors.',
    'I can decide whether a triangle can be constructed from given information.',
    'I can use SSS, SAS, ASA and RHS to show triangles are congruent.',
    'I can find missing sides and angles in congruent triangles.',
  ],
  keyWords: [
    { term: 'Scale', def: 'A ratio such as 1 : 50 000 linking a length on a map or drawing to the real length.' },
    { term: 'Locus', def: 'The set of all points that obey a rule (plural: loci).' },
    { term: 'Equidistant', def: 'The same distance from two or more things.' },
    { term: 'Perpendicular bisector', def: 'A line that cuts a line segment in half at right angles.' },
    { term: 'Angle bisector', def: 'A line that cuts an angle into two equal halves.' },
    { term: 'Arc', def: 'Part of the circumference of a circle, drawn with compasses.' },
    { term: 'Congruent', def: 'Exactly the same shape and size; one can be rotated or reflected onto the other.' },
    { term: 'Hypotenuse', def: 'The longest side of a right-angled triangle, opposite the right angle.' },
  ],
  sections: [
    {
      title: 'Scale drawings and maps',
      html: `<p>A scale of 1 : n means every 1 unit on the drawing is n of the same units in real life.</p>
${W('A map has a scale of 1 : 25 000. Two towers are 6 cm apart on the map. How far apart are they in real life?', ['Real distance = 6 × 25 000 = 150 000 cm.', '150 000 cm ÷ 100 = 1500 m.', '1500 m ÷ 1000 = 1.5 km.'], '1.5 km')}
${W('A 9 m wall is drawn 3 cm long. Write the scale as 1 : n.', ['Same units: 9 m = 900 cm.', 'Scale = 3 : 900.', 'Divide by 3: 1 : 300.'], '1 : 300')}
${note('Change real lengths into the same unit as the map before dividing.')}`,
    },
    {
      title: 'Loci',
      html: `${table(['Rule', 'Locus'], [['Fixed distance from a point', 'A circle centred on the point'], ['Fixed distance from a line segment', 'A “stadium”: two parallel lines joined by semicircles'], ['Equidistant from two points A and B', 'The perpendicular bisector of AB'], ['Equidistant from two lines that meet', 'The bisector of the angle between them'], ['Less than a distance from a point', 'The region inside a circle']])}
${W('A goat is tied to a post in the middle of a field with a 5 m rope. What area can it graze?', ['The goat can reach any point up to 5 m from the post: a circle of radius 5 m.', 'Area = π × 5² = 25π.'], '25π ≈ 78.5 m²')}
${note('Read whether the question wants a line (exactly 3 m away) or a region (within 3 m). Shade regions clearly.')}`,
    },
    {
      title: 'Bisectors and constructing triangles',
      html: `<p>To construct a perpendicular bisector of AB, draw arcs of the same radius (more than half of AB) from A and from B, then join the two crossing points. To bisect an angle, draw an arc from the vertex across both arms, then equal arcs from those two points, and join the vertex to where they cross.</p>
${rule('Any point on the perpendicular bisector of AB is the same distance from A and B.<br>Any point on an angle bisector is the same distance from both arms.')}
${W('Can you construct a triangle with sides 4 cm, 5 cm and 10 cm?', ['Add the two shorter sides: 4 + 5 = 9 cm.', '9 cm is less than the longest side, 10 cm, so the arcs never meet.'], 'No')}
${note('Leave all your construction arcs showing — they are the evidence that you used compasses.')}`,
    },
    {
      title: 'Congruent triangles',
      html: `<p>Two triangles are congruent if one of these sets of facts matches:</p>
${table(['Condition', 'What must be equal'], [['SSS', 'all three sides'], ['SAS', 'two sides and the angle between them'], ['ASA', 'two angles and a corresponding side'], ['RHS', 'a right angle, the hypotenuse and one other side']])}
${note('AAA is not enough — an enlargement has the same angles but is bigger. SSA (an angle that is not between the two sides) is not enough either, because the third side can swing to two positions.')}
${W('Triangle ABC is congruent to triangle PQR. AB = 7 cm, BC = 9 cm and angle ABC = 48°. Find QR and angle PQR.', ['Match letters in order: A ↔ P, B ↔ Q, C ↔ R.', 'QR matches BC, so QR = 9 cm.', 'Angle PQR matches angle ABC, so it is 48°.'], 'QR = 9 cm, angle PQR = 48°')}`,
    },
  ],
  mistakes: [
    'Forgetting to convert units (cm to m or km) when using a map scale.',
    'Drawing a circle for “equidistant from two points” instead of a perpendicular bisector.',
    'Treating SSA or AAA as proof of congruence.',
    'Matching sides by position in the diagram instead of by the order of the letters.',
  ],
  examTips: [
    'Always leave construction arcs visible and do not rub them out.',
    'When proving congruence, list three equal facts with reasons, then name the condition (e.g. SAS).',
    'For loci, check whether a line or a region is needed and label it.',
  ],
  realLife: 'Planners use loci to decide where a phone mast covers, sailors use map scales and bearings to plot courses, and engineers rely on congruent parts being exactly the same size.',
  specRef: 'Edexcel 1MA1 G2, G5, G15, R2',
};

/* ------------------------------------------------------------------ */
C['y9-angle-deduction'] = {
  overview: `<p>Geometry is about reasoning, not measuring. In this unit you use angle facts — especially the rules for <b>parallel lines</b> — to work out unknown angles, write the <b>reason</b> for each step, form and solve <b>equations</b> from angle facts, use the properties of <b>quadrilaterals</b> and <b>polygons</b>, and test <b>conjectures</b>.</p>`,
  objectives: [
    'I can identify alternate, corresponding and co-interior angles.',
    'I can find missing angles in parallel lines and give the correct reasons.',
    'I can chain several angle facts together to solve a problem.',
    'I can form and solve equations using angle facts.',
    'I can use the angle properties of quadrilaterals and polygons.',
    'I can decide whether a conjecture is always, sometimes or never true, and find a counterexample.',
  ],
  keyWords: [
    { term: 'Parallel', def: 'Lines that stay the same distance apart and never meet; shown with arrows.' },
    { term: 'Transversal', def: 'A line that crosses two or more other lines.' },
    { term: 'Alternate angles', def: 'Angles between the parallel lines on opposite sides of the transversal; they are equal.' },
    { term: 'Corresponding angles', def: 'Angles in matching positions at each parallel line; they are equal.' },
    { term: 'Co-interior angles', def: 'Angles between the parallel lines on the same side of the transversal; they add up to 180°.' },
    { term: 'Conjecture', def: 'A statement that seems to be true but has not yet been proved.' },
    { term: 'Counterexample', def: 'One example that shows a statement is false.' },
  ],
  sections: [
    {
      title: 'Angles in parallel lines',
      html: `<svg viewBox="0 0 300 170" width="100%" style="max-width:340px" role="img" aria-label="Two parallel lines crossed by a transversal, with angles p, q and r marked">
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="50" x2="280" y2="50"/><line x1="20" y1="120" x2="280" y2="120"/><line x1="90" y1="160" x2="190" y2="10"/></g>
<g stroke="#3b6cf6" stroke-width="2" fill="none"><polyline points="250,44 258,50 250,56"/><polyline points="250,114 258,120 250,126"/></g>
<g font-size="14" text-anchor="middle"><text x="143" y="65" fill="#3b6cf6">p</text><text x="137" y="114" fill="#3b6cf6">q</text><text x="105" y="106" fill="currentColor">r</text></g>
</svg>
${table(['Pair', 'Name', 'Rule'], [['p and q', 'Alternate (Z shape)', 'Equal'], ['angles in the same position at each line', 'Corresponding (F shape)', 'Equal'], ['p and r', 'Co-interior (C shape)', 'Add up to 180°']])}
${W('Two parallel lines are crossed by a transversal. One angle between the lines is 72°. Find its co-interior angle.', ['The two angles are between the parallel lines on the same side of the transversal, so they are co-interior.', 'Co-interior angles add up to 180°: 180 − 72 = 108.'], '108°')}`,
    },
    {
      title: 'Reasoning in steps',
      html: `${table(['Fact', 'Rule'], [['Angles on a straight line', 'add up to 180°'], ['Angles around a point', 'add up to 360°'], ['Vertically opposite angles', 'are equal'], ['Angles in a triangle', 'add up to 180°'], ['Angles in a quadrilateral', 'add up to 360°'], ['Interior angles of an n-sided polygon', 'add up to (n − 2) × 180°']])}
${W('Triangle PQR has angle P = 50° and angle R = 65°. PQ is extended to S. Find the exterior angle RQS.', ['Angles in a triangle add up to 180°: angle PQR = 180 − 50 − 65 = 65°.', 'Angles on a straight line add up to 180°: angle RQS = 180 − 65 = 115°.'], '115° (the same as 50° + 65°)')}
${note('Write a reason after every angle you find. Use the proper names — “Z angles” will not earn the reasoning mark.')}`,
    },
    {
      title: 'Forming and solving equations',
      html: `${W('Two angles on a straight line are (3x + 20)° and (2x − 15)°. Find x.', ['Angles on a straight line add up to 180°: 3x + 20 + 2x − 15 = 180.', '5x + 5 = 180, so 5x = 175.', 'x = 35.'], 'x = 35')}
${W('Alternate angles are (5x − 12)° and (3x + 30)°. Find the size of each angle.', ['Alternate angles are equal: 5x − 12 = 3x + 30.', '2x = 42, so x = 21.', 'Angle = 5 × 21 − 12 = 93°.'], '93°')}`,
    },
    {
      title: 'Quadrilaterals, polygons and conjectures',
      html: `${table(['Shape', 'Angle properties'], [['Parallelogram', 'Opposite angles equal; neighbouring angles add to 180°'], ['Rhombus', 'As a parallelogram, with four equal sides'], ['Kite', 'One pair of equal opposite angles (between the unequal sides)'], ['Isosceles trapezium', 'Two pairs of equal base angles; angles along each slanted side add to 180°']])}
<p>A <b>conjecture</b> can be <b>always</b>, <b>sometimes</b> or <b>never</b> true. Testing lots of cases supports a conjecture, but only a proof shows it is always true. One <b>counterexample</b> is enough to show it is false.</p>
${W('Is “a quadrilateral with four equal sides is a square” true?', ['Look for a shape with four equal sides that is not a square.', 'A rhombus with angles 60° and 120° has four equal sides but no right angles.'], 'False — a rhombus is a counterexample')}`,
    },
  ],
  mistakes: [
    'Using parallel-line rules when the lines are not marked as parallel.',
    'Mixing up alternate angles (equal) and co-interior angles (add to 180°).',
    'Solving for x but forgetting to substitute back when the question asks for the angle.',
    'Thinking several examples that work prove a conjecture is always true.',
  ],
  examTips: [
    'Mark each angle you find on the diagram as you go.',
    'Give a reason for every step using the full name of the rule.',
    'Check your answers: angles on a line should total 180° and in a quadrilateral 360°.',
  ],
  realLife: 'Builders, joiners and road designers use parallel-line angle facts to make roofs, staircases and junctions meet correctly, and reasoning from facts is the basis of every mathematical proof.',
  specRef: 'Edexcel 1MA1 G1, G3, G4, G6',
};

module.exports = C;
