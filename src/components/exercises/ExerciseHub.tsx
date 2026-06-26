import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClozeTest } from './ClozeTest';
import { ParticleQuiz } from './ParticleQuiz';
import { ChunkMatching } from './ChunkMatching';
import type { LineAnalysis } from '../../services/aiAnalysisService';

type ExerciseType = 'menu' | 'cloze' | 'particle' | 'chunk';

interface ExerciseHubProps {
  lineAnalysis: LineAnalysis;
  onBack: () => void;
}

export const ExerciseHub: React.FC<ExerciseHubProps> = ({ lineAnalysis, onBack }) => {
  const [mode, setMode] = useState<ExerciseType>('menu');

  if (mode === 'cloze') {
    return <ClozeTest lineAnalysis={lineAnalysis} onBack={() => setMode('menu')} />;
  }

  if (mode === 'particle') {
    return <ParticleQuiz lineAnalysis={lineAnalysis} onBack={() => setMode('menu')} />;
  }

  if (mode === 'chunk') {
    return <ChunkMatching lineAnalysis={lineAnalysis} onBack={() => setMode('menu')} />;
  }
  console.log('ClozeTest:', ClozeTest);
  console.log('ParticleQuiz:', ParticleQuiz);
  console.log('ChunkMatching:', ChunkMatching);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Luyện tập</Text>
        <View style={{ width: 24 }} />
      </View>

      <TouchableOpacity style={styles.exerciseCard} onPress={() => setMode('cloze')}>
        <Ionicons name="text" size={24} color="#1DB954" />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>Điền từ vào chỗ trống</Text>
          <Text style={styles.exerciseDesc}>Điền từ vựng còn thiếu trong câu</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exerciseCard} onPress={() => setMode('particle')}>
        <Ionicons name="code-slash" size={24} color="#FF6B6B" />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>Thử thách trợ từ</Text>
          <Text style={styles.exerciseDesc}>Chọn trợ từ đúng cho các ô trống</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exerciseCard} onPress={() => setMode('chunk')}>
        <Ionicons name="grid" size={24} color="#FFD54F" />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>Ghép cặp song ngữ</Text>
          <Text style={styles.exerciseDesc}>Nối cụm tiếng Nhật với nghĩa tiếng Việt</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  exerciseInfo: { marginLeft: 16, flex: 1 },
  exerciseTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  exerciseDesc: { color: '#AAA', fontSize: 14 },
});