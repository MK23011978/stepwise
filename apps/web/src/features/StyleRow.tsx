import { useLearningActions } from './actions';
/* eslint-disable @typescript-eslint/no-explicit-any */
export function StyleRow({ s, i, r, lockedYear }: { s: { id: string; name: string }; i: number; r?: any; lockedYear?: number | null }) {
  const { startLesson } = useLearningActions();
  const status = r?.status || 'new';
  const sym = ({ new: i + 1, started: '◐', completed: '✓', mastered: '★' } as Record<string, string | number>)[status];
  return (
    <div className={`style-row ${lockedYear ? 'locked' : ''}`}>
      <div className="row"><span className={`status-dot ${status}`} title={status}>{sym}</span><div className="nm"><span className="k">Style {i + 1}:</span> {s.name}</div></div>
      <div className="small muted">{Math.min(10, r?.done || 0)}/10 done, {r?.correct || 0} correct, {r?.skipped || 0} skipped</div>
      {lockedYear ? <span className="lock-pill" title={`Unlocks in Year ${lockedYear}`}>🔒 Year {lockedYear}</span>
        : <button className={`btn sm ${status === 'new' ? '' : 'soft'}`} onClick={() => startLesson(s.id)}>{status === 'new' ? 'Start' : status === 'started' ? 'Continue' : 'Practise again'}</button>}
    </div>
  );
}
