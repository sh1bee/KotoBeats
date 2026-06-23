import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const StatCard: React.FC<{ icon: any; value: string; label: string }> = ({ icon, value, label }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={24} color="#1DB954" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingItem: React.FC<{ icon: any; label: string; onPress?: () => void }> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <Ionicons name={icon} size={20} color="#A0A0A0" />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#555" />
  </TouchableOpacity>
);

export const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>D</Text>
        </View>
        <Text style={styles.userName}>Đạt</Text>
        <Text style={styles.userEmail}>dat.kotobeat@gmail.com</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="flash" value="127" label="Tổng từ vựng" />
        <StatCard icon="time" value="42h" label="Giờ nghe Nhật" />
        <StatCard icon="star" value="N3" label="Cấp độ hiện tại" />
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Cài đặt</Text>
        <SettingItem icon="moon" label="Giao diện" />
        <SettingItem icon="notifications" label="Thông báo" />
        <SettingItem icon="help-circle" label="Hỗ trợ" />
        <SettingItem icon="information-circle" label="Về KotoBeat" />
        <SettingItem icon="log-out" label="Đăng xuất" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>KotoBeat v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E12',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
  },
  settingsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  settingsTitle: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#555',
    fontSize: 12,
  },
});