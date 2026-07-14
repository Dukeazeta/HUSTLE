import type { PitchVariantLabel } from "./constants";
import type { PitchStyleSignals } from "./pitch-generation";

export type PitchLearningSample = {
  label: PitchVariantLabel;
  originalBody: string;
  finalBody: string;
  feedback: "up" | "down" | null;
};

const emptySignals: PitchStyleSignals = {
  sampleSize: 0,
  preferredVariant: null,
  averageFinalLength: null,
  averageParagraphCount: null,
  prefersNamedGreeting: null,
  averageEditRatio: null,
  positiveFeedbackRate: null,
};

export function aggregatePitchStyleSignals(
  samples: PitchLearningSample[],
): PitchStyleSignals {
  if (!samples.length) return emptySignals;

  const variantCounts = new Map<PitchVariantLabel, number>();
  let totalLength = 0;
  let totalParagraphs = 0;
  let namedGreetings = 0;
  let totalEditRatio = 0;
  let positive = 0;
  let rated = 0;

  for (const sample of samples) {
    variantCounts.set(sample.label, (variantCounts.get(sample.label) ?? 0) + 1);
    totalLength += sample.finalBody.length;
    totalParagraphs += sample.finalBody
      .split(/\n\s*\n/)
      .filter((paragraph) => paragraph.trim()).length;
    if (/^hi\s+[A-Z][\p{L}'-]+[,!]/iu.test(sample.finalBody.trim()))
      namedGreetings++;
    totalEditRatio += editRatio(sample.originalBody, sample.finalBody);
    if (sample.feedback) {
      rated++;
      if (sample.feedback === "up") positive++;
    }
  }

  const preferredVariant = [...variantCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0];

  return {
    sampleSize: samples.length,
    preferredVariant: preferredVariant ?? null,
    averageFinalLength: Math.round(totalLength / samples.length),
    averageParagraphCount:
      Math.round((totalParagraphs / samples.length) * 10) / 10,
    prefersNamedGreeting: namedGreetings > samples.length / 2,
    averageEditRatio:
      Math.round((totalEditRatio / samples.length) * 100) / 100,
    positiveFeedbackRate: rated
      ? Math.round((positive / rated) * 100) / 100
      : null,
  };
}

function editRatio(original: string, final: string) {
  const baseline = Math.max(original.length, final.length, 1);
  const sharedPrefix = [...original].findIndex(
    (character, index) => character !== final[index],
  );
  const prefixLength = sharedPrefix === -1 ? Math.min(original.length, final.length) : sharedPrefix;
  const lengthDifference = Math.abs(original.length - final.length);
  return Math.min(1, (baseline - prefixLength + lengthDifference) / baseline);
}
