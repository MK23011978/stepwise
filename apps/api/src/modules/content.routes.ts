import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject } from '@stepwise/shared';
import type { Services } from '../services.js';
import { PACKS, PRICES, PRICE_PER_LESSON, REWARD_EVERY_LESSONS, SHOP, publicExam } from './common/domain.js';
import { fail } from '../core/errors.js';

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const { content, exams } = svc.deps;
  const open = { auth: false };
  const tags = ['content'];
  app.get('/curriculum', { config: open, schema: { tags, summary: 'Subjects, strands, topics, styles, exams and pricing', response: { 200: AnyObject } } }, async () => {
    await content.ensureFresh?.();
    return {
      subjects: content.subjects, strands: content.strands, years: content.years,
      topics: content.topics.map((t) => ({ ...t, styles: t.styles.map((id) => ({ id, name: content.getStyle(id)?.name || id })) })),
      exams: exams.map(publicExam), learnAvailable: content.learnIds(), shop: SHOP.map(({ id, emoji, css }) => ({ id, look: emoji || css })),
      pricing: { perLesson: PRICE_PER_LESSON, packs: PACKS, prices: PRICES, rewardEvery: REWARD_EVERY_LESSONS },
    };
  });
  app.get('/curriculum/sample/:styleId', { config: open, schema: { tags, summary: 'A freshly generated worked example', params: z.object({ styleId: z.string() }), response: { 200: AnyObject } } }, async (req) => {
    const st = content.getStyle(req.params.styleId) || fail(404, 'Unknown style');
    const q = content.generate(st.id);
    return { intro: st.intro, example: { html: q.html + (q.options ? `<ol type="A">${(q.options as string[]).map((o) => `<li>${o}</li>`).join('')}</ol>` : ''), diagram: q.diagram, answerHtml: q.answerHtml, steps: q.steps } };
  });
  app.get('/learn/:topicId', { config: open, schema: { tags, summary: 'Teaching page for a topic with live examples', params: z.object({ topicId: z.string() }), response: { 200: AnyObject } } }, async (req) => {
    const t = content.getTopic(req.params.topicId) || fail(404, 'Unknown topic');
    const examples = t.styles.slice(0, 3).map((sid) => { const q = content.generate(sid); const st = content.getStyle(sid)!; return { styleId: sid, styleName: st.name, intro: st.intro, html: q.html, diagram: q.diagram, options: q.options || null, steps: q.steps, answerHtml: q.answerHtml }; });
    return { topic: { ...t, styles: t.styles.map((id) => ({ id, name: content.getStyle(id)?.name, intro: content.getStyle(id)?.intro })) }, content: content.learn(t.id), examples };
  });
};
export default routes;
