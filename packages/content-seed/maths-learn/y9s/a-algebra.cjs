'use strict';
// Year 9 school-unit learn pages: formulae, conjectures & proof, non-linear graphs & inequalities.
const f = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
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
C['y9-formulae'] = {
  overview: `<p>A <b>formula</b> is a rule that links quantities, such as the area of a rectangle, A = <i>lw</i>. In this unit you <b>substitute</b> values (including negative numbers) into formulae, learn to tell formulae apart from expressions, equations and identities, and <b>rearrange</b> formulae to change the subject. Rearranging is also how you read the gradient of a line whose equation is not yet in the form <i>y</i> = <i>mx</i> + <i>c</i>.</p>`,
  objectives: [
    'I can substitute positive and negative values into a formula, using the order of operations.',
    'I can explain the difference between an expression, an equation, a formula and an identity.',
    'I can rearrange a formula in one step using inverse operations.',
    'I can rearrange a formula that needs two or more steps.',
    'I can rearrange the equation of a line into the form y = mx + c to find its gradient and y-intercept.',
  ],
  keyWords: [
    { term: 'Formula', def: 'A rule connecting two or more quantities, written with a subject, e.g. v = u + at.' },
    { term: 'Subject', def: 'The single letter on its own on one side of a formula.' },
    { term: 'Substitute', def: 'Replace a letter with a number.' },
    { term: 'Expression', def: 'A collection of terms with no equals sign, e.g. 3x + 2y.' },
    { term: 'Equation', def: 'A statement with an equals sign that is true for particular values and can be solved.' },
    { term: 'Identity', def: 'A statement that is true for every value of the letter, written with ≡.' },
    { term: 'Inverse operation', def: 'The operation that undoes another: + and − are inverses, as are × and ÷.' },
    { term: 'Rearrange', def: 'Change the order of a formula so that a different letter becomes the subject.' },
  ],
  sections: [
    {
      title: 'Substituting into formulae',
      html: `<p>Write the formula, replace each letter with its value and work it out using the order of operations. Put negative numbers in <b>brackets</b> so signs and powers are handled correctly.</p>
${W('Use v = u + at to find v when u = 12, a = −3 and t = 5.', ['v = 12 + (−3) × 5', 'Multiply first: (−3) × 5 = −15', 'v = 12 − 15'], 'v = −3')}
${W('Find T = 2p² − q when p = −4 and q = −6.', ['T = 2 × (−4)² − (−6)', '(−4)² = 16, so 2 × 16 = 32', '32 − (−6) = 32 + 6'], 'T = 38')}
${note('(−4)² = 16 but −4² is read as −(4²) = −16. Brackets make the difference.')}`,
    },
    {
      title: 'Expressions, equations, formulae and identities',
      html: `${table(['Type', 'Example', 'How to spot it'], [['Expression', '5a − 2b', 'No equals sign'], ['Equation', '4x + 1 = 13', 'True only for certain values; you can solve it'], ['Formula', 'P = 2l + 2w', 'Links quantities; has a subject'], ['Identity', '3(x + 2) ≡ 3x + 6', 'True for every value; uses ≡']])}
<p>If you substitute values into a formula you get an equation, which you can then solve.</p>`,
    },
    {
      title: 'Rearranging in one step',
      html: `<p>To make a different letter the subject, undo what has happened to it, doing the <b>same to both sides</b>.</p>
${rule('+ is undone by − &nbsp;&nbsp; × is undone by ÷')}
${W('Make w the subject of A = lw.', ['w is multiplied by l.', 'Divide both sides by l.'], 'w = ' + f('A', 'l'))}
${W('Make x the subject of y = x − 7.', ['7 is subtracted from x.', 'Add 7 to both sides.'], 'x = y + 7')}`,
    },
    {
      title: 'Rearranging in two steps',
      html: `<p>The steps are the same as solving an equation. Undo addition or subtraction first, then multiplication or division.</p>
${table(['Solving', 'Rearranging'], [['3x + 5 = 20', 'y = 3x + 5'], ['3x = 15 (subtract 5)', 'y − 5 = 3x (subtract 5)'], ['x = 5 (divide by 3)', 'x = ' + f('y − 5', '3') + ' (divide by 3)']])}
${W('Make t the subject of v = u + at.', ['Subtract u: v − u = at', 'Divide by a.'], 't = ' + f('v − u', 'a'))}
${note('You can check a rearrangement by substituting numbers into the original and the new version.')}`,
    },
    {
      title: 'Rearranging to find a gradient',
      html: `${rule('In y = mx + c, m is the gradient and c is the y-intercept')}
${W('Find the gradient and y-intercept of 2y − 6x = 9.', ['Add 6x to both sides: 2y = 6x + 9', 'Divide every term by 2: y = 3x + 4.5'], 'gradient 3, y-intercept 4.5')}
${W('Find the gradient of 4x + 3y = 12.', ['Subtract 4x: 3y = −4x + 12', 'Divide by 3: y = −' + f(4, 3) + 'x + 4'], 'gradient −' + f(4, 3))}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('Make a the subject of p = a − q.', ['Think of it as a function machine: a → −q → p.', 'Undo it: p → +q → a.'], 'a = p + q')}
${W('Solve 5x + 2 = 17, then make x the subject of 5x + k = m.', ['Subtract 2: 5x = 15, then divide by 5: x = 3.', 'Same steps with letters: subtract k: 5x = m − k.', 'Divide by 5.'], 'x = 3; x = ' + f('m − k', '5'))}
${W('Make x the subject of xt + r = b.', ['Subtract r: xt = b − r', 'Divide by t.'], 'x = ' + f('b − r', 't'))}
${W('Find the gradient of the line 3y − 6x = 12.', ['Make y the subject: 3y = 6x + 12', 'Divide by 3: y = 2x + 4'], 'gradient 2')}`,
    },
  ],
  mistakes: [
    'Writing −4² instead of (−4)² when substituting a negative value.',
    'Doing the operations in the wrong order, e.g. adding before multiplying.',
    'Dividing only one term by a number instead of the whole side when rearranging.',
    'Reading the gradient straight off 2y = 6x + 1 as 6 instead of dividing by 2 first.',
  ],
  examTips: [
    'Always write the substitution step with brackets before you calculate — method marks are available.',
    'When rearranging, write each step on a new line and state the operation you are doing to both sides.',
    'Check a rearranged formula by trying a simple number in both versions.',
  ],
  realLife: 'Spreadsheets, physics and engineering rely on formulae: an engineer may know the speed and acceleration and rearrange v = u + at to work out how long a vehicle needs to stop.',
  specRef: 'Edexcel 1MA1 A2, A3, A5, A9',
};

/* ------------------------------------------------------------------ */
C['y9-conjectures'] = {
  overview: `<p>A <b>conjecture</b> is a statement that looks true from a few examples. Mathematicians test conjectures: one <b>counterexample</b> proves a conjecture false, but to show it is always true you need an <b>algebraic argument</b> (a proof). In this unit you decide whether statements are always, sometimes or never true, write odd and even numbers as 2<i>n</i> + 1 and 2<i>n</i>, and generalise patterns on a number grid.</p>`,
  objectives: [
    'I can decide whether a statement is always, sometimes or never true, giving examples.',
    'I can find a counterexample to disprove a conjecture.',
    'I can use 2n for even numbers, 2n + 1 for odd numbers and n, n + 1, n + 2 for consecutive numbers.',
    'I can tell the difference between numerical verification and an algebraic proof.',
    'I can use expressions such as n + 1, n + 10 and n − 9 to generalise positions on a 100 square.',
    'I can use HCF and LCM facts when reasoning about numbers.',
  ],
  keyWords: [
    { term: 'Conjecture', def: 'A statement that seems true but has not yet been proved.' },
    { term: 'Counterexample', def: 'A single example that shows a statement is false.' },
    { term: 'Verify', def: 'Check that something is correct, e.g. by substituting numbers.' },
    { term: 'Proof', def: 'A logical argument, often using algebra, that shows a statement is true in every case.' },
    { term: 'Identity', def: 'A statement true for all values of its letters, written with ≡.' },
    { term: 'Consecutive', def: 'Following on one after another, e.g. 7, 8, 9.' },
    { term: 'HCF / LCM', def: 'Highest common factor; lowest common multiple.' },
  ],
  sections: [
    {
      title: 'Always, sometimes or never true?',
      html: `<p>Test lots of different kinds of number: odd and even, 0 and 1, negative numbers and fractions.</p>
${table(['Verdict', 'Meaning'], [['Always true', 'It works for every possible value (and you can explain why)'], ['Sometimes true', 'It works for some values but not others'], ['Never true', 'It cannot work for any value']])}
${W('"Doubling a number makes it bigger." Always, sometimes or never?', ['Double 5 = 10, bigger. ✓', 'Double −5 = −10, smaller. ✗', 'Double 0 = 0, the same. ✗'], 'Sometimes true')}`,
    },
    {
      title: 'Counterexamples',
      html: `${rule('One counterexample is enough to prove a conjecture false')}
${W('Disprove: "3n + 1 is prime for every whole number n."', ['n = 1: 4 — already not prime!', 'So n = 1 is a counterexample.'], 'n = 1 gives 4 = 2 × 2, not prime')}
${W('Disprove: "A multiple of 4 and 6 must be a multiple of 24."', ['The LCM of 4 and 6 is 12.', '12 is a multiple of both, but not of 24.'], '12 is a counterexample')}
${note('Lots of examples that work do not prove a statement — there might be a counterexample you have not tried.')}`,
    },
    {
      title: 'Odd, even and consecutive numbers in algebra',
      html: `${table(['Number', 'Algebra'], [['Any even number', '2n'], ['Any odd number', '2n + 1'], ['Consecutive whole numbers', 'n, n + 1, n + 2'], ['Consecutive even numbers', '2n, 2n + 2, 2n + 4'], ['Consecutive odd numbers', '2n + 1, 2n + 3, 2n + 5']])}
${W('Prove that the sum of three consecutive whole numbers is a multiple of 3.', ['n + (n + 1) + (n + 2) = 3n + 3', 'Factorise: 3(n + 1)'], '3 × (a whole number), so always a multiple of 3')}
${W('Prove that the sum of two odd numbers is even.', ['(2a + 1) + (2b + 1) = 2a + 2b + 2', '= 2(a + b + 1)'], 'a multiple of 2, so always even')}`,
    },
    {
      title: 'Numerical verification and identities',
      html: `<p><b>Numerical verification</b> checks particular values; <b>algebraic verification</b> works for every value. To test whether something is an identity, expand and simplify one side.</p>
${W('Is (x + 3)² ≡ x² + 9?', ['Try x = 1: left side 16, right side 10 — different.', 'Expand properly: (x + 3)(x + 3) = x² + 3x + 3x + 9 = x² + 6x + 9.'], 'No: (x + 3)² ≡ x² + 6x + 9')}`,
    },
    {
      title: 'Generalising on a 100 square',
      html: `<p>If one number on a 100 square is <i>n</i>, its neighbours can be written in terms of <i>n</i>.</p>
${table(['', '', ''], [['n − 11', 'n − 10', 'n − 9'], ['n − 1', '<b>n</b>', 'n + 1'], ['n + 9', 'n + 10', 'n + 11']])}
${W('Show that for any 2 × 2 square on a 100 square, top-right × bottom-left − top-left × bottom-right is always 10.', ['Corners: n, n + 1, n + 10, n + 11', '(n + 1)(n + 10) = n² + 11n + 10', 'n(n + 11) = n² + 11n', 'Subtract.'], '10, whatever n is')}
${note('On a grid with w numbers in each row, the number below n is n + w instead of n + 10.')}`,
    },
    {
      title: 'Factors, multiples and primes',
      html: `${W('Find the HCF of 24 and 40.', ['Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24', 'Factors of 40: 1, 2, 4, 5, 8, 10, 20, 40', 'Common factors: 1, 2, 4, 8'], 'HCF = 8')}
${W('Find the LCM of 6 and 8.', ['Multiples of 6: 6, 12, 18, 24, 30', 'Multiples of 8: 8, 16, 24, 32'], 'LCM = 24')}
${W('Write 60 as a product of prime factors.', ['Factor tree: 60 = 6 × 10', '6 = 2 × 3 and 10 = 2 × 5'], '60 = 2² × 3 × 5')}
${note('HCF × LCM = the product of the two numbers: for 6 and 8, 2 × 24 = 48 = 6 × 8.')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('A sequence starts 3, 6, 12 … Sam says “it doubles each time”. The next terms are 21 and 33. Is Sam right?', ['12 × 2 = 24, but the next term is 21.', 'The differences are 3, 6, 9, 12 — the sequence adds 3 more each time.'], 'No — 21 is a counterexample')}
${W('Always, sometimes or never: “a number multiplied by itself is bigger than the number”?', ['Try 5: 25 &gt; 5 ✓', 'Try 1: 1 = 1 ✗; try 0.5: 0.25 ✗'], 'Sometimes true')}
${W('Show that the sum of two consecutive odd numbers is a multiple of 4.', ['Call them 2n + 1 and 2n + 3.', 'Sum = 4n + 4 = 4(n + 1).'], '4 × a whole number, so always a multiple of 4')}
${W('On a 100 square, the number n is circled. Write expressions for the numbers immediately left of it and directly below it.', ['Left: one less → n − 1', 'Below: one row of 10 more → n + 10'], 'n − 1 and n + 10')}`,
    },
  ],
  mistakes: [
    'Thinking a few examples that work prove a statement is always true.',
    'Using n and n + 1 for two odd numbers — they are consecutive whole numbers, not both odd.',
    'Using the same letter for two different odd numbers, which only proves it for equal numbers.',
    'Forgetting to test 0, 1, negative numbers and fractions when deciding "always" or "sometimes".',
  ],
  examTips: [
    'For "show that" questions, end with a sentence linking your algebra to the statement, e.g. "3(n + 1) is a multiple of 3".',
    'To disprove a statement, write the counterexample and show the calculation that fails.',
    'Factorising the final expression is usually what shows it is a multiple of something.',
  ],
  realLife: 'Proof is what makes mathematics certain: computer security, such as the encryption that protects online banking, depends on proved facts about prime numbers rather than on examples that just happen to work.',
  specRef: 'Edexcel 1MA1 N4, A3, A4, A6',
};

/* ------------------------------------------------------------------ */
const parabola = `<svg viewBox="0 0 220 180" width="100%" style="max-width:240px" role="img" aria-label="A U-shaped parabola crossing the x-axis at two roots with its turning point below the axis">
<line x1="10" y1="60" x2="210" y2="60" stroke="currentColor" stroke-width="1.5"/><line x1="70" y1="10" x2="70" y2="170" stroke="currentColor" stroke-width="1.5"/>
<path d="M40 20 Q110 200 180 20" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<circle cx="56" cy="60" r="3.5" fill="#3b6cf6"/><circle cx="164" cy="60" r="3.5" fill="#3b6cf6"/><circle cx="110" cy="110" r="3.5" fill="#3b6cf6"/>
<g font-size="12" fill="currentColor"><text x="40" y="76">root</text><text x="160" y="76">root</text><text x="88" y="132">turning point</text></g>
<line x1="110" y1="20" x2="110" y2="170" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4"/>
</svg>`;
C['y9-nonlinear-graphs'] = {
  overview: `<p>Not every graph is a straight line. In this unit you draw <b>quadratic</b> graphs from a table of values, read their <b>roots</b>, <b>y-intercept</b> and <b>turning point</b>, and learn to recognise cubic, reciprocal and exponential graphs from their equations. You also represent <b>inequalities</b> on a number line and as shaded regions on a graph.</p>`,
  objectives: [
    'I can complete a table of values for a quadratic, including negative x-values.',
    'I can read the roots, y-intercept, turning point and line of symmetry of a quadratic graph.',
    'I can recognise linear, quadratic, cubic, reciprocal and exponential graphs from their equations or shapes.',
    'I can show an inequality on a number line using open and filled circles.',
    'I can describe a region on a graph using an inequality such as x < 4 or y ≥ 2x + 1.',
  ],
  keyWords: [
    { term: 'Quadratic', def: 'An expression or graph whose highest power of x is 2, e.g. y = x² + 4x + 3.' },
    { term: 'Parabola', def: 'The U-shaped (or ∩-shaped) curve of a quadratic graph, with a line of symmetry.' },
    { term: 'Roots', def: 'The x-values where a graph crosses the x-axis (where y = 0).' },
    { term: 'Turning point', def: 'The lowest or highest point of a parabola, where it changes direction.' },
    { term: 'Cubic', def: 'A graph whose highest power of x is 3; it has an S-shape.' },
    { term: 'Reciprocal', def: 'A graph of the form y = k/x; it never touches the axes.' },
    { term: 'Asymptote', def: 'A line that a graph gets closer and closer to but never meets.' },
    { term: 'Inequality', def: 'A statement comparing values using <, >, ≤ or ≥.' },
  ],
  sections: [
    {
      title: 'Tables of values for quadratics',
      html: `<p>Substitute each x-value into the equation. Use brackets for negatives: (−3)² = 9.</p>
${W('Complete the table for y = x² + 2x − 3 when x = −3.', ['y = (−3)² + 2 × (−3) − 3', '= 9 − 6 − 3'], 'y = 0')}
${table(['x', '−3', '−2', '−1', '0', '1'], [['y', '0', '−3', '−4', '−3', '0']])}
<p>Plot the points and join them with a <b>smooth curve</b>, not straight lines.</p>`,
    },
    {
      title: 'Reading key features of a parabola',
      html: `${parabola}
${rule('Roots: where y = 0 &nbsp;&nbsp; y-intercept: where x = 0 &nbsp;&nbsp; Turning point: on the line of symmetry, halfway between the roots')}
${W('From the table above, find the roots and turning point of y = x² + 2x − 3.', ['y = 0 at x = −3 and x = 1, so these are the roots.', 'Halfway between: (−3 + 1) ÷ 2 = −1.', 'When x = −1, y = −4.'], 'roots −3 and 1; turning point (−1, −4)')}`,
    },
    {
      title: 'Recognising other graphs',
      html: `${table(['Type', 'Example equation', 'Shape'], [['Linear', 'y = 2x − 1', 'Straight line'], ['Quadratic', 'y = x² − 4', 'Parabola (U or ∩)'], ['Cubic', 'y = x³ − 3x', 'S-shaped curve'], ['Reciprocal', 'y = ' + f(1, 'x'), 'Two separate curves; never touches the axes'], ['Exponential', 'y = 2<sup>x</sup>', 'Grows faster and faster; never touches the x-axis']])}
${note('Look at where x appears: as the highest power 1, 2 or 3, in the denominator, or as the power itself.')}`,
    },
    {
      title: 'Inequalities on a number line',
      html: `${rule('Open circle ○ : &lt; or &gt; (not included) &nbsp;&nbsp; Filled circle ● : ≤ or ≥ (included)')}
${W('Show −2 &lt; x ≤ 3 on a number line and list the integers.', ['Open circle at −2, filled circle at 3, joined by a line.', 'Integers: −1, 0, 1, 2, 3 (not −2, but 3 is included).'], '−1, 0, 1, 2, 3')}`,
    },
    {
      title: 'Regions on a graph',
      html: `<p>Draw the boundary line first. Use a <b>solid</b> line for ≤ or ≥ and a <b>dashed</b> line for &lt; or &gt;. Then test a point not on the line, such as (0, 0), to decide which side to shade.</p>
${W('Describe the region for y ≥ 2x + 1.', ['Boundary y = 2x + 1, drawn solid (≥).', 'Test (0, 0): 0 ≥ 1 is false, so (0, 0) is not in the region.'], 'shade the side above the line, not containing (0, 0)')}
${note('x &lt; 4 is the region to the left of the vertical dashed line x = 4.')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('Complete a table of values for y = x² − 2x − 3 for x = −2 to 4 and give the coordinates to plot.', ['x = −2: 4 + 4 − 3 = 5; x = −1: 1 + 2 − 3 = 0; x = 0: −3', 'x = 1: −4; x = 2: −3; x = 3: 0; x = 4: 5', 'Pairs: (−2, 5), (−1, 0), (0, −3), (1, −4), (2, −3), (3, 0), (4, 5)'], 'roots −1 and 3, y-intercept −3, turning point (1, −4)')}
${W('Which type of graph is y = 3/x? Can x = 0?', ['x is in the denominator, so it is a reciprocal graph.', 'Dividing by 0 is impossible, so the graph never touches the y-axis.'], 'reciprocal; no, x = 0 is an asymptote')}
${W('Find y on y = 3ˣ when x = −1, 0 and 2.', ['3⁻¹ = ' + f(1, 3), '3⁰ = 1', '3² = 9'], f(1, 3) + ', 1 and 9')}
${W('Describe how to show y &lt; x + 2 and x ≥ −1 on a graph.', ['Draw y = x + 2 dashed (strict &lt;) and shade below it — test (0, 0): 0 &lt; 2 ✓.', 'Draw x = −1 solid (≥) and keep the side to its right.'], 'the overlapping region below the dashed line and right of the solid line')}`,
    },
  ],
  mistakes: [
    'Squaring a negative incorrectly, e.g. writing (−3)² = −9.',
    'Joining plotted points of a quadratic with straight-line segments instead of a smooth curve.',
    'Confusing the roots (where y = 0) with the y-intercept (where x = 0).',
    'Using a filled circle or solid line for a strict inequality (< or >).',
  ],
  examTips: [
    'Quadratic tables are symmetrical about the turning point — use this to check your values.',
    'When reading roots from a graph, give values to the accuracy of the grid (e.g. to 1 decimal place).',
    'Learn the five basic graph shapes so you can match a sketch to its equation quickly.',
  ],
  realLife: 'The path of a thrown ball is a parabola, exponential graphs model population growth and savings interest, and shaded regions are used in business to show combinations of products that meet several limits at once.',
  specRef: 'Edexcel 1MA1 A11, A12, A22',
};

// Extra sections appended to existing Year 9 pages (mirroring the school knowledge organisers).
C.__extraSections = {
  'y9-straight-line-graphs': [
    {
      title: 'Lines parallel to the axes and real-life graphs',
      html: `${rule('x = a is a vertical line (parallel to the y-axis) &nbsp;&nbsp; y = b is a horizontal line (parallel to the x-axis)')}
<p>Every point on x = −4 has x-coordinate −4, e.g. (−4, 0), (−4, 3), (−4, −7). The lines x = a and y = b cross at (a, b).</p>
${table(['Feature of y = mx + c', 'Meaning in a real-life graph'], [['y-intercept c', 'The fixed or starting amount (e.g. a call-out charge)'], ['Gradient m', 'The rate (e.g. cost per hour)'], ['Line through (0, 0)', 'Direct proportion: zero items cost £0']])}
${note('Steeper means a bigger gradient (ignoring the sign). Parallel lines have equal gradients; lines with the same c cross the y-axis at the same point (0, c).')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('Complete the table for y = 2x + 3 with x = −2, 0, 2.', ['x = −2: 2 × (−2) + 3 = −1', 'x = 0: 3', 'x = 2: 7'], 'coordinates (−2, −1), (0, 3), (2, 7)')}
${W('An electrician charges a £30 call-out fee plus £15 per hour. Complete the costs for 0, 1, 2 and 6 hours and say what the intercept and gradient mean.', ['0 h: £30; 1 h: £45; 2 h: £60', '6 h: 30 + 15 × 6 = £120', 'Intercept 30 = call-out fee; gradient 15 = cost per hour'], 'C = 15h + 30')}
${W('A box of pencils costs £1.80. Find the cost of 0, 1, 2 and 5 boxes.', ['0 boxes cost £0, so the graph starts at the origin.', '1: £1.80; 2: £3.60; 5: £9.00'], 'direct proportion, gradient £1.80 per box')}
${W('A line crosses the y-axis at (0, −2) and rises 6 squares for every 2 across. Find its equation.', ['c = −2', 'Gradient = 6 ÷ 2 = 3'], 'y = 3x − 2')}`,
    },
  ],
  'y9-equations-both-sides': [
    {
      title: 'School-style worked examples',
      html: `${W('Solve 4(3x − 2) = 40.', ['Expand: 12x − 8 = 40 (a bar model shows four equal parts of 3x − 2).', 'Add 8: 12x = 48', 'Divide by 12.'], 'x = 4')}
${W('Solve 6x + 3 = 2x + 23.', ['Subtract 2x from both sides: 4x + 3 = 23', 'Subtract 3: 4x = 20', 'Divide by 4.'], 'x = 5')}
${W('Check your answer to 6x + 3 = 2x + 23.', ['Left: 6 × 5 + 3 = 33', 'Right: 2 × 5 + 23 = 33'], 'both sides equal, so x = 5 is correct')}`,
    },
  ],
  'y9-inequalities': [
    {
      title: 'School-style worked examples',
      html: `${W('“Three more than double my number is less than 15.” Find the possible numbers.', ['Form: 2x + 3 &lt; 15', 'Subtract 3: 2x &lt; 12', 'Divide by 2.'], 'x &lt; 6')}
${W('Solve 4 − 2x &gt; 10 (method 1: keep x positive).', ['Add 2x: 4 &gt; 10 + 2x', 'Subtract 10: −6 &gt; 2x', 'Divide by 2: −3 &gt; x'], 'x &lt; −3')}
${W('Solve 4 − 2x &gt; 10 (method 2: divide by a negative).', ['Subtract 4: −2x &gt; 6', 'Divide by −2 and reverse the sign.'], 'x &lt; −3 — the same answer')}
${W('Solve 4(x + 3) &gt; 2(x + 9) and check.', ['Expand: 4x + 12 &gt; 2x + 18', 'Subtract 2x: 2x + 12 &gt; 18; subtract 12: 2x &gt; 6', 'Divide by 2: x &gt; 3. Check x = 4: 28 &gt; 26 ✓'], 'x &gt; 3')}`,
    },
  ],
  'y9-expanding-double': [
    {
      title: 'School-style worked examples',
      html: `${W('Expand 3(x + 4) using algebra tiles.', ['Three rows, each made of one x tile and four unit tiles.', 'Total: three x tiles and twelve unit tiles.'], '3(x + 4) ≡ 3x + 12')}
${W('Expand (x + 4)(x + 4).', ['Grid: x × x = x², x × 4 = 4x, 4 × x = 4x, 4 × 4 = 16', 'Four terms: x² + 4x + 4x + 16', 'Collect like terms.'], 'x² + 8x + 16')}
${W('Expand (x + 2)(5 + x). Does the order matter?', ['x × 5 = 5x, x × x = x², 2 × 5 = 10, 2 × x = 2x', 'Collect: x² + 7x + 10'], 'x² + 7x + 10 — the same as (x + 2)(x + 5)')}`,
    },
  ],
};

module.exports = C;
