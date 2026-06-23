import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const FloatingTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <BlurView blurType="dark" blurAmount={20} tint="dark" style={styles.tabBarBlur}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

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

          const iconName = {
            Home: isFocused ? 'home' : 'home-outline',
            Player: isFocused ? 'musical-notes' : 'musical-notes-outline',
            Profile: isFocused ? 'person' : 'person-outline',
          }[route.name] as keyof typeof Ionicons;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? '#1DB954' : '#A0A0A0'}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarLabel: 'Trang chủ' }}
        />
        <Tab.Screen
          name="Player"
          component={PlayerScreen}
          options={{ tabBarLabel: 'Nghe nhạc' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: 'Tài khoản' }}
        />
      </Tab.Navigator>
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