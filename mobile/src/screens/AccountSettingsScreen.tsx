import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FallbackImage } from '../components/FallbackImage';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { styles } from '../lib/styles';
import type { UniversityRow } from '../types';
import type { User } from '@supabase/supabase-js';

type Props = {
  user: User | null;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
  editFullName: string;
  editPhone: string;
  editStudentEmail: string;
  editUniversityId: string;
  universities: UniversityRow[];
  defaultAvatarUrls: string[];
  selectedDefaultAvatar: string | null;
  avatarLoading: boolean;
  saveLoading: boolean;
  profileAvatarUrl?: string | null;
  onEditFullName: (value: string) => void;
  onEditPhone: (value: string) => void;
  onEditStudentEmail: (value: string) => void;
  onEditUniversityId: (value: string) => void;
  onSelectDefaultAvatar: (url: string) => void;
  onPickAvatar: () => void;
  onApplyDefaultAvatar: () => void;
  onSaveProfile: (options?: { silent?: boolean }) => Promise<boolean>;
  onSignOut: () => void;
};

export function AccountSettingsScreen({
  user,
  refreshing,
  onRefresh,
  onBack,
  editFullName,
  editPhone,
  editStudentEmail,
  editUniversityId,
  universities,
  defaultAvatarUrls,
  selectedDefaultAvatar,
  avatarLoading,
  saveLoading,
  profileAvatarUrl,
  onEditFullName,
  onEditPhone,
  onEditStudentEmail,
  onEditUniversityId,
  onSelectDefaultAvatar,
  onPickAvatar,
  onApplyDefaultAvatar,
  onSaveProfile,
  onSignOut,
}: Props) {
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  const selectedUniversityName = useMemo(() => {
    return universities.find((u) => u.id === editUniversityId)?.name || 'Select university';
  }, [editUniversityId, universities]);

  const filteredUniversities = useMemo(() => {
    const q = universitySearch.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => `${u.name} ${u.short_name || ''}`.toLowerCase().includes(q));
  }, [universitySearch, universities]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setSaveState('saving');
      const ok = await onSaveProfile({ silent: true });
      setSaveState(ok ? 'saved' : 'error');

      if (ok) {
        setTimeout(() => setSaveState('idle'), 1600);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, onSaveProfile]);

  return (
    <ScrollView
      contentContainerStyle={[styles.screenContent, { paddingBottom: 48 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {saveState === 'saving' || saveLoading ? <ActivityIndicator color="#38bdf8" size="small" /> : null}
          {saveState === 'saved' ? <Text style={{ color: '#22c55e', fontWeight: '800' }}>Saved ✓</Text> : null}
          {saveState === 'error' ? <Text style={{ color: '#ef4444', fontWeight: '800' }}>Save failed</Text> : null}
        </View>
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperCardTitle}>Account Info</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#64748b"
          value={editFullName}
          onChangeText={onEditFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone / WhatsApp"
          placeholderTextColor="#64748b"
          value={editPhone}
          onChangeText={onEditPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Student email"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="email-address"
          value={editStudentEmail}
          onChangeText={onEditStudentEmail}
        />
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>Account email: {user?.email || 'Not signed in'}</Text>

        <Text style={styles.fieldLabel}>University</Text>
        <Pressable
          onPress={() => setShowUniversityModal(true)}
          style={({ pressed }) => [
            styles.input,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={{ color: '#f8fafc', flex: 1 }} numberOfLines={1}>{selectedUniversityName}</Text>
          <MaterialIcons name="expand-more" size={20} color="#94a3b8" />
        </Pressable>
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperCardTitle}>Avatar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <FallbackImage
            uri={profileAvatarUrl}
            fallbackUri={PLACEHOLDER_IMAGE}
            style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: '#111827' }}
            contentFit="cover"
          />
          <Pressable style={styles.secondaryButton} onPress={onPickAvatar} disabled={avatarLoading}>
            {avatarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Pick photo</Text>}
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Default avatars</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {defaultAvatarUrls.map((avatarUrl, index) => {
            const isSelected = selectedDefaultAvatar === avatarUrl;
            return (
              <Pressable
                key={avatarUrl}
                onPress={() => onSelectDefaultAvatar(avatarUrl)}
                style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                accessibilityLabel={`Select avatar ${index + 1}`}
              >
                <FallbackImage
                  uri={avatarUrl}
                  fallbackUri={PLACEHOLDER_IMAGE}
                  style={styles.avatarOptionImage}
                  contentFit="cover"
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={styles.secondaryButton} onPress={onApplyDefaultAvatar} disabled={avatarLoading || !selectedDefaultAvatar}>
          {avatarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Apply selected avatar</Text>}
        </Pressable>
      </View>

      <View style={[styles.helperCard, { borderColor: 'rgba(239, 68, 68, 0.45)' }]}>
        <Text style={[styles.helperCardTitle, { color: '#fca5a5' }]}>Danger Zone</Text>
        <Pressable style={[styles.secondaryButton, { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={onSignOut}>
          <Text style={[styles.secondaryButtonText, { color: '#fca5a5' }]}>Sign out</Text>
        </Pressable>
      </View>

      <Modal visible={showUniversityModal} transparent animationType="fade" onRequestClose={() => setShowUniversityModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.7)', justifyContent: 'center', padding: 18 }}>
          <View style={{ backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', maxHeight: '75%', padding: 14 }}>
            <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '800', marginBottom: 10 }}>Choose university</Text>
            <TextInput
              style={styles.input}
              placeholder="Search university"
              placeholderTextColor="#64748b"
              value={universitySearch}
              onChangeText={setUniversitySearch}
            />
            <ScrollView style={{ marginTop: 10 }} keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={() => {
                  onEditUniversityId('');
                  setShowUniversityModal(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>None</Text>
              </Pressable>
              {filteredUniversities.map((uni) => (
                <Pressable
                  key={uni.id}
                  onPress={() => {
                    onEditUniversityId(uni.id);
                    setShowUniversityModal(false);
                  }}
                  style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}
                >
                  <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{uni.name}</Text>
                  {uni.short_name ? <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{uni.short_name}</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setShowUniversityModal(false)}
              style={{ marginTop: 12, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: '#38bdf8', fontWeight: '700' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
