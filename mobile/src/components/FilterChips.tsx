import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { CATEGORY_OPTIONS } from '../lib/constants';
import { useStyles } from '../lib/styles';

/**
 * Replaces FilterChips.js, which hardcoded an invented list
 * (['All','Food','Electronics','Books','Price Range','Condition']) — the last two
 * only set local state and did nothing. These are the real categories, so tapping
 * one actually filters.
 */
const CHIPS = ['All', ...CATEGORY_OPTIONS.slice(0, 5)];

export function FilterChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (chip: string) => void;
}) {
  const styles = useStyles();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterStripContent}
    >
      {CHIPS.map((chip) => {
        const isActive = chip === active;
        return (
          <Pressable
            key={chip}
            onPress={() => onSelect(chip)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
