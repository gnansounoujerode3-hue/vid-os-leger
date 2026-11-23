// Passage du temps du rush (secondes) au temps de la vidéo montée (images).
// Claude écrit tout en secondes du rush ; ces fonctions recalent après les coupes.

import type { Montage, Mot } from "./types";

export type Segment = {
  srcStart: number; // image du rush, incluse
  srcEnd: number; // image du rush, exclue
  outStart: number; // image dans la vidéo montée
};

export type Fenetre = { from: number; to: number; force: number };

export const construireSegments = (m: Montage): Segment[] => {
  const segs: Segment[] = [];
  let out = 0;
  for (const [a, b] of m.segments) {
    const srcStart = Math.max(0, Math.round(a * m.fps));
    const srcEnd = Math.min(Math.round(m.dureeRushS * m.fps), Math.round(b * m.fps));
    if (srcEnd - srcStart < 2) continue;
    segs.push({ srcStart, srcEnd, outStart: out });
    out += srcEnd - srcStart;
  }
  return segs;
};

export const dureeTotale = (segs: Segment[]) => {
  const last = segs[segs.length - 1];
  return last ? last.outStart + (last.srcEnd - last.srcStart) : 1;
};

/** Image de sortie d'un instant du rush. Un instant coupé glisse au début
 *  de la partie gardée suivante. */
export const versSortie = (segs: Segment[], tSrc: number, fps: number): number => {
  const f = tSrc * fps;
  for (const s of segs) {
    if (f < s.srcStart) return s.outStart;
    if (f < s.srcEnd) return s.outStart + Math.round(f - s.srcStart);
  }
  return dureeTotale(segs);
};

/** Vrai si l'instant du rush est gardé au montage. */
export const estGarde = (segs: Segment[], tSrc: number, fps: number) => {
  const f = tSrc * fps;
  return segs.some((s) => f >= s.srcStart && f < s.srcEnd);
};

export type MotSortie = { t: string; startMs: number; endMs: number };

/** Les mots dits, en millisecondes de la vidéo montée. Un mot coupé disparaît. */
export const motsEnSortie = (segs: Segment[], mots: Mot[], fps: number): MotSortie[] => {
  const res: MotSortie[] = [];
  for (const w of mots) {
    const milieu = (w.debut + w.fin) / 2;
    if (!estGarde(segs, milieu, fps)) continue;
    const a = versSortie(segs, w.debut, fps);
    const b = Math.max(a + 1, versSortie(segs, w.fin, fps));
    res.push({ t: w.t, startMs: (a / fps) * 1000, endMs: (b / fps) * 1000 });
  }
  return res;
};

/** Cycle de zooms : zoom avant 4 s, plan large 10 à 16 s, et ainsi de suite.
 *  Le zoom avant tombe sur le début d'un mot. */
export const cycleDeZooms = (
  mots: MotSortie[],
  fps: number,
  total: number,
  eviter: Array<[number, number]>,
): Fenetre[] => {
  const debuts = mots.map((w) => Math.round((w.startMs / 1000) * fps));
  const larges = [12, 16, 10, 14];
  const res: Fenetre[] = [];
  let cible = Math.round(3 * fps);
  let k = 0;
  while (cible < total - 5 * fps) {
    const proche = debuts.find((d) => d >= cible && d <= cible + fps) ?? cible;
    const from = proche;
    const to = from + 4 * fps;
    const libre = !eviter.some(([a, b]) => from < b && to > a);
    if (libre && to < total - fps) {
      res.push({ from, to, force: 0.18 });
      cible = to + larges[k % larges.length] * fps;
      k++;
    } else {
      cible += fps;
    }
  }
  return res;
};
