import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './firebase';
import { unsubscribeAllListeners } from './listenerService';

export function subscribeAuth(
  callback: (user: User | null) => void,
): ReturnType<typeof onAuthStateChanged> {
  return onAuthStateChanged(auth, callback);
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await set(ref(db, `users/${credential.user.uid}`), {
    name,
    email,
    online: true,
    lastSeen: Date.now(),
  });
}

export function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  unsubscribeAllListeners();
  await signOut(auth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Sai tài khoản hoặc mật khẩu';
    case 'auth/email-already-in-use':
      return 'Email đã được sử dụng';
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/weak-password':
      return 'Mật khẩu tối thiểu 6 ký tự';
    case 'auth/network-request-failed':
      return 'Lỗi mạng';
    default:
      return 'Đã có lỗi xảy ra';
  }
}
