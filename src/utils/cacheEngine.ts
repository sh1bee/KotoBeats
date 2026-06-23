import * as FileSystem from 'expo-file-system/legacy';

const AUDIO_CACHE_EXTENSION = '.mp3';
const inflightDownloads = new Map<string, Promise<string>>();

function getSafeFileName(songId: string): string {
  const safeSongId = songId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeSongId || 'unknown'}${AUDIO_CACHE_EXTENSION}`;
}

export const getCachedAudioPath = async (
  songId: string,
  remoteAudioUrl: string,
): Promise<string> => {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error('Document directory is unavailable.');
  }

  const localUri = `${documentDirectory}${getSafeFileName(songId)}`;
  const existingDownload = inflightDownloads.get(songId);

  if (existingDownload) {
    return existingDownload;
  }

  const downloadPromise = (async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      if (fileInfo.exists) {
        console.log(`[CacheEngine] Bản ghi đã có ở local: ${localUri}`);
        return localUri;
      }

      console.log('[CacheEngine] Đang tải audio về thiết bị...');
      const downloadRes = await FileSystem.downloadAsync(remoteAudioUrl, localUri);

      if (downloadRes.status != null && downloadRes.status >= 400) {
        throw new Error(
          `[CacheEngine] Download failed with status ${downloadRes.status}`,
        );
      }

      console.log(`[CacheEngine] Tải hoàn tất: ${downloadRes.uri}`);
      return downloadRes.uri || localUri;
    } catch (error) {
      console.error('[CacheEngine] Lỗi khi xử lý cache:', error);
      return remoteAudioUrl;
    } finally {
      inflightDownloads.delete(songId);
    }
  })();

  inflightDownloads.set(songId, downloadPromise);
  return downloadPromise;
};
