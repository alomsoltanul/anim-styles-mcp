// Reading-time pacing: how long on-screen text must stay up so an average viewer can read it, in any script.
// Load before paper.js. Speeds: about 3 English words a second, 12 Bangla graphemes a second, 5 kana or kanji a second.
// On top: 0.5 s for the eye to find new text, 0.3 s per number (numbers read slower), a glance per chart label,
// and 0.9 s to take it in before anything moves again. Retention needs both halves: long enough to read, and no longer.
(() => {
  const SEG = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const BANGLA = /[ঀ-৿]/, CJK = /[぀-ヿ㐀-鿿]/;
  const glyphs = s => [...SEG.segment(s)].filter(g => g.segment.trim()).length;
  const nums = s => (s.match(/[০-৯0-9][০-৯0-9,.]*/g) || []).length;
  const P = { WPS: 3, BN_CPS: 12, CJK_CPS: 5, FIND: 0.5, NUM: 0.3, LABEL: 0.2, SETTLE: 0.9, FACT_DELAY: 0.45, MIN: 4.5, MAX: 9.5, glyphs, nums };
  // Seconds to read one line, word by word, so a line that mixes scripts is timed fairly.
  P.seconds = s => s.split(/\s+/).filter(Boolean).reduce((n, w) => n + (BANGLA.test(w) ? glyphs(w) / P.BN_CPS : CJK.test(w) ? glyphs(w) / P.CJK_CPS : 1 / P.WPS), 0);
  P.readTime = (lines, extra = 0) => P.FIND + lines.reduce((n, s) => n + P.seconds(s) + P.NUM * nums(s), 0) + P.SETTLE + extra;
  // One stop: title + unit + fact lines, plus the big number, the fact-line delay and a glance per label under the drawing.
  P.hold = (lines, labels = 0) => Math.min(P.MAX, Math.max(P.MIN, P.readTime(lines, P.NUM + P.FACT_DELAY + P.LABEL * labels)));
  window.PACE = P;
})();
