// Turns question HTML into natural speech and reads it with the browser's speech engine.
export function speakable(html: string) {
  const d = document.createElement('div'); d.innerHTML = html;
  d.querySelectorAll('svg').forEach((x) => x.remove());
  d.querySelectorAll('.frac').forEach((f) => { const [a, b] = Array.from(f.children); f.replaceWith(` ${a?.textContent} over ${b?.textContent} `); });
  d.querySelectorAll('sup').forEach((s) => s.replaceWith(s.textContent === '2' ? ' squared ' : s.textContent === '3' ? ' cubed ' : ` to the power ${s.textContent} `));
  d.querySelectorAll('.sqrt').forEach((s) => s.replaceWith(` root ${s.textContent} `));
  return (d.textContent || '').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/[−–]/g, ' minus ').replace(/=/g, ' equals ').replace(/π/g, ' pi ').replace(/√/g, ' root ').replace(/\s+/g, ' ').trim();
}
export function speak(texts: string[], onEach?: (i: number) => void) {
  const synth = window.speechSynthesis; if (!synth) return false;
  synth.cancel();
  const voices = synth.getVoices();
  const voice = voices.find((v) => /en-GB/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
  texts.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t); if (voice) u.voice = voice; u.rate = 0.95; u.onstart = () => onEach?.(i); synth.speak(u); });
  return true;
}
export const stopSpeaking = () => window.speechSynthesis?.cancel();
