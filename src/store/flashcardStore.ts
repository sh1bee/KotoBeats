import { create } from 'zustand';

import type { Flashcard } from '../types';

import { calculateNextReview } from '../utils/srsEngine';

interface FlashcardState {
  deck: Flashcard[];
  setDeck: (cards: Flashcard[]) => void;
  processSwipe: (cardId: string, isRemembered: boolean) => void;
}

export const useFlashcardStore = create<FlashcardState>((set) => ({
  deck: [],
  setDeck: (cards) => set({ deck: cards }),
  processSwipe: (cardId, isRemembered) =>
    set((state) => {
      const cardIndex = state.deck.findIndex((c) => c._id === cardId);
      if (cardIndex === -1) return state;

      const card = state.deck[cardIndex];
      const quality = isRemembered ? 4 : 0;

      const updatedSRS = calculateNextReview(quality, card.srs);
      console.log(`[SRS] Cập nhật ${card.word}: Hẹn ngày ${updatedSRS.nextReviewDate}`);

      const newDeck = [...state.deck];
      newDeck.splice(cardIndex, 1);

      return { deck: newDeck };
    }),
}));