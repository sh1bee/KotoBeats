// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import MusicScreen from '../screens/MusicScreen';
import MiniPlayer from '../components/MiniPlayer';
import { getUser, removeUser } from '../services/userStorage';
import { useFlashcardStore } from '../store/flashcardStore';
import { useTrackChangeListener } from '../hooks/useTrackChangeListener';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack cho tab Music: MusicMain (danh sách) -> PlayerScreen
const MusicStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MusicMain" component={MusicScreen} />
    <Stack.Screen name="PlayerScreen" component={PlayerScreen} />
  </Stack.Navigator>
);

// Stack cho Home: HomeMain -> Profile
const HomeStack = ({ onLogout }: { onLogout: () => void }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Profile">
      {() => <ProfileScreen onLogout={onLogout} />}
    </Stack.Screen>
  </Stack.Navigator>
);

// Màn hình Học tập tạm thời
const LearnScreenPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: '#0E0E12', justifyContent: 'center', alignItems: 'center' }}>
    <Ionicons name="school" size={64} color="#1DB954" />
    <Text style={{ color: '#FFF', fontSize: 20, marginTop: 20 }}>Học tập</Text>
    <Text style={{ color: '#AAA', fontSize: 14, marginTop: 8 }}>Tính năng đang phát triển</Text>
  </View>
);

// Floating Tab Bar
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
            Music: isFocused ? 'musical-notes' : 'musical-notes-outline',
            Home: isFocused ? 'home' : 'home-outline',
            Learn: isFocused ? 'school' : 'school-outline',
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

// Main Tabs (khi đã đăng nhập)
const MainTabs = ({ onLogout }: { onLogout: () => void }) => {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  // ✅ Luôn lắng nghe thay đổi bài hát, không chỉ trong PlayerScreen
  useTrackChangeListener();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
        initialRouteName="Home"
        screenListeners={{
          state: (e) => {
            const state = e.data?.state;
            if (state?.routes) {
              const musicRoute = state.routes.find((r: any) => r.name === 'Music');
              if (musicRoute?.state?.routes) {
                const currentScreen = musicRoute.state.routes[musicRoute.state.routes.length - 1]?.name;
                setIsPlayerVisible(currentScreen === 'PlayerScreen');
              }
            }
          },
        }}
      >
        <Tab.Screen name="Music" component={MusicStack} options={{ tabBarLabel: 'Nghe nhạc' }} />
        <Tab.Screen name="Home" options={{ tabBarLabel: 'Trang chủ' }}>
          {() => <HomeStack onLogout={onLogout} />}
        </Tab.Screen>
        <Tab.Screen name="Learn" component={LearnScreenPlaceholder} options={{ tabBarLabel: 'Học tập' }} />
      </Tab.Navigator>

      {/* Mini Player chỉ hiện khi có bài hát và không ở PlayerScreen */}
      <MiniPlayer isPlayerVisible={isPlayerVisible} />
    </View>
  );
};

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