'use strict';
// Year 7 (KS3) teaching content for the learn pages.
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
C['y7-place-value'] = {
  overview: `<p>Our number system uses just ten digits, and the <b>place</b> of a digit tells you how much it is worth. Understanding place value lets you read, compare and order any number — including decimals and negative numbers — and it is the foundation for almost every calculation you will do.</p>`,
  objectives: [
    'I can state the value of any digit in a whole number or decimal.',
    'I can multiply and divide by 10, 100 and 1000.',
    'I can order decimals, including ones with different numbers of decimal places.',
    'I can order negative numbers using a number line.',
    'I can add and subtract with negative numbers.',
  ],
  keyWords: [
    { term: 'Digit', def: 'One of the symbols 0, 1, 2, 3, 4, 5, 6, 7, 8 or 9 used to write numbers.' },
    { term: 'Place value', def: 'The value a digit has because of the column it sits in.' },
    { term: 'Decimal point', def: 'The dot that separates whole numbers from parts of a whole.' },
    { term: 'Tenth / hundredth', def: 'One part out of 10 equal parts, and one part out of 100 equal parts.' },
    { term: 'Negative number', def: 'A number less than zero, written with a minus sign, such as −4.' },
    { term: 'Ascending / descending', def: 'Ascending means smallest to largest; descending means largest to smallest.' },
  ],
  sections: [
    {
      title: 'Place value columns',
      html: `<p>Each column is worth <b>ten times</b> the column to its right. To the right of the decimal point the columns keep shrinking: tenths, hundredths, thousandths.</p>
${table(['Th', 'H', 'T', 'O', '.', 't', 'h', 'th'], [['4', '3', '7', '2', '.', '5', '8', '1']])}
<p>In 4372.581 the 7 is in the tens column, so it is worth 70. The 8 is in the hundredths column, so it is worth 0.08.</p>
${W('What is the value of the digit 4 in 52.746?', ['Write the number in place value columns: 5 tens, 2 ones, 7 tenths, 4 hundredths, 6 thousandths.', 'The 4 is in the hundredths column.', 'Four hundredths is written as 0.04 (or ' + f(4, 100) + ').'], '0.04 (four hundredths)')}
${note('A zero is a place holder. In 3075 the 0 shows there are no hundreds — without it the number would be 375!')}`,
    },
    {
      title: 'Multiplying and dividing by 10, 100 and 1000',
      html: `<p>When you multiply by 10, every digit moves <b>one place to the left</b> (it becomes ten times bigger). Dividing by 10 moves every digit one place to the right. The decimal point stays still — the digits do the moving.</p>
${rule('× 10 → 1 place left &nbsp;|&nbsp; × 100 → 2 places left &nbsp;|&nbsp; × 1000 → 3 places left<br>÷ 10 → 1 place right &nbsp;|&nbsp; ÷ 100 → 2 places right &nbsp;|&nbsp; ÷ 1000 → 3 places right')}
${W('Work out 3.47 × 100.', ['Multiplying by 100 moves each digit two places to the left.', 'The 3 moves from the ones column to the hundreds column, the 4 to the tens, the 7 to the ones.', 'There is nothing left after the decimal point.'], '347')}
${W('Work out 52 ÷ 1000.', ['Dividing by 1000 moves each digit three places to the right.', 'The 5 moves from tens to hundredths, the 2 from ones to thousandths.', 'Fill the empty ones and tenths columns with zeros.'], '0.052')}`,
    },
    {
      title: 'Ordering decimals',
      html: `<p>To compare decimals, line up the decimal points and compare digits column by column, starting from the left. It helps to add zeros on the end so every number has the same number of decimal places — this does not change their value.</p>
${W('Write 0.5, 0.45, 0.405 and 0.54 in ascending order.', ['Give them all three decimal places: 0.500, 0.450, 0.405, 0.540.', 'All have 0 ones. Compare tenths: 5, 4, 4, 5.', 'The two with 4 tenths: 0.450 and 0.405 — compare hundredths: 5 beats 0, so 0.405 is smaller.', 'The two with 5 tenths: 0.500 and 0.540 — 0.500 is smaller.'], '0.405, 0.45, 0.5, 0.54')}
${note('A longer decimal is not automatically bigger: 0.405 has more digits than 0.5 but is smaller.')}`,
    },
    {
      title: 'Negative numbers on a number line',
      html: `<p>Numbers below zero are <b>negative</b>. On a number line, numbers get bigger as you move right and smaller as you move left. So −2 is bigger than −7, even though 7 is bigger than 2.</p>
<svg viewBox="0 0 340 60" width="100%" style="max-width:340px" role="img" aria-label="Number line from −5 to 5">
<line x1="10" y1="25" x2="330" y2="25" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="18" x2="20" y2="32"/><line x1="50" y1="18" x2="50" y2="32"/><line x1="80" y1="18" x2="80" y2="32"/><line x1="110" y1="18" x2="110" y2="32"/><line x1="140" y1="18" x2="140" y2="32"/><line x1="170" y1="14" x2="170" y2="36"/><line x1="200" y1="18" x2="200" y2="32"/><line x1="230" y1="18" x2="230" y2="32"/><line x1="260" y1="18" x2="260" y2="32"/><line x1="290" y1="18" x2="290" y2="32"/><line x1="320" y1="18" x2="320" y2="32"/></g>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="20" y="52">−5</text><text x="50" y="52">−4</text><text x="80" y="52">−3</text><text x="110" y="52">−2</text><text x="140" y="52">−1</text><text x="170" y="52">0</text><text x="200" y="52">1</text><text x="230" y="52">2</text><text x="260" y="52">3</text><text x="290" y="52">4</text><text x="320" y="52">5</text></g>
<circle cx="80" cy="25" r="5" fill="#3b6cf6"/><circle cx="230" cy="25" r="5" fill="#3b6cf6"/>
</svg>
${W('Put these in order, smallest first: −3, 2, −7, 0, −1.', ['Negative numbers are smaller than zero, and the "more negative", the smaller.', '−7 is furthest left, then −3, then −1.', 'Then comes 0, then the positive number 2.'], '−7, −3, −1, 0, 2')}`,
    },
    {
      title: 'Adding and subtracting with negatives',
      html: `<p>Picture a number line. <b>Adding</b> a positive number moves you right; <b>subtracting</b> a positive number moves you left.</p>
${rule('Subtracting a negative is the same as adding: 2 − (−3) = 2 + 3<br>Adding a negative is the same as subtracting: 6 + (−2) = 6 − 2')}
${W('The temperature at midnight is −4 °C. By midday it has risen by 7 degrees. What is the temperature at midday?', ['Start at −4 on the number line.', 'Rising by 7 means moving 7 places right: −4 → 0 uses 4 steps, then 3 more steps reach 3.'], '3 °C')}
${W('Work out 4 − 9.', ['Start at 4 and move 9 places left.', '4 steps take you to 0; you still have 5 steps to go, landing on −5.'], '−5')}
${W('Work out −6 + (−2).', ['Adding a negative is the same as subtracting: −6 − 2.', 'Start at −6 and move 2 places left.'], '−8')}`,
    },
  ],
  mistakes: [
    'Thinking a decimal with more digits is bigger (e.g. saying 0.35 > 0.4).',
    'Moving the decimal point the wrong way, so 4.2 × 10 becomes 0.42.',
    'Thinking −8 is bigger than −3 because 8 is bigger than 3.',
    'Forgetting place-holder zeros, e.g. writing 52 ÷ 1000 as 0.52.',
  ],
  examTips: [
    'When ordering, rewrite the numbers in your chosen order and tick each one off so none are missed.',
    'Sketch a quick number line for any question with negative numbers.',
    'Check your answer makes sense: multiplying by 100 should make the number bigger.',
  ],
  realLife: 'Place value and negatives are used when reading thermometers, bank balances that go overdrawn, and comparing race times to hundredths of a second.',
  specRef: 'KS3 Number: place value, ordering and negative numbers',
};

/* ------------------------------------------------------------------ */
C['y7-addition-subtraction'] = {
  overview: `<p>Adding and subtracting are the two most-used calculations in everyday life. In this topic you will use <b>column methods</b> for big numbers and decimals, use <b>inverse operations</b> to find missing numbers, and work out money and change confidently.</p>`,
  objectives: [
    'I can add whole numbers and decimals using the column method.',
    'I can subtract using the column method, including exchanging.',
    'I can use inverse operations to find a missing number.',
    'I can solve money problems, including working out change.',
  ],
  keyWords: [
    { term: 'Sum / total', def: 'The answer when numbers are added together.' },
    { term: 'Difference', def: 'How much bigger one number is than another; found by subtracting.' },
    { term: 'Carry', def: 'Moving a ten into the next column on the left when a column adds up to 10 or more.' },
    { term: 'Exchange', def: 'Swapping one from a column on the left for ten in the column on the right so you can subtract.' },
    { term: 'Inverse operation', def: 'The operation that undoes another: addition and subtraction are inverses.' },
  ],
  sections: [
    {
      title: 'Column addition',
      html: `<p>Write the numbers one under the other with the <b>ones lined up</b>. Add each column starting from the right. If a column makes 10 or more, write the ones digit and <b>carry</b> the ten into the next column.</p>
${W('Work out 4586 + 2739.', ['Ones: 6 + 9 = 15. Write 5, carry 1.', 'Tens: 8 + 3 + 1 (carried) = 12. Write 2, carry 1.', 'Hundreds: 5 + 7 + 1 = 13. Write 3, carry 1.', 'Thousands: 4 + 2 + 1 = 7. Write 7.'], '7325')}`,
    },
    {
      title: 'Adding decimals',
      html: `<p>With decimals, the golden rule is to <b>line up the decimal points</b>. Fill any gaps with zeros so each number has the same number of decimal places, then add just like whole numbers.</p>
${W('Work out 12.7 + 5.86.', ['Write 12.7 as 12.70 so both numbers have two decimal places.', 'Hundredths: 0 + 6 = 6.', 'Tenths: 7 + 8 = 15. Write 5, carry 1.', 'Ones: 2 + 5 + 1 = 8. Tens: 1. Put the decimal point directly below the others.'], '18.56')}
${note('A whole number has an invisible decimal point at the end: 25 = 25.0')}`,
    },
    {
      title: 'Column subtraction and exchanging',
      html: `<p>Put the <b>bigger number on top</b> and line up the columns. Subtract from right to left. If the top digit is smaller than the bottom digit, <b>exchange</b>: take 1 from the next column to the left, which gives you 10 more in the column you are working on.</p>
${W('Work out 6203 − 2857.', ['Ones: 3 − 7 will not work. The tens column is 0, so first exchange 1 hundred for 10 tens (hundreds 2 → 1, tens 0 → 10).', 'Now exchange 1 ten for 10 ones (tens 10 → 9, ones 3 → 13). 13 − 7 = 6.', 'Tens: 9 − 5 = 4.', 'Hundreds: 1 − 8 will not work. Exchange 1 thousand (thousands 6 → 5, hundreds 1 → 11). 11 − 8 = 3.', 'Thousands: 5 − 2 = 3.'], '3346')}
${note('Check by adding: 3346 + 2857 = 6203 ✓')}`,
    },
    {
      title: 'Missing numbers and inverse operations',
      html: `<p>If part of a calculation is missing, use the <b>inverse</b> (the opposite operation) to undo it.</p>
${rule('If □ + 348 = 912, then □ = 912 − 348<br>If □ − 175 = 260, then □ = 260 + 175')}
${W('Find the missing number: □ + 348 = 912.', ['The inverse of adding 348 is subtracting 348.', '912 − 348: ones 12 − 8 = 4 (after exchanging), tens 0 − 4 needs an exchange → 10 − 4 = 6, hundreds 8 − 3 = 5.', 'Check: 564 + 348 = 912 ✓'], '564')}
${W('Find the missing number: □ − 175 = 260.', ['The inverse of subtracting 175 is adding 175.', '260 + 175 = 435.', 'Check: 435 − 175 = 260 ✓'], '435')}`,
    },
    {
      title: 'Money and change',
      html: `<p>Money is just decimals with two decimal places. Always write pounds with two decimal places (£3.50, not £3.5). To find <b>change</b>, subtract the total cost from the amount paid.</p>
${W('Ella buys a sandwich for £3.45 and a drink for £2.80. She pays with a £10 note. How much change does she get?', ['Total cost: £3.45 + £2.80 = £6.25.', 'Change: £10.00 − £6.25.', 'Counting on also works: £6.25 → £7 is 75p, £7 → £10 is £3, so £3.75.'], '£3.75')}
${note('Convert to the same unit first: 85p + £1.20 = £0.85 + £1.20 = £2.05')}`,
    },
  ],
  mistakes: [
    'Lining numbers up on the left instead of by place value (or by the decimal point).',
    'Forgetting to add the carried digit to the next column.',
    'Subtracting the smaller digit from the larger one in each column ("4 − 7 is 3") instead of exchanging.',
    'Writing money answers like £3.5 instead of £3.50, or mixing pence and pounds.',
  ],
  examTips: [
    'Check every subtraction by adding your answer to the number you subtracted.',
    'Estimate first (e.g. 4586 + 2739 ≈ 4600 + 2700 = 7300) to spot silly slips.',
    'In money questions, write the units (£) in your final answer.',
  ],
  realLife: 'You add and subtract every time you check a shopping receipt, count your change or work out how much more you need to save.',
  specRef: 'KS3 Number: the four operations — written methods for addition and subtraction',
};

/* ------------------------------------------------------------------ */
C['y7-multiplication-division'] = {
  overview: `<p>Multiplication and division let you work with groups and sharing quickly. You will learn reliable written methods for larger numbers, how to deal with <b>remainders</b> sensibly in real problems, and how to multiply and divide decimals by whole numbers.</p>`,
  objectives: [
    'I can multiply using the grid method and long multiplication.',
    'I can divide using short division and interpret remainders.',
    'I can decide whether to round a remainder up or down in a word problem.',
    'I can multiply and divide decimals by whole numbers.',
  ],
  keyWords: [
    { term: 'Product', def: 'The answer when numbers are multiplied.' },
    { term: 'Quotient', def: 'The answer to a division.' },
    { term: 'Remainder', def: 'What is left over when a number does not divide exactly.' },
    { term: 'Divisor', def: 'The number you are dividing by.' },
    { term: 'Partition', def: 'Split a number into parts, such as 34 = 30 + 4, to make it easier to work with.' },
  ],
  sections: [
    {
      title: 'The grid method',
      html: `<p><b>Partition</b> each number into tens and ones, multiply every part by every other part in a grid, then add all the answers.</p>
${table(['×', '20', '6'], [['<b>30</b>', '600', '180'], ['<b>4</b>', '80', '24']])}
${W('Work out 34 × 26.', ['Split 34 into 30 + 4 and 26 into 20 + 6.', 'Fill the grid: 30 × 20 = 600, 30 × 6 = 180, 4 × 20 = 80, 4 × 6 = 24.', 'Add: 600 + 180 + 80 + 24 = 884.'], '884')}`,
    },
    {
      title: 'Long multiplication',
      html: `<p>Long multiplication is a compact version of the grid. Multiply the top number by the ones digit, then by the tens digit (remember the place-holder zero), then add the two rows.</p>
${W('Work out 243 × 37.', ['Multiply by the 7 ones: 243 × 7 = 1701.', 'Multiply by the 3 tens: 243 × 30 = 7290 (write a 0 in the ones column first, then 243 × 3 = 729).', 'Add the rows: 1701 + 7290 = 8991.'], '8991')}
${note('Estimate to check: 243 × 37 ≈ 250 × 40 = 10 000, so 8991 is sensible.')}`,
    },
    {
      title: 'Short division',
      html: `<p>In short division (the "bus stop" method) you divide each digit in turn from the <b>left</b>. Anything left over is carried to the next digit as tens.</p>
${W('Work out 852 ÷ 6.', ['8 ÷ 6 = 1 remainder 2. Write 1, carry 2 to make 25.', '25 ÷ 6 = 4 remainder 1. Write 4, carry 1 to make 12.', '12 ÷ 6 = 2 exactly. Write 2.', 'Check: 142 × 6 = 852 ✓'], '142')}
${W('Work out 97 ÷ 4.', ['9 ÷ 4 = 2 remainder 1. Carry 1 to make 17.', '17 ÷ 4 = 4 remainder 1.'], '24 remainder 1')}`,
    },
    {
      title: 'Remainders in real problems',
      html: `<p>In a story problem, think about what the remainder <b>means</b>. Sometimes you must round up, sometimes round down, and sometimes the remainder is the answer!</p>
${W('150 pupils are going on a trip. Each coach holds 32 pupils. How many coaches are needed?', ['150 ÷ 32 = 4 remainder 22 (because 4 × 32 = 128, and 150 − 128 = 22).', '4 coaches would leave 22 pupils behind, so another coach is needed.'], '5 coaches (round up)')}
${W('Ribbon costs £3 per metre. How many whole metres can you buy with £20?', ['20 ÷ 3 = 6 remainder 2.', 'The £2 left over is not enough for another metre.'], '6 metres (round down)')}`,
    },
    {
      title: 'Decimals and whole numbers',
      html: `<p>To multiply a decimal by a whole number, work it out as if there were no decimal point, then put the point back so the answer has the <b>same number of decimal places</b> as the decimal you started with. For division, use short division and keep the decimal point lined up.</p>
${W('Work out 3.6 × 4.', ['Ignore the point: 36 × 4 = 144.', '3.6 has one decimal place, so the answer has one decimal place.', 'Sense check: 3.6 × 4 is a bit less than 4 × 4 = 16.'], '14.4')}
${W('Work out 7.2 ÷ 3.', ['Set up the bus stop with the decimal point in the answer directly above the one in 7.2.', '7 ÷ 3 = 2 remainder 1. Carry the 1 to make 12.', '12 ÷ 3 = 4.'], '2.4')}`,
    },
  ],
  mistakes: [
    'Forgetting the place-holder zero when multiplying by the tens digit in long multiplication.',
    'Writing a remainder as a decimal (e.g. 24 r 1 is not 24.1).',
    'Rounding the wrong way in context, such as booking 4 coaches when 22 pupils are left over.',
    'Losing or misplacing the decimal point in decimal calculations.',
  ],
  examTips: [
    'Always estimate first so you can spot an answer that is ten times too big or small.',
    'Write your remainder working and then a sentence saying what it means in the context.',
    'Inverse check: multiply your division answer by the divisor to get back to the start.',
  ],
  realLife: 'Planning how many minibuses, pizza boxes or packs of cards you need for a group uses division with remainders.',
  specRef: 'KS3 Number: the four operations — formal written methods for multiplication and division',
};

/* ------------------------------------------------------------------ */
C['y7-expressions'] = {
  overview: `<p>Algebra uses <b>letters to stand for numbers</b> we do not know yet, or that can change. Learning the rules of algebraic notation lets you write ideas in a short, powerful way — and it is the language for nearly all the maths you will meet later.</p>`,
  objectives: [
    'I can use algebraic notation correctly, such as 3n and n².',
    'I can write an expression from a description in words.',
    'I can simplify an expression by collecting like terms.',
    'I can simplify products such as 3 × a × b.',
    'I can substitute numbers into an expression.',
  ],
  keyWords: [
    { term: 'Variable', def: 'A letter that stands for a number that can change.' },
    { term: 'Term', def: 'A single number, letter or product of them, such as 5, x or 4ab.' },
    { term: 'Expression', def: 'A collection of terms joined by + or − signs, with no equals sign, such as 3x + 2.' },
    { term: 'Coefficient', def: 'The number in front of a letter, such as the 4 in 4y.' },
    { term: 'Like terms', def: 'Terms with exactly the same letters, such as 3a and 7a.' },
    { term: 'Substitute', def: 'Replace a letter with a given number.' },
  ],
  sections: [
    {
      title: 'Algebra notation',
      html: `<p>Mathematicians use some short-cuts when writing algebra:</p>
${table(['Meaning', 'We write'], [['3 × n', '3n'], ['n × 3', '3n (number first)'], ['a × b', 'ab'], ['n × n', 'n<sup>2</sup>'], ['n ÷ 4', f('n', 4)], ['1 × x', 'x (not 1x)']])}
${note('3n means "3 lots of n". If n = 5 then 3n is 15, not 35!')}
${W('Write y × 7 × x using algebra notation.', ['Put the number first: 7.', 'Write the letters next to it in alphabetical order: xy.'], '7xy')}`,
    },
    {
      title: 'Writing expressions from words',
      html: `<p>Read the words carefully and turn each instruction into maths, in order. Use a letter for the unknown amount.</p>
${W('Ben has x stickers. Aisha has 4 more stickers than Ben. Write an expression for the number of stickers Aisha has.', ['"4 more than x" means add 4 to x.'], 'x + 4')}
${W('I think of a number n, multiply it by 3, then add 5. Write an expression for the result.', ['Multiply n by 3: 3n.', 'Then add 5: 3n + 5.'], '3n + 5')}
${W('A pizza is shared equally between p people. What fraction of the pizza does each person get?', ['Sharing equally means dividing.', '1 ÷ p is written as a fraction.'], f(1, 'p'))}`,
    },
    {
      title: 'Collecting like terms',
      html: `<p>You can only add or subtract <b>like terms</b> — terms with exactly the same letters. Think of them as different kinds of fruit: 3 apples + 2 apples = 5 apples, but apples and bananas cannot be combined.</p>
${W('Simplify 4a + 3b + 2a − b.', ['Find the a terms: 4a + 2a = 6a.', 'Find the b terms: 3b − b = 2b (remember −b means −1b).', 'Put them together.'], '6a + 2b')}
${note('Each term owns the sign in front of it. Circle the term together with its sign before collecting.')}`,
    },
    {
      title: 'Simplifying products',
      html: `<p>When terms are multiplied, multiply the numbers together and write the letters next to each other, usually in alphabetical order.</p>
${W('Simplify 3 × a × b.', ['There is only one number: 3.', 'Write the letters after it: ab.'], '3ab')}
${W('Simplify 2a × 5b.', ['Multiply the numbers: 2 × 5 = 10.', 'Multiply the letters: a × b = ab.'], '10ab')}
${W('Simplify 4m × m.', ['Numbers: 4.', 'Letters: m × m = m<sup>2</sup>.'], '4m<sup>2</sup>')}`,
    },
    {
      title: 'Substituting values',
      html: `<p>To <b>substitute</b>, replace each letter with its number and then work it out, remembering the order of operations (powers, then × and ÷, then + and −).</p>
${W('If a = 4 and b = 3, find the value of 2a + 5b.', ['2a = 2 × 4 = 8.', '5b = 5 × 3 = 15.', '8 + 15 = 23.'], '23')}
${W('If b = 3, find the value of 5b<sup>2</sup>.', ['Square first: b<sup>2</sup> = 3 × 3 = 9.', 'Then multiply by 5: 5 × 9 = 45.'], '45')}
${note('Writing the multiplication sign back in (2 × 4) stops you from writing 24 by mistake.')}`,
    },
  ],
  mistakes: [
    'Reading 3n as "thirty-something" when substituting, e.g. 3n with n = 5 becoming 35.',
    'Combining unlike terms, e.g. writing 2a + 3b as 5ab.',
    'Losing the minus sign in front of a term when collecting like terms.',
    'Thinking n<sup>2</sup> means n × 2 instead of n × n.',
  ],
  examTips: [
    'In substitution questions, show each step so you can earn method marks.',
    'After simplifying, quickly check by choosing a number for each letter and testing both versions.',
    'Write the number before the letters (3ab, not ab3).',
  ],
  realLife: 'Spreadsheets and computer programs use expressions with variables, such as "total = price × quantity", to do calculations automatically.',
  specRef: 'KS3 Algebra: use and interpret algebraic notation; simplify and substitute',
};

/* ------------------------------------------------------------------ */
C['y7-sequences'] = {
  overview: `<p>A <b>sequence</b> is a list of numbers that follows a rule. Spotting the rule lets you predict what comes next, fill in gaps and even jump straight to the 100th term. Sequences are your first step towards understanding patterns and graphs in algebra.</p>`,
  objectives: [
    'I can find and describe a term-to-term rule.',
    'I can continue a sequence and find missing terms.',
    'I can use an nth term rule to work out any term.',
    'I can decide whether a number is in a sequence.',
  ],
  keyWords: [
    { term: 'Sequence', def: 'An ordered list of numbers (or shapes) that follows a rule.' },
    { term: 'Term', def: 'Each number in a sequence.' },
    { term: 'Position', def: 'Where a term is in the sequence: 1st, 2nd, 3rd … (often called n).' },
    { term: 'Term-to-term rule', def: 'The rule that gets you from one term to the next, such as "add 4".' },
    { term: 'nth term', def: 'A rule that uses the position n to calculate any term directly, such as 4n + 1.' },
    { term: 'Arithmetic (linear) sequence', def: 'A sequence that goes up or down by the same amount each time.' },
  ],
  sections: [
    {
      title: 'Term-to-term rules',
      html: `<p>Look at how you get from each term to the next. Find the <b>difference</b> between neighbouring terms. If it is always the same, you have an arithmetic sequence. Some sequences multiply instead.</p>
${W('Find the rule and the next two terms: 5, 9, 13, 17, …', ['Differences: 9 − 5 = 4, 13 − 9 = 4, 17 − 13 = 4. The rule is "add 4".', '17 + 4 = 21, then 21 + 4 = 25.'], 'Add 4; next terms 21 and 25')}
${W('Find the next term: 3, 6, 12, 24, …', ['The differences are 3, 6, 12 — not the same, so try multiplying.', 'Each term is double the one before: the rule is "× 2".', '24 × 2 = 48.'], '48')}
${note('Descending sequences have a negative difference: 40, 34, 28, … has the rule "subtract 6".')}`,
    },
    {
      title: 'Finding missing terms',
      html: `<p>Use the terms you know to work out the rule, then fill the gaps. When the gap spans several steps, share the total change equally between them.</p>
${W('Find the missing term: 7, □, 19, 25', ['From 19 to 25 the difference is 6, so the rule is "add 6".', '7 + 6 = 13. Check: 13 + 6 = 19 ✓'], '13')}
${W('This arithmetic sequence has two missing terms: 4, □, □, 22. Find them.', ['From 4 to 22 is an increase of 18.', 'There are 3 steps from the 1st term to the 4th, so each step is 18 ÷ 3 = 6.', '4 + 6 = 10, 10 + 6 = 16. Check: 16 + 6 = 22 ✓'], '10 and 16')}`,
    },
    {
      title: 'Using the nth term',
      html: `<p>An <b>nth term</b> rule lets you find any term without listing them all. Replace n with the position you want.</p>
${table(['Position (n)', '1', '2', '3', '10'], [['4n + 1', '5', '9', '13', '41']])}
${W('The nth term of a sequence is 4n + 1. Find the 10th term.', ['Substitute n = 10.', '4 × 10 + 1 = 40 + 1.'], '41')}
${rule('In an nth term like 4n + 1, the number in front of n is the common difference.')}
${W('Find the nth term of 5, 9, 13, 17, …', ['The difference is 4, so the rule starts 4n.', '4n gives 4, 8, 12, … — each is 1 less than the sequence.', 'So add 1.'], '4n + 1')}`,
    },
    {
      title: 'Is a number in the sequence?',
      html: `<p>To test whether a number belongs to a sequence, set the nth term equal to it and solve. If n comes out as a <b>whole number</b>, the number is in the sequence; if not, it is not.</p>
${W('A sequence has nth term 3n + 2. Is 50 in the sequence? If so, which term is it?', ['Set 3n + 2 = 50.', 'Subtract 2: 3n = 48.', 'Divide by 3: n = 16, a whole number.'], 'Yes — it is the 16th term')}
${W('Is 70 in the sequence 3n + 2?', ['3n + 2 = 70, so 3n = 68.', '68 ÷ 3 = 22.66…, which is not a whole number.'], 'No, 70 is not in the sequence')}`,
    },
  ],
  mistakes: [
    'Giving the term-to-term rule when the question asks for the nth term (e.g. writing n + 4 instead of 4n + 1).',
    'Substituting the term instead of the position into an nth term rule.',
    'Assuming every sequence adds the same amount — some multiply or follow other patterns.',
    'Finding the difference the wrong way round in a descending sequence.',
  ],
  examTips: [
    'Write the differences above or below the sequence so the rule is easy to see.',
    'Check your nth term by substituting n = 1 and n = 2 — they should give the first two terms.',
    'For "is it in the sequence?" questions, always finish with a clear Yes or No and a reason.',
  ],
  realLife: 'Sequences describe things like seat numbers in rows of a theatre or the cost of a taxi that adds the same charge for each mile.',
  specRef: 'KS3 Algebra: generate terms of a sequence from term-to-term or position-to-term rules',
};

/* ------------------------------------------------------------------ */
C['y7-angles'] = {
  overview: `<p>An <b>angle</b> measures an amount of turn, in degrees (°). Knowing the different types of angle and a few key facts lets you work out missing angles without a protractor, and to describe triangles and quadrilaterals precisely.</p>`,
  objectives: [
    'I can name acute, right, obtuse, straight and reflex angles.',
    'I can use the facts that angles on a straight line add to 180° and around a point add to 360°.',
    'I can find a missing angle in a triangle.',
    'I can describe the properties of special triangles and quadrilaterals.',
    'I can find the number of lines of symmetry of a shape.',
  ],
  keyWords: [
    { term: 'Degree (°)', def: 'The unit for measuring angles; a full turn is 360°.' },
    { term: 'Acute', def: 'An angle less than 90°.' },
    { term: 'Obtuse', def: 'An angle bigger than 90° but less than 180°.' },
    { term: 'Reflex', def: 'An angle bigger than 180° but less than 360°.' },
    { term: 'Vertically opposite', def: 'The angles opposite each other where two straight lines cross; they are equal.' },
    { term: 'Line of symmetry', def: 'A mirror line that splits a shape into two matching halves.' },
    { term: 'Parallel', def: 'Lines that stay the same distance apart and never meet.' },
  ],
  sections: [
    {
      title: 'Types of angle',
      html: `<svg viewBox="0 0 340 95" width="100%" style="max-width:340px" role="img" aria-label="Acute, right, obtuse and reflex angles">
<g stroke="currentColor" stroke-width="2" fill="none">
<line x1="15" y1="70" x2="75" y2="70"/><line x1="15" y1="70" x2="55" y2="30"/>
<line x1="100" y1="70" x2="160" y2="70"/><line x1="100" y1="70" x2="100" y2="15"/>
<line x1="210" y1="70" x2="265" y2="70"/><line x1="210" y1="70" x2="175" y2="35"/>
<line x1="300" y1="50" x2="335" y2="50"/><line x1="300" y1="50" x2="320" y2="15"/>
</g>
<g stroke="#3b6cf6" stroke-width="2" fill="none">
<path d="M30 70 A15 15 0 0 0 25.6 59.4"/>
<rect x="100" y="60" width="10" height="10"/>
<path d="M225 70 A15 15 0 0 0 199.4 59.4"/>
<path d="M315 50 A15 15 0 1 1 307.4 37"/>
</g>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="45" y="90">acute</text><text x="125" y="90">right</text><text x="220" y="90">obtuse</text><text x="305" y="90">reflex</text></g>
</svg>
${table(['Type', 'Size'], [['Acute', 'less than 90°'], ['Right angle', 'exactly 90°'], ['Obtuse', 'between 90° and 180°'], ['Straight line', 'exactly 180°'], ['Reflex', 'between 180° and 360°']])}
${W('Name the type of angle: 205°.', ['205° is more than 180° but less than 360°.'], 'Reflex')}`,
    },
    {
      title: 'Angles on a line and around a point',
      html: `${rule('Angles on a straight line add up to 180°.<br>Angles around a point add up to 360°.<br>Vertically opposite angles are equal.')}
${W('Two angles sit on a straight line. One is 65°. Find the other angle, x.', ['Angles on a straight line add to 180°.', 'x = 180° − 65°.'], 'x = 115°')}
${W('Three angles meet at a point: 120°, 95° and y. Find y.', ['Angles around a point add to 360°.', '120° + 95° = 215°.', 'y = 360° − 215°.'], 'y = 145°')}`,
    },
    {
      title: 'Angles in a triangle',
      html: `${rule('The three angles inside any triangle add up to 180°.')}
${W('A triangle has angles of 50° and 72°. Find the third angle.', ['Add the known angles: 50° + 72° = 122°.', 'Subtract from 180°: 180° − 122° = 58°.'], '58°')}
${W('An isosceles triangle has a top angle of 40°. The other two angles are equal. Find one of them.', ['The two equal angles share what is left: 180° − 40° = 140°.', 'Each one is 140° ÷ 2 = 70°.'], '70°')}`,
    },
    {
      title: 'Special triangles',
      html: `${table(['Triangle', 'Sides', 'Angles'], [['Equilateral', 'all 3 equal', 'all 60°'], ['Isosceles', '2 equal', '2 equal (the base angles)'], ['Scalene', 'all different', 'all different'], ['Right-angled', 'any', 'one angle is 90°']])}
<p>An equilateral triangle has <b>3</b> lines of symmetry, an isosceles triangle has <b>1</b>, and a scalene triangle has <b>none</b>.</p>
${W('A triangle has angles 70°, 70° and 40°. What type of triangle is it?', ['Two angles are equal, so two sides are equal.', 'It has no right angle and not all angles are equal.'], 'Isosceles')}`,
    },
    {
      title: 'Quadrilaterals',
      html: `<p>A quadrilateral has four sides, and its four angles always add up to <b>360°</b>.</p>
${table(['Shape', 'Key properties', 'Lines of symmetry'], [['Square', '4 equal sides, 4 right angles', '4'], ['Rectangle', 'opposite sides equal, 4 right angles', '2'], ['Rhombus', '4 equal sides, opposite angles equal', '2'], ['Parallelogram', 'opposite sides equal and parallel', '0'], ['Kite', 'two pairs of equal sides next to each other', '1'], ['Trapezium', 'one pair of parallel sides', '0 (1 if isosceles)']])}
${W('A quadrilateral has angles 90°, 110° and 85°. Find the fourth angle.', ['90° + 110° + 85° = 285°.', '360° − 285° = 75°.'], '75°')}`,
    },
  ],
  mistakes: [
    'Using 360° for a triangle or 180° for a quadrilateral.',
    'Calling an angle between 180° and 360° obtuse instead of reflex.',
    'Thinking a rectangle has 4 lines of symmetry — the diagonals are not mirror lines.',
    'Measuring with a protractor when the diagram says "not drawn accurately" — use angle facts instead.',
  ],
  examTips: [
    'Give a reason for each step, e.g. "angles on a straight line add up to 180°".',
    'Check your answer looks sensible on the diagram: an obtuse-looking angle should be more than 90°.',
    'Mark equal sides and angles on the diagram as you find them.',
  ],
  realLife: 'Architects, carpenters and snooker players all use angle facts to make sure things fit together or travel in the right direction.',
  specRef: 'KS3 Geometry and measures: angle facts and properties of triangles and quadrilaterals',
};

/* ------------------------------------------------------------------ */
C['y7-factors-primes'] = {
  overview: `<p>Factors, multiples and primes describe how whole numbers are built from each other. Prime numbers are the "building blocks" of all whole numbers. You will also meet <b>powers</b> (squares and cubes) and their opposites, <b>roots</b>.</p>`,
  objectives: [
    'I can list all the factors of a number using factor pairs.',
    'I can find common factors and common multiples of two numbers.',
    'I can identify prime numbers.',
    'I can recall square numbers and cube numbers.',
    'I can find square roots and cube roots.',
  ],
  keyWords: [
    { term: 'Factor', def: 'A whole number that divides exactly into another number.' },
    { term: 'Multiple', def: 'A number in a times table, e.g. multiples of 6 are 6, 12, 18, …' },
    { term: 'Prime number', def: 'A number with exactly two factors: 1 and itself.' },
    { term: 'HCF', def: 'Highest common factor: the biggest number that is a factor of both numbers.' },
    { term: 'LCM', def: 'Lowest common multiple: the smallest number that is a multiple of both numbers.' },
    { term: 'Square number', def: 'A number multiplied by itself, e.g. 7 × 7 = 49.' },
    { term: 'Cube number', def: 'A number multiplied by itself three times, e.g. 2 × 2 × 2 = 8.' },
    { term: 'Root', def: 'The opposite of a power: the square root of 49 is 7 because 7<sup>2</sup> = 49.' },
  ],
  sections: [
    {
      title: 'Factors and factor pairs',
      html: `<p>Find factors in <b>pairs</b> that multiply to give the number. Start at 1 and work upwards; stop when the pairs start repeating.</p>
${W('List all the factors of 36. How many are there?', ['1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6.', '5 does not divide 36. The next number, 7, is past 6 so the pairs would repeat — stop.', 'List in order: 1, 2, 3, 4, 6, 9, 12, 18, 36.'], '9 factors')}
${note('Square numbers like 36 have an odd number of factors, because one pair uses the same number twice.')}`,
    },
    {
      title: 'Common factors and common multiples',
      html: `${W('Find the highest common factor (HCF) of 18 and 24.', ['Factors of 18: 1, 2, 3, 6, 9, 18.', 'Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'Common factors: 1, 2, 3, 6. The highest is 6.'], '6')}
${W('Find the lowest common multiple (LCM) of 4 and 6.', ['Multiples of 4: 4, 8, 12, 16, 20, 24, …', 'Multiples of 6: 6, 12, 18, 24, …', 'The first number in both lists is 12.'], '12')}
${note('Factors are small (they fit into the number). Multiples are big (they come from the number\'s times table).')}`,
    },
    {
      title: 'Prime numbers',
      html: `<p>A <b>prime number</b> has exactly two factors. 1 is <b>not</b> prime (it has only one factor), and 2 is the only even prime.</p>
${rule('Primes up to 50: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47')}
${W('Which numbers between 20 and 40 are prime?', ['Remove even numbers and multiples of 3, 5 and 7: 21 = 3 × 7, 25 = 5 × 5, 27 = 3 × 9, 33 = 3 × 11, 35 = 5 × 7, 39 = 3 × 13.', 'The numbers left are 23, 29, 31 and 37 — none of them have any factors except 1 and themselves.'], '23, 29, 31, 37')}`,
    },
    {
      title: 'Squares and cubes',
      html: `<p>A small raised number is called a <b>power</b> or index. 5<sup>2</sup> means 5 × 5 and 2<sup>3</sup> means 2 × 2 × 2.</p>
${table(['n', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], [['n<sup>2</sup>', '1', '4', '9', '16', '25', '36', '49', '64', '81', '100'], ['n<sup>3</sup>', '1', '8', '27', '64', '125', '216', '343', '512', '729', '1000']])}
${W('Work out 4<sup>3</sup>.', ['4<sup>3</sup> = 4 × 4 × 4.', '4 × 4 = 16, then 16 × 4 = 64.'], '64')}
${note('4<sup>3</sup> is not 4 × 3 = 12. The power tells you how many 4s to multiply together.')}`,
    },
    {
      title: 'Square roots and cube roots',
      html: `<p>A root undoes a power. The <b>square root</b> of 49, written ${sq(49)}, is 7 because 7 × 7 = 49. The <b>cube root</b> of 64 is 4 because 4 × 4 × 4 = 64.</p>
${W('Work out ' + sq(81) + ' + 2<sup>3</sup>.', [sq(81) + ' = 9, because 9 × 9 = 81.', '2<sup>3</sup> = 2 × 2 × 2 = 8.', '9 + 8 = 17.'], '17')}
${W('Find the cube root of 125.', ['Which number multiplied by itself three times makes 125?', '5 × 5 = 25 and 25 × 5 = 125.'], '5')}`,
    },
  ],
  mistakes: [
    'Thinking 1 is a prime number.',
    'Mixing up factors and multiples.',
    'Working out 3<sup>2</sup> as 3 × 2 = 6 instead of 3 × 3 = 9.',
    'Missing a factor pair, e.g. forgetting 4 × 9 when listing factors of 36.',
  ],
  examTips: [
    'Learn the square numbers to 15<sup>2</sup> = 225 and the cubes 1, 8, 27, 64, 125, 1000 by heart.',
    'List factors in pairs so none get missed.',
    'Check a "prime" by trying to divide by 2, 3, 5 and 7.',
  ],
  realLife: 'Prime numbers keep online shopping safe: the codes that protect card payments rely on how hard it is to split huge numbers into prime factors.',
  specRef: 'KS3 Number: factors, multiples, primes, powers and roots',
};

/* ------------------------------------------------------------------ */
C['y7-fractions'] = {
  overview: `<p>A <b>fraction</b> describes part of a whole that has been split into equal parts. Fractions appear everywhere — sharing, recipes, time, sales — and being confident with them makes later topics such as ratio, probability and algebra much easier.</p>`,
  objectives: [
    'I can find equivalent fractions.',
    'I can simplify a fraction fully.',
    'I can find a fraction of an amount.',
    'I can compare and order fractions.',
    'I can add and subtract fractions with the same denominator.',
  ],
  keyWords: [
    { term: 'Numerator', def: 'The top number of a fraction: how many parts you have.' },
    { term: 'Denominator', def: 'The bottom number of a fraction: how many equal parts the whole is split into.' },
    { term: 'Equivalent fractions', def: 'Fractions that look different but have the same value, such as ' + f(1, 2) + ' and ' + f(3, 6) + '.' },
    { term: 'Simplest form', def: 'A fraction where the numerator and denominator have no common factor except 1.' },
    { term: 'Unit fraction', def: 'A fraction with a numerator of 1, such as ' + f(1, 5) + '.' },
  ],
  sections: [
    {
      title: 'What a fraction means',
      html: `<p>The bar below is split into 5 equal parts and 3 are shaded, so ${f(3, 5)} of the bar is shaded. The <b>denominator</b> (5) tells you how many equal parts; the <b>numerator</b> (3) tells you how many you have.</p>
<svg viewBox="0 0 320 50" width="100%" style="max-width:340px" role="img" aria-label="Bar split into 5 parts with 3 shaded">
<rect x="10" y="10" width="180" height="30" fill="#3b6cf6" opacity="0.6"/>
<g stroke="currentColor" stroke-width="2" fill="none"><rect x="10" y="10" width="300" height="30"/><line x1="70" y1="10" x2="70" y2="40"/><line x1="130" y1="10" x2="130" y2="40"/><line x1="190" y1="10" x2="190" y2="40"/><line x1="250" y1="10" x2="250" y2="40"/></g>
</svg>
${note('The parts must be <b>equal</b> in size for the fraction to make sense.')}
${W('A pizza is cut into 8 equal slices and 5 are eaten. What fraction of the pizza is left?', ['The whole is 8 equal slices, so the denominator is 8.', 'Slices left: 8 − 5 = 3.'], f(3, 8))}`,
    },
    {
      title: 'Equivalent fractions',
      html: `${rule('Multiply (or divide) the numerator and denominator by the <b>same</b> number to get an equivalent fraction.')}
${W('Find the missing number: ' + f(2, 3) + ' = ' + f('□', 12), ['To get from 3 to 12 you multiply by 4.', 'Do the same to the numerator: 2 × 4 = 8.'], f(8, 12))}`,
    },
    {
      title: 'Simplifying fractions',
      html: `<p>To simplify, divide the top and bottom by a common factor. To do it in one step, use the <b>highest common factor</b>.</p>
${W('Write ' + f(18, 24) + ' in its simplest form.', ['The HCF of 18 and 24 is 6.', '18 ÷ 6 = 3 and 24 ÷ 6 = 4.', '3 and 4 have no common factor except 1, so we are done.'], f(3, 4))}
${note('If you use a smaller common factor first (like 2), just keep going until you cannot divide any more.')}`,
    },
    {
      title: 'Fraction of an amount',
      html: `${rule('Divide by the denominator, then multiply by the numerator.')}
${W('Find ' + f(3, 5) + ' of 40.', ['Find one fifth: 40 ÷ 5 = 8.', 'Three fifths is three times as much: 8 × 3 = 24.'], '24')}
${W('A jacket costs £60. In a sale it is ' + f(1, 4) + ' off. How much is taken off?', ['One quarter of £60: 60 ÷ 4 = 15.'], '£15 off (so it now costs £45)')}`,
    },
    {
      title: 'Comparing and ordering fractions',
      html: `<p>It is easy to compare fractions with the <b>same denominator</b> — just compare the numerators. Otherwise, change them to equivalent fractions with a common denominator first.</p>
${W('Which is bigger, ' + f(3, 4) + ' or ' + f(5, 8) + '?', ['Change quarters to eighths: ' + f(3, 4) + ' = ' + f(6, 8) + '.', 'Compare ' + f(6, 8) + ' and ' + f(5, 8) + ': 6 is more than 5.'], f(3, 4) + ' is bigger')}
${W('Order from smallest: ' + f(1, 2) + ', ' + f(2, 3) + ', ' + f(5, 12), ['Use twelfths: ' + f(1, 2) + ' = ' + f(6, 12) + ', ' + f(2, 3) + ' = ' + f(8, 12) + ', and ' + f(5, 12) + ' stays the same.', 'Order the numerators: 5, 6, 8.'], f(5, 12) + ', ' + f(1, 2) + ', ' + f(2, 3))}`,
    },
    {
      title: 'Adding and subtracting (same denominator)',
      html: `${rule('When the denominators are the same, add or subtract the numerators. The denominator stays the same.')}
${W('Work out ' + f(3, 7) + ' + ' + f(2, 7) + '.', ['Same denominator (7), so add the numerators: 3 + 2 = 5.'], f(5, 7))}
${W('Work out ' + f(5, 9) + ' − ' + f(2, 9) + ' and simplify.', ['5 − 2 = 3, giving ' + f(3, 9) + '.', 'Simplify by dividing top and bottom by 3.'], f(1, 3))}
${note('Never add the denominators: ' + f(3, 7) + ' + ' + f(2, 7) + ' is not ' + f(5, 14) + '.')}`,
    },
  ],
  mistakes: [
    'Adding the denominators as well as the numerators.',
    'Thinking a bigger denominator means a bigger fraction (' + f(1, 8) + ' is smaller than ' + f(1, 4) + ').',
    'Only changing the numerator or only the denominator when finding an equivalent fraction.',
    'Not simplifying fully when the question asks for the simplest form.',
  ],
  examTips: [
    'Always check whether your final fraction can be simplified.',
    'For "fraction of an amount" write both steps (÷ then ×) to pick up method marks.',
    'When ordering, rewrite every fraction with the same denominator in a neat row.',
  ],
  realLife: 'Recipes, pizza slices, music beats and "one-third off" sale signs all use fractions.',
  specRef: 'KS3 Number: fractions — equivalence, ordering, calculating with fractions',
};

/* ------------------------------------------------------------------ */
C['y7-fdp'] = {
  overview: `<p>Fractions, decimals and percentages are three different ways of writing the <b>same</b> thing — a part of a whole. Being able to switch between them lets you choose the easiest form for each problem, and percentages in particular are used constantly for discounts, test scores and statistics.</p>`,
  objectives: [
    'I can convert between fractions, decimals and percentages.',
    'I can recall common equivalents such as ' + f(1, 4) + ' = 0.25 = 25%.',
    'I can find a percentage of an amount by building up from 10%, 5% and 1%.',
    'I can write one quantity as a percentage of another.',
    'I can order a mixture of fractions, decimals and percentages.',
  ],
  keyWords: [
    { term: 'Percentage (%)', def: 'A number out of 100. "Per cent" means "out of a hundred".' },
    { term: 'Decimal', def: 'A number using a decimal point to show tenths, hundredths and so on.' },
    { term: 'Equivalent', def: 'Having the same value, e.g. ' + f(1, 2) + ', 0.5 and 50%.' },
    { term: 'Convert', def: 'Change from one form to another without changing the value.' },
  ],
  sections: [
    {
      title: 'Three ways to say the same thing',
      html: `<p>Percent means "out of 100", so 37% = ${f(37, 100)} = 0.37. Learn these key equivalents — they come up all the time.</p>
${table(['Fraction', 'Decimal', 'Percentage'], [[f(1, 2), '0.5', '50%'], [f(1, 4), '0.25', '25%'], [f(3, 4), '0.75', '75%'], [f(1, 5), '0.2', '20%'], [f(1, 10), '0.1', '10%'], [f(1, 100), '0.01', '1%']])}
${W('Write 37% as a fraction and as a decimal.', ['Per cent means out of 100, so 37% = ' + f(37, 100) + '.', '37 hundredths as a decimal is 0.37 (divide 37 by 100).'], f(37, 100) + ' and 0.37')}`,
    },
    {
      title: 'Converting between forms',
      html: `${rule('Decimal → percentage: × 100 &nbsp;&nbsp; Percentage → decimal: ÷ 100<br>Fraction → decimal: divide the numerator by the denominator<br>Percentage → fraction: write over 100, then simplify')}
${W('Write 0.07 as a percentage.', ['Multiply by 100: 0.07 × 100 = 7.'], '7%')}
${W('Write 35% as a fraction in its simplest form.', ['35% = ' + f(35, 100) + '.', 'Divide top and bottom by 5 (the HCF).'], f(7, 20))}
${W('Write ' + f(3, 5) + ' as a decimal and a percentage.', ['Make the denominator 10: ' + f(3, 5) + ' = ' + f(6, 10) + ' = 0.6.', '0.6 × 100 = 60.'], '0.6 and 60%')}
${W('Write ' + f(3, 8) + ' as a decimal.', ['Work out 3 ÷ 8 using short division: 3.000 ÷ 8.', '30 ÷ 8 = 3 r 6; 60 ÷ 8 = 7 r 4; 40 ÷ 8 = 5.'], '0.375')}`,
    },
    {
      title: 'Percentage of an amount',
      html: `<p>Without a calculator, build any percentage from easy pieces:</p>
${rule('10% = ÷ 10 &nbsp;&nbsp; 5% = half of 10% &nbsp;&nbsp; 1% = ÷ 100 &nbsp;&nbsp; 50% = ÷ 2 &nbsp;&nbsp; 25% = ÷ 4')}
${W('Find 35% of 80.', ['10% of 80 = 8, so 30% = 3 × 8 = 24.', '5% is half of 10%: 8 ÷ 2 = 4.', '35% = 30% + 5% = 24 + 4.'], '28')}
${W('A £60 game is reduced by 15%. How much is saved?', ['10% of £60 = £6.', '5% = £3.', '15% = £6 + £3.'], '£9')}`,
    },
    {
      title: 'One amount as a percentage of another',
      html: `<p>Write the two amounts as a fraction (part over whole), then convert to a percentage. If the denominator goes nicely into 100, use an equivalent fraction.</p>
${W('Maya scored 18 out of 25 in a test. What is this as a percentage?', ['Write as a fraction: ' + f(18, 25) + '.', '25 × 4 = 100, so multiply top and bottom by 4: ' + f(72, 100) + '.'], '72%')}
${W('Order these from smallest: 0.3, ' + f(1, 4) + ', 28%', ['Change them all to decimals: 0.3, 0.25, 0.28.', 'Order: 0.25, 0.28, 0.3.'], f(1, 4) + ', 28%, 0.3')}`,
    },
  ],
  mistakes: [
    'Writing 0.07 as 70% (it is 7%) or 0.5 as 5% (it is 50%).',
    'Thinking 5% means ÷ 5 — it is half of 10%, which is ÷ 20.',
    'Putting the numbers the wrong way round when writing one amount as a percentage of another.',
    'Comparing fractions, decimals and percentages without first converting them to the same form.',
  ],
  examTips: [
    'Show your 10%, 5% and 1% building blocks clearly — they earn method marks.',
    'Check your percentage answers are sensible: 35% of 80 should be less than half of 80.',
    'To order a mixture, convert everything to decimals (or percentages) and line them up.',
  ],
  realLife: 'Shops use percentages for discounts, phones show battery life as a percentage and schools report test results as percentages.',
  specRef: 'KS3 Number: fractions, decimals and percentages — equivalence and percentages of amounts',
};

/* ------------------------------------------------------------------ */
C['y7-equations'] = {
  overview: `<p>An <b>equation</b> says that two things are equal, and solving it means finding the value of the unknown letter. Function machines give you a picture of what is happening to a number, and working backwards through them is exactly how you solve equations.</p>`,
  objectives: [
    'I can find the output of a function machine.',
    'I can work backwards through a function machine to find the input.',
    'I can solve one-step equations using inverse operations.',
    'I can solve two-step equations and check my answer.',
    'I can form an equation from a description in words.',
  ],
  keyWords: [
    { term: 'Function machine', def: 'A diagram showing the operations applied to an input to give an output.' },
    { term: 'Input / output', def: 'The number that goes into a function machine and the number that comes out.' },
    { term: 'Equation', def: 'A statement with an equals sign where two sides have the same value, such as 3x + 5 = 26.' },
    { term: 'Solve', def: 'Find the value of the unknown that makes the equation true.' },
    { term: 'Inverse operation', def: 'The operation that undoes another: + and − are inverses, × and ÷ are inverses.' },
  ],
  sections: [
    {
      title: 'Function machines',
      html: `<p>A function machine applies operations in order. Going <b>forwards</b>, just follow the arrows. Going <b>backwards</b>, start from the output and use the inverse of each operation in reverse order.</p>
<svg viewBox="0 0 340 60" width="100%" style="max-width:340px" role="img" aria-label="Function machine: input, times 3, plus 4, output">
<g stroke="currentColor" stroke-width="2" fill="none"><rect x="90" y="15" width="60" height="30" rx="4"/><rect x="190" y="15" width="60" height="30" rx="4"/>
<line x1="50" y1="30" x2="88" y2="30"/><line x1="150" y1="30" x2="188" y2="30"/><line x1="250" y1="30" x2="288" y2="30"/></g>
<g fill="currentColor" font-size="13" text-anchor="middle"><text x="28" y="35">input</text><text x="120" y="35">× 3</text><text x="220" y="35">+ 4</text><text x="314" y="35">output</text></g>
<g fill="#3b6cf6"><polygon points="88,25 88,35 96,30"/><polygon points="188,25 188,35 196,30"/><polygon points="288,25 288,35 296,30"/></g>
</svg>
${W('The input is 6. What is the output of the machine above?', ['6 × 3 = 18.', '18 + 4 = 22.'], '22')}
${W('The output is 31. What was the input?', ['Work backwards. The inverse of + 4 is − 4: 31 − 4 = 27.', 'The inverse of × 3 is ÷ 3: 27 ÷ 3 = 9.', 'Check forwards: 9 × 3 + 4 = 31 ✓'], '9')}`,
    },
    {
      title: 'One-step equations',
      html: `<p>Think of an equation as a balance. Whatever you do to one side, you must do to the other side to keep it balanced. Use the inverse operation to get the letter on its own.</p>
${W('Solve x + 7 = 15.', ['Subtract 7 from both sides.', 'x = 15 − 7.'], 'x = 8')}
${W('Solve 4x = 28.', ['4x means 4 × x. Divide both sides by 4.', 'x = 28 ÷ 4.'], 'x = 7')}
${W('Solve ' + f('x', 5) + ' = 6.', ['The x is being divided by 5, so multiply both sides by 5.', 'x = 6 × 5.'], 'x = 30')}`,
    },
    {
      title: 'Two-step equations',
      html: `${rule('Undo the + or − first, then undo the × or ÷.')}
${W('Solve 3x + 5 = 26.', ['Subtract 5 from both sides: 3x = 21.', 'Divide both sides by 3: x = 7.', 'Check: 3 × 7 + 5 = 21 + 5 = 26 ✓'], 'x = 7')}
${W('Solve 2x − 7 = 11.', ['Add 7 to both sides: 2x = 18.', 'Divide both sides by 2: x = 9.', 'Check: 2 × 9 − 7 = 18 − 7 = 11 ✓'], 'x = 9')}`,
    },
    {
      title: 'Forming equations from words',
      html: `<p>Use a letter for the unknown number, write each instruction as algebra, and set it equal to the result you are told. Then solve.</p>
${W('I think of a number, multiply it by 4 and subtract 3. The answer is 25. What was my number?', ['Call the number n: 4n − 3 = 25.', 'Add 3 to both sides: 4n = 28.', 'Divide by 4: n = 7.', 'Check: 4 × 7 − 3 = 25 ✓'], '7')}`,
    },
  ],
  mistakes: [
    'Doing the inverse operations in the wrong order (dividing before subtracting in 3x + 5 = 26).',
    'Only changing one side of the equation.',
    'Using the same operation instead of the inverse, e.g. adding 7 when the equation already says + 7.',
    'Forgetting that 4x means 4 × x.',
  ],
  examTips: [
    'Always substitute your answer back in to check it works.',
    'Write each step on a new line with the equals signs lined up.',
    'Answers can be negative or fractions — do not assume you have made a mistake if x is not a whole number.',
  ],
  realLife: 'Working out how many extra hours of work you need to afford something, or reversing a recipe calculation, is solving an equation.',
  specRef: 'KS3 Algebra: function machines and solving linear equations',
};

/* ------------------------------------------------------------------ */
const grid = (() => {
  let g = '';
  for (let k = 0; k <= 8; k++) {
    const p = 20 + 30 * k;
    g += `<line x1="${p}" y1="20" x2="${p}" y2="260"/><line x1="20" y1="${p}" x2="260" y2="${p}"/>`;
  }
  let labels = '';
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const v = k < 0 ? '−' + -k : String(k);
    labels += `<text x="${140 + 30 * k}" y="155" text-anchor="middle">${v}</text><text x="134" y="${144 - 30 * k}" text-anchor="end">${v}</text>`;
  }
  return `<svg viewBox="0 0 280 280" width="100%" style="max-width:340px" role="img" aria-label="Coordinate grid with points A, B, C and D">
<g stroke="currentColor" stroke-width="0.5" opacity="0.35">${g}</g>
<g stroke="currentColor" stroke-width="2"><line x1="10" y1="140" x2="270" y2="140"/><line x1="140" y1="10" x2="140" y2="270"/></g>
<g fill="currentColor" font-size="10">${labels}<text x="272" y="134" text-anchor="end" font-size="12">x</text><text x="148" y="16" font-size="12">y</text><text x="134" y="154" text-anchor="end">0</text></g>
<g fill="#3b6cf6"><circle cx="230" cy="80" r="5"/><circle cx="80" cy="50" r="5"/><circle cx="50" cy="170" r="5"/><circle cx="200" cy="230" r="5"/></g>
<g fill="currentColor" font-size="13" font-weight="bold"><text x="236" y="76">A</text><text x="86" y="46">B</text><text x="56" y="166">C</text><text x="206" y="226">D</text></g>
</svg>`;
})();

C['y7-coordinates'] = {
  overview: `<p><b>Coordinates</b> give the exact position of a point on a grid using two numbers. They are how maps, computer screens and graphs describe locations, and they link algebra and geometry together.</p>`,
  objectives: [
    'I can read and plot coordinates in all four quadrants.',
    'I can find a missing vertex of a rectangle or square.',
    'I can find the midpoint of two points.',
    'I can recognise and name horizontal and vertical lines such as x = 3 and y = −2.',
  ],
  keyWords: [
    { term: 'Axis (axes)', def: 'The horizontal x-axis and the vertical y-axis that form the grid.' },
    { term: 'Origin', def: 'The point (0, 0) where the axes cross.' },
    { term: 'Coordinates', def: 'A pair of numbers (x, y) giving a position: across first, then up or down.' },
    { term: 'Quadrant', def: 'One of the four regions the axes divide the grid into.' },
    { term: 'Vertex (vertices)', def: 'A corner of a shape.' },
    { term: 'Midpoint', def: 'The point exactly halfway between two points.' },
  ],
  sections: [
    {
      title: 'Reading and plotting coordinates',
      html: `<p>Coordinates are written (x, y). Go <b>across</b> first (x), then <b>up or down</b> (y). A handy saying: "along the corridor, then up the stairs". Left of the origin x is negative; below the origin y is negative.</p>
${grid}
${W('Write down the coordinates of the points A, B, C and D on the grid.', ['A: 3 right, 2 up → (3, 2).', 'B: 2 left, 3 up → (−2, 3).', 'C: 3 left, 1 down → (−3, −1).', 'D: 2 right, 3 down → (2, −3).'], 'A(3, 2), B(−2, 3), C(−3, −1), D(2, −3)')}`,
    },
    {
      title: 'Completing shapes',
      html: `<p>For rectangles and squares, the sides are often horizontal and vertical. Points on the same vertical side share an <b>x-coordinate</b>; points on the same horizontal side share a <b>y-coordinate</b>.</p>
${W('A rectangle has vertices at (1, 1), (5, 1) and (5, 4). Find the fourth vertex.', ['The missing corner is above (1, 1), so it has x = 1.', 'It is level with (5, 4), so it has y = 4.'], '(1, 4)')}
${note('A quick sketch on squared paper makes these questions much easier.')}`,
    },
    {
      title: 'Midpoints',
      html: `${rule('Midpoint = (average of the x-coordinates, average of the y-coordinates)')}
${W('Find the midpoint of (2, 3) and (8, 7).', ['x: (2 + 8) ÷ 2 = 10 ÷ 2 = 5.', 'y: (3 + 7) ÷ 2 = 10 ÷ 2 = 5.'], '(5, 5)')}
${W('Find the midpoint of (−2, 4) and (6, 0).', ['x: (−2 + 6) ÷ 2 = 4 ÷ 2 = 2.', 'y: (4 + 0) ÷ 2 = 4 ÷ 2 = 2.'], '(2, 2)')}`,
    },
    {
      title: 'Horizontal and vertical lines',
      html: `<p>Every point on a <b>vertical</b> line has the same x-coordinate, so the line is called x = (that number). Every point on a <b>horizontal</b> line has the same y-coordinate, so it is called y = (that number).</p>
${rule('x = a is a vertical line &nbsp;|&nbsp; y = b is a horizontal line<br>The y-axis is the line x = 0; the x-axis is the line y = 0')}
${W('The points (4, 1), (4, −3) and (4, 6) all lie on one straight line. What is its equation?', ['All three points have x-coordinate 4.', 'So the line is vertical.'], 'x = 4')}`,
    },
  ],
  mistakes: [
    'Writing coordinates the wrong way round, e.g. (2, 3) instead of (3, 2).',
    'Thinking x = 3 is a horizontal line — it is vertical.',
    'Counting grid squares instead of reading the numbered lines.',
    'Forgetting the negative sign for points left of or below the origin.',
  ],
  examTips: [
    'Always write coordinates with brackets and a comma: (x, y).',
    'Check that negative coordinates are in the correct quadrant.',
    'Mark points lightly on the grid before writing them down.',
  ],
  realLife: 'Grid references on maps, the game Battleships and the pixels on a computer screen all use coordinates.',
  specRef: 'KS3 Algebra: work with coordinates in all four quadrants',
};

/* ------------------------------------------------------------------ */
C['y7-perimeter-area'] = {
  overview: `<p><b>Perimeter</b> is the distance all the way around the edge of a shape; <b>area</b> is the amount of flat space inside it. Both are vital in practical jobs like fencing a garden, carpeting a room or tiling a wall.</p>`,
  objectives: [
    'I can find the perimeter of shapes made from rectangles, including missing sides.',
    'I can find the area of rectangles and squares, and work backwards to find a missing side.',
    'I can find the area of a triangle using ½ × base × height.',
    'I can find the area of compound shapes by splitting them up.',
    'I can use the correct units for length and area.',
  ],
  keyWords: [
    { term: 'Perimeter', def: 'The total distance around the outside of a shape.' },
    { term: 'Area', def: 'The amount of surface a 2D shape covers, measured in square units.' },
    { term: 'Square centimetre (cm²)', def: 'The area of a square with sides of 1 cm.' },
    { term: 'Rectilinear shape', def: 'A shape whose sides are all straight and meet at right angles.' },
    { term: 'Perpendicular height', def: 'The height measured at right angles (90°) to the base.' },
    { term: 'Compound shape', def: 'A shape made by joining simpler shapes together.' },
  ],
  sections: [
    {
      title: 'Perimeter',
      html: `<p>To find the perimeter, add up the lengths of <b>all</b> the sides. In rectilinear shapes, you may need to work out missing sides first by using the opposite sides.</p>
<svg viewBox="0 0 300 210" width="100%" style="max-width:340px" role="img" aria-label="L-shaped figure">
<polygon points="40,20 120,20 120,120 240,120 240,180 40,180" fill="#3b6cf6" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>
<g fill="currentColor" font-size="13" text-anchor="middle"><text x="80" y="14">4 cm</text><text x="20" y="104">8 cm</text><text x="140" y="199">10 cm</text><text x="266" y="154">3 cm</text><text x="146" y="75">?</text><text x="180" y="113">?</text></g>
</svg>
${W('Find the perimeter of the L-shape above. All corners are right angles.', ['Missing vertical side: the left side is 8 cm and the right side is 3 cm, so the step is 8 − 3 = 5 cm.', 'Missing horizontal side: the bottom is 10 cm and the top is 4 cm, so 10 − 4 = 6 cm.', 'Add all six sides: 4 + 5 + 6 + 3 + 10 + 8 = 36.'], '36 cm')}`,
    },
    {
      title: 'Area of rectangles and squares',
      html: `${rule('Area of a rectangle = length × width')}
${W('Find the area of a rectangle 9 cm long and 6 cm wide.', ['Area = 9 × 6 = 54.', 'Units are square centimetres.'], '54 cm²')}
${W('A rectangle has area 48 cm² and length 8 cm. Find its width.', ['Length × width = area, so width = area ÷ length.', '48 ÷ 8 = 6.'], '6 cm')}
${W('A square has an area of 49 m². How long is each side?', ['Side × side = 49, so the side is ' + sq(49) + '.'], '7 m')}`,
    },
    {
      title: 'Area of triangles',
      html: `<p>A triangle is exactly half of a rectangle with the same base and height.</p>
${rule('Area of a triangle = ½ × base × perpendicular height')}
<svg viewBox="0 0 240 130" width="100%" style="max-width:340px" role="img" aria-label="Triangle with base and perpendicular height">
<polygon points="20,110 220,110 80,20" fill="#3b6cf6" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>
<line x1="80" y1="20" x2="80" y2="110" stroke="#3b6cf6" stroke-width="2" stroke-dasharray="5 4"/>
<rect x="80" y="100" width="10" height="10" fill="none" stroke="#3b6cf6"/>
<g fill="currentColor" font-size="13"><text x="120" y="126" text-anchor="middle">base 10 cm</text><text x="86" y="68">height 6 cm</text></g>
</svg>
${W('Find the area of a triangle with base 10 cm and perpendicular height 6 cm.', ['½ × 10 × 6.', '10 × 6 = 60, and half of 60 is 30.'], '30 cm²')}
${note('Use the height that meets the base at a right angle — not the sloping side.')}`,
    },
    {
      title: 'Compound shapes',
      html: `<p>Split the shape into rectangles (or triangles), find each area, then add. You can also take a big rectangle and <b>subtract</b> the missing piece.</p>
${W('Find the area of the L-shape from the perimeter section (8 cm tall, 10 cm wide, with a 6 cm by 5 cm piece missing from the top right).', ['Split it: a tall rectangle 4 cm × 8 cm = 32 cm², and a bottom-right rectangle 6 cm × 3 cm = 18 cm².', 'Add: 32 + 18 = 50.', 'Check another way: 10 × 8 = 80, minus 6 × 5 = 30, gives 50 ✓'], '50 cm²')}`,
    },
  ],
  mistakes: [
    'Mixing up perimeter and area.',
    'Forgetting to include the missing sides when adding up the perimeter.',
    'Using the sloping side instead of the perpendicular height for a triangle.',
    'Forgetting to halve when finding the area of a triangle.',
    'Writing area units as cm instead of cm².',
  ],
  examTips: [
    'Write all the missing lengths on the diagram before you start calculating.',
    'Check every measurement is in the same unit before you multiply.',
    'For compound shapes, check your answer using the "big rectangle minus the gap" method.',
  ],
  realLife: 'Builders use area to order the right amount of flooring or paint, and gardeners use perimeter to buy enough fencing.',
  specRef: 'KS3 Geometry and measures: perimeter and area of rectangles, triangles and compound shapes',
};

/* ------------------------------------------------------------------ */
C['y7-rounding'] = {
  overview: `<p>We often do not need an exact number — "about 3500 people" is easier to understand than 3476. <b>Rounding</b> gives a simpler value that is close to the real one, and <b>estimating</b> uses rounded numbers to check whether a calculation is sensible.</p>`,
  objectives: [
    'I can round whole numbers to the nearest 10, 100 or 1000.',
    'I can round decimals to a given number of decimal places.',
    'I can round a number to 1 significant figure.',
    'I can estimate the answer to a calculation by rounding each number first.',
  ],
  keyWords: [
    { term: 'Round', def: 'Replace a number with a simpler nearby value.' },
    { term: 'Decimal place (d.p.)', def: 'A column after the decimal point; 1 d.p. means one digit after the point.' },
    { term: 'Significant figure (s.f.)', def: 'Digits counted from the first non-zero digit; the first one is the most important.' },
    { term: 'Estimate', def: 'A rough answer found by using rounded numbers.' },
    { term: 'Approximately equal (≈)', def: 'The symbol used to show an answer is close but not exact.' },
  ],
  sections: [
    {
      title: 'Rounding to 10, 100 or 1000',
      html: `<p>Find the two "round" numbers your number sits between and decide which it is closer to. Look at the <b>deciding digit</b> — the one just to the right of where you are rounding.</p>
${rule('Deciding digit 0, 1, 2, 3 or 4 → round down<br>Deciding digit 5, 6, 7, 8 or 9 → round up')}
${W('Round 3476 to the nearest 10, the nearest 100 and the nearest 1000.', ['Nearest 10: it is between 3470 and 3480; the ones digit is 6, so round up to 3480.', 'Nearest 100: between 3400 and 3500; the tens digit is 7, so round up to 3500.', 'Nearest 1000: between 3000 and 4000; the hundreds digit is 4, so round down to 3000.'], '3480, 3500, 3000')}
${note('A number exactly halfway, like 65 to the nearest 10, rounds up to 70.')}`,
    },
    {
      title: 'Rounding to decimal places',
      html: `<p>Count the decimal places you need after the point, then look at the next digit to decide whether to round up or down.</p>
<svg viewBox="0 0 340 60" width="100%" style="max-width:340px" role="img" aria-label="4.738 on a number line between 4.7 and 4.8">
<line x1="20" y1="25" x2="320" y2="25" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="15" x2="20" y2="35"/><line x1="170" y1="18" x2="170" y2="32"/><line x1="320" y1="15" x2="320" y2="35"/></g>
<circle cx="134" cy="25" r="5" fill="#3b6cf6"/>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="20" y="52">4.7</text><text x="170" y="52">4.75</text><text x="320" y="52">4.8</text><text x="134" y="12" fill="#3b6cf6">4.738</text></g>
</svg>
${W('Round 4.738 to 1 decimal place and to 2 decimal places.', ['1 d.p.: keep the 7 tenths. The next digit is 3, so round down → 4.7.', '2 d.p.: keep 4.73. The next digit is 8, so round up → 4.74.'], '4.7 and 4.74')}
${W('Round 6.95 to 1 decimal place.', ['Keep 6.9; the next digit is 5, so round up.', '6.9 rounds up to 7.0 — keep the zero to show it is 1 d.p.'], '7.0')}`,
    },
    {
      title: 'Significant figures',
      html: `<p>The first significant figure is the <b>first non-zero digit</b>. Rounding to 1 significant figure keeps just that digit and fills the gap with zeros so the number keeps its size.</p>
${W('Round 4723 to 1 significant figure.', ['The first significant figure is the 4 (in the thousands column).', 'The next digit is 7, so round up to 5 thousands.', 'Fill the other columns with zeros.'], '5000')}
${W('Round 0.0368 to 1 significant figure.', ['The zeros at the front do not count. The first significant figure is the 3 (hundredths).', 'The next digit is 6, so round up to 4 hundredths.'], '0.04')}`,
    },
    {
      title: 'Estimating calculations',
      html: `${rule('Round every number to 1 significant figure, then do the easier calculation.')}
${W('Estimate 48.7 × 3.1.', ['48.7 ≈ 50 and 3.1 ≈ 3.', '50 × 3 = 150.'], '≈ 150')}
${W('Estimate 612 ÷ 19.6.', ['612 ≈ 600 and 19.6 ≈ 20.', '600 ÷ 20 = 30.'], '≈ 30')}
${note('Use ≈ ("approximately equal to") for an estimate, not =.')}`,
    },
  ],
  mistakes: [
    'Forgetting place-holder zeros, e.g. rounding 4723 to 1 s.f. as 5 instead of 5000.',
    'Counting zeros at the front of a decimal as significant figures.',
    'Dropping a trailing zero, e.g. writing 7 instead of 7.0 for 1 d.p.',
    'Looking at the wrong digit when deciding whether to round up or down.',
  ],
  examTips: [
    'Underline the last digit you are keeping and circle the deciding digit next to it.',
    'In an estimate question, show the rounded numbers you used — that is where the marks are.',
    'Check your rounded number is still about the same size as the original.',
  ],
  realLife: 'News reports round crowd sizes, and shoppers estimate the cost of a trolley of shopping before reaching the till.',
  specRef: 'KS3 Number: rounding to decimal places and significant figures; estimation',
};

/* ------------------------------------------------------------------ */
C['y7-ratio'] = {
  overview: `<p>A <b>ratio</b> compares the sizes of two or more amounts, such as 2 cups of flour to 1 cup of sugar. Ratios help you share things fairly, scale recipes up or down and mix paint or drinks to the right strength.</p>`,
  objectives: [
    'I can write a ratio from a situation, in the correct order.',
    'I can simplify a ratio fully.',
    'I can write a ratio as a fraction of the total.',
    'I can share an amount in a given ratio.',
    'I can scale a recipe up or down.',
  ],
  keyWords: [
    { term: 'Ratio', def: 'A way of comparing amounts, written with a colon, such as 3 : 5.' },
    { term: 'Simplify', def: 'Divide all parts of a ratio by a common factor until they cannot be divided any further.' },
    { term: 'Part', def: 'One share of a ratio; in 2 : 7 there are 9 parts in total.' },
    { term: 'Proportion', def: 'A part compared with the whole, often written as a fraction.' },
    { term: 'Unitary method', def: 'Finding the value of one item first, then scaling up.' },
  ],
  sections: [
    {
      title: 'What is a ratio?',
      html: `<p>In a bag there are 3 red counters and 5 blue counters. The ratio of red to blue is <b>3 : 5</b>. The order matters — blue to red is 5 : 3.</p>
<svg viewBox="0 0 300 50" width="100%" style="max-width:340px" role="img" aria-label="3 red counters and 5 blue counters">
<g fill="#e5484d"><circle cx="25" cy="25" r="12"/><circle cx="55" cy="25" r="12"/><circle cx="85" cy="25" r="12"/></g>
<g fill="#3b6cf6"><circle cx="135" cy="25" r="12"/><circle cx="165" cy="25" r="12"/><circle cx="195" cy="25" r="12"/><circle cx="225" cy="25" r="12"/><circle cx="255" cy="25" r="12"/></g>
</svg>
${W('A class has 14 girls and 16 boys. Write the ratio of boys to girls.', ['The question asks for boys first: 16 : 14.', 'Both numbers are even, so divide by 2.'], '8 : 7')}`,
    },
    {
      title: 'Simplifying ratios',
      html: `<p>Divide every part by the same number, just like simplifying fractions. Use the HCF to do it in one step. If there are units, make them the <b>same</b> first and then leave them out.</p>
${W('Simplify 24 : 36.', ['The HCF of 24 and 36 is 12.', '24 ÷ 12 = 2 and 36 ÷ 12 = 3.'], '2 : 3')}
${W('Write 50p : £2 in its simplest form.', ['Change to the same unit: £2 = 200p, so the ratio is 50 : 200.', 'Divide both by 50.'], '1 : 4')}`,
    },
    {
      title: 'Ratios and fractions',
      html: `<p>Add the parts to find the total number of parts. Each amount is then a fraction of that total.</p>
${W('Red and blue counters are in the ratio 3 : 5. What fraction of the counters are red?', ['Total parts: 3 + 5 = 8.', 'Red is 3 of those 8 parts.'], f(3, 8))}
${note('A ratio 3 : 5 does not mean red is ' + f(3, 5) + ' of the total — that compares red with blue, not with everything.')}`,
    },
    {
      title: 'Sharing in a ratio',
      html: `${rule('1. Add the parts. 2. Divide the amount by the total parts to find one part. 3. Multiply to find each share.')}
${W('Share £45 between Ali and Beth in the ratio 2 : 7.', ['Total parts: 2 + 7 = 9.', 'One part: £45 ÷ 9 = £5.', 'Ali gets 2 × £5 = £10; Beth gets 7 × £5 = £35.', 'Check: £10 + £35 = £45 ✓'], 'Ali £10, Beth £35')}
${W('The ratio of boys to girls in a club is 3 : 4. There are 12 boys. How many girls are there?', ['3 parts = 12 boys, so 1 part = 12 ÷ 3 = 4.', 'Girls: 4 parts = 4 × 4 = 16.'], '16 girls')}`,
    },
    {
      title: 'Scaling recipes',
      html: `<p>To change a recipe, work out what you need to multiply by — or find the amount for <b>one</b> person first (the unitary method).</p>
${table(['Pancakes (serves 4)', ''], [['Flour', '120 g'], ['Eggs', '2'], ['Milk', '300 ml']])}
${W('Adapt the recipe to serve 6 people.', ['For 1 person divide by 4: 30 g flour, ½ egg, 75 ml milk.', 'For 6 people multiply by 6: 180 g flour, 3 eggs, 450 ml milk.', '(Or notice 6 is 1.5 × 4, so multiply everything by 1.5.)'], '180 g flour, 3 eggs, 450 ml milk')}`,
    },
  ],
  mistakes: [
    'Writing the ratio in the wrong order.',
    'Dividing the amount by one part of the ratio instead of the total number of parts.',
    'Simplifying a ratio with different units without converting them first.',
    'Turning a ratio 3 : 5 into the fraction ' + f(3, 5) + ' instead of ' + f(3, 8) + '.',
  ],
  examTips: [
    'Check that your shares add back up to the original amount.',
    'Label each share with whose it is (Ali £10, Beth £35).',
    'Show the value of one part clearly — it earns a method mark even if you slip later.',
  ],
  realLife: 'Mixing squash, making concrete and scaling a recipe for a party all use ratio.',
  specRef: 'KS3 Ratio, proportion and rates of change: use ratio notation, simplify and divide in a ratio',
};

/* ------------------------------------------------------------------ */
C['y7-measures'] = {
  overview: `<p>Measures tell us <b>how long, how heavy, how much and how long it takes</b>. In this topic you will convert between metric units, work with 12-hour and 24-hour time, read timetables and solve money problems — skills you will use every single day.</p>`,
  objectives: [
    'I can convert between metric units of length, mass and capacity.',
    'I can convert between 12-hour and 24-hour clock times.',
    'I can calculate time durations and read timetables.',
    'I can solve problems involving money.',
  ],
  keyWords: [
    { term: 'Metric units', def: 'Units based on tens, such as millimetres, grams and litres.' },
    { term: 'Length', def: 'How long something is (mm, cm, m, km).' },
    { term: 'Mass', def: 'How heavy something is (g, kg, tonnes).' },
    { term: 'Capacity', def: 'How much a container holds (ml, cl, litres).' },
    { term: 'Duration', def: 'The length of time between a start and an end.' },
    { term: '24-hour clock', def: 'A way of writing times using 00:00 to 23:59, with no am or pm.' },
  ],
  sections: [
    {
      title: 'Metric conversions',
      html: `${table(['Length', 'Mass', 'Capacity'], [['10 mm = 1 cm', '1000 g = 1 kg', '1000 ml = 1 litre'], ['100 cm = 1 m', '1000 kg = 1 tonne', '100 cl = 1 litre'], ['1000 m = 1 km', '', '']])}
${rule('Big unit → small unit: multiply &nbsp;|&nbsp; Small unit → big unit: divide')}
${W('Convert 3.5 km to metres.', ['Kilometres to metres is big → small, so multiply by 1000.', '3.5 × 1000 = 3500.'], '3500 m')}
${W('Convert 2450 g to kilograms.', ['Grams to kilograms is small → big, so divide by 1000.', '2450 ÷ 1000 = 2.45.'], '2.45 kg')}
${W('A jug holds 1.2 litres of juice. 350 ml is poured out. How much is left, in ml?', ['Convert to the same unit: 1.2 litres = 1200 ml.', '1200 − 350 = 850.'], '850 ml')}`,
    },
    {
      title: '12-hour and 24-hour time',
      html: `<p>The 24-hour clock carries on counting after midday: 1 pm is 13:00, 2 pm is 14:00, and so on. Add 12 to the hours for pm times (except 12 pm). Times after midnight start at 00.</p>
${table(['12-hour', '24-hour'], [['7:05 am', '07:05'], ['12:30 pm', '12:30'], ['3:45 pm', '15:45'], ['12:20 am', '00:20'], ['11:10 pm', '23:10']])}
${W('Write 8:25 pm in 24-hour time.', ['It is pm, so add 12 to the hours: 8 + 12 = 20.'], '20:25')}`,
    },
    {
      title: 'Durations and timetables',
      html: `<p>There are <b>60 minutes</b> in an hour, not 100, so do not subtract times like ordinary decimals. Count on in jumps instead: to the next whole hour, then whole hours, then the leftover minutes.</p>
${W('A film starts at 09:47 and finishes at 11:15. How long is it?', ['09:47 → 10:00 is 13 minutes.', '10:00 → 11:15 is 1 hour 15 minutes.', '13 min + 1 h 15 min = 1 h 28 min.'], '1 hour 28 minutes')}
${table(['Station', '08:15', '09:05', '09:50'], [['Library', '08:32', '09:22', '10:07'], ['Park', '08:51', '09:41', '10:26']])}
${W('Using the bus timetable, Zara must be at the library by 09:30. What is the latest bus she can catch from the station, and how long does it take to get to the library?', ['The 09:05 bus reaches the library at 09:22 — in time. The 09:50 bus arrives at 10:07 — too late.', '09:05 → 09:22 is 17 minutes.'], 'The 09:05 bus; 17 minutes')}
${note('1.5 hours is 1 hour 30 minutes, not 1 hour 50 minutes.')}`,
    },
    {
      title: 'Money problems',
      html: `<p>There are 100 pence in £1. Convert everything to pounds (or everything to pence) before calculating, and give money answers with two decimal places.</p>
${W('Leo buys 3 notebooks at £1.85 each and a pen for 65p. How much change does he get from £10?', ['Notebooks: 3 × £1.85 = £5.55.', 'Pen: 65p = £0.65. Total: £5.55 + £0.65 = £6.20.', 'Change: £10.00 − £6.20 = £3.80.'], '£3.80')}`,
    },
  ],
  mistakes: [
    'Multiplying when you should divide (e.g. turning 2450 g into 2 450 000 kg).',
    'Treating time as a decimal, e.g. thinking 09:47 to 11:15 is 1.68 hours or 168 minutes.',
    'Writing 3:45 pm as 03:45 in 24-hour time.',
    'Mixing pounds and pence in the same calculation.',
  ],
  examTips: [
    'Ask yourself: "Should the number get bigger or smaller?" when converting units.',
    'Draw a quick time line with jumps for any duration question.',
    'Always write the units (km, kg, £, minutes) in your final answer.',
  ],
  realLife: 'Reading a train timetable, following a recipe in grams and millilitres, and budgeting your pocket money all use measures.',
  specRef: 'KS3 Ratio, proportion and rates of change: convert between standard units of measure, including time and money',
};

/* ------------------------------------------------------------------ */
C['y7-charts'] = {
  overview: `<p>Data is information we collect, such as favourite colours or how many pets people own. Organising it in <b>tally charts, frequency tables, bar charts and pictograms</b> makes patterns easy to see, and helps us answer questions quickly.</p>`,
  objectives: [
    'I can record data in a tally chart and frequency table.',
    'I can read values from a bar chart.',
    'I can read and use a pictogram, including part symbols.',
    'I can find totals and differences from charts and tables.',
  ],
  keyWords: [
    { term: 'Data', def: 'Facts or information collected, such as numbers or answers to a question.' },
    { term: 'Tally', def: 'Marks used to count, grouped in fives with the fifth mark crossing the other four.' },
    { term: 'Frequency', def: 'How many times something happens.' },
    { term: 'Bar chart', def: 'A chart where the height of each bar shows a frequency.' },
    { term: 'Pictogram', def: 'A chart that uses symbols to show frequencies, with a key.' },
    { term: 'Key', def: 'Tells you what one symbol in a pictogram represents.' },
  ],
  sections: [
    {
      title: 'Tally charts and frequency tables',
      html: `<p>Tallies are grouped in fives (four upright marks with a fifth crossing them) so they are quick to count. The <b>frequency</b> column turns the tally into a number.</p>
${table(['Favourite colour', 'Frequency'], [['Red', '7'], ['Blue', '12'], ['Green', '5'], ['Yellow', '8']])}
${W('How many people were asked in total?', ['Add all the frequencies: 7 + 12 + 5 + 8.', '7 + 12 = 19, 19 + 5 = 24, 24 + 8 = 32.'], '32 people')}`,
    },
    {
      title: 'Bar charts',
      html: `<p>Read across from the top of a bar to the vertical axis to find its frequency. Check the <b>scale</b> first — each gridline might not be worth 1.</p>
<svg viewBox="0 0 300 200" width="100%" style="max-width:340px" role="img" aria-label="Bar chart of pets: dog 9, cat 6, fish 3, rabbit 4">
<g stroke="currentColor" stroke-width="0.5" opacity="0.35"><line x1="40" y1="20" x2="290" y2="20"/><line x1="40" y1="50" x2="290" y2="50"/><line x1="40" y1="80" x2="290" y2="80"/><line x1="40" y1="110" x2="290" y2="110"/><line x1="40" y1="140" x2="290" y2="140"/></g>
<g fill="#3b6cf6"><rect x="55" y="35" width="40" height="135"/><rect x="115" y="80" width="40" height="90"/><rect x="175" y="125" width="40" height="45"/><rect x="235" y="110" width="40" height="60"/></g>
<g stroke="currentColor" stroke-width="2"><line x1="40" y1="170" x2="290" y2="170"/><line x1="40" y1="15" x2="40" y2="170"/></g>
<g fill="currentColor" font-size="11" text-anchor="end"><text x="34" y="174">0</text><text x="34" y="144">2</text><text x="34" y="114">4</text><text x="34" y="84">6</text><text x="34" y="54">8</text><text x="34" y="24">10</text></g>
<g fill="currentColor" font-size="11" text-anchor="middle"><text x="75" y="186">Dog</text><text x="135" y="186">Cat</text><text x="195" y="186">Fish</text><text x="255" y="186">Rabbit</text><text x="165" y="199">Pet</text></g>
</svg>
${W('Using the bar chart, how many more people have a dog than a cat? How many pets are shown altogether?', ['Dog = 9 and cat = 6, so 9 − 6 = 3 more.', 'Total: 9 + 6 + 3 + 4 = 22.'], '3 more; 22 pets in total')}`,
    },
    {
      title: 'Pictograms',
      html: `<p>Always read the <b>key</b>. If one symbol stands for 4, then half a symbol stands for 2.</p>
<svg viewBox="0 0 300 140" width="100%" style="max-width:340px" role="img" aria-label="Pictogram of library visitors">
<g fill="currentColor" font-size="12"><text x="10" y="29">Mon</text><text x="10" y="64">Tue</text><text x="10" y="99">Wed</text><text x="10" y="132">Key:</text><text x="74" y="132">= 4 people</text></g>
<g fill="#3b6cf6">
<circle cx="80" cy="25" r="11"/><circle cx="110" cy="25" r="11"/><circle cx="140" cy="25" r="11"/><path d="M170 14 A11 11 0 0 0 170 36 Z"/>
<circle cx="80" cy="60" r="11"/><circle cx="110" cy="60" r="11"/>
<circle cx="80" cy="95" r="11"/><circle cx="110" cy="95" r="11"/><circle cx="140" cy="95" r="11"/><circle cx="170" cy="95" r="11"/><path d="M200 84 A11 11 0 0 0 200 106 Z"/>
<circle cx="56" cy="128" r="9"/>
</g>
</svg>
${W('The pictogram shows library visitors. How many visitors were there over the three days?', ['Mon: 3½ symbols = 3 × 4 + 2 = 14.', 'Tue: 2 symbols = 8.', 'Wed: 4½ symbols = 4 × 4 + 2 = 18.', 'Total: 14 + 8 + 18 = 40.'], '40 visitors')}`,
    },
    {
      title: 'Answering questions about data',
      html: `<p>Most questions ask you to <b>read</b> a value, <b>compare</b> two values (find the difference by subtracting) or find a <b>total</b> (add everything up).</p>
${W('Using the colour table, what fraction of people chose blue?', ['Blue: 12 people out of a total of 32.', 'Simplify ' + f(12, 32) + ' by dividing by 4.'], f(3, 8))}
${note('"How many more" means subtract; "how many altogether" means add.')}`,
    },
  ],
  mistakes: [
    'Not checking the scale on a bar chart and assuming each gridline is 1.',
    'Ignoring the key on a pictogram and counting symbols as single items.',
    'Forgetting that half a symbol is worth half of the key value.',
    'Miscounting tally marks by not grouping them in fives.',
  ],
  examTips: [
    'Use a ruler to read across from the top of a bar to the axis.',
    'Write the value of each row of a pictogram next to it before answering.',
    'Re-read the question to check whether it asks for a total, a difference or a single value.',
  ],
  realLife: 'Schools, councils and businesses use charts to present survey results, sales figures and attendance in a way people can understand at a glance.',
  specRef: 'KS3 Statistics: construct and interpret tables, bar charts and pictograms',
};

/* ------------------------------------------------------------------ */
C['y7-probability'] = {
  overview: `<p><b>Probability</b> measures how likely something is to happen, from impossible (0) to certain (1). It helps us make sensible decisions when we cannot know the outcome for sure — from games and weather forecasts to sport and science.</p>`,
  objectives: [
    'I can describe how likely an event is using words such as unlikely and even chance.',
    'I can place events on a probability scale from 0 to 1.',
    'I can write a probability as a fraction when outcomes are equally likely.',
    'I can find the probability of an event not happening.',
  ],
  keyWords: [
    { term: 'Probability', def: 'A number from 0 to 1 that measures how likely an event is.' },
    { term: 'Outcome', def: 'One possible result, such as rolling a 4 on a dice.' },
    { term: 'Event', def: 'One or more outcomes you are interested in, such as rolling an even number.' },
    { term: 'Equally likely', def: 'Outcomes that each have the same chance of happening.' },
    { term: 'Fair', def: 'A dice, coin or spinner where every outcome is equally likely.' },
    { term: 'Even chance', def: 'A probability of ' + f(1, 2) + ': just as likely to happen as not.' },
  ],
  sections: [
    {
      title: 'The language of chance',
      html: `<p>We can describe probability in words or as a number on a <b>probability scale</b> from 0 to 1.</p>
<svg viewBox="0 0 340 80" width="100%" style="max-width:340px" role="img" aria-label="Probability scale from 0 to 1">
<line x1="20" y1="30" x2="320" y2="30" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="20" x2="20" y2="40"/><line x1="95" y1="24" x2="95" y2="36"/><line x1="170" y1="20" x2="170" y2="40"/><line x1="245" y1="24" x2="245" y2="36"/><line x1="320" y1="20" x2="320" y2="40"/></g>
<g fill="currentColor" font-size="12" text-anchor="middle"><text x="20" y="14">0</text><text x="170" y="14">½</text><text x="320" y="14">1</text></g>
<g fill="#3b6cf6" font-size="11" text-anchor="middle"><text x="22" y="58">impossible</text><text x="95" y="58">unlikely</text><text x="170" y="58">even chance</text><text x="245" y="58">likely</text><text x="316" y="58">certain</text></g>
</svg>
${W('Choose the best word: rolling a 7 on an ordinary six-sided dice.', ['A normal dice only has the numbers 1 to 6.', 'A 7 can never happen.'], 'Impossible')}
${W('Choose the best word: a fair coin landing on heads.', ['There are two equally likely outcomes, heads and tails.', 'The probability is ' + f(1, 2) + '.'], 'Even chance')}`,
    },
    {
      title: 'Probability as a fraction',
      html: `${rule('P(event) = number of ways it can happen ÷ total number of equally likely outcomes')}
${W('A bag holds 3 red, 5 blue and 2 green sweets. One is taken at random. Find P(blue).', ['Total sweets: 3 + 5 + 2 = 10.', 'Blue sweets: 5, so P(blue) = ' + f(5, 10) + '.', 'Simplify.'], f(1, 2))}
${W('A fair dice is rolled. Find the probability of getting a number greater than 4.', ['Numbers greater than 4: 5 and 6, so 2 outcomes.', 'Total outcomes: 6. P = ' + f(2, 6) + '.'], f(1, 3))}`,
    },
    {
      title: 'Spinners',
      html: `<p>When a spinner has <b>equal</b> sections, each section is equally likely. Count the sections that match what you want.</p>
<svg viewBox="0 0 200 200" width="100%" style="max-width:220px" role="img" aria-label="Spinner with 8 equal sections, 3 shaded">
<path d="M100 100 L180 100 A80 80 0 0 1 43.43 156.57 Z" fill="#3b6cf6" fill-opacity="0.6"/>
<circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2"/>
<g stroke="currentColor" stroke-width="2"><line x1="20" y1="100" x2="180" y2="100"/><line x1="100" y1="20" x2="100" y2="180"/><line x1="43.43" y1="43.43" x2="156.57" y2="156.57"/><line x1="43.43" y1="156.57" x2="156.57" y2="43.43"/></g>
</svg>
${W('The fair spinner has 8 equal sections and 3 are shaded. What is the probability it lands on a shaded section?', ['Shaded sections: 3.', 'Total sections: 8.'], f(3, 8))}`,
    },
    {
      title: 'The probability of something not happening',
      html: `<p>An event either happens or it does not, so the two probabilities always add up to 1.</p>
${rule('P(not A) = 1 − P(A)')}
${W('The probability that it rains tomorrow is 0.3. What is the probability that it does not rain?', ['1 − 0.3 = 0.7.'], '0.7')}
${W('Using the bag of sweets (3 red out of 10), find P(not red).', ['P(red) = ' + f(3, 10) + '.', 'P(not red) = 1 − ' + f(3, 10) + ' = ' + f(10, 10) + ' − ' + f(3, 10) + '.'], f(7, 10))}`,
    },
  ],
  mistakes: [
    'Giving a probability bigger than 1 or less than 0.',
    'Writing probability as "3 out of 8" or "3 : 8" instead of ' + f(3, 8) + ' (or a decimal).',
    'Using the number of colours instead of the number of items as the total.',
    'Assuming outcomes are equally likely when the spinner sections are different sizes.',
  ],
  examTips: [
    'Write probabilities as fractions, decimals or percentages — never as ratios or words like "3 in 8".',
    'Check that all the probabilities for one event add up to 1.',
    'Simplify fractions unless the question says not to.',
  ],
  realLife: 'Weather forecasters give the chance of rain, and game designers use probability to make board and video games fair.',
  specRef: 'KS3 Probability: use the 0–1 probability scale and calculate probabilities of equally likely outcomes',
};

module.exports = C;
