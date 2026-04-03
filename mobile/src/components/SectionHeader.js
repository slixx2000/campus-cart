import React from 'react';
import { Text, View } from 'react-native';

export default function SectionHeader({ title, subtitle, rightLabel }) {
  return (
    <View className="mb-4 flex-row items-end justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-xl font-bold tracking-tight text-white">{title}</Text>
        {subtitle ? <Text className="mt-2 text-sm leading-5 text-gray-400">{subtitle}</Text> : null}
      </View>
      {rightLabel ? <Text className="text-xs font-semibold uppercase tracking-wide text-blue-400">{rightLabel}</Text> : null}
    </View>
  );
}
