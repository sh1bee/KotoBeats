import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { LyricToken } from '../types';

import { fetchJishoDefinition, JishoResult } from '../services/jishoService';

interface Props {
  visible: boolean;
  token: LyricToken | null;
  onClose: () => void;
  onAddToFlashcard?: () => void;
}

export const DictionaryModal = ({
  visible,
  token,
  onClose,
  onAddToFlashcard,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<JishoResult | null>(null);

  useEffect(() => {
    if (visible && token) {
      setLoading(true);
      fetchJishoDefinition(token.base).then((res) => {
        setData(res);
        setLoading(false);
      });
    } else {
      setData(null);
    }
  }, [visible, token]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {loading ? (
            <ActivityIndicator size="large" color="#1DB954" />
          ) : data ? (
            <View>
              <Text style={styles.word}>
                {data.japanese[0]?.word || token?.base}
              </Text>
              <Text style={styles.reading}>{data.japanese[0]?.reading}</Text>
              <View style={styles.divider} />
              <Text style={styles.meaningTitle}>Nghĩa tiếng Anh:</Text>
              {data.senses[0]?.english_definitions.map((def, idx) => (
                <Text key={idx} style={styles.meaning}>
                  • {def}
                </Text>
              ))}

              <TouchableOpacity
                style={styles.flashcardBtn}
                onPress={onAddToFlashcard}
              >
                <Text style={styles.flashcardBtnText}>+ Thêm vào Flashcard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.errorText}>Không tìm thấy dữ liệu cho từ này.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  word: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  reading: { fontSize: 18, color: '#1DB954', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  meaningTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  meaning: { fontSize: 16, color: '#CCC', marginBottom: 4 },
  errorText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 20 },
  flashcardBtn: { backgroundColor: '#1DB954', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  flashcardBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});