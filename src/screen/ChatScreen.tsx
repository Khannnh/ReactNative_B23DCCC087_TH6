import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../services/authService';
import {
  markAsRead,
  sendLocationMessage,
  sendTextMessage,
  subscribeMessages,
} from '../services/chatService';
import {
  getCurrentLocation,
  requestLocationPermission,
  type LocationCoordinates,
} from '../services/location';
import { subscribeUser } from '../services/userService';
import type { ChatMessage, RootStackParamList, UserRecord } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
  const { otherUid, otherName } = route.params;
  const { user } = useAuth();
  const myUid = user?.uid;
  const [peer, setPeer] = useState<UserRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [locating, setLocating] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    setPeer(null);
    setMessages([]);
    setError(null);
    if (!myUid) {
      return;
    }

    let active = true;
    const unsubscribeMessages = subscribeMessages(
      myUid,
      otherUid,
      message => {
        if (!active) {
          return;
        }
        setMessages(previous => {
          if (previous.some(item => item.id === message.id)) {
            return previous;
          }
          return [...previous, message].sort((a, b) => a.createdAt - b.createdAt);
        });

        if (message.senderId === otherUid) {
          markAsRead(myUid, otherUid).catch(readError => {
            if (active) {
              setError(getAuthErrorMessage(readError));
            }
          });
        }
      },
      messageError => {
        if (active) {
          setError(getAuthErrorMessage(messageError));
        }
      },
    );
    const unsubscribeUser = subscribeUser(
      otherUid,
      nextPeer => {
        if (active) {
          setPeer(nextPeer);
        }
      },
      userError => {
        if (active) {
          setError(getAuthErrorMessage(userError));
        }
      },
    );

    markAsRead(myUid, otherUid).catch(readError => {
      if (active) {
        setError(getAuthErrorMessage(readError));
      }
    });

    return () => {
      active = false;
      unsubscribeMessages();
      unsubscribeUser();
    };
  }, [myUid, otherUid]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages]);

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const send = async () => {
    const trimmedText = text.trim();
    if (!myUid || !trimmedText || sending || locating) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendTextMessage(myUid, otherUid, trimmedText);
      setText('');
    } catch (sendError) {
      setError(getAuthErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!myUid || sending || locating) {
      return;
    }

    setLocating(true);
    setError(null);
    try {
      let permissionGranted: boolean;
      try {
        permissionGranted = await requestLocationPermission();
      } catch (permissionError) {
        console.error('Không thể yêu cầu quyền vị trí:', permissionError);
        Alert.alert('Thông báo', 'Bạn cần cấp quyền vị trí để gửi vị trí');
        return;
      }

      if (!permissionGranted) {
        Alert.alert('Thông báo', 'Bạn cần cấp quyền vị trí để gửi vị trí');
        return;
      }

      let coordinates: LocationCoordinates;
      try {
        coordinates = await getCurrentLocation();
      } catch (locationError) {
        console.error('Không thể lấy vị trí hiện tại:', locationError);
        Alert.alert('Thông báo', 'Không lấy được vị trí, hãy bật GPS');
        return;
      }

      try {
        await sendLocationMessage(myUid, otherUid, coordinates.lat, coordinates.lng);
      } catch (sendError) {
        setError(getAuthErrorMessage(sendError));
      }
    } finally {
      setLocating(false);
    }
  };

  const openLocation = async (message: ChatMessage) => {
    if (typeof message.latitude !== 'number' || typeof message.longitude !== 'number') {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${message.latitude},${message.longitude}`;
    try {
      await Linking.openURL(url);
    } catch (openError) {
      console.error('Không thể mở Google Maps:', openError);
      Alert.alert('Lỗi', 'Không thể mở Google Maps');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === myUid;
    const time = new Date(item.createdAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
        {item.type === 'location' ? (
          <Pressable
            style={[styles.locationCard, isMine ? styles.myMessage : styles.otherMessage]}
            onPress={() => openLocation(item)}
            accessibilityRole="button"
            accessibilityLabel="Mở vị trí trên Google Maps"
          >
            <Text style={[styles.locationTitle, isMine && styles.myMessageText]}>
              {'📍  Vị trí '}
              {isMine ? 'của tôi' : 'của họ'}
            </Text>
            <Text style={[styles.locationCoordinates, isMine && styles.myMessageText]}>
              {item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}
            </Text>
            <Text style={[styles.mapHint, isMine && styles.myMessageText]}>
              Nhấn để xem trên Google Maps
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.messageContent, isMine ? styles.myMessage : styles.otherMessage]}>
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.text}</Text>
          </View>
        )}
        <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>{time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {peer?.name ?? otherName}
            </Text>
            <Text style={[styles.presence, peer?.online ? styles.onlineText : styles.offlineText]}>
              {peer?.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có tin nhắn. Hãy gửi lời chào!</Text>
          }
        />

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={sendLocation}
            disabled={sending || locating}
            accessibilityRole="button"
            accessibilityLabel="Gửi vị trí hiện tại"
          >
            {locating ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.locationButtonText}>📍</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
            editable={!sending && !locating}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending || locating) && styles.disabledButton,
            ]}
            onPress={send}
            disabled={!text.trim() || sending || locating}
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
          >
            <Text style={styles.sendButtonText}>{sending ? '...' : 'Gửi'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { width: 40, justifyContent: 'center' },
  backText: { color: '#0F172A', fontSize: 36, lineHeight: 40 },
  headerInfo: { flex: 1 },
  headerName: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
  presence: { fontSize: 12, marginTop: 2 },
  onlineText: { color: '#059669' },
  offlineText: { color: '#64748B' },
  errorText: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  messageList: { flexGrow: 1, paddingHorizontal: 14, paddingVertical: 12 },
  messageRow: { maxWidth: '82%', marginVertical: 5 },
  myMessageRow: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherMessageRow: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageContent: { borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  locationCard: { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, minWidth: 220 },
  myMessage: { backgroundColor: '#2563EB' },
  otherMessage: { backgroundColor: '#E2E8F0' },
  messageText: { color: '#0F172A', fontSize: 15 },
  myMessageText: { color: '#FFF' },
  locationTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  locationCoordinates: { color: '#0F172A', fontSize: 13, marginTop: 6 },
  mapHint: { color: '#64748B', fontSize: 11, marginTop: 7 },
  messageTime: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  myMessageTime: { textAlign: 'right' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 24 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  locationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  locationButtonText: { fontSize: 22 },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#0F172A',
    marginRight: 8,
  },
  sendButton: {
    minWidth: 52,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  disabledButton: { opacity: 0.5 },
  sendButtonText: { color: '#FFF', fontWeight: '700' },
});
