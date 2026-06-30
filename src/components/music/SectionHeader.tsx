import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionText?: string;
  onAction?: () => void;
}

const SectionHeader = ({ title, icon, actionText, onAction }: Props) => (
  <View style={styles.container}>
    {icon && <Ionicons name={icon} size={24} color="#1DB954" style={styles.icon} />}
    <Text style={styles.title}>{title}</Text>
    {actionText && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.action}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 20 },
  icon: { marginRight: 8 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700', flex: 1 },
  action: { color: '#1DB954', fontSize: 14, fontWeight: '600' },
});

export default React.memo(SectionHeader);