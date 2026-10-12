export function confetti(n = 90) {
  const colors = ['#3b6cf6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; c.style.animationDelay = Math.random() * 0.4 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}
export function xpPop(n: number) { const el = document.createElement('div'); el.className = 'xp-pop'; el.textContent = `+${n} XP`; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
