// Small admin-only badges shared by the admin pages.
export const RoleBadge = ({ r }: { r: string }) => <span className={`pill ${r === 'admin' ? 'bad' : r === 'parent' ? 'brand' : 'good'}`}>{r}</span>;
export const StatusBadge = ({ s }: { s: string }) => <span className={`pill ${s === 'active' ? 'good' : 'warn'}`}>{s}</span>;
export const FreeBadge = () => <span className="pill" style={{ background: '#dcfce7', color: '#047857' }}>✨ free access</span>;
