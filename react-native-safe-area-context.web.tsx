// Mock for react-native-safe-area-context on web platform
import React from 'react';
import { createContext, useContext } from 'react';

const SafeAreaInsetsContext = createContext({ top: 0, left: 0, bottom: 0, right: 0 });

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => children;
export const SafeAreaView = ({ children, style }: { children?: React.ReactNode; style?: any }) => 
  <div style={style}>{children}</div>;
export const useSafeAreaInsets = () => useContext(SafeAreaInsetsContext);
export { SafeAreaInsetsContext };