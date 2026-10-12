// School alignment: school unit tests / Year 9 school exam, and school results entered by the student or parent.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 120_000);
afterAll(async () => ctx?.close());

describe('school alignment', () => {
  it('runs school exams and records school results', async () => {
    const p = client(ctx.app);
    await p.call('POST', '/auth/register', { name: 'School Parent', email: 'sp@example.test', password: 'longenough1' });
    const { child } = await p.call('POST', '/children', { name: 'Sam Pupil', yearGroup: 9, username: 'sam.pupil', password: 'kidpassword' });
    await p.call('POST', '/billing/verify-card', { demo: true });
    await p.call('POST', '/billing/checkout', { packId: 'pack10' });

    // school exams: every topic in the unit appears at least once
    const ex = (await p.call('GET', `/students/${child.id}/exams?subject=maths`)).exams;
    const unit = ex.find((e: { id: string }) => e.id === 'school-y9-algebra');
    expect(unit.blurb).toContain('Reasoning with Algebra');
    const full = ex.find((e: { id: string }) => e.id === 'school-y9-exam');
    expect(full.questions).toBe(35);
    const { attempt } = await p.call('POST', '/exams', { studentId: child.id, examId: 'school-y9-algebra' });
    const topics = new Set(attempt.questions.map((q: { topic: string }) => q.topic));
    const inUnit = ctx.deps.content.topics.filter((t) => ['y9-straight-line-graphs', 'y9-formulae', 'y9-equations-both-sides', 'y9-inequalities', 'y9-conjectures', 'y9-expanding-double'].includes(t.id));
    expect(topics.size).toBe(inUnit.length);

    // the student enters school results; the parent sees and edits them
    const kid = client(ctx.app);
    await kid.call('POST', '/auth/login', { login: 'sam.pupil', password: 'kidpassword' });
    await kid.call('POST', `/students/${child.id}/school-results`, { subject: 'maths', title: 'Autumn assessment', unit: 'algebra', takenOn: '2026-10-01', score: 42, maxScore: 60, grade: '5', targetGrade: '6' });
    const r2 = await kid.call('POST', `/students/${child.id}/school-results`, { subject: 'maths', title: 'Unit test', takenOn: '2026-10-10', score: 27, maxScore: 30, grade: '6+' });
    expect(r2.result.pct).toBe(90);
    await kid.call('POST', `/students/${child.id}/school-results`, { subject: 'maths', title: 'Bad', takenOn: '2026-10-10', score: 31, maxScore: 30 }, 400);
    await kid.call('POST', `/students/${child.id}/school-results`, { subject: 'nope', title: 'Bad', takenOn: '2026-10-10', score: 1, maxScore: 30 }, 400);
    const v = await p.call('GET', `/students/${child.id}/school-results`);
    expect(v.results).toHaveLength(2);
    expect(v.results[0].title).toBe('Unit test'); // newest first
    expect(v.results[1].unitName).toBe('Reasoning with Algebra');
    expect(v.subjects[0]).toMatchObject({ subject: 'maths', count: 2, latestPct: 90, trend: 20, latestGrade: '6+' });
    await p.call('PATCH', `/students/${child.id}/school-results/${r2.result.id}`, { score: 24 });
    expect((await p.call('GET', `/students/${child.id}/school-results`)).results[0].pct).toBe(80);
    await p.call('PATCH', `/students/${child.id}/school-results/${r2.result.id}`, { score: 99 }, 400);

    // others can't see them; deleting works
    const other = client(ctx.app);
    await other.call('POST', '/auth/register', { name: 'Other', email: 'other-sr@example.test', password: 'longenough1' });
    await other.call('GET', `/students/${child.id}/school-results`, undefined, 403);
    await kid.call('DELETE', `/students/${child.id}/school-results/${r2.result.id}`);
    expect((await kid.call('GET', `/students/${child.id}/school-results`)).results).toHaveLength(1);
  }, 120_000);
});
