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

    // FIXED: Thêm User-Agent header để tránh lỗi 403 Forbidden từ Cloudflare
    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KotoBeatsApp/1.0',
      },
    });
    if (!response.ok) {
      throw new Error(`Jisho API request failed with status ${response.status}`);
    }

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
