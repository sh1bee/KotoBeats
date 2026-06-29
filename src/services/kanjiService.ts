// src/services/kanjiService.ts

// Import trực tiếp file JSON (Metro sẽ bundle nó)
const kanjiViData = require('../../assets/dictionary/kanji_vi.json');

// Xây dựng map tra cứu nhanh (dạng object)
const kanjiMap: Record<string, any> = {};
for (const key of Object.keys(kanjiViData)) {
  kanjiMap[key] = kanjiViData[key];
}

export interface KanjiInfo {
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  strokes: number;
  jlpt: number | null;
  meaningsVi: string[];
  components?: string[];
}

export function getKanjiInfo(kanji: string): KanjiInfo | null {
  const entry = kanjiMap[kanji];
  if (!entry) return null;
  return {
    kanji: entry.kanji || kanji,
    onyomi: entry.on_readings || [],
    kunyomi: entry.kun_readings || [],
    strokes: entry.stroke_count || 0,
    jlpt: entry.jlpt || null,
    meaningsVi: entry.meanings_vi || entry.meanings || [],
    components: entry.components || [],
  };
}

export function containsKanji(word: string): boolean {
  return /[\u4e00-\u9faf]/.test(word);
}