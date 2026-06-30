import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import AnimatedSongItem from './AnimatedSongItem';
import type { Song } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 1. TÍNH TOÁN LẠI LAYOUT (Toán học để giữ snap mượt)
const SPACING = 12; // Khoảng cách giữa các cột
const PEEK_AMOUNT = 32; // Kích thước phần của cột thứ 2 thò ra (Overscroll Hint)
const EDGE_PADDING = 16; // Lề trái/phải của toàn bộ danh sách

// Chiều rộng 1 cột = Full màn hình - Lề trái - Khoảng cách - Phần thò ra
const GROUP_WIDTH = SCREEN_WIDTH - EDGE_PADDING - SPACING - PEEK_AMOUNT;

// Bước nhảy (Snap) = Chiều rộng 1 cột + Khoảng cách giữa chúng
const SNAP_INTERVAL = GROUP_WIDTH + SPACING;

interface Props {
  songs: Song[];
  currentSongId: string | undefined;
  onSongPress: (song: Song) => void;
}

const chunkArray = (arr: Song[], size: number): Song[][] => {
  const chunks: Song[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const QuickPicksCarousel = ({ songs, currentSongId, onSongPress }: Props) => {
  const groups = chunkArray(songs, 3);

  const renderGroup = useCallback(({ item }: { item: Song[] }) => (
    <View style={styles.group}>
      {item.map((song) => (
        <AnimatedSongItem
          key={song._id}
          item={song}
          isActive={currentSongId === song._id}
          onPress={onSongPress}
        />
      ))}
    </View>
  ), [currentSongId, onSongPress]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={groups}
      renderItem={renderGroup}
      keyExtractor={(_, index) => `quick-pick-${index}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      // Snap config
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      snapToAlignment="start"
      disableIntervalMomentum={true}
      // Tối ưu hiệu năng
      getItemLayout={getItemLayout}
      initialNumToRender={2}
      maxToRenderPerBatch={3}
      windowSize={3}
      removeClippedSubviews={false} // Giữ false để animation không bị lỗi khi lướt nhanh
    />
  );
};

const styles = StyleSheet.create({
  list: { 
    paddingLeft: EDGE_PADDING,
    paddingRight: EDGE_PADDING, 
  },
  group: { 
    width: GROUP_WIDTH,
    marginRight: SPACING, // Bắt buộc phải có để tạo khoảng cách và khớp với SNAP_INTERVAL
  },
});

export default React.memo(QuickPicksCarousel);