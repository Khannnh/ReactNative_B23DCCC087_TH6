import { onDisconnect, onValue, ref, update } from 'firebase/database';
import { db } from './firebase';
import { trackListener } from './listenerService';

export function startPresence(uid: string): ReturnType<typeof onValue> {
  const connectedRef = ref(db, '.info/connected');
  const userRef = ref(db, `users/${uid}`);

  return trackListener(
    onValue(
      connectedRef,
      async snapshot => {
        if (snapshot.val() !== true) {
          return;
        }

        try {
          await onDisconnect(userRef).update({ online: false, lastSeen: Date.now() });
          await update(userRef, { online: true });
        } catch (error) {
          console.error('Không thể cập nhật trạng thái trực tuyến:', error);
        }
      },
      error => {
        console.error('Không thể theo dõi kết nối Firebase:', error);
      },
    ),
  );
}

export function setOffline(uid: string): Promise<void> {
  return update(ref(db, `users/${uid}`), {
    online: false,
    lastSeen: Date.now(),
  });
}
