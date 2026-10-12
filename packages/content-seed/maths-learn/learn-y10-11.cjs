'use strict';
// Year 10 and Year 11 (GCSE, Edexcel 1MA1) teaching content for the learn pages.
// Small helpers keep the HTML tidy; output uses only the allowed tags/classes.
const f = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const sq = (n) => `<span class="sqrt">${n}</span>`;
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
C['y10-compound-interest'] = {
  overview: `<p>When interest is added to a savings account each year, next year's interest is worked out on the <b>new, bigger</b> amount — this is <b>compound interest</b>. Depreciation works the same way in reverse: a car loses a percentage of its <b>current</b> value every year. One multiplier, raised to a power, handles both.</p>`,
  objectives: [
    'I can explain the difference between simple and compound interest.',
    'I can find a percentage multiplier for an increase or a decrease.',
    'I can use the formula: amount = original × multiplier<sup>n</sup>.',
    'I can calculate depreciation over several years.',
    'I can find how many years it takes for an amount to pass a target.',
  ],
  keyWords: [
    { term: 'Principal', def: 'The amount of money first invested or borrowed.' },
    { term: 'Simple interest', def: 'Interest worked out on the original amount only, so it is the same every year.' },
    { term: 'Compound interest', def: 'Interest worked out on the current amount, including interest already added.' },
    { term: 'Depreciation', def: 'A fall in value over time, usually a fixed percentage each year.' },
    { term: 'Multiplier', def: 'The decimal you multiply by to apply a percentage change, e.g. 1.05 for a 5% increase.' },
    { term: 'Per annum (p.a.)', def: 'Per year.' },
  ],
  sections: [
    {
      title: 'Simple interest versus compound interest',
      html: `<p>With <b>simple interest</b> you earn the same amount every year, because it is always calculated on the original principal. With <b>compound interest</b> the interest earns interest of its own, so the yearly amount grows.</p>
${W('£1000 is invested for 3 years at 5% per annum. Compare simple and compound interest.', ['Simple: 5% of £1000 = £50 each year. 3 × £50 = £150, so the total is £1150.', 'Compound, year 1: £1000 × 1.05 = £1050.', 'Year 2: £1050 × 1.05 = £1102.50.', 'Year 3: £1102.50 × 1.05 = £1157.625 = £1157.63 (nearest penny).'], 'Simple: £1150; compound: £1157.63')}
${note('Banks normally use compound interest. If a question just says "interest", read carefully to see which type is meant.')}`,
    },
    {
      title: 'Multipliers',
      html: `<p>A percentage change can be done in one step with a multiplier. Start from 100%, then add or subtract the percentage, and divide by 100.</p>
${table(['Change', 'Working', 'Multiplier'], [['Increase by 5%', '100% + 5% = 105%', '1.05'], ['Increase by 3.2%', '100% + 3.2% = 103.2%', '1.032'], ['Decrease by 15%', '100% − 15% = 85%', '0.85'], ['Decrease by 2.5%', '100% − 2.5% = 97.5%', '0.975']])}
${note('A multiplier bigger than 1 means an increase; a multiplier less than 1 means a decrease.')}
${W('A house is worth £200 000. Its value falls by 30%. Use a multiplier to find its new value.', ['100% − 30% = 70%, so the multiplier is 0.7.', '200 000 × 0.7 = 140 000.'], '£140 000')}`,
    },
    {
      title: 'The compound interest formula',
      html: `${rule('Final amount = P × (multiplier)<sup>n</sup> &nbsp;&nbsp; or &nbsp;&nbsp; A = P(1 + ' + f('r', 100) + ')<sup>n</sup><br>P = principal, r = % rate per year, n = number of years')}
${W('Ali invests £2500 at 3.2% compound interest per annum. How much is in the account after 4 years?', ['Multiplier: 100% + 3.2% = 103.2% → 1.032.', 'Amount = 2500 × 1.032<sup>4</sup>.', 'Calculator: 2500 × 1.032<sup>4</sup> = 2835.690…', 'Round money to the nearest penny.'], '£2835.69')}
${note('If the question asks for the <b>interest</b> earned, subtract the principal at the end: £2835.69 − £2500 = £335.69.')}`,
    },
    {
      title: 'Depreciation',
      html: `<p>Depreciation is compound decrease. Use a multiplier less than 1 and the same formula.</p>
${W('A new car costs £18 000. It depreciates by 15% each year. Work out its value after 3 years.', ['Multiplier: 100% − 15% = 85% → 0.85.', 'Value = 18 000 × 0.85<sup>3</sup>.', '0.85<sup>3</sup> = 0.614125, and 18 000 × 0.614125 = 11 054.25.'], '£11 054.25')}
${note('Do not subtract 3 × 15% = 45% in one go. Each year the 15% is taken from a smaller value, so the total drop is less than 45%.')}`,
    },
    {
      title: 'Harder problems: finding the number of years or the rate',
      html: `<p>To find how many years it takes to reach a target, multiply repeatedly (or try values of n) until you pass it. To find an unknown rate, work backwards to the multiplier.</p>
${W('£4000 is invested at 2.5% compound interest per year. After how many whole years will it first be worth more than £5000?', ['Multiplier: 1.025. Try values of n in 4000 × 1.025<sup>n</sup>.', 'n = 9: 4000 × 1.025<sup>9</sup> = £4995.45 (not enough).', 'n = 10: 4000 × 1.025<sup>10</sup> = £5120.34 (more than £5000).'], '10 years')}
${W('A machine was worth £12 000. Three years later it is worth £8748. It lost the same percentage each year. Find the percentage.', ['12 000 × m<sup>3</sup> = 8748, so m<sup>3</sup> = 8748 ÷ 12 000 = 0.729.', 'm = cube root of 0.729 = 0.9.', 'A multiplier of 0.9 is 90%, so 10% is lost each year.'], '10% per year')}`,
    },
  ],
  mistakes: [
    'Using simple interest when the question says compound (multiplying 5% by the number of years).',
    'Writing the multiplier for a 3% increase as 1.3 instead of 1.03.',
    'Giving the final amount when the question asks for the interest only (or the other way round).',
    'Rounding in the middle of a calculation instead of only at the end.',
  ],
  examTips: [
    'The compound interest formula A = P(1 + r/100)<sup>n</sup> is printed on the current Edexcel formulae sheet, but using a multiplier is quicker — know both.',
    'Show the multiplier and the full calculation (e.g. 2500 × 1.032<sup>4</sup>) so you earn method marks even if you mistype the calculator.',
    'Money answers should be given to the nearest penny (2 decimal places) unless told otherwise.',
  ],
  realLife: 'Savings accounts, loans, credit cards and mortgages all use compound interest, while cars, phones and machinery lose value through depreciation.',
  specRef: 'Edexcel 1MA1 R16, N12: compound interest and depreciation using multipliers',
};

/* ------------------------------------------------------------------ */
C['y10-reverse-percentages'] = {
  overview: `<p>Sometimes you know the price <b>after</b> a percentage change and need to find the <b>original</b> value — for example, the price before a sale or before VAT was added. The trick is to remember that the new value is a known percentage of the original, then divide.</p>`,
  objectives: [
    'I can recognise when a question needs a reverse percentage.',
    'I can find an original amount using the unitary method.',
    'I can find an original amount by dividing by the multiplier.',
    'I can solve reverse percentage problems involving VAT and more than one change.',
  ],
  keyWords: [
    { term: 'Original amount', def: 'The value before any percentage change; it represents 100%.' },
    { term: 'Reverse percentage', def: 'Working backwards from a changed value to find the original value.' },
    { term: 'Multiplier', def: 'The decimal equivalent of the new percentage, e.g. 0.7 after a 30% decrease.' },
    { term: 'VAT', def: 'Value Added Tax, currently 20% in the UK, added on to the price of many goods.' },
  ],
  sections: [
    {
      title: 'Spotting a reverse percentage question',
      html: `<p>Ask yourself: is the amount I have been given the <b>original</b> (100%), or the amount <b>after</b> the change? Words like "after a reduction of", "now costs", "including VAT" or "after an increase" tell you that you have the new value, not 100%.</p>
${note('The common wrong method is to find the percentage of the new price and add or subtract it. That gives the wrong answer because the percentage was taken from the original, not the new price.')}
${W('Which of these needs a reverse percentage? (a) A £40 shirt is reduced by 15%. Find the sale price. (b) After a 15% reduction a shirt costs £34. Find the original price.', ['(a) £40 is the original (100%), so this is an ordinary percentage decrease: 40 × 0.85 = £34.', '(b) £34 is the price <b>after</b> the change, i.e. 85% of the original, so work backwards: 34 ÷ 0.85 = £40.'], '(b) is the reverse percentage question')}`,
    },
    {
      title: 'The unitary method',
      html: `<p>Work out what percentage the new value represents, find 1%, then multiply by 100 to get 100%.</p>
${W('In a sale, a coat is reduced by 30%. The sale price is £63. What was the original price?', ['After a 30% reduction the price is 100% − 30% = 70% of the original.', '70% = £63, so 1% = £63 ÷ 70 = £0.90.', '100% = £0.90 × 100 = £90.'], '£90')}`,
    },
    {
      title: 'Dividing by the multiplier',
      html: `${rule('Original amount = new amount ÷ multiplier')}
${W('After a 20% increase, a ticket costs £52.80. Find the cost before the increase.', ['Multiplier for a 20% increase: 1.2.', 'Original × 1.2 = 52.80, so original = 52.80 ÷ 1.2.', '52.80 ÷ 1.2 = 44.'], '£44')}
${W('The population of a town rose by 8% to 15 660. What was it before?', ['Multiplier: 1.08.', '15 660 ÷ 1.08 = 14 500.', 'Check: 14 500 × 1.08 = 15 660 ✓'], '14 500')}`,
    },
    {
      title: 'VAT and multi-step problems',
      html: `<p>VAT at 20% means the price you pay is 120% of the price before VAT.</p>
${W('A television costs £594 including VAT at 20%. Find the price before VAT.', ['Price including VAT is 120% of the original: multiplier 1.2.', '594 ÷ 1.2 = 495.'], '£495')}
${W('A bike was reduced by 20%, and then the sale price was reduced by a further 10%. It now costs £259.20. What was the original price?', ['First change: multiplier 0.8. Second change: multiplier 0.9.', 'Overall multiplier: 0.8 × 0.9 = 0.72.', 'Original = 259.20 ÷ 0.72 = 360.'], '£360')}
${note('Two reductions of 20% and 10% are <b>not</b> the same as one reduction of 30%: the overall multiplier is 0.72, a 28% reduction.')}`,
    },
  ],
  mistakes: [
    'Taking 30% of the sale price and adding it on (63 + 18.90 = £81.90, which is wrong).',
    'Multiplying by the multiplier instead of dividing.',
    'Adding percentages from successive changes instead of multiplying the multipliers.',
    'Forgetting that a price "including VAT" is 120%, not 100%.',
  ],
  examTips: [
    'Always check your answer by applying the percentage change to it — you should get back the value in the question.',
    'Write "70% = £63" as your first line; this earns a method mark and keeps your thinking clear.',
    'No formula is given for reverse percentages on the Edexcel formulae sheet — you must know the method.',
  ],
  realLife: 'Shoppers and businesses use reverse percentages to find prices before VAT, original prices before a sale and last year\'s figures from this year\'s growth.',
  specRef: 'Edexcel 1MA1 R9: find the original amount given the result of a percentage change',
};

/* ------------------------------------------------------------------ */
C['y10-factorising-quadratics'] = {
  overview: `<p><b>Factorising</b> a quadratic means writing an expression like x<sup>2</sup> + 7x + 12 as two brackets multiplied together: (x + 3)(x + 4). It is the reverse of expanding double brackets, and it is the key step in solving quadratic equations and simplifying algebraic fractions.</p>`,
  objectives: [
    'I can factorise quadratics of the form x<sup>2</sup> + bx + c.',
    'I can recognise and factorise the difference of two squares.',
    'I can take out a common factor first when there is one.',
    'I can factorise quadratics of the form ax<sup>2</sup> + bx + c where a ≠ 1 (Higher).',
  ],
  keyWords: [
    { term: 'Quadratic expression', def: 'An expression whose highest power of x is x<sup>2</sup>, e.g. x<sup>2</sup> − 2x − 15.' },
    { term: 'Factorise', def: 'Write an expression as a product of its factors, usually using brackets.' },
    { term: 'Coefficient', def: 'The number in front of a letter, e.g. 7 in 7x.' },
    { term: 'Constant term', def: 'The number with no letter attached, e.g. 12 in x<sup>2</sup> + 7x + 12.' },
    { term: 'Difference of two squares', def: 'An expression of the form a<sup>2</sup> − b<sup>2</sup>, which factorises to (a + b)(a − b).' },
  ],
  sections: [
    {
      title: 'Factorising x² + bx + c',
      html: `<p>When you expand (x + p)(x + q) you get x<sup>2</sup> + (p + q)x + pq. So to factorise, look for two numbers that <b>multiply</b> to give c and <b>add</b> to give b.</p>
${rule('x<sup>2</sup> + bx + c = (x + p)(x + q) where p × q = c and p + q = b')}
${W('Factorise x<sup>2</sup> + 7x + 12.', ['Find two numbers that multiply to 12 and add to 7.', 'Factor pairs of 12: 1 and 12, 2 and 6, 3 and 4. Only 3 + 4 = 7.'], '(x + 3)(x + 4)')}
${W('Factorise x<sup>2</sup> − 2x − 15.', ['Multiply to −15 and add to −2.', 'Pairs giving −15: −1 and 15, 1 and −15, −3 and 5, 3 and −5.', '3 + (−5) = −2 ✓'], '(x + 3)(x − 5)')}
${note('Sign check: if c is positive, both numbers have the same sign as b. If c is negative, the numbers have different signs.')}`,
    },
    {
      title: 'Difference of two squares',
      html: `<p>When there is no middle term and a square is subtracted from a square, the brackets are the same except for the sign.</p>
${rule('a<sup>2</sup> − b<sup>2</sup> = (a + b)(a − b)')}
${W('Factorise x<sup>2</sup> − 49.', ['x<sup>2</sup> is the square of x and 49 is the square of 7.'], '(x + 7)(x − 7)')}
${W('Factorise 9x<sup>2</sup> − 25.', ['9x<sup>2</sup> = (3x)<sup>2</sup> and 25 = 5<sup>2</sup>.'], '(3x + 5)(3x − 5)')}
${note('x<sup>2</sup> + 49 (a sum of squares) does not factorise.')}`,
    },
    {
      title: 'Take out a common factor first',
      html: `<p>Always check whether every term shares a factor. Taking it out first makes the rest much easier.</p>
${W('Factorise fully 3x<sup>2</sup> + 15x + 18.', ['Every term is divisible by 3: 3(x<sup>2</sup> + 5x + 6).', 'Multiply to 6 and add to 5: 2 and 3.'], '3(x + 2)(x + 3)')}
${W('Factorise x<sup>2</sup> − 6x.', ['There is no constant term, so take out the common factor x.'], 'x(x − 6)')}`,
    },
    {
      title: 'Higher: factorising ax² + bx + c',
      html: `<p>When the x<sup>2</sup> term has a coefficient other than 1, use the <b>splitting the middle term</b> method.</p>
<ol><li>Multiply a × c.</li><li>Find two numbers that multiply to ac and add to b.</li><li>Use them to split the middle term into two terms.</li><li>Factorise each pair, then take out the common bracket.</li></ol>
${W('Factorise 6x<sup>2</sup> + 11x − 10.', ['a × c = 6 × (−10) = −60.', 'Two numbers multiplying to −60 and adding to 11: 15 and −4.', 'Split: 6x<sup>2</sup> + 15x − 4x − 10.', 'Factorise in pairs: 3x(2x + 5) − 2(2x + 5).', 'Common bracket (2x + 5): (2x + 5)(3x − 2).'], '(2x + 5)(3x − 2)')}
${note('Check by expanding: (2x + 5)(3x − 2) = 6x<sup>2</sup> − 4x + 15x − 10 = 6x<sup>2</sup> + 11x − 10 ✓')}`,
    },
  ],
  mistakes: [
    'Finding numbers that add to c and multiply to b — it is the other way round.',
    'Getting the signs wrong, e.g. writing (x − 3)(x + 5) for x<sup>2</sup> − 2x − 15.',
    'Not factorising "fully" by missing a common factor that should be taken out first.',
    'Trying to factorise x<sup>2</sup> + 25 as (x + 5)(x − 5).',
  ],
  examTips: [
    'Expand your brackets to check — it takes a few seconds and catches sign errors.',
    '"Factorise fully" is a hint that there is a common factor to take out first.',
    'No formula is given for factorising; if a quadratic will not factorise in an equation, the quadratic formula on the Higher formulae sheet may be needed.',
  ],
  realLife: 'Factorising is used by engineers and programmers to simplify formulae, and it underpins solving the quadratic equations that model areas, profits and projectiles.',
  specRef: 'Edexcel 1MA1 A4: factorise quadratic expressions, including the difference of two squares and ax² + bx + c (Higher)',
};

/* ------------------------------------------------------------------ */
C['y10-solving-quadratics'] = {
  overview: `<p>A <b>quadratic equation</b> such as x<sup>2</sup> + x − 12 = 0 usually has <b>two</b> solutions. If the quadratic factorises, you can solve it quickly: if two brackets multiply to give zero, one of them must be zero. The solutions are also where the graph crosses the x-axis.</p>`,
  objectives: [
    'I can rearrange a quadratic equation so that one side equals zero.',
    'I can solve quadratic equations by factorising.',
    'I can solve equations with a ≠ 1 by factorising (Higher).',
    'I can link solutions to the x-intercepts (roots) of a quadratic graph.',
    'I can set up and solve a quadratic equation from a word problem.',
  ],
  keyWords: [
    { term: 'Quadratic equation', def: 'An equation where the highest power of the unknown is 2.' },
    { term: 'Solution / root', def: 'A value of x that makes the equation true.' },
    { term: 'Zero product rule', def: 'If A × B = 0, then A = 0 or B = 0.' },
    { term: 'x-intercept', def: 'A point where a graph crosses the x-axis; there y = 0.' },
  ],
  sections: [
    {
      title: 'Solving by factorising',
      html: `${rule('If (x + p)(x + q) = 0, then x + p = 0 or x + q = 0')}
${W('Solve x<sup>2</sup> + x − 12 = 0.', ['Factorise: two numbers multiplying to −12 and adding to 1 are 4 and −3.', '(x + 4)(x − 3) = 0.', 'x + 4 = 0 gives x = −4; x − 3 = 0 gives x = 3.'], 'x = −4 or x = 3')}
${note('The solutions have the <b>opposite sign</b> to the numbers in the brackets.')}`,
    },
    {
      title: 'Rearrange to = 0 first',
      html: `<p>Factorising only helps when one side is zero. Move every term to one side first.</p>
${W('Solve x<sup>2</sup> + 3x = 10.', ['Subtract 10 from both sides: x<sup>2</sup> + 3x − 10 = 0.', 'Factorise: (x + 5)(x − 2) = 0.', 'x = −5 or x = 2.'], 'x = −5 or x = 2')}
${W('Solve x<sup>2</sup> = 5x.', ['Do not divide by x — you would lose a solution.', 'x<sup>2</sup> − 5x = 0, so x(x − 5) = 0.', 'x = 0 or x − 5 = 0.'], 'x = 0 or x = 5')}`,
    },
    {
      title: 'Higher: equations where a ≠ 1',
      html: `${W('Solve 2x<sup>2</sup> − 5x − 3 = 0.', ['ac = 2 × (−3) = −6. Numbers multiplying to −6 and adding to −5: −6 and 1.', 'Split: 2x<sup>2</sup> − 6x + x − 3 = 0.', '2x(x − 3) + 1(x − 3) = 0, so (2x + 1)(x − 3) = 0.', '2x + 1 = 0 gives x = −' + f(1, 2) + '; x − 3 = 0 gives x = 3.'], 'x = −' + f(1, 2) + ' or x = 3')}`,
    },
    {
      title: 'Roots and graphs',
      html: `<p>The solutions of x<sup>2</sup> − 2x − 8 = 0 are the x-coordinates where the curve y = x<sup>2</sup> − 2x − 8 crosses the x-axis. Factorising gives (x + 2)(x − 4) = 0, so the roots are −2 and 4.</p>
<svg viewBox="0 0 240 140" width="100%" style="max-width:300px" role="img" aria-label="Graph of y = x squared minus 2x minus 8 crossing the x-axis at −2 and 4">
<line x1="10" y1="60" x2="230" y2="60" stroke="currentColor" stroke-width="1.5"/>
<line x1="90" y1="10" x2="90" y2="140" stroke="currentColor" stroke-width="1.5"/>
<path d="M30 15 Q 110 221 190 15" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<circle cx="50" cy="60" r="4" fill="#3b6cf6"/><circle cx="170" cy="60" r="4" fill="#3b6cf6"/>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="46" y="78">−2</text><text x="176" y="78">4</text><text x="222" y="54">x</text><text x="98" y="20">y</text></g>
</svg>
${note('A quadratic graph can cross the x-axis twice, touch it once (one repeated root) or miss it (no real roots).')}
${W('Use the graph of y = x<sup>2</sup> − 2x − 8 to solve x<sup>2</sup> − 2x − 8 = 0.', ['The solutions are where the curve meets the x-axis (y = 0).', 'Read off the two crossing points: −2 and 4.', 'Check: (−2)<sup>2</sup> − 2(−2) − 8 = 4 + 4 − 8 = 0 ✓'], 'x = −2 or x = 4')}`,
    },
    {
      title: 'Forming and solving from a problem',
      html: `${W('A rectangle has width x cm and length (x + 3) cm. Its area is 40 cm<sup>2</sup>. Find its dimensions.', ['Area: x(x + 3) = 40, so x<sup>2</sup> + 3x − 40 = 0.', 'Factorise: (x + 8)(x − 5) = 0, so x = −8 or x = 5.', 'A length cannot be negative, so reject x = −8.', 'Width = 5 cm, length = 5 + 3 = 8 cm. Check: 5 × 8 = 40 ✓'], '5 cm by 8 cm')}`,
    },
  ],
  mistakes: [
    'Trying to factorise before making one side equal to zero.',
    'Dividing both sides by x and losing the solution x = 0.',
    'Giving the numbers in the brackets as the answers, e.g. writing x = 4 from (x + 4) = 0.',
    'Keeping a negative solution in a context where it is impossible, such as a length.',
  ],
  examTips: [
    'Show the factorised form — it usually earns a mark even if a solution is then wrong.',
    'Substitute each answer back into the original equation to check it.',
    'If an equation will not factorise, Higher students can use the quadratic formula, which is on the Edexcel Higher formulae sheet.',
  ],
  realLife: 'Quadratic equations are used to find dimensions from an area, the time a thrown ball lands and the price that gives a certain profit.',
  specRef: 'Edexcel 1MA1 A18: solve quadratic equations algebraically by factorising; find roots graphically',
};

/* ------------------------------------------------------------------ */
C['y10-trigonometry'] = {
  overview: `<p><b>Trigonometry</b> links the angles of a right-angled triangle to the lengths of its sides. Pythagoras' theorem finds a side from two sides; trigonometry lets you find a side from <b>one side and an angle</b>, or find an <b>angle</b> from two sides. The three ratios are remembered as <b>SOH CAH TOA</b>.</p>`,
  objectives: [
    'I can label the hypotenuse, opposite and adjacent sides relative to an angle.',
    'I can choose the correct ratio using SOH CAH TOA.',
    'I can find a missing side in a right-angled triangle.',
    'I can find a missing angle using inverse trig functions.',
    'I can recall the exact values of sin, cos and tan for 0°, 30°, 45°, 60° and 90°.',
    'I can solve problems involving angles of elevation and depression.',
  ],
  keyWords: [
    { term: 'Hypotenuse (H)', def: 'The longest side of a right-angled triangle, opposite the right angle.' },
    { term: 'Opposite (O)', def: 'The side directly across from the angle you are using.' },
    { term: 'Adjacent (A)', def: 'The side next to the angle you are using that is not the hypotenuse.' },
    { term: 'Inverse function', def: 'sin<sup>−1</sup>, cos<sup>−1</sup> or tan<sup>−1</sup>, used to find an angle from a ratio.' },
    { term: 'Angle of elevation', def: 'The angle measured upwards from the horizontal to an object.' },
    { term: 'Angle of depression', def: 'The angle measured downwards from the horizontal to an object.' },
  ],
  sections: [
    {
      title: 'Labelling the sides and SOH CAH TOA',
      html: `<p>Label the <b>hypotenuse</b> first (opposite the right angle). Then look from the angle θ you are using: the side across from it is the <b>opposite</b>, and the remaining side is the <b>adjacent</b>.</p>
<svg viewBox="0 0 260 170" width="100%" style="max-width:320px" role="img" aria-label="Right-angled triangle with hypotenuse, opposite and adjacent labelled relative to angle theta">
<polygon points="30,140 220,140 220,30" fill="none" stroke="currentColor" stroke-width="2"/>
<polyline points="206,140 206,126 220,126" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M62 140 A32 32 0 0 0 58 124" fill="none" stroke="#3b6cf6" stroke-width="2"/>
<g fill="currentColor" font-size="13"><text x="70" y="134" fill="#3b6cf6">θ</text><text x="95" y="75" text-anchor="middle">hypotenuse</text><text x="228" y="90">opposite</text><text x="125" y="160" text-anchor="middle">adjacent</text></g>
</svg>
${rule('sin θ = ' + f('O', 'H') + ' &nbsp;&nbsp; cos θ = ' + f('A', 'H') + ' &nbsp;&nbsp; tan θ = ' + f('O', 'A'))}
${note('Tick the two sides involved in the question (the one you know and the one you want). The ratio that uses both of them is the one to pick.')}
${W('A right-angled triangle has hypotenuse 15 cm. You want the side next to a 40° angle. Which ratio should you use?', ['The side you know is the hypotenuse (H).', 'The side you want is next to the angle, so it is the adjacent (A).', 'A and H appear together in CAH.'], 'Cosine: cos 40° = ' + f('x', 15) + ', so x = 15 cos 40°')}`,
    },
    {
      title: 'Finding a missing side',
      html: `${W('In a right-angled triangle, the hypotenuse is 12 cm and one angle is 35°. Find the side opposite the 35° angle.', ['Sides involved: O (wanted) and H (known) → SOH.', 'sin 35° = ' + f('x', 12) + ', so x = 12 × sin 35°.', 'Calculator: 12 × sin 35° = 6.8829…'], '6.88 cm (3 s.f.)')}
${W('The side adjacent to a 52° angle is 8 cm. Find the hypotenuse.', ['Sides involved: A (known) and H (wanted) → CAH.', 'cos 52° = ' + f(8, 'x') + ', so x = ' + f(8, 'cos 52°') + '.', '8 ÷ cos 52° = 12.994…'], '13.0 cm (3 s.f.)')}
${note('If the unknown is on the <b>bottom</b> of the fraction, you divide; if it is on the top, you multiply.')}`,
    },
    {
      title: 'Finding a missing angle',
      html: `<p>When you know two sides, find the ratio, then use the <b>inverse</b> function (SHIFT then sin, cos or tan on most calculators).</p>
${W('A right-angled triangle has opposite side 7 cm and adjacent side 10 cm. Find the angle θ.', ['Sides involved: O and A → TOA.', 'tan θ = ' + f(7, 10) + ' = 0.7.', 'θ = tan<sup>−1</sup>(0.7) = 34.992…°'], '35.0° (1 d.p.)')}`,
    },
    {
      title: 'Exact trig values (non-calculator)',
      html: `<p>You must know these values for the non-calculator paper.</p>
${table(['', '0°', '30°', '45°', '60°', '90°'], [['sin', '0', f(1, 2), f(sq(2), 2), f(sq(3), 2), '1'], ['cos', '1', f(sq(3), 2), f(sq(2), 2), f(1, 2), '0'], ['tan', '0', f(1, sq(3)) + ' = ' + f(sq(3), 3), '1', sq(3), 'undefined']])}
${W('Without a calculator, find the side opposite a 30° angle when the hypotenuse is 10 cm.', ['SOH: x = 10 × sin 30°.', 'sin 30° = ' + f(1, 2) + ', so x = 10 × ' + f(1, 2) + '.'], '5 cm')}
${note('The sin row reads 0, ' + f(sq(1), 2) + ', ' + f(sq(2), 2) + ', ' + f(sq(3), 2) + ', ' + f(sq(4), 2) + ' — and the cos row is the same in reverse.')}`,
    },
    {
      title: 'Angles of elevation and depression',
      html: `<p>Both angles are measured from the <b>horizontal</b>. Draw a sketch and find the right-angled triangle.</p>
${W('Sam stands 40 m from the foot of a building. The angle of elevation to the top is 28°. Sam\'s eyes are 1.6 m above the ground. How tall is the building?', ['The horizontal 40 m is adjacent to the 28° angle; the height above eye level is opposite → TOA.', 'Height above eye level = 40 × tan 28° = 21.268… m.', 'Add Sam\'s eye height: 21.268… + 1.6 = 22.868… m.'], '22.9 m (3 s.f.)')}`,
    },
  ],
  mistakes: [
    'Labelling the sides before identifying which angle is being used.',
    'Having the calculator in radians (RAD) instead of degrees (DEG).',
    'Writing sin<sup>−1</sup> when finding a side, or forgetting it when finding an angle.',
    'Using trigonometry on a triangle without a right angle (use the sine or cosine rule instead).',
  ],
  examTips: [
    'The trigonometric ratios (sin, cos and tan) are on the current Edexcel formulae sheet for both tiers, but the exact values for 0°, 30°, 45°, 60° and 90° are not.',
    'Write down the unrounded calculator value before rounding — it earns accuracy marks.',
    'Always sketch and label the triangle: H, O, A and the angle.',
  ],
  realLife: 'Surveyors, architects, pilots and game developers use trigonometry to work out heights, distances and angles that cannot be measured directly.',
  specRef: 'Edexcel 1MA1 G20, G21: trigonometric ratios in right-angled triangles and exact values',
};

/* ------------------------------------------------------------------ */
C['y10-fractional-indices'] = {
  overview: `<p>Indices do not have to be positive whole numbers. A <b>negative</b> index means "one over" (a reciprocal), and a <b>fractional</b> index means a root. Combined with the index laws, these rules let you evaluate expressions like 27<sup>${f(2, 3)}</sup> or 16<sup>−${f(3, 4)}</sup> without a calculator.</p>`,
  objectives: [
    'I can use the index laws for multiplying, dividing and raising powers.',
    'I can explain why any non-zero number to the power 0 is 1.',
    'I can evaluate negative indices as reciprocals.',
    'I can evaluate fractional indices as roots and powers.',
    'I can solve equations where the unknown is in the index (Higher).',
  ],
  keyWords: [
    { term: 'Index (power)', def: 'The small raised number showing how many times the base is multiplied by itself.' },
    { term: 'Base', def: 'The number being raised to a power, e.g. 5 in 5<sup>3</sup>.' },
    { term: 'Reciprocal', def: 'One divided by a number; the reciprocal of 5 is ' + f(1, 5) + '.' },
    { term: 'Root', def: 'The inverse of a power; the cube root of 27 is 3 because 3<sup>3</sup> = 27.' },
    { term: 'Index laws', def: 'Rules for combining powers of the same base.' },
  ],
  sections: [
    {
      title: 'The index laws',
      html: `${rule('a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup> &nbsp;&nbsp; a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup> &nbsp;&nbsp; (a<sup>m</sup>)<sup>n</sup> = a<sup>mn</sup> &nbsp;&nbsp; a<sup>0</sup> = 1')}
${W('Simplify ' + f('x<sup>5</sup> × x<sup>3</sup>', 'x<sup>2</sup>') + '.', ['Numerator: x<sup>5+3</sup> = x<sup>8</sup>.', 'Divide: x<sup>8−2</sup> = x<sup>6</sup>.'], 'x<sup>6</sup>')}
${note('Why is a<sup>0</sup> = 1? Because a<sup>3</sup> ÷ a<sup>3</sup> = a<sup>0</sup>, and anything divided by itself is 1.')}`,
    },
    {
      title: 'Negative indices',
      html: `${rule('a<sup>−n</sup> = ' + f(1, 'a<sup>n</sup>'))}
${W('Evaluate 5<sup>−2</sup>.', ['A negative index means the reciprocal: 5<sup>−2</sup> = ' + f(1, '5<sup>2</sup>') + '.', '5<sup>2</sup> = 25.'], f(1, 25))}
${W('Evaluate (' + f(2, 3) + ')<sup>−3</sup>.', ['The reciprocal of ' + f(2, 3) + ' is ' + f(3, 2) + ', so this is (' + f(3, 2) + ')<sup>3</sup>.', 'Cube top and bottom: ' + f(27, 8) + '.'], f(27, 8) + ' = 3' + f(3, 8))}
${note('A negative index never makes the answer negative: 2<sup>−3</sup> = ' + f(1, 8) + ', not −8.')}`,
    },
    {
      title: 'Fractional indices',
      html: `${rule('a<sup>' + f(1, 'n') + '</sup> = the nth root of a &nbsp;&nbsp;&nbsp; a<sup>' + f('m', 'n') + '</sup> = (nth root of a)<sup>m</sup>')}
<p>The <b>denominator</b> is the root; the <b>numerator</b> is the power. Do the root first — it keeps the numbers small.</p>
${W('Evaluate 27<sup>' + f(2, 3) + '</sup>.', ['Denominator 3: cube root of 27 = 3.', 'Numerator 2: 3<sup>2</sup> = 9.'], '9')}
${W('Evaluate 16<sup>−' + f(3, 4) + '</sup>.', ['Negative: take the reciprocal, ' + f(1, '16<sup>3/4</sup>') + '.', 'Fourth root of 16 = 2.', '2<sup>3</sup> = 8.'], f(1, 8))}
${W('Evaluate (' + f(8, 27) + ')<sup>−' + f(2, 3) + '</sup>.', ['Reciprocal: (' + f(27, 8) + ')<sup>' + f(2, 3) + '</sup>.', 'Cube root of top and bottom: ' + f(3, 2) + '.', 'Square: ' + f(9, 4) + '.'], f(9, 4))}`,
    },
    {
      title: 'Higher: unknowns in the index',
      html: `<p>Write both sides as powers of the <b>same base</b>, then the indices must be equal.</p>
${W('Solve 2<sup>x</sup> = ' + f(1, 8) + '.', [f(1, 8) + ' = ' + f(1, '2<sup>3</sup>') + ' = 2<sup>−3</sup>.', 'So 2<sup>x</sup> = 2<sup>−3</sup>.'], 'x = −3')}
${W('Solve 9<sup>x</sup> = 27<sup>x − 1</sup>.', ['Write both as powers of 3: 9 = 3<sup>2</sup>, 27 = 3<sup>3</sup>.', '(3<sup>2</sup>)<sup>x</sup> = (3<sup>3</sup>)<sup>x−1</sup>, so 3<sup>2x</sup> = 3<sup>3x−3</sup>.', 'Equate indices: 2x = 3x − 3.'], 'x = 3')}`,
    },
  ],
  mistakes: [
    'Multiplying the base numbers when using index laws, e.g. 3<sup>2</sup> × 3<sup>4</sup> = 9<sup>6</sup> (it is 3<sup>6</sup>).',
    'Thinking a negative index gives a negative answer.',
    'Dividing by the denominator of a fractional index instead of taking a root: 27<sup>1/3</sup> is 3, not 9.',
    'Saying a<sup>0</sup> = 0.',
  ],
  examTips: [
    'These questions are usually on the non-calculator paper — learn squares to 15<sup>2</sup> and cubes of 1 to 5 and 10.',
    'Deal with the three parts in order: negative (flip), denominator (root), numerator (power).',
    'No index laws are printed on the Edexcel formulae sheet — they must be memorised.',
  ],
  realLife: 'Scientists use negative and fractional powers in formulae for radioactive decay, sound intensity and the scaling of animal metabolism.',
  specRef: 'Edexcel 1MA1 N7: calculate with roots and with integer and fractional indices',
};

/* ------------------------------------------------------------------ */
C['y10-surds'] = {
  overview: `<p>A <b>surd</b> is a square root that cannot be written as a whole number or fraction, such as ${sq(2)} or ${sq(5)}. Leaving answers in surd form keeps them <b>exact</b> — no rounding. You will learn to simplify surds, add and multiply them, and expand brackets that contain them.</p>`,
  objectives: [
    'I can identify which roots are surds.',
    'I can simplify a surd using its largest square factor.',
    'I can add, subtract, multiply and divide surds.',
    'I can expand brackets containing surds.',
    'I can give exact answers in surd form in geometry problems.',
  ],
  keyWords: [
    { term: 'Surd', def: 'An irrational root such as ' + sq(3) + ' that cannot be simplified to a whole number or fraction.' },
    { term: 'Irrational number', def: 'A number that cannot be written as a fraction; its decimal never ends or repeats.' },
    { term: 'Exact value', def: 'An answer that has not been rounded, often left with a surd or π.' },
    { term: 'Square factor', def: 'A factor that is a square number, such as 4, 9, 16, 25 or 36.' },
    { term: 'Simplest form', def: 'A surd written as a' + sq('b') + ' where b has no square factor other than 1.' },
  ],
  sections: [
    {
      title: 'Simplifying surds',
      html: `${rule(sq('ab') + ' = ' + sq('a') + ' × ' + sq('b') + ' &nbsp;&nbsp;&nbsp; ' + sq(f('a', 'b')) + ' = ' + f(sq('a'), sq('b')))}
<p>Split the number into a product where one factor is the <b>largest square number</b> possible.</p>
${W('Simplify ' + sq(72) + '.', ['Largest square factor of 72 is 36: 72 = 36 × 2.', sq(72) + ' = ' + sq(36) + ' × ' + sq(2) + ' = 6' + sq(2) + '.'], '6' + sq(2))}
${note('If you choose a smaller square factor (e.g. ' + sq(72) + ' = 2' + sq(18) + '), you can still finish — just keep simplifying until no square factor remains.')}`,
    },
    {
      title: 'Adding and subtracting surds',
      html: `<p>You can only add or subtract <b>like surds</b> — the same number under the root — just as you collect like terms in algebra. Simplify first to make like surds appear.</p>
${W('Simplify ' + sq(50) + ' + ' + sq(18) + '.', [sq(50) + ' = ' + sq(25) + ' × ' + sq(2) + ' = 5' + sq(2) + '.', sq(18) + ' = ' + sq(9) + ' × ' + sq(2) + ' = 3' + sq(2) + '.', '5' + sq(2) + ' + 3' + sq(2) + ' = 8' + sq(2) + '.'], '8' + sq(2))}
${note(sq(9) + ' + ' + sq(16) + ' = 3 + 4 = 7, not ' + sq(25) + ' = 5. Roots do not add like that.')}`,
    },
    {
      title: 'Multiplying and dividing surds',
      html: `${W('Work out ' + sq(12) + ' × ' + sq(3) + '.', [sq(12) + ' × ' + sq(3) + ' = ' + sq(36) + '.'], '6')}
${W('Simplify 4' + sq(10) + ' × 3' + sq(5) + '.', ['Multiply the whole numbers: 4 × 3 = 12.', 'Multiply the surds: ' + sq(10) + ' × ' + sq(5) + ' = ' + sq(50) + ' = 5' + sq(2) + '.', '12 × 5' + sq(2) + ' = 60' + sq(2) + '.'], '60' + sq(2))}
${rule(sq('a') + ' × ' + sq('a') + ' = a')}`,
    },
    {
      title: 'Expanding brackets with surds',
      html: `<p>Expand exactly as you would in algebra, then simplify.</p>
${W('Expand and simplify (3 + ' + sq(2) + ')(5 − ' + sq(2) + ').', ['3 × 5 = 15; 3 × (−' + sq(2) + ') = −3' + sq(2) + '.', sq(2) + ' × 5 = 5' + sq(2) + '; ' + sq(2) + ' × (−' + sq(2) + ') = −2.', '15 − 3' + sq(2) + ' + 5' + sq(2) + ' − 2.'], '13 + 2' + sq(2))}
${W('Expand (2 + ' + sq(3) + ')<sup>2</sup>.', ['Write it as (2 + ' + sq(3) + ')(2 + ' + sq(3) + ').', '4 + 2' + sq(3) + ' + 2' + sq(3) + ' + 3.'], '7 + 4' + sq(3))}
${W('Expand (' + sq(5) + ' + ' + sq(3) + ')(' + sq(5) + ' − ' + sq(3) + ').', ['This is the difference of two squares: (' + sq(5) + ')<sup>2</sup> − (' + sq(3) + ')<sup>2</sup>.', '5 − 3 = 2.'], '2')}
${note('The last example shows why multiplying by a "conjugate" removes surds — the idea behind rationalising denominators.')}`,
    },
    {
      title: 'Exact answers in geometry',
      html: `${W('A right-angled triangle has shorter sides 4 cm and 8 cm. Find the exact length of the hypotenuse in its simplest form.', ['Pythagoras: h<sup>2</sup> = 4<sup>2</sup> + 8<sup>2</sup> = 16 + 64 = 80.', 'h = ' + sq(80) + ' = ' + sq(16) + ' × ' + sq(5) + '.'], '4' + sq(5) + ' cm')}`,
    },
  ],
  mistakes: [
    'Adding the numbers under the roots: ' + sq(2) + ' + ' + sq(3) + ' is not ' + sq(5) + '.',
    'Not using the largest square factor, leaving an answer like 2' + sq(18) + ' unsimplified.',
    'Forgetting that ' + sq(2) + ' × ' + sq(2) + ' = 2, not 4 or ' + sq(4) + ' left unsimplified.',
    'Rounding to a decimal when the question asks for an exact answer.',
  ],
  examTips: [
    '"Exact value" or "give your answer in the form a' + sq('b') + '" means leave it as a surd.',
    'Surd questions are almost always on the non-calculator paper, so practise without one.',
    'No surd rules are on the Edexcel formulae sheet; learn the square numbers up to 144 to spot square factors.',
  ],
  realLife: 'Engineers and designers keep values like ' + sq(2) + ' exact in calculations — A-series paper sizes have sides in the ratio 1 : ' + sq(2) + '.',
  specRef: 'Edexcel 1MA1 N8: calculate exactly with surds and simplify surd expressions',
};

/* ------------------------------------------------------------------ */
C['y10-simultaneous-equations'] = {
  overview: `<p>Simultaneous equations are two equations with two unknowns that are true <b>at the same time</b>. You solve them by eliminating one unknown, by substituting one equation into the other, or by finding where two graphs cross. They model real problems such as finding two prices from two receipts.</p>`,
  objectives: [
    'I can solve linear simultaneous equations by elimination.',
    'I can scale one or both equations so a variable can be eliminated.',
    'I can solve simultaneous equations by substitution.',
    'I can interpret the solution as the intersection of two graphs.',
    'I can form and solve simultaneous equations from a context.',
    'I can solve a linear and a quadratic equation simultaneously (Higher).',
  ],
  keyWords: [
    { term: 'Simultaneous equations', def: 'Two or more equations that share the same unknowns and are solved together.' },
    { term: 'Eliminate', def: 'Remove one unknown by adding or subtracting the equations.' },
    { term: 'Substitute', def: 'Replace a letter with an expression or value.' },
    { term: 'Coefficient', def: 'The number multiplying a letter.' },
    { term: 'Point of intersection', def: 'Where two graphs cross; its coordinates solve both equations.' },
  ],
  sections: [
    {
      title: 'Elimination: same coefficients',
      html: `<p>If one letter has the same coefficient in both equations, subtract (same signs) or add (different signs) to remove it.</p>
${rule('Same Signs → Subtract &nbsp;&nbsp;|&nbsp;&nbsp; Different signs → Add')}
${W('Solve 3x + 2y = 16 and x + 2y = 8.', ['Both have +2y (same sign), so subtract: (3x − x) + (2y − 2y) = 16 − 8.', '2x = 8, so x = 4.', 'Substitute into x + 2y = 8: 4 + 2y = 8, so y = 2.', 'Check in the first equation: 3(4) + 2(2) = 16 ✓'], 'x = 4, y = 2')}`,
    },
    {
      title: 'Elimination: scaling first',
      html: `<p>If no coefficients match, multiply one or both equations so that they do.</p>
${W('Solve 2x + 3y = 12 and 5x − 2y = 11.', ['Make the y coefficients match: multiply the first by 2 and the second by 3.', '4x + 6y = 24 and 15x − 6y = 33.', 'Different signs, so add: 19x = 57, giving x = 3.', 'Substitute: 2(3) + 3y = 12, so 3y = 6 and y = 2.', 'Check: 5(3) − 2(2) = 11 ✓'], 'x = 3, y = 2')}`,
    },
    {
      title: 'Substitution and graphs',
      html: `<p>If one equation already says "y = …", substitute it straight into the other.</p>
${W('Solve y = 2x − 1 and x + y = 5.', ['Replace y in the second equation: x + (2x − 1) = 5.', '3x − 1 = 5, so x = 2.', 'y = 2(2) − 1 = 3.'], 'x = 2, y = 3')}
<p>Graphically, the lines y = 2x − 1 and x + y = 5 cross at the point (2, 3). The solution of simultaneous equations is always the <b>point of intersection</b>.</p>`,
    },
    {
      title: 'Forming equations from a problem',
      html: `${W('3 adult tickets and 2 child tickets cost £36. 2 adult tickets and 5 child tickets cost £46. Find the cost of each ticket.', ['Let a = adult price and c = child price: 3a + 2c = 36 and 2a + 5c = 46.', 'Multiply the first by 2 and the second by 3: 6a + 4c = 72 and 6a + 15c = 138.', 'Subtract: 11c = 66, so c = 6.', 'Substitute: 3a + 12 = 36, so 3a = 24 and a = 8.', 'Check: 2(8) + 5(6) = 46 ✓'], 'Adult £8, child £6')}`,
    },
    {
      title: 'Higher: one linear and one quadratic',
      html: `<p>Substitute the linear equation into the quadratic one, rearrange to = 0 and solve. You usually get <b>two pairs</b> of answers — the line crosses the curve twice.</p>
${W('Solve y = x<sup>2</sup> − 3 and y = 2x.', ['Set equal: x<sup>2</sup> − 3 = 2x, so x<sup>2</sup> − 2x − 3 = 0.', 'Factorise: (x − 3)(x + 1) = 0, so x = 3 or x = −1.', 'Use y = 2x: x = 3 gives y = 6; x = −1 gives y = −2.'], 'x = 3, y = 6 or x = −1, y = −2')}
${W('Solve x<sup>2</sup> + y<sup>2</sup> = 25 and y = x + 1.', ['Substitute: x<sup>2</sup> + (x + 1)<sup>2</sup> = 25.', 'x<sup>2</sup> + x<sup>2</sup> + 2x + 1 = 25, so 2x<sup>2</sup> + 2x − 24 = 0.', 'Divide by 2: x<sup>2</sup> + x − 12 = 0, so (x + 4)(x − 3) = 0.', 'x = 3 gives y = 4; x = −4 gives y = −3.'], 'x = 3, y = 4 or x = −4, y = −3')}
${note('Pair your answers carefully — each x value goes with its own y value.')}`,
    },
  ],
  mistakes: [
    'Subtracting when the signs are different (or adding when they are the same).',
    'Multiplying only one side of an equation when scaling it.',
    'Making sign errors when subtracting negative terms, e.g. 5y − (−2y) = 7y.',
    'Finding x and forgetting to find y, or mixing up the pairs in a quadratic system.',
  ],
  examTips: [
    'Always substitute both values back into the equation you did not use — if it works, you are right.',
    'Line up the equations neatly and label them (1) and (2) so your method is easy to follow.',
    'Nothing for this topic is on the Edexcel formulae sheet.',
  ],
  realLife: 'Businesses use simultaneous equations to find break-even points, and they are used to work out unknown prices, mixtures and speeds.',
  specRef: 'Edexcel 1MA1 A19, A21: solve two simultaneous equations in two variables (linear/linear and, at Higher, linear/quadratic) algebraically and graphically',
};

/* ------------------------------------------------------------------ */
C['y10-rearranging'] = {
  overview: `<p>A formula such as v = u + at gives v in terms of u, a and t. <b>Rearranging</b> (changing the subject) means making a different letter the subject, for example finding a = … . You use exactly the same balancing steps as when solving an equation — whatever you do to one side, you do to the other.</p>`,
  objectives: [
    'I can make a letter the subject of a formula using inverse operations.',
    'I can rearrange formulae involving fractions, powers and roots.',
    'I can rearrange formulae where the subject appears twice (Higher).',
    'I can substitute values before or after rearranging.',
  ],
  keyWords: [
    { term: 'Subject', def: 'The letter on its own on one side of a formula, e.g. A in A = πr<sup>2</sup>.' },
    { term: 'Formula', def: 'A rule linking two or more variables, written with letters.' },
    { term: 'Inverse operation', def: 'The operation that undoes another, e.g. square root undoes squaring.' },
    { term: 'Factorise', def: 'Take out a common factor, used when the subject appears in more than one term.' },
  ],
  sections: [
    {
      title: 'Using inverse operations',
      html: `<p>Think about the order in which things happen to the letter you want, then undo them in <b>reverse order</b>.</p>
${W('Make a the subject of v = u + at.', ['Subtract u from both sides: v − u = at.', 'Divide both sides by t.'], 'a = ' + f('v − u', 't'))}
${W('Make x the subject of y = ' + f('3x − 4', 5) + '.', ['Multiply both sides by 5: 5y = 3x − 4.', 'Add 4: 5y + 4 = 3x.', 'Divide by 3.'], 'x = ' + f('5y + 4', 3))}`,
    },
    {
      title: 'Powers and roots',
      html: `<p>Squaring is undone by square rooting, and square rooting is undone by squaring.</p>
${W('Make r the subject of A = πr<sup>2</sup>.', ['Divide both sides by π: ' + f('A', 'π') + ' = r<sup>2</sup>.', 'Square root both sides.'], 'r = ' + sq(f('A', 'π')))}
${W('Make s the subject of v<sup>2</sup> = u<sup>2</sup> + 2as.', ['Subtract u<sup>2</sup>: v<sup>2</sup> − u<sup>2</sup> = 2as.', 'Divide by 2a.'], 's = ' + f('v<sup>2</sup> − u<sup>2</sup>', '2a'))}
${W('Make L the subject of T = 2π' + sq(f('L', 'g')) + '.', ['Divide by 2π: ' + f('T', '2π') + ' = ' + sq(f('L', 'g')) + '.', 'Square both sides: ' + f('T<sup>2</sup>', '4π<sup>2</sup>') + ' = ' + f('L', 'g') + '.', 'Multiply by g.'], 'L = ' + f('gT<sup>2</sup>', '4π<sup>2</sup>'))}`,
    },
    {
      title: 'Higher: the subject appears twice',
      html: `<p>Collect every term containing the subject on one side, everything else on the other, then <b>factorise</b> to get the subject out once.</p>
${W('Make x the subject of ax + 3 = bx − 5.', ['Collect x terms on the left: ax − bx = −5 − 3 = −8.', 'Factorise: x(a − b) = −8.', 'Divide: x = ' + f('−8', 'a − b') + ', which tidies to ' + f(8, 'b − a') + '.'], 'x = ' + f(8, 'b − a'))}
${W('Make x the subject of y = ' + f('2x + 1', 'x − 3') + '.', ['Multiply both sides by (x − 3): y(x − 3) = 2x + 1.', 'Expand: xy − 3y = 2x + 1.', 'Collect x terms: xy − 2x = 3y + 1.', 'Factorise: x(y − 2) = 3y + 1.'], 'x = ' + f('3y + 1', 'y − 2'))}
${note('Check with a number: if x = 4, then y = ' + f(9, 1) + ' = 9. Put y = 9 into your answer: ' + f(28, 7) + ' = 4 ✓')}`,
    },
    {
      title: 'Substituting values',
      html: `${W('Using v = u + at, find a when v = 25, u = 5 and t = 4.', ['Rearranged: a = ' + f('v − u', 't') + '.', 'a = ' + f('25 − 5', 4) + ' = ' + f(20, 4) + '.'], 'a = 5')}
${note('You can also substitute first and solve the equation: 25 = 5 + 4a, so 4a = 20. Both methods give the same answer.')}`,
    },
  ],
  mistakes: [
    'Undoing operations in the wrong order (e.g. dividing before subtracting in v = u + at).',
    'Dividing only one term on a side instead of the whole side.',
    'Forgetting to square root (or square) every part when dealing with powers and roots.',
    'Leaving the subject on both sides of the final answer.',
  ],
  examTips: [
    'Write one step per line — rearranging questions give a mark for each correct step.',
    'Check your rearrangement by picking a value, as shown above.',
    'The kinematics formulae (v = u + at, s = ut + ½at<sup>2</sup>, v<sup>2</sup> = u<sup>2</sup> + 2as) are given on the current Edexcel formulae sheet, but you still need to rearrange them yourself.',
  ],
  realLife: 'Spreadsheets, physics and engineering formulae are constantly rearranged — for example, finding the time from a speed formula, or a radius from an area.',
  specRef: 'Edexcel 1MA1 A5: understand and use standard formulae; change the subject of a formula, including where the subject appears twice (Higher)',
};

/* ------------------------------------------------------------------ */
C['y10-arcs-sectors'] = {
  overview: `<p>A <b>sector</b> is a "pizza slice" of a circle, and an <b>arc</b> is the curved edge of that slice. Because the sector angle is a fraction of 360°, the arc length and sector area are the same fraction of the full circumference and area. Answers can be given as decimals or exactly in terms of π.</p>`,
  objectives: [
    'I can identify arcs, sectors, chords and segments.',
    'I can calculate the length of an arc.',
    'I can calculate the area of a sector.',
    'I can find the perimeter of a sector.',
    'I can work backwards to find an angle or radius.',
  ],
  keyWords: [
    { term: 'Arc', def: 'Part of the circumference of a circle.' },
    { term: 'Sector', def: 'The region enclosed by two radii and an arc.' },
    { term: 'Chord', def: 'A straight line joining two points on the circumference.' },
    { term: 'Segment', def: 'The region between a chord and an arc.' },
    { term: 'In terms of π', def: 'An exact answer with π left as a symbol, e.g. 7π cm.' },
  ],
  sections: [
    {
      title: 'Parts of a circle',
      html: `<svg viewBox="0 0 200 200" width="100%" style="max-width:220px" role="img" aria-label="Circle with a shaded sector of angle theta">
<path d="M100 100 L180 100 A80 80 0 0 0 38.7 48.6 Z" fill="#3b6cf6" fill-opacity="0.35" stroke="#3b6cf6" stroke-width="2"/>
<circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2"/>
<path d="M120 100 A20 20 0 0 0 84.7 87.1" fill="none" stroke="currentColor" stroke-width="1.5"/>
<g fill="currentColor" font-size="13"><text x="104" y="84">θ</text><text x="140" y="116">r</text><text x="128" y="16">arc</text></g>
</svg>
<p>The shaded region is a <b>sector</b> with angle θ at the centre. Its curved edge is an <b>arc</b>. The fraction of the circle is ${f('θ', 360)}.</p>`,
    },
    {
      title: 'Arc length',
      html: `${rule('Arc length = ' + f('θ', 360) + ' × 2πr &nbsp; (or ' + f('θ', 360) + ' × πd)')}
${W('Find the length of the arc of a sector with radius 9 cm and angle 140°.', ['Fraction of the circle: ' + f(140, 360) + '.', 'Full circumference: 2 × π × 9 = 18π.', 'Arc = ' + f(140, 360) + ' × 18π = 7π = 21.991…'], '7π cm, or 22.0 cm (3 s.f.)')}`,
    },
    {
      title: 'Sector area and perimeter',
      html: `${rule('Sector area = ' + f('θ', 360) + ' × πr<sup>2</sup>')}
${W('Find the area of the same sector (radius 9 cm, angle 140°).', ['Full area: π × 9<sup>2</sup> = 81π.', 'Sector = ' + f(140, 360) + ' × 81π = 31.5π = 98.960…'], '31.5π cm<sup>2</sup>, or 99.0 cm<sup>2</sup> (3 s.f.)')}
${W('Find the perimeter of the sector.', ['The perimeter is the arc plus <b>two radii</b>.', '7π + 9 + 9 = 7π + 18 = 39.991…'], '(7π + 18) cm, or 40.0 cm (3 s.f.)')}
${note('Perimeter is a length (cm); area is in square units (cm<sup>2</sup>). Do not forget the two straight edges.')}`,
    },
    {
      title: 'Working backwards',
      html: `<p>Substitute what you know into the formula and solve the equation.</p>
${W('A sector has radius 8 cm and area 60 cm<sup>2</sup>. Find the angle θ.', [f('θ', 360) + ' × π × 8<sup>2</sup> = 60, so ' + f('θ', 360) + ' × 64π = 60.', 'θ = ' + f('60 × 360', '64π') + ' = 107.42…'], '107.4° (1 d.p.)')}
${W('An arc is 15 cm long and the sector angle is 72°. Find the radius.', [f(72, 360) + ' × 2πr = 15, and ' + f(72, 360) + ' = ' + f(1, 5) + ', so ' + f(2, 5) + 'πr = 15.', 'r = ' + f(15, '0.4π') + ' = 11.936…'], '11.9 cm (3 s.f.)')}`,
    },
  ],
  mistakes: [
    'Using the diameter in πr<sup>2</sup>, or the radius in πd.',
    'Forgetting to add the two radii when finding the perimeter.',
    'Dividing by 180 instead of 360.',
    'Rounding π too early (e.g. using 3.14) and losing accuracy marks.',
  ],
  examTips: [
    'The formulae for circumference and area of a circle are on the current Edexcel formulae sheet, but the arc length and sector area formulae are not — learn the "fraction of 360" idea.',
    'If the question says "in terms of π", do not multiply out π.',
    'Use the π button on your calculator and round only at the end.',
  ],
  realLife: 'Arc and sector calculations are used in designing running tracks, pie charts, garden beds, windscreen wiper coverage and slices of pizza.',
  specRef: 'Edexcel 1MA1 G18: calculate arc lengths, angles and areas of sectors of circles',
};

/* ------------------------------------------------------------------ */
C['y10-similar-shapes'] = {
  overview: `<p>Two shapes are <b>similar</b> when one is an enlargement of the other: the angles are the same and every length is multiplied by the same <b>scale factor</b>. If lengths are multiplied by k, areas are multiplied by k<sup>2</sup> and volumes by k<sup>3</sup> — a key Higher idea.</p>`,
  objectives: [
    'I can decide whether two shapes are similar.',
    'I can find missing lengths in similar shapes using a scale factor.',
    'I can find missing lengths in nested (overlapping) similar triangles.',
    'I can use the area scale factor k<sup>2</sup> and volume scale factor k<sup>3</sup> (Higher).',
    'I can move between length, area and volume scale factors (Higher).',
  ],
  keyWords: [
    { term: 'Similar', def: 'Same shape, different size: equal angles and sides in the same ratio.' },
    { term: 'Congruent', def: 'Exactly the same shape and size.' },
    { term: 'Scale factor (k)', def: 'The number every length is multiplied by to get from one shape to the other.' },
    { term: 'Corresponding sides', def: 'Sides in the same position in each shape.' },
    { term: 'Area scale factor', def: 'k<sup>2</sup>: how many times larger the area is.' },
    { term: 'Volume scale factor', def: 'k<sup>3</sup>: how many times larger the volume is.' },
  ],
  sections: [
    {
      title: 'Finding lengths in similar shapes',
      html: `${rule('Length scale factor k = ' + f('length on the large shape', 'corresponding length on the small shape'))}
${W('Triangles P and Q are similar. A side of 6 cm on P corresponds to 9 cm on Q. Another side of P is 8 cm. Find the corresponding side on Q.', ['k = 9 ÷ 6 = 1.5.', 'Multiply: 8 × 1.5 = 12.'], '12 cm')}
${note('Going from big to small, divide by k instead of multiplying.')}`,
    },
    {
      title: 'Nested similar triangles',
      html: `<p>When a line inside a triangle is parallel to one side, it makes a smaller similar triangle. Draw the two triangles separately to see corresponding sides.</p>
<svg viewBox="0 0 240 170" width="100%" style="max-width:300px" role="img" aria-label="Triangle ABC with DE parallel to BC">
<polygon points="120,15 20,155 220,155" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="80" y1="71" x2="160" y2="71" stroke="#3b6cf6" stroke-width="2.5"/>
<g fill="currentColor" font-size="13"><text x="114" y="12">A</text><text x="8" y="165">B</text><text x="222" y="165">C</text><text x="64" y="74">D</text><text x="166" y="74">E</text></g>
</svg>
${W('In the diagram DE is parallel to BC. AD = 4 cm, AB = 10 cm and DE = 6 cm. Find BC.', ['Triangles ADE and ABC are similar (same angles because DE ∥ BC).', 'k = AB ÷ AD = 10 ÷ 4 = 2.5.', 'BC = 6 × 2.5 = 15.'], '15 cm')}
${note('Use the whole side AB = 10, not the piece DB = 6.')}`,
    },
    {
      title: 'Higher: area and volume scale factors',
      html: `${rule('Length × k &nbsp;→&nbsp; Area × k<sup>2</sup> &nbsp;→&nbsp; Volume × k<sup>3</sup>')}
${W('Two similar shapes have corresponding lengths 4 cm and 10 cm. The smaller has area 24 cm<sup>2</sup>. Find the area of the larger.', ['Length scale factor k = 10 ÷ 4 = 2.5.', 'Area scale factor k<sup>2</sup> = 6.25.', '24 × 6.25 = 150.'], '150 cm<sup>2</sup>')}
${W('Two similar jugs have heights 12 cm and 18 cm. The larger holds 810 cm<sup>3</sup>. Find the volume of the smaller.', ['k = 18 ÷ 12 = 1.5, so the volume scale factor is 1.5<sup>3</sup> = 3.375.', 'Going from large to small, divide: 810 ÷ 3.375 = 240.'], '240 cm<sup>3</sup>')}`,
    },
    {
      title: 'Higher: from area to volume (grade 8–9)',
      html: `<p>If you are given areas, square root to get back to the length scale factor; then cube for volume.</p>
${W('Two similar solids have surface areas 45 cm<sup>2</sup> and 80 cm<sup>2</sup>. The smaller has volume 108 cm<sup>3</sup>. Find the volume of the larger.', ['Area scale factor = ' + f(80, 45) + ' = ' + f(16, 9) + '.', 'Length scale factor k = ' + sq(f(16, 9)) + ' = ' + f(4, 3) + '.', 'Volume scale factor = (' + f(4, 3) + ')<sup>3</sup> = ' + f(64, 27) + '.', '108 × ' + f(64, 27) + ' = 4 × 64 = 256.'], '256 cm<sup>3</sup>')}`,
    },
  ],
  mistakes: [
    'Adding the difference between sides instead of multiplying by a scale factor.',
    'Using the same scale factor for areas or volumes as for lengths.',
    'Pairing up sides that do not correspond — always match by angle position.',
    'Using a part of a side (like DB) instead of the whole side (AB) in nested triangles.',
  ],
  examTips: [
    'Write k clearly at the start, then show "× k", "× k<sup>2</sup>" or "× k<sup>3</sup>".',
    'Leave scale factors as fractions where possible (e.g. ' + f(4, 3) + ') to avoid rounding errors.',
    'No similarity formulae are on the Edexcel formulae sheet.',
  ],
  realLife: 'Model makers, map makers and manufacturers use similarity: a model car built to scale 1 : 20 uses 400 times less paint and 8000 times less material by volume.',
  specRef: 'Edexcel 1MA1 G6, G19, R12: similarity, and the relationship between lengths, areas and volumes of similar shapes',
};

/* ------------------------------------------------------------------ */
C['y10-quadratic-sequences'] = {
  overview: `<p>In a linear sequence the gap between terms is constant. In a <b>quadratic sequence</b> the gaps themselves change by a constant amount — the <b>second difference</b> is constant. The nth term contains an n<sup>2</sup> term. You will also meet geometric and Fibonacci-type sequences.</p>`,
  objectives: [
    'I can identify a quadratic sequence using second differences.',
    'I can find the nth term of a quadratic sequence of the form an<sup>2</sup> + bn + c.',
    'I can decide whether a number is a term in a sequence.',
    'I can recognise and continue geometric and Fibonacci-type sequences.',
  ],
  keyWords: [
    { term: 'First difference', def: 'The gap between consecutive terms.' },
    { term: 'Second difference', def: 'The gap between consecutive first differences.' },
    { term: 'Quadratic sequence', def: 'A sequence with a constant second difference; its nth term includes n<sup>2</sup>.' },
    { term: 'Geometric sequence', def: 'Each term is found by multiplying the previous one by the same number (the common ratio).' },
    { term: 'Fibonacci-type sequence', def: 'Each term is the sum of the two terms before it.' },
  ],
  sections: [
    {
      title: 'Spotting a quadratic sequence',
      html: `${table(['Term', '4', '7', '12', '19', '28'], [['1st difference', '', '3', '5', '7', '9'], ['2nd difference', '', '', '2', '2', '2']])}
<p>The second difference is constant (2), so the sequence is quadratic.</p>
${W('Is the sequence 5, 8, 13, 20, 29, … linear or quadratic?', ['First differences: 3, 5, 7, 9 — not constant, so not linear.', 'Second differences: 2, 2, 2 — constant.'], 'Quadratic')}
${rule('Coefficient of n<sup>2</sup> = second difference ÷ 2')}`,
    },
    {
      title: 'Finding the nth term',
      html: `<ol><li>Halve the second difference to get a in an<sup>2</sup>.</li><li>Subtract an<sup>2</sup> from each term.</li><li>Find the nth term of what is left (linear, or a constant).</li><li>Add the two parts.</li></ol>
${W('Find the nth term of 4, 7, 12, 19, 28, …', ['Second difference 2, so a = 1: start with n<sup>2</sup>.', 'n<sup>2</sup>: 1, 4, 9, 16, 25.', 'Sequence − n<sup>2</sup>: 3, 3, 3, 3, 3 — a constant 3.'], 'n<sup>2</sup> + 3')}
${W('Find the nth term of 3, 10, 21, 36, 55, …', ['First differences: 7, 11, 15, 19. Second difference: 4, so a = 2: start with 2n<sup>2</sup>.', '2n<sup>2</sup>: 2, 8, 18, 32, 50.', 'Sequence − 2n<sup>2</sup>: 1, 2, 3, 4, 5, which has nth term n.', 'Check n = 3: 2(9) + 3 = 21 ✓'], '2n<sup>2</sup> + n')}
${W('Find the nth term of the triangular numbers 1, 3, 6, 10, 15, …', ['Second difference 1, so a = ' + f(1, 2) + ': start with ' + f(1, 2) + 'n<sup>2</sup>.', f(1, 2) + 'n<sup>2</sup>: 0.5, 2, 4.5, 8, 12.5.', 'Sequence − ' + f(1, 2) + 'n<sup>2</sup>: 0.5, 1, 1.5, 2, 2.5, which is ' + f(1, 2) + 'n.'], f(1, 2) + 'n<sup>2</sup> + ' + f(1, 2) + 'n = ' + f('n(n + 1)', 2))}`,
    },
    {
      title: 'Is a number in the sequence?',
      html: `<p>Set the nth term equal to the number and solve. If n is a positive whole number, the number is in the sequence.</p>
${W('Is 103 a term of the sequence n<sup>2</sup> + 3?', ['n<sup>2</sup> + 3 = 103, so n<sup>2</sup> = 100.', 'n = 10, a whole number.'], 'Yes, it is the 10th term')}
${W('Is 150 a term of the sequence 2n<sup>2</sup> + n?', ['Try values near the answer: n = 8 gives 2(64) + 8 = 136.', 'n = 9 gives 2(81) + 9 = 171.', '150 lies between consecutive terms, so no whole number n works.'], 'No')}`,
    },
    {
      title: 'Geometric and Fibonacci-type sequences',
      html: `<p>In a <b>geometric</b> sequence you multiply by a common ratio r each time. For 3, 6, 12, 24, 48, … the ratio is 2, and the nth term is 3 × 2<sup>n−1</sup>.</p>
${W('Find the 8th term of 3, 6, 12, 24, …', ['nth term: 3 × 2<sup>n−1</sup>.', 'n = 8: 3 × 2<sup>7</sup> = 3 × 128.'], '384')}
<p>In a <b>Fibonacci-type</b> sequence each term is the sum of the previous two: 1, 1, 2, 3, 5, 8, 13, …</p>
${W('A Fibonacci-type sequence starts a, b, a + b, … The 3rd term is 7 and the 5th term is 19. Find a and b.', ['Terms: a, b, a + b, a + 2b, 2a + 3b.', 'a + b = 7 and 2a + 3b = 19.', 'Double the first: 2a + 2b = 14. Subtract from the second: b = 5.', 'a = 7 − 5 = 2.'], 'a = 2, b = 5')}`,
    },
  ],
  mistakes: [
    'Using the second difference itself as the coefficient of n<sup>2</sup> instead of halving it.',
    'Subtracting n<sup>2</sup> instead of an<sup>2</sup> when a is not 1.',
    'Treating a quadratic sequence as linear because the first differences "look" regular.',
    'Saying a number is in the sequence when n turns out not to be a whole number.',
  ],
  examTips: [
    'Write out the difference rows neatly — they earn method marks.',
    'Always check your nth term by substituting n = 1 and n = 2.',
    'No sequence formulae appear on the Edexcel formulae sheet.',
  ],
  realLife: 'Quadratic sequences describe stacking patterns, the number of handshakes in a group and stopping distances; geometric sequences model population growth and compound interest.',
  specRef: 'Edexcel 1MA1 A24, A25: recognise and use quadratic, geometric and Fibonacci-type sequences; find the nth term of quadratic sequences (Higher)',
};

/* ------------------------------------------------------------------ */
C['y10-proportion'] = {
  overview: `<p>Two quantities are in <b>direct proportion</b> when one increases at the same rate as the other — double one and the other doubles. They are in <b>inverse proportion</b> when one goes up as the other comes down — double one and the other halves. At Higher tier you write these relationships as equations using a constant k.</p>`,
  objectives: [
    'I can solve direct proportion problems using the unitary method.',
    'I can solve inverse proportion problems.',
    'I can recognise the graphs of direct and inverse proportion.',
    'I can write and use equations such as y = kx and y = ' + f('k', 'x') + ' (Higher).',
    'I can work with proportion involving squares, cubes and roots (Higher).',
  ],
  keyWords: [
    { term: 'Direct proportion', def: 'As one quantity is multiplied by a number, the other is multiplied by the same number.' },
    { term: 'Inverse proportion', def: 'As one quantity is multiplied by a number, the other is divided by the same number.' },
    { term: 'Constant of proportionality (k)', def: 'The fixed number linking two proportional quantities.' },
    { term: '∝', def: 'The symbol meaning "is proportional to".' },
    { term: 'Unitary method', def: 'Finding the value of one unit first, then scaling up.' },
  ],
  sections: [
    {
      title: 'Direct and inverse proportion with numbers',
      html: `${W('5 pens cost £3.40. How much do 8 pens cost?', ['Direct proportion: more pens cost more.', 'One pen: £3.40 ÷ 5 = £0.68.', 'Eight pens: £0.68 × 8 = £5.44.'], '£5.44')}
${W('6 workers take 10 days to build a wall. How long would 4 workers take, working at the same rate?', ['Inverse proportion: fewer workers take longer.', 'Total work: 6 × 10 = 60 worker-days.', '60 ÷ 4 = 15.'], '15 days')}
${note('Ask "if one goes up, does the other go up or down?" to decide which type it is.')}`,
    },
    {
      title: 'Graphs of proportion',
      html: `<p>A direct proportion graph is a <b>straight line through the origin</b> (y = kx). An inverse proportion graph is a curve that gets closer and closer to both axes without touching them (y = ${f('k', 'x')}).</p>
<svg viewBox="0 0 300 130" width="100%" style="max-width:340px" role="img" aria-label="Left: straight line through the origin for direct proportion. Right: curve for inverse proportion">
<g stroke="currentColor" stroke-width="1.5"><line x1="20" y1="110" x2="130" y2="110"/><line x1="20" y1="110" x2="20" y2="10"/><line x1="170" y1="110" x2="285" y2="110"/><line x1="170" y1="110" x2="170" y2="10"/></g>
<line x1="20" y1="110" x2="120" y2="20" stroke="#3b6cf6" stroke-width="2.5"/>
<path d="M180 15 Q 190 95 280 102" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="75" y="126">y ∝ x</text><text x="228" y="126">y ∝ 1/x</text></g>
</svg>
${W('In a table, x = 2, 4, 8 gives y = 20, 10, 5. Is this direct or inverse proportion?', ['As x doubles, y halves.', 'Check the product: 2 × 20 = 4 × 10 = 8 × 5 = 40, which is constant.'], 'Inverse proportion: y = ' + f(40, 'x'))}`,
    },
    {
      title: 'Higher: forming equations with k',
      html: `${rule('y ∝ x &nbsp;→&nbsp; y = kx &nbsp;&nbsp;&nbsp; y ∝ ' + f(1, 'x') + ' &nbsp;→&nbsp; y = ' + f('k', 'x'))}
<ol><li>Write the proportion statement as an equation with k.</li><li>Substitute the given pair of values to find k.</li><li>Rewrite the equation with k, then use it.</li></ol>
${W('y is directly proportional to x. When x = 4, y = 12. Find y when x = 10.', ['y = kx, so 12 = 4k and k = 3.', 'Equation: y = 3x.', 'y = 3 × 10.'], 'y = 30')}
${W('y is inversely proportional to x. When x = 3, y = 8. Find y when x = 6.', ['y = ' + f('k', 'x') + ', so 8 = ' + f('k', 3) + ' and k = 24.', 'y = ' + f(24, 6) + '.'], 'y = 4')}`,
    },
    {
      title: 'Higher: squares, cubes and roots',
      html: `${W('y is directly proportional to the square of x. When x = 5, y = 50. Find y when x = 7, and x when y = 200 (x > 0).', ['y = kx<sup>2</sup>, so 50 = 25k and k = 2.', 'x = 7: y = 2 × 49 = 98.', 'y = 200: 200 = 2x<sup>2</sup>, so x<sup>2</sup> = 100 and x = 10.'], 'y = 98; x = 10')}
${W('The force F between two magnets is inversely proportional to the square of the distance d. F = 20 when d = 3. Find F when d = 6.', ['F = ' + f('k', 'd<sup>2</sup>') + ', so 20 = ' + f('k', 9) + ' and k = 180.', 'F = ' + f(180, 36) + '.'], 'F = 5')}
${W('y is proportional to the square root of x. y = 12 when x = 16. Find y when x = 49.', ['y = k' + sq('x') + ', so 12 = 4k and k = 3.', 'y = 3 × ' + sq(49) + ' = 3 × 7.'], 'y = 21')}
${note('Quick check: doubling d in an inverse-square law should make F four times smaller — and 20 ÷ 4 = 5 ✓')}`,
    },
  ],
  mistakes: [
    'Treating an inverse proportion problem as direct (e.g. saying fewer workers take less time).',
    'Forgetting to square (or root) x when substituting to find k.',
    'Leaving the answer as k instead of using the equation to find the value asked for.',
    'Thinking any straight line shows direct proportion — it must pass through the origin.',
  ],
  examTips: [
    'Always write the equation with the value of k substituted in — this line is often worth a mark by itself.',
    'Read the wording carefully: "the square of", "the cube of" and "the square root of" change the equation.',
    'No proportion formulae are given on the Edexcel formulae sheet.',
  ],
  realLife: 'Recipes, currency exchange and wages use direct proportion; speed and journey time, and the brightness of a light with distance, use inverse proportion.',
  specRef: 'Edexcel 1MA1 R10, R13: direct and inverse proportion, including graphs and equations with k',
};

/* ------------------------------------------------------------------ */
C['y10-tree-diagrams'] = {
  overview: `<p>When two or more things happen one after the other — rolling two dice, picking two sweets from a bag — you can show every possible outcome in a <b>sample space diagram</b> or a <b>tree diagram</b>. Multiply along the branches for "and", and add the end results for "or".</p>`,
  objectives: [
    'I can list outcomes systematically in a sample space diagram.',
    'I can use the AND rule for independent events and the OR rule for mutually exclusive events.',
    'I can draw and use tree diagrams for events with replacement.',
    'I can draw and use tree diagrams for events without replacement.',
    'I can use P(at least one) = 1 − P(none).',
  ],
  keyWords: [
    { term: 'Independent events', def: 'Events where the outcome of one does not affect the probability of the other.' },
    { term: 'Mutually exclusive', def: 'Events that cannot happen at the same time.' },
    { term: 'Sample space', def: 'The list of all possible outcomes.' },
    { term: 'With replacement', def: 'The first item is put back, so probabilities stay the same on the second pick.' },
    { term: 'Without replacement', def: 'The first item is kept out, so the second pick has one fewer item.' },
  ],
  sections: [
    {
      title: 'Sample space diagrams',
      html: `<p>A grid shows every combination of two events. Two fair dice give 6 × 6 = 36 equally likely outcomes.</p>
${W('Two fair dice are rolled and the scores added. Find P(total = 7).', ['Pairs that make 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) — 6 outcomes.', 'P = ' + f(6, 36) + '.'], f(1, 6))}`,
    },
    {
      title: 'The AND and OR rules',
      html: `${rule('Independent events: P(A and B) = P(A) × P(B)<br>Mutually exclusive events: P(A or B) = P(A) + P(B)')}
<p>On a tree diagram, <b>multiply along</b> the branches to find the probability of a route, and <b>add</b> the probabilities of different routes that give the outcome you want.</p>
${note('The probabilities on each pair of branches from one point must add up to 1.')}
${W('A fair coin is flipped and a fair dice is rolled. Find P(heads and a 6) and P(rolling a 1 or a 6).', ['The events are independent: P(heads and 6) = ' + f(1, 2) + ' × ' + f(1, 6) + ' = ' + f(1, 12) + '.', 'Rolling 1 and rolling 6 are mutually exclusive: P(1 or 6) = ' + f(1, 6) + ' + ' + f(1, 6) + ' = ' + f(2, 6) + '.'], 'P(heads and 6) = ' + f(1, 12) + '; P(1 or 6) = ' + f(1, 3))}`,
    },
    {
      title: 'Tree diagrams with replacement',
      html: `<svg viewBox="0 0 300 170" width="100%" style="max-width:340px" role="img" aria-label="Tree diagram for two picks with replacement: red 5/8, blue 3/8 on each pick">
<g stroke="currentColor" stroke-width="1.5" fill="none"><line x1="15" y1="85" x2="110" y2="40"/><line x1="15" y1="85" x2="110" y2="130"/><line x1="135" y1="40" x2="230" y2="18"/><line x1="135" y1="40" x2="230" y2="62"/><line x1="135" y1="130" x2="230" y2="108"/><line x1="135" y1="130" x2="230" y2="152"/></g>
<g fill="currentColor" font-size="12"><text x="114" y="44">R</text><text x="114" y="134">B</text><text x="236" y="22">R</text><text x="236" y="66">B</text><text x="236" y="112">R</text><text x="236" y="156">B</text></g>
<g fill="#3b6cf6" font-size="11"><text x="45" y="52">5/8</text><text x="45" y="126">3/8</text><text x="168" y="22">5/8</text><text x="168" y="64">3/8</text><text x="168" y="112">5/8</text><text x="168" y="154">3/8</text></g>
</svg>
${W('A bag has 5 red and 3 blue counters. A counter is taken, replaced, then another is taken. Find P(both red) and P(one of each colour).', ['Both red: ' + f(5, 8) + ' × ' + f(5, 8) + ' = ' + f(25, 64) + '.', 'Red then blue: ' + f(5, 8) + ' × ' + f(3, 8) + ' = ' + f(15, 64) + '. Blue then red: ' + f(3, 8) + ' × ' + f(5, 8) + ' = ' + f(15, 64) + '.', 'One of each: ' + f(15, 64) + ' + ' + f(15, 64) + ' = ' + f(30, 64) + ' = ' + f(15, 32) + '.'], 'P(both red) = ' + f(25, 64) + '; P(one of each) = ' + f(15, 32))}`,
    },
    {
      title: 'Tree diagrams without replacement',
      html: `<p>If the first counter is <b>not</b> put back, there is one fewer counter in the bag — and one fewer of the colour just taken.</p>
${W('The same bag (5 red, 3 blue). Two counters are taken without replacement. Find P(both red) and P(different colours).', ['First pick: P(R) = ' + f(5, 8) + ', P(B) = ' + f(3, 8) + '.', 'After a red: 4 red, 3 blue left, so P(R) = ' + f(4, 7) + ', P(B) = ' + f(3, 7) + '.', 'Both red: ' + f(5, 8) + ' × ' + f(4, 7) + ' = ' + f(20, 56) + ' = ' + f(5, 14) + '.', 'Different: RB + BR = ' + f(5, 8) + ' × ' + f(3, 7) + ' + ' + f(3, 8) + ' × ' + f(5, 7) + ' = ' + f(15, 56) + ' + ' + f(15, 56) + ' = ' + f(30, 56) + ' = ' + f(15, 28) + '.'], 'P(both red) = ' + f(5, 14) + '; P(different) = ' + f(15, 28))}`,
    },
    {
      title: 'At least one',
      html: `${rule('P(at least one) = 1 − P(none)')}
${W('Using the bag without replacement, find the probability that at least one counter is blue.', ['"At least one blue" is everything except "no blue", i.e. except both red.', '1 − ' + f(5, 14) + '.'], f(9, 14))}`,
    },
  ],
  mistakes: [
    'Adding along the branches instead of multiplying.',
    'Forgetting to reduce both the numerator and the denominator on the second pick without replacement.',
    'Counting only one route for "one of each" (it can be RB or BR).',
    'Working out "at least one" the long way and missing a route.',
  ],
  examTips: [
    'Do not simplify fractions on the branches of a tree — it makes adding the final results harder. Simplify the final answer only.',
    'Check that the probabilities at the ends of all routes add up to 1.',
    'At Higher tier the rule P(A and B) = P(A given B)P(B) is printed on the current Edexcel formulae sheet; the basic AND/OR rules are not given at Foundation.',
  ],
  realLife: 'Tree diagrams are used to assess risk — for example, medical test accuracy, quality control on production lines and insurance pricing.',
  specRef: 'Edexcel 1MA1 P6, P8: sample spaces and tree diagrams for independent and dependent combined events',
};

/* ------------------------------------------------------------------ */
C['y10-grouped-data'] = {
  overview: `<p>Large data sets are often grouped into <b>classes</b>, such as 10 &lt; t ≤ 20. Once data is grouped you no longer know the exact values, so you can only <b>estimate</b> the mean, using the midpoint of each class. At Higher tier you also draw and read <b>histograms</b>, where the area of each bar shows the frequency.</p>`,
  objectives: [
    'I can read and use inequality notation for class intervals.',
    'I can estimate the mean from a grouped frequency table.',
    'I can find the modal class and the class containing the median.',
    'I can calculate frequency density and draw a histogram (Higher).',
    'I can estimate frequencies from a histogram, including part of a class (Higher).',
  ],
  keyWords: [
    { term: 'Class interval', def: 'A group of values, e.g. 10 &lt; t ≤ 20 means more than 10 and up to and including 20.' },
    { term: 'Midpoint', def: 'The value halfway through a class, used to represent it.' },
    { term: 'Modal class', def: 'The class with the highest frequency.' },
    { term: 'Estimated mean', def: 'Σfx ÷ Σf using midpoints for x.' },
    { term: 'Frequency density', def: 'Frequency ÷ class width; the height of a histogram bar.' },
    { term: 'Histogram', def: 'A chart for continuous data where the area of each bar is proportional to its frequency.' },
  ],
  sections: [
    {
      title: 'Estimating the mean',
      html: `<p>The table shows the times, t minutes, that 30 students spent on homework.</p>
${table(['Time (t mins)', 'Frequency f', 'Midpoint x', 'f × x'], [['0 &lt; t ≤ 10', '4', '5', '20'], ['10 &lt; t ≤ 20', '9', '15', '135'], ['20 &lt; t ≤ 30', '12', '25', '300'], ['30 &lt; t ≤ 40', '5', '35', '175'], ['Total', '30', '', '630']])}
${rule('Estimated mean = ' + f('total of f × x', 'total frequency'))}
${W('Estimate the mean time.', ['Midpoints: 5, 15, 25, 35.', 'Total of f × x: 20 + 135 + 300 + 175 = 630.', '630 ÷ 30 = 21.'], '21 minutes')}
${note('It is an estimate because we have assumed every value in a class is at its midpoint.')}`,
    },
    {
      title: 'Modal class, median class and range',
      html: `${W('Using the same table, find the modal class and the class containing the median.', ['Modal class: highest frequency is 12, so 20 &lt; t ≤ 30.', 'Median position: ' + f('30 + 1', 2) + ' = 15.5th value.', 'Running totals: 4, 13, 25, 30. The 15.5th value lies in the third class.'], 'Modal class 20 &lt; t ≤ 30; median class 20 &lt; t ≤ 30')}
${note('You cannot find the exact range from grouped data. The largest possible range here is 40 − 0 = 40 minutes.')}`,
    },
    {
      title: 'Higher: histograms and frequency density',
      html: `<p>When classes have <b>different widths</b>, a bar chart would be misleading. A histogram uses frequency density so the <b>area</b> of each bar represents the frequency.</p>
${rule('Frequency density = ' + f('frequency', 'class width') + ' &nbsp;&nbsp; Frequency = frequency density × class width')}
${table(['Weight (w kg)', 'Frequency', 'Class width', 'Frequency density'], [['0 &lt; w ≤ 10', '8', '10', '0.8'], ['10 &lt; w ≤ 15', '12', '5', '2.4'], ['15 &lt; w ≤ 20', '15', '5', '3'], ['20 &lt; w ≤ 40', '10', '20', '0.5']])}
${W('Work out the frequency density for the class 10 &lt; w ≤ 15, which has frequency 12.', ['Class width: 15 − 10 = 5.', 'Frequency density = 12 ÷ 5.'], '2.4 — so this bar is drawn 2.4 units high and 5 units wide')}
<svg viewBox="0 0 300 200" width="100%" style="max-width:340px" role="img" aria-label="Histogram with bars of frequency density 0.8, 2.4, 3 and 0.5">
<g fill="#3b6cf6" fill-opacity="0.35" stroke="#3b6cf6" stroke-width="2"><rect x="40" y="130" width="60" height="40"/><rect x="100" y="50" width="30" height="120"/><rect x="130" y="20" width="30" height="150"/><rect x="160" y="145" width="120" height="25"/></g>
<g stroke="currentColor" stroke-width="1.5"><line x1="40" y1="170" x2="285" y2="170"/><line x1="40" y1="170" x2="40" y2="10"/></g>
<g fill="currentColor" font-size="11" text-anchor="middle"><text x="40" y="185">0</text><text x="100" y="185">10</text><text x="130" y="185">15</text><text x="160" y="185">20</text><text x="280" y="185">40</text><text x="220" y="198">Weight (kg)</text></g>
<g fill="currentColor" font-size="11" text-anchor="end"><text x="34" y="174">0</text><text x="34" y="124">1</text><text x="34" y="74">2</text><text x="34" y="24">3</text></g>
</svg>`,
    },
    {
      title: 'Higher: reading a histogram (grade 8)',
      html: `${W('Using the histogram, estimate how many items weigh between 12 kg and 30 kg.', ['10–15 class: only 12 to 15 is needed, a width of 3. Frequency ≈ 2.4 × 3 = 7.2.', '15–20 class: all of it, 15.', '20–40 class: only 20 to 30, a width of 10. Frequency ≈ 0.5 × 10 = 5.', 'Total ≈ 7.2 + 15 + 5 = 27.2.'], 'About 27 items')}
${note('If the vertical axis has no scale, use a bar where you know the frequency to work out what one unit of area represents.')}`,
    },
  ],
  mistakes: [
    'Dividing Σfx by the number of classes instead of the total frequency.',
    'Using the class width or upper bound instead of the midpoint.',
    'Giving the median as a value rather than the class it lies in.',
    'Plotting frequency instead of frequency density on a histogram.',
  ],
  examTips: [
    'Add extra columns to the table (midpoint, f × x) — examiners give method marks for them.',
    'Sense-check: the estimated mean must lie inside the range of the data, usually near the middle classes.',
    'No statistics formulae are given on the Edexcel formulae sheet, so learn "Σfx ÷ Σf" and "frequency density = frequency ÷ class width".',
  ],
  realLife: 'Grouped data and histograms are used in census results, NHS waiting times, exam grade boundaries and market research.',
  specRef: 'Edexcel 1MA1 S3, S4: grouped frequency tables, estimated mean, modal and median class; histograms with unequal class widths (Higher)',
};

/* ------------------------------------------------------------------ */
C['y11-recurring-decimals'] = {
  overview: `<p>Every fraction becomes either a terminating decimal or a <b>recurring decimal</b>, where a digit or block of digits repeats forever. At Higher tier you must convert recurring decimals back into fractions using an algebraic method — and show every step, because these are usually "prove" or "show that" questions.</p>`,
  objectives: [
    'I can write a fraction as a recurring decimal and use dot notation.',
    'I can predict whether a fraction gives a terminating or recurring decimal.',
    'I can convert a recurring decimal into a fraction algebraically.',
    'I can deal with decimals where only some digits recur.',
  ],
  keyWords: [
    { term: 'Terminating decimal', def: 'A decimal that ends, e.g. 0.375.' },
    { term: 'Recurring decimal', def: 'A decimal with a digit or block of digits repeating for ever, e.g. 0.272727…' },
    { term: 'Dot notation', def: 'Dots above the first and last digits of the repeating block show which digits recur.' },
    { term: 'Rational number', def: 'A number that can be written as a fraction of two integers; every recurring decimal is rational.' },
  ],
  sections: [
    {
      title: 'Fractions to decimals and dot notation',
      html: `<p>Divide the numerator by the denominator. If the division never finishes, the digits start repeating.</p>
${table(['Fraction', 'Decimal', 'Dot notation means'], [[f(5, 11), '0.454545…', 'dots over the 4 and the 5'], [f(1, 7), '0.142857142857…', 'dots over the 1 and the 7 (the whole block 142857 repeats)'], [f(7, 30), '0.23333…', 'a dot over the 3 only']])}
${rule('A fraction in its simplest form terminates only if its denominator has no prime factors other than 2 and 5.')}
${note(f(3, 40) + ' terminates (40 = 2<sup>3</sup> × 5) but ' + f(1, 12) + ' recurs (12 has a factor of 3).')}
${W('Write ' + f(3, 11) + ' as a decimal using dot notation.', ['Short division: 3 ÷ 11 = 0.272727…', 'The block 27 repeats.'], '0.272727…, written with dots above the 2 and the 7')}`,
    },
    {
      title: 'Converting: whole block recurs',
      html: `<p>Let x equal the decimal. Multiply by 10, 100 or 1000 — whatever moves <b>one full repeating block</b> past the decimal point — then subtract so the recurring part cancels.</p>
${W('Write 0.777… as a fraction.', ['Let x = 0.777…', 'One digit repeats, so multiply by 10: 10x = 7.777…', 'Subtract: 10x − x = 7.777… − 0.777…, so 9x = 7.'], 'x = ' + f(7, 9))}
${W('Show that 0.454545… = ' + f(5, 11) + '.', ['Let x = 0.454545…', 'Two digits repeat, so multiply by 100: 100x = 45.454545…', 'Subtract: 99x = 45.', 'x = ' + f(45, 99) + ' = ' + f(5, 11) + ' (dividing top and bottom by 9).'], f(5, 11))}`,
    },
    {
      title: 'Converting: only some digits recur',
      html: `<p>Use two multiples of x that have <b>the same digits after the decimal point</b>, then subtract.</p>
${W('Write 0.2333… as a fraction in its simplest form.', ['Let x = 0.2333…', '10x = 2.333… and 100x = 23.333… (both end in 0.333…).', 'Subtract: 100x − 10x = 90x = 21.', 'x = ' + f(21, 90) + ' = ' + f(7, 30) + '.'], f(7, 30))}
${W('Grade 9: write 0.3181818… as a fraction in its simplest form.', ['Let x = 0.31818… (the 18 recurs).', '10x = 3.181818… and 1000x = 318.181818…', 'Subtract: 990x = 315.', 'x = ' + f(315, 990) + ' = ' + f(7, 22) + ' (dividing by 45).'], f(7, 22))}`,
    },
    {
      title: 'Decimals bigger than 1',
      html: `${W('Write 1.272727… as a mixed number and as an improper fraction.', ['Deal with the decimal part: let x = 0.272727…, so 100x = 27.2727…', '99x = 27, so x = ' + f(27, 99) + ' = ' + f(3, 11) + '.', 'Add the whole number: 1' + f(3, 11) + ' = ' + f(14, 11) + '.'], '1' + f(3, 11) + ' = ' + f(14, 11))}`,
    },
  ],
  mistakes: [
    'Multiplying by 10 when two digits repeat, so the recurring parts do not cancel.',
    'Writing 0.2333… as ' + f(23, 99) + ' because both 2 and 3 were assumed to repeat.',
    'Not simplifying the final fraction.',
    'Skipping the algebra in a "show that" question and just checking on a calculator.',
  ],
  examTips: [
    '"Prove" or "show that" questions need you to write "let x = …", both multiplied lines and the subtraction.',
    'Write out several repeats of the digits (e.g. 0.318181818…) so you can see they line up before subtracting.',
    'Nothing on recurring decimals appears on the Edexcel formulae sheet.',
  ],
  realLife: 'Converting recurring decimals exactly matters in computing and finance, where rounding errors can build up over millions of calculations.',
  specRef: 'Edexcel 1MA1 N10: convert between terminating and recurring decimals and fractions',
};

/* ------------------------------------------------------------------ */
C['y11-bounds'] = {
  overview: `<p>Every measurement is rounded, so the true value lies somewhere in an interval. The <b>lower bound</b> and <b>upper bound</b> are the smallest and largest values that would round to the given number. At Higher tier you use bounds in calculations to find the greatest and least possible answers — and decide how accurately an answer can be given.</p>`,
  objectives: [
    'I can find the upper and lower bounds of a rounded value.',
    'I can write an error interval using inequality notation, including for truncation.',
    'I can choose the correct bounds when adding, subtracting, multiplying and dividing.',
    'I can find bounds for compound measures such as speed and density.',
    'I can give an answer to a suitable degree of accuracy by comparing bounds.',
  ],
  keyWords: [
    { term: 'Lower bound (LB)', def: 'The smallest value that rounds up to the given number.' },
    { term: 'Upper bound (UB)', def: 'The value at which numbers start to round up to the next value; the true value is less than it.' },
    { term: 'Error interval', def: 'An inequality showing all possible true values, e.g. 7.35 ≤ x &lt; 7.45.' },
    { term: 'Truncate', def: 'Cut off digits after a point without rounding, e.g. 4.79 truncated to 1 d.p. is 4.7.' },
    { term: 'Degree of accuracy', def: 'How precisely a value is given, e.g. to 1 d.p. or 2 s.f.' },
  ],
  sections: [
    {
      title: 'Finding bounds and error intervals',
      html: `${rule('Bounds = given value ± half of the unit it was rounded to')}
${W('A length is 7.4 cm to 1 decimal place. Write its error interval.', ['Rounded to the nearest 0.1, so half of that is 0.05.', 'LB = 7.4 − 0.05 = 7.35; UB = 7.4 + 0.05 = 7.45.'], '7.35 ≤ l &lt; 7.45')}
${W('A crowd is 2600 to the nearest 100. Write the error interval.', ['Half of 100 is 50.'], '2550 ≤ n &lt; 2650')}
${W('A number x is truncated to 1 decimal place and gives 4.7. Write the error interval.', ['Truncating cuts digits off, so anything from 4.7 up to (but not including) 4.8 gives 4.7.'], '4.7 ≤ x &lt; 4.8')}
${note('Use ≤ for the lower bound and &lt; for the upper bound: 7.45 itself would round up to 7.5.')}`,
    },
    {
      title: 'Bounds in calculations',
      html: `${table(['Calculation', 'For the maximum use', 'For the minimum use'], [['a + b', 'UB + UB', 'LB + LB'], ['a − b', 'UB − LB', 'LB − UB'], ['a × b', 'UB × UB', 'LB × LB'], ['a ÷ b', 'UB ÷ LB', 'LB ÷ UB']])}
${W('A rectangle measures 8.3 cm by 5.6 cm, each to 1 d.p. Find the upper and lower bounds of its area.', ['Bounds: 8.25 ≤ l &lt; 8.35 and 5.55 ≤ w &lt; 5.65.', 'UB of area = 8.35 × 5.65 = 47.1775.', 'LB of area = 8.25 × 5.55 = 45.7875.'], 'UB = 47.1775 cm<sup>2</sup>, LB = 45.7875 cm<sup>2</sup>')}
${note('To make a division as large as possible, make the top big and the bottom small.')}`,
    },
    {
      title: 'Compound measures',
      html: `${W('A runner covers 120 m (to the nearest 10 m) in 14.2 s (to 1 d.p.). Find the upper bound of her average speed.', ['Distance: 115 ≤ d &lt; 125. Time: 14.15 ≤ t &lt; 14.25.', 'Speed = distance ÷ time, so UB = UB of distance ÷ LB of time.', '125 ÷ 14.15 = 8.8339…'], '8.83 m/s (3 s.f.)')}
${note('Similarly, the lower bound is 115 ÷ 14.25 = 8.07 m/s (3 s.f.).')}`,
    },
    {
      title: 'Suitable degree of accuracy (grade 9)',
      html: `<p>Work out both bounds of the answer, then round each. The answer can be given to the greatest accuracy at which both bounds round to the <b>same</b> value.</p>
${W('a = 8.7 to 1 d.p. and b = 2.35 to 2 d.p. Find c = ' + f('a', 'b') + ' to a suitable degree of accuracy. Give a reason.', ['Bounds: 8.65 ≤ a &lt; 8.75 and 2.345 ≤ b &lt; 2.355.', 'UB of c = 8.75 ÷ 2.345 = 3.7313…', 'LB of c = 8.65 ÷ 2.355 = 3.6730…', 'To 2 s.f. both round to 3.7. To 3 s.f. they are 3.73 and 3.67, which differ.'], 'c = 3.7, because the upper and lower bounds both round to 3.7 to 2 significant figures')}`,
    },
  ],
  mistakes: [
    'Writing the upper bound as 7.44 or 7.449 instead of 7.45.',
    'Using UB − UB to find the largest possible difference (it should be UB − LB).',
    'Using UB ÷ UB for the largest possible quotient.',
    'Treating truncation like rounding, e.g. giving 4.65 ≤ x &lt; 4.75 for a truncated 4.7.',
  ],
  examTips: [
    'Write down the bounds of every measurement first — this usually earns the first mark.',
    'For "suitable degree of accuracy", you must give a reason that mentions both bounds rounding to the same value.',
    'The speed and density formulae are not on the Edexcel formulae sheet; you need to know them.',
  ],
  realLife: 'Engineers use tolerances (bounds) so that parts fit together safely, and pharmacists consider the bounds of measured doses.',
  specRef: 'Edexcel 1MA1 N15, N16: error intervals from rounding and truncation; upper and lower bounds in calculations',
};

/* ------------------------------------------------------------------ */
C['y11-quadratic-formula'] = {
  overview: `<p>Not every quadratic factorises neatly. The <b>quadratic formula</b> solves <b>any</b> quadratic equation ax<sup>2</sup> + bx + c = 0. It gives answers as surds or rounded decimals, and the part under the square root — the <b>discriminant</b> — tells you how many solutions there are before you even start.</p>`,
  objectives: [
    'I can identify a, b and c in a quadratic equation written as ax<sup>2</sup> + bx + c = 0.',
    'I can use the quadratic formula to solve equations, giving decimals or exact surds.',
    'I can use the discriminant to decide how many real roots an equation has.',
    'I can rearrange harder equations into a quadratic before solving.',
  ],
  keyWords: [
    { term: 'Quadratic formula', def: 'x = ' + f('−b ± ' + sq('b<sup>2</sup> − 4ac'), '2a') + ', the solutions of ax<sup>2</sup> + bx + c = 0.' },
    { term: 'Discriminant', def: 'b<sup>2</sup> − 4ac; its sign tells you the number of real roots.' },
    { term: 'Real roots', def: 'Solutions that are real numbers, shown where a graph crosses the x-axis.' },
    { term: 'Exact form', def: 'An answer left with a surd, e.g. −2 ± ' + sq(11) + '.' },
  ],
  sections: [
    {
      title: 'The formula',
      html: `${rule('If ax<sup>2</sup> + bx + c = 0, then x = ' + f('−b ± ' + sq('b<sup>2</sup> − 4ac'), '2a'))}
<p>The ± sign means you do the calculation twice: once adding the square root and once subtracting it.</p>
${W('Solve x<sup>2</sup> + 4x − 7 = 0, giving answers to 2 decimal places.', ['a = 1, b = 4, c = −7.', 'b<sup>2</sup> − 4ac = 16 − 4(1)(−7) = 16 + 28 = 44.', 'x = ' + f('−4 ± ' + sq(44), 2) + '.', 'x = (−4 + 6.633…) ÷ 2 = 1.3166… or x = (−4 − 6.633…) ÷ 2 = −5.3166…'], 'x = 1.32 or x = −5.32')}
${note('In exact form: ' + sq(44) + ' = 2' + sq(11) + ', so x = −2 ± ' + sq(11) + '.')}`,
    },
    {
      title: 'Watch the signs',
      html: `${W('Solve 3x<sup>2</sup> − 5x − 1 = 0, giving answers to 3 significant figures.', ['a = 3, b = −5, c = −1.', '−b = 5 and b<sup>2</sup> = (−5)<sup>2</sup> = 25 (not −25).', 'b<sup>2</sup> − 4ac = 25 − 4(3)(−1) = 25 + 12 = 37.', 'x = ' + f('5 ± ' + sq(37), 6) + '.', '(5 + 6.0827…) ÷ 6 = 1.8471…; (5 − 6.0827…) ÷ 6 = −0.18046…'], 'x = 1.85 or x = −0.180')}
${note('Put negative values in brackets when using your calculator: (−5)<sup>2</sup>, not −5<sup>2</sup>.')}`,
    },
    {
      title: 'The discriminant',
      html: `${table(['b<sup>2</sup> − 4ac', 'Number of real roots', 'Graph'], [['Positive', '2', 'Crosses the x-axis twice'], ['Zero', '1 (repeated)', 'Touches the x-axis'], ['Negative', '0', 'Does not meet the x-axis']])}
${W('How many real roots does 2x<sup>2</sup> + 3x + 5 = 0 have?', ['b<sup>2</sup> − 4ac = 9 − 4(2)(5) = 9 − 40 = −31.', 'Negative, so you cannot square root it.'], 'No real roots')}`,
    },
    {
      title: 'Grade 9: rearranging first',
      html: `${W('Solve ' + f(2, 'x + 1') + ' + ' + f(3, 'x') + ' = 1. Give your answers in the form p ± ' + sq('q') + '.', ['Multiply every term by x(x + 1): 2x + 3(x + 1) = x(x + 1).', '5x + 3 = x<sup>2</sup> + x, so x<sup>2</sup> − 4x − 3 = 0.', 'a = 1, b = −4, c = −3: b<sup>2</sup> − 4ac = 16 + 12 = 28.', 'x = ' + f('4 ± ' + sq(28), 2) + ' = ' + f('4 ± 2' + sq(7), 2) + '.'], 'x = 2 ± ' + sq(7))}`,
    },
  ],
  mistakes: [
    'Dividing only the square root by 2a instead of the whole numerator.',
    'Squaring a negative b incorrectly on the calculator (typing −5<sup>2</sup> = −25).',
    'Not rearranging to = 0 before reading off a, b and c.',
    'Rounding the square root early and losing accuracy.',
  ],
  examTips: [
    'The quadratic formula is printed on the current Edexcel Higher formulae sheet — but you must still substitute carefully.',
    'Write the substituted formula in full before calculating; it secures the method mark.',
    'If the question asks for answers to a number of decimal places, the quadratic will not factorise — reach for the formula.',
  ],
  realLife: 'The quadratic formula is used to find when a projectile lands, to design curved bridges and to solve break-even problems in business.',
  specRef: 'Edexcel 1MA1 A18: solve quadratic equations using the quadratic formula',
};

/* ------------------------------------------------------------------ */
C['y11-completing-square'] = {
  overview: `<p><b>Completing the square</b> rewrites a quadratic like x<sup>2</sup> + 6x + 2 as (x + 3)<sup>2</sup> − 7. This form instantly reveals the <b>turning point</b> of the graph, lets you solve equations exactly, and can prove that an expression is always positive. It is also how the quadratic formula is derived.</p>`,
  objectives: [
    'I can write x<sup>2</sup> + bx + c in the form (x + p)<sup>2</sup> + q.',
    'I can complete the square when the coefficient of x<sup>2</sup> is not 1.',
    'I can find the turning point of a quadratic graph from completed square form.',
    'I can solve quadratic equations by completing the square.',
    'I can use completed square form to prove an expression is always positive.',
  ],
  keyWords: [
    { term: 'Completed square form', def: 'A quadratic written as a(x + p)<sup>2</sup> + q.' },
    { term: 'Turning point', def: 'The minimum or maximum point of a quadratic graph (its vertex).' },
    { term: 'Minimum point', def: 'The lowest point of a U-shaped graph.' },
    { term: 'Line of symmetry', def: 'The vertical line through the turning point, x = −p.' },
  ],
  sections: [
    {
      title: 'The method when a = 1',
      html: `${rule('x<sup>2</sup> + bx + c = (x + ' + f('b', 2) + ')<sup>2</sup> − (' + f('b', 2) + ')<sup>2</sup> + c')}
<p>Halve the coefficient of x to get the number in the bracket. Squaring the bracket adds an extra (${f('b', 2)})<sup>2</sup>, so subtract it.</p>
${W('Write x<sup>2</sup> + 6x + 2 in the form (x + p)<sup>2</sup> + q.', ['Half of 6 is 3: (x + 3)<sup>2</sup> = x<sup>2</sup> + 6x + 9.', 'That has 9 instead of 2, so subtract 9 and add 2.', '(x + 3)<sup>2</sup> − 9 + 2.'], '(x + 3)<sup>2</sup> − 7')}`,
    },
    {
      title: 'Turning points',
      html: `${rule('y = (x + p)<sup>2</sup> + q has turning point (−p, q)')}
${W('Find the turning point of y = x<sup>2</sup> + 6x + 2.', ['Completed square form: y = (x + 3)<sup>2</sup> − 7.', 'The squared bracket is never negative, so the smallest y is when x + 3 = 0, i.e. x = −3.', 'Then y = 0 − 7 = −7.'], 'Minimum point (−3, −7)')}
${note('Watch the sign: (x + 3)<sup>2</sup> gives x = −3, not +3.')}`,
    },
    {
      title: 'Solving equations',
      html: `${W('Solve x<sup>2</sup> + 6x + 2 = 0, giving exact answers.', ['(x + 3)<sup>2</sup> − 7 = 0.', '(x + 3)<sup>2</sup> = 7.', 'x + 3 = ±' + sq(7) + '.'], 'x = −3 + ' + sq(7) + ' or x = −3 − ' + sq(7))}
${W('Prove that x<sup>2</sup> − 4x + 7 is always positive.', ['x<sup>2</sup> − 4x + 7 = (x − 2)<sup>2</sup> − 4 + 7 = (x − 2)<sup>2</sup> + 3.', '(x − 2)<sup>2</sup> ≥ 0 for every x, because a square is never negative.', 'So (x − 2)<sup>2</sup> + 3 ≥ 3 &gt; 0.'], 'The expression is always at least 3, so it is always positive')}`,
    },
    {
      title: 'When a ≠ 1 (grade 8–9)',
      html: `<p>Factor the coefficient of x<sup>2</sup> out of the first two terms only, complete the square inside, then expand the outer bracket.</p>
${W('Write 2x<sup>2</sup> − 8x + 5 in the form a(x + p)<sup>2</sup> + q, and state the turning point.', ['Take out 2: 2(x<sup>2</sup> − 4x) + 5.', 'Complete the square inside: x<sup>2</sup> − 4x = (x − 2)<sup>2</sup> − 4.', '2[(x − 2)<sup>2</sup> − 4] + 5 = 2(x − 2)<sup>2</sup> − 8 + 5.'], '2(x − 2)<sup>2</sup> − 3; turning point (2, −3)')}
${W('Write 3 + 4x − x<sup>2</sup> in the form a − (x + b)<sup>2</sup>, and give the maximum point of y = 3 + 4x − x<sup>2</sup>.', ['Rearrange: −(x<sup>2</sup> − 4x) + 3.', 'x<sup>2</sup> − 4x = (x − 2)<sup>2</sup> − 4, so −[(x − 2)<sup>2</sup> − 4] + 3.', '= −(x − 2)<sup>2</sup> + 4 + 3 = 7 − (x − 2)<sup>2</sup>.'], '7 − (x − 2)<sup>2</sup>; maximum point (2, 7)')}`,
    },
  ],
  mistakes: [
    'Forgetting to subtract (' + f('b', 2) + ')<sup>2</sup> after writing the bracket.',
    'Giving the turning point as (3, −7) instead of (−3, −7).',
    'Forgetting ± when square rooting both sides, so losing one solution.',
    'When a ≠ 1, forgetting to multiply the subtracted number by a.',
  ],
  examTips: [
    'Expand your answer to check it gives the original expression.',
    'Completing the square is not on the Edexcel formulae sheet (only the quadratic formula is), so learn the "halve b" rule.',
    'If a question asks for a turning point and has just asked you to complete the square, use that answer — do not start again.',
  ],
  realLife: 'Completing the square is used to find the maximum height of a projectile, the minimum cost in a business model and the vertex of a satellite dish curve.',
  specRef: 'Edexcel 1MA1 A11, A18: identify turning points by completing the square; solve quadratics by completing the square',
};

/* ------------------------------------------------------------------ */
C['y11-sine-cosine-rule'] = {
  overview: `<p>SOH CAH TOA only works in right-angled triangles. The <b>sine rule</b> and <b>cosine rule</b> work in <b>any</b> triangle. The trick is choosing the right one: the sine rule needs a side with its opposite angle; the cosine rule is for two sides and the angle between them, or for three sides.</p>`,
  objectives: [
    'I can label a triangle with sides a, b, c opposite angles A, B, C.',
    'I can use the sine rule to find a missing side or angle.',
    'I can use the cosine rule to find a missing side or angle.',
    'I can decide which rule to use from the information given.',
    'I can apply the rules to bearings and multi-step problems.',
  ],
  keyWords: [
    { term: 'Sine rule', def: f('a', 'sin A') + ' = ' + f('b', 'sin B') + ' = ' + f('c', 'sin C') + '.' },
    { term: 'Cosine rule', def: 'a<sup>2</sup> = b<sup>2</sup> + c<sup>2</sup> − 2bc cos A.' },
    { term: 'Opposite pair', def: 'A side and the angle directly across from it, e.g. a and A.' },
    { term: 'Included angle', def: 'The angle between two given sides.' },
    { term: 'Obtuse angle', def: 'An angle between 90° and 180°; its cosine is negative.' },
  ],
  sections: [
    {
      title: 'Labelling and choosing a rule',
      html: `<svg viewBox="0 0 260 160" width="100%" style="max-width:300px" role="img" aria-label="Triangle ABC with side a opposite A, b opposite B, c opposite C">
<polygon points="30,135 230,135 90,25" fill="none" stroke="currentColor" stroke-width="2"/>
<g fill="currentColor" font-size="14"><text x="16" y="148">A</text><text x="234" y="148">B</text><text x="84" y="18">C</text></g>
<g fill="#3b6cf6" font-size="14" font-style="italic"><text x="166" y="76">a</text><text x="48" y="78">b</text><text x="126" y="153">c</text></g>
</svg>
${rule('Lower-case side a is opposite capital angle A, and so on.')}
${table(['You know…', 'Use'], [['A side and its opposite angle, plus one more side or angle', 'Sine rule'], ['Two sides and the angle between them (find the third side)', 'Cosine rule'], ['All three sides (find an angle)', 'Cosine rule']])}
${W('In triangle PQR you know PQ = 8 cm, QR = 11 cm and angle Q = 63°. You want PR. Which rule?', ['Is there a side with its opposite angle? Angle Q is opposite PR, which is unknown — so no complete pair.', 'You have two sides and the angle between them.'], 'Cosine rule')}`,
    },
    {
      title: 'The sine rule',
      html: `${rule(f('a', 'sin A') + ' = ' + f('b', 'sin B') + ' = ' + f('c', 'sin C') + ' &nbsp;&nbsp; or, for angles, &nbsp;&nbsp; ' + f('sin A', 'a') + ' = ' + f('sin B', 'b') + ' = ' + f('sin C', 'c'))}
${W('In triangle ABC, A = 40°, B = 65° and a = 8 cm. Find b.', [f(8, 'sin 40°') + ' = ' + f('b', 'sin 65°') + '.', 'b = ' + f('8 sin 65°', 'sin 40°') + ' = 11.279…'], '11.3 cm (3 s.f.)')}
${W('In triangle ABC, a = 9 cm, b = 7 cm and A = 72°. Find angle B.', [f('sin B', 7) + ' = ' + f('sin 72°', 9) + '.', 'sin B = ' + f('7 sin 72°', 9) + ' = 0.7397…', 'B = sin<sup>−1</sup>(0.7397…) = 47.706…°'], '47.7° (1 d.p.)')}
${note('Put the unknown on the top: use the "sides on top" version to find a side and the "sines on top" version to find an angle.')}`,
    },
    {
      title: 'The cosine rule',
      html: `${rule('a<sup>2</sup> = b<sup>2</sup> + c<sup>2</sup> − 2bc cos A &nbsp;&nbsp; or &nbsp;&nbsp; cos A = ' + f('b<sup>2</sup> + c<sup>2</sup> − a<sup>2</sup>', '2bc'))}
${W('In triangle ABC, b = 7 cm, c = 10 cm and A = 50°. Find a.', ['a<sup>2</sup> = 7<sup>2</sup> + 10<sup>2</sup> − 2 × 7 × 10 × cos 50°.', 'a<sup>2</sup> = 49 + 100 − 140 cos 50° = 59.010…', 'a = ' + sq('59.010…') + ' = 7.681…'], '7.68 cm (3 s.f.)')}
${W('A triangle has sides 5 cm, 7 cm and 9 cm. Find its largest angle.', ['The largest angle is opposite the longest side (9 cm), so call that a.', 'cos A = ' + f('5<sup>2</sup> + 7<sup>2</sup> − 9<sup>2</sup>', '2 × 5 × 7') + ' = ' + f('25 + 49 − 81', 70) + ' = ' + f('−7', 70) + ' = −0.1.', 'A = cos<sup>−1</sup>(−0.1) = 95.739…°'], '95.7° (1 d.p.)')}
${note('A negative cosine means the angle is obtuse — that is fine.')}`,
    },
    {
      title: 'Bearings problem (grade 8)',
      html: `${W('A ship sails 12 km on a bearing of 040°, then 8 km on a bearing of 110°. How far is it from its starting point?', ['Sketch: at the turning point, the north line is parallel to the start\'s north line, so the angle back to the start (bearing 220°) and the new direction (110°) make an angle of 220° − 110° = 110°.', 'Two sides (12 and 8) with the included angle 110° → cosine rule.', 'd<sup>2</sup> = 12<sup>2</sup> + 8<sup>2</sup> − 2 × 12 × 8 × cos 110° = 144 + 64 − 192 cos 110° = 273.67…', 'd = ' + sq('273.67…') + ' = 16.542…'], '16.5 km (3 s.f.)')}`,
    },
  ],
  mistakes: [
    'Using the sine rule when there is no known side–angle opposite pair.',
    'Calculating b<sup>2</sup> + c<sup>2</sup> − 2bc and then multiplying by cos A (do 2bc cos A first, or type it all in one go).',
    'Forgetting to square root at the end of a cosine rule side calculation.',
    'Mismatching sides and angles — side a must be opposite angle A.',
  ],
  examTips: [
    'The sine rule and the cosine rule are both printed on the current Edexcel Higher formulae sheet, so focus on choosing and substituting correctly.',
    'Label the triangle a, b, c and A, B, C to match the formula before you substitute.',
    'Keep unrounded values in your calculator (use ANS) in multi-step problems.',
  ],
  realLife: 'Surveyors, navigators and engineers use the sine and cosine rules to calculate distances across rivers, flight paths and the lengths of roof trusses.',
  specRef: 'Edexcel 1MA1 G22: know and apply the sine rule and cosine rule to find unknown lengths and angles',
};

/* ------------------------------------------------------------------ */
C['y11-area-sine'] = {
  overview: `<p>You already know area = ${f(1, 2)} × base × height. When you do not know the perpendicular height, but you do know <b>two sides and the angle between them</b>, you can use the formula ${f(1, 2)}ab sin C instead. It works for any triangle and is the key to finding the area of a <b>segment</b> of a circle.</p>`,
  objectives: [
    'I can find the area of any triangle using ' + f(1, 2) + 'ab sin C.',
    'I can identify the included angle between two known sides.',
    'I can work backwards from an area to find a side or an angle.',
    'I can find the area of a segment of a circle.',
  ],
  keyWords: [
    { term: 'Included angle', def: 'The angle between the two sides you are using.' },
    { term: 'Perpendicular height', def: 'The height measured at right angles to the base.' },
    { term: 'Segment', def: 'The region of a circle between a chord and an arc.' },
    { term: 'Sector', def: 'The region of a circle between two radii and an arc.' },
  ],
  sections: [
    {
      title: 'The formula',
      html: `${rule('Area = ' + f(1, 2) + 'ab sin C &nbsp;&nbsp; where C is the angle between sides a and b')}
<p>This comes from ${f(1, 2)} × base × height: the perpendicular height of the triangle is b sin C, so the area is ${f(1, 2)} × a × b sin C.</p>
${W('A triangle has sides 8 cm and 11 cm with an angle of 42° between them. Find its area.', ['Area = ' + f(1, 2) + ' × 8 × 11 × sin 42°.', '= 44 × sin 42° = 29.441…'], '29.4 cm<sup>2</sup> (3 s.f.)')}
${W('Non-calculator: find the area of a triangle with sides 6 cm and 10 cm and an included angle of 30°.', ['sin 30° = ' + f(1, 2) + '.', 'Area = ' + f(1, 2) + ' × 6 × 10 × ' + f(1, 2) + ' = 15.'], '15 cm<sup>2</sup>')}`,
    },
    {
      title: 'Working backwards',
      html: `${W('A triangle has area 30 cm<sup>2</sup>. Two sides are 8 cm and x cm with an included angle of 50°. Find x.', ['30 = ' + f(1, 2) + ' × 8 × x × sin 50°, so 30 = 4x sin 50°.', 'x = ' + f(30, '4 sin 50°') + ' = 9.790…'], '9.79 cm (3 s.f.)')}
${W('A triangle has sides 9 cm and 12 cm and area 40 cm<sup>2</sup>. Find the acute angle between those sides.', ['40 = ' + f(1, 2) + ' × 9 × 12 × sin C = 54 sin C.', 'sin C = ' + f(40, 54) + ' = 0.7407…', 'C = sin<sup>−1</sup>(0.7407…) = 47.79…°'], '47.8° (1 d.p.)')}
${note('There is also an obtuse angle with the same sine: 180° − 47.8° = 132.2°. Use any information in the question to decide which one is meant.')}`,
    },
    {
      title: 'Area of a segment (grade 8–9)',
      html: `<svg viewBox="0 0 200 200" width="100%" style="max-width:220px" role="img" aria-label="Circle with a shaded segment cut off by a chord">
<path d="M180 100 A80 80 0 0 0 113.9 21.2 Z" fill="#3b6cf6" fill-opacity="0.4"/>
<circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="1.5"><line x1="100" y1="100" x2="180" y2="100"/><line x1="100" y1="100" x2="113.9" y2="21.2"/><line x1="180" y1="100" x2="113.9" y2="21.2"/></g>
<g fill="currentColor" font-size="12"><text x="110" y="92">80°</text><text x="135" y="116">6 cm</text></g>
</svg>
${rule('Segment area = sector area − triangle area')}
${W('A circle has radius 6 cm. A chord makes an angle of 80° at the centre. Find the area of the minor segment.', ['Sector: ' + f(80, 360) + ' × π × 6<sup>2</sup> = 8π = 25.132…', 'Triangle: ' + f(1, 2) + ' × 6 × 6 × sin 80° = 18 sin 80° = 17.726…', 'Segment: 25.132… − 17.726… = 7.406…'], '7.41 cm<sup>2</sup> (3 s.f.)')}`,
    },
  ],
  mistakes: [
    'Using an angle that is not between the two sides.',
    'Forgetting the ' + f(1, 2) + ' at the start of the formula.',
    'Having the calculator in radians rather than degrees.',
    'For a segment, adding the triangle to the sector instead of subtracting it.',
  ],
  examTips: [
    'Area = ' + f(1, 2) + 'ab sin C is on the current Edexcel Higher formulae sheet; the formula for the area of a sector is not.',
    'Look for the "two sides and the angle between them" pattern — that is the signal to use this formula.',
    'Keep full calculator values when subtracting to find a segment, and round only at the end.',
  ],
  realLife: 'Land surveyors use ' + f(1, 2) + 'ab sin C to find the area of irregular plots by splitting them into triangles.',
  specRef: 'Edexcel 1MA1 G23: know and apply Area = ½ab sin C to calculate the area, sides or angles of any triangle',
};

/* ------------------------------------------------------------------ */
C['y11-rationalising'] = {
  overview: `<p>Mathematicians prefer not to leave a surd on the bottom of a fraction. <b>Rationalising the denominator</b> means rewriting the fraction so the denominator is a whole number. You multiply top and bottom by a clever choice of surd — which does not change the value, because you are really multiplying by 1.</p>`,
  objectives: [
    'I can rationalise a denominator of the form ' + sq('a') + ' or b' + sq('a') + '.',
    'I can rationalise a denominator of the form a ± ' + sq('b') + ' using its conjugate.',
    'I can simplify the result fully.',
    'I can use rationalising within longer exact calculations.',
  ],
  keyWords: [
    { term: 'Rational number', def: 'A number that can be written as a fraction of two integers.' },
    { term: 'Rationalise', def: 'Remove surds from the denominator of a fraction.' },
    { term: 'Conjugate', def: 'The same two terms with the sign between them swapped, e.g. 3 − ' + sq(5) + ' for 3 + ' + sq(5) + '.' },
    { term: 'Surd', def: 'An irrational root, such as ' + sq(3) + '.' },
  ],
  sections: [
    {
      title: 'Single surd on the bottom',
      html: `${rule('Multiply top and bottom by the surd: ' + f('a', sq('b')) + ' = ' + f('a' + sq('b'), 'b'))}
${W('Rationalise ' + f(6, sq(3)) + '.', ['Multiply top and bottom by ' + sq(3) + ': ' + f('6' + sq(3), 3) + '.', 'Simplify: 6 ÷ 3 = 2.'], '2' + sq(3))}
${W('Rationalise ' + f(5, '2' + sq(10)) + '.', ['Multiply top and bottom by ' + sq(10) + ' (the 2 is already rational).', 'Bottom: 2' + sq(10) + ' × ' + sq(10) + ' = 2 × 10 = 20.', f('5' + sq(10), 20) + ' = ' + f(sq(10), 4) + '.'], f(sq(10), 4))}`,
    },
    {
      title: 'Using the conjugate',
      html: `<p>For a denominator like 3 + ${sq(5)}, multiply by the <b>conjugate</b> 3 − ${sq(5)}. The difference of two squares removes the surd: (3 + ${sq(5)})(3 − ${sq(5)}) = 9 − 5 = 4.</p>
${rule('(a + ' + sq('b') + ')(a − ' + sq('b') + ') = a<sup>2</sup> − b')}
${W('Rationalise ' + f(4, '3 + ' + sq(5)) + '.', ['Multiply top and bottom by 3 − ' + sq(5) + '.', 'Top: 4(3 − ' + sq(5) + ').', 'Bottom: 9 − 5 = 4.', f('4(3 − ' + sq(5) + ')', 4) + ' = 3 − ' + sq(5) + '.'], '3 − ' + sq(5))}`,
    },
    {
      title: 'Grade 9: surds on top and bottom',
      html: `${W('Write ' + f('2 + ' + sq(3), '2 − ' + sq(3)) + ' in the form a + b' + sq(3) + '.', ['Multiply top and bottom by the conjugate 2 + ' + sq(3) + '.', 'Top: (2 + ' + sq(3) + ')<sup>2</sup> = 4 + 4' + sq(3) + ' + 3 = 7 + 4' + sq(3) + '.', 'Bottom: 4 − 3 = 1.'], '7 + 4' + sq(3))}
${W('A rectangle has area 12 cm<sup>2</sup> and width (1 + ' + sq(3) + ') cm. Find its length in the form a + b' + sq(3) + '.', ['Length = ' + f(12, '1 + ' + sq(3)) + '.', 'Multiply by ' + f('1 − ' + sq(3), '1 − ' + sq(3)) + ': bottom = 1 − 3 = −2.', 'Top: 12 − 12' + sq(3) + '. So length = ' + f('12 − 12' + sq(3), '−2') + ' = −6 + 6' + sq(3) + '.'], '(−6 + 6' + sq(3) + ') cm, about 4.39 cm')}
${note('A negative-looking answer can still be positive: −6 + 6' + sq(3) + ' ≈ 4.39 because 6' + sq(3) + ' ≈ 10.39.')}`,
    },
  ],
  mistakes: [
    'Multiplying only the denominator, which changes the value of the fraction.',
    'Multiplying by the same bracket (3 + ' + sq(5) + ') instead of the conjugate.',
    'Expanding (2 + ' + sq(3) + ')<sup>2</sup> as 4 + 3 and missing the middle terms.',
    'Not simplifying at the end, e.g. leaving ' + f('6' + sq(3), 3) + '.',
  ],
  examTips: [
    'These questions are on the non-calculator paper; show the multiplication by "' + f(sq(3), sq(3)) + '" clearly.',
    'If asked for the form a + b' + sq('c') + ', make sure your final line looks exactly like that.',
    'No surd rules appear on the Edexcel formulae sheet.',
  ],
  realLife: 'Rationalising keeps exact values tidy in engineering and physics, for example when working with ' + f(1, sq(2)) + ' in AC electricity calculations.',
  specRef: 'Edexcel 1MA1 N8: simplify surd expressions involving squares and rationalise denominators',
};

/* ------------------------------------------------------------------ */
C['y11-functions'] = {
  overview: `<p>A <b>function</b> is a rule that takes an input and produces exactly one output. Function notation, such as f(x) = 3x − 2, is a short way of writing these rules. You will evaluate functions, combine them into <b>composite functions</b> like fg(x), and reverse them with <b>inverse functions</b> f<sup>−1</sup>(x).</p>`,
  objectives: [
    'I can use function notation to find outputs, such as f(4).',
    'I can solve equations such as f(x) = 13.',
    'I can find and use composite functions such as fg(x).',
    'I can find the inverse of a function, f<sup>−1</sup>(x).',
  ],
  keyWords: [
    { term: 'Function', def: 'A rule that maps each input to exactly one output.' },
    { term: 'f(x)', def: 'The output of function f when the input is x.' },
    { term: 'Composite function', def: 'One function applied to the output of another; fg(x) means do g first, then f.' },
    { term: 'Inverse function', def: 'f<sup>−1</sup>(x), the function that undoes f.' },
  ],
  sections: [
    {
      title: 'Function notation',
      html: `<p>For f(x) = 3x − 2 and g(x) = x<sup>2</sup> + 1, replace x with the input everywhere it appears.</p>
${W('Find f(4) and g(−3).', ['f(4) = 3 × 4 − 2 = 10.', 'g(−3) = (−3)<sup>2</sup> + 1 = 9 + 1 = 10.'], 'f(4) = 10, g(−3) = 10')}
${W('Solve f(x) = 13.', ['3x − 2 = 13.', '3x = 15.'], 'x = 5')}
${note('f(x) does not mean f multiplied by x — it means "f of x".')}`,
    },
    {
      title: 'Composite functions',
      html: `${rule('fg(x) = f(g(x)): apply g first, then f')}
${W('Find fg(2) and gf(2).', ['fg(2): g(2) = 4 + 1 = 5, then f(5) = 15 − 2 = 13.', 'gf(2): f(2) = 6 − 2 = 4, then g(4) = 16 + 1 = 17.'], 'fg(2) = 13, gf(2) = 17')}
${W('Find expressions for fg(x) and gf(x).', ['fg(x) = f(x<sup>2</sup> + 1) = 3(x<sup>2</sup> + 1) − 2 = 3x<sup>2</sup> + 1.', 'gf(x) = g(3x − 2) = (3x − 2)<sup>2</sup> + 1 = 9x<sup>2</sup> − 12x + 4 + 1.'], 'fg(x) = 3x<sup>2</sup> + 1, gf(x) = 9x<sup>2</sup> − 12x + 5')}
${W('Solve fg(x) = 49.', ['3x<sup>2</sup> + 1 = 49, so 3x<sup>2</sup> = 48 and x<sup>2</sup> = 16.'], 'x = 4 or x = −4')}
${note('fg(x) and gf(x) are usually different — the order matters.')}`,
    },
    {
      title: 'Inverse functions',
      html: `<ol><li>Write y = f(x).</li><li>Rearrange to make x the subject.</li><li>Swap y for x to write f<sup>−1</sup>(x).</li></ol>
${W('Find f<sup>−1</sup>(x) when f(x) = 3x − 2.', ['y = 3x − 2.', 'y + 2 = 3x, so x = ' + f('y + 2', 3) + '.'], 'f<sup>−1</sup>(x) = ' + f('x + 2', 3))}
${note('Check: f(4) = 10 and f<sup>−1</sup>(10) = ' + f(12, 3) + ' = 4 ✓ — the inverse takes you back.')}
${W('Grade 9: find h<sup>−1</sup>(x) when h(x) = ' + f('2x + 1', 'x − 3') + '.', ['y = ' + f('2x + 1', 'x − 3') + ', so y(x − 3) = 2x + 1.', 'xy − 3y = 2x + 1, so xy − 2x = 3y + 1.', 'x(y − 2) = 3y + 1, so x = ' + f('3y + 1', 'y − 2') + '.'], 'h<sup>−1</sup>(x) = ' + f('3x + 1', 'x − 2'))}`,
    },
  ],
  mistakes: [
    'Doing composite functions in the wrong order — in fg(x), g is applied first.',
    'Writing f<sup>−1</sup>(x) as ' + f(1, 'f(x)') + '.',
    'Forgetting brackets when substituting an expression, e.g. writing 3x<sup>2</sup> + 1 − 2 for f(x<sup>2</sup> + 1).',
    'Leaving the inverse in terms of y instead of x.',
  ],
  examTips: [
    'Check an inverse by putting a number through f and then through f<sup>−1</sup>.',
    'For composite functions, write the inner function in brackets first: f(x<sup>2</sup> + 1).',
    'Nothing for functions is given on the Edexcel formulae sheet.',
  ],
  realLife: 'Functions are the building blocks of computer programming and spreadsheets, and inverse functions are used in encryption and currency conversion.',
  specRef: 'Edexcel 1MA1 A7: function notation, composite functions and inverse functions',
};

/* ------------------------------------------------------------------ */
C['y11-iteration'] = {
  overview: `<p>Some equations, such as x<sup>3</sup> + 4x − 1 = 0, cannot be solved with algebra you know. <b>Iteration</b> finds an approximate solution by repeating a formula: each output is fed back in as the next input, and the values home in on a root. A <b>change of sign</b> shows that a root lies in a given interval.</p>`,
  objectives: [
    'I can show that an equation has a root between two values using a change of sign.',
    'I can rearrange an equation into the form x = g(x).',
    'I can use an iterative formula x<sub>n+1</sub> = g(x<sub>n</sub>) to find successive approximations.',
    'I can find a solution to a given degree of accuracy and justify it.',
  ],
  keyWords: [
    { term: 'Iteration', def: 'Repeating a process, using each answer as the next input.' },
    { term: 'Iterative formula', def: 'A formula of the form x<sub>n+1</sub> = g(x<sub>n</sub>).' },
    { term: 'x<sub>0</sub>, x<sub>1</sub>, x<sub>2</sub>', def: 'The starting value and the successive approximations.' },
    { term: 'Converge', def: 'When iterations get closer and closer to a single value.' },
    { term: 'Root', def: 'A solution of an equation f(x) = 0.' },
  ],
  sections: [
    {
      title: 'Change of sign',
      html: `<p>If a continuous expression is negative at one value of x and positive at another, it must pass through zero in between — so there is a root there.</p>
${W('Show that x<sup>3</sup> + 4x − 1 = 0 has a solution between x = 0 and x = 1.', ['When x = 0: 0 + 0 − 1 = −1 (negative).', 'When x = 1: 1 + 4 − 1 = 4 (positive).'], 'There is a change of sign, so there is a solution between 0 and 1')}`,
    },
    {
      title: 'Rearranging to x = g(x)',
      html: `${W('Show that x<sup>3</sup> + 4x − 1 = 0 can be rearranged to x = ' + f('1 − x<sup>3</sup>', 4) + '.', ['Start: x<sup>3</sup> + 4x − 1 = 0.', 'Move the other terms: 4x = 1 − x<sup>3</sup>.', 'Divide by 4: x = ' + f('1 − x<sup>3</sup>', 4) + '.'], 'Shown')}
${note('An equation can usually be rearranged in several ways. The exam question tells you which form to use.')}`,
    },
    {
      title: 'Using the iterative formula',
      html: `${W('Use x<sub>n+1</sub> = ' + f('1 − (x<sub>n</sub>)<sup>3</sup>', 4) + ' with x<sub>0</sub> = 0 to find x<sub>1</sub>, x<sub>2</sub> and x<sub>3</sub>.', ['x<sub>1</sub> = (1 − 0<sup>3</sup>) ÷ 4 = 0.25.', 'x<sub>2</sub> = (1 − 0.25<sup>3</sup>) ÷ 4 = 0.24609375.', 'x<sub>3</sub> = (1 − 0.24609375<sup>3</sup>) ÷ 4 = 0.246274…'], 'x<sub>1</sub> = 0.25, x<sub>2</sub> = 0.2461 (4 d.p.), x<sub>3</sub> = 0.2463 (4 d.p.)')}
${note('Calculator trick: type 0, press =, then type (1 − ANS<sup>3</sup>) ÷ 4 and press = repeatedly. Each press gives the next iteration.')}`,
    },
    {
      title: 'Justifying the accuracy (grade 9)',
      html: `<p>Further iterations give 0.246266, 0.246266… so the root appears to be 0.246 to 3 d.p. To prove it, check the sign at the bounds 0.2455 and 0.2465.</p>
${W('Show that the solution is 0.246 correct to 3 decimal places.', ['Let f(x) = x<sup>3</sup> + 4x − 1.', 'f(0.2455) = −0.0032… (negative).', 'f(0.2465) = 0.00097… (positive).', 'There is a change of sign, so the root lies between 0.2455 and 0.2465.'], 'Every value in that interval rounds to 0.246, so the root is 0.246 to 3 d.p.')}`,
    },
  ],
  mistakes: [
    'Rounding each iteration before feeding it back in — always use the full calculator value.',
    'Starting from the wrong x<sub>0</sub> or confusing x<sub>1</sub> with x<sub>0</sub>.',
    'Saying "there is a change of sign" without showing both substituted values.',
    'Concluding without the final statement linking the sign change to a root.',
  ],
  examTips: [
    'Write down each iteration to at least 4 or 5 decimal places so the examiner can follow your values.',
    'In "show that" questions, finish with a sentence: "there is a change of sign, so there is a root between …".',
    'No iteration formulae are on the Edexcel formulae sheet — the question always gives the formula to use.',
  ],
  realLife: 'Computers and calculators use iteration to solve equations in weather forecasting, engineering design and finding square roots.',
  specRef: 'Edexcel 1MA1 A20: find approximate solutions to equations numerically using iteration',
};

/* ------------------------------------------------------------------ */
C['y11-algebraic-fractions'] = {
  overview: `<p>Algebraic fractions follow exactly the same rules as number fractions: you simplify by cancelling common factors, multiply tops and bottoms, flip and multiply to divide, and use a common denominator to add or subtract. The extra skill is <b>factorising</b> first so you can see what cancels.</p>`,
  objectives: [
    'I can simplify algebraic fractions by factorising and cancelling.',
    'I can multiply and divide algebraic fractions.',
    'I can add and subtract algebraic fractions using a common denominator.',
    'I can solve equations that contain algebraic fractions.',
  ],
  keyWords: [
    { term: 'Algebraic fraction', def: 'A fraction whose numerator or denominator contains a variable.' },
    { term: 'Common factor', def: 'A factor (number, letter or bracket) shared by the numerator and denominator.' },
    { term: 'Common denominator', def: 'A denominator that both fractions can be written over.' },
    { term: 'Simplest form', def: 'A fraction with no common factors left between top and bottom.' },
  ],
  sections: [
    {
      title: 'Simplifying',
      html: `<p>Factorise the numerator and the denominator fully, then cancel <b>whole brackets</b> or factors that appear on both.</p>
${W('Simplify ' + f('x<sup>2</sup> + 5x + 6', 'x<sup>2</sup> − 9') + '.', ['Top: (x + 2)(x + 3). Bottom (difference of two squares): (x + 3)(x − 3).', 'Cancel the common bracket (x + 3).'], f('x + 2', 'x − 3'))}
${W('Grade 9: simplify ' + f('2x<sup>2</sup> + 5x − 3', '4x<sup>2</sup> − 1') + '.', ['Top: ac = −6, numbers 6 and −1: 2x<sup>2</sup> + 6x − x − 3 = 2x(x + 3) − 1(x + 3) = (2x − 1)(x + 3).', 'Bottom: (2x + 1)(2x − 1).', 'Cancel (2x − 1).'], f('x + 3', '2x + 1'))}
${note('You can only cancel factors, never individual terms: in ' + f('x + 2', 'x + 5') + ' nothing cancels.')}`,
    },
    {
      title: 'Multiplying and dividing',
      html: `${rule('Multiply: tops × tops, bottoms × bottoms. Divide: flip the second fraction and multiply.')}
${W('Simplify ' + f('2x', 'x + 1') + ' × ' + f('x<sup>2</sup> − 1', '4x<sup>2</sup>') + '.', ['Factorise: x<sup>2</sup> − 1 = (x + 1)(x − 1).', f('2x(x + 1)(x − 1)', '(x + 1) × 4x<sup>2</sup>') + '.', 'Cancel (x + 1) and 2x.'], f('x − 1', '2x'))}
${W('Simplify ' + f('x + 4', 3) + ' ÷ ' + f('x<sup>2</sup> + 4x', 6) + '.', ['Flip and multiply: ' + f('x + 4', 3) + ' × ' + f(6, 'x(x + 4)') + '.', 'Cancel (x + 4) and 3.'], f(2, 'x'))}`,
    },
    {
      title: 'Adding and subtracting',
      html: `${W('Write ' + f(3, 'x + 2') + ' + ' + f(2, 'x − 1') + ' as a single fraction.', ['Common denominator: (x + 2)(x − 1).', 'Numerator: 3(x − 1) + 2(x + 2) = 3x − 3 + 2x + 4 = 5x + 1.'], f('5x + 1', '(x + 2)(x − 1)'))}
${W('Write ' + f('x', 'x − 3') + ' − ' + f(2, 'x + 1') + ' as a single fraction.', ['Common denominator: (x − 3)(x + 1).', 'Numerator: x(x + 1) − 2(x − 3) = x<sup>2</sup> + x − 2x + 6 = x<sup>2</sup> − x + 6.'], f('x<sup>2</sup> − x + 6', '(x − 3)(x + 1)'))}
${note('Put the second numerator in brackets when subtracting: −2(x − 3) = −2x + 6.')}`,
    },
    {
      title: 'Solving equations (grade 8–9)',
      html: `${W('Solve ' + f(5, 'x + 2') + ' + ' + f(3, 'x') + ' = 2.', ['Multiply every term by x(x + 2): 5x + 3(x + 2) = 2x(x + 2).', '8x + 6 = 2x<sup>2</sup> + 4x, so 2x<sup>2</sup> − 4x − 6 = 0.', 'Divide by 2: x<sup>2</sup> − 2x − 3 = 0, so (x − 3)(x + 1) = 0.', 'Check x = 3: ' + f(5, 5) + ' + ' + f(3, 3) + ' = 2 ✓'], 'x = 3 or x = −1')}`,
    },
  ],
  mistakes: [
    'Cancelling terms instead of factors, e.g. crossing out the x in ' + f('x + 2', 'x + 5') + '.',
    'Forgetting to flip the second fraction when dividing.',
    'Adding numerators and denominators separately.',
    'Sign errors when subtracting the second fraction.',
  ],
  examTips: [
    'Factorise everything first — most simplification questions are really factorising questions.',
    'In equations, multiply every term (including the right-hand side) by the common denominator.',
    'Nothing for algebraic fractions is on the Edexcel formulae sheet.',
  ],
  realLife: 'Algebraic fractions appear in physics formulae for lenses and resistors in parallel, where ' + f(1, 'R') + ' = ' + f(1, 'R<sub>1</sub>') + ' + ' + f(1, 'R<sub>2</sub>') + '.',
  specRef: 'Edexcel 1MA1 A4, A6: simplify, add, subtract, multiply and divide algebraic fractions; solve equations involving them',
};

/* ------------------------------------------------------------------ */
C['y11-volume-spheres-cones'] = {
  overview: `<p>Prisms have a constant cross-section, but <b>pyramids, cones and spheres</b> do not. They have their own formulae for volume and surface area. You need to use these accurately, give exact answers in terms of π, and solve harder problems such as frustums, composite solids and melting one shape into another.</p>`,
  objectives: [
    'I can find the volume of a pyramid and a cone.',
    'I can find the volume and surface area of a sphere and a hemisphere.',
    'I can find the curved surface area of a cone, using Pythagoras for the slant height.',
    'I can solve problems with composite solids and frustums (Higher).',
    'I can work backwards from a volume to find a length.',
  ],
  keyWords: [
    { term: 'Pyramid', def: 'A solid with a polygon base and triangular faces meeting at a point (apex).' },
    { term: 'Cone', def: 'A solid with a circular base and a curved surface meeting at an apex.' },
    { term: 'Sphere', def: 'A perfectly round 3D shape; every point on its surface is the same distance from the centre.' },
    { term: 'Slant height (l)', def: 'The distance from the apex of a cone to the edge of its base, along the surface.' },
    { term: 'Frustum', def: 'The solid left when the top of a cone or pyramid is cut off parallel to its base.' },
  ],
  sections: [
    {
      title: 'Pyramids and cones',
      html: `${rule('Volume of a pyramid = ' + f(1, 3) + ' × base area × height<br>Volume of a cone = ' + f(1, 3) + 'πr<sup>2</sup>h &nbsp;&nbsp; Curved surface area of a cone = πrl')}
${W('A pyramid has a square base of side 10 cm and a perpendicular height of 12 cm. Find its volume.', ['Base area: 10 × 10 = 100 cm<sup>2</sup>.', 'Volume: ' + f(1, 3) + ' × 100 × 12 = 400.'], '400 cm<sup>3</sup>')}
${W('A cone has radius 4 cm and height 9 cm. Find its volume in terms of π.', [f(1, 3) + ' × π × 4<sup>2</sup> × 9 = ' + f(1, 3) + ' × 144π = 48π.'], '48π cm<sup>3</sup> (≈ 150.8 cm<sup>3</sup>)')}
${W('A cone has radius 5 cm and height 12 cm. Find its total surface area in terms of π.', ['Slant height by Pythagoras: l = ' + sq('5<sup>2</sup> + 12<sup>2</sup>') + ' = ' + sq(169) + ' = 13.', 'Curved surface: π × 5 × 13 = 65π. Base: π × 5<sup>2</sup> = 25π.', 'Total: 65π + 25π.'], '90π cm<sup>2</sup>')}`,
    },
    {
      title: 'Spheres and hemispheres',
      html: `${rule('Volume of a sphere = ' + f(4, 3) + 'πr<sup>3</sup> &nbsp;&nbsp; Surface area of a sphere = 4πr<sup>2</sup>')}
${W('Find the volume of a sphere of radius 6 cm, in terms of π.', [f(4, 3) + ' × π × 6<sup>3</sup> = ' + f(4, 3) + ' × 216π = 288π.'], '288π cm<sup>3</sup> (≈ 904.8 cm<sup>3</sup>)')}
${W('Find the total surface area of a solid hemisphere of radius 6 cm.', ['Curved part: half of 4πr<sup>2</sup> = 2π × 36 = 72π.', 'Flat circular face: π × 36 = 36π.', 'Total: 108π = 339.29…'], '108π cm<sup>2</sup> (≈ 339.3 cm<sup>2</sup>)')}
${note('A solid hemisphere has a flat face too — do not forget it.')}`,
    },
    {
      title: 'Working backwards and melting problems',
      html: `${W('A sphere has volume 500 cm<sup>3</sup>. Find its radius.', [f(4, 3) + 'πr<sup>3</sup> = 500, so r<sup>3</sup> = ' + f('500 × 3', '4π') + ' = ' + f(375, 'π') + '.', 'r = cube root of 119.36… = 4.923…'], '4.92 cm (3 s.f.)')}
${W('A solid metal sphere of radius 3 cm is melted down and recast into cones of radius 1.5 cm and height 4 cm. How many cones can be made?', ['Sphere: ' + f(4, 3) + 'π × 27 = 36π.', 'One cone: ' + f(1, 3) + 'π × 1.5<sup>2</sup> × 4 = ' + f(1, 3) + 'π × 9 = 3π.', '36π ÷ 3π = 12.'], '12 cones')}
${note('Keeping π as a symbol often lets it cancel, which avoids rounding errors.')}`,
    },
    {
      title: 'Higher: frustums (grade 8–9)',
      html: `<p>A frustum is a large cone with a small cone removed from the top. The two cones are similar.</p>
${rule('Volume of frustum = volume of large cone − volume of small cone')}
${W('A cone of height 12 cm and radius 6 cm has the top 4 cm cut off, leaving a frustum. The small cone removed has radius 2 cm. Find the volume of the frustum.', ['Large cone: ' + f(1, 3) + 'π × 6<sup>2</sup> × 12 = 144π.', 'Small cone: ' + f(1, 3) + 'π × 2<sup>2</sup> × 4 = ' + f(16, 3) + 'π.', 'Frustum: 144π − ' + f(16, 3) + 'π = ' + f(416, 3) + 'π = 435.63…'], f(416, 3) + 'π cm<sup>3</sup> (≈ 435.6 cm<sup>3</sup>)')}
${note('If the small radius is not given, use similar triangles: the radius and height are in the same ratio in both cones (here 6 : 12 = 2 : 4).')}`,
    },
  ],
  mistakes: [
    'Using the slant height instead of the perpendicular height in the cone volume formula.',
    'Forgetting the ' + f(1, 3) + ' for cones and pyramids.',
    'Using the diameter instead of the radius.',
    'Missing the flat base when finding the total surface area of a cone or hemisphere.',
  ],
  examTips: [
    'The volume and surface area formulae for cones, spheres and pyramids are on the current Edexcel formulae sheet — the skill is choosing the right one and the right length.',
    '"In terms of π" means leave π as a symbol and simplify the number in front.',
    'Write units: cm<sup>3</sup> for volume, cm<sup>2</sup> for surface area.',
  ],
  realLife: 'These formulae are used to design ice-cream cones, grain silos, footballs, lampshades (frustums) and to calculate how much material is needed to make them.',
  specRef: 'Edexcel 1MA1 G17: surface area and volume of spheres, pyramids, cones and composite solids',
};

/* ------------------------------------------------------------------ */
C['y11-circle-theorems'] = {
  overview: `<p><b>Circle theorems</b> are facts about angles and lines in circles. Combined with angle facts you already know (triangles, straight lines, isosceles triangles), they let you find missing angles in complicated diagrams. In the exam you must <b>state the theorem</b> as your reason for each step.</p>`,
  objectives: [
    'I can recall and use the circle theorems.',
    'I can find missing angles in circle diagrams, giving reasons.',
    'I can spot isosceles triangles formed by two radii.',
    'I can use tangent properties and the alternate segment theorem.',
    'I can solve multi-step angle problems combining several theorems.',
  ],
  keyWords: [
    { term: 'Chord', def: 'A straight line joining two points on the circumference.' },
    { term: 'Tangent', def: 'A straight line that touches a circle at exactly one point.' },
    { term: 'Cyclic quadrilateral', def: 'A quadrilateral with all four vertices on a circle.' },
    { term: 'Subtended', def: 'An angle is subtended by an arc or chord when its arms go to the ends of that arc or chord.' },
    { term: 'Segment', def: 'The region between a chord and the arc it cuts off.' },
  ],
  sections: [
    {
      title: 'The circle theorems',
      html: `${table(['Theorem', 'What it says'], [['Angle at the centre', 'The angle at the centre is twice the angle at the circumference subtended by the same arc.'], ['Angle in a semicircle', 'An angle in a semicircle is 90°.'], ['Angles in the same segment', 'Angles subtended by the same arc in the same segment are equal.'], ['Cyclic quadrilateral', 'Opposite angles add up to 180°.'], ['Tangent and radius', 'A tangent meets the radius at 90°.'], ['Two tangents', 'Tangents from an external point are equal in length.'], ['Perpendicular to a chord', 'The perpendicular from the centre to a chord bisects the chord.'], ['Alternate segment', 'The angle between a tangent and a chord equals the angle in the alternate segment.']])}`,
    },
    {
      title: 'Angles at the centre and in a cyclic quadrilateral',
      html: `<svg viewBox="0 0 200 180" width="100%" style="max-width:220px" role="img" aria-label="Circle with centre O, angle 2x at the centre and x at the circumference">
<circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="1.5" fill="none"><polyline points="29.5,125.7 100,25 170.5,125.7"/></g>
<g stroke="#3b6cf6" stroke-width="2" fill="none"><polyline points="29.5,125.7 100,100 170.5,125.7"/></g>
<circle cx="100" cy="100" r="3" fill="currentColor"/>
<g fill="currentColor" font-size="13"><text x="94" y="20">P</text><text x="16" y="138">A</text><text x="174" y="138">B</text><text x="104" y="96">O</text><text x="93" y="52">x</text></g>
<text x="91" y="124" fill="#3b6cf6" font-size="13">2x</text>
</svg>
${W('In the diagram, angle APB = 38°. O is the centre. Find angle AOB.', ['Angle AOB and angle APB are subtended by the same arc AB.', 'The angle at the centre is twice the angle at the circumference.'], 'Angle AOB = 76°')}
${W('ABCD is a cyclic quadrilateral. Angle ABC = 112°. Find angle ADC.', ['Opposite angles in a cyclic quadrilateral add up to 180°.', '180° − 112° = 68°.'], 'Angle ADC = 68°')}`,
    },
    {
      title: 'Tangents',
      html: `${W('TA is a tangent to a circle with centre O at the point A. Angle AOT = 54°. Find angle ATO.', ['A tangent meets a radius at 90°, so angle OAT = 90°.', 'Angles in a triangle add up to 180°: 180° − 90° − 54° = 36°.'], 'Angle ATO = 36°')}
${W('A tangent touches a circle at A. Chord AB makes an angle of 65° with the tangent. C is a point on the major arc AB. Find angle ACB.', ['The angle between a tangent and a chord equals the angle in the alternate segment.'], 'Angle ACB = 65°')}`,
    },
    {
      title: 'Multi-step problems (grade 8–9)',
      html: `${W('A, B and C lie on a circle with centre O. Angle OAB = 24°. Find angle ACB.', ['OA and OB are radii, so triangle OAB is isosceles and angle OBA = 24°.', 'Angle AOB = 180° − 24° − 24° = 132° (angles in a triangle).', 'Angle ACB is at the circumference on the same arc: 132° ÷ 2 = 66° (angle at the centre is twice the angle at the circumference).'], 'Angle ACB = 66°')}
${note('Two radii always make an isosceles triangle — look for them in every diagram.')}`,
    },
  ],
  mistakes: [
    'Halving when you should double (or the other way round) with the angle at the centre.',
    'Using the cyclic quadrilateral rule when one vertex is the centre, not on the circumference.',
    'Giving reasons in vague words such as "angles in a circle" instead of the full theorem.',
    'Missing that two radii form an isosceles triangle.',
  ],
  examTips: [
    'Write the angle on the diagram as soon as you find it, and give a reason for every step.',
    'Use the proper wording, e.g. "the angle between a tangent and a radius is 90°".',
    'None of the circle theorems are on the Edexcel formulae sheet — they must all be learnt.',
  ],
  realLife: 'Circle theorems are used in engineering design of gears and arches, and in navigation, where the angle subtended by two landmarks fixes a position on a circle.',
  specRef: 'Edexcel 1MA1 G10: apply and prove the standard circle theorems concerning angles, radii, tangents and chords',
};

/* ------------------------------------------------------------------ */
C['y11-quadratic-inequalities'] = {
  overview: `<p>A <b>quadratic inequality</b> such as x<sup>2</sup> − x − 12 &lt; 0 asks for all the values of x that make the expression negative (or positive). The answer is usually a <b>range</b> of values or two separate ranges. The safest way to see which is to sketch the graph.</p>`,
  objectives: [
    'I can find the critical values of a quadratic inequality.',
    'I can sketch a quadratic graph to decide which region satisfies the inequality.',
    'I can write solutions as one inequality or two separate inequalities.',
    'I can use set notation for solutions.',
    'I can list integer values that satisfy a quadratic inequality.',
  ],
  keyWords: [
    { term: 'Critical values', def: 'The solutions of the related equation (where the graph crosses the x-axis).' },
    { term: 'Inequality', def: 'A statement using &lt;, &gt;, ≤ or ≥.' },
    { term: 'Set notation', def: 'A way of writing a solution, e.g. {x : −3 &lt; x &lt; 4}.' },
    { term: 'Union (∪)', def: 'Combining two sets, used when the solution is two separate ranges.' },
  ],
  sections: [
    {
      title: 'The method',
      html: `<ol><li>Rearrange so one side is 0.</li><li>Solve the related equation to find the critical values.</li><li>Sketch the graph (U-shaped if the x<sup>2</sup> term is positive).</li><li>&lt; 0 means <b>below</b> the x-axis; &gt; 0 means <b>above</b> it.</li></ol>
<svg viewBox="0 0 240 150" width="100%" style="max-width:300px" role="img" aria-label="U-shaped graph crossing the x-axis at −3 and 4, with the part below the axis highlighted">
<line x1="10" y1="60" x2="230" y2="60" stroke="currentColor" stroke-width="1.5"/>
<path d="M30 10 Q 110 230 190 10" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="51" y1="60" x2="169" y2="60" stroke="#3b6cf6" stroke-width="5"/>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="46" y="78">−3</text><text x="174" y="78">4</text><text x="222" y="54">x</text></g>
</svg>`,
    },
    {
      title: 'Between the roots: less than 0',
      html: `${W('Solve x<sup>2</sup> − x − 12 &lt; 0.', ['Solve x<sup>2</sup> − x − 12 = 0: (x − 4)(x + 3) = 0, so x = 4 or x = −3.', 'The graph is U-shaped and is below the x-axis between the roots.'], '−3 &lt; x &lt; 4')}
${W('List the integers that satisfy x<sup>2</sup> − x − 12 &lt; 0.', ['From −3 &lt; x &lt; 4, the endpoints are not included.'], '−2, −1, 0, 1, 2, 3')}`,
    },
    {
      title: 'Outside the roots: greater than 0',
      html: `${W('Solve x<sup>2</sup> ≥ 25.', ['Rearrange: x<sup>2</sup> − 25 ≥ 0. Critical values x = −5 and x = 5.', 'The graph is above (or on) the axis outside the roots.'], 'x ≤ −5 or x ≥ 5')}
${note('x<sup>2</sup> ≥ 25 does <b>not</b> simplify to x ≥ ±5. Negative numbers like −6 work too, because (−6)<sup>2</sup> = 36.')}
${W('Solve 2x<sup>2</sup> + 5x − 3 &gt; 0. Give your answer in set notation.', ['Factorise: (2x − 1)(x + 3) = 0, so x = ' + f(1, 2) + ' or x = −3.', 'U-shaped graph; &gt; 0 is above the axis, outside the roots.', 'x &lt; −3 or x &gt; ' + f(1, 2) + '.'], '{x : x &lt; −3} ∪ {x : x &gt; ' + f(1, 2) + '}')}`,
    },
    {
      title: 'Combining with a linear inequality (grade 9)',
      html: `${W('Find the integer values of x that satisfy both x<sup>2</sup> − x − 12 &lt; 0 and 2x + 1 &gt; 3.', ['Quadratic: −3 &lt; x &lt; 4.', 'Linear: 2x &gt; 2, so x &gt; 1.', 'Both together: 1 &lt; x &lt; 4.'], '2 and 3')}`,
    },
  ],
  mistakes: [
    'Giving the critical values as the answer instead of a range.',
    'Writing x &lt; −3 and x &gt; 4 as "−3 &gt; x &gt; 4", which is impossible.',
    'Taking the square root of both sides of x<sup>2</sup> &gt; 25 and writing x &gt; ±5.',
    'Choosing the wrong region because no sketch was drawn.',
  ],
  examTips: [
    'Always sketch the graph and mark the critical values — it takes seconds and prevents the most common error.',
    'Use "or" (or the union symbol ∪) for two separate ranges; never join them into one inequality.',
    'Nothing for inequalities is on the Edexcel formulae sheet; the quadratic formula on the Higher sheet can find critical values that do not factorise.',
  ],
  realLife: 'Quadratic inequalities are used to find the range of prices that give a profit, or the times when a projectile is above a certain height.',
  specRef: 'Edexcel 1MA1 A22: solve quadratic inequalities in one variable and represent the solution set',
};

/* ------------------------------------------------------------------ */
C['y11-growth-decay'] = {
  overview: `<p>Many things in the real world grow or shrink by the same <b>percentage</b> each time period: populations, bacteria, radioactive material, the temperature of cooling tea. This is called <b>exponential</b> growth and decay. The same multiplier idea as compound interest works for all of them, and the graphs have a distinctive curved shape.</p>`,
  objectives: [
    'I can use a multiplier raised to a power to model growth and decay.',
    'I can solve problems involving half-life.',
    'I can find how many time periods it takes to reach a target.',
    'I can use iterative notation such as P<sub>n+1</sub> = 1.04 × P<sub>n</sub>.',
    'I can recognise exponential graphs and find a and b in y = ab<sup>x</sup> (Higher).',
  ],
  keyWords: [
    { term: 'Exponential growth', def: 'Increasing by the same percentage (multiplier greater than 1) each time period.' },
    { term: 'Exponential decay', def: 'Decreasing by the same percentage (multiplier between 0 and 1) each time period.' },
    { term: 'Half-life', def: 'The time it takes for an amount to halve.' },
    { term: 'Multiplier', def: 'The number you multiply by each time period, e.g. 1.12 for 12% growth.' },
    { term: 'Iterative formula', def: 'A formula that finds the next value from the current one, e.g. P<sub>n+1</sub> = 0.9P<sub>n</sub>.' },
  ],
  sections: [
    {
      title: 'Growth and decay with multipliers',
      html: `${rule('Amount after n periods = starting amount × (multiplier)<sup>n</sup>')}
${W('A colony of 500 bacteria grows by 12% every hour. How many bacteria are there after 6 hours?', ['Multiplier: 1.12.', '500 × 1.12<sup>6</sup> = 986.91…', 'Bacteria are counted in whole numbers.'], '987 bacteria')}
${W('A radioactive sample loses 8% of its mass each year. After how many whole years will less than half of it remain?', ['Multiplier: 0.92. We need 0.92<sup>n</sup> &lt; 0.5.', '0.92<sup>8</sup> = 0.513… (still more than half).', '0.92<sup>9</sup> = 0.472… (less than half).'], '9 years')}`,
    },
    {
      title: 'Half-life',
      html: `${W('A substance has a half-life of 3 days. A sample has mass 80 g. What mass remains after 12 days?', ['12 ÷ 3 = 4 half-lives.', '80 → 40 → 20 → 10 → 5.', 'Equivalently: 80 × (' + f(1, 2) + ')<sup>4</sup> = 80 ÷ 16.'], '5 g')}
${note('After each half-life the amount halves — it never reaches zero.')}`,
    },
    {
      title: 'Iterative notation',
      html: `<p>Exam questions sometimes write growth as a step-by-step formula. P<sub>0</sub> is the starting value, P<sub>1</sub> is the value after one period, and so on.</p>
${W('The population of a village is modelled by P<sub>n+1</sub> = 1.04 × P<sub>n</sub>, with P<sub>0</sub> = 2000. Find P<sub>3</sub> and say what the 1.04 means.', ['P<sub>1</sub> = 1.04 × 2000 = 2080.', 'P<sub>2</sub> = 1.04 × 2080 = 2163.2.', 'P<sub>3</sub> = 1.04 × 2163.2 = 2249.728.'], 'P<sub>3</sub> ≈ 2250 people; the population increases by 4% each period')}`,
    },
    {
      title: 'Exponential graphs (Higher)',
      html: `<p>The graph of y = ab<sup>x</sup> (with b &gt; 1) starts slowly and then rises more and more steeply. It crosses the y-axis at (0, a) and never touches the x-axis.</p>
<svg viewBox="0 0 240 150" width="100%" style="max-width:300px" role="img" aria-label="Exponential growth curve rising steeply, crossing the y-axis above the origin">
<g stroke="currentColor" stroke-width="1.5"><line x1="10" y1="135" x2="230" y2="135"/><line x1="120" y1="140" x2="120" y2="8"/></g>
<path d="M12 132 C 80 128, 120 118, 150 95 S 190 40, 200 10" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<g fill="currentColor" font-size="12"><text x="224" y="130">x</text><text x="126" y="16">y</text><text x="124" y="128">a</text></g>
</svg>
${W('The curve y = ab<sup>x</sup> passes through (0, 3) and (2, 48). Find a and b.', ['At x = 0: b<sup>0</sup> = 1, so y = a. Therefore a = 3.', 'At x = 2: 48 = 3 × b<sup>2</sup>, so b<sup>2</sup> = 16.', 'b must be positive, so b = 4.'], 'a = 3, b = 4')}`,
    },
  ],
  mistakes: [
    'Using a multiplier of 0.08 for an 8% decrease instead of 0.92.',
    'Adding the same amount each period (linear) instead of multiplying (exponential).',
    'Rounding a population or count to decimals instead of whole numbers.',
    'Thinking a substance disappears completely after two half-lives.',
  ],
  examTips: [
    'The compound interest formula on the current Edexcel formulae sheet can be used for any percentage growth or decay, not just money.',
    'For "how many years" questions, show the values either side of the target to justify your answer.',
    'Read whether the question wants the amount remaining or the amount lost.',
  ],
  realLife: 'Growth and decay models are used to predict population growth, the spread of viruses, carbon dating of fossils and how long medicines stay in the body.',
  specRef: 'Edexcel 1MA1 R16: set up, solve and interpret growth and decay problems, including compound interest and iterative processes',
};

/* ------------------------------------------------------------------ */
C['y11-vectors'] = {
  overview: `<p>A <b>vector</b> has both size (magnitude) and direction. You can write vectors as column vectors, as bold letters like <b>a</b>, or as a journey between two points such as ${'AB'} with an arrow above it. At Higher tier you use vectors to <b>prove</b> geometric facts, such as two lines being parallel or three points lying on a straight line.</p>`,
  objectives: [
    'I can represent vectors as column vectors and diagrams.',
    'I can add, subtract and multiply vectors by a scalar.',
    'I can find the magnitude of a vector using Pythagoras (Higher).',
    'I can write a journey between points in terms of given vectors.',
    'I can use vectors to prove lines are parallel or points are collinear (Higher).',
  ],
  keyWords: [
    { term: 'Vector', def: 'A quantity with both magnitude and direction.' },
    { term: 'Column vector', def: 'A vector written as (x over y): x units right, y units up.' },
    { term: 'Scalar', def: 'A number that multiplies a vector, changing its length but not its line.' },
    { term: 'Resultant', def: 'The single vector equal to two or more vectors added together.' },
    { term: 'Parallel vectors', def: 'Vectors that are scalar multiples of each other.' },
    { term: 'Collinear', def: 'Lying on the same straight line.' },
  ],
  sections: [
    {
      title: 'Column vectors and arithmetic',
      html: `<p>The column vector with top 3 and bottom −2 means 3 units right and 2 units down. In this page we write it as (3, −2) on one line, but in your exam write it as a column.</p>
${rule('Add or subtract the top numbers together and the bottom numbers together. A scalar multiplies both numbers.')}
${W('a = (3, −2) and b = (−1, 4). Find 2a + b and a − 3b.', ['2a = (6, −4). 2a + b = (6 + (−1), −4 + 4) = (5, 0).', '3b = (−3, 12). a − 3b = (3 − (−3), −2 − 12) = (6, −14).'], '2a + b = (5, 0); a − 3b = (6, −14)')}`,
    },
    {
      title: 'Magnitude (Higher)',
      html: `${rule('The magnitude of (x, y) is ' + sq('x<sup>2</sup> + y<sup>2</sup>'))}
${W('Find the magnitude of the vector (3, 4).', [sq('3<sup>2</sup> + 4<sup>2</sup>') + ' = ' + sq(25) + '.'], '5 units')}`,
    },
    {
      title: 'Vector journeys',
      html: `<p>To get from one point to another, follow any route made of known vectors. Going against an arrow makes the vector negative.</p>
<svg viewBox="0 0 240 150" width="100%" style="max-width:300px" role="img" aria-label="Triangle OAB with M the midpoint of AB; OA is vector a and OB is vector b">
<polygon points="20,130 200,130 120,20" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="20" y1="130" x2="160" y2="75" stroke="#3b6cf6" stroke-width="2" stroke-dasharray="5 4"/>
<circle cx="160" cy="75" r="3.5" fill="#3b6cf6"/>
<g fill="currentColor" font-size="13"><text x="6" y="144">O</text><text x="204" y="144">A</text><text x="114" y="14">B</text><text x="166" y="72">M</text><text x="104" y="148" font-weight="bold">a</text><text x="56" y="70" font-weight="bold">b</text></g>
</svg>
${W('In triangle OAB, OA = <b>a</b> and OB = <b>b</b>. M is the midpoint of AB. Find the vector OM.', ['AB = AO + OB = −<b>a</b> + <b>b</b> = <b>b</b> − <b>a</b>.', 'AM = ' + f(1, 2) + 'AB = ' + f(1, 2) + '(<b>b</b> − <b>a</b>).', 'OM = OA + AM = <b>a</b> + ' + f(1, 2) + '(<b>b</b> − <b>a</b>) = ' + f(1, 2) + '<b>a</b> + ' + f(1, 2) + '<b>b</b>.'], 'OM = ' + f(1, 2) + '(<b>a</b> + <b>b</b>)')}`,
    },
    {
      title: 'Higher: proving parallel lines',
      html: `${rule('If one vector is a scalar multiple of another, the lines are parallel.')}
${W('OA = 2<b>a</b> and OB = 2<b>b</b>. M is the midpoint of OA and N is the midpoint of OB. Prove that MN is parallel to AB.', ['MN = MO + ON = −<b>a</b> + <b>b</b> = <b>b</b> − <b>a</b>.', 'AB = AO + OB = −2<b>a</b> + 2<b>b</b> = 2(<b>b</b> − <b>a</b>).', 'AB = 2 × MN, so AB is a multiple of MN.'], 'MN is parallel to AB (and half its length)')}`,
    },
    {
      title: 'Higher: proving points are collinear (grade 9)',
      html: `<p>To show three points lie on a straight line, show two of the vectors joining them are parallel <b>and</b> share a common point.</p>
${W('OA = <b>a</b>, OB = <b>b</b> and OC = 3<b>b</b> − 2<b>a</b>. Prove that A, B and C are collinear.', ['AB = −<b>a</b> + <b>b</b> = <b>b</b> − <b>a</b>.', 'AC = −<b>a</b> + 3<b>b</b> − 2<b>a</b> = 3<b>b</b> − 3<b>a</b> = 3(<b>b</b> − <b>a</b>).', 'AC = 3AB, so AB and AC are parallel.', 'They share the point A.'], 'A, B and C lie on a straight line')}`,
    },
  ],
  mistakes: [
    'Forgetting to make a vector negative when travelling against its arrow.',
    'Writing a column vector as coordinates or adding top and bottom numbers together.',
    'In collinear proofs, showing the vectors are parallel but not mentioning the common point.',
    'Not simplifying vector expressions fully, e.g. leaving <b>a</b> + ' + f(1, 2) + '(<b>b</b> − <b>a</b>).',
  ],
  examTips: [
    'Write each route step by step (e.g. OM = OA + AM) — every correct route earns marks.',
    'Underline vector letters in handwriting (you cannot write in bold).',
    'No vector rules are on the Edexcel formulae sheet.',
  ],
  realLife: 'Vectors describe forces in engineering, velocities in flight navigation and movement in computer games and animation.',
  specRef: 'Edexcel 1MA1 G25: apply addition and subtraction of vectors, multiplication by a scalar, and use vectors to construct geometric arguments and proofs',
};

/* ------------------------------------------------------------------ */
C['y11-conditional-probability'] = {
  overview: `<p><b>Conditional probability</b> is the probability of an event <b>given that</b> something else has already happened. Knowing extra information changes the group you are choosing from. Two-way tables, Venn diagrams and tree diagrams all help you find these probabilities and decide whether events are independent.</p>`,
  objectives: [
    'I can find conditional probabilities from two-way tables.',
    'I can find conditional probabilities from Venn diagrams using set notation.',
    'I can use P(A and B) = P(A given B) × P(B).',
    'I can find a conditional probability from a tree diagram (grade 9).',
    'I can test whether two events are independent.',
  ],
  keyWords: [
    { term: 'Conditional probability', def: 'The probability of an event given that another event has happened.' },
    { term: 'P(A | B)', def: 'The probability of A given B.' },
    { term: 'A ∩ B', def: 'A and B (the intersection).' },
    { term: 'A ∪ B', def: 'A or B or both (the union).' },
    { term: 'Independent', def: 'Events where P(A and B) = P(A) × P(B).' },
  ],
  sections: [
    {
      title: 'Two-way tables',
      html: `<p>"Given that" tells you to restrict yourself to one row or column of the table.</p>
${table(['', 'Walks', 'Does not walk', 'Total'], [['Boys', '20', '15', '35'], ['Girls', '18', '27', '45'], ['Total', '38', '42', '80']])}
${W('A student is chosen at random. Find P(walks | girl) and P(girl | walks).', ['Given girl: only look at the 45 girls. 18 walk, so ' + f(18, 45) + ' = ' + f(2, 5) + '.', 'Given walks: only look at the 38 walkers. 18 are girls, so ' + f(18, 38) + ' = ' + f(9, 19) + '.'], 'P(walks | girl) = ' + f(2, 5) + '; P(girl | walks) = ' + f(9, 19))}
${note('P(walks | girl) and P(girl | walks) are different — the denominator changes.')}`,
    },
    {
      title: 'Venn diagrams',
      html: `<svg viewBox="0 0 260 150" width="100%" style="max-width:300px" role="img" aria-label="Venn diagram: A only 12, A and B 8, B only 15, outside 15">
<rect x="5" y="5" width="250" height="140" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="100" cy="75" r="55" fill="#3b6cf6" fill-opacity="0.12" stroke="currentColor" stroke-width="2"/>
<circle cx="160" cy="75" r="55" fill="#3b6cf6" fill-opacity="0.12" stroke="currentColor" stroke-width="2"/>
<g fill="currentColor" font-size="14" text-anchor="middle"><text x="75" y="80">12</text><text x="130" y="80">8</text><text x="185" y="80">15</text><text x="235" y="135">15</text><text x="60" y="30">A</text><text x="200" y="30">B</text><text x="16" y="22">ξ</text></g>
</svg>
${W('Using the Venn diagram (50 people in total), find P(A | B).', ['Given B: restrict to the B circle, 8 + 15 = 23 people.', 'Of these, 8 are also in A.'], f(8, 23))}`,
    },
    {
      title: 'The formula and independence',
      html: `${rule('P(A and B) = P(A | B) × P(B) &nbsp;&nbsp; so &nbsp;&nbsp; P(A | B) = ' + f('P(A and B)', 'P(B)') + '<br>A and B are independent if P(A and B) = P(A) × P(B)')}
${W('Using the Venn diagram, are A and B independent?', ['P(A) = ' + f(20, 50) + ' = 0.4 and P(B) = ' + f(23, 50) + ' = 0.46.', 'P(A) × P(B) = 0.4 × 0.46 = 0.184.', 'P(A ∩ B) = ' + f(8, 50) + ' = 0.16.', '0.16 ≠ 0.184.'], 'No, A and B are not independent')}`,
    },
    {
      title: 'Grade 9: reversing a tree diagram',
      html: `${W('The probability it rains on a school day is 0.3. If it rains, the probability Jo is late is 0.4; if not, it is 0.1. Given that Jo is late, find the probability that it rained.', ['P(rain and late) = 0.3 × 0.4 = 0.12.', 'P(no rain and late) = 0.7 × 0.1 = 0.07.', 'P(late) = 0.12 + 0.07 = 0.19.', 'P(rain | late) = ' + f('0.12', '0.19') + ' = ' + f(12, 19) + '.'], f(12, 19) + ' (≈ 0.632)')}`,
    },
  ],
  mistakes: [
    'Dividing by the overall total instead of the total of the "given" group.',
    'Mixing up P(A | B) and P(B | A).',
    'Counting the whole of circle A as "A only" in a Venn diagram.',
    'Assuming events are independent without checking.',
  ],
  examTips: [
    'The rules P(A or B) = P(A) + P(B) − P(A and B) and P(A and B) = P(A given B)P(B) are printed on the current Edexcel Higher formulae sheet.',
    'Underline the words "given that" — they tell you what the denominator is.',
    'Fill in every region of a Venn diagram or every cell of a two-way table before answering.',
  ],
  realLife: 'Doctors use conditional probability to interpret medical test results, and insurers use it to set prices based on a customer\'s history.',
  specRef: 'Edexcel 1MA1 P8, P9: calculate and interpret conditional probabilities using two-way tables, tree diagrams and Venn diagrams',
};

/* ------------------------------------------------------------------ */
C['y11-cumulative-frequency'] = {
  overview: `<p>A <b>cumulative frequency</b> graph shows a running total of the data. From it you can estimate the median and the <b>quartiles</b>, which split the data into four equal parts. A <b>box plot</b> summarises these five key values in one diagram and is perfect for comparing two distributions.</p>`,
  objectives: [
    'I can complete a cumulative frequency table.',
    'I can draw a cumulative frequency graph, plotting at the upper class boundaries.',
    'I can estimate the median, quartiles and interquartile range from the graph.',
    'I can draw and interpret box plots.',
    'I can compare two distributions using the median and IQR.',
  ],
  keyWords: [
    { term: 'Cumulative frequency', def: 'The running total of the frequencies.' },
    { term: 'Lower quartile (LQ)', def: 'The value one quarter of the way through the ordered data.' },
    { term: 'Upper quartile (UQ)', def: 'The value three quarters of the way through the ordered data.' },
    { term: 'Interquartile range (IQR)', def: 'UQ − LQ; the spread of the middle half of the data.' },
    { term: 'Box plot', def: 'A diagram showing the minimum, LQ, median, UQ and maximum.' },
  ],
  sections: [
    {
      title: 'Cumulative frequency tables and graphs',
      html: `<p>The heights of 60 plants were measured.</p>
${table(['Height (h cm)', 'Frequency', 'Cumulative frequency'], [['0 &lt; h ≤ 10', '5', '5'], ['10 &lt; h ≤ 20', '12', '17'], ['20 &lt; h ≤ 30', '20', '37'], ['30 &lt; h ≤ 40', '15', '52'], ['40 &lt; h ≤ 50', '8', '60']])}
<p>Plot each cumulative frequency at the <b>upper end</b> of its class: (10, 5), (20, 17), (30, 37), (40, 52), (50, 60), starting from (0, 0). Join with a smooth curve or straight lines.</p>
${W('How many plants were 30 cm or shorter? How many were taller than 40 cm?', ['Cumulative frequency at 30 cm is 37, so 37 plants were 30 cm or shorter.', 'Cumulative frequency at 40 cm is 52, so 60 − 52 = 8 plants were taller than 40 cm.'], '37 plants; 8 plants')}
<svg viewBox="0 0 300 195" width="100%" style="max-width:340px" role="img" aria-label="Cumulative frequency curve with dashed lines reading the median at 26.5">
<g stroke="currentColor" stroke-width="1.5"><line x1="40" y1="170" x2="295" y2="170"/><line x1="40" y1="170" x2="40" y2="12"/></g>
<polyline points="40,170 90,157.5 140,127.5 190,77.5 240,40 290,20" fill="none" stroke="#3b6cf6" stroke-width="2.5"/>
<g stroke="currentColor" stroke-width="1" stroke-dasharray="4 3"><line x1="40" y1="95" x2="172.5" y2="95"/><line x1="172.5" y1="95" x2="172.5" y2="170"/></g>
<g fill="currentColor" font-size="11" text-anchor="middle"><text x="40" y="184">0</text><text x="90" y="184">10</text><text x="140" y="184">20</text><text x="190" y="184">30</text><text x="240" y="184">40</text><text x="290" y="184">50</text><text x="172" y="160">26.5</text></g>
<g fill="currentColor" font-size="11" text-anchor="end"><text x="34" y="174">0</text><text x="34" y="124">20</text><text x="34" y="99">30</text><text x="34" y="74">40</text><text x="34" y="24">60</text></g>
</svg>`,
    },
    {
      title: 'Median, quartiles and IQR',
      html: `${rule('For a cumulative frequency graph with total n: median at ' + f('n', 2) + ', LQ at ' + f('n', 4) + ', UQ at ' + f('3n', 4))}
${W('Estimate the median, quartiles and IQR of the plant heights.', ['n = 60: median at 30th, LQ at 15th, UQ at 45th plant.', 'Read across from 30 to the curve and down: median ≈ 26.5 cm.', 'Read from 15: LQ ≈ 18.3 cm. Read from 45: UQ ≈ 35.3 cm.', 'IQR = 35.3 − 18.3 = 17.'], 'Median ≈ 26.5 cm, IQR ≈ 17 cm')}
${note('Readings from a graph are estimates; examiners accept a small range of values.')}`,
    },
    {
      title: 'Box plots',
      html: `<p>The shortest plant was 2 cm and the tallest 49 cm. A box plot uses the five values 2, 18.3, 26.5, 35.3, 49.</p>
<svg viewBox="0 0 290 90" width="100%" style="max-width:340px" role="img" aria-label="Box plot with minimum 2, lower quartile 18.3, median 26.5, upper quartile 35.3, maximum 49">
<g stroke="currentColor" stroke-width="2" fill="none"><line x1="30" y1="35" x2="111.5" y2="35"/><rect x="111.5" y="18" width="85" height="34" fill="#3b6cf6" fill-opacity="0.2"/><line x1="152.5" y1="18" x2="152.5" y2="52"/><line x1="196.5" y1="35" x2="265" y2="35"/><line x1="30" y1="25" x2="30" y2="45"/><line x1="265" y1="25" x2="265" y2="45"/></g>
<line x1="20" y1="70" x2="275" y2="70" stroke="currentColor" stroke-width="1"/>
<g fill="currentColor" font-size="11" text-anchor="middle"><text x="20" y="85">0</text><text x="70" y="85">10</text><text x="120" y="85">20</text><text x="170" y="85">30</text><text x="220" y="85">40</text><text x="270" y="85">50</text></g>
</svg>
${W('From the box plot, find the median, the range and the interquartile range.', ['The median is the line inside the box: 26.5 cm.', 'Range: 49 − 2 = 47 cm.', 'IQR: the width of the box, 35.3 − 18.3 = 17 cm.'], 'Median 26.5 cm, range 47 cm, IQR 17 cm')}`,
    },
    {
      title: 'Comparing distributions',
      html: `<p>When comparing, always make <b>one comment about an average</b> (median) and <b>one about spread</b> (IQR), and put both in context.</p>
${W('Plants grown with fertiliser had median 31 cm and IQR 9 cm. Compare them with the plants above (median 26.5 cm, IQR 17 cm).', ['Average: 31 &gt; 26.5, so on average the fertilised plants were taller.', 'Spread: 9 &lt; 17, so the fertilised plants\' heights were more consistent.'], 'Fertilised plants were taller on average and their heights were less spread out')}
${note('Use the IQR rather than the range to compare spread — it is not affected by extreme values.')}`,
    },
  ],
  mistakes: [
    'Plotting points at the midpoints of classes instead of the upper class boundaries.',
    'Reading the median from the horizontal axis value 30 instead of the cumulative frequency 30.',
    'Comparing distributions without referring to the context (e.g. "taller", "more consistent").',
    'Using the range instead of the IQR to describe spread.',
  ],
  examTips: [
    'Draw your reading lines on the graph in pencil — they show the examiner your method.',
    'For comparisons, write two separate sentences: one for the median, one for the IQR.',
    'No statistics formulae are on the Edexcel formulae sheet.',
  ],
  realLife: 'Box plots and quartiles are used to compare exam results between schools, salaries across industries and reaction times in medical trials.',
  specRef: 'Edexcel 1MA1 S3, S4: cumulative frequency graphs, quartiles, interquartile range and box plots; comparing distributions',
};

module.exports = C;
