import { collection, query, where, getDocs, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

import { db } from './config';
import type { Flashcard, Song } from '../../types';
import { MOCK_SONG } from '../../data/mockSong';

let songsCache: Song[] | null = null;
const SONGS_COLLECTION = 'songs';

export const fetchSongsFromFirebase = async (useCache: boolean = true): Promise<Song[]> => {
  if (useCache && songsCache) {
    return songsCache;
  }

  try {
    const querySnapshot = await getDocs(collection(db, SONGS_COLLECTION));
    const songs: Song[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Song;
      songs.push({ ...data, _id: doc.id });
    });

    if (songs.length === 0) {
      console.warn('[dbService] No songs in Firebase, using mock data');
      songsCache = [MOCK_SONG];
    } else {
      songsCache = songs;
    }

    return songsCache;
  } catch (error) {
    console.error('Lỗi khi fetch bài hát:', error);
    songsCache = [MOCK_SONG];
    return songsCache;
  }
};

export const fetchFlashcardsForUser = async (userId: string): Promise<Flashcard[]> => {
  try {
    const q = query(collection(db, `users/${userId}/flashcards`));
    const querySnapshot = await getDocs(q);
    const cards: Flashcard[] = [];
    querySnapshot.forEach((doc) => {
      cards.push(doc.data() as Flashcard);
    });
    return cards;
  } catch (error) {
    console.error('Lỗi khi fetch flashcards:', error);
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

export const clearSongsCache = () => {
  songsCache = null;
};