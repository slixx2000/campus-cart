import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors, styles } from '../lib/styles';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  buttonLabel?: string;
  onClose: () => void;
};

export function FeedbackModal({
  visible,
  title,
  message,
  icon = 'info-outline',
  buttonLabel = 'Okay',
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.feedbackModalBackdrop} onPress={onClose}>
        <Pressable style={styles.feedbackModalCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.feedbackModalIconWrap}>
            <MaterialIcons name={icon} size={22} color={colors.secondary} />
          </View>
          <Text style={styles.feedbackModalTitle}>{title}</Text>
          <Text style={styles.feedbackModalMessage}>{message}</Text>
          <Pressable style={styles.feedbackModalButton} onPress={onClose}>
            <Text style={styles.feedbackModalButtonText}>{buttonLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
