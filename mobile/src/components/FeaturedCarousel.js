import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions, View } from 'react-native';
import ListingCard from './ListingCard.js';

const AUTO_PLAY_MS = 3800;
const RESUME_DELAY_MS = 2400;
const SIDE_PADDING = 16;
const ITEM_GAP = 16;

function FeaturedCarousel({ items, onPressItem }) {
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const rawIndexRef = useRef(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const itemWidth = Math.max(260, screenWidth - SIDE_PADDING * 2 - 6);
  const interval = itemWidth + ITEM_GAP;

  const canLoop = items.length > 1;
  const loopData = useMemo(() => {
    if (!canLoop) return items;
    const first = items[0];
    const last = items[items.length - 1];
    return [last, ...items, first];
  }, [canLoop, items]);

  const clearTimers = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const jumpToRawIndex = useCallback(
    (index, animated) => {
      if (!listRef.current) return;
      listRef.current.scrollToOffset({ offset: index * interval, animated });
      rawIndexRef.current = index;
    },
    [interval]
  );

  const scheduleResume = useCallback(() => {
    if (!canLoop) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, RESUME_DELAY_MS);
  }, [canLoop]);

  const handleAutoPlay = useCallback(() => {
    if (!canLoop || isUserInteracting || !listRef.current) return;
    const targetIndex = rawIndexRef.current + 1;
    jumpToRawIndex(targetIndex, true);
  }, [canLoop, isUserInteracting, jumpToRawIndex]);

  useEffect(() => {
    clearTimers();

    if (!canLoop) {
      rawIndexRef.current = 0;
      return () => clearTimers();
    }

    rawIndexRef.current = 1;
    // Start at first real item (index 1 because index 0 is a clone).
    requestAnimationFrame(() => {
      jumpToRawIndex(1, false);
    });

    autoTimerRef.current = setInterval(handleAutoPlay, AUTO_PLAY_MS);

    return () => clearTimers();
  }, [canLoop, clearTimers, handleAutoPlay, jumpToRawIndex, items.length]);

  const handleMomentumEnd = useCallback(
    (event) => {
      const nextRawIndex = Math.round(event.nativeEvent.contentOffset.x / interval);
      rawIndexRef.current = nextRawIndex;

      if (!canLoop) {
        setCurrentIndex(Math.max(0, Math.min(items.length - 1, nextRawIndex)));
        scheduleResume();
        return;
      }

      if (nextRawIndex === 0) {
        const safeIndex = items.length;
        setCurrentIndex(items.length - 1);
        jumpToRawIndex(safeIndex, false);
        scheduleResume();
        return;
      }

      if (nextRawIndex === loopData.length - 1) {
        setCurrentIndex(0);
        jumpToRawIndex(1, false);
        scheduleResume();
        return;
      }

      setCurrentIndex(nextRawIndex - 1);
      scheduleResume();
    },
    [canLoop, interval, items.length, jumpToRawIndex, loopData.length, scheduleResume]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={{ width: itemWidth, marginRight: ITEM_GAP }}>
        <ListingCard listing={item} onPress={() => onPressItem(item)} />
      </View>
    ),
    [itemWidth, onPressItem]
  );

  const keyExtractor = useCallback((item, index) => `${item.id}-${index}`, []);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: interval,
      offset: interval * index,
      index,
    }),
    [interval]
  );

  return (
    <View>
      <Animated.FlatList
        ref={listRef}
        data={loopData}
        horizontal
        accessibilityLabel="Featured listings carousel"
        pagingEnabled
        snapToInterval={interval}
        decelerationRate="fast"
        bounces={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: SIDE_PADDING, paddingRight: 2 }}
        onTouchStart={() => {
          setIsUserInteracting(true);
          if (resumeTimerRef.current) {
            clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = null;
          }
        }}
        onScrollBeginDrag={() => setIsUserInteracting(true)}
        onScrollEndDrag={scheduleResume}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {items.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center">
          {items.map((item, dotIndex) => {
            const logicalRawIndex = canLoop ? dotIndex + 1 : dotIndex;
            const inputRange = [
              (logicalRawIndex - 1) * interval,
              logicalRawIndex * interval,
              (logicalRawIndex + 1) * interval,
            ];

            const width = scrollX.interpolate({
              inputRange,
              outputRange: [6, 16, 6],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.45, 1, 0.45],
              extrapolate: 'clamp',
            });

            const bgClass = currentIndex === dotIndex ? 'bg-blue-500' : 'bg-gray-500';

            return (
              <Animated.View
                key={`dot-${item.id}-${dotIndex}`}
                style={{ width, opacity }}
                className={`mx-1 h-2 rounded-full ${bgClass}`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(FeaturedCarousel);
