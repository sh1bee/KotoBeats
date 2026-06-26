// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { saveUser } from '../services/userStorage';
import { useFlashcardStore } from '../store/flashcardStore';

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const setUserId = useFlashcardStore((state) => state.setUserId);

  const handleContinue = async () => {
    if (!phone.trim()) {
      Alert.alert('Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    try {
      await saveUser({ phone: phone.trim(), displayName: name.trim() || undefined });
      setUserId(phone.trim());
      onLogin();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>KotoBeat</Text>
        <Text style={styles.subtitle}>Học tiếng Nhật qua âm nhạc</Text>
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại (ID của bạn)"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Tên hiển thị (tuỳ chọn)"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Bắt đầu học</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E12', justifyContent: 'center' },
  inner: { paddingHorizontal: 32, alignItems: 'center' },
  title: { color: '#1DB954', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#AAA', fontSize: 16, marginBottom: 40 },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0A0A0C', fontWeight: 'bold', fontSize: 18 },
});