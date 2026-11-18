import {
  get,
  increment,
  onChildAdded,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  update,
} from 'firebase/database';
import type { ChatMessage, ConversationSummary } from '../types';
import { db } from './firebase';
import { trackListener } from './listenerService';

type MessageErrorCallback = (error: Error) => void;

export function getChatId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export function subscribeConversations(
  myUid: string,
  callback: (conversations: ConversationSummary[]) => void,
  onError?: MessageErrorCallback,
): ReturnType<typeof onValue> {
  return trackListener(
    onValue(
      ref(db, `userChats/${myUid}`),
      snapshot => {
        const value: unknown = snapshot.val();
        if (value === null) {
          callback([]);
          return;
        }
        if (typeof value !== 'object') {
          const error = new Error('Dữ liệu cuộc trò chuyện không hợp lệ.');
          if (onError) {
            onError(error);
          } else {
            console.error('Dữ liệu cuộc trò chuyện không hợp lệ:', error);
          }
          return;
        }

        const conversations = Object.entries(value as Record<string, unknown>)
          .flatMap(([otherUid, row]) => {
            if (typeof row !== 'object' || row === null) {
              return [];
            }
            const data = row as Record<string, unknown>;
            if (typeof data.lastTime !== 'number') {
              return [];
            }
            return [{
              otherUid,
              lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
              lastTime: data.lastTime,
              lastSenderId: typeof data.lastSenderId === 'string' ? data.lastSenderId : '',
              unread: typeof data.unread === 'number' ? data.unread : 0,
            }];
          })
          .sort((left, right) => right.lastTime - left.lastTime);

        callback(conversations);
      },
      error => {
        if (onError) {
          onError(error);
        } else {
          console.error('Không thể tải cuộc trò chuyện:', error);
        }
      },
    ),
  );
}

export async function sendTextMessage(
  myUid: string,
  otherUid: string,
  text: string,
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  const chatId = getChatId(myUid, otherUid);
  const messageRef = push(ref(db, `chats/${chatId}/messages`));
  const newKey = messageRef.key;
  if (!newKey) {
    throw new Error('Không thể tạo mã tin nhắn.');
  }

  const lastTime = Date.now();
  const updates: Record<string, unknown> = {
    [`chats/${chatId}/messages/${newKey}`]: {
      senderId: myUid,
      type: 'text',
      text: trimmedText,
      createdAt: lastTime,
    },
    [`userChats/${myUid}/${otherUid}`]: {
      lastMessage: trimmedText,
      lastTime,
      lastSenderId: myUid,
      unread: 0,
    },
    [`userChats/${otherUid}/${myUid}/lastMessage`]: trimmedText,
    [`userChats/${otherUid}/${myUid}/lastTime`]: lastTime,
    [`userChats/${otherUid}/${myUid}/lastSenderId`]: myUid,
    [`userChats/${otherUid}/${myUid}/unread`]: increment(1),
  };

  await update(ref(db), updates);
}

export async function sendLocationMessage(
  myUid: string,
  otherUid: string,
  lat: number,
  lng: number,
): Promise<void> {
  const chatId = getChatId(myUid, otherUid);
  const messageRef = push(ref(db, `chats/${chatId}/messages`));
  const newKey = messageRef.key;
  if (!newKey) {
    throw new Error('Không thể tạo mã tin nhắn.');
  }

  const lastTime = Date.now();
  const updates: Record<string, unknown> = {
    [`chats/${chatId}/messages/${newKey}`]: {
      senderId: myUid,
      type: 'location',
      lat,
      lng,
      createdAt: lastTime,
    },
    [`userChats/${myUid}/${otherUid}`]: {
      lastMessage: '📍 Vị trí',
      lastTime,
      lastSenderId: myUid,
      unread: 0,
    },
    [`userChats/${otherUid}/${myUid}/lastMessage`]: '📍 Vị trí',
    [`userChats/${otherUid}/${myUid}/lastTime`]: lastTime,
    [`userChats/${otherUid}/${myUid}/lastSenderId`]: myUid,
    [`userChats/${otherUid}/${myUid}/unread`]: increment(1),
  };

  await update(ref(db), updates);
}

function parseMessage(id: string, value: unknown): ChatMessage | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (
    typeof data.senderId !== 'string' ||
    typeof data.createdAt !== 'number' ||
    (data.type !== 'text' && data.type !== 'location')
  ) {
    return null;
  }

  if (data.type === 'text') {
    if (typeof data.text !== 'string') {
      return null;
    }
    return {
      id,
      senderId: data.senderId,
      type: 'text',
      text: data.text,
      createdAt: data.createdAt,
    };
  }

  if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
    return null;
  }
  return {
    id,
    senderId: data.senderId,
    type: 'location',
    latitude: data.lat,
    longitude: data.lng,
    createdAt: data.createdAt,
  };
}

export function subscribeMessages(
  myUid: string,
  otherUid: string,
  callback: (message: ChatMessage) => void,
  onError?: MessageErrorCallback,
): ReturnType<typeof onChildAdded> {
  const messagesQuery = query(
    ref(db, `chats/${getChatId(myUid, otherUid)}/messages`),
    orderByChild('createdAt'),
  );
  const seenMessageIds = new Set<string>();

  return trackListener(
    onChildAdded(
      messagesQuery,
      snapshot => {
        const messageId = snapshot.key;
        if (!messageId || seenMessageIds.has(messageId)) {
          return;
        }
        seenMessageIds.add(messageId);

        const message = parseMessage(messageId, snapshot.val());
        if (message) {
          callback(message);
        } else {
          console.warn(`Bỏ qua tin nhắn không hợp lệ: ${messageId}`);
        }
      },
      error => {
        if (onError) {
          onError(error);
        } else {
          console.error('Không thể tải tin nhắn:', error);
        }
      },
    ),
  );
}

export async function markAsRead(myUid: string, otherUid: string): Promise<void> {
  const userChatRef = ref(db, `userChats/${myUid}/${otherUid}`);
  const snapshot = await get(userChatRef);
  if (!snapshot.exists()) {
    return;
  }

  await update(userChatRef, { unread: 0 });
}
