import type { SRSData } from '../types';

export const calculateNextReview = (quality: number, srs: SRSData): SRSData => {
  let { repetition, interval, easeFactor } = srs;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    repetition,
    interval,
    easeFactor,
    nextReviewDate: nextDate.toISOString(),
  };
};