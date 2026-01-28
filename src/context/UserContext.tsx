'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUserSession, setUserSession, clearUserSession, type UserSession } from '@/lib/session';

interface UserContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const session = getUserSession();
    setUserState(session);
    setIsLoading(false);
  }, []);

  const setUser = (newUser: UserSession | null) => {
    if (newUser) {
      setUserSession(newUser);
    } else {
      clearUserSession();
    }
    setUserState(newUser);
  };

  const logout = () => {
    clearUserSession();
    setUserState(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
