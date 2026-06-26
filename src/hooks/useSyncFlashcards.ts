// src/hooks/useSyncFlashcards.ts
import { useEffect } from 'react';
import { useFlashcardStore } from '../store/flashcardStore';
import { subscribeFlashcards } from '../services/flashcardSyncService';

export const useSyncFlashcards = () => {
  const userId = useFlashcardStore((state) => state.userId);
  const setDeck = useFlashcardStore((state) => state.setDeck);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeFlashcards(userId, (cards) => {
      setDeck(cards);
    });
    return () => unsub();
  }, [userId, setDeck]);
};