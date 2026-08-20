import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { Listing } from '../types';
import { radius, useStyles, useTheme } from '../lib/styles';

export function ListingEditCard({
  visible,
  listing,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  listing: Listing | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: { title: string; description: string; price: number }) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title || '');
    setDescription(listing.description || '');
    setPrice(String(listing.price || ''));
  }, [listing]);

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
          <Text style={styles.noticeTitle}>Update listing</Text>
          <Text style={styles.noticeBody}>Only you can edit this listing.</Text>

          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.muted} />
          <TextInput
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor={colors.muted}
            multiline
          />
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />

          <Pressable
            style={styles.primaryButton}
            onPress={() => onSave({ title: title.trim(), description: description.trim(), price: Number(price) })}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
