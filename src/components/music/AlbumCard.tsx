import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Album } from '../../utils/musicDataUtils';

interface Props {
  album: Album;
  onPress: (album: Album) => void;
}

const AlbumCard = ({ album, onPress }: Props) => (
  <TouchableOpacity style={styles.container} onPress={() => onPress(album)} activeOpacity={0.7}>
    <View style={styles.artwork}>
      <Image source={album.coverUrl} style={styles.image} cachePolicy="memory-disk" />
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{album.songs.length}</Text>
      </View>
    </View>
    <Text style={styles.title} numberOfLines={1}>{album.title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { width: 150, marginRight: 16 },
  artwork: { width: 150, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1A1A1A', position: 'relative' },
  image: { width: '100%', height: '100%' },
  countBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 8 },
});

export default React.memo(AlbumCard);