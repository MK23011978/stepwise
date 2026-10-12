'use strict';
// Year 8 and Year 9 (KS3 → GCSE foundations) teaching content for the learn pages.
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
C['y8-negative-numbers'] = {
  overview: `<p>Negative numbers appear in temperatures, bank balances and heights below sea level. In Year 8 you extend what you know about adding and subtracting negatives to <b>multiplying, dividing and squaring</b> them, and you learn the sign rules that every later algebra topic depends on.</p>`,
  objectives: [
    'I can order positive and negative numbers, including decimals.',
    'I can add and subtract negative numbers, including subtracting a negative.',
    'I can multiply and divide negative numbers using the sign rules.',
    'I can square and cube negative numbers and use brackets correctly on a calculator.',
    'I can solve problems involving differences between negative values.',
  ],
  keyWords: [
    { term: 'Integer', def: 'A whole number, which may be positive, negative or zero.' },
    { term: 'Negative number', def: 'A number less than zero, such as −3 or −0.5.' },
    { term: 'Directed number', def: 'A number with a sign (+ or −) showing which way it points from zero.' },
    { term: 'Difference', def: 'How far apart two numbers are; found by subtracting the smaller from the larger.' },
    { term: 'Inequality symbols', def: '&lt; means "is less than" and &gt; means "is greater than".' },
  ],
  sections: [
    {
      title: 'Ordering and comparing',
      html: `<p>On a number line values increase as you move right. A negative number with a bigger digit is further left, so it is <b>smaller</b>: −9 &lt; −4.</p>
${W('Write in ascending order: 2.5, −3, −0.5, 0, −3.5, 1.', ['Negative numbers come first. The most negative is furthest from zero: −3.5, then −3, then −0.5.', 'Then 0.', 'Then the positives: 1, 2.5.'], '−3.5, −3, −0.5, 0, 1, 2.5')}
${note('−0.5 is bigger than −3 even though it looks "smaller" — it is much closer to zero.')}`,
    },
    {
      title: 'Adding and subtracting negatives',
      html: `<p>Think of a number line: adding a positive moves right, subtracting a positive moves left. Two signs next to each other can be combined.</p>
${rule('+ (+) → + &nbsp;&nbsp; + (−) → − &nbsp;&nbsp; − (+) → − &nbsp;&nbsp; − (−) → +')}
${W('Work out −3 − (−8).', ['Subtracting a negative is the same as adding: −3 + 8.', 'Start at −3 and move 8 to the right: 3 steps to reach 0, then 5 more.'], '5')}
${W('At 6 am the temperature in Oslo is −12 °C. At 2 pm it is 7 °C. By how many degrees has it risen?', ['Rise = later temperature − earlier temperature = 7 − (−12).', '7 − (−12) = 7 + 12.'], '19 °C')}`,
    },
    {
      title: 'Multiplying and dividing negatives',
      html: `<p>Work out the number part as normal, then decide the sign. The sign rules are the same for multiplying and dividing.</p>
${table(['Signs', 'Result', 'Example'], [['+ and +', '+', '6 × 4 = 24'], ['+ and −', '−', '−6 × 4 = −24'], ['− and +', '−', '36 ÷ −4 = −9'], ['− and −', '+', '−7 × −3 = 21']])}
${rule('Same signs → positive answer. Different signs → negative answer.')}
${W('Work out (−3) × (−4) × (−2).', ['Do two at a time: (−3) × (−4) = 12 (same signs → positive).', 'Then 12 × (−2) = −24 (different signs → negative).'], '−24')}
${note('Quick check for a long product: an <b>even</b> number of negatives gives a positive answer; an <b>odd</b> number gives a negative answer.')}`,
    },
    {
      title: 'Powers of negative numbers',
      html: `<p>Squaring means multiplying a number by itself, so (−5)<sup>2</sup> = (−5) × (−5) = 25. Cubing a negative gives a negative: (−2)<sup>3</sup> = (−2) × (−2) × (−2) = −8.</p>
${rule('(−5)<sup>2</sup> = 25 &nbsp;&nbsp; but &nbsp;&nbsp; −5<sup>2</sup> = −(5<sup>2</sup>) = −25')}
${W('Work out 10 − 2 × (−3)<sup>2</sup>.', ['Powers first: (−3)<sup>2</sup> = 9.', 'Then multiply: 2 × 9 = 18.', 'Then subtract: 10 − 18 = −8.'], '−8')}
${note('On a calculator always type brackets round a negative before squaring, otherwise it may square only the 5 and then make it negative.')}`,
    },
  ],
  mistakes: [
    'Saying −8 is bigger than −2 because 8 is bigger than 2.',
    'Using the multiplication sign rule for addition, e.g. thinking −3 + −4 = +7.',
    'Writing (−6)<sup>2</sup> = −36.',
    'Getting the order wrong when finding a difference, e.g. 7 − (−12) = −5 instead of 19.',
  ],
  examTips: [
    'In temperature or bank questions, sketch a vertical number line and count across zero.',
    'For long products, count the negatives first to decide the sign, then do the number part.',
    'On the calculator paper, use the (−) key and brackets for negative numbers.',
  ],
  realLife: 'Negative numbers describe overdrawn bank accounts, winter temperatures, golf scores under par and floors below ground level in a lift.',
  specRef: 'Edexcel 1MA1 N1, N2',
};

/* ------------------------------------------------------------------ */
C['y8-factors-multiples'] = {
  overview: `<p>Every whole number greater than 1 is either prime or can be built by multiplying primes together. Writing a number as a <b>product of prime factors</b> is a powerful tool: it lets you find the <b>highest common factor (HCF)</b> and <b>lowest common multiple (LCM)</b> of large numbers and solve "when will they next meet?" problems.</p>`,
  objectives: [
    'I can list all the factors of a number using factor pairs.',
    'I can identify prime numbers and explain why 1 is not prime.',
    'I can write a number as a product of prime factors using a factor tree and index notation.',
    'I can find the HCF and LCM of two numbers, including with a Venn diagram.',
    'I can decide whether a problem needs the HCF or the LCM.',
  ],
  keyWords: [
    { term: 'Factor', def: 'A whole number that divides into another number exactly, with no remainder.' },
    { term: 'Multiple', def: 'A number in the times table of another number, e.g. 6, 12, 18 are multiples of 6.' },
    { term: 'Prime number', def: 'A number with exactly two factors: 1 and itself. 2 is the only even prime.' },
    { term: 'Prime factor decomposition', def: 'Writing a number as a product of primes, e.g. 360 = 2<sup>3</sup> × 3<sup>2</sup> × 5.' },
    { term: 'HCF', def: 'Highest common factor — the biggest number that is a factor of both numbers.' },
    { term: 'LCM', def: 'Lowest common multiple — the smallest number that is a multiple of both numbers.' },
  ],
  sections: [
    {
      title: 'Factors, multiples and primes',
      html: `<p>Find factors in <b>pairs</b> so that none are missed: start at 1 and work upwards until the pairs meet.</p>
${W('List all the factors of 36.', ['1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6.', '5 does not divide 36, and after 6 the pairs would repeat, so stop.', 'Write them in order.'], '1, 2, 3, 4, 6, 9, 12, 18, 36')}
<p>The primes below 30 are 2, 3, 5, 7, 11, 13, 17, 19, 23 and 29. The number 1 is <b>not</b> prime because it has only one factor.</p>`,
    },
    {
      title: 'Product of prime factors',
      html: `<p>Use a <b>factor tree</b>: split the number into any factor pair, and keep splitting until every branch ends in a prime. Then multiply the primes together, using powers for repeats.</p>
<svg viewBox="0 0 260 170" width="100%" style="max-width:300px" role="img" aria-label="Factor tree for 360">
<g stroke="currentColor" stroke-width="1.5"><line x1="130" y1="22" x2="80" y2="52"/><line x1="130" y1="22" x2="180" y2="52"/><line x1="80" y1="62" x2="50" y2="92"/><line x1="80" y1="62" x2="110" y2="92"/><line x1="180" y1="62" x2="150" y2="92"/><line x1="180" y1="62" x2="210" y2="92"/><line x1="50" y1="102" x2="30" y2="132"/><line x1="50" y1="102" x2="70" y2="132"/></g>
<g fill="currentColor" font-size="14" text-anchor="middle"><text x="130" y="18">360</text><text x="80" y="60">36</text><text x="180" y="60">10</text><text x="50" y="100">4</text><text x="110" y="100" fill="#3b6cf6">9 → 3 × 3</text><text x="30" y="148" fill="#3b6cf6">2</text><text x="70" y="148" fill="#3b6cf6">2</text><text x="150" y="100" fill="#3b6cf6">2</text><text x="210" y="100" fill="#3b6cf6">5</text></g>
</svg>
${W('Write 360 as a product of its prime factors. Give your answer in index form.', ['360 = 36 × 10.', '36 = 4 × 9 = 2 × 2 × 3 × 3, and 10 = 2 × 5.', 'Collect the primes: 2 × 2 × 2 × 3 × 3 × 5.', 'Check: 8 × 9 × 5 = 360 ✓'], '360 = 2<sup>3</sup> × 3<sup>2</sup> × 5')}
${note('Different trees for the same number always end with the same primes — a good way to check.')}`,
    },
    {
      title: 'HCF and LCM using prime factors',
      html: `<p>Write both numbers as products of primes and place the primes in a <b>Venn diagram</b>. Shared primes go in the overlap.</p>
${rule('HCF = product of the primes in the overlap<br>LCM = product of every prime in the whole diagram')}
<svg viewBox="0 0 280 140" width="100%" style="max-width:320px" role="img" aria-label="Venn diagram of the prime factors of 24 and 36">
<ellipse cx="105" cy="75" rx="80" ry="55" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="175" cy="75" rx="80" ry="55" fill="none" stroke="#3b6cf6" stroke-width="1.5"/>
<g fill="currentColor" font-size="14" text-anchor="middle"><text x="70" y="14">24</text><text x="210" y="14">36</text><text x="65" y="80">2</text><text x="140" y="68">2</text><text x="140" y="88">2</text><text x="160" y="78">3</text><text x="215" y="80">3</text></g>
</svg>
${W('Find the HCF and LCM of 24 and 36.', ['24 = 2 × 2 × 2 × 3 and 36 = 2 × 2 × 3 × 3.', 'Shared primes: 2, 2, 3 (these go in the overlap). Left over: one 2 for 24, one 3 for 36.', 'HCF = 2 × 2 × 3 = 12.', 'LCM = 2 × 2 × 2 × 3 × 3 = 72.'], 'HCF = 12, LCM = 72')}`,
    },
    {
      title: 'HCF or LCM? Solving problems',
      html: `<p>Ask yourself: am I <b>splitting things into equal groups</b> (HCF — the answer is smaller than the numbers) or looking for <b>when things happen together again</b> (LCM — the answer is bigger)?</p>
${W('One bus leaves the station every 12 minutes and another every 18 minutes. Both leave at 9:00 am. When do they next leave together?', ['Times for bus A are multiples of 12: 12, 24, 36, 48 …', 'Times for bus B are multiples of 18: 18, 36, 54 …', 'The LCM of 12 and 18 is 36, so they meet again after 36 minutes.'], '9:36 am')}
${W('Sam has 24 apples and 36 oranges. He makes identical fruit bags using all the fruit. What is the greatest number of bags he can make?', ['Each bag must get the same share, so the number of bags must divide 24 and 36.', 'The greatest such number is the HCF, which is 12.', 'Each bag holds 2 apples and 3 oranges.'], '12 bags')}`,
    },
  ],
  mistakes: [
    'Including 1 as a prime number, or forgetting that 2 is prime.',
    'Leaving a non-prime (like 4 or 9) at the end of a factor tree.',
    'Mixing up HCF and LCM — the HCF can never be bigger than the smaller number.',
    'Writing the product of primes as a list (2, 2, 3) instead of with multiplication signs.',
  ],
  examTips: [
    '"Express as a product of prime factors" needs × signs; index form (powers) is often expected.',
    'Check your prime factor decomposition by multiplying it back out.',
    'In worded problems, write the word HCF or LCM in your working so the examiner sees your method.',
  ],
  realLife: 'Prime numbers keep online banking secure through encryption, and the LCM tells you when repeating events — like bus timetables or flashing lights — line up.',
  specRef: 'Edexcel 1MA1 N4',
};

/* ------------------------------------------------------------------ */
C['y8-order-of-operations'] = {
  overview: `<p>A calculation such as 5 + 3 × 4 could give 32 or 17 depending on what you do first. Mathematicians agree on one order — often remembered as <b>BIDMAS</b> — so everyone gets the same answer. Calculators follow it too, so knowing it helps you type calculations correctly.</p>`,
  objectives: [
    'I can apply BIDMAS to calculations with brackets, powers and the four operations.',
    'I can work out calculations written as a fraction by treating the fraction bar as a bracket.',
    'I can insert brackets to make a calculation correct.',
    'I can enter multi-step calculations into a calculator correctly.',
  ],
  keyWords: [
    { term: 'BIDMAS', def: 'Brackets, Indices, Division and Multiplication, Addition and Subtraction — the order of operations.' },
    { term: 'Indices', def: 'Powers and roots, such as 3<sup>2</sup> or ' + sq(16) + '.' },
    { term: 'Operation', def: 'Something you do to numbers: add, subtract, multiply, divide, power or root.' },
    { term: 'Priority', def: 'Which operation must be carried out first.' },
  ],
  sections: [
    {
      title: 'The BIDMAS order',
      html: `${rule('<b>B</b>rackets → <b>I</b>ndices → <b>D</b>ivision and <b>M</b>ultiplication → <b>A</b>ddition and <b>S</b>ubtraction')}
<p>Division and multiplication have <b>equal</b> priority: work them from left to right. The same goes for addition and subtraction.</p>
${W('Work out 5 + 3 × 4.', ['There are no brackets or powers.', 'Multiplication comes before addition: 3 × 4 = 12.', 'Then 5 + 12.'], '17')}
${W('Work out 20 − 12 ÷ 4 + 1.', ['Division first: 12 ÷ 4 = 3.', 'Now 20 − 3 + 1. Addition and subtraction are equal, so go left to right.', '20 − 3 = 17, then 17 + 1 = 18.'], '18')}
${note('A common trap: 20 − 3 + 1 is <b>not</b> 20 − 4. Work left to right.')}`,
    },
    {
      title: 'Brackets and powers',
      html: `<p>Anything inside brackets is done first. Powers (indices) come next, and they only apply to the number directly before them unless there are brackets.</p>
${W('Work out 3 × 2<sup>3</sup>.', ['Indices first: 2<sup>3</sup> = 8.', 'Then 3 × 8.'], '24')}
${W('Work out (5 + 3) × 4 − 6<sup>2</sup> ÷ 9.', ['Brackets: 5 + 3 = 8.', 'Indices: 6<sup>2</sup> = 36.', 'Multiply and divide: 8 × 4 = 32 and 36 ÷ 9 = 4.', 'Subtract: 32 − 4 = 28.'], '28')}`,
    },
    {
      title: 'Fraction bars and roots',
      html: `<p>A fraction line acts like a pair of brackets around the top and around the bottom. Work out the numerator and the denominator separately, then divide. A root sign covers everything underneath it.</p>
${W('Work out ' + f('18 + 6', '10 − 4') + '.', ['Numerator: 18 + 6 = 24.', 'Denominator: 10 − 4 = 6.', 'Divide: 24 ÷ 6.'], '4')}
${W('Work out ' + sq('16 + 9') + '.', ['Everything under the root is grouped: 16 + 9 = 25.', 'Then ' + sq(25) + ' = 5.'], '5 (not 4 + 3 = 7)')}
${note('On a calculator use the fraction key, or type brackets: (18 + 6) ÷ (10 − 4).')}`,
    },
    {
      title: 'Inserting brackets',
      html: `<p>Some questions give you a calculation and an answer and ask where the brackets should go. Try brackets in different places and check each one.</p>
${W('Insert one pair of brackets to make 4 + 6 × 3 − 1 = 29 true.', ['Without brackets: 4 + 18 − 1 = 21. Too small.', 'Try 4 + 6 × (3 − 1) = 4 + 12 = 16. No.', 'Try (4 + 6) × 3 − 1 = 30 − 1 = 29. Yes.'], '(4 + 6) × 3 − 1 = 29')}`,
    },
  ],
  mistakes: [
    'Working strictly left to right and ignoring BIDMAS, e.g. 5 + 3 × 4 = 32.',
    'Thinking multiplication always comes before division (they are equal — go left to right).',
    'Squaring the wrong number, e.g. treating 3 × 2<sup>3</sup> as 6<sup>3</sup>.',
    'Typing 18 + 6 ÷ 10 − 4 into a calculator without brackets for a fraction.',
  ],
  examTips: [
    'Write each step on a new line so method marks can be awarded even if you slip later.',
    'For "insert brackets" questions, show the check that proves your answer works.',
    'On the calculator paper, write down the full calculator display before rounding.',
  ],
  realLife: 'Spreadsheets and programming languages use exactly the same order of operations, so a misplaced bracket in a formula can give a completely wrong bill or score.',
  specRef: 'Edexcel 1MA1 N3',
};

/* ------------------------------------------------------------------ */
C['y8-algebraic-notation'] = {
  overview: `<p>Algebra uses letters to stand for numbers so we can write general rules. In this topic you learn the conventions for writing algebra neatly, the difference between an <b>expression</b>, an <b>equation</b>, a <b>formula</b> and an <b>identity</b>, and how to <b>simplify</b> by collecting like terms and multiplying or dividing terms.</p>`,
  objectives: [
    'I can write expressions using algebraic conventions (e.g. 3a instead of 3 × a).',
    'I can tell the difference between an expression, equation, formula and identity.',
    'I can simplify expressions by collecting like terms, including terms with powers.',
    'I can simplify products and quotients such as 3a × 4b and 12ab ÷ 3a.',
    'I can form expressions from worded problems and shapes.',
  ],
  keyWords: [
    { term: 'Term', def: 'A single number, letter or product of these, e.g. 5, x, 7ab or 3x<sup>2</sup>.' },
    { term: 'Expression', def: 'A collection of terms with no equals sign, e.g. 3x + 2y.' },
    { term: 'Equation', def: 'A statement with an equals sign that is true only for certain values, e.g. 2x + 1 = 9.' },
    { term: 'Formula', def: 'A rule linking different variables, e.g. A = lw.' },
    { term: 'Identity', def: 'A statement true for every value of the letter, written with ≡, e.g. 2(x + 3) ≡ 2x + 6.' },
    { term: 'Like terms', def: 'Terms with exactly the same letters and powers, such as 4x<sup>2</sup> and −x<sup>2</sup>.' },
    { term: 'Coefficient', def: 'The number in front of a letter, e.g. 7 in 7y.' },
  ],
  sections: [
    {
      title: 'Writing algebra properly',
      html: `${table(['Meaning', 'Write it as'], [['3 × a', '3a'], ['a × b', 'ab'], ['y × y', 'y<sup>2</sup>'], ['1 × x', 'x (not 1x)'], ['a ÷ 4', f('a', 4)], ['n × 5 + 2', '5n + 2 (number first)']])}
<p>Letters in a product are usually written in alphabetical order: b × 3 × a = 3ab.</p>
${W('A pen costs p pence and a ruler costs r pence. Write an expression for the cost of 4 pens and 2 rulers.', ['4 pens cost 4 × p = 4p.', '2 rulers cost 2 × r = 2r.', 'Add them together.'], '4p + 2r pence')}`,
    },
    {
      title: 'Expression, equation, formula or identity?',
      html: `${table(['Example', 'Type', 'Why'], [['5x − 2y', 'Expression', 'No equals sign'], ['3x + 1 = 13', 'Equation', 'True only when x = 4'], ['P = 2l + 2w', 'Formula', 'Links different quantities'], ['4(n + 2) ≡ 4n + 8', 'Identity', 'True for every n']])}
${note('Test for an identity: try two different values of the letter. If both sides are always equal, it is an identity.')}`,
    },
    {
      title: 'Collecting like terms',
      html: `<p>Only <b>like terms</b> can be added or subtracted. The sign in front of a term belongs to that term — move it with the term.</p>
${W('Simplify 5a + 3b − 2a + b.', ['The a terms: 5a − 2a = 3a.', 'The b terms: 3b + b = 4b (b means 1b).', 'Write the answer with no like terms left.'], '3a + 4b')}
${W('Simplify 4x<sup>2</sup> + 3x − x<sup>2</sup> + 5x − 7.', ['x<sup>2</sup> terms: 4x<sup>2</sup> − x<sup>2</sup> = 3x<sup>2</sup>.', 'x terms: 3x + 5x = 8x.', 'Number term: −7.'], '3x<sup>2</sup> + 8x − 7')}
${note('x<sup>2</sup> and x are <b>not</b> like terms — they cannot be combined.')}`,
    },
    {
      title: 'Multiplying and dividing terms',
      html: `<p>When multiplying, multiply the numbers, then put the letters together. When dividing, write it as a fraction and cancel.</p>
${W('Simplify 3a × 4b.', ['Numbers: 3 × 4 = 12.', 'Letters: a × b = ab.'], '12ab')}
${W('Simplify 2x × 5x.', ['Numbers: 2 × 5 = 10.', 'Letters: x × x = x<sup>2</sup>.'], '10x<sup>2</sup>')}
${W('Simplify 12ab ÷ 3a.', ['Write as ' + f('12ab', '3a') + '.', 'Numbers: 12 ÷ 3 = 4.', 'The a on top cancels with the a on the bottom, leaving b.'], '4b')}`,
    },
    {
      title: 'Forming expressions',
      html: `${W('A rectangle has length 2x + 3 and width x − 1. Write a simplified expression for its perimeter.', ['Perimeter = length + width + length + width.', '= (2x + 3) + (x − 1) + (2x + 3) + (x − 1).', 'x terms: 2x + x + 2x + x = 6x. Numbers: 3 − 1 + 3 − 1 = 4.'], '6x + 4')}`,
    },
  ],
  mistakes: [
    'Combining unlike terms, e.g. 3x + 2y = 5xy or x<sup>2</sup> + x = x<sup>3</sup>.',
    'Losing the negative sign when terms are rearranged, e.g. 5a − 2b + a written as 6a + 2b.',
    'Writing x × x as 2x instead of x<sup>2</sup>.',
    'Calling an expression an equation when it has no equals sign.',
  ],
  examTips: [
    '"Simplify" means collect like terms or cancel — you do not need to find a value for x.',
    'Circle or underline like terms (including their signs) before collecting them.',
    'For "identity" questions, the answer usually uses the ≡ symbol and is true for all values.',
  ],
  realLife: 'Spreadsheet formulas, computer code and scientific laws all use letters for values that can change — exactly the notation you learn here.',
  specRef: 'Edexcel 1MA1 A1, A3, A4',
};

/* ------------------------------------------------------------------ */
C['y8-substitution'] = {
  overview: `<p><b>Substitution</b> means replacing the letters in an expression or formula with numbers and working out the value. It is how formulas are actually used — from working out speeds in physics to costing a phone contract. You will also substitute negative numbers and start to <b>rearrange</b> simple formulae.</p>`,
  objectives: [
    'I can substitute positive and negative numbers into expressions.',
    'I can use BIDMAS correctly when substituting, including with powers.',
    'I can substitute into formulae, including ones written in words.',
    'I can substitute and then solve to find an unknown in a formula.',
    'I can rearrange a simple formula to change its subject.',
  ],
  keyWords: [
    { term: 'Substitute', def: 'Replace a letter with a given number.' },
    { term: 'Variable', def: 'A letter whose value can change.' },
    { term: 'Formula', def: 'A rule showing how one variable is worked out from others, e.g. v = u + at.' },
    { term: 'Subject', def: 'The single letter on its own on one side of a formula, e.g. v in v = u + at.' },
    { term: 'Evaluate', def: 'Work out the numerical value.' },
  ],
  sections: [
    {
      title: 'Substituting into expressions',
      html: `<p>Replace each letter with its value, putting the number in <b>brackets</b> — this is especially important for negative numbers. Then use BIDMAS.</p>
${W('Given a = 3 and b = −2, work out 4a + 5b.', ['4a = 4 × 3 = 12.', '5b = 5 × (−2) = −10.', '12 + (−10) = 2.'], '2')}
${W('Given a = 3 and b = −2, work out 2a − b.', ['2a = 6.', '− b = −(−2) = +2.', '6 + 2 = 8.'], '8')}`,
    },
    {
      title: 'Powers and negatives',
      html: `<p>The power applies only to the letter it is attached to. In 3b<sup>2</sup>, square b first and then multiply by 3.</p>
${W('Given b = −2, work out 3b<sup>2</sup>.', ['b<sup>2</sup> = (−2)<sup>2</sup> = 4.', '3 × 4 = 12.'], '12 (not (3 × −2)<sup>2</sup> = 36)')}
${W('Given a = 3 and b = −2, work out ' + f('3a + b', 'a − 1') + '.', ['Numerator: 3 × 3 + (−2) = 9 − 2 = 7.', 'Denominator: 3 − 1 = 2.', '7 ÷ 2 = 3.5.'], '3.5')}`,
    },
    {
      title: 'Using formulae',
      html: `<p>A formula connects variables. Substitute the values you know, then evaluate.</p>
${W('The formula v = u + at gives the final speed of an object. Find v when u = 5, a = 3 and t = 4.', ['v = 5 + 3 × 4.', 'Multiply first: 3 × 4 = 12.', 'v = 5 + 12 = 17.'], 'v = 17')}
${W('The perimeter of a rectangle is P = 2l + 2w. P = 30 cm and w = 4 cm. Find l.', ['Substitute: 30 = 2l + 2 × 4 = 2l + 8.', 'Subtract 8 from both sides: 22 = 2l.', 'Divide by 2: l = 11.'], 'l = 11 cm')}
${note('If the unknown is not the subject, substitute first and then solve the equation that is left.')}`,
    },
    {
      title: 'Changing the subject',
      html: `<p>To make a different letter the subject, undo the operations around it in reverse order, doing the same to both sides — just like solving an equation.</p>
${W('Make x the subject of y = 3x + 2.', ['x is multiplied by 3, then 2 is added.', 'Undo +2: y − 2 = 3x.', 'Undo ×3: divide both sides by 3.'], 'x = ' + f('y − 2', 3))}
${W('Use your rearranged formula to find x when y = 17.', ['x = (17 − 2) ÷ 3 = 15 ÷ 3.'], 'x = 5')}`,
    },
  ],
  mistakes: [
    'Writing 3b as 3 followed by the digit, e.g. b = 4 gives 34 instead of 12.',
    'Squaring the coefficient as well, e.g. treating 3b<sup>2</sup> as (3b)<sup>2</sup>.',
    'Forgetting that subtracting a negative value makes the answer bigger.',
    'Undoing operations in the wrong order when changing the subject.',
  ],
  examTips: [
    'Write the substituted line out in full with brackets before calculating — it earns a method mark.',
    'If a formula is given on the paper, copy it down exactly before you substitute.',
    'Check rearranged formulae by substituting a simple pair of values into both versions.',
  ],
  realLife: 'Engineers, nurses and electricians substitute into formulae daily — for example calculating medicine doses from a patient’s weight.',
  specRef: 'Edexcel 1MA1 A2, A5',
};


/* ------------------------------------------------------------------ */
C['y8-angle-facts'] = {
  overview: `<p>Angles follow a small set of rules, and almost every geometry question is solved by chaining these rules together. In this topic you revise basic angle facts, then learn the angle relationships created when a line crosses <b>parallel lines</b>. In the exam you must also give a <b>reason</b> for every step.</p>`,
  objectives: [
    'I can use angles on a straight line, around a point and vertically opposite angles.',
    'I can use the angle sums of triangles and quadrilaterals, including isosceles triangles.',
    'I can identify alternate, corresponding and co-interior angles on parallel lines.',
    'I can solve multi-step angle problems and give a correct geometric reason for each step.',
  ],
  keyWords: [
    { term: 'Vertically opposite', def: 'The equal angles opposite each other where two straight lines cross.' },
    { term: 'Parallel lines', def: 'Lines that stay the same distance apart and never meet; shown with matching arrows.' },
    { term: 'Transversal', def: 'A line that crosses two or more other lines.' },
    { term: 'Alternate angles', def: 'Equal angles on opposite sides of a transversal, inside the parallel lines (a Z shape).' },
    { term: 'Corresponding angles', def: 'Equal angles in matching positions at each parallel line (an F shape).' },
    { term: 'Co-interior angles', def: 'Angles between the parallel lines on the same side of the transversal; they add up to 180° (a C shape).' },
    { term: 'Isosceles triangle', def: 'A triangle with two equal sides and two equal base angles.' },
  ],
  sections: [
    {
      title: 'Basic angle facts',
      html: `${table(['Fact', 'Total'], [['Angles on a straight line', '180°'], ['Angles around a point', '360°'], ['Vertically opposite angles', 'are equal'], ['Angles in a triangle', '180°'], ['Angles in a quadrilateral', '360°']])}
${W('Two angles on a straight line are 47° and x. Find x.', ['Angles on a straight line add up to 180°.', 'x = 180 − 47.'], 'x = 133°')}
${W('An isosceles triangle has one angle of 40° between its two equal sides. Find the other two angles.', ['Angles in a triangle add up to 180°: 180 − 40 = 140.', 'The base angles of an isosceles triangle are equal: 140 ÷ 2 = 70.'], '70° and 70°')}`,
    },
    {
      title: 'Angles on parallel lines',
      html: `<p>When a transversal crosses two parallel lines it creates eight angles, but only <b>two different sizes</b>. Every acute angle is equal, every obtuse angle is equal, and an acute and an obtuse angle always add up to 180°.</p>
<svg viewBox="0 0 300 170" width="100%" style="max-width:340px" role="img" aria-label="Two parallel lines cut by a transversal">
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="50" x2="280" y2="50"/><line x1="20" y1="120" x2="280" y2="120"/><line x1="100" y1="160" x2="200" y2="10"/></g>
<g stroke="currentColor" stroke-width="2" fill="none"><polyline points="235,44 243,50 235,56"/><polyline points="235,114 243,120 235,126"/></g>
<g font-size="13" text-anchor="middle"><text x="190" y="44" fill="#3b6cf6">a</text><text x="160" y="66" fill="#3b6cf6">c</text><text x="194" y="68" fill="currentColor">d</text><text x="144" y="114" fill="#3b6cf6">b</text></g>
</svg>
${table(['Pair in the diagram', 'Name', 'Shape', 'Rule'], [['a and b', 'Corresponding', 'F', 'Equal'], ['c and b', 'Alternate', 'Z', 'Equal'], ['d and b', 'Co-interior', 'C', 'Add up to 180°']])}
${note('Angles a and c are also equal because they are vertically opposite. The blue angles are all the same size.')}`,
    },
    {
      title: 'Using parallel line rules',
      html: `${W('Two parallel lines are crossed by a transversal. One angle between the lines is 65°. Find (a) its alternate angle and (b) its co-interior angle.', ['Alternate angles are equal, so the alternate angle is 65°.', 'Co-interior angles add up to 180°, so the co-interior angle is 180 − 65 = 115°.'], '(a) 65° (b) 115°')}
${rule('Always write the reason in full: "alternate angles are equal", "corresponding angles are equal", "co-interior angles add up to 180°".')}`,
    },
    {
      title: 'Multi-step problems with reasons',
      html: `<p>Find any angle you can, write its reason, and keep going until you reach the angle you need.</p>
${W('The angles of a triangle are x, 2x and 3x. Find the size of each angle.', ['Angles in a triangle add up to 180°: x + 2x + 3x = 180.', '6x = 180, so x = 30.', 'The angles are 30°, 2 × 30 = 60° and 3 × 30 = 90°.', 'Check: 30 + 60 + 90 = 180 ✓'], '30°, 60°, 90°')}
${W('ABC is a straight line. Angle ABD = 3y and angle DBC = y + 20. Find y.', ['Angles on a straight line add up to 180°: 3y + y + 20 = 180.', '4y + 20 = 180, so 4y = 160.', 'y = 40.'], 'y = 40')}
${note('"Z angles" or "F angles" will not get the reason mark — use the proper names.')}`,
    },
  ],
  mistakes: [
    'Using parallel line rules when the lines are not marked as parallel.',
    'Mixing up alternate (equal) and co-interior (add to 180°) angles.',
    'Giving reasons such as "Z angles" or "because it looks the same".',
    'Measuring angles with a protractor when the diagram says "not drawn accurately".',
  ],
  examTips: [
    '"Give a reason for your answer" means you must name the angle fact, not just show the sum.',
    'Write the angles you find onto the diagram as you go — examiners give credit for them.',
    'Check that your angles at a point or on a line add to the correct total before moving on.',
  ],
  realLife: 'Carpenters, architects and road designers rely on parallel line angle facts to make roofs, stair rails and junctions fit together accurately.',
  specRef: 'Edexcel 1MA1 G1, G3',
};

/* ------------------------------------------------------------------ */
C['y8-fractions'] = {
  overview: `<p>Fractions describe parts of a whole and appear all through GCSE maths. This topic builds full fluency with all four operations: adding and subtracting with <b>different denominators</b>, working with <b>mixed numbers</b>, and multiplying and dividing fractions — all without a calculator.</p>`,
  objectives: [
    'I can simplify fractions and compare them using a common denominator.',
    'I can add and subtract fractions and mixed numbers with different denominators.',
    'I can multiply fractions and mixed numbers, cancelling where possible.',
    'I can divide fractions using the reciprocal.',
    'I can find a fraction of an amount.',
  ],
  keyWords: [
    { term: 'Numerator', def: 'The top number of a fraction — how many parts you have.' },
    { term: 'Denominator', def: 'The bottom number — how many equal parts the whole is split into.' },
    { term: 'Equivalent fractions', def: 'Fractions that are equal in value, such as ' + f(2, 3) + ' and ' + f(8, 12) + '.' },
    { term: 'Mixed number', def: 'A whole number and a fraction together, such as 2' + f(1, 3) + '.' },
    { term: 'Improper fraction', def: 'A fraction whose numerator is bigger than its denominator, such as ' + f(7, 3) + '.' },
    { term: 'Reciprocal', def: 'A fraction turned upside down; the reciprocal of ' + f(2, 3) + ' is ' + f(3, 2) + '.' },
  ],
  sections: [
    {
      title: 'Comparing and simplifying',
      html: `<p>To simplify, divide the numerator and denominator by their <b>HCF</b>. To compare, rewrite the fractions over a <b>common denominator</b>.</p>
${W('Which is larger, ' + f(5, 8) + ' or ' + f(3, 5) + '?', ['A common denominator is 40.', f(5, 8) + ' = ' + f(25, 40) + ' and ' + f(3, 5) + ' = ' + f(24, 40) + '.', '25 &gt; 24.'], f(5, 8) + ' is larger')}`,
    },
    {
      title: 'Adding and subtracting',
      html: `${rule('Make the denominators the same → add or subtract the numerators → simplify')}
${W('Work out ' + f(2, 3) + ' + ' + f(3, 4) + '.', ['The lowest common denominator of 3 and 4 is 12.', f(2, 3) + ' = ' + f(8, 12) + ' and ' + f(3, 4) + ' = ' + f(9, 12) + '.', f(8, 12) + ' + ' + f(9, 12) + ' = ' + f(17, 12) + '.', 'As a mixed number: 17 ÷ 12 = 1 remainder 5.'], '1' + f(5, 12))}
${W('Work out 2' + f(1, 3) + ' − 1' + f(3, 4) + '.', ['Convert to improper fractions: 2' + f(1, 3) + ' = ' + f(7, 3) + ' and 1' + f(3, 4) + ' = ' + f(7, 4) + '.', 'Common denominator 12: ' + f(28, 12) + ' − ' + f(21, 12) + '.', '= ' + f(7, 12) + '.'], f(7, 12))}
${note('Never add the denominators: ' + f(1, 2) + ' + ' + f(1, 4) + ' is not ' + f(2, 6) + '.')}`,
    },
    {
      title: 'Multiplying fractions',
      html: `${rule('Multiply the numerators, multiply the denominators. Mixed numbers must become improper fractions first.')}
${W('Work out ' + f(3, 5) + ' × ' + f(10, 21) + '.', ['Cancel before multiplying: 3 and 21 share a factor of 3 → 1 and 7; 5 and 10 share a factor of 5 → 1 and 2.', 'Now ' + f(1, 1) + ' × ' + f(2, 7) + '.'], f(2, 7))}
${W('Work out 1' + f(1, 2) + ' × 2' + f(2, 3) + '.', ['Improper fractions: ' + f(3, 2) + ' × ' + f(8, 3) + '.', 'Multiply: ' + f(24, 6) + '.', 'Simplify: 24 ÷ 6 = 4.'], '4')}`,
    },
    {
      title: 'Dividing fractions',
      html: `<p>Dividing by a fraction is the same as multiplying by its <b>reciprocal</b>. Keep the first fraction, change ÷ to ×, and flip the second fraction.</p>
${W('Work out ' + f(4, 9) + ' ÷ ' + f(2, 3) + '.', ['Keep, change, flip: ' + f(4, 9) + ' × ' + f(3, 2) + '.', 'Multiply: ' + f(12, 18) + '.', 'Simplify by dividing by 6.'], f(2, 3))}
${W('Work out 2' + f(1, 4) + ' ÷ 1' + f(1, 2) + '.', ['Improper fractions: ' + f(9, 4) + ' ÷ ' + f(3, 2) + '.', 'Keep, change, flip: ' + f(9, 4) + ' × ' + f(2, 3) + ' = ' + f(18, 12) + '.', 'Simplify: ' + f(3, 2) + ' = 1' + f(1, 2) + '.'], '1' + f(1, 2))}`,
    },
    {
      title: 'Fractions of amounts',
      html: `<p>Divide by the denominator to find one part, then multiply by the numerator.</p>
${W('Find ' + f(3, 8) + ' of 56 kg.', ['One eighth: 56 ÷ 8 = 7.', 'Three eighths: 7 × 3 = 21.'], '21 kg')}`,
    },
  ],
  mistakes: [
    'Adding or subtracting denominators as well as numerators.',
    'Multiplying mixed numbers by multiplying the whole parts and fraction parts separately.',
    'Flipping the first fraction instead of the second when dividing.',
    'Leaving answers unsimplified or as improper fractions when a mixed number is asked for.',
  ],
  examTips: [
    'On the non-calculator paper, show the common-denominator fractions — they earn method marks.',
    'Give your final answer in its simplest form unless told otherwise.',
    'Check with an estimate: 2' + f(1, 4) + ' ÷ 1' + f(1, 2) + ' should be a bit more than 1.',
  ],
  realLife: 'Recipes, music time signatures and DIY measurements in inches all rely on adding, scaling and dividing fractions.',
  specRef: 'Edexcel 1MA1 N1, N2, N8',
};

/* ------------------------------------------------------------------ */
C['y8-decimals-percentages'] = {
  overview: `<p>Fractions, decimals and percentages are three ways of writing the same value. Moving fluently between them lets you compare amounts, and <b>percentages</b> are used everywhere — discounts, interest and test scores. In this topic you convert between forms, find percentages of amounts and write one quantity as a percentage of another.</p>`,
  objectives: [
    'I can convert between fractions, decimals and percentages.',
    'I can order a mixed list of fractions, decimals and percentages.',
    'I can find a percentage of an amount with and without a calculator.',
    'I can write one quantity as a percentage of another.',
    'I can increase or decrease an amount by a percentage.',
  ],
  keyWords: [
    { term: 'Percentage', def: 'A number of parts out of 100; 35% means ' + f(35, 100) + '.' },
    { term: 'Terminating decimal', def: 'A decimal that ends, such as 0.375.' },
    { term: 'Recurring decimal', def: 'A decimal with a repeating pattern that goes on forever, such as 0.666…' },
    { term: 'Multiplier', def: 'The decimal you multiply by to find a percentage, e.g. 0.35 for 35%.' },
    { term: 'Equivalent', def: 'Having the same value, e.g. ' + f(1, 4) + ' = 0.25 = 25%.' },
  ],
  sections: [
    {
      title: 'Converting between forms',
      html: `${table(['Fraction', 'Decimal', 'Percentage'], [[f(1, 2), '0.5', '50%'], [f(1, 4), '0.25', '25%'], [f(1, 5), '0.2', '20%'], [f(1, 8), '0.125', '12.5%'], [f(1, 3), '0.333…', '33.3…%']])}
${rule('Decimal → percentage: × 100 &nbsp;&nbsp; Percentage → decimal: ÷ 100<br>Fraction → decimal: divide the numerator by the denominator')}
${W('Write ' + f(3, 8) + ' as a decimal and as a percentage.', ['Divide 3 by 8 using short division: 3.000 ÷ 8 = 0.375.', 'Multiply by 100: 0.375 × 100 = 37.5.'], '0.375 and 37.5%')}
${W('Write 0.45 as a fraction in its simplest form.', ['0.45 is 45 hundredths: ' + f(45, 100) + '.', 'Divide top and bottom by 5.'], f(9, 20))}`,
    },
    {
      title: 'Ordering mixed values',
      html: `<p>Convert everything to the same form — decimals are usually easiest — then compare.</p>
${W('Write in order, smallest first: 0.6, ' + f(5, 8) + ', 63%, 0.06.', ['Convert: ' + f(5, 8) + ' = 0.625 and 63% = 0.63.', 'Compare 0.6, 0.625, 0.63, 0.06 by place value.', 'Smallest is 0.06, then 0.6, then 0.625, then 0.63.'], '0.06, 0.6, ' + f(5, 8) + ', 63%')}`,
    },
    {
      title: 'Percentages of amounts',
      html: `<p><b>Without a calculator</b>, build up from 10% (divide by 10), 5% (half of 10%) and 1% (divide by 100). <b>With a calculator</b>, use the decimal multiplier.</p>
${W('Without a calculator, find 35% of £240.', ['10% = £24, so 30% = £72.', '5% = half of 10% = £12.', '35% = 30% + 5% = £72 + £12.'], '£84')}
${W('With a calculator, find 17.5% of 64 kg.', ['17.5% as a decimal multiplier is 0.175.', '0.175 × 64 = 11.2.'], '11.2 kg')}`,
    },
    {
      title: 'One quantity as a percentage of another',
      html: `${rule('Percentage = ' + f('part', 'whole') + ' × 100')}
${W('Maya scored 18 out of 25 in a quiz. What percentage is this?', [f(18, 25) + ' × 100.', 'Or make the denominator 100: ' + f(18, 25) + ' = ' + f(72, 100) + '.'], '72%')}
${note('Make sure both quantities are in the same units first: 30p as a percentage of £2 is 30 out of 200 = 15%.')}`,
    },
    {
      title: 'Increasing and decreasing',
      html: `<p>Find the percentage, then add it on (increase) or take it off (decrease). With a calculator you can do it in one step with a multiplier.</p>
${W('A jacket costs £60. The price increases by 15%. Find the new price.', ['15% of £60: 10% = £6, 5% = £3, so 15% = £9.', 'New price: £60 + £9 = £69.', 'Calculator method: 100% + 15% = 115%, so £60 × 1.15 = £69.'], '£69')}`,
    },
  ],
  mistakes: [
    'Thinking 0.06 = 60% instead of 6%.',
    'Writing ' + f(1, 8) + ' as 0.8 (confusing the denominator with the decimal).',
    'Finding the percentage but forgetting to add it on or take it off.',
    'Writing one quantity as a percentage of another with mixed units.',
  ],
  examTips: [
    'When comparing values, write each one as a decimal underneath so the examiner sees the method.',
    'On the calculator paper, use multipliers — they are quicker and less error-prone.',
    'Money answers need two decimal places, e.g. £8.40 not £8.4.',
  ],
  realLife: 'Shop sales, exam grades, phone battery levels and interest rates on savings are all given as percentages.',
  specRef: 'Edexcel 1MA1 N10, N12, R9',
};

/* ------------------------------------------------------------------ */
C['y8-expanding-brackets'] = {
  overview: `<p><b>Expanding</b> (or multiplying out) a bracket means multiplying every term inside it by the term outside. It is one of the most important skills in algebra: you need it to simplify expressions, solve equations and prove results. This topic covers single brackets, including negative terms outside the bracket.</p>`,
  objectives: [
    'I can expand a single bracket with a number outside.',
    'I can expand brackets with a letter or negative term outside.',
    'I can expand and simplify expressions with two or more brackets.',
    'I can use expanding to form and simplify expressions for areas.',
  ],
  keyWords: [
    { term: 'Expand', def: 'Multiply out the brackets so there are none left.' },
    { term: 'Term', def: 'A part of an expression separated by + or − signs.' },
    { term: 'Simplify', def: 'Collect like terms so the expression is as short as possible.' },
    { term: 'Coefficient', def: 'The number multiplying a letter, e.g. 6 in 6y.' },
  ],
  sections: [
    {
      title: 'Expanding with a number outside',
      html: `${rule('a(b + c) = ab + ac — multiply <b>every</b> term inside by the term outside.')}
<p>A grid can help you keep track:</p>
${table(['×', 'x', '+4'], [['<b>3</b>', '3x', '+12']])}
${W('Expand 3(x + 4).', ['3 × x = 3x.', '3 × 4 = 12.'], '3x + 12')}
${W('Expand 5(2y − 3).', ['5 × 2y = 10y.', '5 × (−3) = −15.'], '10y − 15')}`,
    },
    {
      title: 'Negative terms outside',
      html: `<p>When the term outside is negative, the signs inside change. Use the sign rules for multiplication.</p>
${W('Expand −2(3y − 5).', ['−2 × 3y = −6y.', '−2 × (−5) = +10 (negative × negative = positive).'], '−6y + 10')}
${note('A lone minus sign in front of a bracket means −1: −(x − 7) = −x + 7.')}`,
    },
    {
      title: 'Letters outside the bracket',
      html: `${W('Expand x(x + 7).', ['x × x = x<sup>2</sup>.', 'x × 7 = 7x.'], 'x<sup>2</sup> + 7x')}
${W('Expand 2a(3a − 4b).', ['2a × 3a = 6a<sup>2</sup>.', '2a × (−4b) = −8ab.'], '6a<sup>2</sup> − 8ab')}`,
    },
    {
      title: 'Expand and simplify',
      html: `<p>Expand each bracket separately, then collect like terms. Watch the sign in front of the second bracket — it belongs to the number outside.</p>
${W('Expand and simplify 5(x + 2) + 3(x − 1).', ['5(x + 2) = 5x + 10.', '3(x − 1) = 3x − 3.', 'Collect: 5x + 3x = 8x and 10 − 3 = 7.'], '8x + 7')}
${W('Expand and simplify 3(2x + 1) − 2(x − 4).', ['3(2x + 1) = 6x + 3.', '−2(x − 4) = −2x + 8.', 'Collect: 6x − 2x = 4x and 3 + 8 = 11.'], '4x + 11')}`,
    },
    {
      title: 'Expanding in context',
      html: `${W('A rectangle is 4 cm wide and (3x + 2) cm long. Write an expanded expression for its area.', ['Area = width × length = 4(3x + 2).', '4 × 3x = 12x and 4 × 2 = 8.'], '(12x + 8) cm<sup>2</sup>')}`,
    },
  ],
  mistakes: [
    'Multiplying only the first term: 3(x + 4) = 3x + 4.',
    'Getting the sign wrong with a negative outside, e.g. −2(x − 4) = −2x − 8.',
    'Writing x × x as 2x instead of x<sup>2</sup>.',
    'Forgetting to collect like terms after expanding two brackets.',
  ],
  examTips: [
    '"Expand" means remove the brackets; "expand and simplify" also means collect like terms — both are needed for full marks.',
    'Draw arrows from the outside term to each inside term so none are missed.',
    'Check by substituting x = 1 into the original and your answer — they should match.',
  ],
  realLife: 'Expanding brackets is how shops work out the total cost of several identical bundles, e.g. 3 meal deals of (sandwich + drink).',
  specRef: 'Edexcel 1MA1 A4',
};

/* ------------------------------------------------------------------ */
C['y8-linear-equations'] = {
  overview: `<p>An <b>equation</b> is a statement that two things are equal, and <b>solving</b> it means finding the value of the unknown that makes it true. Using the <b>balance method</b> — doing the same to both sides — you will solve equations of increasing difficulty, including ones with brackets, fractions and negative answers, and form your own equations from problems.</p>`,
  objectives: [
    'I can solve one-step and two-step equations using inverse operations.',
    'I can solve equations involving brackets.',
    'I can solve equations where the unknown is part of a fraction.',
    'I can solve equations with negative or fractional answers.',
    'I can form and solve an equation from a word or geometry problem.',
  ],
  keyWords: [
    { term: 'Equation', def: 'A statement with an equals sign containing an unknown, e.g. 3x + 7 = 22.' },
    { term: 'Solve', def: 'Find the value of the unknown that makes the equation true.' },
    { term: 'Inverse operation', def: 'The operation that undoes another, e.g. subtracting undoes adding.' },
    { term: 'Balance method', def: 'Doing exactly the same thing to both sides so the equation stays true.' },
    { term: 'Solution', def: 'The value that satisfies the equation.' },
  ],
  sections: [
    {
      title: 'The balance method',
      html: `<p>Picture the equation as a balanced pair of scales. To keep it balanced, whatever you do to one side you must do to the other. Undo the operations in <b>reverse order</b>: deal with + and − first, then × and ÷.</p>
${W('Solve 3x + 7 = 22.', ['Subtract 7 from both sides: 3x = 15.', 'Divide both sides by 3: x = 5.', 'Check: 3 × 5 + 7 = 22 ✓'], 'x = 5')}
${W('Solve ' + f('x', 4) + ' − 3 = 2.', ['Add 3 to both sides: ' + f('x', 4) + ' = 5.', 'Multiply both sides by 4: x = 20.'], 'x = 20')}`,
    },
    {
      title: 'Equations with brackets',
      html: `<p>Usually the safest approach is to expand the bracket first, then solve as normal.</p>
${W('Solve 4(x − 2) = 18.', ['Expand: 4x − 8 = 18.', 'Add 8 to both sides: 4x = 26.', 'Divide by 4: x = 6.5.', 'Check: 4 × (6.5 − 2) = 4 × 4.5 = 18 ✓'], 'x = 6.5')}
${note('Answers do not have to be whole numbers. Give them as a decimal or a fraction such as 6' + f(1, 2) + '.')}`,
    },
    {
      title: 'Negative answers and fractions',
      html: `${W('Solve 5x + 9 = 2.', ['Subtract 9 from both sides: 5x = −7.', 'Divide by 5: x = ' + f('−7', 5) + '.'], 'x = −1.4')}
${W('Solve ' + f('2x + 1', 3) + ' = 5.', ['Multiply both sides by 3 to clear the fraction: 2x + 1 = 15.', 'Subtract 1: 2x = 14.', 'Divide by 2: x = 7.'], 'x = 7')}`,
    },
    {
      title: 'Forming and solving equations',
      html: `<p>Use the information to write an equation, solve it, then answer the actual question asked.</p>
${W('The angles in a triangle are x, x + 20 and 2x. Find the largest angle.', ['Angles in a triangle add up to 180°: x + (x + 20) + 2x = 180.', 'Simplify: 4x + 20 = 180.', 'Subtract 20: 4x = 160, so x = 40.', 'Angles: 40°, 60°, 80°.'], '80°')}
${W('I think of a number, multiply it by 6 and subtract 5. The answer is 31. What was my number?', ['Let the number be n: 6n − 5 = 31.', 'Add 5: 6n = 36.', 'Divide by 6: n = 6.'], '6')}`,
    },
  ],
  mistakes: [
    'Doing an operation to only one side of the equation.',
    'Dividing before subtracting, e.g. turning 3x + 7 = 22 into x + 7 = 22 ÷ 3.',
    'Sign errors when moving numbers, e.g. 5x + 9 = 2 becoming 5x = 11.',
    'Finding x but not answering the actual question (e.g. the largest angle).',
  ],
  examTips: [
    'Write each step on a new line with the = signs lined up.',
    'Always substitute your answer back in to check — it takes seconds.',
    'If a question says "form an equation", you must write one down to get the method mark.',
  ],
  realLife: 'Equations are used to work out unknowns such as how many hours you must work to afford something or how much fuel a journey needs.',
  specRef: 'Edexcel 1MA1 A17',
};

/* ------------------------------------------------------------------ */
C['y8-perimeter-area'] = {
  overview: `<p><b>Perimeter</b> is the distance around the edge of a shape; <b>area</b> is the amount of flat space inside it. In Year 8 you learn the area formulae for triangles, parallelograms and trapezia, and use them to find the area and perimeter of compound shapes — always with the correct units.</p>`,
  objectives: [
    'I can find the perimeter of rectilinear and compound shapes.',
    'I can use the formulae for the area of a rectangle, triangle, parallelogram and trapezium.',
    'I can find the area of compound shapes by splitting or subtracting.',
    'I can work backwards from an area to find a missing length.',
    'I can convert between units of area such as cm<sup>2</sup> and m<sup>2</sup>.',
  ],
  keyWords: [
    { term: 'Perimeter', def: 'The total distance around the outside of a shape, measured in units of length (cm, m).' },
    { term: 'Area', def: 'The space inside a 2D shape, measured in square units (cm<sup>2</sup>, m<sup>2</sup>).' },
    { term: 'Perpendicular height', def: 'The height measured at right angles (90°) to the base.' },
    { term: 'Parallelogram', def: 'A quadrilateral with two pairs of parallel sides.' },
    { term: 'Trapezium', def: 'A quadrilateral with exactly one pair of parallel sides.' },
    { term: 'Compound shape', def: 'A shape made up of two or more simpler shapes.' },
  ],
  sections: [
    {
      title: 'Area formulae',
      html: `${table(['Shape', 'Area'], [['Rectangle', 'length × width'], ['Triangle', f(1, 2) + ' × base × perpendicular height'], ['Parallelogram', 'base × perpendicular height'], ['Trapezium', f(1, 2) + '(a + b)h, where a and b are the parallel sides']])}
${note('Always use the <b>perpendicular</b> height — the slanted side of a parallelogram or triangle is not the height.')}
${W('Find the area of a triangle with base 12 cm and perpendicular height 7 cm.', ['Area = ' + f(1, 2) + ' × 12 × 7.', '12 × 7 = 84, and half of 84 is 42.'], '42 cm<sup>2</sup>')}
${W('Find the area of a parallelogram with base 9 m and perpendicular height 5 m.', ['Area = base × height = 9 × 5.'], '45 m<sup>2</sup>')}`,
    },
    {
      title: 'The trapezium',
      html: `<svg viewBox="0 0 260 120" width="100%" style="max-width:300px" role="img" aria-label="Trapezium with parallel sides 6 cm and 10 cm and height 4 cm">
<polygon points="70,20 170,20 220,100 20,100" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="110" y1="20" x2="110" y2="100" stroke="#3b6cf6" stroke-width="1.5" stroke-dasharray="4 3"/>
<g fill="currentColor" font-size="13" text-anchor="middle"><text x="120" y="14">6 cm</text><text x="120" y="116">10 cm</text><text x="132" y="64" fill="#3b6cf6">4 cm</text></g>
</svg>
${W('Find the area of the trapezium shown: parallel sides 6 cm and 10 cm, height 4 cm.', ['Add the parallel sides: 6 + 10 = 16.', 'Halve: 16 ÷ 2 = 8.', 'Multiply by the height: 8 × 4 = 32.'], '32 cm<sup>2</sup>')}`,
    },
    {
      title: 'Compound shapes',
      html: `<p>Either <b>split</b> the shape into rectangles and triangles and add the areas, or find a large rectangle and <b>subtract</b> the missing piece. Work out any missing lengths first.</p>
${W('An L-shape is made by cutting a 4 cm by 3 cm rectangle from the corner of a 10 cm by 8 cm rectangle. Find its area and perimeter.', ['Area of the big rectangle: 10 × 8 = 80 cm<sup>2</sup>.', 'Subtract the cut-out: 80 − 4 × 3 = 80 − 12 = 68 cm<sup>2</sup>.', 'For the perimeter, the two inner edges (4 cm and 3 cm) replace the edges that were removed, so the perimeter is the same as the big rectangle: 10 + 8 + 10 + 8 = 36 cm.'], 'Area 68 cm<sup>2</sup>, perimeter 36 cm')}`,
    },
    {
      title: 'Working backwards',
      html: `${W('A rectangle has an area of 54 cm<sup>2</sup> and a width of 6 cm. Find its perimeter.', ['Area = length × width, so length = 54 ÷ 6 = 9 cm.', 'Perimeter = 9 + 6 + 9 + 6.'], '30 cm')}`,
    },
    {
      title: 'Units of area',
      html: `<p>1 m = 100 cm, but a square metre is 100 cm by 100 cm, so it contains 100 × 100 = 10 000 cm<sup>2</sup>.</p>
${rule('1 cm<sup>2</sup> = 100 mm<sup>2</sup> &nbsp;&nbsp; 1 m<sup>2</sup> = 10 000 cm<sup>2</sup>')}
${W('Convert 3.5 m<sup>2</sup> into cm<sup>2</sup>.', ['Multiply by 10 000.', '3.5 × 10 000 = 35 000.'], '35 000 cm<sup>2</sup>')}`,
    },
  ],
  mistakes: [
    'Using the slant side instead of the perpendicular height.',
    'Forgetting to halve when finding the area of a triangle or trapezium.',
    'Giving area in cm instead of cm<sup>2</sup>, or perimeter in cm<sup>2</sup>.',
    'Converting 1 m<sup>2</sup> to 100 cm<sup>2</sup> instead of 10 000 cm<sup>2</sup>.',
  ],
  examTips: [
    'The trapezium formula is not always given on Edexcel papers — learn it.',
    'Mark missing lengths on the diagram before you calculate.',
    'Check units match before calculating — convert mm to cm (or similar) first.',
  ],
  realLife: 'Area is used to buy the right amount of carpet, paint or turf, and perimeter tells you how much fencing or skirting board you need.',
  specRef: 'Edexcel 1MA1 G16, G17',
};

/* ------------------------------------------------------------------ */
C['y8-averages'] = {
  overview: `<p>An <b>average</b> is a single value that represents a whole set of data, and the <b>range</b> tells you how spread out it is. You will calculate the mean, median and mode, decide which average is most suitable, and use averages and range together to compare two sets of data.</p>`,
  objectives: [
    'I can find the mean, median, mode and range of a list of data.',
    'I can find the median of a list with an even number of values.',
    'I can work backwards from a mean to find a missing value.',
    'I can choose the most appropriate average and explain why.',
    'I can compare two distributions using an average and the range.',
  ],
  keyWords: [
    { term: 'Mean', def: 'The total of all the values divided by the number of values.' },
    { term: 'Median', def: 'The middle value when the data is written in order.' },
    { term: 'Mode', def: 'The value that occurs most often. There can be more than one, or none.' },
    { term: 'Range', def: 'Largest value − smallest value. It measures spread, not average.' },
    { term: 'Outlier', def: 'A value that is much bigger or smaller than the rest of the data.' },
  ],
  sections: [
    {
      title: 'Mean, median, mode and range',
      html: `${W('Find the mean, median, mode and range of 4, 7, 2, 9, 7, 5, 8.', ['Mean: total = 42, there are 7 values, 42 ÷ 7 = 6.', 'Median: order them: 2, 4, 5, 7, 7, 8, 9. The middle (4th) value is 7.', 'Mode: 7 appears twice, more than any other value.', 'Range: 9 − 2 = 7.'], 'mean 6, median 7, mode 7, range 7')}
${note('The position of the median is ' + f('n + 1', 2) + ' where n is the number of values. With 7 values it is the 4th.')}`,
    },
    {
      title: 'Median of an even number of values',
      html: `<p>With an even number of values there are two middle numbers. The median is halfway between them.</p>
${W('Find the median of 12, 15, 9, 20, 11, 18.', ['Order: 9, 11, 12, 15, 18, 20.', 'Six values, so the median is at position ' + f(7, 2) + ' = 3.5 — between the 3rd and 4th values.', 'Halfway between 12 and 15: (12 + 15) ÷ 2 = 13.5.'], '13.5')}`,
    },
    {
      title: 'Missing values from the mean',
      html: `${rule('Total = mean × number of values')}
${W('The mean of five numbers is 8. Four of the numbers are 6, 9, 11 and 10. Find the fifth number.', ['Total of all five: 8 × 5 = 40.', 'Total of the four known: 6 + 9 + 11 + 10 = 36.', 'Missing number: 40 − 36 = 4.'], '4')}`,
    },
    {
      title: 'Choosing an average',
      html: `${table(['Average', 'Good for', 'Weakness'], [['Mean', 'Uses every value', 'Distorted by outliers'], ['Median', 'Not affected by outliers', 'Ignores most values'], ['Mode', 'Non-numerical data (e.g. favourite colour)', 'May not exist or may not be typical']])}
${W('Five employees earn £22 000, £24 000, £25 000, £26 000 and £150 000. Which average best represents a typical salary?', ['£150 000 is an outlier, which drags the mean up to £49 400 — higher than four of the five salaries.', 'The median (£25 000) is in the middle of the typical salaries.'], 'The median, because it is not affected by the outlier')}`,
    },
    {
      title: 'Comparing distributions',
      html: `<p>To compare two groups, make <b>one comment about an average</b> and <b>one about the range</b>, and write both in context.</p>
${W('Class A: mean test score 64, range 30. Class B: mean 58, range 12. Compare the classes.', ['Average: Class A has a higher mean, so on average Class A scored higher.', 'Spread: Class B has a smaller range, so its scores were more consistent.'], 'Class A did better on average; Class B was more consistent')}`,
    },
  ],
  mistakes: [
    'Finding the median without putting the data in order first.',
    'Giving the range as "2 to 9" instead of the single value 7.',
    'Dividing by the wrong number of values when finding the mean.',
    'Comparing distributions with numbers only and no words in context.',
  ],
  examTips: [
    'Cross off values in pairs from each end to find the median reliably.',
    'For comparisons, use "on average" for the average and "more consistent" for a smaller range.',
    'Check that your mean lies between the smallest and largest values.',
  ],
  realLife: 'Averages are used for football players’ goals per game, average house prices, and checking whether a battery lasts as long as advertised.',
  specRef: 'Edexcel 1MA1 S4',
};

/* ------------------------------------------------------------------ */
C['y8-rounding'] = {
  overview: `<p>Exact answers are not always needed — or possible. <b>Rounding</b> gives a sensible, shorter value, and <b>estimating</b> lets you check that a calculator answer is reasonable. You will round to decimal places and significant figures, estimate calculations, and write <b>error intervals</b> to show the range a rounded value could have come from.</p>`,
  objectives: [
    'I can round numbers to a given number of decimal places.',
    'I can round numbers to a given number of significant figures.',
    'I can estimate the answer to a calculation by rounding to 1 significant figure.',
    'I can write error intervals for rounded and truncated values using inequalities.',
  ],
  keyWords: [
    { term: 'Decimal places (dp)', def: 'The number of digits after the decimal point.' },
    { term: 'Significant figures (sf)', def: 'Digits counted from the first non-zero digit.' },
    { term: 'Estimate', def: 'An approximate answer found using rounded numbers.' },
    { term: 'Error interval', def: 'The range of values a number could have been before it was rounded.' },
    { term: 'Truncate', def: 'Chop off digits after a certain point without rounding.' },
    { term: 'Upper / lower bound', def: 'The largest and smallest values that round to a given number.' },
  ],
  sections: [
    {
      title: 'Decimal places',
      html: `<p>Count the required number of digits after the decimal point, then look at the <b>next</b> digit (the decider). If it is 5 or more, round up; if it is 4 or less, leave the digit as it is.</p>
${W('Round 3.4762 to 2 decimal places.', ['Keep two digits after the point: 3.47 | 62.', 'The decider is 6, which is 5 or more, so round the 7 up to 8.'], '3.48')}`,
    },
    {
      title: 'Significant figures',
      html: `<p>The first significant figure is the <b>first non-zero digit</b>. Zeros at the front of a decimal never count. For big numbers, fill the gaps with zeros so the place value is kept.</p>
${W('Round 48 362 to 2 significant figures.', ['First two significant figures: 4 and 8 (4 tens of thousands, 8 thousands).', 'The decider is 3, so the 8 stays.', 'Replace the remaining digits with zeros to keep the size.'], '48 000')}
${W('Round 0.004725 to 2 significant figures.', ['The leading zeros do not count. The first significant figure is 4, the second is 7.', 'The decider is 2, so the 7 stays.'], '0.0047')}`,
    },
    {
      title: 'Estimating calculations',
      html: `${rule('To estimate, round every number to 1 significant figure, then calculate.')}
${W('Estimate ' + f('39.8 × 6.12', '0.198') + '.', ['Round to 1 sf: 39.8 → 40, 6.12 → 6, 0.198 → 0.2.', 'Numerator: 40 × 6 = 240.', 'Divide: 240 ÷ 0.2 = 2400 ÷ 2 = 1200.'], '≈ 1200 (the exact answer is about 1230)')}
${note('Dividing by a number less than 1 makes the answer bigger. 240 ÷ 0.2 is the same as 2400 ÷ 2.')}`,
    },
    {
      title: 'Error intervals',
      html: `<p>A rounded value could have come from anywhere within half a unit either side. The lower bound is included (≤) but the upper bound is not (&lt;), because it would round up.</p>
${W('A length is 7.4 cm, correct to 1 decimal place. Write the error interval for the length L.', ['The unit of rounding is 0.1, so half of it is 0.05.', 'Lower bound: 7.4 − 0.05 = 7.35. Upper bound: 7.4 + 0.05 = 7.45.'], '7.35 ≤ L &lt; 7.45')}
${W('A number x is truncated to 1 decimal place and the result is 6.7. Write the error interval for x.', ['Truncating chops digits off, so x started with 6.7… .', 'x can be anything from 6.7 up to (but not including) 6.8.'], '6.7 ≤ x &lt; 6.8')}`,
    },
  ],
  mistakes: [
    'Counting leading zeros as significant figures, e.g. writing 0.0047 as 0.00 to 2 sf.',
    'Dropping place value when rounding large numbers, e.g. 48 362 to 2 sf written as 48.',
    'Using ≤ at both ends of an error interval.',
    'Working out the exact answer and then rounding it when an estimate is asked for.',
  ],
  examTips: [
    'In estimation questions show the rounded numbers — that is where the marks are.',
    'Write down your full calculator display, then round, so you get method marks even if the rounding slips.',
    'Read whether the question says rounded or truncated — the error intervals are different.',
  ],
  realLife: 'Rounding and estimation are used to check bills, plan budgets and report populations or distances sensibly — no one quotes a city’s population to the exact person.',
  specRef: 'Edexcel 1MA1 N14, N15',
};

/* ------------------------------------------------------------------ */
C['y8-sequences'] = {
  overview: `<p>A <b>sequence</b> is a list of numbers that follows a rule. In a <b>linear</b> (arithmetic) sequence the terms go up or down by the same amount each time. You will find the <b>nth term</b> rule, use it to find any term, test whether a number is in a sequence, and recognise other special sequences.</p>`,
  objectives: [
    'I can continue a sequence using its term-to-term rule.',
    'I can generate terms of a sequence from its nth term.',
    'I can find the nth term of an increasing or decreasing linear sequence.',
    'I can decide whether a given number is a term in a sequence.',
    'I can recognise square, cube, triangular, Fibonacci-type and geometric sequences.',
  ],
  keyWords: [
    { term: 'Term', def: 'A number in a sequence.' },
    { term: 'Term-to-term rule', def: 'How to get from one term to the next, e.g. "add 3".' },
    { term: 'nth term', def: 'A position-to-term rule that gives any term from its position n, e.g. 3n + 2.' },
    { term: 'Common difference', def: 'The constant amount added each time in a linear sequence.' },
    { term: 'Linear sequence', def: 'A sequence with a common difference; its terms lie on a straight line when plotted.' },
    { term: 'Geometric sequence', def: 'A sequence where each term is multiplied by the same number, e.g. 3, 6, 12, 24.' },
  ],
  sections: [
    {
      title: 'Using the nth term',
      html: `<p>To generate a sequence from its nth term, substitute n = 1, 2, 3 … .</p>
${W('Write down the first four terms of the sequence with nth term 4n − 1.', ['n = 1: 4 × 1 − 1 = 3.', 'n = 2: 4 × 2 − 1 = 7.', 'n = 3: 11; n = 4: 15.'], '3, 7, 11, 15')}`,
    },
    {
      title: 'Finding the nth term',
      html: `${rule('nth term = (common difference) × n + (zero term)<br>The zero term is the term before the first one.')}
${table(['n', '0', '1', '2', '3', '4'], [['Term', '<b>2</b>', '5', '8', '11', '14']])}
${W('Find the nth term of 5, 8, 11, 14, …', ['The common difference is +3, so the rule starts 3n.', 'Work back one step from the first term: 5 − 3 = 2 (the zero term).', 'Check: n = 4 gives 3 × 4 + 2 = 14 ✓'], '3n + 2')}
${W('Find the nth term of 20, 16, 12, 8, …', ['The common difference is −4, so the rule starts −4n.', 'Zero term: 20 + 4 = 24.', 'Check: n = 3 gives 24 − 12 = 12 ✓'], '24 − 4n (or −4n + 24)')}`,
    },
    {
      title: 'Is a number in the sequence?',
      html: `<p>Set the nth term equal to the number and solve. If n is a <b>positive whole number</b>, the number is in the sequence.</p>
${W('Is 100 a term in the sequence 3n + 2? Find the 50th term too.', ['Solve 3n + 2 = 100: 3n = 98, n = 32.66…', 'n is not a whole number, so 100 is not in the sequence.', '50th term: 3 × 50 + 2 = 152.'], 'No, 100 is not a term; the 50th term is 152')}`,
    },
    {
      title: 'Patterns and special sequences',
      html: `${W('Pattern 1 uses 4 matchsticks, pattern 2 uses 7 and pattern 3 uses 10. How many matchsticks are in pattern 20?', ['The common difference is 3, and the zero term is 4 − 3 = 1, so the nth term is 3n + 1.', 'Pattern 20: 3 × 20 + 1 = 61.'], '61 matchsticks')}
${table(['Sequence', 'First terms', 'Rule'], [['Square numbers', '1, 4, 9, 16, 25', 'n<sup>2</sup>'], ['Cube numbers', '1, 8, 27, 64', 'n<sup>3</sup>'], ['Triangular numbers', '1, 3, 6, 10, 15', 'add 2, 3, 4, …'], ['Fibonacci', '1, 1, 2, 3, 5, 8', 'add the two previous terms'], ['Geometric', '3, 6, 12, 24', 'multiply by 2']])}`,
    },
  ],
  mistakes: [
    'Giving the term-to-term rule ("add 3") when the nth term is asked for.',
    'Writing n + 3 instead of 3n + … for a sequence that goes up in 3s.',
    'Using the first term instead of the zero term, e.g. writing 3n + 5 for 5, 8, 11.',
    'Saying a number is in the sequence because the equation "nearly" works.',
  ],
  examTips: [
    'Always check your nth term by substituting n = 1 and n = 2.',
    'For "Is … in the sequence?" questions, you must give a reason, e.g. "n is not a whole number".',
    'Write the common difference above the gaps between terms — it earns a mark.',
  ],
  realLife: 'Sequences model regular savings, taxi fares with a fixed charge plus a cost per mile, and seat numbers in rows of a theatre.',
  specRef: 'Edexcel 1MA1 A23, A24, A25',
};

/* ------------------------------------------------------------------ */
C['y8-ratio'] = {
  overview: `<p>A <b>ratio</b> compares the sizes of two or more quantities. Ratios are used to mix paint, scale recipes and share money fairly. In this topic you simplify ratios, share amounts in a given ratio, solve problems when you know one part, and connect ratios to fractions.</p>`,
  objectives: [
    'I can simplify a ratio, including ratios with different units.',
    'I can write a ratio in the form 1 : n.',
    'I can share an amount in a given ratio.',
    'I can find quantities when I know one part or the difference between parts.',
    'I can convert between ratios and fractions.',
  ],
  keyWords: [
    { term: 'Ratio', def: 'A comparison of quantities written with a colon, e.g. 3 : 4.' },
    { term: 'Simplest form', def: 'A ratio where the parts have no common factor other than 1.' },
    { term: 'Part', def: 'One share of a ratio; in 3 : 4 there are 7 parts in total.' },
    { term: 'Unit ratio', def: 'A ratio written as 1 : n or n : 1.' },
    { term: 'Proportion', def: 'A part compared with the whole, often written as a fraction.' },
  ],
  sections: [
    {
      title: 'Simplifying ratios',
      html: `<p>Divide every part by the <b>HCF</b>. If the units are different, convert them to the same unit first and then leave the units out.</p>
${W('Simplify 24 : 36.', ['The HCF of 24 and 36 is 12.', '24 ÷ 12 = 2 and 36 ÷ 12 = 3.'], '2 : 3')}
${W('Write 40 cm : 2 m in its simplest form.', ['Convert to the same units: 2 m = 200 cm.', '40 : 200. Divide both by 40.'], '1 : 5')}
${W('Write 4 : 10 in the form 1 : n.', ['Divide both parts by the first part, 4.', '4 ÷ 4 = 1 and 10 ÷ 4 = 2.5.'], '1 : 2.5')}`,
    },
    {
      title: 'Sharing in a ratio',
      html: `${rule('1. Add the parts. 2. Divide the total to find one part. 3. Multiply for each share.')}
${W('Share £84 between Amir and Beth in the ratio 3 : 4.', ['Total parts: 3 + 4 = 7.', 'One part: £84 ÷ 7 = £12.', 'Amir: 3 × £12 = £36. Beth: 4 × £12 = £48.', 'Check: £36 + £48 = £84 ✓'], 'Amir £36, Beth £48')}`,
    },
    {
      title: 'When you know one part',
      html: `<p>If the question gives you one share (not the total), use it to find the value of one part.</p>
${W('The ratio of boys to girls in a club is 5 : 7. There are 35 boys. How many members are there altogether?', ['5 parts = 35 boys, so 1 part = 35 ÷ 5 = 7.', 'Girls: 7 parts = 7 × 7 = 49.', 'Total: 35 + 49 = 84.'], '84 members')}
${W('Paint is mixed red : white = 2 : 5. There is 9 litres more white than red. How much red is there?', ['The difference is 5 − 2 = 3 parts.', '3 parts = 9 litres, so 1 part = 3 litres.', 'Red = 2 parts = 6 litres.'], '6 litres')}`,
    },
    {
      title: 'Ratios and fractions',
      html: `<p>In the ratio 3 : 4 there are 7 parts in total, so the first quantity is ${f(3, 7)} of the whole and the second is ${f(4, 7)}.</p>
${note('Be careful: in 3 : 4, the first share is <b>not</b> ' + f(3, 4) + ' of the total. ' + f(3, 4) + ' is how big the first share is compared with the second.')}
${W('Red and blue counters are in the ratio 2 : 3. What fraction of the counters are blue?', ['Total parts: 2 + 3 = 5.', 'Blue is 3 of the 5 parts.'], f(3, 5))}`,
    },
  ],
  mistakes: [
    'Dividing the total by one of the ratio numbers instead of the total number of parts.',
    'Writing a ratio in the wrong order (e.g. girls : boys when asked for boys : girls).',
    'Simplifying with different units, e.g. 40 cm : 2 m = 20 : 1.',
    'Thinking 3 : 4 means the first share is ' + f(3, 4) + ' of the total.',
  ],
  examTips: [
    'Draw a bar model with one box per part — it makes "know one part" questions clear.',
    'Check that your shares add back up to the total.',
    'Keep the order of the ratio the same as the order of the words in the question.',
  ],
  realLife: 'Ratios are used to mix concrete, dilute squash, scale recipes, set gear ratios on bikes and split prize money between winners.',
  specRef: 'Edexcel 1MA1 R4, R5, R6',
};

/* ------------------------------------------------------------------ */
C['y8-circles'] = {
  overview: `<p>Circles are everywhere — wheels, pizzas, clock faces. This topic introduces the names of the parts of a circle and the special number <b>π (pi)</b>, about 3.14159, which links a circle’s diameter to its circumference. You will calculate the <b>circumference</b> and <b>area</b> of circles and semicircles, both as decimals and in terms of π.</p>`,
  objectives: [
    'I can name the parts of a circle: radius, diameter, chord, tangent, arc, sector and segment.',
    'I can calculate the circumference of a circle using C = πd.',
    'I can calculate the area of a circle using A = πr<sup>2</sup>.',
    'I can find the perimeter and area of semicircles.',
    'I can give answers in terms of π and work backwards to find a radius or diameter.',
  ],
  keyWords: [
    { term: 'Radius', def: 'The distance from the centre of a circle to its edge.' },
    { term: 'Diameter', def: 'A straight line across a circle through the centre; it is twice the radius.' },
    { term: 'Circumference', def: 'The perimeter (distance around the edge) of a circle.' },
    { term: 'Chord', def: 'A straight line joining two points on the circumference.' },
    { term: 'Tangent', def: 'A straight line that touches the circle at exactly one point.' },
    { term: 'Sector / segment', def: 'A sector is a "pizza slice" between two radii; a segment is the region between a chord and an arc.' },
    { term: 'π (pi)', def: 'The ratio of circumference to diameter, approximately 3.14159.' },
  ],
  sections: [
    {
      title: 'Parts of a circle',
      html: `<svg viewBox="0 0 260 180" width="100%" style="max-width:300px" role="img" aria-label="Circle showing a radius, a diameter, a chord and a tangent">
<circle cx="120" cy="90" r="70" fill="none" stroke="currentColor" stroke-width="2"/>
<circle cx="120" cy="90" r="3" fill="currentColor"/>
<line x1="50" y1="90" x2="190" y2="90" stroke="currentColor" stroke-width="1.5"/>
<line x1="120" y1="90" x2="170" y2="41" stroke="#3b6cf6" stroke-width="2"/>
<line x1="64" y1="132" x2="176" y2="132" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 3"/>
<line x1="20" y1="20" x2="220" y2="20" stroke="#3b6cf6" stroke-width="1.5"/>
<g fill="currentColor" font-size="12"><text x="78" y="84">diameter</text><text x="150" y="76" fill="#3b6cf6">radius</text><text x="100" y="148">chord</text><text x="186" y="14" fill="#3b6cf6">tangent</text></g>
</svg>
${rule('Diameter = 2 × radius &nbsp;&nbsp; d = 2r')}`,
    },
    {
      title: 'Circumference',
      html: `${rule('C = πd &nbsp;&nbsp; or &nbsp;&nbsp; C = 2πr')}
${W('Find the circumference of a circle with diameter 12 cm. Give your answer to 1 decimal place.', ['C = π × 12.', 'Calculator: 37.699…'], '37.7 cm')}
${W('A circle has circumference 50 cm. Find its diameter to 1 decimal place.', ['C = πd, so d = C ÷ π.', 'd = 50 ÷ π = 15.915…'], '15.9 cm')}`,
    },
    {
      title: 'Area of a circle',
      html: `${rule('A = πr<sup>2</sup> — square the radius first, then multiply by π.')}
${W('Find the area of a circle with radius 5 cm, to 1 decimal place.', ['A = π × 5<sup>2</sup> = π × 25.', 'Calculator: 78.539…'], '78.5 cm<sup>2</sup>')}
${W('Find the area of a circle with diameter 12 cm. Give your answer in terms of π.', ['The radius is half the diameter: r = 6 cm.', 'A = π × 6<sup>2</sup> = 36π.'], '36π cm<sup>2</sup>')}
${note('"In terms of π" means leave π as a symbol — do not multiply it out.')}`,
    },
    {
      title: 'Semicircles',
      html: `<p>A semicircle is half a circle. Its area is half the circle’s area. Its <b>perimeter</b> is half the circumference <b>plus the straight edge</b> (the diameter).</p>
${W('Find the perimeter of a semicircle with diameter 10 cm, to 1 decimal place.', ['Curved edge: half of π × 10 = 5π = 15.707…', 'Add the straight edge: 15.707… + 10 = 25.707…'], '25.7 cm')}`,
    },
  ],
  mistakes: [
    'Using the diameter in A = πr<sup>2</sup> instead of the radius.',
    'Working out (πr)<sup>2</sup> instead of π × r<sup>2</sup>.',
    'Forgetting the straight edge when finding the perimeter of a semicircle.',
    'Mixing up circumference (a length, in cm) and area (in cm<sup>2</sup>).',
  ],
  examTips: [
    'Write the formula first, then substitute — this earns the method mark.',
    'Use the π button on your calculator, not 3.14, unless the question tells you otherwise.',
    'If asked for an answer "in terms of π" the question is usually on the non-calculator paper.',
  ],
  realLife: 'Bike computers use the wheel’s circumference to measure distance, and pizza sizes compare areas — a 12-inch pizza has more than twice the area of an 8-inch one.',
  specRef: 'Edexcel 1MA1 G9, G17',
};

/* ------------------------------------------------------------------ */
C['y8-probability'] = {
  overview: `<p><b>Probability</b> measures how likely something is to happen, on a scale from 0 (impossible) to 1 (certain). In this topic you calculate probabilities of equally likely outcomes, use the fact that probabilities of all possible outcomes add to 1, combine <b>mutually exclusive</b> events, and predict how often something should happen.</p>`,
  objectives: [
    'I can describe and mark probabilities on a 0–1 scale.',
    'I can calculate the probability of an event with equally likely outcomes.',
    'I can use the fact that the probabilities of all outcomes add up to 1.',
    'I can find the probability of one event or another for mutually exclusive events.',
    'I can calculate the expected number of times an outcome will happen.',
  ],
  keyWords: [
    { term: 'Outcome', def: 'A possible result of an experiment, e.g. rolling a 4.' },
    { term: 'Event', def: 'One or more outcomes, e.g. rolling an even number.' },
    { term: 'Equally likely', def: 'Outcomes that each have the same chance of happening.' },
    { term: 'Mutually exclusive', def: 'Events that cannot happen at the same time.' },
    { term: 'Expected frequency', def: 'How many times you would expect an outcome: probability × number of trials.' },
    { term: 'Biased', def: 'Not fair — some outcomes are more likely than others.' },
  ],
  sections: [
    {
      title: 'Calculating probability',
      html: `${rule('P(event) = ' + f('number of favourable outcomes', 'total number of outcomes') + ' (when outcomes are equally likely)')}
${W('A bag has 5 red, 3 blue and 2 green counters. One is taken at random. Find P(blue).', ['Total counters: 5 + 3 + 2 = 10.', 'Favourable outcomes: 3 blue.'], f(3, 10))}`,
    },
    {
      title: 'Probabilities add up to 1',
      html: `${rule('P(not A) = 1 − P(A)')}
${W('Using the same bag, find P(not green).', ['P(green) = ' + f(2, 10) + '.', 'P(not green) = 1 − ' + f(2, 10) + ' = ' + f(8, 10) + '.'], f(4, 5))}
${W('A spinner can land on red, blue, green or yellow. Find P(green).', ['The probabilities are given in the table below.', 'They must add to 1: 0.2 + 0.35 + 0.15 = 0.7.', 'P(green) = 1 − 0.7.'], '0.3')}
${table(['Colour', 'Red', 'Blue', 'Green', 'Yellow'], [['Probability', '0.2', '0.35', '?', '0.15']])}`,
    },
    {
      title: 'Mutually exclusive events',
      html: `<p>The spinner cannot land on red <b>and</b> blue at the same time, so these events are mutually exclusive. For mutually exclusive events you <b>add</b> the probabilities.</p>
${rule('P(A or B) = P(A) + P(B) for mutually exclusive events')}
${W('Using the spinner above, find P(red or blue).', ['Red and blue cannot happen together.', 'P(red or blue) = 0.2 + 0.35.'], '0.55')}
${W('A biased spinner has P(1) = 0.1, P(2) = 0.3, P(3) = x and P(4) = 2x. Find x.', ['All probabilities add to 1: 0.1 + 0.3 + x + 2x = 1.', '0.4 + 3x = 1, so 3x = 0.6.', 'x = 0.2.'], 'x = 0.2')}`,
    },
    {
      title: 'Expected outcomes',
      html: `${rule('Expected number = probability × number of trials')}
${W('The spinner above is spun 50 times. How many times would you expect it to land on red?', ['P(red) = 0.2.', '0.2 × 50 = 10.'], '10 times')}
${note('The expected number is a prediction. In a real experiment you might get 8 or 12 — that is normal random variation.')}`,
    },
  ],
  mistakes: [
    'Writing probabilities as ratios ("3 : 10") or words ("3 in 10").',
    'Giving a probability greater than 1.',
    'Adding probabilities of events that are not mutually exclusive.',
    'Thinking the expected number is guaranteed to happen.',
  ],
  examTips: [
    'Give probabilities as fractions, decimals or percentages only.',
    'In table questions, always check the probabilities add up to exactly 1.',
    'Fractions do not need simplifying in probability answers unless asked, but they must be correct.',
  ],
  realLife: 'Insurance companies, weather forecasters and game designers all use probability to predict how often events will happen.',
  specRef: 'Edexcel 1MA1 P3, P4',
};

/* ------------------------------------------------------------------ */
C['y9-indices'] = {
  overview: `<p>An <b>index</b> (or power) tells you how many times a number is multiplied by itself. The <b>laws of indices</b> let you multiply, divide and raise powers quickly without writing everything out. You will apply them to numbers and algebra, and meet the meaning of zero, negative and fractional indices.</p>`,
  objectives: [
    'I can use the multiplication and division laws of indices.',
    'I can raise a power to a power, including with a coefficient in a bracket.',
    'I can evaluate zero and negative indices.',
    'I can evaluate fractional indices using roots (Higher).',
    'I can simplify algebraic expressions using index laws.',
  ],
  keyWords: [
    { term: 'Index / power', def: 'The small raised number showing repeated multiplication, e.g. the 4 in 3<sup>4</sup>.' },
    { term: 'Base', def: 'The number or letter being raised to a power, e.g. 3 in 3<sup>4</sup>.' },
    { term: 'Reciprocal', def: '1 divided by a number; the reciprocal of 5 is ' + f(1, 5) + '.' },
    { term: 'Root', def: 'The inverse of a power, e.g. the cube root of 27 is 3 because 3<sup>3</sup> = 27.' },
    { term: 'Coefficient', def: 'The number in front of the letters in a term, e.g. 12 in 12a<sup>7</sup>.' },
  ],
  sections: [
    {
      title: 'The three main laws',
      html: `${rule('a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup> &nbsp;&nbsp; a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup> &nbsp;&nbsp; (a<sup>m</sup>)<sup>n</sup> = a<sup>mn</sup>')}
<p>These only work when the <b>bases are the same</b>. To see why the first works: 5<sup>3</sup> × 5<sup>4</sup> = (5 × 5 × 5) × (5 × 5 × 5 × 5), which is seven 5s multiplied together.</p>
${W('Simplify (a) 5<sup>3</sup> × 5<sup>4</sup> (b) x<sup>9</sup> ÷ x<sup>4</sup> (c) (y<sup>3</sup>)<sup>4</sup>.', ['(a) Add the powers: 3 + 4 = 7.', '(b) Subtract the powers: 9 − 4 = 5.', '(c) Multiply the powers: 3 × 4 = 12.'], '(a) 5<sup>7</sup> (b) x<sup>5</sup> (c) y<sup>12</sup>')}`,
    },
    {
      title: 'Index laws with coefficients',
      html: `<p>Deal with the numbers using normal arithmetic, then use the index laws on each letter separately.</p>
${W('Simplify 3a<sup>2</sup>b × 4a<sup>5</sup>b<sup>3</sup>.', ['Numbers: 3 × 4 = 12.', 'a terms: a<sup>2</sup> × a<sup>5</sup> = a<sup>7</sup>.', 'b terms: b<sup>1</sup> × b<sup>3</sup> = b<sup>4</sup>.'], '12a<sup>7</sup>b<sup>4</sup>')}
${W('Simplify (2x<sup>3</sup>)<sup>4</sup>.', ['Everything in the bracket is raised to the power 4.', '2<sup>4</sup> = 16 and (x<sup>3</sup>)<sup>4</sup> = x<sup>12</sup>.'], '16x<sup>12</sup>')}`,
    },
    {
      title: 'Zero and negative indices',
      html: `${rule('a<sup>0</sup> = 1 &nbsp;&nbsp;&nbsp; a<sup>−n</sup> = ' + f(1, 'a<sup>n</sup>'))}
<p>Why? 7<sup>3</sup> ÷ 7<sup>3</sup> = 7<sup>0</sup>, but anything divided by itself is 1. Similarly 2<sup>2</sup> ÷ 2<sup>5</sup> = 2<sup>−3</sup>, and ${f(4, 32)} = ${f(1, 8)}.</p>
${W('Evaluate (a) 7<sup>0</sup> (b) 2<sup>−3</sup> (c) (' + f(2, 3) + ')<sup>−2</sup>.', ['(a) Any non-zero number to the power 0 is 1.', '(b) 2<sup>−3</sup> = ' + f(1, '2<sup>3</sup>') + ' = ' + f(1, 8) + '.', '(c) A negative power of a fraction: flip it, then square: (' + f(3, 2) + ')<sup>2</sup> = ' + f(9, 4) + '.'], '(a) 1 (b) ' + f(1, 8) + ' (c) ' + f(9, 4))}
${note('A negative index does <b>not</b> make the answer negative: 2<sup>−3</sup> is a small positive number.')}`,
    },
    {
      title: 'Fractional indices (Higher)',
      html: `${rule('a<sup>1/n</sup> is the nth root of a &nbsp;&nbsp;&nbsp; a<sup>m/n</sup> = (nth root of a)<sup>m</sup>')}
${W('Evaluate (a) 25<sup>1/2</sup> (b) 27<sup>1/3</sup> (c) 8<sup>2/3</sup> (d) 16<sup>−1/2</sup>.', ['(a) Power ' + f(1, 2) + ' means square root: ' + sq(25) + ' = 5.', '(b) Power ' + f(1, 3) + ' means cube root: 3, because 3<sup>3</sup> = 27.', '(c) Cube root first: 2. Then square: 2<sup>2</sup> = 4.', '(d) 16<sup>1/2</sup> = 4, and the negative means reciprocal: ' + f(1, 4) + '.'], '(a) 5 (b) 3 (c) 4 (d) ' + f(1, 4))}
${note('With a fraction power, take the root first — it keeps the numbers small.')}`,
    },
    {
      title: 'Solving with indices',
      html: `${W('Find x if 3<sup>x</sup> × 3<sup>4</sup> = 3<sup>10</sup>.', ['Multiplying with the same base: 3<sup>x + 4</sup> = 3<sup>10</sup>.', 'So x + 4 = 10.'], 'x = 6')}
${W('Find x if 2<sup>x</sup> = 32.', ['Write 32 as a power of 2: 2 × 2 × 2 × 2 × 2 = 32 = 2<sup>5</sup>.'], 'x = 5')}`,
    },
  ],
  mistakes: [
    'Multiplying the powers when multiplying terms, e.g. x<sup>3</sup> × x<sup>4</sup> = x<sup>12</sup>.',
    'Multiplying the bases, e.g. 5<sup>3</sup> × 5<sup>4</sup> = 25<sup>7</sup>.',
    'Forgetting to raise the coefficient: (2x<sup>3</sup>)<sup>4</sup> = 2x<sup>12</sup>.',
    'Thinking a<sup>0</sup> = 0 or that a negative power gives a negative answer.',
  ],
  examTips: [
    'Learn the powers of 2, 3, 4 and 5 — they come up in non-calculator questions.',
    '"Write as a single power" means your answer should look like 5<sup>7</sup>, not a number.',
    'Deal with numbers and each letter separately, one step per line.',
  ],
  realLife: 'Computer memory is measured in powers of 2, and scientists use powers of 10 to describe tiny cells and enormous distances.',
  specRef: 'Edexcel 1MA1 N6, N7, A4',
};

/* ------------------------------------------------------------------ */
C['y9-expanding-double'] = {
  overview: `<p>Expanding <b>double brackets</b> such as (x + 3)(x + 5) means multiplying every term in the first bracket by every term in the second. The result is usually a <b>quadratic expression</b>. This skill is essential for factorising, solving quadratic equations and algebraic proof later in the GCSE.</p>`,
  objectives: [
    'I can expand two brackets of the form (x + a)(x + b) using a grid or FOIL.',
    'I can expand brackets with negative terms and coefficients of x.',
    'I can square a bracket, such as (x + 6)<sup>2</sup>.',
    'I can recognise the difference of two squares pattern.',
    'I can expand three brackets (Higher).',
  ],
  keyWords: [
    { term: 'Expand', def: 'Multiply out brackets to remove them.' },
    { term: 'Quadratic expression', def: 'An expression whose highest power is 2, e.g. x<sup>2</sup> + 8x + 15.' },
    { term: 'FOIL', def: 'First, Outer, Inner, Last — a way to remember the four multiplications.' },
    { term: 'Like terms', def: 'Terms with the same letters and powers, which can be collected.' },
    { term: 'Difference of two squares', def: 'The result (a + b)(a − b) = a<sup>2</sup> − b<sup>2</sup>.' },
  ],
  sections: [
    {
      title: 'The grid method',
      html: `<p>Put one bracket along the top and the other down the side. Multiply to fill each box, then collect like terms.</p>
${table(['×', 'x', '+5'], [['<b>x</b>', 'x<sup>2</sup>', '+5x'], ['<b>+3</b>', '+3x', '+15']])}
${W('Expand and simplify (x + 3)(x + 5).', ['Grid boxes: x<sup>2</sup>, 5x, 3x and 15.', 'Collect the x terms: 5x + 3x = 8x.'], 'x<sup>2</sup> + 8x + 15')}
${note('For (x + a)(x + b), the x term is (a + b)x and the number is a × b. Useful as a quick check.')}`,
    },
    {
      title: 'FOIL and negative terms',
      html: `${rule('<b>F</b>irst × First, <b>O</b>uter × Outer, <b>I</b>nner × Inner, <b>L</b>ast × Last — then simplify.')}
${W('Expand and simplify (x − 4)(x + 7).', ['F: x × x = x<sup>2</sup>.', 'O: x × 7 = 7x. I: −4 × x = −4x.', 'L: −4 × 7 = −28.', 'Collect: 7x − 4x = 3x.'], 'x<sup>2</sup> + 3x − 28')}
${W('Expand and simplify (2x − 3)(x − 5).', ['F: 2x × x = 2x<sup>2</sup>.', 'O: 2x × (−5) = −10x. I: −3 × x = −3x.', 'L: (−3) × (−5) = +15.', 'Collect: −10x − 3x = −13x.'], '2x<sup>2</sup> − 13x + 15')}`,
    },
    {
      title: 'Squaring a bracket',
      html: `<p>(x + 6)<sup>2</sup> means (x + 6)(x + 6). Always write it out as two brackets first.</p>
${W('Expand (x + 6)<sup>2</sup>.', ['Write as (x + 6)(x + 6).', 'x<sup>2</sup> + 6x + 6x + 36.', 'Collect: 12x.'], 'x<sup>2</sup> + 12x + 36')}
${note('(x + 6)<sup>2</sup> is <b>not</b> x<sup>2</sup> + 36 — the middle term 12x is easily forgotten.')}`,
    },
    {
      title: 'Difference of two squares',
      html: `${W('Expand (x − 5)(x + 5).', ['x<sup>2</sup> + 5x − 5x − 25.', 'The x terms cancel out: 5x − 5x = 0.'], 'x<sup>2</sup> − 25')}
${rule('(a + b)(a − b) = a<sup>2</sup> − b<sup>2</sup>')}`,
    },
    {
      title: 'Three brackets (Higher)',
      html: `<p>Expand two of the brackets first, then multiply the result by the third bracket.</p>
${W('Expand and simplify (x + 1)(x + 2)(x + 3).', ['First two: (x + 1)(x + 2) = x<sup>2</sup> + 3x + 2.', 'Multiply by (x + 3): x<sup>3</sup> + 3x<sup>2</sup> + 3x<sup>2</sup> + 9x + 2x + 6.', 'Collect: 6x<sup>2</sup> and 11x.'], 'x<sup>3</sup> + 6x<sup>2</sup> + 11x + 6')}`,
    },
  ],
  mistakes: [
    'Only multiplying first and last terms, e.g. (x + 3)(x + 5) = x<sup>2</sup> + 15.',
    'Writing (x + 6)<sup>2</sup> = x<sup>2</sup> + 36.',
    'Sign errors with negatives, e.g. (−3) × (−5) = −15.',
    'Forgetting to collect the two x terms at the end.',
  ],
  examTips: [
    'You should have four terms before simplifying — write them all down for the method mark.',
    'Check by substituting x = 1 into the brackets and into your answer.',
    '"Expand and simplify" needs the like terms collected for full marks.',
  ],
  realLife: 'Expanding brackets is used to find areas of shapes with algebraic sides, such as a garden whose length and width both increase by a path.',
  specRef: 'Edexcel 1MA1 A4',
};

/* ------------------------------------------------------------------ */
C['y9-factorising'] = {
  overview: `<p><b>Factorising</b> is the reverse of expanding: you put an expression back into brackets. It is used to simplify algebraic fractions and to solve quadratic equations. You will take out common factors, factorise quadratics of the form x<sup>2</sup> + bx + c, and spot the difference of two squares.</p>`,
  objectives: [
    'I can factorise an expression by taking out the highest common factor.',
    'I can factorise expressions where the common factor includes letters.',
    'I can factorise quadratics of the form x<sup>2</sup> + bx + c.',
    'I can factorise the difference of two squares.',
    'I can factorise quadratics of the form ax<sup>2</sup> + bx + c (Higher).',
  ],
  keyWords: [
    { term: 'Factorise', def: 'Write an expression as a product, usually using brackets.' },
    { term: 'Highest common factor', def: 'The biggest number and letters that divide into every term.' },
    { term: 'Fully factorise', def: 'Take out the highest common factor so nothing more can come out.' },
    { term: 'Quadratic', def: 'An expression where the highest power of x is 2.' },
    { term: 'Difference of two squares', def: 'An expression like x<sup>2</sup> − 49 which factorises to (x + 7)(x − 7).' },
  ],
  sections: [
    {
      title: 'Taking out a common factor',
      html: `<p>Find the HCF of all the terms, write it outside the bracket, then work out what goes inside by dividing each term by it.</p>
${W('Factorise 6x + 15.', ['The HCF of 6 and 15 is 3.', '6x ÷ 3 = 2x and 15 ÷ 3 = 5.', 'Check by expanding: 3(2x + 5) = 6x + 15 ✓'], '3(2x + 5)')}
${W('Fully factorise 8a<sup>2</sup> − 12ab.', ['Numbers: HCF of 8 and 12 is 4.', 'Letters: both terms contain a.', 'HCF is 4a. Then 8a<sup>2</sup> ÷ 4a = 2a and 12ab ÷ 4a = 3b.'], '4a(2a − 3b)')}
${note('"Fully" factorise means take out <b>everything</b> common: 2a(4a − 6b) is only partly factorised.')}`,
    },
    {
      title: 'Quadratics x² + bx + c',
      html: `${rule('To factorise x<sup>2</sup> + bx + c, find two numbers that <b>multiply</b> to c and <b>add</b> to b.')}
${W('Factorise x<sup>2</sup> + 7x + 12.', ['Pairs that multiply to 12: 1 and 12, 2 and 6, 3 and 4.', '3 + 4 = 7 ✓', 'Check: (x + 3)(x + 4) = x<sup>2</sup> + 4x + 3x + 12 ✓'], '(x + 3)(x + 4)')}
${W('Factorise x<sup>2</sup> − 2x − 15.', ['Multiply to −15, add to −2.', 'Try −5 and 3: −5 × 3 = −15 and −5 + 3 = −2 ✓'], '(x − 5)(x + 3)')}
${note('If c is negative, the two numbers have different signs. If c is positive, they have the same sign as b.')}`,
    },
    {
      title: 'Difference of two squares',
      html: `${rule('a<sup>2</sup> − b<sup>2</sup> = (a + b)(a − b)')}
${W('Factorise x<sup>2</sup> − 49.', ['x<sup>2</sup> is x squared and 49 is 7 squared.', 'Use the pattern with a = x and b = 7.'], '(x + 7)(x − 7)')}
${W('Factorise 4y<sup>2</sup> − 9.', ['4y<sup>2</sup> = (2y)<sup>2</sup> and 9 = 3<sup>2</sup>.'], '(2y + 3)(2y − 3)')}`,
    },
    {
      title: 'Quadratics ax² + bx + c (Higher)',
      html: `<p>Multiply a × c, find two numbers that multiply to that and add to b, then split the middle term and factorise in pairs.</p>
${W('Factorise 2x<sup>2</sup> + 7x + 3.', ['a × c = 2 × 3 = 6. Numbers that multiply to 6 and add to 7: 6 and 1.', 'Split the middle: 2x<sup>2</sup> + 6x + x + 3.', 'Factorise in pairs: 2x(x + 3) + 1(x + 3).', 'The common bracket is (x + 3).'], '(2x + 1)(x + 3)')}`,
    },
  ],
  mistakes: [
    'Not taking out the highest common factor, e.g. 2(4a<sup>2</sup> − 6ab).',
    'Choosing numbers that add to c and multiply to b — the wrong way round.',
    'Sign errors, e.g. x<sup>2</sup> − 2x − 15 = (x + 5)(x − 3).',
    'Trying to factorise x<sup>2</sup> + 49 as a difference of two squares (it is a sum, so it cannot).',
  ],
  examTips: [
    'Always expand your answer to check it — it takes ten seconds and catches sign errors.',
    'If you are asked to "solve" a quadratic, factorise first and then set each bracket equal to 0.',
    'Look for a common factor first, even in quadratics, e.g. 2x<sup>2</sup> + 14x + 24 = 2(x<sup>2</sup> + 7x + 12).',
  ],
  realLife: 'Factorising is used in physics and engineering to find when a projectile lands or when a profit formula breaks even.',
  specRef: 'Edexcel 1MA1 A4',
};

/* ------------------------------------------------------------------ */
C['y9-equations-both-sides'] = {
  overview: `<p>Some equations have the unknown on <b>both sides</b>, such as 5x + 3 = 2x + 18. The key move is to collect all the unknown terms on one side and all the numbers on the other. You will also solve equations with brackets and fractions, and form equations from problems where two quantities are equal.</p>`,
  objectives: [
    'I can solve equations with unknowns on both sides.',
    'I can solve equations with brackets on both sides.',
    'I can solve equations involving fractions by multiplying to clear the denominators.',
    'I can form and solve equations from contexts where two expressions are equal.',
  ],
  keyWords: [
    { term: 'Unknown', def: 'The letter whose value we are trying to find.' },
    { term: 'Balance', def: 'Keeping both sides equal by doing the same to each side.' },
    { term: 'Collect', def: 'Gather the letter terms on one side and the numbers on the other.' },
    { term: 'Denominator', def: 'The bottom of a fraction; multiply by it to clear the fraction.' },
  ],
  sections: [
    {
      title: 'Unknowns on both sides',
      html: `${rule('Remove the <b>smaller</b> letter term from both sides first — this keeps the letter term positive.')}
${W('Solve 5x + 3 = 2x + 18.', ['Subtract 2x from both sides: 3x + 3 = 18.', 'Subtract 3: 3x = 15.', 'Divide by 3: x = 5.', 'Check: 5 × 5 + 3 = 28 and 2 × 5 + 18 = 28 ✓'], 'x = 5')}
${W('Solve 7 − 2x = 3x − 8.', ['The smaller x term is −2x, so add 2x to both sides: 7 = 5x − 8.', 'Add 8: 15 = 5x.', 'Divide by 5: x = 3.'], 'x = 3')}`,
    },
    {
      title: 'Brackets on both sides',
      html: `<p>Expand all brackets first, then solve as before.</p>
${W('Solve 3(2x − 1) = 4(x + 2).', ['Expand: 6x − 3 = 4x + 8.', 'Subtract 4x: 2x − 3 = 8.', 'Add 3: 2x = 11.', 'Divide by 2: x = 5.5.'], 'x = 5.5')}`,
    },
    {
      title: 'Equations with fractions',
      html: `<p>Multiply both sides by the denominators to get rid of the fractions. With a fraction on each side, you can <b>cross-multiply</b>.</p>
${W('Solve ' + f('x + 4', 3) + ' = ' + f('x − 2', 2) + '.', ['Cross-multiply: 2(x + 4) = 3(x − 2).', 'Expand: 2x + 8 = 3x − 6.', 'Subtract 2x: 8 = x − 6.', 'Add 6: x = 14.', 'Check: (14 + 4) ÷ 3 = 6 and (14 − 2) ÷ 2 = 6 ✓'], 'x = 14')}`,
    },
    {
      title: 'Forming equations',
      html: `<p>When a problem says two amounts are <b>the same</b>, set their expressions equal to each other.</p>
${W('Ben has 3x + 5 stickers and Ana has 5x − 9 stickers. They have the same number. How many stickers does each have?', ['Form the equation: 3x + 5 = 5x − 9.', 'Subtract 3x: 5 = 2x − 9.', 'Add 9: 14 = 2x, so x = 7.', 'Ben: 3 × 7 + 5 = 26. Ana: 5 × 7 − 9 = 26 ✓'], '26 stickers each')}
${note('Finding x is not always the final answer — re-read the question to see what it actually asks for.')}`,
    },
  ],
  mistakes: [
    'Moving a term across the equals sign without changing the operation, e.g. 5x + 3 = 2x + 18 → 7x = 15.',
    'Only multiplying one term by the denominator when clearing fractions.',
    'Errors with negative x terms, e.g. 7 − 2x = 3x − 8 → x = 15.',
    'Stopping at x when the question asks for another quantity.',
  ],
  examTips: [
    'Write what you are doing to both sides (e.g. "−2x") at the side of each line.',
    'Substitute your answer into both sides — they must give the same value.',
    'If you get a fraction answer, leave it as an exact fraction unless asked to round.',
  ],
  realLife: 'Comparing two phone tariffs or gym memberships — "when do they cost the same?" — is solved with an equation with unknowns on both sides.',
  specRef: 'Edexcel 1MA1 A17',
};

/* ------------------------------------------------------------------ */
C['y9-pythagoras'] = {
  overview: `<p><b>Pythagoras’ theorem</b> connects the three sides of any right-angled triangle. If you know two sides you can always find the third. It is one of the most frequently tested topics at GCSE and is used to find lengths, distances between coordinates and to check whether a triangle has a right angle.</p>`,
  objectives: [
    'I can identify the hypotenuse of a right-angled triangle.',
    'I can use Pythagoras’ theorem to find the hypotenuse.',
    'I can use Pythagoras’ theorem to find a shorter side.',
    'I can decide whether a triangle is right-angled.',
    'I can apply Pythagoras’ theorem to problems, including coordinates and isosceles triangles.',
  ],
  keyWords: [
    { term: 'Hypotenuse', def: 'The longest side of a right-angled triangle, opposite the right angle.' },
    { term: 'Right angle', def: 'An angle of exactly 90°, marked with a small square.' },
    { term: 'Square root', def: 'The number that, multiplied by itself, gives the original number: ' + sq(100) + ' = 10.' },
    { term: 'Pythagorean triple', def: 'Three whole numbers that fit the theorem, e.g. 3, 4, 5 or 5, 12, 13.' },
  ],
  sections: [
    {
      title: 'The theorem',
      html: `<svg viewBox="0 0 240 150" width="100%" style="max-width:280px" role="img" aria-label="Right-angled triangle with sides a, b and hypotenuse c">
<polygon points="30,130 200,130 30,30" fill="none" stroke="currentColor" stroke-width="2"/>
<polyline points="30,116 44,116 44,130" fill="none" stroke="currentColor" stroke-width="1.5"/>
<g fill="currentColor" font-size="14" text-anchor="middle"><text x="16" y="84">a</text><text x="115" y="146">b</text><text x="128" y="72" fill="#3b6cf6">c</text></g>
</svg>
${rule('a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>, where c is the hypotenuse')}
<p>The hypotenuse is always opposite the right angle and is always the longest side.</p>`,
    },
    {
      title: 'Finding the hypotenuse',
      html: `<p>Square the two shorter sides, <b>add</b>, then square root.</p>
${W('A right-angled triangle has shorter sides 6 cm and 8 cm. Find the hypotenuse.', ['6<sup>2</sup> + 8<sup>2</sup> = 36 + 64 = 100.', sq(100) + ' = 10.'], '10 cm')}
${W('The shorter sides are 5 cm and 9 cm. Find the hypotenuse to 1 decimal place.', ['5<sup>2</sup> + 9<sup>2</sup> = 25 + 81 = 106.', sq(106) + ' = 10.295…'], '10.3 cm')}`,
    },
    {
      title: 'Finding a shorter side',
      html: `<p>Square the hypotenuse and the known side, <b>subtract</b>, then square root.</p>
${W('A right-angled triangle has hypotenuse 13 cm and one side 5 cm. Find the other side.', ['13<sup>2</sup> − 5<sup>2</sup> = 169 − 25 = 144.', sq(144) + ' = 12.'], '12 cm')}
${W('A 6 m ladder leans against a wall with its foot 1.5 m from the wall. How high up the wall does it reach? Give your answer to 2 decimal places.', ['The ladder is the hypotenuse (opposite the right angle between wall and ground).', '6<sup>2</sup> − 1.5<sup>2</sup> = 36 − 2.25 = 33.75.', sq('33.75') + ' = 5.809…'], '5.81 m')}
${note('Sense check: a shorter side must be less than the hypotenuse. If it is not, you added instead of subtracting.')}`,
    },
    {
      title: 'Is it right-angled?',
      html: `<p>Check whether the squares of the two shorter sides add up to the square of the longest side.</p>
${W('Is a triangle with sides 7 cm, 24 cm and 25 cm right-angled?', ['7<sup>2</sup> + 24<sup>2</sup> = 49 + 576 = 625.', '25<sup>2</sup> = 625.', 'They are equal, so Pythagoras’ theorem holds.'], 'Yes, it is right-angled')}`,
    },
    {
      title: 'Pythagoras in problems',
      html: `${W('Find the distance between the points (1, 2) and (7, 10).', ['Horizontal distance: 7 − 1 = 6. Vertical distance: 10 − 2 = 8.', 'These form the two shorter sides of a right-angled triangle.', 'Distance = ' + sq('6<sup>2</sup> + 8<sup>2</sup>') + ' = ' + sq(100) + ' = 10.'], '10 units')}
${W('An isosceles triangle has two sides of 10 cm and a base of 12 cm. Find its area.', ['The height splits the base in half, making two right-angled triangles with hypotenuse 10 and base 6.', 'Height = ' + sq('10<sup>2</sup> − 6<sup>2</sup>') + ' = ' + sq(64) + ' = 8 cm.', 'Area = ' + f(1, 2) + ' × 12 × 8 = 48.'], '48 cm<sup>2</sup>')}`,
    },
  ],
  mistakes: [
    'Adding the squares when finding a shorter side (you must subtract).',
    'Forgetting to square root at the end.',
    'Using Pythagoras on a triangle that is not right-angled.',
    'Doubling instead of squaring, e.g. writing 6<sup>2</sup> = 12.',
  ],
  examTips: [
    'Label the hypotenuse first — it is opposite the right angle.',
    'Write the full calculation (e.g. 13<sup>2</sup> − 5<sup>2</sup>) before the answer; it earns method marks.',
    'Round only at the very end, and to the accuracy the question asks for.',
  ],
  realLife: 'Builders use the 3-4-5 triangle to check corners are square, and phone maps use Pythagoras to work out straight-line distances.',
  specRef: 'Edexcel 1MA1 G20',
};

/* ------------------------------------------------------------------ */
C['y9-standard-form'] = {
  overview: `<p><b>Standard form</b> is a short way of writing very large or very small numbers using powers of 10. Scientists use it for the distance to stars and the size of atoms. You will convert numbers to and from standard form, order them, and calculate with them both with and without a calculator.</p>`,
  objectives: [
    'I can write large and small numbers in standard form.',
    'I can convert numbers from standard form to ordinary numbers.',
    'I can order numbers written in standard form.',
    'I can multiply and divide numbers in standard form using index laws.',
    'I can add and subtract numbers in standard form.',
  ],
  keyWords: [
    { term: 'Standard form', def: 'A number written as A × 10<sup>n</sup> where 1 ≤ A &lt; 10 and n is an integer.' },
    { term: 'Power of 10', def: '10 raised to a power, e.g. 10<sup>4</sup> = 10 000 and 10<sup>−3</sup> = 0.001.' },
    { term: 'Ordinary number', def: 'A number written out in full, e.g. 45 000.' },
    { term: 'Integer', def: 'A whole number, positive, negative or zero.' },
  ],
  sections: [
    {
      title: 'Writing numbers in standard form',
      html: `${rule('A × 10<sup>n</sup>, where 1 ≤ A &lt; 10<br>Big numbers → positive power. Small numbers (less than 1) → negative power.')}
${W('Write 45 000 in standard form.', ['A must be between 1 and 10, so A = 4.5.', 'From 4.5 to 45 000 the digits move 4 places, so multiply by 10<sup>4</sup>.'], '4.5 × 10<sup>4</sup>')}
${W('Write 0.00072 in standard form.', ['A = 7.2.', 'From 7.2 to 0.00072 the digits move 4 places to the right (dividing), so the power is −4.'], '7.2 × 10<sup>−4</sup>')}
${W('Write 3.1 × 10<sup>5</sup> as an ordinary number.', ['Multiply 3.1 by 10 five times: the digits move 5 places left.'], '310 000')}`,
    },
    {
      title: 'Ordering',
      html: `<p>Compare the powers first: a bigger power means a bigger number. If the powers are the same, compare the A values.</p>
${W('Order from smallest: 3.2 × 10<sup>5</sup>, 8.1 × 10<sup>4</sup>, 2.9 × 10<sup>5</sup>, 6 × 10<sup>−2</sup>.', ['Smallest power: 6 × 10<sup>−2</sup>, then 8.1 × 10<sup>4</sup>.', 'Two have power 5: compare 2.9 and 3.2.'], '6 × 10<sup>−2</sup>, 8.1 × 10<sup>4</sup>, 2.9 × 10<sup>5</sup>, 3.2 × 10<sup>5</sup>')}`,
    },
    {
      title: 'Multiplying and dividing',
      html: `<p>Multiply (or divide) the numbers, and use the index laws on the powers of 10. Then make sure the answer is still in standard form.</p>
${W('Work out (3 × 10<sup>4</sup>) × (4 × 10<sup>6</sup>). Give your answer in standard form.', ['Numbers: 3 × 4 = 12. Powers: 10<sup>4</sup> × 10<sup>6</sup> = 10<sup>10</sup>.', '12 × 10<sup>10</sup> is not standard form, as 12 is not less than 10.', '12 = 1.2 × 10<sup>1</sup>, so the answer is 1.2 × 10<sup>11</sup>.'], '1.2 × 10<sup>11</sup>')}
${W('Work out (6 × 10<sup>5</sup>) ÷ (1.5 × 10<sup>−2</sup>).', ['Numbers: 6 ÷ 1.5 = 4.', 'Powers: 10<sup>5</sup> ÷ 10<sup>−2</sup> = 10<sup>5 − (−2)</sup> = 10<sup>7</sup>.'], '4 × 10<sup>7</sup>')}`,
    },
    {
      title: 'Adding and subtracting',
      html: `<p>You cannot simply add the A values unless the powers match. The safest method is to convert to ordinary numbers, add, then convert back.</p>
${W('Work out 3.2 × 10<sup>4</sup> + 5 × 10<sup>3</sup>.', ['3.2 × 10<sup>4</sup> = 32 000 and 5 × 10<sup>3</sup> = 5000.', '32 000 + 5000 = 37 000.', 'Convert back: 3.7 × 10<sup>4</sup>.'], '3.7 × 10<sup>4</sup>')}
${W('Light travels at 3 × 10<sup>8</sup> m/s. How long does it take light to travel 1.5 × 10<sup>11</sup> m from the Sun to Earth?', ['Time = distance ÷ speed.', '1.5 ÷ 3 = 0.5 and 10<sup>11</sup> ÷ 10<sup>8</sup> = 10<sup>3</sup>.', '0.5 × 10<sup>3</sup> = 500.'], '500 seconds (about 8 minutes)')}`,
    },
  ],
  mistakes: [
    'Writing A outside the range, e.g. 45 × 10<sup>3</sup> or 0.45 × 10<sup>5</sup>.',
    'Using a positive power for a small number, e.g. 0.00072 = 7.2 × 10<sup>4</sup>.',
    'Adding the A values when the powers are different.',
    'Leaving answers like 12 × 10<sup>10</sup> without adjusting to standard form.',
  ],
  examTips: [
    'Check your A value is at least 1 and less than 10 every time.',
    'On a calculator, use the ×10<sup>x</sup> key and put brackets round each number.',
    'If a question says "give your answer in standard form", an ordinary number will lose the final mark.',
  ],
  realLife: 'Astronomers, biologists and computer scientists use standard form for things like the mass of the Earth (about 6 × 10<sup>24</sup> kg) and the width of a hair.',
  specRef: 'Edexcel 1MA1 N9',
};

/* ------------------------------------------------------------------ */
C['y9-percentage-change'] = {
  overview: `<p>Prices rise, savings grow and cars lose value — all by percentages. In this topic you use <b>multipliers</b> to increase and decrease amounts in one step, calculate a <b>percentage change</b>, work backwards to an original value with <b>reverse percentages</b>, and compare simple and compound interest.</p>`,
  objectives: [
    'I can find the multiplier for a percentage increase or decrease.',
    'I can increase or decrease an amount by a percentage using a multiplier.',
    'I can calculate a percentage change (profit, loss, increase or decrease).',
    'I can find an original amount using reverse percentages.',
    'I can calculate simple interest, compound interest and depreciation.',
  ],
  keyWords: [
    { term: 'Multiplier', def: 'The decimal you multiply by to apply a percentage change, e.g. 1.12 for a 12% increase.' },
    { term: 'Percentage change', def: 'The change as a percentage of the original amount.' },
    { term: 'Reverse percentage', def: 'Finding the original value before a percentage change was applied.' },
    { term: 'Simple interest', def: 'Interest paid only on the original amount, the same each year.' },
    { term: 'Compound interest', def: 'Interest paid on the original amount plus interest already earned.' },
    { term: 'Depreciation', def: 'A loss in value over time, usually a percentage each year.' },
  ],
  sections: [
    {
      title: 'Multipliers',
      html: `${rule('Increase by r%: multiplier = 1 + ' + f('r', 100) + ' &nbsp;&nbsp; Decrease by r%: multiplier = 1 − ' + f('r', 100))}
${table(['Change', 'Multiplier'], [['Increase 12%', '1.12'], ['Increase 5%', '1.05'], ['Decrease 15%', '0.85'], ['Decrease 3%', '0.97']])}
${W('A rent of £250 rises by 12%. Find the new rent.', ['Multiplier: 100% + 12% = 112% = 1.12.', '£250 × 1.12 = £280.'], '£280')}
${W('A 64 kg sack of grain loses 15% of its mass. Find the new mass.', ['Multiplier: 100% − 15% = 85% = 0.85.', '64 × 0.85 = 54.4.'], '54.4 kg')}`,
    },
    {
      title: 'Percentage change',
      html: `${rule('Percentage change = ' + f('change', 'original') + ' × 100')}
${W('A shop buys a lamp for £40 and sells it for £52. Find the percentage profit.', ['Change (profit): 52 − 40 = £12.', f(12, 40) + ' × 100 = 30.'], '30% profit')}
${W('A plant was 80 cm tall. After pruning it is 68 cm. Find the percentage decrease.', ['Change: 80 − 68 = 12 cm.', f(12, 80) + ' × 100 = 15.'], '15% decrease')}
${note('Always divide by the <b>original</b> value, not the new one.')}`,
    },
    {
      title: 'Reverse percentages',
      html: `<p>If you know the amount <b>after</b> a percentage change, divide by the multiplier to get back to the original.</p>
${W('In a sale with 20% off, a pair of trainers costs £36. What was the original price?', ['After 20% off, £36 is 80% of the original, so the multiplier is 0.8.', 'Original × 0.8 = 36, so original = 36 ÷ 0.8 = 45.', 'Check: 20% of £45 is £9, and £45 − £9 = £36 ✓'], '£45')}
${note('Do not just add 20% of £36 back on — that gives £43.20, which is wrong because the 20% was taken from the original price.')}`,
    },
    {
      title: 'Interest and depreciation',
      html: `<p><b>Simple interest</b> adds the same amount each year. <b>Compound interest</b> multiplies by the multiplier each year, so it grows faster.</p>
${rule('Compound: final amount = original × (multiplier)<sup>number of years</sup>')}
${W('£2000 is invested at 3% per year for 4 years. Find the total with (a) simple interest (b) compound interest.', ['(a) Interest per year: 3% of £2000 = £60. Over 4 years: £240. Total £2240.', '(b) 2000 × 1.03<sup>4</sup> = 2251.017… → £2251.02.'], '(a) £2240 (b) £2251.02')}
${W('A car worth £15 000 depreciates by 10% each year. Find its value after 3 years.', ['Multiplier: 0.9.', '15 000 × 0.9<sup>3</sup> = 15 000 × 0.729 = 10 935.'], '£10 935')}`,
    },
  ],
  mistakes: [
    'Using 0.15 instead of 0.85 for a 15% decrease (this finds the decrease, not the new amount).',
    'Dividing by the new value when finding percentage change.',
    'For reverse percentages, finding the percentage of the sale price and adding it on.',
    'Calculating compound interest as simple interest (adding the same amount each year).',
  ],
  examTips: [
    'Write the multiplier down first — it often earns a method mark on its own.',
    'Read carefully: "how much interest" is different from "how much in the account".',
    'Money answers should be rounded to the nearest penny (2 decimal places).',
  ],
  realLife: 'Banks, shops and car dealers use these calculations every day — from VAT and sale prices to savings accounts and how fast a new car loses value.',
  specRef: 'Edexcel 1MA1 R9, N12',
};

/* ------------------------------------------------------------------ */
C['y9-inequalities'] = {
  overview: `<p>An <b>inequality</b> shows that one value is bigger or smaller than another, rather than equal. Inequalities describe ranges of values, such as height limits on rides. You will use the inequality symbols, show inequalities on a number line, list integer solutions, and solve linear inequalities just like equations — with one important extra rule.</p>`,
  objectives: [
    'I can use the symbols &lt;, &gt;, ≤ and ≥ correctly.',
    'I can show an inequality on a number line and read one from a number line.',
    'I can list the integers that satisfy an inequality.',
    'I can solve linear inequalities, including double inequalities.',
    'I can reverse the inequality sign when multiplying or dividing by a negative number.',
  ],
  keyWords: [
    { term: 'Inequality', def: 'A statement comparing two values using &lt;, &gt;, ≤ or ≥.' },
    { term: '≤ and ≥', def: '"Less than or equal to" and "greater than or equal to" — the end value is included.' },
    { term: 'Integer', def: 'A whole number: … −2, −1, 0, 1, 2 …' },
    { term: 'Solution set', def: 'All the values that make an inequality true.' },
    { term: 'Double inequality', def: 'An inequality with two signs, such as −2 &lt; x ≤ 3.' },
  ],
  sections: [
    {
      title: 'Symbols and number lines',
      html: `${table(['Symbol', 'Meaning', 'Number line circle'], [['&lt;', 'less than', 'open (not included)'], ['&gt;', 'greater than', 'open (not included)'], ['≤', 'less than or equal to', 'filled (included)'], ['≥', 'greater than or equal to', 'filled (included)']])}
<svg viewBox="0 0 340 60" width="100%" style="max-width:340px" role="img" aria-label="Number line showing −2 &lt; x ≤ 3">
<line x1="15" y1="25" x2="325" y2="25" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2"><line x1="30" y1="19" x2="30" y2="31"/><line x1="65" y1="19" x2="65" y2="31"/><line x1="100" y1="19" x2="100" y2="31"/><line x1="135" y1="19" x2="135" y2="31"/><line x1="170" y1="19" x2="170" y2="31"/><line x1="205" y1="19" x2="205" y2="31"/><line x1="240" y1="19" x2="240" y2="31"/><line x1="275" y1="19" x2="275" y2="31"/><line x1="310" y1="19" x2="310" y2="31"/></g>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="30" y="50">−3</text><text x="65" y="50">−2</text><text x="100" y="50">−1</text><text x="135" y="50">0</text><text x="170" y="50">1</text><text x="205" y="50">2</text><text x="240" y="50">3</text><text x="275" y="50">4</text><text x="310" y="50">5</text></g>
<line x1="71" y1="25" x2="234" y2="25" stroke="#3b6cf6" stroke-width="5"/>
<circle cx="65" cy="25" r="6" fill="none" stroke="#3b6cf6" stroke-width="2"/><circle cx="240" cy="25" r="6" fill="#3b6cf6"/>
</svg>
${W('List the integers that satisfy −2 &lt; x ≤ 3.', ['−2 is not included (strictly greater than), so start at −1.', '3 is included (less than or equal to).'], '−1, 0, 1, 2, 3')}`,
    },
    {
      title: 'Solving linear inequalities',
      html: `<p>Solve an inequality exactly like an equation, keeping the inequality sign in place of the equals sign.</p>
${W('Solve 3x − 4 &lt; 11.', ['Add 4 to both sides: 3x &lt; 15.', 'Divide by 3: x &lt; 5.'], 'x &lt; 5')}
${W('Solve 2(x + 3) ≥ 14 and show the solution on a number line.', ['Expand: 2x + 6 ≥ 14.', 'Subtract 6: 2x ≥ 8.', 'Divide by 2: x ≥ 4.', 'Number line: filled circle at 4 with an arrow to the right.'], 'x ≥ 4')}`,
    },
    {
      title: 'Multiplying or dividing by a negative',
      html: `${rule('If you multiply or divide both sides by a negative number, <b>reverse</b> the inequality sign.')}
<p>Why? 2 &lt; 5 is true, but multiplying both by −1 gives −2 and −5, and −2 &gt; −5.</p>
${W('Solve −2x ≥ 6.', ['Divide both sides by −2 and reverse the sign.', 'x ≤ 6 ÷ (−2).'], 'x ≤ −3')}
${note('Alternative: keep the x term positive. Add 2x to both sides: 0 ≥ 6 + 2x. Subtract 6: −6 ≥ 2x. Divide by 2: −3 ≥ x, which means the same as x ≤ −3.')}`,
    },
    {
      title: 'Double inequalities',
      html: `<p>Do the same operation to <b>all three</b> parts.</p>
${W('Solve 5 ≤ 2x + 1 &lt; 13, and list the integer solutions.', ['Subtract 1 from all three parts: 4 ≤ 2x &lt; 12.', 'Divide all three parts by 2: 2 ≤ x &lt; 6.', 'Integers: 2 is included, 6 is not.'], '2 ≤ x &lt; 6; integers 2, 3, 4, 5')}`,
    },
  ],
  mistakes: [
    'Using a filled circle for &lt; or &gt;, or an open circle for ≤ or ≥.',
    'Forgetting to reverse the sign when dividing by a negative number.',
    'Including the end value in an integer list when it is not allowed (or missing it when it is).',
    'Writing the final answer as an equation, e.g. x = 5, instead of x &lt; 5.',
  ],
  examTips: [
    'Your final answer must contain an inequality sign — an answer of "5" scores less.',
    'When listing integers, check both ends separately: is each end included?',
    'Substitute a value from your solution into the original inequality to check it works.',
  ],
  realLife: 'Inequalities describe rules such as "you must be at least 1.2 m tall" or "the bag must weigh less than 23 kg".',
  specRef: 'Edexcel 1MA1 A22',
};

/* ------------------------------------------------------------------ */
C['y9-straight-line-graphs'] = {
  overview: `<p>Every straight-line graph can be written as <b>y = mx + c</b>, where m is the <b>gradient</b> (steepness) and c is the <b>y-intercept</b> (where it crosses the y-axis). You will plot straight lines from a table of values, find gradients, identify m and c from an equation, and find the equation of a line from its gradient and a point, or from two points.</p>`,
  objectives: [
    'I can plot a straight-line graph using a table of values.',
    'I can recognise and draw horizontal and vertical lines such as y = 3 and x = −2.',
    'I can find the gradient of a line from a graph or two points.',
    'I can identify the gradient and y-intercept from y = mx + c, rearranging if needed.',
    'I can find the equation of a line and identify parallel lines.',
  ],
  keyWords: [
    { term: 'Gradient', def: 'The steepness of a line: change in y ÷ change in x.' },
    { term: 'y-intercept', def: 'The point where a line crosses the y-axis (where x = 0).' },
    { term: 'Linear', def: 'Forming a straight line.' },
    { term: 'Parallel', def: 'Lines with the same gradient, which never meet.' },
    { term: 'Coordinate', def: 'A pair of values (x, y) giving a position on a grid.' },
  ],
  sections: [
    {
      title: 'Plotting from a table of values',
      html: `${W('Draw the graph of y = 2x − 1 for x from −1 to 3.', ['Substitute each x value: x = −1 gives y = 2(−1) − 1 = −3.', 'Continue to fill the table (below).', 'Plot the points and join them with a single ruled straight line.'], 'A straight line through (−1, −3) and (3, 5)')}
${table(['x', '−1', '0', '1', '2', '3'], [['y', '−3', '−1', '1', '3', '5']])}
<svg viewBox="0 0 220 280" width="100%" style="max-width:240px" role="img" aria-label="Graph of y = 2x − 1">
<g stroke="currentColor" stroke-width="1.5"><line x1="20" y1="170" x2="200" y2="170"/><line x1="70" y1="10" x2="70" y2="270"/></g>
<g stroke="currentColor" stroke-width="1"><line x1="40" y1="166" x2="40" y2="174"/><line x1="100" y1="166" x2="100" y2="174"/><line x1="130" y1="166" x2="130" y2="174"/><line x1="160" y1="166" x2="160" y2="174"/><line x1="66" y1="20" x2="74" y2="20"/><line x1="66" y1="80" x2="74" y2="80"/><line x1="66" y1="140" x2="74" y2="140"/><line x1="66" y1="200" x2="74" y2="200"/><line x1="66" y1="260" x2="74" y2="260"/></g>
<g fill="currentColor" font-size="11" text-anchor="middle"><text x="40" y="186">−1</text><text x="100" y="186">1</text><text x="130" y="186">2</text><text x="160" y="186">3</text><text x="58" y="24">5</text><text x="58" y="84">3</text><text x="58" y="144">1</text><text x="56" y="204">−1</text><text x="56" y="264">−3</text><text x="205" y="174">x</text><text x="70" y="8">y</text></g>
<line x1="40" y1="260" x2="160" y2="20" stroke="#3b6cf6" stroke-width="2.5"/>
<circle cx="70" cy="200" r="4" fill="#3b6cf6"/>
</svg>
${note('Lines of the form y = k are horizontal; lines of the form x = k are vertical.')}`,
    },
    {
      title: 'Gradient',
      html: `${rule('Gradient m = ' + f('change in y', 'change in x') + ' = ' + f('rise', 'run'))}
<p>A line going up from left to right has a positive gradient; going down, a negative gradient.</p>
${W('Find the gradient of the line through (1, 3) and (4, 12).', ['Change in y: 12 − 3 = 9.', 'Change in x: 4 − 1 = 3.', 'Gradient = 9 ÷ 3.'], '3')}`,
    },
    {
      title: 'y = mx + c',
      html: `<p>When the equation is in the form y = mx + c, read off m (the gradient) and c (the y-intercept). If it is not, rearrange it to make y the subject first.</p>
${W('Find the gradient and y-intercept of 2y + 4x = 10.', ['Subtract 4x: 2y = −4x + 10.', 'Divide by 2: y = −2x + 5.'], 'gradient −2, y-intercept (0, 5)')}
${note('Parallel lines have the same gradient: y = 3x + 1 and y = 3x − 7 are parallel.')}`,
    },
    {
      title: 'Finding the equation of a line',
      html: `${W('Find the equation of the line with gradient 3 that passes through (2, 7).', ['Start with y = 3x + c.', 'Substitute x = 2, y = 7: 7 = 3 × 2 + c, so 7 = 6 + c.', 'c = 1.'], 'y = 3x + 1')}
${W('Find the equation of the line through (1, 5) and (3, 11).', ['Gradient: (11 − 5) ÷ (3 − 1) = 6 ÷ 2 = 3.', 'y = 3x + c. Substitute (1, 5): 5 = 3 + c, so c = 2.', 'Check with (3, 11): 3 × 3 + 2 = 11 ✓'], 'y = 3x + 2')}`,
    },
  ],
  mistakes: [
    'Calculating the gradient as change in x ÷ change in y (upside down).',
    'Reading the gradient of 2y = 6x + 4 as 6 without dividing by 2 first.',
    'Joining plotted points with a wobbly or dot-to-dot line rather than one ruled line.',
    'Mixing up x = 3 (vertical) and y = 3 (horizontal).',
  ],
  examTips: [
    'If one plotted point is not in line with the others, recheck that table value.',
    'For gradient from a graph, draw a large right-angled triangle and read the lengths carefully, using the axis scales.',
    'Give equations in the form y = mx + c unless asked otherwise.',
  ],
  realLife: 'Straight-line graphs model taxi fares, phone bills and currency conversion — the gradient is the rate and the intercept is the fixed charge.',
  specRef: 'Edexcel 1MA1 A9, A10',
};

/* ------------------------------------------------------------------ */
C['y9-direct-proportion'] = {
  overview: `<p>Two quantities are in <b>direct proportion</b> when they increase at the same rate — double one and the other doubles too. This topic uses the <b>unitary method</b> to scale recipes and prices, compares products to find the <b>best value</b>, converts currencies and links direct proportion to the equation y = kx.</p>`,
  objectives: [
    'I can use the unitary method to solve direct proportion problems.',
    'I can scale recipes up and down.',
    'I can compare prices to decide which is the best value for money.',
    'I can convert between currencies using an exchange rate.',
    'I can recognise direct proportion from a graph or the equation y = kx.',
  ],
  keyWords: [
    { term: 'Direct proportion', def: 'Two quantities are in direct proportion if their ratio stays the same: when one is multiplied by a number, so is the other.' },
    { term: 'Unitary method', def: 'Find the value of one unit first, then multiply up.' },
    { term: 'Best value', def: 'The option that gives the most for your money (or costs least per unit).' },
    { term: 'Exchange rate', def: 'How much of one currency you get for one unit of another, e.g. £1 = €1.16.' },
    { term: 'Constant of proportionality', def: 'The number k in y = kx.' },
  ],
  sections: [
    {
      title: 'The unitary method',
      html: `${rule('Divide to find one → multiply to find how many you need')}
${W('6 pens cost £4.80. How much do 10 pens cost?', ['One pen: £4.80 ÷ 6 = £0.80.', 'Ten pens: £0.80 × 10 = £8.'], '£8.00')}
${W('A recipe for 4 people uses 300 g of flour. How much flour is needed for 10 people?', ['For 1 person: 300 ÷ 4 = 75 g.', 'For 10 people: 75 × 10 = 750 g.'], '750 g')}`,
    },
    {
      title: 'Best value',
      html: `<p>Find the cost of the <b>same amount</b> of each product (or how much you get per £1), then compare.</p>
${W('Which is better value: 500 g of cereal for £1.85 or 750 g for £2.70?', ['Find the cost per 100 g of each.', 'Small box: £1.85 ÷ 5 = £0.37 per 100 g.', 'Large box: £2.70 ÷ 7.5 = £0.36 per 100 g.', 'The large box is cheaper per 100 g.'], 'The 750 g box is better value')}
${note('Always finish with a clear statement saying which is better value, supported by your figures.')}`,
    },
    {
      title: 'Exchange rates',
      html: `<p>An exchange rate is a direct proportion. Multiply to go one way and divide to go back.</p>
${W('£1 = €1.16. (a) Change £250 into euros. (b) Change €87 into pounds.', ['(a) £ → €: multiply. 250 × 1.16 = 290.', '(b) € → £: divide. 87 ÷ 1.16 = 75.'], '(a) €290 (b) £75')}
${note('Sense check: £1 buys more than €1, so a euro amount should be bigger than the pound amount.')}`,
    },
    {
      title: 'Graphs and y = kx',
      html: `<p>If y is directly proportional to x, the graph is a <b>straight line through the origin</b>, and the equation is y = kx where k is a constant.</p>
${W('y is directly proportional to x. When x = 3, y = 21. Find y when x = 8.', ['y = kx, so 21 = k × 3 and k = 7.', 'The equation is y = 7x.', 'When x = 8, y = 7 × 8 = 56.'], 'y = 56')}`,
    },
  ],
  mistakes: [
    'Multiplying when you should divide (e.g. converting euros to pounds).',
    'Comparing best value using different amounts without finding a common unit.',
    'Saying a straight line that does not pass through the origin shows direct proportion.',
    'Rounding the unit cost too early, so two prices look the same.',
  ],
  examTips: [
    'Show the unit price for every option — the final answer alone will not get full marks.',
    'Keep units in your working (per 100 g, per item) so you do not mix them up.',
    'Do a sense check: more items should cost more.',
  ],
  realLife: 'Supermarket shelf labels show the price per 100 g or per litre so you can compare value, and travel money is worked out with exchange rates.',
  specRef: 'Edexcel 1MA1 R10, N13',
};

/* ------------------------------------------------------------------ */
C['y9-polygons'] = {
  overview: `<p>A <b>polygon</b> is a 2D shape with straight sides. Its angles follow simple rules: the <b>interior</b> angles add up to a total that depends on the number of sides, and the <b>exterior</b> angles of any polygon always add up to 360°. You will use these facts to find missing angles and the number of sides of regular polygons.</p>`,
  objectives: [
    'I can calculate the sum of the interior angles of any polygon.',
    'I can find the size of each interior and exterior angle of a regular polygon.',
    'I can use the fact that interior and exterior angles add to 180°.',
    'I can find the number of sides of a regular polygon from one of its angles.',
    'I can find missing angles in irregular polygons.',
  ],
  keyWords: [
    { term: 'Polygon', def: 'A closed 2D shape made from straight sides.' },
    { term: 'Regular polygon', def: 'A polygon with all sides equal and all angles equal.' },
    { term: 'Interior angle', def: 'An angle inside the polygon at a vertex.' },
    { term: 'Exterior angle', def: 'The angle between one side extended and the next side.' },
    { term: 'Vertex', def: 'A corner of a shape (plural: vertices).' },
  ],
  sections: [
    {
      title: 'Sum of interior angles',
      html: `<p>From one vertex you can split any polygon with n sides into (n − 2) triangles, and each triangle contains 180°.</p>
${rule('Sum of interior angles = (n − 2) × 180°')}
${table(['Polygon', 'Sides n', 'Triangles', 'Angle sum'], [['Triangle', '3', '1', '180°'], ['Quadrilateral', '4', '2', '360°'], ['Pentagon', '5', '3', '540°'], ['Hexagon', '6', '4', '720°'], ['Octagon', '8', '6', '1080°']])}
${W('Find the size of each interior angle of a regular hexagon.', ['Sum: (6 − 2) × 180 = 720°.', 'There are 6 equal angles: 720 ÷ 6 = 120.'], '120°')}`,
    },
    {
      title: 'Exterior angles',
      html: `${rule('Exterior angles of any polygon add up to 360°<br>Interior angle + exterior angle = 180° (they lie on a straight line)')}
${W('Find the exterior and interior angles of a regular decagon (10 sides).', ['Exterior angle: 360 ÷ 10 = 36°.', 'Interior angle: 180 − 36 = 144°.'], 'exterior 36°, interior 144°')}
${note('For regular polygons, finding the exterior angle first is usually quickest.')}`,
    },
    {
      title: 'Finding the number of sides',
      html: `${rule('Number of sides of a regular polygon = 360 ÷ exterior angle')}
${W('Each interior angle of a regular polygon is 156°. How many sides does it have?', ['Exterior angle: 180 − 156 = 24°.', 'Number of sides: 360 ÷ 24 = 15.'], '15 sides')}
${W('Could a regular polygon have interior angles of 130°?', ['Exterior angle: 180 − 130 = 50°.', '360 ÷ 50 = 7.2, which is not a whole number.'], 'No — the number of sides must be a whole number')}`,
    },
    {
      title: 'Irregular polygons',
      html: `${W('A pentagon has angles 100°, 110°, 95°, 120° and x. Find x.', ['Angle sum of a pentagon: (5 − 2) × 180 = 540°.', 'Known angles: 100 + 110 + 95 + 120 = 425°.', 'x = 540 − 425.'], 'x = 115°')}`,
    },
  ],
  mistakes: [
    'Using n × 180 instead of (n − 2) × 180 for the interior angle sum.',
    'Dividing 360 by the interior angle instead of the exterior angle to find the number of sides.',
    'Applying regular polygon rules to an irregular polygon.',
    'Thinking the exterior angles add to 180° or depend on the number of sides.',
  ],
  examTips: [
    'Learn the formula (n − 2) × 180 — it is not on the formula sheet.',
    'Give reasons such as "exterior angles of a polygon add up to 360°" when asked.',
    'Check: interior + exterior should always be exactly 180°.',
  ],
  realLife: 'Regular polygons appear in honeycombs, floor tiles and nuts and bolts — their angles decide which shapes can tile a floor without gaps.',
  specRef: 'Edexcel 1MA1 G3',
};

/* ------------------------------------------------------------------ */
C['y9-speed-distance-time'] = {
  overview: `<p><b>Speed</b> is a <b>compound measure</b>: it combines distance and time. Using one formula, rearranged three ways, you can find speed, distance or time. This topic also covers converting between hours and minutes, changing units of speed, and finding the average speed for a journey in several parts.</p>`,
  objectives: [
    'I can use the formula speed = distance ÷ time and its rearrangements.',
    'I can convert between minutes and decimal hours.',
    'I can convert between units of speed such as km/h and m/s.',
    'I can calculate average speed for a journey with more than one part.',
    'I can interpret the gradient of a distance–time graph as speed.',
  ],
  keyWords: [
    { term: 'Speed', def: 'How far something travels per unit of time.' },
    { term: 'Compound measure', def: 'A measure made from two other measures, such as speed (distance and time).' },
    { term: 'Average speed', def: 'Total distance ÷ total time for a whole journey.' },
    { term: 'km/h, mph, m/s', def: 'Units of speed: kilometres per hour, miles per hour, metres per second.' },
  ],
  sections: [
    {
      title: 'The formula triangle',
      html: `${rule('Speed = ' + f('Distance', 'Time') + ' &nbsp;&nbsp; Distance = Speed × Time &nbsp;&nbsp; Time = ' + f('Distance', 'Speed'))}
<svg viewBox="0 0 200 130" width="100%" style="max-width:220px" role="img" aria-label="Formula triangle with D on top and S and T below">
<polygon points="100,10 190,120 10,120" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="55" y1="65" x2="145" y2="65" stroke="currentColor" stroke-width="2"/><line x1="100" y1="65" x2="100" y2="120" stroke="currentColor" stroke-width="2"/>
<g font-size="20" text-anchor="middle"><text x="100" y="55" fill="#3b6cf6">D</text><text x="72" y="104" fill="currentColor">S</text><text x="128" y="104" fill="currentColor">T</text></g>
</svg>
${W('A car travels 150 miles in 2.5 hours. Find its average speed.', ['Speed = 150 ÷ 2.5.'], '60 mph')}`,
    },
    {
      title: 'Time in hours and minutes',
      html: `<p>Times must be in <b>decimal hours</b> when the speed is per hour. Divide minutes by 60.</p>
${table(['Minutes', 'Hours'], [['15', '0.25'], ['30', '0.5'], ['45', '0.75'], ['20', f(1, 3)], ['6', '0.1']])}
${W('A train travels at 70 km/h for 1 hour 45 minutes. How far does it go?', ['1 hour 45 minutes = 1.75 hours.', 'Distance = 70 × 1.75 = 122.5.'], '122.5 km')}
${W('A cyclist rides 45 km at 18 km/h. How long does it take?', ['Time = 45 ÷ 18 = 2.5 hours.', '0.5 hours = 30 minutes.'], '2 hours 30 minutes')}
${note('2.5 hours is <b>not</b> 2 hours 50 minutes. Multiply the decimal part by 60.')}`,
    },
    {
      title: 'Converting units of speed',
      html: `${W('Convert 72 km/h to m/s.', ['72 km = 72 000 m.', '1 hour = 60 × 60 = 3600 seconds.', '72 000 ÷ 3600 = 20.'], '20 m/s')}`,
    },
    {
      title: 'Average speed for a whole journey',
      html: `${rule('Average speed = ' + f('total distance', 'total time'))}
${W('Jo drives 30 km in 30 minutes, then 90 km in 2 hours. Find her average speed for the whole journey.', ['Total distance: 30 + 90 = 120 km.', 'Total time: 0.5 + 2 = 2.5 hours.', 'Average speed = 120 ÷ 2.5.'], '48 km/h')}
${note('Do not average the two speeds. The parts were 60 km/h and 45 km/h, and (60 + 45) ÷ 2 = 52.5 km/h is wrong because Jo spent longer at the slower speed.')}
<p>On a <b>distance–time graph</b>, the gradient of a line is the speed, and a horizontal line means the object is stationary.</p>`,
    },
  ],
  mistakes: [
    'Using minutes with a speed in km/h, e.g. 70 × 45 instead of 70 × 0.75.',
    'Converting 2.5 hours to 2 hours 50 minutes.',
    'Finding average speed by averaging the speeds instead of total distance ÷ total time.',
    'Rearranging the formula wrongly, e.g. time = speed ÷ distance.',
  ],
  examTips: [
    'Write the formula you are using before substituting.',
    'Check units carefully — the question may give metres and ask for km/h.',
    'Include units in your answer (mph, km/h or m/s).',
  ],
  realLife: 'Sat-navs estimate arrival times using distance ÷ speed, and athletes compare performances using average speed.',
  specRef: 'Edexcel 1MA1 R1, R11, N13',
};

/* ------------------------------------------------------------------ */
C['y9-density'] = {
  overview: `<p><b>Density</b> tells you how much mass is packed into each unit of volume — it is why a small gold bar is heavier than a large block of wood. Like speed, density is a <b>compound measure</b>. You will use the density formula to find density, mass or volume, handle units carefully, and meet another compound measure, <b>pressure</b>.</p>`,
  objectives: [
    'I can use density = mass ÷ volume and its rearrangements.',
    'I can find the volume of a cuboid and use it in a density problem.',
    'I can convert between units of density such as g/cm<sup>3</sup> and kg/m<sup>3</sup>.',
    'I can solve problems involving mixing two substances.',
    'I can use pressure = force ÷ area.',
  ],
  keyWords: [
    { term: 'Density', def: 'Mass per unit volume, e.g. grams per cubic centimetre (g/cm<sup>3</sup>).' },
    { term: 'Mass', def: 'The amount of matter in an object, measured in g or kg.' },
    { term: 'Volume', def: 'The amount of 3D space an object takes up, measured in cm<sup>3</sup> or m<sup>3</sup>.' },
    { term: 'Compound measure', def: 'A measure made by combining two others, e.g. density combines mass and volume.' },
    { term: 'Pressure', def: 'Force per unit area, measured in newtons per square metre (N/m<sup>2</sup>).' },
  ],
  sections: [
    {
      title: 'The density formula',
      html: `${rule('Density = ' + f('Mass', 'Volume') + ' &nbsp;&nbsp; Mass = Density × Volume &nbsp;&nbsp; Volume = ' + f('Mass', 'Density'))}
<svg viewBox="0 0 200 130" width="100%" style="max-width:220px" role="img" aria-label="Formula triangle with M on top and D and V below">
<polygon points="100,10 190,120 10,120" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="55" y1="65" x2="145" y2="65" stroke="currentColor" stroke-width="2"/><line x1="100" y1="65" x2="100" y2="120" stroke="currentColor" stroke-width="2"/>
<g font-size="20" text-anchor="middle"><text x="100" y="55" fill="#3b6cf6">M</text><text x="72" y="104" fill="currentColor">D</text><text x="128" y="104" fill="currentColor">V</text></g>
</svg>
${W('A gold bar has a mass of 386 g and a volume of 20 cm<sup>3</sup>. Find its density.', ['Density = 386 ÷ 20.'], '19.3 g/cm<sup>3</sup>')}
${W('Oak has a density of 0.75 g/cm<sup>3</sup>. Find the mass of 400 cm<sup>3</sup> of oak.', ['Mass = 0.75 × 400.'], '300 g')}
${W('Aluminium has a density of 2.7 g/cm<sup>3</sup>. What volume does 540 g of aluminium take up?', ['Volume = 540 ÷ 2.7.'], '200 cm<sup>3</sup>')}`,
    },
    {
      title: 'Density with volume of a cuboid',
      html: `${W('A metal block is a cuboid measuring 5 cm by 4 cm by 3 cm. Its mass is 480 g. Find its density.', ['Volume = 5 × 4 × 3 = 60 cm<sup>3</sup>.', 'Density = 480 ÷ 60 = 8.'], '8 g/cm<sup>3</sup>')}
${note('The units of density come from the units of mass and volume: grams and cm<sup>3</sup> give g/cm<sup>3</sup>.')}`,
    },
    {
      title: 'Units and mixtures',
      html: `${rule('1 g/cm<sup>3</sup> = 1000 kg/m<sup>3</sup>')}
<p>So the block above has density 8 g/cm<sup>3</sup> = 8000 kg/m<sup>3</sup>.</p>
<p>When two substances are mixed, find the <b>total mass</b> and the <b>total volume</b> — never just average the densities.</p>
${W('200 cm<sup>3</sup> of liquid A (density 1.2 g/cm<sup>3</sup>) is mixed with 300 cm<sup>3</sup> of liquid B (density 0.9 g/cm<sup>3</sup>). Find the density of the mixture.', ['Mass of A: 1.2 × 200 = 240 g. Mass of B: 0.9 × 300 = 270 g.', 'Total mass: 510 g. Total volume: 500 cm<sup>3</sup>.', 'Density = 510 ÷ 500 = 1.02.'], '1.02 g/cm<sup>3</sup>')}`,
    },
    {
      title: 'Pressure',
      html: `${rule('Pressure = ' + f('Force', 'Area') + ' (N/m<sup>2</sup>)')}
${W('A box exerts a force of 600 N on an area of 2 m<sup>2</sup>. Find the pressure.', ['Pressure = 600 ÷ 2.'], '300 N/m<sup>2</sup>')}
${note('The same force on a smaller area gives a bigger pressure — which is why stiletto heels can dent floors.')}`,
    },
  ],
  mistakes: [
    'Rearranging wrongly, e.g. volume = density ÷ mass.',
    'Mixing units, e.g. a mass in kg with a volume in cm<sup>3</sup>.',
    'Averaging two densities instead of using total mass and total volume.',
    'Leaving out or getting the units of density wrong.',
  ],
  examTips: [
    'Write the formula first — density, speed and pressure formulae are often worth a mark on their own.',
    'Check the units given and the units asked for before you calculate.',
    'A dense material (like metal) should have a larger density than a light one (like wood) — sense-check your answer.',
  ],
  realLife: 'Density explains why ships float and why oil sits on water, and engineers use it to choose light but strong materials for aircraft.',
  specRef: 'Edexcel 1MA1 R1, R11',
};

/* ------------------------------------------------------------------ */
C['y9-volume-surface-area'] = {
  overview: `<p><b>Volume</b> measures the space inside a 3D shape, and <b>surface area</b> is the total area of all its faces. In this topic you find the volume and surface area of cuboids, prisms and cylinders, using the idea that a prism’s volume is its <b>cross-section</b> multiplied by its length, and convert between units of volume and capacity.</p>`,
  objectives: [
    'I can find the volume and surface area of a cuboid.',
    'I can find the volume of any prism using area of cross-section × length.',
    'I can find the surface area of a triangular prism using its net.',
    'I can find the volume and surface area of a cylinder.',
    'I can convert between cm<sup>3</sup>, m<sup>3</sup> and litres.',
  ],
  keyWords: [
    { term: 'Volume', def: 'The space inside a 3D shape, in cubic units such as cm<sup>3</sup>.' },
    { term: 'Surface area', def: 'The total area of all the faces of a 3D shape, in square units.' },
    { term: 'Prism', def: 'A 3D shape with the same cross-section all the way through.' },
    { term: 'Cross-section', def: 'The 2D shape you see when you slice through a prism parallel to its end.' },
    { term: 'Net', def: 'A 2D pattern that folds up to make a 3D shape.' },
    { term: 'Capacity', def: 'How much a container holds, often in litres; 1 litre = 1000 cm<sup>3</sup>.' },
  ],
  sections: [
    {
      title: 'Cuboids',
      html: `${rule('Volume = length × width × height &nbsp;&nbsp; Surface area = 2(lw + lh + wh)')}
${W('A cuboid measures 6 cm by 4 cm by 3 cm. Find its volume and surface area.', ['Volume = 6 × 4 × 3 = 72 cm<sup>3</sup>.', 'Faces come in pairs: 6 × 4 = 24, 6 × 3 = 18, 4 × 3 = 12.', 'Surface area = 2 × (24 + 18 + 12) = 2 × 54 = 108 cm<sup>2</sup>.'], 'V = 72 cm<sup>3</sup>, SA = 108 cm<sup>2</sup>')}`,
    },
    {
      title: 'Prisms',
      html: `${rule('Volume of a prism = area of cross-section × length')}
<svg viewBox="0 0 240 140" width="100%" style="max-width:280px" role="img" aria-label="Triangular prism">
<polygon points="20,120 80,120 20,60" fill="none" stroke="#3b6cf6" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2" fill="none"><line x1="20" y1="60" x2="160" y2="20"/><line x1="80" y1="120" x2="220" y2="80"/><line x1="20" y1="120" x2="160" y2="80"/><polygon points="160,80 220,80 160,20"/></g>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="50" y="135">6 cm</text><text x="8" y="94">4</text><text x="200" y="110">10 cm</text></g>
</svg>
${W('A triangular prism has a right-angled triangle cross-section with base 6 cm and height 4 cm. The prism is 10 cm long. Find its volume.', ['Area of the triangle: ' + f(1, 2) + ' × 6 × 4 = 12 cm<sup>2</sup>.', 'Volume = 12 × 10.'], '120 cm<sup>3</sup>')}`,
    },
    {
      title: 'Surface area of a triangular prism',
      html: `<p>Sketch the net: two triangles and three rectangles. Find each area and add them all.</p>
${W('A prism has a right-angled triangle cross-section with sides 3 cm, 4 cm and 5 cm, and length 10 cm. Find its surface area.', ['Two triangles: 2 × (' + f(1, 2) + ' × 3 × 4) = 2 × 6 = 12 cm<sup>2</sup>.', 'Three rectangles: 3 × 10 + 4 × 10 + 5 × 10 = 120 cm<sup>2</sup>.', 'Total: 12 + 120 = 132 cm<sup>2</sup>.'], '132 cm<sup>2</sup>')}`,
    },
    {
      title: 'Cylinders',
      html: `<p>A cylinder is a prism with a circular cross-section. Its curved surface unrolls into a rectangle whose width is the circumference.</p>
${rule('Volume = πr<sup>2</sup>h &nbsp;&nbsp; Curved surface area = 2πrh &nbsp;&nbsp; Total SA = 2πrh + 2πr<sup>2</sup>')}
${W('A cylinder has radius 3 cm and height 10 cm. Find (a) its volume (b) its total surface area, to 1 decimal place.', ['(a) V = π × 3<sup>2</sup> × 10 = 90π = 282.74…', '(b) Curved surface: 2 × π × 3 × 10 = 60π. Two circles: 2 × π × 3<sup>2</sup> = 18π.', 'Total: 78π = 245.04…'], '(a) 282.7 cm<sup>3</sup> (b) 245.0 cm<sup>2</sup>')}`,
    },
    {
      title: 'Units of volume and capacity',
      html: `${rule('1 cm<sup>3</sup> = 1 ml &nbsp;&nbsp; 1 litre = 1000 cm<sup>3</sup> &nbsp;&nbsp; 1 m<sup>3</sup> = 1 000 000 cm<sup>3</sup>')}
${W('A fish tank is 50 cm long, 40 cm wide and 30 cm high. How many litres of water does it hold when full?', ['Volume = 50 × 40 × 30 = 60 000 cm<sup>3</sup>.', 'Litres: 60 000 ÷ 1000 = 60.'], '60 litres')}`,
    },
  ],
  mistakes: [
    'Using the slant side instead of the perpendicular height for a triangular cross-section.',
    'Giving volume in cm<sup>2</sup> or surface area in cm<sup>3</sup>.',
    'Forgetting the two circular ends when finding a cylinder’s total surface area.',
    'Using the diameter instead of the radius in πr<sup>2</sup>h.',
  ],
  examTips: [
    'For surface area, list every face so you do not miss one (a cuboid has 6, a triangular prism has 5).',
    'The volume of a prism formula is not always given — learn "cross-section × length".',
    'If asked to give an answer in terms of π, do not multiply π out.',
  ],
  realLife: 'Volume tells you how much a swimming pool or drinks can holds, and surface area tells a manufacturer how much material is needed to make packaging.',
  specRef: 'Edexcel 1MA1 G16, G17',
};

/* ------------------------------------------------------------------ */
C['y9-relative-frequency'] = {
  overview: `<p>Some probabilities cannot be worked out from equally likely outcomes — for example, the chance that a drawing pin lands point up. Instead, you <b>experiment</b> and use <b>relative frequency</b> as an estimate. In this topic you calculate relative frequencies, use them to judge whether something is fair, and predict <b>expected outcomes</b>.</p>`,
  objectives: [
    'I can calculate relative frequency from experimental results.',
    'I can use relative frequency as an estimate of probability.',
    'I can explain why more trials give a more reliable estimate.',
    'I can decide whether a dice, coin or spinner is likely to be biased.',
    'I can calculate expected outcomes from theoretical or experimental probabilities.',
  ],
  keyWords: [
    { term: 'Trial', def: 'One go of an experiment, e.g. one spin of a spinner.' },
    { term: 'Relative frequency', def: 'Number of times an outcome happened ÷ total number of trials.' },
    { term: 'Theoretical probability', def: 'A probability worked out from equally likely outcomes, without experimenting.' },
    { term: 'Fair / biased', def: 'Fair means every outcome is equally likely; biased means some are more likely than others.' },
    { term: 'Expected outcome', def: 'Probability × number of trials — the number of times you predict an outcome will happen.' },
  ],
  sections: [
    {
      title: 'Relative frequency',
      html: `${rule('Relative frequency = ' + f('frequency of outcome', 'total number of trials'))}
${W('A dice is rolled 200 times and lands on 6 a total of 48 times. Find the relative frequency of rolling a 6.', [f(48, 200) + ' = 0.24.'], '0.24')}
${W('A spinner is spun 100 times: red 23, blue 41, green 36. Estimate the probability of blue.', ['Relative frequency of blue = ' + f(41, 100) + '.'], '0.41')}`,
    },
    {
      title: 'Fair or biased?',
      html: `<p>Compare the relative frequency with the theoretical probability. A small difference is normal random variation; a big difference over a <b>large number of trials</b> suggests bias.</p>
${W('Is the dice in the first example likely to be fair?', ['For a fair dice, P(6) = ' + f(1, 6) + ' ≈ 0.17, so in 200 rolls you would expect about 200 ÷ 6 ≈ 33 sixes.', 'It actually rolled 48 sixes, a relative frequency of 0.24 — much higher.', '200 is a large number of trials, so this is fairly strong evidence.'], 'It is probably biased towards 6')}
${note('The more trials you do, the closer the relative frequency tends to get to the true probability. Ten rolls tell you very little; a thousand tell you a lot.')}`,
    },
    {
      title: 'Expected outcomes',
      html: `${rule('Expected number of outcomes = probability × number of trials')}
${W('The probability of winning a fairground game is 0.15. Kai plays 80 times. How many times should he expect to win?', ['0.15 × 80 = 12.'], '12 times')}
${W('Using the spinner results above, how many times would you expect blue in 500 spins?', ['Estimated P(blue) = 0.41.', '0.41 × 500 = 205.'], '205 times')}`,
    },
    {
      title: 'Designing an experiment',
      html: `<p>A good probability experiment needs:</p>
<ul><li>a clear record of results, usually a tally or frequency table;</li><li>a <b>large</b> number of trials;</li><li>each trial carried out in the same way, so the results are fair to compare.</li></ul>
${table(['Number of spins', '10', '50', '100', '500'], [['Times landed on red', '4', '12', '23', '118'], ['Relative frequency', '0.4', '0.24', '0.23', '0.236']])}
<p>Notice how the relative frequency settles down as the number of trials grows. The best estimate uses the <b>most</b> trials: 0.236.</p>`,
    },
  ],
  mistakes: [
    'Using only the first few trials to make an estimate instead of all of them.',
    'Saying a dice is biased after very few rolls.',
    'Thinking an expected outcome is guaranteed to happen exactly.',
    'Giving relative frequency as a count instead of a fraction or decimal.',
  ],
  examTips: [
    'When asked for the "best estimate", use the result with the most trials and say why.',
    'For "is it fair?" questions, compare with the theoretical probability and mention the number of trials.',
    'Expected outcomes do not need to be whole numbers in working, but round sensibly in context if asked.',
  ],
  realLife: 'Insurers use past claims to estimate risk, and quality-control teams test samples from a factory to estimate how many products are faulty.',
  specRef: 'Edexcel 1MA1 P1, P2, P3',
};

/* ------------------------------------------------------------------ */
C['y9-listing-outcomes'] = {
  overview: `<p>Before you can find a probability you often need to know <b>all</b> the possible outcomes. This topic shows you how to list outcomes <b>systematically</b>, use <b>sample space diagrams</b> for two events, count large numbers of combinations with the <b>product rule</b>, and use <b>Venn diagrams</b> to organise information and find probabilities.</p>`,
  objectives: [
    'I can list all the outcomes of one or two events systematically.',
    'I can use a sample space diagram to find probabilities.',
    'I can use the product rule to count the number of possible combinations.',
    'I can complete and interpret a Venn diagram, including finding probabilities.',
  ],
  keyWords: [
    { term: 'Systematic', def: 'Following a clear order so that nothing is missed or repeated.' },
    { term: 'Sample space', def: 'The set of all possible outcomes, often shown in a grid.' },
    { term: 'Product rule', def: 'If there are m ways to do one thing and n ways to do another, there are m × n ways to do both.' },
    { term: 'Venn diagram', def: 'A diagram of overlapping circles showing how sets of things are related.' },
    { term: 'Intersection', def: 'The overlap of two sets — items in both.' },
  ],
  sections: [
    {
      title: 'Systematic listing',
      html: `<p>Fix one choice and run through every option for the other, then move on. This avoids missing or repeating outcomes.</p>
${W('List all the possible outcomes when a coin is flipped and a dice is rolled.', ['Fix heads: H1, H2, H3, H4, H5, H6.', 'Fix tails: T1, T2, T3, T4, T5, T6.'], '12 outcomes')}
${W('List all the ways to arrange the letters A, B and C.', ['Start with A: ABC, ACB.', 'Start with B: BAC, BCA.', 'Start with C: CAB, CBA.'], '6 arrangements')}`,
    },
    {
      title: 'Sample space diagrams',
      html: `<p>For two dice there are 6 × 6 = 36 equally likely outcomes. A grid shows them all.</p>
${table(['+', '1', '2', '3', '4', '5', '6'], [['<b>1</b>', '2', '3', '4', '5', '6', '7'], ['<b>2</b>', '3', '4', '5', '6', '7', '8'], ['<b>3</b>', '4', '5', '6', '7', '8', '9'], ['<b>4</b>', '5', '6', '7', '8', '9', '10'], ['<b>5</b>', '6', '7', '8', '9', '10', '11'], ['<b>6</b>', '7', '8', '9', '10', '11', '12']])}
${W('Two fair dice are rolled and their scores added. Find P(total of 7).', ['Count the 7s in the grid: there are 6 (one in each row).', 'There are 36 outcomes altogether.', f(6, 36) + ' simplifies to ' + f(1, 6) + '.'], f(1, 6))}`,
    },
    {
      title: 'The product rule',
      html: `${rule('Number of combinations = (choices for 1st) × (choices for 2nd) × (choices for 3rd) × …')}
${W('A café offers 3 starters, 5 mains and 4 desserts. How many different three-course meals are possible?', ['3 × 5 × 4 = 60.'], '60 meals')}
${W('How many 4-digit PINs can be made from the digits 0–9 (a) if digits can repeat (b) if no digit can be repeated?', ['(a) 10 choices for each digit: 10 × 10 × 10 × 10 = 10 000.', '(b) The choices go down by one each time: 10 × 9 × 8 × 7 = 5040.'], '(a) 10 000 (b) 5040')}`,
    },
    {
      title: 'Venn diagrams',
      html: `<p>Fill in a Venn diagram from the <b>overlap outwards</b>: put the "both" number in first, then subtract it to find the "only" regions.</p>
${W('In a class of 30 pupils, 18 play football, 12 play tennis and 5 play both. A pupil is picked at random. Find P(plays tennis only).', ['Both: 5 (goes in the overlap).', 'Football only: 18 − 5 = 13. Tennis only: 12 − 5 = 7.', 'Neither: 30 − (13 + 5 + 7) = 5.', 'Tennis only: 7 out of 30.'], f(7, 30))}
<svg viewBox="0 0 280 150" width="100%" style="max-width:320px" role="img" aria-label="Venn diagram: football only 13, both 5, tennis only 7, neither 5">
<rect x="5" y="5" width="270" height="140" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="110" cy="78" r="55" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="170" cy="78" r="55" fill="none" stroke="#3b6cf6" stroke-width="1.5"/>
<g fill="currentColor" font-size="14" text-anchor="middle"><text x="85" y="83">13</text><text x="140" y="83">5</text><text x="195" y="83">7</text><text x="255" y="135">5</text><text x="80" y="20" font-size="12">Football</text><text x="200" y="20" font-size="12" fill="#3b6cf6">Tennis</text></g>
</svg>`,
    },
  ],
  mistakes: [
    'Listing outcomes randomly and missing some (or counting some twice).',
    'Adding instead of multiplying when using the product rule (3 + 5 + 4 instead of 3 × 5 × 4).',
    'Putting the full totals (18 and 12) in the circles without subtracting the overlap.',
    'Forgetting the "neither" region outside the circles of a Venn diagram.',
  ],
  examTips: [
    'Show your list in an organised way so the examiner can see it is complete.',
    'For the product rule, write the multiplication down, not just the answer.',
    'Check that all the numbers in a Venn diagram add up to the total.',
  ],
  realLife: 'The product rule explains why longer passwords are much safer, and Venn diagrams are used to sort survey data and search results.',
  specRef: 'Edexcel 1MA1 N5, P6',
};

/* ------------------------------------------------------------------ */
C['y9-frequency-tables'] = {
  overview: `<p>When there is a lot of data, it is organised in a <b>frequency table</b>. You still need to find averages and spread, but you have to read the table correctly. In this topic you find the mean, median, mode and range from a frequency table, and <b>estimate</b> the mean from grouped data using midpoints.</p>`,
  objectives: [
    'I can read and construct frequency tables, including grouped tables.',
    'I can find the mean from a frequency table using an fx column.',
    'I can find the mode, median and range from a frequency table.',
    'I can estimate the mean from grouped data using midpoints.',
    'I can identify the modal class and the class containing the median.',
  ],
  keyWords: [
    { term: 'Frequency', def: 'How many times a value occurs.' },
    { term: 'fx', def: 'Frequency × value — the total for that row of the table.' },
    { term: 'Grouped data', def: 'Data sorted into class intervals such as 10 &lt; t ≤ 20.' },
    { term: 'Midpoint', def: 'The value halfway through a class interval, used to estimate the mean.' },
    { term: 'Modal class', def: 'The class interval with the highest frequency.' },
  ],
  sections: [
    {
      title: 'Mean from a frequency table',
      html: `${rule('Mean = ' + f('total of fx', 'total frequency') + ' = ' + f('Σfx', 'Σf'))}
${table(['Goals x', 'Frequency f', 'fx'], [['0', '5', '0'], ['1', '8', '8'], ['2', '6', '12'], ['3', '3', '9'], ['4', '2', '8'], ['<b>Total</b>', '<b>24</b>', '<b>37</b>']])}
${W('The table shows the goals scored by a team in 24 matches. Find the mean number of goals.', ['Add an fx column: multiply each number of goals by its frequency.', 'Total of fx = 37 goals. Total frequency = 24 matches.', 'Mean = 37 ÷ 24 = 1.541…'], '1.54 goals (to 2 dp)')}
${note('Divide by the total <b>frequency</b> (24), not by the number of rows (5).')}`,
    },
    {
      title: 'Mode, median and range',
      html: `${W('Using the goals table, find the mode, median and range.', ['Mode: the value with the highest frequency is 1 goal (frequency 8).', 'Median: position (24 + 1) ÷ 2 = 12.5th value. Running totals: 5 (0 goals), 13 (1 goal). The 12th and 13th values are both 1.', 'Range: largest − smallest value = 4 − 0 = 4.'], 'mode 1, median 1, range 4')}
${note('The mode is the <b>value</b> (1 goal), not its frequency (8).')}`,
    },
    {
      title: 'Estimating the mean from grouped data',
      html: `<p>With grouped data you do not know the exact values, so use the <b>midpoint</b> of each class as a representative value. The answer is only an <b>estimate</b>.</p>
${table(['Time t (minutes)', 'Frequency f', 'Midpoint x', 'fx'], [['0 &lt; t ≤ 10', '4', '5', '20'], ['10 &lt; t ≤ 20', '9', '15', '135'], ['20 &lt; t ≤ 30', '12', '25', '300'], ['30 &lt; t ≤ 40', '5', '35', '175'], ['<b>Total</b>', '<b>30</b>', '', '<b>630</b>']])}
${W('The table shows the time 30 pupils spent on homework. Estimate the mean time.', ['Midpoints: 5, 15, 25, 35.', 'fx column: 20, 135, 300, 175. Total = 630.', 'Estimated mean = 630 ÷ 30 = 21.'], '21 minutes')}`,
    },
    {
      title: 'Modal class and median class',
      html: `${W('Using the homework table, find the modal class and the class containing the median.', ['Modal class: highest frequency is 12, so 20 &lt; t ≤ 30.', 'Median position: (30 + 1) ÷ 2 = 15.5th value.', 'Running totals: 4, 13, 25. The 15th and 16th values lie in the third class.'], 'modal class 20 &lt; t ≤ 30; median class 20 &lt; t ≤ 30')}
${note('You cannot find the exact range from grouped data because the actual smallest and largest values are unknown.')}`,
    },
  ],
  mistakes: [
    'Dividing Σfx by the number of rows instead of the total frequency.',
    'Adding up the values column and dividing, ignoring the frequencies.',
    'Giving the frequency instead of the value as the mode.',
    'Using the class width or upper bound instead of the midpoint for grouped data.',
  ],
  examTips: [
    'Add extra columns (midpoint, fx) directly onto the exam table — this is your method.',
    'Check your mean lies inside the range of the data, e.g. between 0 and 40 minutes.',
    'Use the word "estimate" for grouped data and explain it is because the exact values are unknown.',
  ],
  realLife: 'Survey results, census data and sports statistics are usually published as frequency tables, and analysts estimate averages straight from them.',
  specRef: 'Edexcel 1MA1 S2, S4',
};
module.exports = C;
