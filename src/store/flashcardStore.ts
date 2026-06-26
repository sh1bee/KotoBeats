import { create } from 'zustand';
import type { Flashcard } from '../types';
import { calculateNextReview } from '../utils/srsEngine';

interface FlashcardState {
  deck: Flashcard[];
  userId: string | null;
  isLoading: boolean;
  
  setUserId: (userId: string | null) => void;
  setDeck: (cards: Flashcard[]) => void;
  processSwipe: (cardId: string, isRemembered: boolean) => void;
  addCard: (card: Flashcard) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  deck: [],
  userId: null,
  isLoading: true,
  
  setUserId: (userId) => set({ userId }),
  
  setDeck: (cards) => set({ deck: cards, isLoading: false }),
  
  processSwipe: (cardId, isRemembered) => {
    const card = get().deck.find((c) => c._id === cardId);
    if (!card) return;
    
    const quality = isRemembered ? 4 : 0;
    const updatedSRS = calculateNextReview(quality, card.srs);
    
    // Ghi Firestore (nếu có userId)
    const userId = get().userId;
    if (userId) {
      import('../services/flashcardSyncService').then(({ updateFlashcardSRS }) => {
        updateFlashcardSRS(userId, cardId, updatedSRS);
      });
    }
    
    // Xoá khỏi deck local (vì đã review)
    set((state) => ({
      deck: state.deck.filter((c) => c._id !== cardId),
    }));
  },
  
  addCard: (card) => {
    const userId = get().userId;
    if (userId) {
      import('../services/flashcardSyncService').then(({ addFlashcardToFirestore }) => {
        addFlashcardToFirestore(userId, card);
      });
    }
    // Local cập nhật ngay (thêm vào deck)
    set((state) => ({ deck: [...state.deck, card] }));
  },
}));