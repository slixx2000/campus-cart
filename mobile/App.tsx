import { StatusBar } from 'expo-status-bar';
import { Session, User } from '@supabase/supabase-js';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, View } from 'react-native';
import { AccountScreen } from './src/screens/AccountScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListingDetailScreen } from './src/screens/ListingDetailScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ChatDetailScreen } from './src/screens/ChatDetailScreen';
import { SellerProfileScreen } from './src/screens/SellerProfileScreen';
import { SellScreen } from './src/screens/SellScreen';
import { pickImages, uploadListingImages, type PickedImage } from './src/lib/imageUpload';
import { pickSingleProfileImage, uploadProfileAvatar } from './src/lib/profileUpload';
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authLoading, setAuthLoading] = useState(false);
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
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editUniversityId, setEditUniversityId] = useState('');

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
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
        loadConversations(nextSession.user.id);
        loadFavorites(nextSession.user.id);
      } else {
        setProfile(null);
        setConversations([]);
        setFavoriteIds([]);
      }
    });

    Promise.all([loadListings(), loadCategories(), loadUniversities()]).finally(() => setLoading(false));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCategories, loadConversations, loadFavorites, loadListings, loadProfile, loadUniversities]);

  const featuredListings = useMemo(() => listings.filter((listing) => listing.featured).slice(0, 6), [listings]);
  const nearbyListings = useMemo(() => listings.slice(0, 6), [listings]);
  const userListings = useMemo(() => listings.filter((listing) => listing.sellerId === user?.id), [listings, user?.id]);
  const activeCount = useMemo(() => userListings.filter((listing) => listing.status !== 'sold').length, [userListings]);
  const soldCount = useMemo(() => userListings.filter((listing) => listing.status === 'sold').length, [userListings]);
  const universityName = useMemo(() => universities.find((uni) => uni.id === profile?.university_id)?.name, [universities, profile?.university_id]);

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          listing.title.toLowerCase().includes(q) ||
          listing.description.toLowerCase().includes(q) ||
          listing.category.toLowerCase().includes(q);
        const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
        const matchesFavorites = !favoritesOnly || favoriteIds.includes(listing.id);
        return matchesQuery && matchesCategory && matchesFavorites;
      }),
    [favoriteIds, favoritesOnly, listings, query, selectedCategory]
  );

  const handleAuth = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    setAuthLoading(true);

    if (authMode === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthLoading(false);
      if (error) return Alert.alert('Sign in failed', error.message);
      return Alert.alert('Welcome back', 'You are now signed in.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (error) {
      setAuthLoading(false);
      return Alert.alert('Sign up failed', error.message);
    }

    if (data.user?.id) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone });
    }

    setAuthLoading(false);
    setAuthMode('sign-in');
    Alert.alert('Account created', 'Check your email if confirmation is enabled, then sign in.');
  }, [authMode, email, fullName, password, phone]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    Alert.alert('Signed out', 'You have been signed out.');
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setSaveLoading(true);

    const payload = {
      id: user.id,
      full_name: editFullName || user.email?.split('@')[0] || 'CampusCart User',
      phone: editPhone || null,
      student_email: editStudentEmail || null,
      university_id: editUniversityId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    setSaveLoading(false);

    if (error) return Alert.alert('Could not save profile', error.message);

    await loadProfile(user.id);
    Alert.alert('Profile updated', 'Your account details were saved.');
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, user]);

  const handlePickAvatar = useCallback(async () => {
    if (!user) return;
    try {
      setAvatarLoading(true);
      const asset = await pickSingleProfileImage();
      if (!asset) {
        setAvatarLoading(false);
        return;
      }
      const avatarUrl = await uploadProfileAvatar(user.id, asset.uri, asset.mimeType ?? undefined, asset.fileName ?? undefined);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: avatarUrl,
        full_name: editFullName || profile?.full_name || user.email?.split('@')[0] || 'CampusCart User',
        phone: editPhone || profile?.phone || null,
        university_id: editUniversityId || profile?.university_id || null,
        student_email: editStudentEmail || profile?.student_email || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      setAvatarLoading(false);
      if (error) return Alert.alert('Could not update avatar', error.message);
      await loadProfile(user.id);
      Alert.alert('Avatar updated', 'Your profile photo looks better already.');
    } catch (error) {
      setAvatarLoading(false);
      Alert.alert('Could not update avatar', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [editFullName, editPhone, editStudentEmail, editUniversityId, loadProfile, profile?.full_name, profile?.phone, profile?.student_email, profile?.university_id, user]);

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
      Alert.alert('Could not update favorite', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [favoriteIds, user]);

  const handleStartConversation = useCallback(async (listing: Listing, navigation: any) => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in before messaging a seller.');
    if (!listing.sellerId) return Alert.alert('Seller unavailable', 'This listing has no seller attached.');
    if (listing.sellerId === user.id) return Alert.alert('That is your listing', 'You cannot message yourself.');

    try {
      const conversationId = await findOrCreateConversation(listing.id, user.id, listing.sellerId);
      await loadConversations(user.id);
      await loadMessages(conversationId, user.id);
      navigation.navigate('ChatDetail', { conversationId, title: listing.sellerName, currentUserId: user.id });
    } catch (error) {
      Alert.alert('Could not start chat', error instanceof Error ? error.message : 'Unknown error');
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
      Alert.alert('Could not send message', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setChatSending(false);
    }
  }, [loadConversations, loadMessages, user]);

  const updateListingStatus = useCallback(async (listingId: string, patch: Record<string, any>, successMessage: string) => {
    const { error } = await supabase.from('listings').update(patch).eq('id', listingId);
    if (error) return Alert.alert('Could not update listing', error.message);
    await loadListings();
    Alert.alert('Listing updated', successMessage);
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
        const uploaded = await uploadListingImages(user.id, inserted.id, listingImages);
        const { error: imageInsertError } = await supabase.from('listing_images').insert(
          uploaded.map((image) => ({
            listing_id: inserted.id,
            public_url: image.public_url,
            storage_path: image.storage_path,
            sort_order: image.sort_order,
          }))
        );
        if (imageInsertError) throw imageInsertError;
      } catch (uploadError) {
        console.warn('listing-image-upload-error', uploadError);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Campus Cart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        <Tab.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              featuredListings={featuredListings}
              nearbyListings={nearbyListings}
              onOpenListing={(listing) => navigation.getParent()?.navigate('ListingDetail', { listing })}
              onBrowsePress={() => navigation.navigate('Browse')}
              onSellPress={() => navigation.navigate('Sell')}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Browse">
          {({ navigation }) => (
            <BrowseScreen
              query={query}
              selectedCategory={selectedCategory}
              favoritesOnly={favoritesOnly}
              favoriteCount={favoriteIds.length}
              setQuery={setQuery}
              setSelectedCategory={setSelectedCategory}
              setFavoritesOnly={setFavoritesOnly}
              listings={filteredListings}
              favoriteIds={favoriteIds}
              canFavorite={!!user}
              onToggleFavorite={handleToggleFavorite}
              onOpenListing={(listing) => navigation.getParent()?.navigate('ListingDetail', { listing })}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Sell">
          {() => (
            <SellScreen
              user={user}
              profile={profile}
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
              onRefresh={() => loadConversations(user?.id)}
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
        <Tab.Screen name="Account">
          {() => (
            <AccountScreen
              user={user}
              profile={profile}
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
              onSignOut={signOut}
              editFullName={editFullName}
              editPhone={editPhone}
              editStudentEmail={editStudentEmail}
              editUniversityId={editUniversityId}
              universities={universities}
              saveLoading={saveLoading}
              avatarLoading={avatarLoading}
              onEditFullName={setEditFullName}
              onEditPhone={setEditPhone}
              onEditStudentEmail={setEditStudentEmail}
              onEditUniversityId={setEditUniversityId}
              onSaveProfile={handleSaveProfile}
              onPickAvatar={handlePickAvatar}
              onMarkSold={(listingId) => updateListingStatus(listingId, { status: 'sold' }, 'Marked as sold.')}
              onArchiveListing={(listingId) => updateListingStatus(listingId, { deleted_at: new Date().toISOString() }, 'Listing archived.')}
              onBumpListing={(listingId) => updateListingStatus(listingId, { last_bumped_at: new Date().toISOString() }, 'Listing bumped to the top.')}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
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
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
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
    </SafeAreaView>
  );
}
