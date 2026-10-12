# Porting the v1 UI to React (apps/web)

The v1 single-file UI is `legacy/public/app.js` (vanilla JS, ~2,600 lines, hash routes like `#/app/roadmap`).
Port each page **feature-for-feature** into a React + TypeScript component. Keep the same look: all CSS classes
already exist in `apps/web/src/styles/global.css` (copied from v1) — reuse them (`card`, `kpis`, `btn`, `pill`,
`grid-main`, `qcard`, `choice`, `topic-card`, `cal`, `board`, `walk`, `cert`, …). Do not add new CSS files; if you
truly need a few new rules, append them to the end of `global.css` inside a comment block named after your page.

## Foundation you must reuse (do not duplicate)
| Need | Use |
|---|---|
| API calls | `api` from `src/lib/api.ts` (typed client in `packages/api-client/src/index.ts`). Never call `fetch` directly. |
| Server state | `@tanstack/react-query` — `useQuery({ queryKey: [...], queryFn })`, invalidate after mutations. |
| Session | `useSession()` from `src/state/session.tsx`: `me` (user, children, wallet), `child`, `setChildId`, `subject`, `setSubject`, `enrolled()`, `cur` (curriculum: subjects, strands, topics, years, exams, learnAvailable, pricing), `strand(id)`, `topicOfStyle(styleId)`, `topicsOf(subject)`, `subjectInfo(id)`, `refresh()` (re-fetch me + wallet), `signOut()` |
| Page frame | Student pages: `<StudentGate title="…" subjectBar?>{(child) => …}</StudentGate>` (`src/features/StudentGate.tsx`). Parent/admin pages: `<AppShell title="…" admin?>` (`src/layout/AppShell.tsx`). |
| Modals, confirm, toast, reward celebrations | `useOverlay()` → `openModal((close) => <…/>, { wide })`, `confirm(title, body, { ok, danger })`, `toast(msg, 'good'|'bad')`, `celebrate(events)` (pass `rewards` arrays returned by the API) |
| Start lesson / review / exam (prices, free trial, £0 card check) | `useLearningActions()` → `startLesson(styleId)`, `startReview({ mode?, mistakeId? })`, `startExam(examId, name, questions, minutes)` |
| Answer input (typed / multiple choice / multi / ordering + maths keypad) | `<AnswerWidget q value onChange onSubmit locked showKeypad reveal inputState />` and `correctLettersFrom(answerHtml)` in `src/ui/AnswerWidget.tsx` |
| Server-generated HTML (questions, steps, teaching pages, SVG diagrams) | `<Html html={…} />` / `<Html as="span" …/>` from `src/ui/bits.tsx` |
| Small UI | `Avatar`, `Coin`, `Spinner`, `Empty`, `Pill`, `ErrorBox`, `Icon`, `Logo`, `SHOP_LOOK` (fill it with shop emojis/css when you load the shop) |
| Charts | `Donut`, `RingLevel`, `Radar`, `Bars`, `LineChart`, `BarChart`, `Heatmap` from `src/ui/charts.tsx` |
| Style row (status dot + Start/Continue/Practise again) | `<StyleRow s i r />` from `src/features/StyleRow.tsx` |
| Child add/edit form | `<ChildForm existing? close />` from `src/features/ChildForm.tsx` (open it in a wide modal) |
| Stripe | `<CardCheck>` and `<PackCheckout>` from `src/features/payments.tsx` |
| Voice | `speak(texts[])`, `speakable(html)`, `stopSpeaking()` from `src/lib/speech.ts` |
| Effects | `confetti(n?)`, `xpPop(n)` from `src/lib/confetti.ts` |
| Formatting | `money`, `fmtDate`, `fmtDateTime`, `LETTERS`, `TERMS`, `todayStr`, `shortName`, `gradeLabel`, `store` (localStorage) from `src/lib/format.ts` |

`src/pages/student/DashboardPage.tsx` is the **reference implementation** — read it first and follow its patterns.

## Routing (react-router v7, real paths, already wired in `src/App.tsx` — do not edit App.tsx)
v1 hash routes map 1:1 to paths: `#/app/learn/X` → `/app/learn/X`, `#/admin/users/ID` → `/admin/users/:id`, etc.
Use `<Link to>`, `useNavigate()`, `useParams()`, `useSearchParams()`. Query strings: `/app/planner?tab=tasks`,
`/app/family?add=1`.

## API differences vs v1
All endpoints are the same paths under `/api/v1` and return the same shapes as v1 (see `packages/api-client`),
with these notes: lesson/exam start, answer, next, submit, similar and claim endpoints return `rewards` arrays → pass them
to `celebrate()`; after anything that changes credits or coins call `s.refresh()`; the admin content editor uses
`api.admin.contentTopic / items / addItem / patchItem / deleteItem / putLearn / patchTopic / patchStyle`.

## Rules
- Each page file has a **default export** component. Only edit the files assigned to you (you may add helper
  components inside your own pages folder). Do not modify foundation files; if something is missing, implement it
  locally in your folder.
- TypeScript strict; `any` is acceptable for API payloads (they are loosely typed `Json`).
- Mobile-first: everything must work at 375px wide (the CSS grid classes already collapse; avoid fixed widths).
- Accessibility: buttons are `<button>`, inputs have labels, images/SVG have titles where meaningful.
- Done = `cd apps/web && npx tsc --noEmit && npx vite build` both succeed with no errors.
