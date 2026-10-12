// Year locks: the student's own year and earlier years are open; later years are grey until they move up.
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSession } from '../state/session';
import { useOverlay } from '../ui/overlays';

export const isYearLocked = (year: number, child: { yearGroup: number } | null | undefined) => !!child && year > child.yearGroup;
export const lockText = (year: number) => `Unlocks in Year ${year}`;

/** Small "Year 9 · Change class" control, usable by students, parents and admins. */
export function YearSwitcher({ child, compact = false }: { child: { id: string; name: string; yearGroup: number }; compact?: boolean }) {
  const { openModal } = useOverlay();
  return (
    <button className={`btn ${compact ? 'sm' : ''} ghost`} onClick={() => openModal((close) => <YearForm child={child} close={close} />)} title="Change class">
      🎒 Year {child.yearGroup} · Change class
    </button>
  );
}

function YearForm({ child, close }: { child: { id: string; name: string; yearGroup: number }; close: () => void }) {
  const s = useSession(); const qc = useQueryClient(); const { toast, celebrate } = useOverlay();
  const [year, setYear] = useState(child.yearGroup); const [busy, setBusy] = useState(false);
  const years = s.cur?.years || [7, 8, 9, 10, 11];
  const self = s.me?.user.id === child.id;
  const save = async () => {
    setBusy(true);
    try {
      await api.students.setYearGroup(child.id, year);
      await s.refresh(); await qc.invalidateQueries();
      close();
      if (year > child.yearGroup) celebrate([{ type: 'year', title: `Welcome to Year ${year}! 🎉`, text: `Year ${year} topics, tests and exams are now unlocked.`, icon: '🔓' }]);
      else toast(`Moved to Year ${year} — later years are locked again (progress is kept).`);
    } catch (e) { toast((e as Error).message, 'bad'); setBusy(false); }
  };
  return (
    <>
      <h2>{self ? 'Change my class' : `Change ${child.name}’s class`}</h2>
      <p className="muted">Topics, lessons and tests are open for the current year and every earlier year (for revision). Later years appear grey and unlock automatically when {self ? 'you move' : 'they move'} up.</p>
      <div className="year-tabs" style={{ marginTop: 14 }}>
        {years.map((y) => <button key={y} className={`year-tab ${y === year ? 'on' : ''}`} onClick={() => setYear(y)} aria-pressed={y === year}>
          <span className="tiny faint">{y === child.yearGroup ? 'Current' : y < child.yearGroup ? 'Earlier' : 'Move up'}</span><b>Year {y}</b></button>)}
      </div>
      {year > child.yearGroup && <div className="note" style={{ marginTop: 6 }}>Year {child.yearGroup + 1}{year > child.yearGroup + 1 ? `–${year}` : ''} will unlock.</div>}
      {year < child.yearGroup && <div className="note" style={{ marginTop: 6 }}>Years above {year} will be locked again. Nothing is deleted.</div>}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}><button className="btn ghost" onClick={close}>Cancel</button>
        <button className="btn" disabled={busy || year === child.yearGroup} onClick={save}>Move to Year {year}</button></div>
    </>
  );
}
