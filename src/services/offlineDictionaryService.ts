import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

let dictionaryData: any[] | null = null;

export async function loadDictionary(): Promise<void> {
  if (dictionaryData) return;
  try {
    const asset = Asset.fromModule(require('../../assets/dictionary/jmdict-eng-common-3.6.2.json'));
    await asset.downloadAsync();
    const content = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
    const json = JSON.parse(content);
    dictionaryData = json.words ?? json; // tùy cấu trúc file
    console.log('📚 Dictionary loaded:', dictionaryData.length, 'entries');
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    dictionaryData = [];
  }
}

export async function searchOffline(keyword: string) {
  await loadDictionary();
  if (!dictionaryData) return null;
  const results = dictionaryData.filter((entry: any) => {
    const kanjiList = (entry.kanji || []).map((k: any) => k.text || k);
    const kanaList = (entry.kana || []).map((k: any) => k.text || k);
    const allTexts = [...kanjiList, ...kanaList];
    return allTexts.some((text: string) => text === keyword || text.includes(keyword));
  });
  return results[0] || null;
}