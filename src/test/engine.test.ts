import { test } from "node:test";
import assert from "node:assert/strict";
import { ARCHETYPES, type Personality } from "../personality.js";
import { utilityDecide, type Candidate } from "../engine.js";
import { Rng } from "../rng.js";
import { validate } from "../personality.js";

test("all ARCHETYPES validate cleanly", () => {
  for (const [id, p] of Object.entries(ARCHETYPES)) {
    const errs = validate(p);
    assert.deepEqual(errs, [], `archetype ${id} should validate with no errors, got: ${errs.join(", ")}`);
  }
});

type Action = "aggressive" | "passive";

function candidates(): Candidate<Action>[] {
  return [
    { action: "aggressive", considerations: { aggression: 1, caution: -1 } },
    { action: "passive", considerations: { caution: 1, aggression: -1 } },
  ];
}

function countAggressive(personality: Personality, trials: number, seed: number): number {
  const rng = new Rng(seed);
  let count = 0;
  for (let i = 0; i < trials; i++) {
    const decision = utilityDecide(candidates(), personality, rng);
    if (decision.action === "aggressive") count++;
  }
  return count;
}

test("attacker archetype picks aggressive action far more often than defender", () => {
  const trials = 500;
  const attackerCount = countAggressive(ARCHETYPES.attacker, trials, 1);
  const defenderCount = countAggressive(ARCHETYPES.defender, trials, 1);

  assert.ok(
    attackerCount > defenderCount * 3,
    `expected attacker (${attackerCount}/${trials}) to pick aggressive far more often than defender (${defenderCount}/${trials})`
  );
  assert.ok(attackerCount > trials * 0.8, `expected attacker to pick aggressive most of the time, got ${attackerCount}/${trials}`);
  assert.ok(defenderCount < trials * 0.2, `expected defender to rarely pick aggressive, got ${defenderCount}/${trials}`);
});

test("high randomness flattens the probability distribution", () => {
  const base: Personality = {
    id: "test-low",
    name: "Low Randomness",
    archetype: "test",
    randomness: 0.0,
    traits: { aggression: .9, caution: .1, cooperation: .5, patience: .5, risk: .5, focus: .5 },
  };
  const high: Personality = { ...base, id: "test-high", name: "High Randomness", randomness: 1.0 };

  const rng = new Rng(42);
  const lowDecision = utilityDecide(candidates(), base, rng);
  const highDecision = utilityDecide(candidates(), high, rng);

  const lowMaxP = Math.max(...lowDecision.scores.map(s => s.p));
  const highMaxP = Math.max(...highDecision.scores.map(s => s.p));

  assert.ok(
    highMaxP < lowMaxP,
    `expected high-randomness max probability (${highMaxP}) to be lower (flatter) than low-randomness max probability (${lowMaxP})`
  );

  const lowSpread = Math.max(...lowDecision.scores.map(s => s.p)) - Math.min(...lowDecision.scores.map(s => s.p));
  const highSpread = Math.max(...highDecision.scores.map(s => s.p)) - Math.min(...highDecision.scores.map(s => s.p));
  assert.ok(
    highSpread < lowSpread,
    `expected high-randomness spread (${highSpread}) to be smaller than low-randomness spread (${lowSpread})`
  );
});
