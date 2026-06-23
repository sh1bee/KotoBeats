import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

import { db } from './config';
import type { Flashcard, Song } from '../../types';

export const fetchSongsFromFirebase = async (): Promise<Song[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'songs'));
    const songs: Song[] = [];
    querySnapshot.forEach((doc) => {
      songs.push(doc.data() as Song);
    });
    return songs;
  } catch (error) {
    console.error('Lỗi khi fetch bài hát:', error);
    return [];
  }
};

export const updateFlashcardSRS = async (userId: string, card: Flashcard) => {
  try {
    const cardRef = doc(db, `users/${userId}/flashcards/${card._id}`);
    await updateDoc(cardRef, {
      srs: card.srs,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật SRS:', error);
  }
};

export const saveNewFlashcard = async (userId: string, card: Flashcard) => {
  try {
    const cardRef = doc(db, `users/${userId}/flashcards/${card._id}`);
    await setDoc(cardRef, card);
  } catch (error) {
    console.error('Lỗi khi tạo flashcard:', error);
  }
};