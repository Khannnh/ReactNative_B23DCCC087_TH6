import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { subscribeConversations } from '../services/chatService';
import { subscribeUser } from '../services/userService';
import type {
  ConversationSummary,
  MainTabParamList,
  RootStackParamList,
  UserRecord,
} from '../types';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList, 'MainTabs'>
>;

type ConversationRowProps = {
  conversation: ConversationSummary;
  currentUid: string;
  onPress: (otherUid: string, otherName: string) => void;
};

function formatConversationTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function ConversationRow({ conversation, currentUid, onPress }: ConversationRowProps) {
  const [otherUser, setOtherUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeUser(
      conversation.otherUid,
      user => {
        if (active) {
          setOtherUser(user);
        }
      },
      error => {
        console.error('Không thể tải thông tin người trong cuộc trò chuyện:', error);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [conversation.otherUid]);

  const otherName = otherUser?.name ?? conversation.otherUid;
  const initial = otherName.trim().charAt(0).toLocaleUpperCase() || '?';
  const preview =
    conversation.lastSenderId === currentUid
      ? `Bạn: ${conversation.lastMessage}`
      : conversation.lastMessage;

  return (
    <TouchableOpacity
      style={styles.conversationRow}
      onPress={() => onPress(conversation.otherUid, otherName)}
      accessibilityRole="button"
      accessibilityLabel={`${otherName}, ${preview}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, conversation.unread > 0 && styles.unreadText]}
            numberOfLines={1}
          >
            {otherName}
          </Text>
          <Text style={styles.time}>{formatConversationTime(conversation.lastTime)}</Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.preview, conversation.unread > 0 && styles.unreadText]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {conversation.unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unread > 99 ? '99+' : conversation.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const myUid = user?.uid;
    if (!myUid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    return subscribeConversations(
      myUid,
      nextConversations => {
        setConversations(nextConversations);
        setLoading(false);
      },
      () => {
        setError('Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
        setLoading(false);
      },
    );
  }, [user?.uid]);

  const openConversation = (otherUid: string, otherName: string) => {
    navigation.navigate('Chat', { otherUid, otherName });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.headerTitle}>Trò chuyện</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.otherUid}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              currentUid={user?.uid ?? ''}
              onPress={openConversation}
            />
          )}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Chưa có cuộc trò chuyện nào, vào Danh bạ để bắt đầu
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  loader: { marginTop: 32 },
  errorText: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', padding: 24 },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1D4ED8', fontSize: 19, fontWeight: '700' },
  conversationInfo: { flex: 1, marginLeft: 12 },
  topLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  name: { flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '600', marginRight: 8 },
  time: { color: '#94A3B8', fontSize: 11 },
  bottomLine: { flexDirection: 'row', alignItems: 'center' },
  preview: { flex: 1, color: '#64748B', fontSize: 13, marginRight: 8 },
  unreadText: { color: '#0F172A', fontWeight: '700' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
