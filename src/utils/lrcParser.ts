// src/utils/lrcParser.ts
import type { LyricLine, LyricToken } from '../types';

const LRC_TIMESTAMP_REGEX = /^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/;
const JAPANESE_PARTICLE_REGEX = /([はがをにへでとものよりからまでってよな])/g;
const TOKEN_CLEANUP_REGEX = /^[、。！？…,.!?]+|[、。！？…,.!?]+$/g;

export const parseLrcText = (text: string): LyricLine[] => {
  const lines = text.split('\n');
  const result: LyricLine[] = [];
  
  // Dùng map để lưu tạm các dòng theo timestamp
  const map: { [key: number]: LyricLine } = {};

  lines.forEach((line) => {
    // Regex lấy thời gian và nội dung
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (!match) return;

    const [_, min, sec, ms, content] = match;
    const time = parseInt(min) * 60 + parseInt(sec) + parseInt(ms) / 1000;
    const textContent = content.trim();

    if (map[time]) {
      // Nếu đã có thời gian này rồi, thì đây là dòng dịch (Translation)
      map[time].translation = textContent;
    } else {
      // Nếu chưa có, tạo dòng mới (Text Nhật)
      const tokens = tokenizeLyricText(textContent);
      map[time] = {
        lineId: `line_${time}`,
        startTime: time,
        endTime: time + 5, // Tạm thời để mặc định, logic này bạn có thể tối ưu sau
        text: textContent,
        tokens,
        translation: '' 
      };
    }
  });

  // Tính endTime dựa trên dòng tiếp theo
  const sortedTimes = Object.keys(map).map(Number).sort((a, b) => a - b);
  sortedTimes.forEach((time, idx) => {
    if (idx < sortedTimes.length - 1) {
      map[time].endTime = sortedTimes[idx + 1];
    }
  });

  return Object.values(map).sort((a, b) => a.startTime - b.startTime);
};

const tokenizeLyricText = (text: string): LyricToken[] => {
  const cleanedText = text.trim().replace(TOKEN_CLEANUP_REGEX, '');

  if (!cleanedText) {
    return [];
  }

  if (/\s/.test(cleanedText)) {
    return cleanedText
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => createToken(word));
  }

  const tokens: string[] = [];
  let lastIndex = 0;

  cleanedText.replace(JAPANESE_PARTICLE_REGEX, (particle, _particleCapture, offset) => {
    if (offset > lastIndex) {
      tokens.push(cleanedText.slice(lastIndex, offset));
    }
    tokens.push(particle);
    lastIndex = offset + particle.length;
    return particle;
  });

  if (lastIndex < cleanedText.length) {
    tokens.push(cleanedText.slice(lastIndex));
  }

  return tokens
    .filter(Boolean)
    .map((word) => createToken(word));
};

const createToken = (word: string): LyricToken => ({
  word,
  base: word,
  romaji: '',
});
