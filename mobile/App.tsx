import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Session, User } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Linking, SafeAreaView, Text, View } from 'react-native';
import { AccountScreen } from './src/screens/AccountScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { FeedbackModal } from './src/components/FeedbackModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { AccountSettingsScreen } from './src/screens/AccountSettingsScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen';
import { SellerProfileScreen } from './src/screens/SellerProfileScreen';
import { SellScreen } from './src/screens/SellScreen';
import { pickImages, uploadListingImages, type PickedImage } from './src/lib/imageUpload';
import { fetchDefaultAvatars, pickSingleProfileImage, uploadProfileAvatar } from './src/lib/profileUpload';
import { registerPushToken } from './src/lib/pushNotifications';
import { sendPasswordResetEmail, signInWithGoogle, signInWithPassword, signUpWithEmail } from './src/lib/authService';
import { generateWhatsAppLink, normalizeZambiaPhoneForStorage } from './src/lib/whatsapp';
import { useOtpCooldown } from './src/hooks/useOtpCooldown';
import { getFavoriteIds, toggleFavorite } from './src/lib/favorites';
import { CATEGORY_OPTIONS, LISTING_SELECT } from './src/lib/constants';
import { mapListing } from './src/lib/mappers';
import { getSellerReviews, upsertSellerReview } from './src/lib/reviews';
import { colors, styles } from './src/lib/styles';
import { supabase } from './src/lib/supabase';
import type { CategoryRow, Listing, MainTabParamList, Profile, RootStackParamList, SellerRatingSummary, SellerReview, UniversityRow } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const MAX_LISTING_IMAGES = 5;

function MainTabsNavigator(props: any) {
  const {
    featuredListings,
    nearbyListings,
    query,
    selectedCategory,
    listingType,
    maxPrice,
    sortBy,
    favoritesOnly,
    favoriteIds,
    user,
    handleToggleFavorite,
    setQuery,
    setSelectedCategory,
    setListingType,
    setMaxPrice,
    setSortBy,
    setFavoritesOnly,
    filteredListings,
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
    sellSubmitting,
    handlePickImages,
    handleCreateListing,
    AboutScreen,
    AccountScreen,
    universityName,
    activeCount,
    soldCount,
    userListings,
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
    handleAuth,
    handleGoogleAuth,
    resetEmail,
    setResetEmail,
    resetLoading,
    resetEmailCooldownLeft,
    handlePasswordReset,
    signOut,
    editFullName,
    editPhone,
    editStudentEmail,
    editUniversityId,
    universities,
    saveLoading,
    avatarLoading,
    defaultAvatarUrls,
    selectedDefaultAvatar,
    setEditFullName,
    setEditPhone,
    setEditStudentEmail,
    setEditUniversityId,
    handleSaveProfile,
    handlePickAvatar,
    setSelectedDefaultAvatar,
    handleApplyDefaultAvatar,
    updateListingStatus,
    handleUpdateListing,
    refreshingFeed,
    refreshingAccount,
    handleRefreshFeed,
    handleRefreshAccount,
    handleContactSeller,
    listingLoadError,
    showFeedbackModal,
  } = props;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          borderTopColor: 'rgba(148, 163, 184, 0.15)',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              color: focused ? '#3b82f6' : '#9ca3af',
              fontSize: 12,
              fontWeight: '700',
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Browse') iconName = 'search';
          if (route.name === 'Sell') iconName = 'add-circle-outline';
          if (route.name === 'About') iconName = 'info-outline';
          if (route.name === 'Account') iconName = 'person-outline';
          return (
            <View style={{ transform: [{ scale: color === '#3b82f6' ? 1.1 : 1 }] }}>
              <MaterialIcons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="shopping-cart" size={20} color={colors.secondary} />
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>CampusCart</Text>
            </View>
          ),
        }}
      >
        {({ navigation }) => (
          <HomeScreen
            featuredListings={featuredListings}
            nearbyListings={nearbyListings}
            refreshing={refreshingFeed}
            onRefresh={handleRefreshFeed}
            onFilterPress={() => showFeedbackModal('Filters', 'Advanced filters are currently disabled.', 'tune')}
            onOpenListing={(listing) => navigation.getParent()?.navigate('ListingDetail', { listing })}
            onBrowsePress={() => navigation.navigate('Browse')}
            onSellPress={() => navigation.navigate('Sell')}
            onCategoryPress={(category) => {
              setFavoritesOnly(false);
              setSelectedCategory(category);
              navigation.navigate('Browse');
            }}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Browse">
        {({ navigation }) => (
          <BrowseScreen
            query={query}
            selectedCategory={selectedCategory}
            listingType={listingType}
            maxPrice={maxPrice}
            sortBy={sortBy}
            favoritesOnly={favoritesOnly}
            favoriteCount={favoriteIds.length}
            setQuery={setQuery}
            setSelectedCategory={setSelectedCategory}
            setListingType={setListingType}
            setMaxPrice={setMaxPrice}
            setSortBy={setSortBy}
            setFavoritesOnly={setFavoritesOnly}
            listings={filteredListings}
            favoriteIds={favoriteIds}
            canFavorite={!!user}
            refreshing={refreshingFeed}
            onRefresh={handleRefreshFeed}
            onToggleFavorite={handleToggleFavorite}
            onOpenListing={(listing) => navigation.getParent()?.navigate('ListingDetail', { listing })}
            onMessagePress={(listing) => handleContactSeller(listing)}
            error={listingLoadError}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Sell">
        {() => (
          <SellScreen
            user={user}
            profile={props.profile}
            sellTitle={sellTitle}
            setSellTitle={setSellTitle}
            sellDescription={sellDescription}
            setSellDescription={setSellDescription}
            sellPrice={sellPrice}
            setSellPrice={setSellPrice}
            sellCategory={sellCategory}
            setSellCategory={setSellCategory}
            listingImages={listingImages}
            pickingImages={pickingImages}
            submitting={sellSubmitting}
            onPickImages={handlePickImages}
            onSubmit={handleCreateListing}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="About">{() => <AboutScreen />}</Tab.Screen>
      <Tab.Screen name="Account">
        {({ navigation }) => (
          <AccountScreen
            user={user}
            profile={props.profile}
            universityName={universityName}
            activeCount={activeCount}
            soldCount={soldCount}
            myListings={userListings}
            savedListings={savedListings}
            email={email}
            password={password}
            fullName={fullName}
            phone={phone}
            setEmail={setEmail}
            setPassword={setPassword}
            setFullName={setFullName}
            setPhone={setPhone}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authLoading={authLoading}
            authEmailCooldownLeft={authEmailCooldownLeft}
            onAuth={handleAuth}
            onGoogleAuth={handleGoogleAuth}
            resetEmail={resetEmail}
            setResetEmail={setResetEmail}
            resetLoading={resetLoading}
            resetEmailCooldownLeft={resetEmailCooldownLeft}
            onRequestPasswordReset={handlePasswordReset}
            onSignOut={signOut}
            editFullName={editFullName}
            editPhone={editPhone}
            editStudentEmail={editStudentEmail}
            editUniversityId={editUniversityId}
            universities={universities}
            saveLoading={saveLoading}
            avatarLoading={avatarLoading}
            defaultAvatarUrls={defaultAvatarUrls}
            selectedDefaultAvatar={selectedDefaultAvatar}
            onEditFullName={setEditFullName}
            onEditPhone={setEditPhone}
            onEditStudentEmail={setEditStudentEmail}
            onEditUniversityId={setEditUniversityId}
            onSaveProfile={handleSaveProfile}
            onPickAvatar={handlePickAvatar}
            onSelectDefaultAvatar={setSelectedDefaultAvatar}
            onApplyDefaultAvatar={handleApplyDefaultAvatar}
            onMarkSold={(listingId: string) => updateListingStatus(listingId, { status: 'sold' }, 'Marked as sold.')}
            onArchiveListing={(listingId: string) => updateListingStatus(listingId, { status: 'archived' }, 'Listing archived.')}
            onBumpListing={(listingId: string) => updateListingStatus(listingId, { last_bumped_at: new Date().toISOString() }, 'Listing bumped to the top.')}
            onRelistListing={(listingId: string) => updateListingStatus(listingId, { status: 'active' }, 'Listing relisted.')}
            onUpdateListing={handleUpdateListing}
            onOpenSettings={() => navigation.getParent()?.navigate('AccountSettings')}
            refreshing={refreshingAccount}
            onRefresh={handleRefreshAccount}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [featuredHomeListings, setFeaturedHomeListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [listingType, setListingType] = useState<'all' | 'products' | 'services'>('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authLoading, setAuthLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [sellTitle, setSellTitle] = useState('');
  const [sellDescription, setSellDescription] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellCategory, setSellCategory] = useState<string>(CATEGORY_OPTIONS[2]);
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [listingImages, setListingImages] = useState<PickedImage[]>([]);
  const [pickingImages, setPickingImages] = useState(false);
  const [dbCategories, setDbCategories] = useState<CategoryRow[]>([]);
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicSeller, setPublicSeller] = useState<Profile | null>(null);
  const [publicSellerListings, setPublicSellerListings] = useState<Listing[]>([]);
  const [publicSellerReviews, setPublicSellerReviews] = useState<SellerReview[]>([]);
  const [publicSellerRatingSummary, setPublicSellerRatingSummary] = useState<SellerRatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [defaultAvatarUrls, setDefaultAvatarUrls] = useState<string[]>([]);
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<string | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState(false);
  const [refreshingAccount, setRefreshingAccount] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editUniversityId, setEditUniversityId] = useState('');
  const [signedInToastVisible, setSignedInToastVisible] = useState(false);
  const [listingLoadError, setListingLoadError] = useState<string | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackModalTitle, setFeedbackModalTitle] = useState('Notice');
  const [feedbackModalMessage, setFeedbackModalMessage] = useState('');
  const [feedbackModalIcon, setFeedbackModalIcon] = useState<keyof typeof MaterialIcons.glyphMap>('info-outline');
  const processedOAuthCodesRef = useRef<Set<string>>(new Set());
  const loadingCartProgress = useRef(new Animated.Value(0)).current;
  const { canResend: canSendAuthEmail, timeLeft: authEmailCooldownLeft, startCooldown: startAuthEmailCooldown } = useOtpCooldown({
    storageKey: 'auth_signup_email_cooldown',
    cooldownSeconds: 60,
  });
  const { canResend: canSendResetEmail, timeLeft: resetEmailCooldownLeft, startCooldown: startResetEmailCooldown } = useOtpCooldown({
    storageKey: 'auth_reset_email_cooldown',
    cooldownSeconds: 60,
  });

  const showFeedbackModal = useCallback((title: string, message: string, icon: keyof typeof MaterialIcons.glyphMap = 'info-outline') => {
    setFeedbackModalTitle(title);
    setFeedbackModalMessage(message);
    setFeedbackModalIcon(icon);
    setFeedbackModalVisible(true);
  }, []);

  const openThemedAlert = useCallback(
    (title: string, message: string, icon: keyof typeof MaterialIcons.glyphMap = 'info-outline') => {
      showFeedbackModal(title, message, icon);
    },
    [showFeedbackModal]
  );

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, is_verified_student, is_pioneer_seller, university_id, student_email, student_email_requested_at, student_email_verified_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('profile-load-error', error.message);
      setProfile(null);
      return;
    }

    if (!data) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.id === userId) {
        const fallbackName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'CampusCart User';
        await supabase.from('profiles').upsert(
          {
            id: userId,
            full_name: fallbackName,
            phone: authUser.user_metadata?.phone ?? null,
          },
          { onConflict: 'id' }
        );

        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url, is_verified_student, is_pioneer_seller, university_id, student_email, student_email_requested_at, student_email_verified_at')
          .eq('id', userId)
          .maybeSingle();

        const ensuredProfile = (createdProfile as Profile | null) ?? null;
        setProfile(ensuredProfile);
        setEditFullName(ensuredProfile?.full_name ?? fallbackName);
        setEditPhone(ensuredProfile?.phone ?? '');
        setEditStudentEmail(ensuredProfile?.student_email ?? '');
        setEditUniversityId(ensuredProfile?.university_id ?? '');
        return;
      }
    }

    const nextProfile = data as Profile | null;
    setProfile(nextProfile);
    setEditFullName(nextProfile?.full_name ?? '');
    setEditPhone(nextProfile?.phone ?? '');
    setEditStudentEmail(nextProfile?.student_email ?? '');
    setEditUniversityId(nextProfile?.university_id ?? '');
  }, []);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name').order('name');
    if (!error && data) setDbCategories(data as CategoryRow[]);
  }, []);

  const loadUniversities = useCallback(async () => {
    const { data, error } = await supabase.from('universities').select('id, name, short_name').order('name');
    if (!error && data) setUniversities(data as UniversityRow[]);
  }, []);

  const loadSellerProfile = useCallback(async (sellerId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, is_verified_student, is_pioneer_seller, university_id, student_email, student_email_requested_at, student_email_verified_at')
      .eq('id', sellerId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    setPublicSeller((data as Profile | null) ?? null);

    const { data: listingRows, error: listingsError } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('seller_id', sellerId)
      .is('deleted_at', null)
      .order('last_bumped_at', { ascending: false });

    if (listingsError) throw new Error(listingsError.message);
    setPublicSellerListings(((listingRows ?? []) as any[]).map(mapListing));

    const reviewPayload = await getSellerReviews(sellerId);
    setPublicSellerReviews(reviewPayload.reviews);
    setPublicSellerRatingSummary(reviewPayload.summary);
  }, []);

  const handleSubmitSellerReview = useCallback(async (payload: { rating: number; reviewText: string }) => {
    if (!user?.id || !publicSeller?.id) {
      openThemedAlert('Sign in required', 'Please sign in before leaving a review.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await upsertSellerReview({
        sellerId: publicSeller.id,
        reviewerId: user.id,
        rating: payload.rating,
        reviewText: payload.reviewText,
      });

      const updated = await getSellerReviews(publicSeller.id);
      setPublicSellerReviews(updated.reviews);
      setPublicSellerRatingSummary(updated.summary);
      openThemedAlert('Review saved', 'Thanks for sharing your feedback.');
    } catch (error) {
      openThemedAlert('Could not save review', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  }, [publicSeller?.id, user?.id]);

  const loadDefaultAvatars = useCallback(async () => {
    try {
      const urls = await fetchDefaultAvatars();
      setDefaultAvatarUrls(urls);
      if (!selectedDefaultAvatar && urls[0]) {
        setSelectedDefaultAvatar(urls[0]);
      }
    } catch (error) {
      console.warn('default-avatar-load-error', error);
    }
  }, [selectedDefaultAvatar]);

  const loadFavorites = useCallback(async (userId?: string) => {
    if (!userId) {
      setFavoriteIds([]);
      return;
    }
    try {
      const ids = await getFavoriteIds(userId);
      setFavoriteIds(ids);
    } catch (error) {
      console.warn('favorite-load-error', error);
    }
  }, []);

  const setSignupPhoneInput = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    const withoutCountry = digits.startsWith('260') ? digits.slice(3) : digits;
    const withoutLeadingZero = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry;
    setPhone(withoutLeadingZero.slice(0, 9));
  }, []);

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('last_bumped_at', { ascending: false })
      .limit(40);

    if (error) {
      console.warn('listing-load-error', error.message);
      setListingLoadError(error.message);
      return;
    }

    setListingLoadError(null);
    setListings(((data ?? []) as any[]).map(mapListing));
  }, []);

  const loadMyListings = useCallback(async (userId?: string) => {
    if (!userId) {
      setMyListings([]);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('seller_id', userId)
      .order('updated_at', { ascending: false })
      .limit(120);

    if (error) {
      console.warn('my-listing-load-error', error.message);
      return;
    }

    const fetchedListings = ((data ?? []) as any[]).map(mapListing);
    setMyListings((current) => {
      const fetchedIds = new Set(fetchedListings.map((listing) => listing.id));
      const retainedNonActive = current.filter((listing) => listing.status !== 'active' && !fetchedIds.has(listing.id));
      return [...fetchedListings, ...retainedNonActive].sort(
        (a, b) => new Date(b.lastBumpedAt || b.createdAt).getTime() - new Date(a.lastBumpedAt || a.createdAt).getTime()
      );
    });
  }, []);

  const loadFeaturedHomeListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('status', 'active')
      .eq('featured', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(16);

    if (error) {
      console.warn('featured-listing-load-error', error.message);
      return;
    }

    setFeaturedHomeListings(((data ?? []) as any[]).map(mapListing));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        loadMyListings(data.session.user.id);
        loadFavorites(data.session.user.id);
        registerPushToken(data.session.user.id).catch(() => undefined);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
        loadMyListings(nextSession.user.id);
        loadFavorites(nextSession.user.id);
        registerPushToken(nextSession.user.id).catch(() => undefined);
      } else {
        setProfile(null);
        setMyListings([]);
        setFavoriteIds([]);
      }
    });

    Promise.all([loadListings(), loadFeaturedHomeListings(), loadCategories(), loadUniversities(), loadDefaultAvatars()]).finally(() => setLoading(false));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCategories, loadDefaultAvatars, loadFavorites, loadFeaturedHomeListings, loadListings, loadMyListings, loadProfile, loadUniversities]);

  useEffect(() => {
    const completeOAuthFromLink = async (url: string) => {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (!code) return;

        if (processedOAuthCodesRef.current.has(code)) {
          return;
        }
        processedOAuthCodesRef.current.add(code);

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          processedOAuthCodesRef.current.delete(code);
          openThemedAlert('Google sign-in failed', error.message);
        }
      } catch (error) {
        console.warn('oauth-link-parse-error', error);
      }
    };

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      completeOAuthFromLink(url).catch(() => undefined);
    });

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (!initialUrl) return;
        completeOAuthFromLink(initialUrl).catch(() => undefined);
      })
      .catch(() => undefined);

    return () => {
      linkingSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingCartProgress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(loadingCartProgress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [loading, loadingCartProgress]);

  useEffect(() => {
    if (!signedInToastVisible) return;

    const timer = setTimeout(() => {
      setSignedInToastVisible(false);
    }, 2600);

    return () => clearTimeout(timer);
  }, [signedInToastVisible]);

  const featuredListings = useMemo(() => featuredHomeListings, [featuredHomeListings]);
  const nearbyListings = useMemo(() => listings.slice(0, 6), [listings]);
  const userListings = useMemo(() => myListings, [myListings]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const activeCount = useMemo(() => userListings.filter((listing) => listing.status === 'active').length, [userListings]);
  const soldCount = useMemo(() => userListings.filter((listing) => listing.status === 'sold').length, [userListings]);
  const savedListings = useMemo(() => listings.filter((listing) => favoriteIdSet.has(listing.id)), [favoriteIdSet, listings]);
  const universityName = useMemo(() => universities.find((uni) => uni.id === profile?.university_id)?.name, [universities, profile?.university_id]);

  const filteredListings = useMemo(
    () => {
      const filtered = listings.filter((listing) => {
        const q = query.trim().toLowerCase();
        const maxPriceValue = Number(maxPrice);
        const matchesQuery =
          !q ||
          listing.title.toLowerCase().includes(q) ||
          listing.description.toLowerCase().includes(q) ||
          listing.category.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
        const matchesType =
          listingType === 'all' ||
          (listingType === 'products' && !listing.isService) ||
          (listingType === 'services' && listing.isService);
        const matchesPrice = !maxPrice || Number.isNaN(maxPriceValue) || listing.price <= maxPriceValue;
        const matchesFavorites = !favoritesOnly || favoriteIdSet.has(listing.id);
        return matchesQuery && matchesCategory && matchesType && matchesPrice && matchesFavorites;
      });

      if (sortBy === 'price-asc') {
        return [...filtered].sort((a, b) => a.price - b.price);
      }
      if (sortBy === 'price-desc') {
        return [...filtered].sort((a, b) => b.price - a.price);
      }
      return [...filtered].sort(
        (a, b) => new Date(b.lastBumpedAt || b.createdAt).getTime() - new Date(a.lastBumpedAt || a.createdAt).getTime()
      );
    },
    [favoriteIdSet, favoritesOnly, listingType, listings, maxPrice, query, selectedCategory, sortBy]
  );

  const handleAuth = useCallback(async () => {
    if (authLoading) return;

    if (!email || !password) {
      openThemedAlert('Missing details', 'Please enter your email and password.');
      return;
    }

    if (authMode === 'sign-up' && !fullName) {
      openThemedAlert('Missing name', 'Please enter your full name to create an account.');
      return;
    }

    if (authMode === 'sign-up') {
      const normalizedPhone = normalizeZambiaPhoneForStorage(phone);
      if (!normalizedPhone) {
        openThemedAlert('Phone required', 'Enter a valid local Zambia number like 97xxxxxxx.');
        return;
      }
    }

    if (authMode === 'sign-up' && !canSendAuthEmail) {
      openThemedAlert('Please wait', `Too many requests. Please wait ${authEmailCooldownLeft}s before trying again.`);
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'sign-in') {
        await signInWithPassword(email.trim(), password);
        setSignedInToastVisible(true);
        return;
      }

      const normalizedPhone = normalizeZambiaPhoneForStorage(phone);
      const data = await signUpWithEmail(email.trim(), password, fullName, normalizedPhone ?? undefined);
      await startAuthEmailCooldown();

      if (data.user?.id) {
        try {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone: normalizedPhone ?? null });
        } catch (profileError) {
          console.warn('[AUTH] Profile creation error:', profileError);
          // Don't fail the signup if profile creation fails - user can update later
        }
      }

      setAuthMode('sign-in');
      openThemedAlert('Check your email', 'Check your email for the login code or confirmation link, then sign in.');
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      openThemedAlert('Authentication error', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [authLoading, authMode, authEmailCooldownLeft, canSendAuthEmail, email, fullName, password, phone, startAuthEmailCooldown]);

  const handleGoogleAuth = useCallback(async () => {
    if (authLoading) return;

    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      openThemedAlert('Google sign-in failed', err instanceof Error ? err.message : 'Could not continue with Google.');
    } finally {
      setAuthLoading(false);
    }
  }, [authLoading]);

  const signOut = useCallback(async () => {
    if (user?.id) {
      await supabase
        .from('push_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }
    await supabase.auth.signOut();
    setSession(null);
    openThemedAlert('Signed out', 'You have been signed out.');
  }, [user?.id]);

  const handlePasswordReset = useCallback(async () => {
    if (resetLoading) return;

    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) {
      openThemedAlert('Missing email', 'Enter the email you use to sign in.');
      return;
    }

    if (!canSendResetEmail) {
      openThemedAlert('Please wait', `Resend available in ${resetEmailCooldownLeft}s`);
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(normalizedEmail);
      await startResetEmailCooldown();

      openThemedAlert('Reset email sent', 'Check your email for the login code or reset link. It may take a few minutes to arrive.');
      setResetEmail('');
    } catch (err) {
      console.error('[PASSWORD RESET ERROR]', err);
      openThemedAlert('Error sending reset email', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }, [canSendResetEmail, resetEmail, resetEmailCooldownLeft, resetLoading, startResetEmailCooldown]);

  const handleSaveProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!user) return false;
    const silent = options?.silent ?? false;
    setSaveLoading(true);

    try {
      const payload = {
        id: user.id,
        full_name: editFullName || user.email?.split('@')[0] || 'CampusCart User',
        phone: editPhone || null,
        student_email: editStudentEmail || null,
        university_id: editUniversityId || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      
      if (error) {
        if (!silent) {
          openThemedAlert('Could not save profile', error.message || 'An unknown error occurred');
        }
        return false;
      }

      if (!silent) {
        await loadProfile(user.id);
      }
      if (!silent) {
        openThemedAlert('Profile updated', 'Your account details were saved.');
      }
      return true;
    } catch (err) {
      if (!silent) {
        openThemedAlert('Error saving profile', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
      return false;
    } finally {
      setSaveLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, user]);

  const handlePickAvatar = useCallback(async () => {
    if (!user) {
      openThemedAlert('Sign in required', 'Please sign in before updating your avatar.');
      return;
    }
    
    try {
      setAvatarLoading(true);
      
      const asset = await pickSingleProfileImage();
      if (!asset) {
        setAvatarLoading(false);
        return;
      }

      const avatarUrl = await uploadProfileAvatar(user.id, asset.uri, asset.mimeType ?? undefined, asset.fileName ?? undefined);
      const { error, data: updateData } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: avatarUrl,
        full_name: editFullName || profile?.full_name || user.email?.split('@')[0] || 'CampusCart User',
        phone: editPhone || profile?.phone || null,
        university_id: editUniversityId || profile?.university_id || null,
        student_email: editStudentEmail || profile?.student_email || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).select();

      if (error) {
        console.error('[AVATAR DB ERROR]', error);
        openThemedAlert('Could not update avatar', error.message || 'Failed to save avatar to profile');
        return;
      }

      await loadProfile(user.id);
      openThemedAlert('Avatar updated', 'Your profile photo looks better already.');
    } catch (error) {
      console.error('[AVATAR ERROR]', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      openThemedAlert('Could not update avatar', errorMessage);
    } finally {
      setAvatarLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, profile?.full_name, profile?.phone, profile?.student_email, profile?.university_id, user]);

  const handleApplyDefaultAvatar = useCallback(async () => {
    if (!user) {
      openThemedAlert('Sign in required', 'Please sign in before updating your avatar.');
      return;
    }
    if (!selectedDefaultAvatar) {
      openThemedAlert('Select an avatar', 'Choose one of the default avatars first.');
      return;
    }

    try {
      setAvatarLoading(true);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: selectedDefaultAvatar,
        full_name: editFullName || profile?.full_name || user.email?.split('@')[0] || 'CampusCart User',
        phone: editPhone || profile?.phone || null,
        university_id: editUniversityId || profile?.university_id || null,
        student_email: editStudentEmail || profile?.student_email || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        openThemedAlert('Could not update avatar', error.message || 'Failed to save avatar to profile');
        return;
      }

      await loadProfile(user.id);
      openThemedAlert('Avatar updated', 'Default avatar applied successfully.');
    } catch (error) {
      openThemedAlert('Could not update avatar', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setAvatarLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, profile?.full_name, profile?.phone, profile?.student_email, profile?.university_id, selectedDefaultAvatar, user]);

  const handlePickImages = useCallback(async () => {
    try {
      setPickingImages(true);
      const picked = await pickImages();
      if (picked.length > MAX_LISTING_IMAGES) {
        setListingImages(picked.slice(0, MAX_LISTING_IMAGES));
        showFeedbackModal(
          'Too many images selected',
          `You selected ${picked.length} images. A listing can have up to ${MAX_LISTING_IMAGES}. Please keep only your best photos.`,
          'photo-library'
        );
        return;
      }
      setListingImages(picked);
    } catch (error) {
      openThemedAlert('Could not pick images', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPickingImages(false);
    }
  }, [showFeedbackModal]);

  const handleToggleFavorite = useCallback(async (listingId: string) => {
    if (!user) return openThemedAlert('Sign in required', 'Please sign in to save favorites.');
    try {
      const next = await toggleFavorite(user.id, listingId, favoriteIdSet.has(listingId));
      setFavoriteIds((current) => next ? [...current, listingId] : current.filter((id) => id !== listingId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not update favorite. Please try again.';
      openThemedAlert('Could not update favorite', errorMessage);
    }
  }, [favoriteIdSet, user]);

  const handleContactSeller = useCallback(async (listing: Listing) => {
    if (!user) {
      openThemedAlert('Sign in required', 'Please sign in before contacting a seller.');
      return;
    }

    if (listing.sellerId === user.id) {
      showFeedbackModal('This is your listing', 'Messaging yourself is disabled. View your listing from Account if you want to edit or relist it.', 'person-off');
      return;
    }

    const waLink = generateWhatsAppLink(listing.sellerPhone || '', listing);
    if (!waLink) {
      showFeedbackModal('Seller contact unavailable', 'This seller does not have a valid WhatsApp number yet. Try another listing or check back later.', 'error-outline');
      return;
    }

    try {
      const appUri = waLink.replace('https://wa.me/', 'whatsapp://send?phone=').replace('?text=', '&text=');
      const canOpenApp = await Linking.canOpenURL(appUri);
      if (canOpenApp) {
        await Linking.openURL(appUri);
        return;
      }
      await Linking.openURL(waLink);
    } catch {
      await Linking.openURL(waLink);
    }
  }, [showFeedbackModal, user]);

  const updateListingStatus = useCallback(async (listingId: string, patch: Record<string, any>, successMessage: string) => {
    if (!user?.id) {
      openThemedAlert('Sign in required', 'Please sign in before updating a listing.');
      return;
    }

    try {
      const { error: rpcError } = await supabase.rpc('update_my_listing', {
        p_listing_id: listingId,
        p_status: typeof patch.status === 'string' ? patch.status : null,
        p_deleted_at: Object.prototype.hasOwnProperty.call(patch, 'deleted_at') ? patch.deleted_at : null,
        p_last_bumped_at: patch.last_bumped_at ?? null,
      });

      if (rpcError) {
        const { data, error } = await supabase
          .from('listings')
          .update(patch)
          .eq('id', listingId)
          .eq('seller_id', user.id)
          .select('id');

        if (error) {
          const errorMessage = error?.message || 'Could not update listing. Please try again.';
          openThemedAlert('Update failed', errorMessage);
          return;
        }

        if (!data || data.length === 0) {
          openThemedAlert('Update failed', 'You can only update your own active listings.');
          return;
        }
      }

      setMyListings((current) =>
        current.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                status: typeof patch.status === 'string' ? patch.status : listing.status,
                lastBumpedAt: patch.last_bumped_at ?? listing.lastBumpedAt,
              }
            : listing
        )
      );

      if (typeof patch.status === 'string' && patch.status !== 'active') {
        await loadListings();
      } else {
        await Promise.all([loadListings(), loadMyListings(user.id)]);
      }
      openThemedAlert('Listing updated', successMessage);
    } catch (err) {
      console.error('[LISTING UPDATE ERROR]', err);
      openThemedAlert('Error updating listing', err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [loadListings, loadMyListings, openThemedAlert, user?.id]);

  const handleUpdateListing = useCallback(async (listingId: string, payload: { title: string; description: string; price: number }) => {
    if (!user?.id) {
      openThemedAlert('Sign in required', 'Please sign in before updating a listing.');
      return;
    }

    if (!payload.title || !payload.description || !Number.isFinite(payload.price) || payload.price <= 0) {
      openThemedAlert('Invalid details', 'Please provide a title, description, and valid price.');
      return;
    }

    try {
      const { error: rpcError } = await supabase.rpc('update_my_listing_details', {
        p_listing_id: listingId,
        p_title: payload.title,
        p_description: payload.description,
        p_price: payload.price,
      });

      if (rpcError) {
        const { data, error } = await supabase
          .from('listings')
          .update({
            title: payload.title,
            description: payload.description,
            price: payload.price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', listingId)
          .eq('seller_id', user.id)
          .select('id');

        if (error) {
          openThemedAlert('Update failed', error.message || 'Could not update listing.');
          return;
        }

        if (!data || data.length === 0) {
          openThemedAlert('Update failed', 'Only the seller can edit this listing.');
          return;
        }
      }

      await Promise.all([loadListings(), loadMyListings(user.id)]);
      openThemedAlert('Listing updated', 'Your listing changes were saved.');
    } catch (error) {
      openThemedAlert('Update failed', error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  }, [loadListings, loadMyListings, user?.id]);

  const handleCreateListing = useCallback(async () => {
    if (!user) return openThemedAlert('Sign in required', 'Please sign in before posting a listing.');
    if (!profile?.is_verified_student) {
      return openThemedAlert('Verified seller access required', 'Only verified students can create listings.');
    }
    if (!sellTitle || !sellDescription || !sellPrice) {
      return openThemedAlert('Missing details', 'Please complete title, description, and price.');
    }

    const matchedCategory = dbCategories.find((item) => item.name === sellCategory);
    if (!matchedCategory) return openThemedAlert('Category missing', 'Could not match the selected category in the database.');

    setSellSubmitting(true);

    const { data: inserted, error } = await supabase
      .from('listings')
      .insert({
        title: sellTitle,
        description: sellDescription,
        price: Number(sellPrice),
        seller_id: user.id,
        category_id: matchedCategory.id,
        university_id: profile.university_id,
        status: 'active',
        is_service: sellCategory === 'Services' || sellCategory === 'Tutoring',
      })
      .select('id')
      .single();

    if (error || !inserted?.id) {
      setSellSubmitting(false);
      return openThemedAlert('Could not post listing', error?.message ?? 'No listing id returned');
    }

    if (listingImages.length > 0) {
      try {
        console.log('[MOBILE DEBUG] Uploading', listingImages.length, 'images for listing', inserted.id);
        const uploaded = await uploadListingImages(user.id, inserted.id, listingImages);
        console.log('[MOBILE DEBUG] Upload returned:', uploaded);
        
        const imagesToInsert = uploaded.map((image) => ({
          listing_id: inserted.id,
          public_url: image.public_url,
          storage_path: image.storage_path,
          sort_order: image.sort_order,
        }));
        console.log('[MOBILE DEBUG] Inserting into listing_images:', imagesToInsert);
        
        const { error: imageInsertError, data: insertData } = await supabase.from('listing_images').insert(imagesToInsert).select();
        console.log('[MOBILE DEBUG] Insert result:', { imageInsertError, insertData });
        
        if (imageInsertError) throw imageInsertError;
      } catch (uploadError) {
        console.warn('[MOBILE ERROR] listing-image-upload-error', uploadError);
        openThemedAlert('Listing posted, but image upload failed', uploadError instanceof Error ? uploadError.message : 'Unknown image upload error');
      }
    }

    setSellSubmitting(false);
    setSellTitle('');
    setSellDescription('');
    setSellPrice('');
    setListingImages([]);
    await Promise.all([loadListings(), loadMyListings(user.id)]);
    openThemedAlert('Listing posted', 'Your listing is now live on Campus Cart.');
  }, [dbCategories, listingImages, loadListings, loadMyListings, profile?.is_verified_student, profile?.university_id, sellCategory, sellDescription, sellPrice, sellTitle, user]);

  const handleRefreshFeed = useCallback(async () => {
    setRefreshingFeed(true);
    try {
      await Promise.all([
        loadListings(),
        loadFeaturedHomeListings(),
        user?.id ? loadMyListings(user.id) : Promise.resolve(),
        user?.id ? loadFavorites(user.id) : Promise.resolve(),
      ]);
    } finally {
      setRefreshingFeed(false);
    }
  }, [loadFavorites, loadFeaturedHomeListings, loadListings, loadMyListings, user?.id]);

  const handleRefreshAccount = useCallback(async () => {
    setRefreshingAccount(true);
    try {
      await Promise.all([
        loadListings(),
        loadFeaturedHomeListings(),
        user?.id ? loadMyListings(user.id) : Promise.resolve(),
        user?.id ? loadProfile(user.id) : Promise.resolve(),
        user?.id ? loadFavorites(user.id) : Promise.resolve(),
      ]);
    } finally {
      setRefreshingAccount(false);
    }
  }, [loadFavorites, loadFeaturedHomeListings, loadListings, loadMyListings, loadProfile, user?.id]);

  if (loading) {
    const loadingCartTranslateX = loadingCartProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 20],
    });

    const loadingCartRotate = loadingCartProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['-8deg', '8deg'],
    });

    const loadingTrackTranslateX = loadingCartProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 90],
    });

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.loadingCard}>
            <Animated.View
              style={[
                styles.loadingCartWrap,
                {
                  transform: [{ translateX: loadingCartTranslateX }, { rotate: loadingCartRotate }],
                },
              ]}
            >
              <MaterialIcons name="shopping-cart" size={42} color={colors.secondary} />
            </Animated.View>
            <View style={styles.loadingTrack}>
              <Animated.View
                style={[
                  styles.loadingTrackGlow,
                  {
                    transform: [{ translateX: loadingTrackTranslateX }],
                  },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>Loading Campus Cart...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { fontWeight: '800' },
          }}
        >
          <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
            {() => (
              <MainTabsNavigator
                featuredListings={featuredListings}
                nearbyListings={nearbyListings}
                query={query}
                selectedCategory={selectedCategory}
                listingType={listingType}
                maxPrice={maxPrice}
                sortBy={sortBy}
                favoritesOnly={favoritesOnly}
                favoriteIds={favoriteIds}
                user={user}
                profile={profile}
                handleToggleFavorite={handleToggleFavorite}
                setQuery={setQuery}
                setSelectedCategory={setSelectedCategory}
                setListingType={setListingType}
                setMaxPrice={setMaxPrice}
                setSortBy={setSortBy}
                setFavoritesOnly={setFavoritesOnly}
                filteredListings={filteredListings}
                sellTitle={sellTitle}
                setSellTitle={setSellTitle}
                sellDescription={sellDescription}
                setSellDescription={setSellDescription}
                sellPrice={sellPrice}
                setSellPrice={setSellPrice}
                sellCategory={sellCategory}
                setSellCategory={setSellCategory}
                listingImages={listingImages}
                pickingImages={pickingImages}
                sellSubmitting={sellSubmitting}
                handlePickImages={handlePickImages}
                handleCreateListing={handleCreateListing}
                AboutScreen={AboutScreen}
                AccountScreen={AccountScreen}
                universityName={universityName}
                activeCount={activeCount}
                soldCount={soldCount}
                userListings={userListings}
                savedListings={savedListings}
                email={email}
                password={password}
                fullName={fullName}
                phone={phone}
                setEmail={setEmail}
                setPassword={setPassword}
                setFullName={setFullName}
                setPhone={setSignupPhoneInput}
                authMode={authMode}
                setAuthMode={setAuthMode}
                authLoading={authLoading}
                authEmailCooldownLeft={authEmailCooldownLeft}
                handleAuth={handleAuth}
                handleGoogleAuth={handleGoogleAuth}
                resetEmail={resetEmail}
                setResetEmail={setResetEmail}
                resetLoading={resetLoading}
                resetEmailCooldownLeft={resetEmailCooldownLeft}
                handlePasswordReset={handlePasswordReset}
                signOut={signOut}
                editFullName={editFullName}
                editPhone={editPhone}
                editStudentEmail={editStudentEmail}
                editUniversityId={editUniversityId}
                universities={universities}
                saveLoading={saveLoading}
                avatarLoading={avatarLoading}
                defaultAvatarUrls={defaultAvatarUrls}
                selectedDefaultAvatar={selectedDefaultAvatar}
                setEditFullName={setEditFullName}
                setEditPhone={setEditPhone}
                setEditStudentEmail={setEditStudentEmail}
                setEditUniversityId={setEditUniversityId}
                handleSaveProfile={handleSaveProfile}
                handlePickAvatar={handlePickAvatar}
                setSelectedDefaultAvatar={setSelectedDefaultAvatar}
                handleApplyDefaultAvatar={handleApplyDefaultAvatar}
                updateListingStatus={updateListingStatus}
                handleUpdateListing={handleUpdateListing}
                refreshingFeed={refreshingFeed}
                refreshingAccount={refreshingAccount}
                handleRefreshFeed={handleRefreshFeed}
                handleRefreshAccount={handleRefreshAccount}
                handleContactSeller={handleContactSeller}
                listingLoadError={listingLoadError}
                showFeedbackModal={showFeedbackModal}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="ListingDetail"
            options={{ title: 'Listing' }}
          >
            {({ route, navigation }) => (
              <ListingDetailScreen
                listing={route.params.listing}
                canMessage={!!user && route.params.listing.sellerId !== user?.id}
                onMessageSeller={() => handleContactSeller(route.params.listing)}
                canFavorite={!!user}
                isFavorite={favoriteIds.includes(route.params.listing.id)}
                onToggleFavorite={() => handleToggleFavorite(route.params.listing.id)}
                onOpenSeller={async () => {
                  if (!route.params.listing.sellerId) return;
                  await loadSellerProfile(route.params.listing.sellerId);
                  navigation.navigate('SellerProfile', {
                    sellerId: route.params.listing.sellerId,
                    sellerName: route.params.listing.sellerName,
                  });
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SellerProfile" options={({ route }) => ({ title: route.params.sellerName || 'Seller' })}>
            {({ navigation }) => (
              <SellerProfileScreen
                seller={publicSeller}
                universityName={universities.find((uni) => uni.id === publicSeller?.university_id)?.name}
                listings={publicSellerListings}
                canFavorite={!!user}
                favoriteIds={favoriteIds}
                currentUserId={user?.id}
                canReview={!!user && !!publicSeller?.id && user.id !== publicSeller.id}
                reviewSubmitting={reviewSubmitting}
                reviews={publicSellerReviews}
                ratingSummary={publicSellerRatingSummary}
                onSubmitReview={handleSubmitSellerReview}
                onToggleFavorite={handleToggleFavorite}
                onOpenListing={(listing) => navigation.navigate('ListingDetail', { listing })}
                onShowFeedback={(title, message) => showFeedbackModal(title, message, 'info-outline')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="AccountSettings" options={{ title: 'Settings' }}>
            {({ navigation }) => (
              <AccountSettingsScreen
                user={user}
                refreshing={refreshingAccount}
                onRefresh={handleRefreshAccount}
                onBack={() => navigation.goBack()}
                editFullName={editFullName}
                editPhone={editPhone}
                editStudentEmail={editStudentEmail}
                editUniversityId={editUniversityId}
                universities={universities}
                defaultAvatarUrls={defaultAvatarUrls}
                selectedDefaultAvatar={selectedDefaultAvatar}
                avatarLoading={avatarLoading}
                saveLoading={saveLoading}
                profileAvatarUrl={profile?.avatar_url}
                onEditFullName={setEditFullName}
                onEditPhone={setEditPhone}
                onEditStudentEmail={setEditStudentEmail}
                onEditUniversityId={setEditUniversityId}
                onSelectDefaultAvatar={setSelectedDefaultAvatar}
                onPickAvatar={handlePickAvatar}
                onApplyDefaultAvatar={handleApplyDefaultAvatar}
                onSaveProfile={handleSaveProfile}
                onSignOut={signOut}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      {signedInToastVisible ? (
        <View style={styles.authToastContainer} pointerEvents="none">
          <View style={styles.authToastCard}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <View style={styles.authToastCopy}>
              <Text style={styles.authToastTitle}>Signed in</Text>
              <Text style={styles.authToastBody}>Welcome back to Campus Cart.</Text>
            </View>
          </View>
        </View>
      ) : null}
      <FeedbackModal
        visible={feedbackModalVisible}
        title={feedbackModalTitle}
        message={feedbackModalMessage}
        icon={feedbackModalIcon}
        onClose={() => setFeedbackModalVisible(false)}
      />
      </SafeAreaView>
    </AppErrorBoundary>
  );
}
