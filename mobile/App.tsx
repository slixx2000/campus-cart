import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, SafeAreaView, Text, View } from 'react-native';
import { AccountScreen } from './src/screens/AccountScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { AccountSettingsScreen } from './src/screens/AccountSettingsScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ChatDetailScreen } from './src/screens/ChatDetailScreen';
import { SellerProfileScreen } from './src/screens/SellerProfileScreen';
import { SellScreen } from './src/screens/SellScreen';
import { pickImages, uploadListingImages, type PickedImage } from './src/lib/imageUpload';
import { fetchDefaultAvatars, pickSingleProfileImage, uploadProfileAvatar } from './src/lib/profileUpload';
import { registerPushToken } from './src/lib/pushNotifications';
import { findOrCreateConversation, getConversationsForUser, getHiddenConversationIds, getMessages, hideConversationForUser, markConversationRead, sendMessage } from './src/lib/conversations';
import { sendPasswordResetEmail, signInWithGoogle, signInWithPassword, signUpWithEmail } from './src/lib/authService';
import { useOtpCooldown } from './src/hooks/useOtpCooldown';
import { getFavoriteIds, toggleFavorite } from './src/lib/favorites';
import { CATEGORY_OPTIONS, LISTING_SELECT } from './src/lib/constants';
import { mapListing } from './src/lib/mappers';
import { getSellerReviews, upsertSellerReview } from './src/lib/reviews';
import { colors, styles } from './src/lib/styles';
import { supabase } from './src/lib/supabase';
import type { CategoryRow, ConversationPreview, Listing, MainTabParamList, MessageItem, Profile, RootStackParamList, SellerRatingSummary, SellerReview, UniversityRow } from './src/types';

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
    unreadCount,
    conversations,
    conversationLoading,
    loadConversations,
    loadMessages,
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
    refreshingMessages,
    refreshingAccount,
    handleRefreshFeed,
    handleRefreshMessages,
    handleRefreshAccount,
    handleStartConversation,
    handleDeleteConversation,
    listingLoadError,
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
          if (route.name === 'Messages') iconName = 'chat-bubble-outline';
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
            onMessagePress={(listing) => handleStartConversation(listing, navigation.getParent?.())}
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
      <Tab.Screen name="Messages" options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}>
        {({ navigation }) => (
          <MessagesScreen
            signedIn={!!user}
            conversations={conversations}
            loading={conversationLoading}
            refreshing={refreshingMessages}
            onRefresh={handleRefreshMessages}
            onDeleteConversation={(conversation) => handleDeleteConversation(conversation.id)}
            onOpenConversation={async (conversation) => {
              await loadMessages(conversation.id, user?.id);
              navigation.getParent()?.navigate('ChatDetail', {
                conversationId: conversation.id,
                title: conversation.other_participant_name,
                currentUserId: user?.id || '',
              });
            }}
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
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [hiddenConversationIds, setHiddenConversationIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [defaultAvatarUrls, setDefaultAvatarUrls] = useState<string[]>([]);
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<string | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [refreshingAccount, setRefreshingAccount] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editUniversityId, setEditUniversityId] = useState('');
  const [signedInToastVisible, setSignedInToastVisible] = useState(false);
  const [listingLoadError, setListingLoadError] = useState<string | null>(null);
  const startingConversationRef = useRef<Set<string>>(new Set());
  const loadingCartProgress = useRef(new Animated.Value(0)).current;
  const { canResend: canSendAuthEmail, timeLeft: authEmailCooldownLeft, startCooldown: startAuthEmailCooldown } = useOtpCooldown({
    storageKey: 'auth_signup_email_cooldown',
    cooldownSeconds: 60,
  });
  const { canResend: canSendResetEmail, timeLeft: resetEmailCooldownLeft, startCooldown: startResetEmailCooldown } = useOtpCooldown({
    storageKey: 'auth_reset_email_cooldown',
    cooldownSeconds: 60,
  });

  const getHiddenConversationKey = useCallback((userId: string) => `hidden_conversations_${userId}`, []);

  const loadHiddenConversations = useCallback(async (userId?: string) => {
    if (!userId) {
      setHiddenConversationIds([]);
      return;
    }

    try {
      try {
        const idsFromDb = await getHiddenConversationIds(userId);
        setHiddenConversationIds(idsFromDb);
      } catch (dbError) {
        console.warn('hidden-conversations-db-load-error', dbError);
      }

      const raw = await AsyncStorage.getItem(getHiddenConversationKey(userId));
      if (!raw) {
        setHiddenConversationIds((current) => current);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHiddenConversationIds((current) => Array.from(new Set([...current, ...parsed])));
      }
    } catch (error) {
      console.warn('hidden-conversations-load-error', error);
      setHiddenConversationIds((current) => current);
    }
  }, [getHiddenConversationKey]);

  const persistHiddenConversations = useCallback(async (userId: string, ids: string[]) => {
    try {
      await AsyncStorage.setItem(getHiddenConversationKey(userId), JSON.stringify(ids));
    } catch (error) {
      console.warn('hidden-conversations-save-error', error);
    }
  }, [getHiddenConversationKey]);

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
      Alert.alert('Sign in required', 'Please sign in before leaving a review.');
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
      Alert.alert('Review saved', 'Thanks for sharing your feedback.');
    } catch (error) {
      Alert.alert('Could not save review', error instanceof Error ? error.message : 'Please try again.');
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

  const loadConversations = useCallback(async (userId?: string) => {
    if (!userId) {
      setConversations([]);
      return;
    }
    try {
      setConversationLoading(true);
      const data = await getConversationsForUser(userId);
      setConversations(data.filter((conversation) => !hiddenConversationIds.includes(conversation.id)));
    } catch (error) {
      console.warn('conversation-load-error', error);
    } finally {
      setConversationLoading(false);
    }
  }, [hiddenConversationIds]);

  const loadMessages = useCallback(async (conversationId: string, markReadUserId?: string) => {
    try {
      setChatLoading(true);
      const data = await getMessages(conversationId);
      setMessages(data);
      setActiveConversationId(conversationId);
      if (markReadUserId) {
        await markConversationRead(conversationId, markReadUserId);
      }
    } catch (error) {
      console.warn('message-load-error', error);
    } finally {
      setChatLoading(false);
    }
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

    setMyListings(((data ?? []) as any[]).map(mapListing));
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
        loadHiddenConversations(data.session.user.id);
        loadConversations(data.session.user.id);
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
        loadHiddenConversations(nextSession.user.id);
        loadConversations(nextSession.user.id);
        loadMyListings(nextSession.user.id);
        loadFavorites(nextSession.user.id);
        registerPushToken(nextSession.user.id).catch(() => undefined);
      } else {
        setProfile(null);
        setMyListings([]);
        setConversations([]);
        setHiddenConversationIds([]);
        setFavoriteIds([]);
      }
    });

    Promise.all([loadListings(), loadFeaturedHomeListings(), loadCategories(), loadUniversities(), loadDefaultAvatars()]).finally(() => setLoading(false));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCategories, loadConversations, loadDefaultAvatars, loadFavorites, loadFeaturedHomeListings, loadHiddenConversations, loadListings, loadMyListings, loadProfile, loadUniversities]);

  useEffect(() => {
    if (!user?.id) return;
    loadConversations(user.id);
  }, [hiddenConversationIds, loadConversations, user?.id]);

  useEffect(() => {
    const completeOAuthFromLink = async (url: string) => {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (!code) return;

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          Alert.alert('Google sign-in failed', error.message);
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
  const activeCount = useMemo(() => userListings.filter((listing) => listing.status === 'active').length, [userListings]);
  const soldCount = useMemo(() => userListings.filter((listing) => listing.status === 'sold').length, [userListings]);
  const savedListings = useMemo(() => listings.filter((listing) => favoriteIds.includes(listing.id)), [favoriteIds, listings]);
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
        const matchesFavorites = !favoritesOnly || favoriteIds.includes(listing.id);
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
    [favoriteIds, favoritesOnly, listingType, listings, maxPrice, query, selectedCategory, sortBy]
  );

  const handleAuth = useCallback(async () => {
    if (authLoading) return;

    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    if (authMode === 'sign-up' && !fullName) {
      Alert.alert('Missing name', 'Please enter your full name to create an account.');
      return;
    }

    if (authMode === 'sign-up' && !canSendAuthEmail) {
      Alert.alert('Please wait', `Too many requests. Please wait ${authEmailCooldownLeft}s before trying again.`);
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'sign-in') {
        await signInWithPassword(email.trim(), password);
        setSignedInToastVisible(true);
        return;
      }

      const data = await signUpWithEmail(email.trim(), password, fullName, phone);
      await startAuthEmailCooldown();

      if (data.user?.id) {
        try {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone });
        } catch (profileError) {
          console.warn('[AUTH] Profile creation error:', profileError);
          // Don't fail the signup if profile creation fails - user can update later
        }
      }

      setAuthMode('sign-in');
      Alert.alert('Check your email', 'Check your email for the login code or confirmation link, then sign in.');
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      Alert.alert('Authentication error', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
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
      Alert.alert('Google sign-in failed', err instanceof Error ? err.message : 'Could not continue with Google.');
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
    Alert.alert('Signed out', 'You have been signed out.');
  }, [user?.id]);

  const handlePasswordReset = useCallback(async () => {
    if (resetLoading) return;

    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) {
      Alert.alert('Missing email', 'Enter the email you use to sign in.');
      return;
    }

    if (!canSendResetEmail) {
      Alert.alert('Please wait', `Resend available in ${resetEmailCooldownLeft}s`);
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(normalizedEmail);
      await startResetEmailCooldown();

      Alert.alert('Reset email sent', 'Check your email for the login code or reset link. It may take a few minutes to arrive.');
      setResetEmail('');
    } catch (err) {
      console.error('[PASSWORD RESET ERROR]', err);
      Alert.alert('Error sending reset email', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
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
          Alert.alert('Could not save profile', error.message || 'An unknown error occurred');
        }
        return false;
      }

      await loadProfile(user.id);
      if (!silent) {
        Alert.alert('Profile updated', 'Your account details were saved.');
      }
      return true;
    } catch (err) {
      if (!silent) {
        Alert.alert('Error saving profile', err instanceof Error ? err.message : 'An unexpected error occurred');
      }
      return false;
    } finally {
      setSaveLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, user]);

  const handlePickAvatar = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before updating your avatar.');
      return;
    }
    
    try {
      setAvatarLoading(true);
      console.log('[AVATAR PICK] Starting avatar selection');
      
      const asset = await pickSingleProfileImage();
      if (!asset) {
        console.log('[AVATAR PICK] User cancelled');
        setAvatarLoading(false);
        return;
      }

      console.log('[AVATAR UPLOAD] Uploading:', { fileName: asset.fileName, size: asset.fileSize });
      const avatarUrl = await uploadProfileAvatar(user.id, asset.uri, asset.mimeType ?? undefined, asset.fileName ?? undefined);
      console.log('[AVATAR UPLOAD] Got URL:', avatarUrl);

      console.log('[AVATAR DB UPDATE] Updating profile with avatar URL');
      const { error, data: updateData } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: avatarUrl,
        full_name: editFullName || profile?.full_name || user.email?.split('@')[0] || 'CampusCart User',
        phone: editPhone || profile?.phone || null,
        university_id: editUniversityId || profile?.university_id || null,
        student_email: editStudentEmail || profile?.student_email || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).select();
      
      console.log('[AVATAR DB UPDATE] Result:', { error, updated: !!updateData });

      if (error) {
        console.error('[AVATAR DB ERROR]', error);
        Alert.alert('Could not update avatar', error.message || 'Failed to save avatar to profile');
        return;
      }

      await loadProfile(user.id);
      Alert.alert('Avatar updated', 'Your profile photo looks better already.');
    } catch (error) {
      console.error('[AVATAR ERROR]', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Could not update avatar', errorMessage);
    } finally {
      setAvatarLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, profile?.full_name, profile?.phone, profile?.student_email, profile?.university_id, user]);

  const handleApplyDefaultAvatar = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before updating your avatar.');
      return;
    }
    if (!selectedDefaultAvatar) {
      Alert.alert('Select an avatar', 'Choose one of the default avatars first.');
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
        Alert.alert('Could not update avatar', error.message || 'Failed to save avatar to profile');
        return;
      }

      await loadProfile(user.id);
      Alert.alert('Avatar updated', 'Default avatar applied successfully.');
    } catch (error) {
      Alert.alert('Could not update avatar', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setAvatarLoading(false);
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, profile?.full_name, profile?.phone, profile?.student_email, profile?.university_id, selectedDefaultAvatar, user]);

  const handlePickImages = useCallback(async () => {
    try {
      setPickingImages(true);
      const picked = await pickImages();
      setListingImages(picked);
    } catch (error) {
      Alert.alert('Could not pick images', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPickingImages(false);
    }
  }, []);

  const handleToggleFavorite = useCallback(async (listingId: string) => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in to save favorites.');
    try {
      const next = await toggleFavorite(user.id, listingId, favoriteIds.includes(listingId));
      setFavoriteIds((current) => next ? [...current, listingId] : current.filter((id) => id !== listingId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not update favorite. Please try again.';
      Alert.alert('Could not update favorite', errorMessage);
    }
  }, [favoriteIds, user]);

  const handleStartConversation = useCallback(async (listing: Listing, navigation: any) => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in before messaging a seller.');
    if (!listing.sellerId) return Alert.alert('Seller unavailable', 'This listing has no seller attached. Contact support if this persists.');
    if (listing.sellerId === user.id) return Alert.alert('Your listing', 'You cannot message yourself on your own listing.');

    const requestKey = `${listing.id}:${user.id}`;
    if (startingConversationRef.current.has(requestKey)) {
      return;
    }

    startingConversationRef.current.add(requestKey);

    try {
      const conversationId = await findOrCreateConversation(listing.id, user.id, listing.sellerId);
      await loadConversations(user.id);
      await loadMessages(conversationId, user.id);
      navigation.navigate('ChatDetail', { conversationId, title: listing.sellerName, currentUserId: user.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not start chat. Please try again.';
      Alert.alert('Could not start chat', errorMessage);
    } finally {
      startingConversationRef.current.delete(requestKey);
    }
  }, [loadConversations, loadMessages, user]);

  const handleSendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user) return;
    setChatSending(true);
    try {
      await sendMessage(conversationId, user.id, content);
      await loadMessages(conversationId, user.id);
      await loadConversations(user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not send message. Please try again.';
      Alert.alert('Message failed', errorMessage);
    } finally {
      setChatSending(false);
    }
  }, [loadConversations, loadMessages, user]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    const nextIds = hiddenConversationIds.includes(conversationId)
      ? hiddenConversationIds
      : [...hiddenConversationIds, conversationId];

    setHiddenConversationIds(nextIds);
    setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
    await persistHiddenConversations(user.id, nextIds);
    try {
      await hideConversationForUser(user.id, conversationId);
    } catch (error) {
      console.warn('hidden-conversations-db-save-error', error);
    }
  }, [hiddenConversationIds, persistHiddenConversations, user?.id]);

  const updateListingStatus = useCallback(async (listingId: string, patch: Record<string, any>, successMessage: string) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in before updating a listing.');
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
          Alert.alert('Update failed', errorMessage);
          return;
        }

        if (!data || data.length === 0) {
          Alert.alert('Update failed', 'You can only update your own active listings.');
          return;
        }
      }

      await Promise.all([loadListings(), loadMyListings(user.id)]);
      Alert.alert('Listing updated', successMessage);
    } catch (err) {
      console.error('[LISTING UPDATE ERROR]', err);
      Alert.alert('Error updating listing', err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [loadListings, loadMyListings, user?.id]);

  const handleUpdateListing = useCallback(async (listingId: string, payload: { title: string; description: string; price: number }) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in before updating a listing.');
      return;
    }

    if (!payload.title || !payload.description || !Number.isFinite(payload.price) || payload.price <= 0) {
      Alert.alert('Invalid details', 'Please provide a title, description, and valid price.');
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
          Alert.alert('Update failed', error.message || 'Could not update listing.');
          return;
        }

        if (!data || data.length === 0) {
          Alert.alert('Update failed', 'Only the seller can edit this listing.');
          return;
        }
      }

      await Promise.all([loadListings(), loadMyListings(user.id)]);
      Alert.alert('Listing updated', 'Your listing changes were saved.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  }, [loadListings, loadMyListings, user?.id]);

  const handleCreateListing = useCallback(async () => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in before posting a listing.');
    if (!profile?.is_verified_student) {
      return Alert.alert('Verified seller access required', 'Only verified students can create listings.');
    }
    if (!sellTitle || !sellDescription || !sellPrice) {
      return Alert.alert('Missing details', 'Please complete title, description, and price.');
    }

    const matchedCategory = dbCategories.find((item) => item.name === sellCategory);
    if (!matchedCategory) return Alert.alert('Category missing', 'Could not match the selected category in the database.');

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
      return Alert.alert('Could not post listing', error?.message ?? 'No listing id returned');
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
        Alert.alert('Listing posted, but image upload failed', uploadError instanceof Error ? uploadError.message : 'Unknown image upload error');
      }
    }

    setSellSubmitting(false);
    setSellTitle('');
    setSellDescription('');
    setSellPrice('');
    setListingImages([]);
    await Promise.all([loadListings(), loadMyListings(user.id)]);
    Alert.alert('Listing posted', 'Your listing is now live on Campus Cart.');
  }, [dbCategories, listingImages, loadListings, loadMyListings, profile?.is_verified_student, profile?.university_id, sellCategory, sellDescription, sellPrice, sellTitle, user]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      loadConversations(user.id);
      if (activeConversationId) {
        loadMessages(activeConversationId, user.id);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activeConversationId, loadConversations, loadMessages, user?.id]);

  const unreadCount = useMemo(() => conversations.filter((conversation) => conversation.unread).length, [conversations]);

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

  const handleRefreshMessages = useCallback(async () => {
    setRefreshingMessages(true);
    try {
      await loadConversations(user?.id);
      if (activeConversationId && user?.id) {
        await loadMessages(activeConversationId, user.id);
      }
    } finally {
      setRefreshingMessages(false);
    }
  }, [activeConversationId, loadConversations, loadMessages, user?.id]);

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
                unreadCount={unreadCount}
                conversations={conversations}
                conversationLoading={conversationLoading}
                loadConversations={loadConversations}
                loadMessages={loadMessages}
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
                setPhone={setPhone}
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
                refreshingMessages={refreshingMessages}
                refreshingAccount={refreshingAccount}
                handleRefreshFeed={handleRefreshFeed}
                handleRefreshMessages={handleRefreshMessages}
                handleRefreshAccount={handleRefreshAccount}
                handleStartConversation={handleStartConversation}
                handleDeleteConversation={handleDeleteConversation}
                listingLoadError={listingLoadError}
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
                onMessageSeller={() => handleStartConversation(route.params.listing, navigation)}
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
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ChatDetail" options={({ route }) => ({ title: route.params.title || 'Chat' })}>
            {({ route }) => (
              <ChatDetailScreen
                title={route.params.title}
                currentUserId={route.params.currentUserId}
                messages={messages}
                loading={chatLoading}
                sending={chatSending}
                onRefresh={() => loadMessages(route.params.conversationId, user?.id)}
                onSend={(content) => handleSendMessage(route.params.conversationId, content)}
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
      </SafeAreaView>
    </AppErrorBoundary>
  );
}
