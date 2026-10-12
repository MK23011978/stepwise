// Help & FAQ (v1 `/app/help`).
import { AppShell } from '../../layout/AppShell';

const FAQ: [string, string][] = [
  ['How does a lesson work?', 'Each lesson covers one question style. It starts with a short explanation and a worked example (read aloud in Maths), then 10 practice questions plus 2 quick review questions from earlier topics. You get 3 tries per question, a hint, and the full explanation afterwards.'],
  ['Where are the topic explanations?', 'Open the Roadmap & Learn page, tap any topic and choose “Learn this topic”. Each page has objectives, key words, step-by-step teaching with worked examples, common mistakes and exam tips.'],
  ['How does review work?', 'After each lesson the style is scheduled for review (1 day, 2 days, 4 days, a week… later). Every wrong or skipped answer goes into the mistakes bank. Review sessions are free and mix your mistakes with topics that are due.'],
  ['What happens after a test?', 'You get a grade and a breakdown by area. Then the app walks through every question you missed: your answer, the correct answer, the key idea, the full method (read aloud if you like) and a similar question to try straight away.'],
  ['How do rewards work?', 'Correct answers earn XP and coins. Levels, badges and certificates unlock as you progress. Coins buy avatars, backgrounds and streak freezes. Every 10 completed lessons earns a free lesson. Parents can also set goals with real-world rewards.'],
  ['What does it cost?', 'Every lesson, topic test and checkpoint/mock costs 1 credit (£1). Review sessions are free. The first lesson is free after a £0 card check (your card is not charged). Credits never expire.'],
  ['How do I type answers?', 'Multiple-choice: tap an option (or several, if asked). Ordering: tap the options in order. Maths: use the keypad for symbols — fractions 3/4, mixed numbers 1 3/4, powers x^2, two answers separated by a comma.'],
  ['Which exam boards?', 'Maths follows Pearson Edexcel 1MA1. Biology, Chemistry, Physics, English Language, English Literature, Computer Science, Geography and History follow the AQA specifications. Years 7–9 build the foundations.'],
];

export default function HelpPage() {
  return (
    <AppShell title="Help">
      <div className="page-head"><h1>Help &amp; FAQ</h1><p>Everything you need to get the most out of Stepwise.</p></div>
      <div className="stack" style={{ maxWidth: 820 }}>{FAQ.map(([q, a]) => (
        <details key={q} className="card"><summary style={{ fontWeight: 700, cursor: 'pointer' }}>{q}</summary><p className="muted" style={{ margin: '12px 0 0' }}>{a}</p></details>))}</div>
    </AppShell>
  );
}
