// src/components/exercises/ParticleQuiz.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LineAnalysis } from '../../services/aiAnalysisService';

const PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'から', 'まで', 'も', 'の', 'か', 'よ', 'ね', 'さえ', 'だけ', 'しか', 'ほど', 'ばかり', 'こそ', 'でも', 'さえも'];

interface ParticleQuizProps {
  lineAnalysis: LineAnalysis;
  onBack: () => void;
}

// Component hiển thị câu (tách riêng để tối ưu)
const SentenceDisplay = React.memo(({ 
  text, 
  particlesInSentence, 
  userAnswers, 
  checked, 
  onBlankPress 
}: {
  text: string;
  particlesInSentence: { particle: string; index: number }[];
  userAnswers: (string | null)[];
  checked: boolean;
  onBlankPress: (index: number) => void;
}) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  particlesInSentence.forEach((p, i) => {
    if (p.index > lastIndex) {
      parts.push(
        <Text key={`text-${i}`} style={styles.sentenceText}>
          {text.slice(lastIndex, p.index)}
        </Text>
      );
    }
    parts.push(
      <TouchableOpacity
        key={`blank-${i}`}
        style={[
          styles.blank,
          !checked && styles.blankActive,
          checked && userAnswers[i] === p.particle && styles.blankCorrect,
          checked && userAnswers[i] !== p.particle && styles.blankWrong,
        ]}
        onPress={() => onBlankPress(i)}
        disabled={checked}
      >
        <Text style={styles.blankText}>{userAnswers[i] || '___'}</Text>
      </TouchableOpacity>
    );
    lastIndex = p.index + p.particle.length;
  });
  
  if (lastIndex < text.length) {
    parts.push(
      <Text key="text-end" style={styles.sentenceText}>
        {text.slice(lastIndex)}
      </Text>
    );
  }
  
  return <View style={styles.sentenceRow}>{parts}</View>;
});

export const ParticleQuiz: React.FC<ParticleQuizProps> = ({ lineAnalysis, onBack }) => {
  const text = lineAnalysis.fullLine;
  
  const particlesInSentence = useMemo(() => {
    const found: { particle: string; index: number }[] = [];
    let idx = 0;
    while (idx < text.length) {
      let matched = false;
      for (const p of PARTICLES) {
        if (text.startsWith(p, idx)) {
          found.push({ particle: p, index: idx });
          idx += p.length;
          matched = true;
          break;
        }
      }
      if (!matched) idx++;
    }
    return found;
  }, [text]);

  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(
    new Array(particlesInSentence.length).fill(null)
  );
  const [checked, setChecked] = useState(false);

  // Tự động điền trợ từ được chọn vào ô trống đầu tiên (từ trái sang phải)
  const handleSelectParticle = useCallback((particle: string) => {
    if (checked) return;
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const emptyIndex = newAnswers.findIndex(ans => ans === null);
      if (emptyIndex !== -1) {
        newAnswers[emptyIndex] = particle;
      }
      return newAnswers;
    });
  }, [checked]); // không phụ thuộc userAnswers nữa, dùng functional update để tránh stale closure

  // Nhấn vào ô trống để xóa
  const handleBlankPress = useCallback((blankIndex: number) => {
    if (checked) return;
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[blankIndex] = null;
      return newAnswers;
    });
  }, [checked]);

  const handleCheck = () => {
    setChecked(true);
  };

  const handleReset = () => {
    setUserAnswers(new Array(particlesInSentence.length).fill(null));
    setChecked(false);
  };

  const correctCount = particlesInSentence.filter((p, i) => userAnswers[i] === p.particle).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Thử thách trợ từ</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.sentenceCard}>
        <SentenceDisplay
          text={text}
          particlesInSentence={particlesInSentence}
          userAnswers={userAnswers}
          checked={checked}
          onBlankPress={handleBlankPress}
        />
      </View>

      {checked && (
        <View style={styles.resultBar}>
          <Text style={styles.resultText}>Đúng {correctCount}/{particlesInSentence.length}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.hint}>
        {!checked ? 'Chọn một trợ từ bên dưới, nó sẽ tự động điền vào ô trống tiếp theo' : ''}
      </Text>

      <View style={styles.particleGrid}>
        {PARTICLES.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.particleButton}
            onPress={() => handleSelectParticle(p)}
          >
            <Text style={styles.particleText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!checked && (
        <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
          <Text style={styles.checkButtonText}>Kiểm tra</Text>
        </TouchableOpacity>
      )}
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
  sentenceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentenceText: { color: '#FFF', fontSize: 24, lineHeight: 34 },
  blank: {
    borderBottomWidth: 2,
    borderBottomColor: '#1DB954',
    marginHorizontal: 4,
    minWidth: 50,
    alignItems: 'center',
    paddingVertical: 4,
  },
  blankActive: { backgroundColor: 'rgba(29,185,84,0.1)', borderRadius: 4 },
  blankCorrect: { borderBottomColor: '#1DB954', backgroundColor: 'rgba(29,185,84,0.1)' },
  blankWrong: { borderBottomColor: '#FF4D4D', backgroundColor: 'rgba(255,77,77,0.1)' },
  blankText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  resultBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultText: { color: '#FFF', fontSize: 16 },
  retryText: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
  hint: { color: '#AAA', textAlign: 'center', marginBottom: 16 },
  particleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  particleButton: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  particleText: { color: '#FFF', fontSize: 18 },
  checkButton: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  checkButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});