// src/hooks/useDueCards.ts
import { useMemo } from 'react';
import { useFlashcardStore } from '../store/flashcardStore';

export const useDueCards = () => {
  const deck = useFlashcardStore((state) => state.deck);

  return useMemo(() => {
    const now = new Date();
    return deck.filter((card) => new Date(card.srs.nextReviewDate) <= now);
  }, [deck]);
};