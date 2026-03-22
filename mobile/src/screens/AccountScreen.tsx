import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { formatPrice, relativeDate } from '../lib/format';
import { styles } from '../lib/styles';
import type { Listing, Profile, UniversityRow } from '../types';
import type { User } from '@supabase/supabase-js';

type Props = {
  user: User | null;
  profile: Profile | null;
  universityName?: string;
  activeCount: number;
  soldCount: number;
  myListings: Listing[];
  email: string;
  password: string;
  fullName: string;
  phone: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setFullName: (value: string) => void;
  setPhone: (value: string) => void;
  authMode: 'sign-in' | 'sign-up';
  setAuthMode: (value: 'sign-in' | 'sign-up') => void;
  authLoading: boolean;
  onAuth: () => void;
  onSignOut: () => void;
  editFullName: string;
  editPhone: string;
  editStudentEmail: string;
  editUniversityId: string;
  universities: UniversityRow[];
  saveLoading: boolean;
  avatarLoading: boolean;
  onEditFullName: (value: string) => void;
  onEditPhone: (value: string) => void;
  onEditStudentEmail: (value: string) => void;
  onEditUniversityId: (value: string) => void;
  onSaveProfile: () => void;
  onPickAvatar: () => void;
  onMarkSold: (listingId: string) => void;
  onArchiveListing: (listingId: string) => void;
  onBumpListing: (listingId: string) => void;
};

export function AccountScreen(props: Props) {
  const {
    user,
    profile,
    universityName,
    activeCount,
    soldCount,
    myListings,
    email,
    password,
    fullName,
    phone,
    setEmail,
    setPassword,
    setFullName,
    setPhone,
    authMode,
    setAuthMode,
    authLoading,
    onAuth,
    onSignOut,
    editFullName,
    editPhone,
    editStudentEmail,
    editUniversityId,
    universities,
    saveLoading,
    avatarLoading,
    onEditFullName,
    onEditPhone,
    onEditStudentEmail,
    onEditUniversityId,
    onSaveProfile,
    onPickAvatar,
    onMarkSold,
    onArchiveListing,
    onBumpListing,
  } = props;

  if (user) {
    const verificationCopy = profile?.is_verified_student
      ? 'You are verified and ready to sell.'
      : profile?.student_email
      ? 'Student email linked. Approval is still pending.'
      : 'Link your student email to unlock selling.';

    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <SectionHeader
          eyebrow="Your Campus Cart"
          title="Account"
          body="Keep your seller details clean so buyers trust the person behind the listing."
        />

        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <Image
              source={{ uri: profile?.avatar_url || PLACEHOLDER_IMAGE }}
              style={styles.avatarLarge}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.full_name || user.email}</Text>
              <Text style={styles.profileMeta}>{user.email}</Text>
              <Text style={styles.profileMeta}>{universityName || 'No university linked yet'}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, profile?.is_verified_student ? styles.badgeVerified : styles.badgePending]}>
              <Text style={styles.badgeText}>{profile?.is_verified_student ? 'Verified student' : 'Verification pending'}</Text>
            </View>
            {profile?.is_pioneer_seller ? (
              <View style={[styles.badge, { backgroundColor: '#78350f' }]}>
                <Text style={styles.badgeText}>Pioneer seller</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.miniStatRow}>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>{activeCount}</Text>
              <Text style={styles.miniStatLabel}>active listings</Text>
            </View>
            <View style={styles.miniStatCard}>
              <Text style={styles.miniStatValue}>{soldCount}</Text>
              <Text style={styles.miniStatLabel}>items sold</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Seller verification</Text>
          <Text style={styles.statusBody}>{verificationCopy}</Text>
          <Text style={styles.helperText}>Student email: {profile?.student_email || 'Not linked yet'}</Text>
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.helperCardTitle}>My listings</Text>
          {myListings.length === 0 ? (
            <Text style={styles.helperText}>You haven’t posted anything yet. Once you publish a listing, it shows up here for management.</Text>
          ) : (
            myListings.map((listing) => (
              <View key={listing.id} style={styles.sellerListingCard}>
                <Text style={styles.sellerListingTitle}>{listing.title}</Text>
                <Text style={styles.profileMeta}>{formatPrice(listing.price)} • {listing.status || 'active'} • {relativeDate(listing.lastBumpedAt || listing.createdAt)}</Text>
                <Text style={styles.helperText} numberOfLines={2}>{listing.description}</Text>
                <View style={styles.actionRow}>
                  {listing.status !== 'sold' ? (
                    <Pressable style={styles.smallButton} onPress={() => onMarkSold(listing.id)}>
                      <Text style={styles.smallButtonText}>Mark sold</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.smallButton} onPress={() => onBumpListing(listing.id)}>
                    <Text style={styles.smallButtonText}>Bump listing</Text>
                  </Pressable>
                  <Pressable style={[styles.smallButton, styles.smallButtonDanger]} onPress={() => onArchiveListing(listing.id)}>
                    <Text style={styles.smallButtonText}>Archive</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.helperCardTitle}>Profile settings</Text>
          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#64748b" value={editFullName} onChangeText={onEditFullName} />
          <TextInput style={styles.input} placeholder="Phone / WhatsApp" placeholderTextColor="#64748b" value={editPhone} onChangeText={onEditPhone} />
          <TextInput style={styles.input} placeholder="Student email" placeholderTextColor="#64748b" autoCapitalize="none" value={editStudentEmail} onChangeText={onEditStudentEmail} />
          <Text style={styles.fieldLabel}>University</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable onPress={() => onEditUniversityId('')} style={[styles.chip, !editUniversityId && styles.chipActive]}>
              <Text style={[styles.chipText, !editUniversityId && styles.chipTextActive]}>None</Text>
            </Pressable>
            {universities.map((uni) => (
              <Pressable key={uni.id} onPress={() => onEditUniversityId(uni.id)} style={[styles.chip, editUniversityId === uni.id && styles.chipActive]}>
                <Text style={[styles.chipText, editUniversityId === uni.id && styles.chipTextActive]}>{uni.short_name || uni.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.secondaryButton} onPress={onPickAvatar} disabled={avatarLoading}>
            {avatarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Update avatar</Text>}
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onSaveProfile} disabled={saveLoading}>
            {saveLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save profile</Text>}
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onSignOut}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeader
        eyebrow="Welcome"
        title={authMode === 'sign-in' ? 'Sign In' : 'Create Account'}
        body="Browse with any email. Seller access unlocks after student verification."
      />
      {authMode === 'sign-up' && (
        <>
          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Phone / WhatsApp" placeholderTextColor="#64748b" value={phone} onChangeText={setPhone} />
        </>
      )}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.primaryButton} onPress={onAuth} disabled={authLoading}>
        {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{authMode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>}
      </Pressable>
      <Pressable onPress={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}>
        <Text style={styles.switchAuthText}>{authMode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}</Text>
      </Pressable>
    </ScrollView>
  );
}
