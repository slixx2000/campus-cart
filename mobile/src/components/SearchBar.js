import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

export default function SearchBar({ value, onChangeText, onFilterPress }) {
  return (
    <View className="h-14 flex-row items-center rounded-2xl bg-gray-800 px-4">
      <MaterialIcons name="search" size={20} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search items..."
        placeholderTextColor="#9CA3AF"
        accessibilityLabel="Search items"
        className="ml-3 flex-1 text-base text-white"
      />
      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        hitSlop={8}
        className="h-12 w-12 items-center justify-center rounded-xl bg-gray-700"
      >
        <MaterialIcons name="tune" size={18} color="#D1D5DB" />
      </Pressable>
    </View>
  );
}
