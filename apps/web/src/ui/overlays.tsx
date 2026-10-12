// Modals, confirm dialogs, toasts and reward celebrations — one provider, hooks for every page.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { confetti } from '../lib/confetti';

type ModalOpts = { wide?: boolean; onClose?: () => void };
type ModalRender = (close: () => void) => ReactNode;
interface Overlay {
  openModal: (render: ModalRender, opts?: ModalOpts) => () => void;
  closeModal: () => void;
  confirm: (title: string, body: ReactNode, opts?: { ok?: string; danger?: boolean }) => Promise<boolean>;
  toast: (msg: string, kind?: '' | 'good' | 'bad') => void;
  celebrate: (events?: RewardEvent[]) => void;
}
export type RewardEvent = { type?: string; title: string; text?: string; icon?: string; certId?: string };
const Ctx = createContext<Overlay | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{ render: ModalRender; opts: ModalOpts } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const queue = useRef<RewardEvent[]>([]);
  const [current, setCurrent] = useState<RewardEvent | null>(null);
  const navigate = useNavigate();

  const closeModal = useCallback(() => setModal((m) => { m?.opts.onClose?.(); return null; }), []);
  const openModal = useCallback((render: ModalRender, opts: ModalOpts = {}) => { setModal({ render, opts }); return () => setModal(null); }, []);
  const toast = useCallback((msg: string, kind = '') => { const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, msg, kind }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600); }, []);
  const confirm = useCallback((title: string, body: ReactNode, o: { ok?: string; danger?: boolean } = {}) => new Promise<boolean>((resolve) => {
    let done = false;
    setModal({ opts: { onClose: () => { if (!done) resolve(false); } }, render: (close) => (
      <><h2>{title}</h2><div className="muted" style={{ marginTop: 8 }}>{body}</div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn ghost" onClick={close}>Cancel</button>
          <button className={`btn ${o.danger ? 'danger' : ''}`} onClick={() => { done = true; setModal(null); resolve(true); }}>{o.ok || 'Confirm'}</button>
        </div></>) });
  }), []);
  const next = useCallback(() => { const e = queue.current.shift() || null; setCurrent(e); if (e) confetti(e.type === 'badge' ? 60 : 110); }, []);
  const celebrate = useCallback((events?: RewardEvent[]) => { if (!events?.length) return; queue.current.push(...events); setCurrent((c) => { if (!c) { const e = queue.current.shift()!; confetti(110); return e; } return c; }); }, []);

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (current) next(); else closeModal(); } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [current, next, closeModal]);

  return (
    <Ctx.Provider value={{ openModal, closeModal, confirm, toast, celebrate }}>
      {children}
      {modal && createPortal(
        <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={`modal ${modal.opts.wide ? 'wide' : ''}`} role="dialog" aria-modal="true">{modal.render(closeModal)}</div>
        </div>, document.body)}
      {current && createPortal(
        <div className="modal-bg" style={{ zIndex: 95 }}>
          <div className="modal" role="dialog" aria-modal="true"><div className="reward-modal">
            <div className="big">{current.icon || '🎉'}</div><h2 style={{ marginTop: 14 }}>{current.title}</h2><p className="muted">{current.text}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
              {current.certId && <button className="btn ghost" onClick={() => { const id = current.certId; next(); navigate(`/app/certificate/${id}`); }}>View certificate</button>}
              <button className="btn" onClick={next}>{queue.current.length ? 'Next' : 'Awesome!'}</button>
            </div></div></div>
        </div>, document.body)}
      {createPortal(<div id="toast-root">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}</div>, document.body)}
    </Ctx.Provider>
  );
}
export function useOverlay() { const o = useContext(Ctx); if (!o) throw new Error('OverlayProvider missing'); return o; }
