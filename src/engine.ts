import type { Personality } from "./personality.js";
import { Rng } from "./rng.js";
export interface Candidate<A> { action: A; considerations: Record<string, number>; base?: number; }
export interface Decision<A> { action: A; scores: { action: A; score: number; p: number }[] }
export type Decide<S, A> = (state: S, personality: Personality, rng: Rng) => A;
export function utilityDecide<A>(cands: Candidate<A>[], personality: Personality, rng: Rng, inertiaBonus?: (a: A) => number): Decision<A> {
  if (cands.length === 0) throw new Error("no candidates");
  const scored = cands.map(c => {
    let s = c.base ?? 0;
    for (const [k, v] of Object.entries(c.considerations)) s += (personality.traits[k] ?? 0.5) * v;
    if (inertiaBonus) s += inertiaBonus(c.action);
    return { action: c.action, score: s };
  });
  const T = 0.02 + personality.randomness * 1.5;
  const max = Math.max(...scored.map(x => x.score));
  const w = scored.map(x => Math.exp((x.score - max) / T));
  const Z = w.reduce((a, b) => a + b, 0);
  const ps = w.map(x => x / Z);
  let r = rng.next(), i = 0;
  while (i < ps.length - 1 && (r -= ps[i]) > 0) i++;
  return { action: scored[i].action, scores: scored.map((x, j) => ({ ...x, p: ps[j] })) };
}

