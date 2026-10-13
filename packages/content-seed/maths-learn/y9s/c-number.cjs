'use strict';
// Year 9 school units: Numbers, Maths & Money, Ratio & Inverse Proportion — teaching pages.
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
C['y9-number-skills'] = {
  overview: `<p>This unit pulls together the number skills that the rest of GCSE maths relies on. You will sort numbers into <b>integers</b>, <b>rational</b> and <b>irrational</b> numbers, calculate confidently with <b>negative (directed) numbers</b> — including substituting them into expressions — find the <b>HCF</b> and <b>LCM</b> of numbers, and carry out all four operations with <b>fractions and mixed numbers</b>.</p>`,
  objectives: [
    'I can decide whether a number is an integer, rational or irrational, and explain why.',
    'I can add, subtract, multiply and divide directed numbers, and substitute negative values into expressions.',
    'I can find the HCF and LCM of two numbers using prime factors, and spot which one a word problem needs.',
    'I can add and subtract fractions with different denominators, including mixed numbers.',
    'I can multiply and divide fractions and mixed numbers, using reciprocals.',
  ],
  keyWords: [
    { term: 'Integer', def: 'A whole number: positive, negative or zero.' },
    { term: 'Rational number', def: 'Any number that can be written exactly as one integer divided by another (not zero).' },
    { term: 'Irrational number', def: 'A number that cannot be written as a fraction of integers; as a decimal it never ends and never repeats, e.g. √2 or π.' },
    { term: 'Directed number', def: 'A number with a sign, + or −, showing its direction from zero.' },
    { term: 'HCF', def: 'Highest common factor: the biggest number that divides exactly into all the given numbers.' },
    { term: 'LCM', def: 'Lowest common multiple: the smallest number that is in the times table of all the given numbers.' },
    { term: 'Reciprocal', def: 'One divided by the number. A fraction\'s reciprocal is the fraction turned upside down; a number times its reciprocal is 1.' },
    { term: 'Quotient / product', def: 'The quotient is the result of a division; the product is the result of a multiplication.' },
  ],
  sections: [
    {
      title: 'Integers, rational and irrational numbers',
      html: `<p>"Rational" comes from <b>ratio</b>: a rational number can be written as one integer over another. Every integer is rational (7 = ${f(7, 1)}), and so is every terminating decimal (0.35 = ${f(7, 20)}) and every recurring decimal (0.333… = ${f(1, 3)}).</p>
${table(['Number', 'Type', 'Reason'], [['−4', 'integer (and rational)', 'a whole number'], ['2.6', 'rational', '= 26/10'], ['0.1818…', 'rational', 'recurring decimal'], ['√36', 'integer (and rational)', '= 6'], ['√10', 'irrational', '10 is not a square number'], ['π', 'irrational', 'never ends or repeats']])}
${note('The square root of a whole number is irrational unless the number is a perfect square. The square root of a negative number is not a real number at all.')}`,
    },
    {
      title: 'Directed number',
      html: `${rule('Adding a negative = subtracting: 6 + (−9) = 6 − 9 = −3<br>Subtracting a negative = adding: 2 − (−5) = 2 + 5 = 7<br>× or ÷: same signs → positive, different signs → negative')}
${W('Work out (−24) ÷ 6 − (−7).', ['Divide first: (−24) ÷ 6 = −4 (different signs → negative).', 'Then −4 − (−7) = −4 + 7.'], '3')}
<p>When you <b>substitute</b> a negative value into an expression, write it in brackets so you do not lose the sign.</p>
${W('Find the value of 2<i>a</i> − <i>b</i><sup>2</sup> when <i>a</i> = −3 and <i>b</i> = −4.', ['2 × (−3) − (−4)<sup>2</sup>', '= −6 − 16 (because (−4)<sup>2</sup> = 16)'], '−22')}`,
    },
    {
      title: 'HCF and LCM',
      html: `<p>For small numbers, list factors (for HCF) or multiples (for LCM). For bigger numbers, use prime factors.</p>
${W('Find the HCF and LCM of 60 and 84.', ['60 = 2<sup>2</sup> × 3 × 5 and 84 = 2<sup>2</sup> × 3 × 7.', 'HCF: primes in both, lower powers: 2<sup>2</sup> × 3 = 12.', 'LCM: every prime, higher powers: 2<sup>2</sup> × 3 × 5 × 7 = 420.'], 'HCF = 12, LCM = 420')}
${note('In word problems: <b>splitting</b> things into the largest equal groups → HCF. Things <b>happening together again</b> (buses, lights, packs to match) → LCM.')}`,
    },
    {
      title: 'Adding and subtracting fractions',
      html: `${rule('Make the denominators the same (use the LCM), then add or subtract the numerators only.')}
${W(`Work out ${f(5, 6)} − ${f(3, 8)}.`, ['LCM of 6 and 8 is 24.', `${f(5, 6)} = ${f(20, 24)} and ${f(3, 8)} = ${f(9, 24)}.`, `${f(20, 24)} − ${f(9, 24)} = ${f(11, 24)}.`], f(11, 24))}
${W(`Work out 2${f(1, 3)} + 1${f(3, 4)}.`, [`Improper fractions: ${f(7, 3)} + ${f(7, 4)}.`, `Common denominator 12: ${f(28, 12)} + ${f(21, 12)} = ${f(49, 12)}.`, `${f(49, 12)} = 4${f(1, 12)}.`], `4${f(1, 12)}`)}`,
    },
    {
      title: 'Multiplying and dividing fractions',
      html: `${rule('Multiply: numerator × numerator, denominator × denominator.<br>Divide: multiply by the reciprocal of the second fraction.')}
${W(`Work out 1${f(1, 2)} ÷ ${f(3, 5)}.`, [`1${f(1, 2)} = ${f(3, 2)}.`, `Reciprocal of ${f(3, 5)} is ${f(5, 3)}: ${f(3, 2)} × ${f(5, 3)} = ${f(15, 6)}.`, `Simplify: ${f(15, 6)} = ${f(5, 2)} = 2${f(1, 2)}.`], `2${f(1, 2)}`)}
${note(`You can picture ${f(3, 4)} × ${f(2, 3)} as a rectangle split into 4 columns and 3 rows: shading 3 columns and 2 of the rows overlaps on 6 of the 12 parts, so the answer is ${f(6, 12)} = ${f(1, 2)}.`)}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('Find the HCF of 24 and 36 by listing factors.', ['Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36.', 'The biggest number in both lists is 12.'], 'HCF = 12')}
${W('Find the LCM of 6 and 8 by listing multiples.', ['Multiples of 6: 6, 12, 18, 24, 30, …', 'Multiples of 8: 8, 16, 24, 32, …', 'The first time the lists match is 24.'], 'LCM = 24')}
${W('Work out 3 + (−5), then find 3<i>a</i> − <i>b</i> when <i>a</i> = 4 and <i>b</i> = −2.', ['With counters: 3 positives and 5 negatives make 3 zero pairs, leaving 2 negatives, so 3 + (−5) = −2.', 'Substitute with brackets: 3 × 4 − (−2) = 12 + 2.'], '−2 and 14')}
${W(`Work out ${f(2, 5)} × ${f(3, 4)}, then ${f(3, 5)} ÷ ${f(2, 3)}.`, [`Area model: a rectangle with 4 columns and 5 rows has 20 parts; shading 3 columns and 2 rows overlaps on 6 parts, so the product is ${f(6, 20)} = ${f(3, 10)}.`, `Divide by multiplying by the reciprocal: ${f(3, 5)} × ${f(3, 2)} = ${f(9, 10)}.`], `${f(3, 10)} and ${f(9, 10)}`)}
${note('A square root of a negative number, such as √(−9), is not a real number: every real number squared is zero or positive.')}`,
    },
  ],
  mistakes: [
    'Thinking every decimal is irrational — terminating and recurring decimals are rational.',
    'Writing −5<sup>2</sup> = 25: without brackets only the 5 is squared, so −5<sup>2</sup> = −25.',
    'Adding the denominators when adding fractions, e.g. 1/2 + 1/3 = 2/5.',
    'Flipping the first fraction instead of the second when dividing.',
    'Mixing up HCF and LCM in word problems.',
  ],
  examTips: [
    'Use brackets when substituting negatives on a calculator, e.g. (−3)² not −3².',
    'Always convert mixed numbers to improper fractions before multiplying or dividing.',
    'Give fraction answers in their simplest form unless told otherwise.',
    'For "show that" HCF/LCM questions, write the prime factorisations out in full.',
  ],
  realLife: 'Negative numbers describe overdrafts and temperatures; fractions appear in recipes and measurements; LCM explains when timetables line up again; and irrational numbers like π are needed every time a circle is measured.',
  specRef: 'Edexcel 1MA1 N1, N2, N4, N8, A2',
};

/* ------------------------------------------------------------------ */
C['y9-maths-money'] = {
  overview: `<p>Money maths is the maths you will use most as an adult. In this unit you read <b>bills and bank statements</b>, work out <b>simple and compound interest</b>, add <b>VAT</b>, calculate <b>wages, overtime and income tax</b>, and convert between currencies using <b>exchange rates</b>. Most of it comes down to careful percentages and multipliers.</p>`,
  objectives: [
    'I can check bills and work out balances on a bank statement, including negative balances.',
    'I can calculate simple interest and compound interest using a multiplier.',
    'I can add VAT at 20% and find a price before VAT.',
    'I can work out pay including overtime, and income tax using tax bands.',
    'I can convert between currencies and compare unit prices.',
  ],
  keyWords: [
    { term: 'Credit / debit', def: 'A credit is money paid into an account; a debit is money taken out.' },
    { term: 'Balance', def: 'The amount of money in an account after each transaction. A negative balance means the account is overdrawn.' },
    { term: 'Principal', def: 'The amount of money first invested or borrowed.' },
    { term: 'Per annum', def: 'Each year.' },
    { term: 'Multiplier', def: 'The number you multiply by to make a percentage change: more than 1 increases, less than 1 decreases.' },
    { term: 'VAT', def: 'Value Added Tax, added to the price of many goods and services; the standard UK rate is 20%.' },
    { term: 'Personal allowance', def: 'The amount you can earn each year before you pay any income tax.' },
    { term: 'Exchange rate', def: 'How much of one currency you get for one unit of another, e.g. £1 = €1.15.' },
  ],
  sections: [
    {
      title: 'Bills and bank statements',
      html: `<p>Work down the statement one line at a time: add each credit and subtract each debit. If more goes out than comes in, the balance becomes negative.</p>
${table(['Date', 'Description', 'Credit', 'Debit', 'Balance'], [['1 May', 'Opening balance', '', '', '£84.20'], ['4 May', 'Phone bill', '', '£35.00', '£49.20'], ['9 May', 'Groceries', '', '£62.75', '−£13.55'], ['15 May', 'Wages', '£410.00', '', '£396.45']])}
${note('On bills, check the units: 85p and £1.20 must both be in pounds (£0.85 and £1.20) before you add them.')}`,
    },
    {
      title: 'Simple and compound interest',
      html: `${rule('Simple interest = principal × rate ÷ 100 × years<br>Compound: amount = principal × multiplier<sup>years</sup>')}
${W('£600 is invested at 4% per year for 3 years. Find the total with (a) simple interest, (b) compound interest.', ['(a) One year: 4% of £600 = £24. Three years: £72. Total £672.', '(b) Multiplier 1.04: £600 × 1.04<sup>3</sup> = £674.9184… = £674.92.'], '(a) £672 (b) £674.92')}
${note('Compound interest grows faster because each year you earn interest on the previous interest. For depreciation (losing value) use a multiplier less than 1, e.g. 15% loss → 0.85.')}`,
    },
    {
      title: 'VAT',
      html: `${rule('Add VAT: × 1.2 &nbsp;&nbsp; Price before VAT: ÷ 1.2')}
${W('A repair costs £145 plus VAT. What is the total?', ['10% of £145 = £14.50, so 20% = £29.', '£145 + £29 = £174 (or £145 × 1.2).'], '£174')}
${W('A printer costs £96 including VAT. What was the price before VAT?', ['£96 is 120% of the original price.', '£96 ÷ 1.2 = £80.'], '£80')}
${note('Do not take 20% off a price that already includes VAT — 20% of £96 is not the VAT that was added.')}`,
    },
    {
      title: 'Wages, overtime and income tax',
      html: `<p>Overtime is paid at a higher rate: <b>time-and-a-half</b> is 1.5 × the hourly rate and <b>double time</b> is 2 × the hourly rate.</p>
${W('Leon earns £12.40 an hour for 35 hours, plus 6 hours at time-and-a-half. Find his pay.', ['Basic: 35 × £12.40 = £434.', 'Overtime rate: £12.40 × 1.5 = £18.60; 6 × £18.60 = £111.60.', 'Total: £434 + £111.60.'], '£545.60')}
<p>Income tax is charged in <b>bands</b>. With a £12,570 tax-free allowance and 20% on income up to £50,270:</p>
${W('Find the tax on a salary of £30,000.', ['Taxable income: £30,000 − £12,570 = £17,430.', '20% of £17,430 = £3486.'], '£3486')}
${note('Each rate applies only to the slice of income inside that band — not to the whole salary.')}`,
    },
    {
      title: 'Exchange rates and unit pricing',
      html: `${rule('£ → other currency: × rate &nbsp;&nbsp; other currency → £: ÷ rate')}
${W('£1 = $1.30. Change £250 into dollars, and $91 into pounds.', ['£250 × 1.30 = $325.', '$91 ÷ 1.30 = £70.'], '$325 and £70')}
<p>To compare value, find the <b>cost of one unit</b>: 4 oranges for £1 is 25p each, 5 cupcakes for £1.20 is 24p each.</p>
${note('Estimate first: if £1 is about $1.30, then $91 must be a bit less than £91 — a quick check that you divided rather than multiplied.')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('A café bill shows 3 teas at 95p each and a cake at £2.40. What is the total?', ['Change everything to pounds: 95p = £0.95.', '3 × £0.95 = £2.85.', '£2.85 + £2.40.'], '£5.25')}
${W('£200 is invested for 3 years at 4% per year. Find the total with simple interest and with compound interest.', ['Simple: 200 × 4 × 3 ÷ 100 = £24 interest, so £224.', 'Compound: 200 × 1.04<sup>3</sup> = 224.9728 → £224.97.'], '£224 (simple), £224.97 (compound)')}
${W('£1 = $1.25. Convert £40 and then £400 into dollars.', ['£40 × 1.25 = $50.', '£400 is 10 times as much, so $50 × 10 = $500.'], '$50 and $500')}
${W('3 apples cost 90p; 5 apples cost £1.40. Which is better value?', ['3 apples: 90 ÷ 3 = 30p each.', '5 apples: 140 ÷ 5 = 28p each.'], 'The 5 apples (cheaper per apple)')}
${note('A deposit is a first payment that secures an item; on a payment plan add the deposit to all the instalments to find the total cost.')}`,
    },
  ],
  mistakes: [
    'Using simple interest when the question says compound (or the other way round).',
    'Taking 20% off a VAT-inclusive price to find the price before VAT, instead of dividing by 1.2.',
    'Charging the higher tax rate on the whole salary rather than only the part in that band.',
    'Multiplying instead of dividing when converting back into pounds.',
    'Adding pence and pounds together without converting to the same unit.',
  ],
  examTips: [
    'Write down the multiplier before you start a percentage calculation.',
    'Give money answers to 2 decimal places, e.g. £12.50 not £12.5.',
    'For compound interest, type the whole calculation into your calculator in one go and round only at the end.',
  ],
  realLife: 'Payslips, savings accounts, loans, shop receipts and holiday money all use these skills — they help you spot a good deal and check that you have been paid and charged correctly.',
  specRef: 'Edexcel 1MA1 N2, N12, N13, R9, R16',
};

/* ------------------------------------------------------------------ */
C['y9-ratio-proportion'] = {
  overview: `<p>Ratio and proportion problems compare quantities. In this unit you share amounts in a <b>ratio</b>, find missing parts and totals from <b>one part</b> or a <b>difference</b>, read <b>conversion graphs</b>, and solve problems where quantities are in <b>direct</b> or <b>inverse proportion</b> — including finding the <b>best buy</b>.</p>`,
  objectives: [
    'I can share an amount in a given ratio.',
    'I can find other parts or the total when I know one part or the difference between parts.',
    'I can use a conversion graph, including for values beyond the graph.',
    'I can recognise and solve inverse proportion problems.',
    'I can compare best buys by finding unit costs.',
  ],
  keyWords: [
    { term: 'Ratio', def: 'A comparison of the sizes of two or more quantities, written with colons, e.g. 3 : 5.' },
    { term: 'Proportion', def: 'A comparison of a part with a whole, or how two quantities change together.' },
    { term: 'Direct proportion', def: 'When one quantity is multiplied by a number, the other is multiplied by the same number.' },
    { term: 'Inverse proportion', def: 'When one quantity is multiplied by a number, the other is divided by the same number.' },
    { term: 'Unitary method', def: 'Finding the value of one unit first, then scaling up.' },
    { term: 'Conversion graph', def: 'A straight-line graph through the origin used to convert between two units.' },
  ],
  sections: [
    {
      title: 'Sharing in a ratio',
      html: `${rule('Total shares → value of one share → multiply by each part')}
${W('Jo and Kim share £420 in the ratio 3 : 4. How much does each get?', ['Total shares: 3 + 4 = 7.', 'One share: £420 ÷ 7 = £60.', 'Jo: 3 × £60 = £180. Kim: 4 × £60 = £240.'], 'Jo £180, Kim £240')}
${note('Check: the parts should add back up to the total (£180 + £240 = £420).')}`,
    },
    {
      title: 'Finding values from one part or a difference',
      html: `<p>If you know one part, divide by its number of shares. If you know a <b>difference</b>, divide by the difference in shares.</p>
${W('Red and green beads are in the ratio 6 : 1. There are 12 green beads. How many red?', ['1 share = 12.', 'Red = 6 shares = 6 × 12.'], '72 red beads')}
${W('Cash is shared in the ratio 5 : 2. One person gets £45 more than the other. Find the total.', ['Difference in shares: 5 − 2 = 3 shares = £45.', 'One share = £15.', 'Total = 7 shares = 7 × £15.'], '£105')}`,
    },
    {
      title: 'Conversion graphs',
      html: `<svg viewBox="0 0 260 170" width="100%" style="max-width:300px" fill="none" stroke="currentColor" stroke-width="2"><line x1="40" y1="140" x2="240" y2="140"/><line x1="40" y1="140" x2="40" y2="20"/><line x1="40" y1="140" x2="240" y2="20" stroke="#3b6cf6" stroke-width="2.5"/><line x1="140" y1="140" x2="140" y2="80" stroke-dasharray="5 4"/><line x1="40" y1="80" x2="140" y2="80" stroke-dasharray="5 4"/><text x="140" y="156" text-anchor="middle" fill="currentColor" stroke="none" font-size="12">25 miles</text><text x="36" y="84" text-anchor="end" fill="currentColor" stroke="none" font-size="12">40 km</text></svg>
<p>Go from the given value on one axis to the line, then across to the other axis. The line goes through the origin because the units are in direct proportion.</p>
${W('The graph shows 25 miles = 40 km. Convert 300 miles to km.', ['300 is off the graph: 300 ÷ 25 = 12.', '40 × 12 = 480.'], '480 km')}`,
    },
    {
      title: 'Inverse proportion',
      html: `${rule('In inverse proportion the product stays the same: <i>x</i> × <i>y</i> = constant')}
${W('6 people take 10 days to paint a hotel. How long would 4 people take?', ['Total work = 6 × 10 = 60 person-days.', '4 people: 60 ÷ 4 = 15.'], '15 days')}
${table(['Workers', '1', '2', '4', '5'], [['Days', '40', '20', '10', '8']])}
${note('Ask yourself: if one quantity goes up, does the other go up (direct) or down (inverse)?')}`,
    },
    {
      title: 'Best buys',
      html: `${W('Shop A: 4 cans for £1.20. Shop B: 3 cans for 93p. Which is better value?', ['Shop A: £1.20 ÷ 4 = 30p per can.', 'Shop B: 93p ÷ 3 = 31p per can.'], 'Shop A (cheaper per can)')}
${note('You can also compare how much you get per £1 — then the bigger amount is the better value. Make sure you know which you have worked out.')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('Ali and Ben share £360 in the ratio 4 : 5. How much does each get?', ['Model it with 9 equal boxes: 4 for Ali, 5 for Ben.', 'One box: £360 ÷ 9 = £40.', 'Ali: 4 × £40 = £160; Ben: 5 × £40 = £200.'], 'Ali £160, Ben £200')}
${W('Green and yellow counters are in the ratio 4 : 1. There are 8 yellow counters. How many green?', ['Yellow is the 1 part, so one part = 8.', 'Green = 4 parts = 4 × 8.'], '32 green counters')}
${W('<i>P</i> is inversely proportional to <i>Q</i>. When <i>Q</i> = 24, <i>P</i> = 3. Find <i>Q</i> when <i>P</i> = 6.', ['<i>P</i> has been multiplied by 2…', '…so <i>Q</i> is divided by 2: 24 ÷ 2.'], '<i>Q</i> = 12')}
${W('Shop A: 6 bottles for £2.40. Shop B: 4 bottles for £1.80. Compare per bottle and per pound.', ['Per bottle: A = 40p, B = 45p.', 'Per £1: A = 6 ÷ 2.40 = 2.5 bottles, B = 4 ÷ 1.80 = 2.22 bottles.'], 'Shop A is better value either way')}`,
    },
  ],
  mistakes: [
    'Dividing the total by one part of the ratio instead of the total number of shares.',
    'Treating an inverse proportion problem as direct (e.g. thinking more workers take longer).',
    'Using a difference in money as if it were one share.',
    'Reading a conversion graph from the wrong axis.',
    'Comparing "cost per item" for one option with "items per £1" for another.',
  ],
  examTips: [
    'Draw a bar model for ratio questions — it makes shares and differences easy to see.',
    'Show your unit costs clearly in best-buy questions; a correct answer without working may score nothing.',
    'On conversion graphs, draw your reading lines on the graph.',
  ],
  realLife: 'Ratios are used in recipes, mixing concrete and paint, and map scales; inverse proportion helps plan how many people or machines a job needs; best buys save money at the supermarket.',
  specRef: 'Edexcel 1MA1 R5, R6, R10, R14',
};

C.__extraSections = {
  'y9-standard-form': [
    {
      title: 'School-style worked examples',
      html: `${W('Work out 7 × 10<sup>4</sup> + 5 × 10<sup>4</sup>.', ['The powers match, so add the front numbers: 7 + 5 = 12.', '12 × 10<sup>4</sup> is not standard form: 12 = 1.2 × 10.', 'So 1.2 × 10 × 10<sup>4</sup> = 1.2 × 10<sup>5</sup>.'], '1.2 × 10<sup>5</sup>')}
${W('Work out (2.4 × 10<sup>6</sup>) ÷ (0.6 × 10<sup>2</sup>).', ['Front numbers: 2.4 ÷ 0.6 = 24 ÷ 6 = 4.', 'Powers: 10<sup>6</sup> ÷ 10<sup>2</sup> = 10<sup>4</sup>.'], '4 × 10<sup>4</sup>')}
${W('Write 0.35 × 10<sup>−2</sup> in standard form.', ['0.35 = 3.5 × 10<sup>−1</sup>.', '3.5 × 10<sup>−1</sup> × 10<sup>−2</sup> = 3.5 × 10<sup>−3</sup>.'], '3.5 × 10<sup>−3</sup>')}
${note('Always check the front number is at least 1 and less than 10 — if not, adjust it and change the power to compensate.')}`,
    },
  ],
  'y9-percentage-change': [
    {
      title: 'Fractions, decimals and percentages',
      html: `<p>A percentage is a number of hundredths. A 10 × 10 grid makes the link clear: 45 shaded squares out of 100 is ${f(45, 100)} = 0.45 = 45%.</p>
${table(['Fraction', 'Decimal', 'Percentage'], [[f(1, 4), '0.25', '25%'], [f(3, 5), '0.6', '60%'], [f(1, 8), '0.125', '12.5%'], [f(2, 3), '0.666…', '66.7% (1 d.p.)']])}
${rule('Decimal → % : × 100 &nbsp;&nbsp; % → decimal : ÷ 100 &nbsp;&nbsp; Fraction → decimal : numerator ÷ denominator')}
${note('Some fractions give recurring decimals: 1/3 = 0.333… — the digits repeat for ever, so 0.33 is only an approximation.')}`,
    },
    {
      title: 'School-style worked examples',
      html: `${W('30% of a number is 21. What is the number?', ['30% = 21, so 10% = 21 ÷ 3 = 7.', '100% = 7 × 10.'], '70')}
${W('After a rise, 130% of the original amount is 91. Find the original.', ['130% = 91, so 10% = 91 ÷ 13 = 7.', '100% = 7 × 10.'], '70')}
${W('A scooter bought for £160 is sold for £100. Find the percentage loss.', ['Loss = £160 − £100 = £60.', 'Compare with the ORIGINAL price: 60 ÷ 160 × 100.'], '37.5% loss')}
${W('Write the multipliers for a 35% decrease and an 8% increase.', ['Decrease: 100% − 35% = 65% → 0.65 (less than 1).', 'Increase: 100% + 8% = 108% → 1.08 (more than 1).'], '0.65 and 1.08')}`,
    },
  ],
  'y9-direct-proportion': [
    {
      title: 'School-style worked examples',
      html: `${W('6 cans of drink cost £3.60. Find the cost of 3 cans, 18 cans and 1 can.', ['3 cans: half as many, so × 0.5 → £1.80.', '18 cans: three times as many, so × 3 → £10.80.', '1 can: £3.60 ÷ 6 = 60p (often the easiest place to start).'], '£1.80, £10.80, 60p')}
${W('Shop A: 5 cans for £1.50. Shop B: 4 cans for £1.32. Which is the best buy?', ['Cost per can: A = 150 ÷ 5 = 30p, B = 132 ÷ 4 = 33p.', 'Cans per £1: A = 5 ÷ 1.50 = 3.33, B = 4 ÷ 1.32 = 3.03.'], 'Shop A — it is cheaper per can and gives more per pound')}
${note('Both quantities change by the same multiplier in direct proportion: whatever you do to the number of items, do the same to the cost.')}`,
    },
  ],
};

module.exports = C;
