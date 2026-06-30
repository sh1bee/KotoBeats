// src/components/music/QuickPlayGrid.tsx
import React, { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import SquareSongCard from './SquareSongCard';
import type { Song } from '../../types';

interface Props {
  songs: Song[];
  currentSongId?: string;
  onSongPress: (song: Song) => void;
}

const QuickPlayGrid = ({ songs, currentSongId, onSongPress }: Props) => {
  const renderItem = useCallback(({ item }: { item: Song }) => (
    <SquareSongCard
      song={item}
      isActive={currentSongId === item._id}
      onPress={onSongPress}
    />
  ), [currentSongId, onSongPress]);

  return (
    <FlatList
      data={songs}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20 },
});

export default React.memo(QuickPlayGrid);