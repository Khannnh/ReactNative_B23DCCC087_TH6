import { onValue, ref } from 'firebase/database';
import type { UserRecord } from '../types';
import { db } from './firebase';
import { trackListener } from './listenerService';

type ListenerErrorCallback = (error: Error) => void;

function reportListenerError(
  error: Error,
  onError: ListenerErrorCallback | undefined,
  message: string,
): void {
  if (onError) {
    onError(error);
    return;
  }
  console.error(message, error);
}

function parseUser(uid: string, value: unknown): UserRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (
    typeof data.name !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.online !== 'boolean' ||
    typeof data.lastSeen !== 'number'
  ) {
    return null;
  }

  return {
    uid,
    name: data.name,
    email: data.email,
    online: data.online,
    lastSeen: data.lastSeen,
  };
}

export function subscribeUsers(
  myUid: string,
  callback: (users: UserRecord[]) => void,
  onError?: ListenerErrorCallback,
): ReturnType<typeof onValue> {
  return trackListener(
    onValue(
      ref(db, 'users'),
      snapshot => {
        const value: unknown = snapshot.val();
        if (value === null) {
          callback([]);
          return;
        }
        if (typeof value !== 'object') {
          reportListenerError(
            new Error('Dữ liệu danh bạ không hợp lệ.'),
            onError,
            'Dữ liệu danh bạ không hợp lệ:',
          );
          return;
        }

        const users: UserRecord[] = [];
        Object.entries(value as Record<string, unknown>).forEach(([uid, userValue]) => {
          if (uid === myUid) {
            return;
          }
          const user = parseUser(uid, userValue);
          if (user) {
            users.push(user);
          } else {
            console.warn(`Bỏ qua hồ sơ người dùng không hợp lệ: ${uid}`);
          }
        });
        callback(users);
      },
      error => {
        reportListenerError(error, onError, 'Không thể tải danh bạ:');
      },
    ),
  );
}

export function subscribeUser(
  uid: string,
  callback: (user: UserRecord | null) => void,
  onError?: ListenerErrorCallback,
): ReturnType<typeof onValue> {
  return trackListener(
    onValue(
      ref(db, `users/${uid}`),
      snapshot => {
        const value: unknown = snapshot.val();
        if (value === null) {
          callback(null);
          return;
        }
        const user = parseUser(uid, value);
        if (user) {
          callback(user);
        } else {
          reportListenerError(
            new Error('Dữ liệu người dùng không hợp lệ.'),
            onError,
            `Dữ liệu người dùng không hợp lệ: ${uid}`,
          );
        }
      },
      error => {
        reportListenerError(error, onError, `Không thể tải người dùng ${uid}:`);
      },
    ),
  );
}
