import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { colors, styles } from '../lib/styles';
import type { AppUpdateInfo } from '../lib/appUpdates';

type Props = {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  onUpdateLater: () => void;
  onRequestClose: () => void;
};

export function UpdatePromptModal({ visible, updateInfo, onUpdateLater, onRequestClose }: Props) {
  const openDownload = async () => {
    if (!updateInfo) return;

    try {
      await Linking.openURL(updateInfo.downloadUrl);
    } finally {
      onRequestClose();
    }
  };

  const openReleaseNotes = async () => {
    if (!updateInfo) return;

    try {
      await Linking.openURL(updateInfo.releasePageUrl);
    } finally {
      onUpdateLater();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onUpdateLater}>
      <Pressable style={styles.feedbackModalBackdrop} onPress={onUpdateLater}>
        <Pressable style={styles.feedbackModalCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.feedbackModalIconWrap}>
            <MaterialIcons name="system-update" size={22} color={colors.secondary} />
          </View>
          <Text style={styles.feedbackModalTitle}>Update available</Text>
          <Text style={styles.feedbackModalMessage}>
            {updateInfo
              ? `CampusCart ${updateInfo.latestVersion} is ready. You are on ${updateInfo.currentVersion}.`
              : 'A newer CampusCart release is available.'}
          </Text>

          {updateInfo ? (
            <View style={{ width: '100%', gap: 8, marginTop: 2 }}>
              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 4,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Current version</Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{updateInfo.currentVersion}</Text>
              </View>
              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.35)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 4,
                }}
              >
                <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '700' }}>Latest release</Text>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{updateInfo.latestVersion}</Text>
              </View>
            </View>
          ) : null}

          <Pressable style={[styles.primaryButton, { width: '100%', marginTop: 6 }]} onPress={openDownload}>
            <Text style={styles.primaryButtonText}>Update now</Text>
          </Pressable>
          <Pressable
            style={[
              styles.secondaryButton,
              {
                width: '100%',
                borderColor: 'rgba(59, 130, 246, 0.4)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
              },
            ]}
            onPress={openReleaseNotes}
          >
            <Text style={[styles.secondaryButtonText, { color: '#93c5fd' }]}>View release notes</Text>
          </Pressable>
          <Pressable
            style={[
              styles.secondaryButton,
              {
                width: '100%',
                borderColor: 'rgba(148, 163, 184, 0.35)',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
              },
            ]}
            onPress={onUpdateLater}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Update later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}