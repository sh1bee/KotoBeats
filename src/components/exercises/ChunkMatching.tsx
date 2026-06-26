import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LineAnalysis } from '../../services/aiAnalysisService';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FFB347', '#B39DDB', '#81D4FA', '#F8BBD0'];

interface ChunkMatchingProps {
  lineAnalysis: LineAnalysis;
  onBack: () => void;
}

export const ChunkMatching: React.FC<ChunkMatchingProps> = ({ lineAnalysis, onBack }) => {
  const pairs = lineAnalysis.alignedTranslation || [];
  const [selectedJa, setSelectedJa] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());

  const viOrder = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    return indices.sort(() => Math.random() - 0.5);
  }, [pairs]);

  const handleSelectJa = (index: number) => {
    if (matchedPairs.has(index)) return;
    setSelectedJa(index);
  };

  const handleSelectVi = (viIndex: number) => {
    if (selectedJa === null || matchedPairs.has(selectedJa)) return;
    const originalIndex = viOrder[viIndex];
    if (selectedJa === originalIndex) {
      setMatchedPairs(prev => new Set(prev).add(selectedJa));
    }
    setSelectedJa(null);
  };

  const allMatched = matchedPairs.size === pairs.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Ghép cặp song ngữ</Text>
        <Text style={styles.progress}>{matchedPairs.size}/{pairs.length}</Text>
      </View>

      {allMatched && (
        <View style={styles.completeBanner}>
          <Ionicons name="checkmark-circle" size={40} color="#1DB954" />
          <Text style={styles.completeText}>Hoàn thành!</Text>
        </View>
      )}

      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Tiếng Nhật</Text>
          {pairs.map((pair, idx) => (
            <TouchableOpacity
              key={`ja-${idx}`}
              style={[
                styles.chunkButton,
                selectedJa === idx && styles.chunkSelected,
                matchedPairs.has(idx) && styles.chunkMatched,
              ]}
              onPress={() => handleSelectJa(idx)}
              disabled={matchedPairs.has(idx)}
            >
              <Text style={[styles.chunkText, { color: matchedPairs.has(idx) ? '#1DB954' : COLORS[idx % COLORS.length] }]}>
                {pair.ja}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.column}>
          <Text style={styles.columnTitle}>Tiếng Việt</Text>
          {viOrder.map((originalIndex, displayIndex) => (
            <TouchableOpacity
              key={`vi-${displayIndex}`}
              style={[
                styles.chunkButton,
                matchedPairs.has(originalIndex) && styles.chunkMatched,
              ]}
              onPress={() => handleSelectVi(displayIndex)}
              disabled={matchedPairs.has(originalIndex)}
            >
              <Text style={[styles.chunkText, { color: matchedPairs.has(originalIndex) ? '#1DB954' : '#AAA' }]}>
                {pairs[originalIndex].vi}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  progress: { color: '#AAA', fontSize: 16 },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,185,84,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  completeText: { color: '#1DB954', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  columnsContainer: { flexDirection: 'row', flex: 1 },
  column: { flex: 1, paddingHorizontal: 5 },
  columnTitle: { color: '#AAA', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  chunkButton: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  chunkSelected: {
    borderColor: '#FFD54F',
    backgroundColor: 'rgba(255,213,79,0.1)',
  },
  chunkMatched: {
    borderColor: '#1DB954',
    backgroundColor: 'rgba(29,185,84,0.1)',
    opacity: 0.7,
  },
  chunkText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  divider: { width: 1, backgroundColor: '#333' },
});