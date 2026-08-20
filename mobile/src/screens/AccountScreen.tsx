import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { FallbackImage } from '../components/FallbackImage';
import { ListingEditCard } from '../components/ListingEditCard';
import { ProfileListingCard } from '../components/profile/ProfileListingCard';
import { ProfileStatCard } from '../components/profile/ProfileStatCard';
import { SectionHeader } from '../components/SectionHeader';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { radius, text, useStyles, useTheme } from '../lib/styles';
import type { Listing, Profile, UniversityRow } from '../types';
import type { User } from '@supabase/supabase-js';
import { formatPrice } from '../lib/format';

type Props = {
  user: User | null;
  profile: Profile | null;
  universityName?: string;
  activeCount: number;
  soldCount: number;
  myListings: Listing[];
  savedListings: Listing[];
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
  authEmailCooldownLeft: number;
  onAuth: () => void;
  onGoogleAuth: () => void;
  resetEmail: string;
  setResetEmail: (value: string) => void;
  resetLoading: boolean;
  resetEmailCooldownLeft: number;
  onRequestPasswordReset: () => void;
  onSignOut: () => void;
  editFullName: string;
  editPhone: string;
  editStudentEmail: string;
  editUniversityId: string;
  universities: UniversityRow[];
  saveLoading: boolean;
  avatarLoading: boolean;
  defaultAvatarUrls: string[];
  selectedDefaultAvatar: string | null;
  onEditFullName: (value: string) => void;
  onEditPhone: (value: string) => void;
  onEditStudentEmail: (value: string) => void;
  onEditUniversityId: (value: string) => void;
  onSaveProfile: () => void;
  onPickAvatar: () => void;
  onSelectDefaultAvatar: (url: string) => void;
  onApplyDefaultAvatar: () => void;
  onMarkSold: (listingId: string) => void;
  onArchiveListing: (listingId: string) => void;
  onBumpListing: (listingId: string) => void;
  onRelistListing: (listingId: string) => void;
  onUpdateListing: (listingId: string, payload: { title: string; description: string; price: number }) => void;
  onOpenSettings: () => void;
  refreshing: boolean;
  onRefresh: () => void;
};

export function AccountScreen(props: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const {
    user,
    profile,
    universityName,
    activeCount,
    soldCount,
    myListings,
    savedListings,
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
    authEmailCooldownLeft,
    onAuth,
    onGoogleAuth,
    resetEmail,
    setResetEmail,
    resetLoading,
    resetEmailCooldownLeft,
    onRequestPasswordReset,
    onSignOut,
    editFullName,
    editPhone,
    editStudentEmail,
    editUniversityId,
    universities,
    saveLoading,
    avatarLoading,
    defaultAvatarUrls,
    selectedDefaultAvatar,
    onEditFullName,
    onEditPhone,
    onEditStudentEmail,
    onEditUniversityId,
    onSaveProfile,
    onPickAvatar,
    onSelectDefaultAvatar,
    onApplyDefaultAvatar,
    onMarkSold,
    onArchiveListing,
    onBumpListing,
    onRelistListing,
    onUpdateListing,
    onOpenSettings,
    refreshing,
    onRefresh,
  } = props;

  const [showActive, setShowActive] = useState(true);
  const [showSold, setShowSold] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const activeListings = useMemo(() => myListings.filter((listing) => listing.status === 'active'), [myListings]);
  const soldListings = useMemo(() => myListings.filter((listing) => listing.status === 'sold'), [myListings]);
  const archivedListings = useMemo(() => myListings.filter((listing) => listing.status === 'archived'), [myListings]);

  if (user) {
    const totalEarnings = myListings.filter((listing) => listing.status === 'sold').reduce((sum, listing) => sum + listing.price, 0);
    const totalViews = myListings.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
    const conversionRate = myListings.length === 0 ? 0 : Math.round((soldCount / myListings.length) * 100);

    const bio =
      profile?.is_pioneer_seller
        ? 'Pioneer CampusCart seller focused on quality listings and fast replies.'
        : 'Reliable campus seller sharing great deals for students.';

    return (
      <ScrollView
        contentContainerStyle={styles.screenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeader title="Profile" body="Your public seller presence." />
          <Pressable
            onPress={onOpenSettings}
            style={({ pressed }) => [
              {
                width: 42,
                height: 42,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.line,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <MaterialIcons name="settings" size={20} color={colors.fg} />
          </Pressable>
        </View>

        <View style={[styles.profileCard, { borderRadius: radius.md }]}> 
          <View style={styles.profileTopRow}>
            <FallbackImage
              uri={profile?.avatar_url}
              fallbackUri={PLACEHOLDER_IMAGE}
              style={styles.avatarLarge}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.full_name || user.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Text style={{ color: colors.fg, fontWeight: '700' }}>0.0</Text>
                <Text style={{ color: colors.muted }}>No ratings yet</Text>
                <Text style={{ color: colors.muted }}>• {soldCount} sales</Text>
              </View>
              <Text style={styles.profileMeta}>{universityName || 'No institution linked'}</Text>
              <Text style={[styles.profileMeta, { lineHeight: 20 }]}>{bio}</Text>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <View
                  style={{
                    borderRadius: radius.full,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: profile?.is_verified_student ? colors.accent : colors.line,
                  }}
                >
                  <Text
                    style={{
                      color: profile?.is_verified_student ? colors.accent : colors.muted,
                      fontSize: text.xs,
                      fontWeight: '800',
                    }}
                  >
                    {profile?.is_verified_student ? 'Verified student' : 'Verification pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ProfileStatCard label="Active listings" value={String(activeCount)} />
          <ProfileStatCard label="Items sold" value={String(soldCount)} tone="success" />
          <ProfileStatCard label="Total earnings" value={formatPrice(totalEarnings)} tone="warning" />
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.helperCardTitle}>Performance insights</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ProfileStatCard label="Total views" value={String(totalViews)} />
            <ProfileStatCard label="Sell-through" value={`${conversionRate}%`} tone="success" />
            <ProfileStatCard label="Avg. rating" value="0.0" tone="warning" />
          </View>
        </View>

        <View style={styles.helperCard}>
          <Pressable style={styles.rowBetween} onPress={() => setShowActive((current) => !current)}>
            <Text style={styles.helperCardTitle}>Active listings ({activeListings.length})</Text>
            <MaterialIcons name={showActive ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
          </Pressable>
          {showActive ? (
            activeListings.length === 0 ? (
              <Text style={styles.helperText}>No active listings.</Text>
            ) : (
              activeListings.map((listing) => (
                <ProfileListingCard
                  key={listing.id}
                  listing={listing}
                  onMarkSold={onMarkSold}
                  onBumpListing={onBumpListing}
                  onArchiveListing={onArchiveListing}
                  onRelist={onRelistListing}
                  onEditListing={setEditingListing}
                />
              ))
            )
          ) : null}
        </View>

        <View style={styles.helperCard}>
          <Pressable style={styles.rowBetween} onPress={() => setShowSold((current) => !current)}>
            <Text style={styles.helperCardTitle}>Sold listings ({soldListings.length})</Text>
            <MaterialIcons name={showSold ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
          </Pressable>
          {showSold ? (
            soldListings.length === 0 ? (
              <Text style={styles.helperText}>No sold listings yet.</Text>
            ) : (
              soldListings.map((listing) => (
                <ProfileListingCard
                  key={listing.id}
                  listing={listing}
                  onMarkSold={onMarkSold}
                  onBumpListing={onBumpListing}
                  onArchiveListing={onArchiveListing}
                  onRelist={onRelistListing}
                  onEditListing={setEditingListing}
                />
              ))
            )
          ) : null}
        </View>

        <View style={styles.helperCard}>
          <Pressable style={styles.rowBetween} onPress={() => setShowArchived((current) => !current)}>
            <Text style={styles.helperCardTitle}>Archived listings ({archivedListings.length})</Text>
            <MaterialIcons name={showArchived ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
          </Pressable>
          {showArchived ? (
            archivedListings.length === 0 ? (
              <Text style={styles.helperText}>No archived listings.</Text>
            ) : (
              archivedListings.map((listing) => (
                <ProfileListingCard
                  key={listing.id}
                  listing={listing}
                  onMarkSold={onMarkSold}
                  onBumpListing={onBumpListing}
                  onArchiveListing={onArchiveListing}
                  onRelist={onRelistListing}
                  onEditListing={setEditingListing}
                />
              ))
            )
          ) : null}
        </View>

        <View style={styles.helperCard}>
          <Pressable style={styles.rowBetween} onPress={() => setShowSaved((current) => !current)}>
            <Text style={styles.helperCardTitle}>Saved listings ({savedListings.length})</Text>
            <MaterialIcons name={showSaved ? 'expand-less' : 'expand-more'} size={20} color={colors.muted} />
          </Pressable>
          {showSaved ? (
            savedListings.length === 0 ? (
              <Text style={styles.helperText}>No saved listings yet.</Text>
            ) : (
              savedListings.map((listing) => (
                <View key={listing.id} style={styles.profileCard}>
                  <Text style={styles.profileName}>{listing.title}</Text>
                  <Text style={styles.profileMeta}>{listing.category} • {formatPrice(listing.price)}</Text>
                </View>
              ))
            )
          ) : null}
        </View>

        <ListingEditCard
          visible={!!editingListing}
          listing={editingListing}
          saving={saveLoading}
          onClose={() => setEditingListing(null)}
          onSave={(payload) => {
            if (!editingListing) return;
            onUpdateListing(editingListing.id, payload);
            setEditingListing(null);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />}
    >
      {authMode === 'sign-up' && (
        <>
          <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={fullName} onChangeText={setFullName} />
          <TextInput
            style={styles.input}
            placeholder="Phone (local, e.g. 97xxxxxxx or 77xxxxxxx)"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text style={styles.helperText}>Stored as +260 automatically.</Text>
        </>
      )}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.primaryButton} onPress={onAuth} disabled={authLoading || (authMode === 'sign-up' && authEmailCooldownLeft > 0)}>
        {authLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>{authMode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>}
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onGoogleAuth} disabled={authLoading}>
        {authLoading ? <ActivityIndicator color={colors.fg} /> : <Text style={styles.secondaryButtonText}>Continue with Google</Text>}
      </Pressable>
      {authMode === 'sign-up' && authEmailCooldownLeft > 0 ? (
        <Text style={styles.helperText}>Resend available in {authEmailCooldownLeft}s</Text>
      ) : null}
      <Pressable onPress={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}>
        <Text style={styles.switchAuthText}>{authMode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}</Text>
      </Pressable>

      {authMode === 'sign-in' ? (
        <View style={styles.helperCard}>
          <Text style={styles.helperCardTitle}>Forgot password?</Text>
          <Text style={styles.helperText}>Enter your account email and we will send a password reset link.</Text>
          <TextInput
            style={styles.input}
            placeholder="Reset email"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={resetEmail}
            onChangeText={setResetEmail}
          />
          <Pressable style={styles.secondaryButton} onPress={onRequestPasswordReset} disabled={resetLoading || resetEmailCooldownLeft > 0}>
            {resetLoading ? <ActivityIndicator color={colors.fg} /> : <Text style={styles.secondaryButtonText}>Send reset email</Text>}
          </Pressable>
          {resetEmailCooldownLeft > 0 ? (
            <Text style={styles.helperText}>Resend available in {resetEmailCooldownLeft}s</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
