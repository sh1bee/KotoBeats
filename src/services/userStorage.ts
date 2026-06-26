// src/services/userStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@kotobeat_user';

export interface UserData {
  phone: string;
  displayName?: string;
}

export const saveUser = async (user: UserData) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<UserData | null> => {
  const json = await AsyncStorage.getItem(USER_KEY);
  return json ? JSON.parse(json) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};