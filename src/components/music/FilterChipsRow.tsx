import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

const chips = ['Thư giãn', 'Tập trung', 'Vui vẻ', 'Buồn', 'Năng lượng', 'Cổ điển', 'Nhạc Nhật'];

const FilterChipsRow = () => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {chips.map((label) => (
        <TouchableOpacity
          key={label}
          style={[styles.chip, selected === label && styles.chipActive]}
          onPress={() => setSelected(label)}
        >
          <Text style={[styles.text, selected === label && styles.textActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  text: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  textActive: { color: '#000' },
});

export default React.memo(FilterChipsRow);