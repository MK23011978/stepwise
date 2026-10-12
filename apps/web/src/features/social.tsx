// Presence heartbeat + the "who's online" pill shown in the top bar for students.
import { useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Avatar } from '../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Students ping the server every 45s while the tab is visible; the overview (online list + unread) refreshes every 20s. */
export function useSocial(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const beat = () => { if (document.visibilityState === 'visible') api.social.heartbeat().catch(() => {}); };
    beat();
    const t = setInterval(beat, 45_000);
    document.addEventListener('visibilitychange', beat);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', beat); };
  }, [enabled]);
  return useQuery({ queryKey: ['social'], queryFn: () => api.social.overview(), enabled, refetchInterval: 20_000, refetchIntervalInBackground: false });
}

export function OnlinePill({ data }: { data: any }) {
  const online: any[] = data?.online || []; const unread = data?.unread || 0;
  return (
    <Link to="/app/friends" className="online-pill" title={`${online.length} student${online.length === 1 ? '' : 's'} online`}>
      <span className="faces">{online.slice(0, 3).map((u) => <Avatar key={u.id} u={u} />)}</span>
      <span className="dot-live" /><b>{online.length}</b><span className="hide-sm">online</span>
      {unread > 0 && <span className="badge-count" aria-label={`${unread} unread messages`}>{unread}</span>}
    </Link>
  );
}
