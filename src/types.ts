export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
};

export type UserRecord = {
  uid: string;
  name: string;
  email: string;
  online: boolean;
  lastSeen: number;
};

export type Presence = {
  isOnline: boolean;
  lastSeen: number | null;
};

export type Contact = UserProfile & Presence;

export type MessageType = 'text' | 'location';

export type ChatMessage = {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
};

export type UserChat = {
  partnerId: string;
  lastMessage: string;
  lastMessageType: MessageType;
  lastMessageAt: number;
  lastSenderId: string;
  unreadMessages?: Record<string, true>;
};

export type ChatListItem = {
  id: string;
  peer: Contact;
  lastMessage: string;
  lastMessageType: MessageType;
  lastMessageAt: number;
  unreadCount: number;
  lastSenderId: string;
};

export type ConversationSummary = {
  otherUid: string;
  lastMessage: string;
  lastTime: number;
  lastSenderId: string;
  unread: number;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type ChatRouteParams = {
  otherUid: string;
  otherName: string;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Chat: ChatRouteParams;
};
