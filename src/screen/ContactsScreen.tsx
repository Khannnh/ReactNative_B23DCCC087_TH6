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
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import { subscribeUsers } from '../services/userService';
import type { MainTabParamList, RootStackParamList, UserRecord } from '../types';

type ContactsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Contacts'>,
  NativeStackNavigationProp<RootStackParamList, 'MainTabs'>
>;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase();
}

export function ContactsScreen() {
  const navigation = useNavigation<ContactsNavigation>();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const myUid = user?.uid;
    if (!myUid) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    return subscribeUsers(
      myUid,
      nextContacts => {
        setContacts(nextContacts);
        setLoading(false);
      },
      () => {
        setError('Không thể tải danh bạ. Vui lòng thử lại.');
        setLoading(false);
      },
    );
  }, [user?.uid]);

  const normalizedSearch = normalizeText(search.trim());
  const filteredContacts = contacts.filter(contact =>
    normalizeText(contact.name).includes(normalizedSearch),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.headerTitle}>Danh bạ</Text>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm danh bạ..."
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={item => item.uid}
          contentContainerStyle={filteredContacts.length === 0 ? styles.emptyList : undefined}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() =>
                navigation.navigate('Chat', {
                  otherUid: item.uid,
                  otherName: item.name,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.online ? 'Online' : 'Offline'}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.trim().charAt(0).toLocaleUpperCase() || '?'}
                </Text>
                <View style={[styles.statusDot, item.online ? styles.onlineDot : styles.offlineDot]} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusIndicator,
                      item.online ? styles.onlineDot : styles.offlineDot,
                    ]}
                  />
                  <Text style={[styles.statusText, item.online ? styles.onlineText : styles.offlineText]}>
                    {item.online ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search.trim() ? 'Không tìm thấy người dùng.' : 'Chưa có người dùng nào khác.'}
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
  },
  loader: { marginTop: 32 },
  errorText: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', padding: 24 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 12,
    borderRadius: 14,
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
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  onlineDot: { backgroundColor: '#10B981' },
  offlineDot: { backgroundColor: '#94A3B8' },
  contactInfo: { flex: 1, marginLeft: 12 },
  name: { color: '#0F172A', fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusIndicator: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  onlineText: { color: '#047857' },
  offlineText: { color: '#64748B' },
});
