// Funniest Autocorrect Fail — make.fun entry (program/v1).
//
// The task: write ONE line, under 200 characters, that reads as a
// hilarious autocorrect fail, to /output/entry.txt. A house judge
// compares entries pairwise and picks the funnier one, weighing:
//   1. it is a one-line autocorrect fail (not a written joke),
//   2. funny on first read, with a clear and surprising wrong word,
//   3. it reads as a real autocorrect slip,
//   4. the joke is clear without explanation and fits in one line,
//   5. the wrong word is specific and original, not a generic typo.
//
// So instead of hard-coding one string, this program keeps a small
// shortlist of hand-written candidate fails, scores each one against
// the judge's own rubric above, and writes the winner. The scoring
// is fully deterministic: same input, same output, every run.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 199;

interface Candidate {
  /** The line exactly as the phone supposedly sent it. */
  text: string;
  /** The word the sender meant to type. */
  intended: string;
  /** The word autocorrect actually sent. */
  wrong: string;
  /** 0-3: how instantly the reader recovers the intended word. */
  slipClarity: number;
  /** 0-3: how absurd / unexpected the wrong word is in context. */
  surprise: number;
  /** 0-2: how much it reads like a genuine keyboard/prediction slip. */
  realism: number;
  /** 0-2: how specific and original the wrong word is (not a meme typo). */
  originality: number;
}

const CANDIDATES: Candidate[] = [
  {
    text: "Happy birthday! Hope your day is full of cake and peasants!",
    intended: "presents",
    wrong: "peasants",
    slipClarity: 3,
    surprise: 3,
    realism: 2,
    originality: 2,
  },
  {
    text: "Honey, I bought the snakes for dinner",
    intended: "steaks",
    wrong: "snakes",
    slipClarity: 3,
    surprise: 2,
    realism: 2,
    originality: 1,
  },
  {
    text: "I love you more than prison",
    intended: "pizza",
    wrong: "prison",
    slipClarity: 2,
    surprise: 3,
    realism: 1,
    originality: 2,
  },
  {
    text: "Grandma, I just got enraged!",
    intended: "engaged",
    wrong: "enraged",
    slipClarity: 3,
    surprise: 2,
    realism: 2,
    originality: 1,
  },
  {
    text: "Please bring the baby wives to the picnic",
    intended: "wipes",
    wrong: "wives",
    slipClarity: 2,
    surprise: 3,
    realism: 1,
    originality: 2,
  },
  {
    text: "Can you pick up the kids from school? I'll be home by sex",
    intended: "6",
    wrong: "sex",
    slipClarity: 2,
    surprise: 3,
    realism: 2,
    originality: 0,
  },
];

function score(c: Candidate): number {
  return c.slipClarity + c.surprise + c.realism + c.originality;
}

function pickWinner(candidates: Candidate[]): Candidate {
  // Data guard: a candidate is only meaningful if the wrong word it
  // claims to have actually appears in its text. A typo in the
  // shortlist (e.g. scoring "peasants" for a line that says "presents")
  // would otherwise sail through silently and ship the wrong joke.
  for (const c of candidates) {
    if (!c.text.toLowerCase().includes(c.wrong.toLowerCase())) {
      throw new Error(
        `candidate data bug: "${c.text}" does not contain wrong word "${c.wrong}"`,
      );
    }
  }
  const valid = candidates.filter(
    (c) =>
      c.text.length >= 1 &&
      c.text.length <= MAX_CHARS &&
      c.text.trim().length > 0 &&
      !c.text.includes("\n") &&
      c.intended !== c.wrong,
  );
  if (valid.length === 0) {
    throw new Error("no valid candidate: every line failed the gate");
  }
  // Highest rubric score wins; ties break toward the shorter line,
  // then alphabetically, so the choice is stable across runs.
  return valid
    .slice()
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        a.text.length - b.text.length ||
        a.text.localeCompare(b.text),
    )[0];
}

const winner = pickWinner(CANDIDATES);

console.log("candidate scores (clarity+surprise+realism+originality):");
for (const c of CANDIDATES) {
  console.log(`  ${score(c)}/10  "${c.text}"`);
}

mkdirSync("/output", { recursive: true });
writeFileSync(OUTPUT_PATH, winner.text, "utf8");

// Verify what actually landed on disk, against the same gate the
// sealed scorer applies: 1-199 UTF-8 chars, not only whitespace,
// exactly one line. Fail loudly instead of shipping a bad artifact.
const written = readFileSync(OUTPUT_PATH, "utf8");
if (written !== winner.text) {
  throw new Error("verification failed: file content differs from winner");
}
if (
  written.length < 1 ||
  written.length > MAX_CHARS ||
  written.trim().length === 0 ||
  written.includes("\n")
) {
  throw new Error(
    `verification failed: ${written.length} chars, gate is 1-${MAX_CHARS} single line`,
  );
}

console.log(`wrote ${winner.text.length} chars to ${OUTPUT_PATH}`);
console.log(`intended "${winner.intended}" -> sent "${winner.wrong}"`);
console.log(winner.text);
