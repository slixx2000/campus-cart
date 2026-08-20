import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { radius, useStyles, useTheme } from '../lib/styles';

type ActionItem = {
  key: string;
  label: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
};

export function ActionSheetCard({
  visible,
  title,
  subtitle,
  actions,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  actions: ActionItem[];
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: 'flex-end',
          paddingHorizontal: 16,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={styles.noticeTitle}>{title}</Text>
          {subtitle ? <Text style={styles.noticeBody}>{subtitle}</Text> : null}

          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={({ pressed }) => [
                {
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: action.tone === 'danger' ? colors.danger : colors.line,
                  backgroundColor: colors.surface2,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text
                style={{
                  color: action.tone === 'danger' ? colors.danger : colors.fg,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            style={{
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.line,
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.muted, fontWeight: '700', textAlign: 'center' }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
