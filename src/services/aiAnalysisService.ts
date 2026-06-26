import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GROQ_API_KEYS } from './apiKeys';
// ========================
// API KEY XOAY VÒNG
// ========================

const API_KEYS = GROQ_API_KEYS;

let currentKeyIndex = 0;

function getNextKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// ========================
// TYPE DEFINITIONS
// ========================
export interface LineAnalysis {
  fullLine: string;
  translation: string;
  grammarPoints: string[];
  wordBreakdown: {
    word: string;
    reading: string;
    meaningVi: string;
    jlptLevel?: string;
  }[];
  notes: string;
  alignedTranslation?: { ja: string; vi: string }[]; // MỚI
}

// ========================
// CACHING
// ========================
const CACHE_PREFIX = 'groq_analysis_';

function simpleHash(input: string): string {
  // Dùng hash đơn giản, có thể thay bằng md5 nếu cần nhưng không cần quá phức tạp
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `line_${Math.abs(hash)}`;
}

async function getCachedAnalysis(line: string): Promise<LineAnalysis | null> {
  try {
    const key = CACHE_PREFIX + simpleHash(line);
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function saveAnalysisToCache(line: string, analysis: LineAnalysis): Promise<void> {
  try {
    const key = CACHE_PREFIX + simpleHash(line);
    await AsyncStorage.setItem(key, JSON.stringify(analysis));
  } catch (e) {
    console.warn('Failed to cache analysis:', e);
  }
}

// ========================
// CORE FUNCTION
// ========================
export async function analyzeLyricLine(
  line: string,
  selectedWord: string
): Promise<LineAnalysis> {
  // 1. Kiểm tra cache trước
  const cached = await getCachedAnalysis(line);
  if (cached) return cached;

  // 2. Prompt hệ thống và người dùng
  const systemPrompt = `Bạn là một giáo viên tiếng Nhật giàu kinh nghiệm, giúp người học phân tích lời bài hát để học từ vựng và ngữ pháp cho kỳ thi JLPT. Luôn trả lời bằng tiếng Việt.`;

  const userPrompt = `Phân tích dòng lời bài hát sau: "${line}"
Người dùng đã chạm vào từ "${selectedWord}".
Trả về **CHỈ MỘT JSON object** theo cấu trúc:
{
  "fullLine": "dòng gốc",
  "translation": "dịch cả câu sang tiếng Việt tự nhiên",
  "grammarPoints": ["điểm ngữ pháp 1", "điểm ngữ pháp 2"],
  "wordBreakdown": [
    { "word": "...", "reading": "...", "meaningVi": "...", "jlptLevel": "N5" }
  ],
  "notes": "ghi chú về sắc thái, văn hoá, cách dùng",
  "alignedTranslation": [
    { "ja": "こんにちは", "vi": "xin chào" },
    { "ja": "GGと申します", "vi": "tôi tên là GG" }
  ]
}
Hãy chia câu thành các cụm tự nhiên (khoảng 2-5 cụm), mỗi cụm có phần tiếng Nhật và nghĩa tiếng Việt tương ứng. Đảm bảo tổng các cụm ghép lại thành câu đầy đủ.`;

  // 3. Gọi API với xoay vòng key
  let lastError: Error | null = null;
  const maxAttempts = API_KEYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = getNextKey();
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // giảm để output ổn định
          max_completion_tokens: 1024,
          response_format: { type: 'json_object' }, // Yêu cầu trả về JSON
        }),
      });

      // Xử lý lỗi rate limit hoặc unauthorized
      if (response.status === 429 || response.status === 403 || response.status === 401) {
        console.warn(`Groq key ${apiKey.slice(0, 10)}... bị từ chối, thử key khác...`);
        lastError = new Error(`API key bị giới hạn: ${response.status}`);
        continue; // sang key tiếp theo
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Không có nội dung từ Groq');

      // Parse JSON (đôi khi Groq vẫn bọc trong ```json)
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(jsonStr); // 👈 Thêm dòng này

      const analysis: LineAnalysis = {
        fullLine: json.fullLine || line,
        translation: json.translation || '',
        grammarPoints: Array.isArray(json.grammarPoints) ? json.grammarPoints : [],
        wordBreakdown: Array.isArray(json.wordBreakdown) ? json.wordBreakdown : [],
        notes: json.notes || '',
        alignedTranslation: Array.isArray(json.alignedTranslation) ? json.alignedTranslation : [],
      };

      // 4. Lưu cache
      await saveAnalysisToCache(line, analysis);

      return analysis;
    } catch (error) {
      console.error('Groq call error:', error);
      lastError = error as Error;
      if ((error as any)?.status !== 429 && (error as any)?.status !== 403) {
        break; // lỗi không phải do key, dừng thử
      }
    }
  }

  // 5. Nếu tất cả key đều thất bại, ném lỗi cuối cùng
  throw lastError || new Error('Tất cả API key đều không khả dụng');
}