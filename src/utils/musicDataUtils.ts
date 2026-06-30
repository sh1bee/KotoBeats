// src/utils/musicDataUtils.ts
import type { Song } from '../types';

// Kiểu Album
export interface Album {
  id: string;        // dùng coverUrl hoặc artist+coverUrl làm id
  coverUrl: string;
  title: string;     // tên hiển thị (artist hoặc tên bài đầu)
  songs: Song[];
}

/**
 * Fisher-Yates Shuffle (xáo trộn mảng ngẫu nhiên)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Chọn ngẫu nhiên `count` bài hát từ mảng, có thể loại trừ các bài đã chọn (qua excludeSet).
 */
export function pickRandomSongs(
  songs: Song[],
  count: number,
  excludeSet?: Set<string>
): Song[] {
  const shuffled = shuffleArray(songs);
  const result: Song[] = [];
  for (const song of shuffled) {
    if (excludeSet && excludeSet.has(song._id)) continue;
    result.push(song);
    if (result.length === count) break;
  }
  return result;
}

/**
 * Nhóm các bài hát thành album dựa trên `coverUrl`.
 * Chỉ giữ lại nhóm có ít nhất 2 bài.
 */
export function groupSongsIntoAlbums(songs: Song[]): Album[] {
  const map = new Map<string, Song[]>();
  
  for (const song of songs) {
    const key = song.coverUrl; // bạn có thể đổi thành `${song.artist}|${song.coverUrl}` nếu muốn chính xác hơn
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(song);
  }

  const albums: Album[] = [];
  for (const [coverUrl, albumSongs] of map.entries()) {
    if (albumSongs.length < 2) continue;
    // Lấy tên album: ưu tiên artist chung, nếu không thì lấy tên bài đầu
    const artist = albumSongs[0].artist || 'Unknown';
    albums.push({
      id: coverUrl,
      coverUrl,
      title: artist,
      songs: albumSongs,
    });
  }
  return albums;
}