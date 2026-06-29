// uploadSongs.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Khởi tạo kết nối với Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Thư mục chứa dữ liệu
const SEED_DIR = path.join(__dirname, '_seedData');
const JSON_FILE = path.join(SEED_DIR, 'songs_list.json');

// ==========================================
// HÀM TỰ ĐỘNG CHUYỂN ĐỔI LINK GOOGLE DRIVE
// ==========================================
function optimizeDriveLink(url) {
  if (!url) return url;
  
  // Dò tìm ID file trong link dạng: https://drive.google.com/file/d/ID_FILE/view...
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (match && match[1]) {
    const fileId = match[1];
    // Tự động ghép thành link Direct Streaming kèm confirm=t
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  
  // Nếu link không phải dạng /view của Google Drive (đã chuẩn sẵn hoặc link từ web khác), giữ nguyên
  return url;
}

// ==========================================
// HÀM UPLOAD CHÍNH
// ==========================================
async function uploadData() {
  try {
    const rawData = fs.readFileSync(JSON_FILE, 'utf8');
    const songs = JSON.parse(rawData);
    let successCount = 0;

    for (const song of songs) {
      const lrcFilePath = path.join(SEED_DIR, song.lrcFileName);
      
      if (!fs.existsSync(lrcFilePath)) {
        console.log(`❌ Bỏ qua [${song.title}]: Không tìm thấy file ${song.lrcFileName}`);
        continue;
      }
      
      const lrcContent = fs.readFileSync(lrcFilePath, 'utf8');

      // Tự động tối ưu link Audio và Cover
      const optimizedAudioUrl = optimizeDriveLink(song.audioUrl);
      const optimizedCoverUrl = optimizeDriveLink(song.coverUrl);

      const finalSongData = {
        _id: song._id,
        title: song.title,
        artist: song.artist,
        audioUrl: optimizedAudioUrl,
        coverUrl: optimizedCoverUrl,
        duration: song.duration,
        lrc: lrcContent
      };

      await db.collection('songs').doc(song._id).set(finalSongData, { merge: true });
      console.log(`✅ Upload thành công: ${song.title}`);
      successCount++;
    }

    console.log(`\n🎉 HOÀN TẤT! Đã tự động tối ưu link và đẩy ${successCount}/${songs.length} bài hát lên Firebase.`);
    process.exit(0);
  } catch (error) {
    console.error("Gặp lỗi trong quá trình upload:", error);
    process.exit(1);
  }
}

uploadData();