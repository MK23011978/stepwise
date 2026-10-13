'use strict';
// Year 9 school-unit learn pages: Rotation & Translation, Enlargement & Similarity, Rates, Probability diagrams.
const f = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const W = (q, steps, a) =>
  `<div class="worked"><div class="wq">${q}</div><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol><div class="wa">Answer: ${a}</div></div>`;
const rule = (t) => `<div class="rule">${t}</div>`;
const note = (t) => `<div class="note">${t}</div>`;
const table = (head, rows) =>
  `<table class="qt"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</table>`;
const vec = (a, b) => `(${a} over ${b})`;

const C = {};

/* ------------------------------------------------------------------ */
C['y9-transformations'] = {
  overview: `<p>A <b>transformation</b> moves or changes a shape. In this unit you meet two that keep the shape exactly the same size: a <b>translation</b> slides it, and a <b>rotation</b> turns it about a fixed point. You will also find the <b>order of rotational symmetry</b> of a shape, compare rotations with reflections, and spot <b>invariant points</b> — points that do not move.</p>`,
  objectives: [
    'I can find the order of rotational symmetry of a shape.',
    'I can translate a point or shape by a column vector, and write the vector for a translation.',
    'I can rotate a point or shape 90° or 180° about the origin or another point.',
    'I can say what information is needed to describe a rotation, a reflection and a translation.',
    'I can identify invariant points.',
  ],
  keyWords: [
    { term: 'Rotation', def: 'A turn about a fixed point (the centre of rotation) through a given angle and direction.' },
    { term: 'Translation', def: 'A slide: every point moves the same distance in the same direction.' },
    { term: 'Column vector', def: 'Two numbers stacked in brackets: the top one is the move right (+) or left (−), the bottom one is the move up (+) or down (−).' },
    { term: 'Rotational symmetry', def: 'A shape has rotational symmetry if it fits onto itself more than once during a full turn.' },
    { term: 'Order of rotational symmetry', def: 'The number of times a shape fits onto itself in one full turn of 360°.' },
    { term: 'Invariant point', def: 'A point that stays in the same place after a transformation.' },
    { term: 'Image', def: 'The shape or point after the transformation has been applied.' },
  ],
  sections: [
    {
      title: 'Rotational symmetry',
      html: `<p>Trace the shape and mark its centre. Turn the tracing paper a full turn and count how many times the tracing sits exactly on top of the shape. Every shape fits at least once (at the end of the turn), so the lowest order is 1.</p>
${table(['Shape', 'Order'], [['Rectangle, parallelogram, rhombus', '2'], ['Square', '4'], ['Equilateral triangle', '3'], ['Regular polygon with n sides', 'n'], ['Kite, isosceles triangle', '1']])}
${rule('Smallest angle of turn that maps a shape onto itself = 360° ÷ order')}
${W('A logo fits onto itself every 45° when it is turned. What is its order of rotational symmetry?', ['A full turn is 360°.', '360 ÷ 45 = 8.'], 'order 8')}`,
    },
    {
      title: 'Translation and column vectors',
      html: `<p>A column vector is written with one number above the other. We write it here as ${vec('a', 'b')}: <b>a</b> is the move across, <b>b</b> is the move up or down.</p>
${rule('Image of (x, y) after translation by ' + vec('a', 'b') + ' is (x + a, y + b)')}
${W('Translate the point (−2, 5) by the vector ' + vec('4', '−3') + '.', ['Across: −2 + 4 = 2.', 'Up/down: 5 + (−3) = 2.'], '(2, 2)')}
${W('Shape A has a corner at (1, −1). The matching corner of shape B is at (−3, 2). Describe the translation from A to B.', ['Across: −3 − 1 = −4, so 4 left.', 'Up: 2 − (−1) = 3, so 3 up.'], 'translation by the vector ' + vec('−4', '3'))}
${note('The translation from B back to A uses the opposite vector: change the sign of both numbers.')}`,
    },
    {
      title: 'Rotating about the origin',
      html: `<p>To describe a rotation you need <b>three</b> facts: the centre, the angle and the direction (clockwise or anticlockwise). A 180° turn is the same in both directions.</p>
${table(['Rotation about (0, 0)', 'Rule'], [['90° clockwise', '(x, y) → (y, −x)'], ['90° anticlockwise', '(x, y) → (−y, x)'], ['180°', '(x, y) → (−x, −y)']])}
${W('Rotate P(3, 1) through 90° anticlockwise about the origin.', ['Use (x, y) → (−y, x).', 'x = 3, y = 1, so the image is (−1, 3).', 'Check with tracing paper: P was in the top-right quarter and turns a quarter-turn anticlockwise into the top-left quarter.'], '(−1, 3)')}`,
    },
    {
      title: 'Rotating about any point',
      html: `<p>When the centre C is not the origin, work out where the point is <b>relative to C</b>, rotate that, then add it back on to C. With tracing paper: trace the shape and the centre, pin the centre with your pencil, and turn.</p>
${W('Rotate A(4, 3) through 90° clockwise about C(1, 1).', ['From C to A: 3 right, 2 up → (3, 2).', 'Rotate 90° clockwise: (3, 2) → (2, −3).', 'Add back to C: (1 + 2, 1 − 3).'], '(3, −2)')}
${note('The centre of rotation is an invariant point: it does not move. If the centre is a vertex of the shape, that vertex stays put.')}`,
    },
    {
      title: 'Comparing transformations',
      html: `${table(['Transformation', 'What you must state', 'Invariant points'], [['Reflection', 'the mirror line, e.g. x = 2', 'every point on the mirror line'], ['Rotation', 'centre, angle, direction', 'the centre only'], ['Translation', 'the column vector', 'none (unless the vector is zero)']])}
<p>Reflections flip a shape over, so it faces the other way. Rotations and translations keep it facing the same way round. All three keep the size and angles the same.</p>`,
    },
  ],
  mistakes: [
    'Swapping the numbers in a column vector — the top number is always the horizontal move.',
    'Forgetting to give all three facts (centre, angle, direction) when describing a rotation.',
    'Rotating about the origin when the question gives a different centre.',
    'Saying a shape with no rotational symmetry has order 0 — the smallest order is 1.',
    'Mixing up clockwise and anticlockwise; sketch the turn with tracing paper to check.',
  ],
  examTips: [
    'Ask for tracing paper in the exam — it makes rotations and rotational symmetry much easier.',
    'For "describe fully", use one transformation only and give every piece of information it needs.',
    'Check a translation by moving one vertex and making sure it lands on the matching vertex of the image.',
  ],
  realLife: 'Animators and game designers translate and rotate characters on a coordinate grid every frame, and designers of logos, hubcaps and tiles use rotational symmetry to make patterns that look balanced.',
  specRef: 'Edexcel 1MA1 G1, G7, G8, G24',
};

/* ------------------------------------------------------------------ */
C['y9-enlargement'] = {
  overview: `<p>An <b>enlargement</b> changes the size of a shape but keeps its shape: every length is multiplied by the same <b>scale factor</b> and all the angles stay the same. Shapes related like this are called <b>similar</b>. A scale factor bigger than 1 makes a shape bigger; a fractional scale factor between 0 and 1 makes it smaller.</p>`,
  objectives: [
    'I can recognise when two shapes are similar.',
    'I can find a scale factor from a pair of corresponding sides.',
    'I can enlarge lengths by a whole-number or fractional scale factor.',
    'I can enlarge a shape from a centre of enlargement on a coordinate grid.',
    'I can find missing sides and angles in a pair of similar shapes.',
  ],
  keyWords: [
    { term: 'Enlargement', def: 'A transformation that changes the size of a shape by multiplying every length by the same number.' },
    { term: 'Scale factor', def: 'The number every length is multiplied by: image length ÷ original length.' },
    { term: 'Similar', def: 'Shapes with equal corresponding angles and corresponding sides in the same ratio.' },
    { term: 'Corresponding', def: 'In the same position in two similar shapes.' },
    { term: 'Centre of enlargement', def: 'The fixed point the enlargement is measured from.' },
    { term: 'Image', def: 'The shape after the enlargement.' },
  ],
  sections: [
    {
      title: 'Recognising similar shapes',
      html: `<p>Divide each side of one shape by the matching side of the other. If every division gives the same answer, the shapes are similar.</p>
${W('Are a 4 cm × 6 cm rectangle and a 10 cm × 15 cm rectangle similar?', ['10 ÷ 4 = 2.5', '15 ÷ 6 = 2.5', 'Both sides are multiplied by 2.5.'], 'Yes, they are similar (scale factor 2.5)')}
${W('Are a 4 cm × 6 cm rectangle and a 7 cm × 9 cm rectangle similar?', ['7 ÷ 4 = 1.75', '9 ÷ 6 = 1.5', 'The multipliers are different.'], 'No — adding 3 cm to each side does not keep the shape the same')}`,
    },
    {
      title: 'Scale factors, including fractions',
      html: `${rule('Scale factor = image length ÷ original length &nbsp;&nbsp; Image length = original length × scale factor')}
${table(['Scale factor', 'Effect'], [['greater than 1', 'the image is bigger'], ['1', 'the image is the same size'], ['between 0 and 1 (e.g. ' + f(1, 2) + ', ' + f(1, 3) + ')', 'the image is smaller']])}
${W('A side of 18 cm becomes 6 cm. Find the scale factor.', ['6 ÷ 18 = ' + f(6, 18) + '.', 'Simplify.'], f(1, 3))}
${W('A rectangle 8 cm by 6 cm is enlarged by scale factor ' + f(3, 2) + '. Find its new size.', ['8 × ' + f(3, 2) + ' = 8 ÷ 2 × 3 = 12 cm', '6 × ' + f(3, 2) + ' = 6 ÷ 2 × 3 = 9 cm'], '12 cm by 9 cm')}`,
    },
    {
      title: 'Enlarging from a centre',
      html: `<p>Measure from the centre of enlargement to each vertex (across and up), multiply these distances by the scale factor, then measure them out again from the centre. Alternatively draw rays from the centre through each vertex and extend them.</p>
${W('Enlarge the point A(4, 3) by scale factor 2 with centre (1, 2).', ['From the centre to A: 3 right, 1 up.', 'Multiply by 2: 6 right, 2 up.', 'From the centre: (1 + 6, 2 + 2).'], '(7, 4)')}
${note('With a scale factor of ' + f(1, 2) + ' the image is half as far from the centre, so it is smaller and closer to the centre.')}`,
    },
    {
      title: 'Missing sides and angles',
      html: `<p>Find the scale factor from a pair of corresponding sides you know in both shapes. Multiply to go from the small shape to the large one; divide to go back.</p>
${W('Two similar triangles: the small one has sides 5 cm and 7 cm; the side matching 5 cm in the large one is 15 cm. Find the side matching 7 cm.', ['Scale factor = 15 ÷ 5 = 3.', '7 × 3 = 21.'], '21 cm')}
${rule('Enlargement does not change angles: corresponding angles in similar shapes are equal.')}`,
    },
  ],
  mistakes: [
    'Adding the same amount to each side instead of multiplying by the scale factor.',
    'Dividing the wrong way round: scale factor is image ÷ original, not original ÷ image.',
    'Changing the angles — angles stay the same in an enlargement.',
    'Measuring from the origin instead of the given centre of enlargement.',
    'Thinking an enlargement always makes a shape bigger; a fractional scale factor makes it smaller.',
  ],
  examTips: [
    'Label corresponding sides clearly — sketch the shapes the same way round if they are rotated.',
    'Check your answer is sensible: the side on the larger shape should be the longer one.',
    'When enlarging on a grid, count squares from the centre to each vertex separately.',
  ],
  realLife: 'Photos are resized without distortion by keeping the same scale factor for width and height, and architects build scale models that are similar to the real building.',
  specRef: 'Edexcel 1MA1 G6, G7, G19, R12',
};

/* ------------------------------------------------------------------ */
const dtSvg = `<svg viewBox="0 0 360 230" width="100%" style="max-width:360px" role="img" aria-label="Distance–time graph: out to 6 km in 30 minutes, stopped for 15 minutes, back home in 15 minutes" font-size="11" font-family="inherit">
<g stroke="currentColor" stroke-opacity="0.2" stroke-width="1">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="${50 + i * 45}" y1="20" x2="${50 + i * 45}" y2="190"/>`).join('')}${[0, 1, 2, 3].map((j) => `<line x1="50" y1="${190 - j * 56}" x2="320" y2="${190 - j * 56}"/>`).join('')}</g>
<line x1="50" y1="190" x2="320" y2="190" stroke="currentColor" stroke-width="1.5"/><line x1="50" y1="190" x2="50" y2="20" stroke="currentColor" stroke-width="1.5"/>
<polyline points="50,190 185,22 252.5,22 320,190" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<g fill="currentColor" text-anchor="middle">${[0, 10, 20, 30, 40, 50, 60].map((t, i) => `<text x="${50 + i * 45}" y="204">${t}</text>`).join('')}<text x="185" y="222">Time (minutes)</text></g>
<g fill="currentColor" text-anchor="end">${[0, 2, 4, 6].map((d, j) => `<text x="44" y="${194 - j * 56}">${d}</text>`).join('')}</g>
<text x="14" y="105" fill="currentColor" text-anchor="middle" transform="rotate(-90 14 105)">Distance (km)</text>
</svg>`;

C['y9-rates-graphs'] = {
  overview: `<p>A <b>rate</b> compares how one quantity changes as another changes — kilometres per hour, litres per minute, pounds per mile. In this unit you read <b>distance–time graphs</b>, where the gradient is the speed, solve <b>flow</b> problems about filling and emptying containers, <b>convert rates</b> between units, and interpret the <b>gradient</b> of a graph as a rate of change with its units.</p>`,
  objectives: [
    'I can find a speed from the gradient of a distance–time graph.',
    'I can interpret flat sections and the return journey on a distance–time graph.',
    'I can solve problems involving flow rates and filling times.',
    'I can convert rates such as m/s to km/h and litres per minute to ml per second.',
    'I can interpret the gradient of a straight-line graph as a rate of change and give its units.',
  ],
  keyWords: [
    { term: 'Rate', def: 'How much one quantity changes for each unit of another, e.g. 5 litres per minute.' },
    { term: 'Gradient', def: 'The steepness of a line: vertical change ÷ horizontal change.' },
    { term: 'Distance–time graph', def: 'A graph of distance from a starting point against time; its gradient is the speed.' },
    { term: 'Stationary', def: 'Not moving — shown by a horizontal line on a distance–time graph.' },
    { term: 'Flow rate', def: 'The volume of liquid passing per unit of time, e.g. litres per minute.' },
    { term: 'Compound unit', def: 'A unit made from two others, such as km/h or ml/s.' },
  ],
  sections: [
    {
      title: 'Distance–time graphs',
      html: `${dtSvg}
<ul><li>A sloping line means moving; the steeper, the faster.</li><li>A horizontal line means stationary.</li><li>A line sloping down towards 0 is the journey back.</li></ul>
${rule('Speed = gradient = distance ÷ time for that section')}
${W('Use the graph above. Find the speed for the first 30 minutes and for the journey home, in km/h.', ['First section: 6 km in 30 minutes = 0.5 hours, so 6 ÷ 0.5 = 12 km/h.', 'Stopped from 30 to 45 minutes.', 'Home: 6 km in 15 minutes = 0.25 hours, so 6 ÷ 0.25 = 24 km/h.'], '12 km/h out, 24 km/h back')}
${note('Check the units on the axes. If time is in minutes but you need km/h, change the minutes into hours first.')}`,
    },
    {
      title: 'Flow rates',
      html: `${rule('Time = volume ÷ rate &nbsp;&nbsp; Volume = rate × time &nbsp;&nbsp; Rate = volume ÷ time<br>1 litre = 1000 ml = 1000 cm³')}
${W('A tank 50 cm × 40 cm × 30 cm fills at 4 litres per minute. How long does it take to fill?', ['Volume = 50 × 40 × 30 = 60 000 cm³.', '60 000 cm³ = 60 litres.', 'Time = 60 ÷ 4 = 15.'], '15 minutes')}
<p>A container with straight vertical sides fills at a steady rate, so its depth–time graph is a straight line. If the container gets narrower, the water level rises faster and the graph gets steeper.</p>`,
    },
    {
      title: 'Converting rates',
      html: `<p>Change one unit at a time and ask whether the number should get bigger or smaller.</p>
${table(['Convert', 'Method', 'Example'], [['m/s → km/h', '× 3600 ÷ 1000 (i.e. × 3.6)', '10 m/s = 36 km/h'], ['km/h → m/s', '× 1000 ÷ 3600', '72 km/h = 20 m/s'], ['litres/min → ml/s', '× 1000 ÷ 60', '3 litres/min = 50 ml/s'], ['£ per hour → p per minute', '× 100 ÷ 60', '£12 per hour = 20p per minute']])}
${W('Convert 15 m/s to km/h.', ['In one hour: 15 × 3600 = 54 000 m.', '54 000 m ÷ 1000 = 54 km.'], '54 km/h')}`,
    },
    {
      title: 'Rates of change and their units',
      html: `<p>The gradient of any straight-line graph tells you a rate: how much the vertical quantity changes for each 1 unit along the horizontal axis. Its unit is "vertical unit per horizontal unit".</p>
${table(['Graph', 'Gradient means', 'Unit'], [['depth against time', 'how fast the water rises', 'cm per minute'], ['taxi fare against miles', 'cost of each mile', '£ per mile'], ['euros against pounds', 'exchange rate', 'euros per pound'], ['height of candle against time', 'how fast it burns down', 'cm per hour']])}
${W('A taxi fare graph passes through (2, 7) and (6, 15), with miles across and £ up. Find the cost per mile.', ['Change in fare: 15 − 7 = 8.', 'Change in distance: 6 − 2 = 4.', 'Gradient = 8 ÷ 4 = 2.'], '£2 per mile')}
${note('A negative gradient means the quantity is decreasing, e.g. a candle getting shorter.')}`,
    },
  ],
  mistakes: [
    'Reading a horizontal line as constant speed rather than standing still.',
    'Using minutes as if they were hours when finding a speed in km/h.',
    'Forgetting to count the return journey when finding the total distance travelled.',
    'Multiplying instead of dividing when converting rates — check whether the answer should be bigger or smaller.',
    'Mixing cm³ and litres in flow problems.',
  ],
  examTips: [
    'Write the units with every rate you give — the units often show what the gradient means.',
    'Pick points where the graph crosses gridlines exactly when working out a gradient.',
    'Use 1 litre = 1000 cm³ to link volumes of prisms to flow rates.',
  ],
  realLife: 'Sat-navs estimate arrival times from speeds, plumbers size pipes from flow rates, and energy bills charge a rate in pence per kilowatt-hour.',
  specRef: 'Edexcel 1MA1 N13, R11, R14, A14',
};

/* ------------------------------------------------------------------ */
const vennSvg = `<svg viewBox="0 0 320 190" width="100%" style="max-width:320px" role="img" aria-label="Venn diagram with 12 in A only, 5 in both, 8 in B only and 5 outside" font-size="15" font-family="inherit">
<rect x="10" y="10" width="300" height="170" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
<circle cx="125" cy="98" r="68" fill="#3b6cf6" fill-opacity="0.08" stroke="#3b6cf6" stroke-width="2"/><circle cx="195" cy="98" r="68" fill="#ec4899" fill-opacity="0.08" stroke="#ec4899" stroke-width="2"/>
<g text-anchor="middle" fill="currentColor"><text x="70" y="34" fill="#3b6cf6" font-weight="bold">A</text><text x="250" y="34" fill="#ec4899" font-weight="bold">B</text><text x="95" y="103">12</text><text x="160" y="103">5</text><text x="225" y="103">8</text><text x="290" y="168">5</text></g>
</svg>`;

C['y9-probability-diagrams'] = {
  overview: `<p>Probability measures how likely something is, on a scale from 0 (impossible) to 1 (certain). In this unit you use the fact that probabilities of all outcomes add up to 1, multiply probabilities of <b>independent events</b>, and read probabilities from <b>Venn diagrams</b>, <b>two-way tables</b> and <b>sample space diagrams</b>.</p>`,
  objectives: [
    'I can use the fact that probabilities of all outcomes add up to 1, including P(not A) = 1 − P(A).',
    'I can work out expected outcomes from a probability.',
    'I can find the probability of two independent events both happening.',
    'I can find probabilities from Venn diagrams and two-way tables.',
    'I can list outcomes of two events in a sample space diagram and use it to find probabilities.',
  ],
  keyWords: [
    { term: 'Probability', def: 'A number from 0 to 1 that measures how likely an event is.' },
    { term: 'Independent events', def: 'Events where one happening does not change the probability of the other.' },
    { term: 'Venn diagram', def: 'Overlapping circles inside a rectangle showing which items belong to which sets.' },
    { term: 'Two-way table', def: 'A table that splits data by two features, with row and column totals.' },
    { term: 'Sample space', def: 'A list or grid of all possible outcomes.' },
    { term: 'Expected outcome', def: 'Probability × number of trials — a long-run average, not a guarantee.' },
    { term: 'Intersection (∩)', def: 'In both sets: "A and B".' },
    { term: 'Union (∪)', def: 'In either set or both: "A or B".' },
  ],
  sections: [
    {
      title: 'Probabilities add up to 1',
      html: `${rule('P(not A) = 1 − P(A) &nbsp;&nbsp; Expected number = probability × number of trials')}
${table(['Colour', 'Red', 'Blue', 'Green'], [['Probability', '0.25', '0.4', '?']])}
${W('Find P(green), then the expected number of greens in 200 spins.', ['0.25 + 0.4 = 0.65.', 'P(green) = 1 − 0.65 = 0.35.', 'Expected = 0.35 × 200 = 70.'], '0.35; about 70 greens')}`,
    },
    {
      title: 'Independent events',
      html: `${rule('If A and B are independent: P(A and B) = P(A) × P(B)')}
${W('A fair dice is rolled and a fair coin is flipped. Find P(6 and heads).', ['P(6) = ' + f(1, 6) + ', P(heads) = ' + f(1, 2) + '.', 'Multiply: ' + f(1, 6) + ' × ' + f(1, 2) + ' = ' + f(1, 12) + '.'], f(1, 12))}
${W('P(rain) = 0.3 and P(bus late) = 0.2, independently. Find P(neither).', ['P(no rain) = 0.7, P(bus not late) = 0.8.', '0.7 × 0.8 = 0.56.'], '0.56')}`,
    },
    {
      title: 'Venn diagrams',
      html: `${vennSvg}
<p>The numbers show how many people are in each region (30 in total).</p>
${table(['Probability', 'Regions', 'Value'], [['P(A)', '12 + 5', f(17, 30)], ['P(A ∩ B)', '5', f(5, 30) + ' = ' + f(1, 6)], ['P(A ∪ B)', '12 + 5 + 8', f(25, 30) + ' = ' + f(5, 6)], ['P(not A)', '8 + 5', f(13, 30)]])}
${note('Fill a Venn diagram from the middle outwards: put the "both" number in the overlap first, then subtract it from each circle total.')}`,
    },
    {
      title: 'Two-way tables',
      html: `${table(['', 'Bus', 'Walk', 'Total'], [['Boys', '14', '11', '25'], ['Girls', '9', '16', '25'], ['Total', '23', '27', '50']])}
${W('A pupil is chosen at random from the table. Find P(girl who walks), and the probability that a chosen boy takes the bus.', ['Girls who walk: 16 out of 50, so ' + f(16, 50) + ' = ' + f(8, 25) + '.', 'Choosing only from the boys: 14 out of 25.'], f(8, 25) + ' and ' + f(14, 25))}
${note('Use the total of the group you are choosing from — the whole table, or just one row or column.')}`,
    },
    {
      title: 'Sample space diagrams',
      html: `<p>For a coin and a dice there are 2 × 6 = 12 equally likely outcomes.</p>
${table(['', '1', '2', '3', '4', '5', '6'], [['H', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'], ['T', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6']])}
${W('Find P(tails and an even number).', ['Outcomes that work: T2, T4, T6 — 3 outcomes.', '3 out of 12.'], f(3, 12) + ' = ' + f(1, 4))}`,
    },
  ],
  mistakes: [
    'Adding probabilities of independent events instead of multiplying them.',
    'Counting the overlap of a Venn diagram twice when finding P(A or B).',
    'Forgetting the number outside the circles when working out the total.',
    'Using the grand total when the question says the person is chosen from one group only.',
    'Writing a probability bigger than 1 or as a ratio such as 3 : 10.',
  ],
  examTips: [
    'Write probabilities as fractions, decimals or percentages — never as "3 in 10" or "3 : 10".',
    'Check that every probability table or Venn diagram adds up to 1 or to the total.',
    'Simplify fractions only if you are confident — an unsimplified correct fraction still scores.',
  ],
  realLife: 'Doctors use two-way tables to compare test results with actual illness, and insurers multiply probabilities of independent events to price policies.',
  specRef: 'Edexcel 1MA1 P2, P3, P4, P6, P8',
};

/* ---------------------------------------------------------------- school-style worked examples */
const SW = 'School-style worked examples';
C['y9-transformations'].sections.push({ title: SW, html: `${W('A regular hexagon is turned about its centre using tracing paper. How many times does it fit onto itself in one full turn?', ['Mark the centre and trace the hexagon.', 'Turn the tracing paper through 360°: it fits every 60°.', '360 ÷ 60 = 6.'], 'order of rotational symmetry 6')}
${W('Shape A is translated by the vector ' + vec('−2', '4') + '. One vertex is at (5, −1). Where is it after the translation?', ['Top number −2: move 2 left, so x = 5 − 2 = 3.', 'Bottom number 4: move 4 up, so y = −1 + 4 = 3.', 'Every other vertex moves by the same amount.'], '(3, 3)')}
${W('A triangle with vertices (2, 1), (4, 1) and (2, 2) is rotated 90° anticlockwise about the point (1, 1), which is outside the shape. Find the image of (4, 1).', ['From the centre: (4, 1) is 3 right, 0 up → (3, 0).', 'A quarter turn anticlockwise sends (3, 0) to (0, 3).', 'Add back to the centre: (1 + 0, 1 + 3).'], '(1, 4)')}
${W('Shape B is a flipped copy of shape A on the other side of the line x = 2. Describe the transformation fully, and say what you would need instead if B were a rotation.', ['Flipped over means a reflection; the mirror line is x = 2.', 'A rotation would need a centre, an angle and a direction.'], 'reflection in the line x = 2')}` });

C['y9-enlargement'].sections.push({ title: SW, html: `${W('A 2 × 3 grid rectangle and a 6 × 9 grid rectangle are drawn. Are they similar?', ['6 ÷ 2 = 3 and 9 ÷ 3 = 3.', 'Every pair of sides is in the same ratio.'], 'yes — an enlargement with scale factor 3')}
${W('A rectangle is 15 cm by 10 cm. It is enlarged by scale factor ' + f(1, 5) + '. Find the new dimensions.', ['15 × ' + f(1, 5) + ' = 15 ÷ 5 = 3 cm.', '10 × ' + f(1, 5) + ' = 10 ÷ 5 = 2 cm.'], '3 cm by 2 cm (smaller, because the scale factor is less than 1)')}
${W('Two similar trapeziums: the small one has a base of 5 cm, a slanted side of 3 cm and an angle of 115°. The large one has a base of 15 cm. Find the matching slanted side and angle.', ['Scale factor = 15 ÷ 5 = 3.', 'Slanted side = 3 × 3 = 9 cm.', 'Angles do not change in an enlargement.'], '9 cm and 115°')}
${W('Enlarge the vertex (5, 4) by scale factor 3 from the centre (3, 3).', ['Scaled distances: from the centre the vertex is 2 right, 1 up.', 'Multiply by 3: 6 right, 3 up.', 'From the centre: (3 + 6, 3 + 3). (A ray from the centre through the vertex passes through this point.)'], '(9, 6)')}` });

C['y9-rates-graphs'].sections.push({ title: SW, html: `${W('A distance–time graph rises from (0 min, 0 m) to (10 min, 600 m), is flat until 25 minutes, then falls back to 0 m at 40 minutes. Describe the journey.', ['First 10 minutes: 600 ÷ 10 = 60 metres per minute.', '10 to 25 minutes: horizontal, so stationary for 15 minutes.', 'Return: 600 m in 15 minutes = 40 metres per minute.'], '60 m/min out, a 15-minute stop, 40 m/min home')}
${W('A cylindrical jug and a cone-shaped glass (point at the bottom) are filled at the same constant rate. Describe each depth–time graph.', ['Cylinder: same width all the way up, so the depth rises steadily — a straight line.', 'Cone: gets wider higher up, so the depth rises more slowly over time — a curve that gets less steep.'], 'straight line; curve that flattens')}
${W('Water flows at 12 litres per minute. Write this in millilitres per second.', ['12 litres = 12 000 ml per minute.', '12 000 ÷ 60 = 200.'], '200 ml per second')}
${W('A conversion graph passes through (0, 0) and (50, 60) with pounds across and euros up. What does the gradient mean?', ['Gradient = 60 ÷ 50 = 1.2.', 'Units: euros per pound.'], '£1 buys €1.20 — the exchange rate')}` });

C['y9-probability-diagrams'].sections.push({ title: SW, html: `${W('A bag has 3 green and 7 yellow beads. Mark P(green) on a probability scale split into 10 equal parts.', ['P(green) = ' + f(3, 10) + '.', 'Each part is ' + f(1, 10) + ', so mark the 3rd division.', 'P(not green) = 1 − ' + f(3, 10) + ' = ' + f(7, 10) + '.'], f(3, 10) + ' — unlikely, nearer 0 than 1')}
${table(['Flavour', 'Mint', 'Orange', 'Lemon'], [['Probability', '0.2', '0.45', '?']])}
${W('Using the table above, find P(lemon) and the expected number of lemons in 300 picks.', ['0.2 + 0.45 = 0.65, so P(lemon) = 1 − 0.65 = 0.35.', 'Expected = 0.35 × 300 = 105.'], '0.35; about 105')}
${W('A fair dice is rolled and a spinner with 3 equal sections (red, blue, white) is spun. Find P(4 and blue).', ['The events are independent.', 'P(4) = ' + f(1, 6) + ', P(blue) = ' + f(1, 3) + '.', f(1, 6) + ' × ' + f(1, 3) + ' = ' + f(1, 18) + '.'], f(1, 18))}` });

const __extraSections = {
  'y9-pythagoras': [{ title: SW, html: `${table(['n', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], [['n²', '1', '4', '9', '16', '25', '36', '49', '64', '81', '100', '121', '144']])}
<p>√ undoes squaring (√81 = 9) and ∛ undoes cubing (∛125 = 5). The hypotenuse is the longest side, opposite the right angle.</p>
${W('Is a triangle with sides 7 cm, 24 cm and 25 cm right-angled?', ['Shorter sides: 7² + 24² = 49 + 576 = 625.', 'Longest side: 25² = 625.', 'They are equal.'], 'yes, it is right-angled')}
${W('The two shorter sides of a right-angled triangle are 4 cm and 7 cm. Find the hypotenuse.', ['4² + 7² = hypotenuse²', '16 + 49 = 65', 'hypotenuse = √65 = 8.06…'], '8.06 cm (2 d.p.)')}
${W('A right-angled triangle has hypotenuse 13 cm and one side 9 cm. Find the other side.', ['9² + b² = 13²', '81 + b² = 169, so b² = 169 − 81 = 88', 'b = √88 = 9.38…'], '9.38 cm (2 d.p.)')}
${W('Find the length of the line segment from (1, 1) to (4, 5) on a grid.', ['Make a right-angled triangle: across 3, up 4.', '3² + 4² = 9 + 16 = 25.', '√25 = 5.'], '5 units (check the axis scale first)')}` }],
  'y9-speed-distance-time': [{ title: SW, html: `<p>"Per" means "for every": 60 mph means 60 miles for every hour.</p>
${table(['Hours', '0', '0.5', '1', '2', '3.5'], [['Miles', '0', '30', '60', '120', '210']])}
${W('A ferry travels at a constant speed and covers 270 miles in 4.5 hours. Find its speed in mph.', ['Bar model: split 4.5 hours into 9 half-hours; each half-hour is 270 ÷ 9 = 30 miles.', 'So each hour is 60 miles.', 'Or: speed = 270 ÷ 4.5 = 60.'], '60 mph')}
${W('A cyclist rides at 18 km/h for 40 minutes. How far does she go?', ['Units must match: 40 minutes = ' + f(40, 60) + ' = ' + f(2, 3) + ' hour.', 'Distance = 18 × ' + f(2, 3) + ' = 12.'], '12 km')}` }],
  'y9-density': [{ title: SW, html: `${rule('Density = ' + f('mass', 'volume') + ' &nbsp;&nbsp; Volume of a prism = area of cross-section × depth')}
${W('A prism has a triangular cross-section of area 15 cm² and is 8 cm deep. It is made of a material with density 2.7 g/cm³. Find its mass.', ['Volume = 15 × 8 = 120 cm³.', 'Mass = density × volume = 2.7 × 120 = 324.'], '324 g')}
${W('A 250 cm³ block has a mass of 2225 g. Find its density.', ['Density = 2225 ÷ 250 = 8.9.'], '8.9 g/cm³')}` }],
  'y9-relative-frequency': [{ title: SW, html: `${table(['Colour', 'Frequency', 'Relative frequency'], [['Purple', '9', '0.36'], ['Orange', '11', '0.44'], ['Grey', '5', '0.2'], ['Total', '25', '1']])}
${W('Using the table, estimate how many purple results there would be in 200 more trials.', ['Relative frequency of purple = 9 ÷ 25 = 0.36.', 'Estimate = 0.36 × 200 = 72.'], 'about 72')}
${W('The probability of picking a toffee is 0.15. A sweet is picked and replaced 600 times. Show that about 90 toffees are expected.', ['Expected = probability × number of trials.', '0.15 × 600 = 90.'], '90 — a long-run estimate, not a prediction')}` }],
  'y9-listing-outcomes': [{ title: SW, html: `<p>A spinner numbered 1 to 4 and a coin give 4 × 2 = 8 outcomes:</p>
${table(['', '1', '2', '3', '4'], [['H', '1H', '2H', '3H', '4H'], ['T', '1T', '2T', '3T', '4T']])}
${W('Using the sample space above, find P(an odd number and tails).', ['Outcomes that work: 1T, 3T.', '2 out of 8 equally likely outcomes.'], f(2, 8) + ' = ' + f(1, 4))}` }],
};

module.exports = { ...C, __extraSections };
