export const CORE_TRAITS = ["aggression","caution","cooperation","patience","risk","focus"] as const;
export type CoreTrait = typeof CORE_TRAITS[number];
export type Traits = Record<CoreTrait, number> & Record<string, number>;
export interface Personality { id: string; name: string; archetype: string; traits: Traits; randomness: number; notes?: string; }
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export function validate(p: Personality): string[] {
  const errs: string[] = [];
  if (!p.id) errs.push("id required");
  for (const t of CORE_TRAITS) if (typeof p.traits?.[t] !== "number") errs.push(`trait ${t} missing`);
  for (const [k, v] of Object.entries(p.traits ?? {})) if (v < 0 || v > 1) errs.push(`trait ${k} out of range`);
  if (p.randomness < 0 || p.randomness > 1) errs.push("randomness out of range");
  return errs;
}
export function normalize(p: Personality): Personality {
  const traits = Object.fromEntries(Object.entries(p.traits).map(([k, v]) => [k, clamp01(v)])) as Traits;
  return { ...p, traits, randomness: clamp01(p.randomness) };
}
const mk = (id: string, name: string, archetype: string, t: Partial<Traits>, randomness = 0.15): Personality => ({
  id, name, archetype, randomness,
  traits: { aggression: .5, caution: .5, cooperation: .5, patience: .5, risk: .5, focus: .5, ...t },
});
export const ARCHETYPES: Record<string, Personality> = {
  attacker:    mk("attacker", "Attacker", "attacker", { aggression: .9, caution: .2, risk: .8, patience: .2 }),
  defender:    mk("defender", "Defender", "defender", { aggression: .2, caution: .9, risk: .2, patience: .8 }),
  opportunist: mk("opportunist", "Opportunist", "opportunist", { aggression: .6, caution: .4, risk: .7, focus: .8 }),
  teamplayer:  mk("teamplayer", "Team Player", "teamplayer", { cooperation: .95, aggression: .4, focus: .6 }),
  wildcard:    mk("wildcard", "Wildcard", "wildcard", { risk: .9, focus: .3 }, 0.6),
};

