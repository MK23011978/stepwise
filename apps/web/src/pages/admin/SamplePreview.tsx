// Preview a freshly generated worked example for a question style (api.content.sample).
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ErrorBox, Html, Spinner } from '../../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function SampleBody({ styleId, nonce = 0 }: { styleId: string; nonce?: number }) {
  const q = useQuery({ queryKey: ['sample', styleId, nonce], queryFn: () => api.content.sample(styleId), staleTime: 0, gcTime: 0 });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d: any = q.data;
  return (
    <>
      <div className="intro-box" style={{ marginTop: 10 }}>💡 {d.intro}</div>
      <Html className="qtext" html={d.example.html} />
      {d.example.diagram && <Html className="diagram" html={d.example.diagram} />}
      <div className="solution"><ol>{(d.example.steps || []).map((st: string, i: number) => <Html as="li" key={i} html={st} />)}</ol></div>
      <div className="feedback info"><b>Answer:</b> <Html as="span" html={d.example.answerHtml} /></div>
    </>
  );
}

export function SamplePreview({ styleId, name, close }: { styleId: string; name: string; close: () => void }) {
  return (
    <>
      <div className="tiny muted">Preview · {name}</div>
      <SampleBody styleId={styleId} />
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={close}>Close</button></div>
    </>
  );
}
