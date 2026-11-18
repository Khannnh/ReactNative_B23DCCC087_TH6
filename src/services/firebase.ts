import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence , Auth} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyANkfr1fgkg5HwR-VhH9FuIYb25aeFlDNQ",
  authDomain: "chatty-1b937.firebaseapp.com",
  projectId: "chatty-1b937",
  storageBucket: "chatty-1b937.firebasestorage.app",
  databaseURL: "https://chatty-1b937-default-rtdb.asia-southeast1.firebasedatabase.app",
  messagingSenderId: "30368837033",
  appId: "1:30368837033:web:9ec699914796c88dffe8b8",
  measurementId: "G-R45EKG2FQ0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Giữ đăng nhập sau khi tắt app; try/catch để tránh lỗi khi Fast Refresh khởi tạo lại
let auth :Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { app, auth };
export const db = getDatabase(app);