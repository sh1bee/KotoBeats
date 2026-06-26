// src/components/exercises/ClozeTest.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LineAnalysis } from '../../services/aiAnalysisService';

interface ClozeTestProps {
  lineAnalysis: LineAnalysis;
  onBack: () => void;
}

export const ClozeTest: React.FC<ClozeTestProps> = ({ lineAnalysis, onBack }) => {
  const words = useMemo(
    () => lineAnalysis.wordBreakdown.filter(w => w.word.trim().length > 1),
    [lineAnalysis]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentWord = words[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = words.filter(w => w.word !== currentWord.word);
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, Math.min(3, others.length));
    const merged = [currentWord.word, ...distractors.map(w => w.word)];
    return merged.sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  const handleSelect = (word: string) => {
    setSelected(word);
    if (word === currentWord.word) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 800);
  };

  if (finished) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Kết quả</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.resultContainer}>
          <Ionicons name="trophy" size={60} color="#FFD700" />
          <Text style={styles.resultScore}>{score}/{words.length}</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Điền từ vào chỗ trống</Text>
        <Text style={styles.progress}>{currentIndex + 1}/{words.length}</Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.sentence}>
          {lineAnalysis.fullLine.replace(currentWord.word, '______')}
        </Text>
        <Text style={styles.hint}>
          Nghĩa: {currentWord.meaningVi}
        </Text>
      </View>

      <View style={styles.optionsGrid}>
        {options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionButton,
              selected === option && option === currentWord.word && styles.correctOption,
              selected === option && option !== currentWord.word && styles.wrongOption,
            ]}
            onPress={() => handleSelect(option)}
            disabled={selected !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  progress: { color: '#AAA', fontSize: 16 },
  questionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  sentence: { color: '#FFF', fontSize: 24, textAlign: 'center', lineHeight: 34 },
  hint: { color: '#AAA', fontSize: 16, textAlign: 'center', marginTop: 16 },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: '45%',
    alignItems: 'center',
  },
  correctOption: { backgroundColor: 'rgba(29,185,84,0.2)', borderColor: '#1DB954' },
  wrongOption: { backgroundColor: 'rgba(255,77,77,0.2)', borderColor: '#FF4D4D' },
  optionText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultScore: { color: '#FFF', fontSize: 48, fontWeight: 'bold', marginTop: 20 },
  backButton: {
    marginTop: 30,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  backButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});