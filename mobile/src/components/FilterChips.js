import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

const CHIP_OPTIONS = ['All', 'Food', 'Electronics', 'Books', 'Price Range', 'Condition'];

export default function FilterChips({ activeChip, onSelectChip }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
      {CHIP_OPTIONS.map((chip) => {
        const active = activeChip === chip;
        return (
          <Pressable
            key={chip}
            onPress={() => onSelectChip(chip)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${chip}`}
            className={`mr-2 h-12 items-center justify-center rounded-full px-4 ${active ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{chip}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
