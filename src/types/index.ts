// src/types/index.ts
export interface LyricToken {
  word: string;
  base: string;
  romaji: string;
}

export interface LyricLine {
  lineId: string;
  startTime: number;
  endTime: number;
  text: string;      // Tiếng Nhật
  translation?: string; // Tiếng Việt (Thêm trường này)
  tokens: LyricToken[];
}

export interface Song {
  _id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  lyrics?: LyricLine[];
  lrc?: string;
  lrcUrl?: string;
}

export interface SnippetData {
  songId: string;
  startTime: number;
  endTime: number;
  contextSentence: string;
}

export interface SRSData {
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
}

export interface Flashcard {
  _id: string;
  word: string;
  reading: string;
  meaning: string;
  jlptLevel: string;
  snippetData: SnippetData;
  srs: SRSData;
}
