import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';

function Badge({ label, tone }) {
  const toneClass = tone === 'featured' ? 'bg-amber-400/20 text-amber-300 border-amber-400/50' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  return (
    <View className={`mr-2 rounded-full border px-2 py-1 ${toneClass}`}>
      <Text className="text-[10px] font-semibold uppercase tracking-wide">{label}</Text>
    </View>
  );
}

function Skeleton({ className, pulseAnim }) {
  return (
    <Animated.View
      className={className}
      style={{
        opacity: pulseAnim,
        backgroundColor: '#1f2937',
      }}
    />
  );
}

export default function ListingCard({ listing, compact, homeTight, onPress, onMessagePress, canFavorite, isFavorite, onToggleFavorite }) {
  const cardWidthClass = compact ? 'w-72 mr-3' : 'w-full';
  const imageHeightClass = homeTight ? (compact ? 'h-52' : 'h-64') : (compact ? 'h-44' : 'h-56');
  const [imageLoaded, setImageLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    setImageLoaded(false);
  }, [listing?.id]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.price}, ${listing.location}`}
      className={`mb-4 overflow-hidden rounded-2xl bg-gray-900 ${cardWidthClass}`}
    >
      <View className={`relative w-full ${imageHeightClass}`}>
        <Image
          source={{ uri: listing.image }}
          resizeMode="cover"
          className={`w-full ${imageHeightClass}`}
          onLoadEnd={() => setImageLoaded(true)}
        />
        {!imageLoaded ? <Skeleton className={`absolute inset-0 ${imageHeightClass}`} pulseAnim={pulseAnim} /> : null}
        {listing.verified ? (
          <View className={homeTight ? 'absolute left-2 top-2 h-5 w-5 items-center justify-center rounded-full border border-emerald-400/70 bg-[#04111fdd]' : 'absolute left-3 top-3 h-6 w-6 items-center justify-center rounded-full border border-emerald-400/70 bg-[#04111fdd]'}>
            <MaterialIcons name="check" size={homeTight ? 11 : 14} color="#34D399" />
          </View>
        ) : null}
        {onMessagePress ? (
          <Pressable className={homeTight ? 'absolute bottom-2 left-2 rounded-full bg-black/45 px-2.5 py-1.5' : 'absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-2'} onPress={onMessagePress}>
            <Text className={homeTight ? 'text-[10px] font-semibold text-white' : 'text-[11px] font-semibold text-white'}>Message</Text>
          </Pressable>
        ) : null}
        {canFavorite ? (
          <Pressable className={homeTight ? 'absolute bottom-2 right-2 h-7 w-7 items-center justify-center rounded-full bg-black/45' : 'absolute bottom-3 right-3 h-8 w-8 items-center justify-center rounded-full bg-black/55'} disabled={!onToggleFavorite} onPress={onToggleFavorite}>
            <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={homeTight ? 13 : 15} color={isFavorite ? '#EF4444' : '#FFFFFF'} />
          </Pressable>
        ) : null}
      </View>

      <View className={homeTight ? 'px-3 py-1.5' : 'px-3 py-2.5'}>
        <View className={homeTight ? 'mb-0.5 flex-row items-start justify-between' : 'mb-1 flex-row items-start justify-between'}>
          <Text className={homeTight ? 'mr-2 flex-1 text-[12px] font-semibold leading-4 text-white' : 'mr-2 flex-1 text-[13px] font-semibold leading-4 text-white'} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text className={homeTight ? 'text-[14px] font-bold text-amber-400' : 'text-[15px] font-bold text-amber-400'}>{listing.price}</Text>
        </View>

        {!homeTight ? (
          <View className="mb-1.5 flex-row items-center">
            <Badge label={listing.condition || 'New'} tone="default" />
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Text className={homeTight ? 'mr-2 flex-1 text-[9px] text-gray-300' : 'mr-2 flex-1 text-[10px] text-gray-300'} numberOfLines={1}>{listing.seller}</Text>
          <Text className={homeTight ? 'text-[9px] text-gray-300' : 'text-[10px] text-gray-300'}>{listing.timeAgo}</Text>
        </View>
      </View>
    </Pressable>
  );
}
