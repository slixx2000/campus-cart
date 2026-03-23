import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Session, User } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, SafeAreaView, Text, View } from 'react-native';
import { AccountScreen } from './src/screens/AccountScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ChatDetailScreen } from './src/screens/ChatDetailScreen';
import { SellerProfileScreen } from './src/screens/SellerProfileScreen';
import { SellScreen } from './src/screens/SellScreen';
import { pickImages, uploadListingImages, type PickedImage } from './src/lib/imageUpload';
import { fetchDefaultAvatars, pickSingleProfileImage, uploadProfileAvatar } from './src/lib/profileUpload';
import { registerPushToken } from './src/lib/pushNotifications';
import { findOrCreateConversation, getConversationsForUser, getMessages, markConversationRead, sendMessage } from './src/lib/conversations';
import { getFavoriteIds, toggleFavorite } from './src/lib/favorites';
import { CATEGORY_OPTIONS, LISTING_SELECT } from './src/lib/constants';
import { mapListing } from './src/lib/mappers';
import { colors, styles } from './src/lib/styles';
import { supabase } from './src/lib/supabase';
import type { CategoryRow, ConversationPreview, Listing, MainTabParamList, MessageItem, Profile, RootStackParamList, UniversityRow } from './src/types';

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
    handleAuth,
    resetEmail,
    setResetEmail,
    resetLoading,
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
    refreshingFeed,
    refreshingMessages,
    refreshingAccount,
    handleRefreshFeed,
    handleRefreshMessages,
    handleRefreshAccount,
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Browse') iconName = 'search';
          if (route.name === 'Sell') iconName = 'add-circle-outline';
          if (route.name === 'Messages') iconName = 'chat-bubble-outline';
          if (route.name === 'About') iconName = 'info-outline';
          if (route.name === 'Account') iconName = 'person-outline';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
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
        {() => (
          <AccountScreen
            user={user}
            profile={props.profile}
            universityName={universityName}
            activeCount={activeCount}
            soldCount={soldCount}
            myListings={userListings}
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
            onAuth={handleAuth}
            resetEmail={resetEmail}
            setResetEmail={setResetEmail}
            resetLoading={resetLoading}
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
            onArchiveListing={(listingId: string) => updateListingStatus(listingId, { deleted_at: new Date().toISOString() }, 'Listing archived.')}
            onBumpListing={(listingId: string) => updateListingStatus(listingId, { last_bumped_at: new Date().toISOString() }, 'Listing bumped to the top.')}
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
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
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
  const loadingCartProgress = useRef(new Animated.Value(0)).current;

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
  }, []);

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
      setConversations(data);
    } catch (error) {
      console.warn('conversation-load-error', error);
    } finally {
      setConversationLoading(false);
    }
  }, []);

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
      Alert.alert('Could not load listings', error.message);
      return;
    }

    setListings(((data ?? []) as any[]).map(mapListing));
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
        loadConversations(data.session.user.id);
        loadFavorites(data.session.user.id);
        registerPushToken(data.session.user.id).catch(() => undefined);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
        loadConversations(nextSession.user.id);
        loadFavorites(nextSession.user.id);
        registerPushToken(nextSession.user.id).catch(() => undefined);
      } else {
        setProfile(null);
        setConversations([]);
        setFavoriteIds([]);
      }
    });

    Promise.all([loadListings(), loadFeaturedHomeListings(), loadCategories(), loadUniversities(), loadDefaultAvatars()]).finally(() => setLoading(false));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCategories, loadConversations, loadDefaultAvatars, loadFavorites, loadFeaturedHomeListings, loadListings, loadProfile, loadUniversities]);

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
  const userListings = useMemo(() => listings.filter((listing) => listing.sellerId === user?.id), [listings, user?.id]);
  const activeCount = useMemo(() => userListings.filter((listing) => listing.status !== 'sold').length, [userListings]);
  const soldCount = useMemo(() => userListings.filter((listing) => listing.status === 'sold').length, [userListings]);
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
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    if (authMode === 'sign-up' && !fullName) {
      Alert.alert('Missing name', 'Please enter your full name to create an account.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const errorMessage = error?.message || 'Could not sign in. Please check your email and password.';
          Alert.alert('Sign in failed', errorMessage);
          return;
        }
        setSignedInToastVisible(true);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });

      if (error) {
        const errorMessage = error?.message || 'Could not create account. Please try again.';
        Alert.alert('Sign up failed', errorMessage);
        return;
      }

      if (data.user?.id) {
        try {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone });
        } catch (profileError) {
          console.warn('[AUTH] Profile creation error:', profileError);
          // Don't fail the signup if profile creation fails - user can update later
        }
      }

      setAuthMode('sign-in');
      Alert.alert('Account created', 'Check your email if confirmation is enabled, then sign in.');
    } catch (err) {
      console.error('[AUTH ERROR]', err);
      Alert.alert('Authentication error', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, email, fullName, password, phone]);

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
    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) {
      Alert.alert('Missing email', 'Enter the email you use to sign in.');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      
      if (error) {
        const errorMessage = error?.message || 'Could not send reset email. Please check your email and try again.';
        Alert.alert('Reset failed', errorMessage);
        return;
      }

      Alert.alert('Reset email sent', 'Check your inbox for password reset instructions. It may take a few minutes to arrive.');
      setResetEmail('');
    } catch (err) {
      console.error('[PASSWORD RESET ERROR]', err);
      Alert.alert('Error sending reset email', err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }, [resetEmail]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
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

      console.log('[PROFILE SAVE] Updating profile:', payload);
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      
      if (error) {
        console.error('[PROFILE SAVE ERROR]', error);
        Alert.alert('Could not save profile', error.message || 'An unknown error occurred');
        return;
      }

      console.log('[PROFILE SAVE] Success');
      await loadProfile(user.id);
      Alert.alert('Profile updated', 'Your account details were saved.');
    } catch (err) {
      console.error('[PROFILE SAVE EXCEPTION]', err);
      Alert.alert('Error saving profile', err instanceof Error ? err.message : 'An unexpected error occurred');
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

    try {
      const conversationId = await findOrCreateConversation(listing.id, user.id, listing.sellerId);
      await loadConversations(user.id);
      await loadMessages(conversationId, user.id);
      navigation.navigate('ChatDetail', { conversationId, title: listing.sellerName, currentUserId: user.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not start chat. Please try again.';
      Alert.alert('Could not start chat', errorMessage);
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

  const updateListingStatus = useCallback(async (listingId: string, patch: Record<string, any>, successMessage: string) => {
    try {
      const { error } = await supabase.from('listings').update(patch).eq('id', listingId);
      if (error) {
        const errorMessage = error?.message || 'Could not update listing. Please try again.';
        Alert.alert('Update failed', errorMessage);
        return;
      }
      await loadListings();
      Alert.alert('Listing updated', successMessage);
    } catch (err) {
      console.error('[LISTING UPDATE ERROR]', err);
      Alert.alert('Error updating listing', err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }, [loadListings]);

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
    await loadListings();
    Alert.alert('Listing posted', 'Your listing is now live on Campus Cart.');
  }, [dbCategories, listingImages, loadListings, profile?.is_verified_student, profile?.university_id, sellCategory, sellDescription, sellPrice, sellTitle, user]);

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
        user?.id ? loadFavorites(user.id) : Promise.resolve(),
      ]);
    } finally {
      setRefreshingFeed(false);
    }
  }, [loadFavorites, loadFeaturedHomeListings, loadListings, user?.id]);

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
        user?.id ? loadProfile(user.id) : Promise.resolve(),
        user?.id ? loadFavorites(user.id) : Promise.resolve(),
      ]);
    } finally {
      setRefreshingAccount(false);
    }
  }, [loadFavorites, loadFeaturedHomeListings, loadListings, loadProfile, user?.id]);

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
                handleAuth={handleAuth}
                resetEmail={resetEmail}
                setResetEmail={setResetEmail}
                resetLoading={resetLoading}
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
                refreshingFeed={refreshingFeed}
                refreshingMessages={refreshingMessages}
                refreshingAccount={refreshingAccount}
                handleRefreshFeed={handleRefreshFeed}
                handleRefreshMessages={handleRefreshMessages}
                handleRefreshAccount={handleRefreshAccount}
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
                onBack={() => navigation.goBack()}
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
  );
}
