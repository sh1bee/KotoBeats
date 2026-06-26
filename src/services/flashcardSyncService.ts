import { db } from './firebase/config';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, query, orderBy, updateDoc 
} from 'firebase/firestore';
import type { Flashcard } from '../types';

// Lấy collection flashcards cho userId
const getFlashcardCollection = (userId: string) => 
  collection(db, 'users', userId, 'flashcards');

// Subscribe realtime flashcards từ Firestore
export const subscribeFlashcards = (
  userId: string,
  onUpdate: (cards: Flashcard[]) => void
) => {
  const q = query(getFlashcardCollection(userId), orderBy('word'));
  return onSnapshot(q, (snapshot) => {
    const cards: Flashcard[] = [];
    snapshot.forEach((doc) => {
      cards.push({ _id: doc.id, ...doc.data() } as Flashcard);
    });
    onUpdate(cards);
  });
};

// Thêm một flashcard
export const addFlashcardToFirestore = async (userId: string, card: Flashcard) => {
  await setDoc(doc(getFlashcardCollection(userId), card._id), {
    word: card.word,
    reading: card.reading,
    meaning: card.meaning,
    jlptLevel: card.jlptLevel,
    snippetData: card.snippetData,
    srs: card.srs,
  });
};

// Cập nhật SRS của một flashcard
export const updateFlashcardSRS = async (
  userId: string,
  cardId: string,
  srs: Flashcard['srs']
) => {
  await updateDoc(doc(getFlashcardCollection(userId), cardId), { srs });
};

// Xoá một flashcard (có thể dùng sau này)
export const deleteFlashcard = async (userId: string, cardId: string) => {
  await deleteDoc(doc(getFlashcardCollection(userId), cardId));
};