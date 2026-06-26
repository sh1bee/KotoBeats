// src/services/jishoService.ts
export interface JishoResult {
  slug: string;
  japanese: { word?: string; reading?: string }[];
  senses: { english_definitions: string[] }[];
}

export const fetchJishoDefinition = async (keyword: string): Promise<JishoResult | null> => {
  try {
    const targetUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
    const isWeb = typeof window !== 'undefined';
    const finalUrl = isWeb
      ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
      : targetUrl;

    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
        'Referer': 'https://jisho.org/',
        'Origin': 'https://jisho.org',
      },
    });

    const json = await response.json();

    if (json.data && json.data.length > 0) {
      return json.data[0];
    }

    return null;
  } catch (error) {
    console.error('Jisho API Error:', error);
    return null;
  }
};
