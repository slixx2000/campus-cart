import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from '../lib/styles';

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
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(2, 6, 23, 0.72)',
          justifyContent: 'flex-end',
          paddingHorizontal: 16,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: '#0b1220',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.25)',
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
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: action.tone === 'danger' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(148, 163, 184, 0.2)',
                  backgroundColor: action.tone === 'danger' ? 'rgba(127, 29, 29, 0.35)' : '#111b2e',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text
                style={{
                  color: action.tone === 'danger' ? '#fecaca' : '#e2e8f0',
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
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.2)',
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: '#0f172a',
            }}
          >
            <Text style={{ color: '#94a3b8', fontWeight: '700', textAlign: 'center' }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
