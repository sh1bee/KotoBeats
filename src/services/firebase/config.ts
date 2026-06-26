// src/services/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('--- FIREBASE DEBUG LOG ---');
console.log('1. Kiểm tra file .env:');
console.log('- API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Đã nhận' : '❌ BỊ RỖNG (undefined/null)');
console.log('- PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Đã nhận' : '❌ BỊ RỖNG');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let auth: any;
let db: any;
let storage: any;

try {
  console.log('2. Đang khởi tạo initializeApp...');
  app = initializeApp(firebaseConfig);
  console.log('✅ initializeApp thành công');

  console.log('3. Đang khởi tạo initializeAuth...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ initializeAuth thành công');

  console.log('4. Đang lấy Firestore và Storage...');
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('✅ Khởi tạo toàn bộ Firebase thành công!');
  
} catch (error: any) {
  console.error('❌ [Lỗi Khởi Tạo Firebase]:', error.message);
}

// Export ra để các file khác dùng (dù bị lỗi thì nó vẫn export undefined/null thay vì làm crash app)
export { auth, db, storage };