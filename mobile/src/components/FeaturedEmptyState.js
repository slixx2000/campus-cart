import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function FeaturedEmptyState({ onBrowsePress }) {
  return (
    <View className="rounded-2xl border border-amber-400 bg-gray-900 p-6">
      <View className="mb-4 h-24 items-center justify-center rounded-xl bg-gray-800">
        <MaterialIcons name="inventory-2" size={30} color="#FBBF24" />
      </View>
      <Text className="text-lg font-bold text-white">No featured items yet</Text>
      <Text className="mt-2 text-sm leading-5 text-gray-300">
        We are curating the best picks for students. Browse all listings to discover fresh deals.
      </Text>
      <Pressable
        onPress={onBrowsePress}
        accessibilityRole="button"
        accessibilityLabel="Browse marketplace"
        className="mt-4 h-12 items-center justify-center rounded-xl bg-blue-600"
      >
        <Text className="font-semibold text-white">Browse marketplace</Text>
      </Pressable>
    </View>
  );
}
