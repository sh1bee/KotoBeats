import type { Song } from '../types';

export const MOCK_SONGS: Song[] = [
  {
    _id: 'song_001',
    title: 'Yume to Hazakura',
    artist: 'Hatsune Miku',
    coverUrl: 'https://picsum.photos/seed/kotobeat1/512/512',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 255,
    lyrics: [
      {
        lineId: 'L01',
        startTime: 70,
        endTime: 72.5,
        text: '白き御手に夢とひざくら',
        translation: 'Trong đôi tay trắng, giấc mơ và hoa sakura lá',
        tokens: [
          { word: '白き', base: '白い', romaji: 'shiroki' },
          { word: '御手', base: '御手', romaji: 'mite' },
          { word: 'に', base: 'に', romaji: 'ni' },
          { word: '夢', base: '夢', romaji: 'yume' },
          { word: 'と', base: 'と', romaji: 'to' },
          { word: 'ひざくら', base: '葉桜', romaji: 'hazakura' },
        ],
      },
      {
        lineId: 'L02',
        startTime: 72.5,
        endTime: 77.0,
        text: '白き御手に夢と葉桜',
        translation: 'Nâng nụ cười lên giữa bầu trời',
        tokens: [
          { word: '白き', base: '白い', romaji: 'shiroki' },
          { word: '御手', base: '御手', romaji: 'mite' },
          { word: 'に', base: 'に', romaji: 'ni' },
          { word: '夢', base: '夢', romaji: 'yume' },
          { word: 'と', base: 'と', romaji: 'to' },
          { word: 'はざくら', base: '葉桜', romaji: 'hazakura' },
        ],
      },
    ],
  },
  {
    _id: 'song_002',
    title: '青春コンプレックス',
    artist: 'Kessoku Band',
    coverUrl: 'https://picsum.photos/seed/kotobeat2/512/512',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 204,
    lyrics: [
      {
        lineId: 'L01',
        startTime: 0,
        endTime: 4,
        text: '青春コンプレックス',
        translation: 'Lo âu tuổi xuân',
        tokens: [
          { word: '青春', base: '青春', romaji: 'seishun' },
          { word: 'コンプレックス', base: 'コンプレックス', romaji: 'konpurekkusu' },
        ],
      },
    ],
  },
];

export const MOCK_SONG = MOCK_SONGS[0];