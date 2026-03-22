import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { CATEGORY_OPTIONS } from '../lib/constants';
import { styles } from '../lib/styles';
import type { PickedImage } from '../lib/imageUpload';
import type { Profile } from '../types';
import type { User } from '@supabase/supabase-js';

type Props = {
  user: User | null;
  profile: Profile | null;
  sellTitle: string;
  setSellTitle: (value: string) => void;
  sellDescription: string;
  setSellDescription: (value: string) => void;
  sellPrice: string;
  setSellPrice: (value: string) => void;
  sellCategory: string;
  setSellCategory: (value: string) => void;
  listingImages: PickedImage[];
  pickingImages: boolean;
  submitting: boolean;
  onPickImages: () => void;
  onSubmit: () => void;
};

export function SellScreen({
  user,
  profile,
  sellTitle,
  setSellTitle,
  sellDescription,
  setSellDescription,
  sellPrice,
  setSellPrice,
  sellCategory,
  setSellCategory,
  listingImages,
  pickingImages,
  submitting,
  onPickImages,
  onSubmit,
}: Props) {
  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Sign in before posting</Text>
          <Text style={styles.noticeBody}>This clean mobile rebuild keeps the same rule as the web app: browsing is open, posting requires an account.</Text>
        </View>
      </ScrollView>
    );
  }

  if (!profile?.is_verified_student) {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Verified seller access required</Text>
          <Text style={styles.noticeBody}>You can browse with any email, but only verified students can create listings. That mirrors the web version and keeps scam risk lower.</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>What to do next</Text>
          <Text style={styles.statusBody}>
            Add your student email in the Account tab, choose your university, and save your profile. Once verification is approved, this screen becomes your seller studio.
          </Text>
          <Text style={styles.helperText}>Linked student email: {profile?.student_email || 'Not linked yet'}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeader
        eyebrow="Seller studio"
        title="Post a Listing"
        body="Keep it clear, honest, and photo-first. Better listings usually convert much faster."
      />

      <View style={styles.helperCard}>
        <Text style={styles.helperCardTitle}>Before you publish</Text>
        <Text style={styles.helperText}>Use a specific title, mention condition, and lead with your best image. Students scan fast.</Text>
      </View>

      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="Listing title" placeholderTextColor="#64748b" value={sellTitle} onChangeText={setSellTitle} />
        <TextInput style={[styles.input, styles.multilineInput]} multiline placeholder="Describe the item or service" placeholderTextColor="#64748b" value={sellDescription} onChangeText={setSellDescription} />
        <TextInput style={styles.input} placeholder="Price in ZMW" placeholderTextColor="#64748b" keyboardType="numeric" value={sellPrice} onChangeText={setSellPrice} />
      </View>

      <View style={styles.divider} />

      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORY_OPTIONS.map((item) => (
          <Pressable key={item} onPress={() => setSellCategory(item)} style={[styles.categoryChoice, sellCategory === item && styles.categoryChoiceActive]}>
            <Text style={[styles.categoryChoiceText, sellCategory === item && styles.categoryChoiceTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.fieldLabel}>Images</Text>
      <Pressable style={styles.secondaryButton} onPress={onPickImages} disabled={pickingImages}>
        {pickingImages ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Pick listing images</Text>}
      </Pressable>
      <Text style={styles.helperText}>Add up to 5 images. These are uploaded after the listing is created.</Text>
      {listingImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {listingImages.map((image) => (
            <Image key={image.uri} source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Publish listing</Text>}
      </Pressable>
    </ScrollView>
  );
}
