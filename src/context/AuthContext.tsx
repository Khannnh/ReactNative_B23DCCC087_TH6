import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { User } from 'firebase/auth';
import { subscribeAuth } from '../services/authService';
import { trackListener } from '../services/listenerService';
import { setOffline, startPresence } from '../services/presenceService';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAuth(nextUser => {
      if (!active) {
        return;
      }
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let appState = AppState.currentState;
    let unsubscribePresence = startPresence(user.uid);
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && appState !== 'active') {
        unsubscribePresence();
        unsubscribePresence = startPresence(user.uid);
      } else if (nextAppState !== 'active' && appState === 'active') {
        setOffline(user.uid).catch(error => {
          console.error('Không thể đặt trạng thái ngoại tuyến:', error);
        });
      }
      appState = nextAppState;
    });
    const unsubscribeAppState = trackListener(() => appStateSubscription.remove());

    return () => {
      unsubscribeAppState();
      unsubscribePresence();
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  }
  return context;
}
