// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { getUser, removeUser } from '../services/userStorage';
import { useFlashcardStore } from '../store/flashcardStore';

const Tab = createBottomTabNavigator();

// Floating Tab Bar giữ nguyên style cũ (đã hoạt động)
const FloatingTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <BlurView tint="dark" intensity={20} style={styles.tabBarBlur}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: isFocused ? 'home' : 'home-outline',
            Player: isFocused ? 'musical-notes' : 'musical-notes-outline',
            Profile: isFocused ? 'person' : 'person-outline',
          };
          const iconName = icons[route.name] || 'help-circle';

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabButton}>
              <Ionicons name={iconName} size={24} color={isFocused ? '#1DB954' : '#A0A0A0'} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

// Điều hướng chính khi đã đăng nhập
const MainTabs = ({ onLogout }: { onLogout: () => void }) => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
    <Tab.Screen name="Player" component={PlayerScreen} options={{ tabBarLabel: 'Nghe nhạc' }} />
    <Tab.Screen
      name="Profile"
      options={{ tabBarLabel: 'Tài khoản' }}
    >
      {() => <ProfileScreen onLogout={onLogout} />}
    </Tab.Screen>
  </Tab.Navigator>
);

// Component gốc của App
export const AppNavigator = () => {
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const setUserId = useFlashcardStore((state) => state.setUserId);

  useEffect(() => {
    (async () => {
      const stored = await getUser();
      if (stored) {
        setUser(stored);
        setUserId(stored.phone);
      }
      setLoading(false);
    })();
  }, []);

  const handleLoginSuccess = () => {
    getUser().then((stored) => {
      if (stored) {
        setUser(stored);
        setUserId(stored.phone);
      }
    });
  };

  const handleLogout = async () => {
    await removeUser();
    setUserId(null);
    setUser(null);
  };

  if (loading) return null;

  return (
    <NavigationContainer theme={DarkTheme}>
      {user ? (
        <MainTabs onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1DB954',
  },
});