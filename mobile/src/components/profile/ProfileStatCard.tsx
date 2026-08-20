import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { radius, text, useTheme } from '../../lib/styles';

/**
 * Tones were 'blue' | 'green' | 'amber' — 'blue' being the sky primary the
 * redesign dropped. They name a role now, so they survive a palette change.
 */
type Tone = 'default' | 'success' | 'warning';

type Props = {
  label: string;
  value: string;
  tone?: Tone;
};

export function ProfileStatCard({ label, value, tone = 'default' }: Props) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'success' ? colors.accent : tone === 'warning' ? colors.warning : colors.fg;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: 12,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={{ color: toneColor, fontSize: text.xl, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, marginTop: 4, fontSize: text.xs, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
