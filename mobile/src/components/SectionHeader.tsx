import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../lib/styles';

export function SectionHeader({
  eyebrow,
  title,
  body,
  rightLabel,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  rightLabel?: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderCopy}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
        {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      </View>
      {rightLabel ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{rightLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
