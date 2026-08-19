import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';
import { useStyles, useTheme } from '../lib/styles';

/**
 * Replaces the NativeWind SearchBar.js. The old one had a filter button whose
 * only action was a modal saying filters were disabled — dropped rather than
 * ported.
 */
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search listings...',
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.searchBarRow}>
      <MaterialIcons name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.searchBarInput}
      />
    </View>
  );
}
