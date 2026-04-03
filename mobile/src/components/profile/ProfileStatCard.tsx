import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'amber';
};

export function ProfileStatCard({ label, value, tone = 'blue' }: Props) {
  const toneColor = tone === 'green' ? '#22c55e' : tone === 'amber' ? '#f59e0b' : '#38bdf8';

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: '#0b1220',
          borderColor: 'rgba(148, 163, 184, 0.18)',
          borderWidth: 1,
          borderRadius: 18,
          paddingVertical: 14,
          paddingHorizontal: 12,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <Text style={{ color: toneColor, fontSize: 20, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
