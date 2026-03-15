import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { HomeFeedScreen } from "@/screens/HomeFeedScreen";
import { ItemDetailsScreen } from "@/screens/ItemDetailsScreen";
import { ChatListScreen } from "@/screens/ChatListScreen";
import { ChatThreadScreen } from "@/screens/ChatThreadScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ProfileSettingsScreen } from "@/screens/ProfileSettingsScreen";
import { ProfileEditListingScreen } from "@/screens/ProfileEditListingScreen";
import { PostUploadPhotosScreen } from "@/screens/PostUploadPhotosScreen";
import { PostItemDetailsScreen } from "@/screens/PostItemDetailsScreen";
import type {
  ChatStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  RootTabParamList,
  SellStackParamList,
} from "@/types";
import { colors } from "@/theme";

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const SellStack = createStackNavigator<SellStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeFeedScreen} />
      <HomeStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    </HomeStack.Navigator>
  );
}

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="Chats" component={ChatListScreen} />
      <ChatStack.Screen name="ChatThread" component={ChatThreadScreen} />
    </ChatStack.Navigator>
  );
}

function SellStackNavigator() {
  return (
    <SellStack.Navigator screenOptions={{ headerShown: false }}>
      <SellStack.Screen name="PostUploadPhotos" component={PostUploadPhotosScreen} />
      <SellStack.Screen name="PostItemDetails" component={PostItemDetailsScreen} />
    </SellStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <ProfileStack.Screen name="EditListing" component={ProfileEditListingScreen} />
    </ProfileStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            height: 72,
            paddingBottom: 10,
            paddingTop: 8,
            borderTopColor: "#e2e8f0",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
          tabBarIcon: ({ color, size, focused }) => {
            if (route.name === "HomeStack") {
              return <MaterialIcons name={focused ? "home" : "home-filled"} size={size} color={color} />;
            }
            if (route.name === "SellStack") {
              return <MaterialIcons name={focused ? "add-box" : "add-box"} size={size} color={color} />;
            }
            if (route.name === "ChatStack") {
              return <MaterialIcons name={focused ? "chat" : "chat-bubble-outline"} size={size} color={color} />;
            }
            return <MaterialIcons name={focused ? "person" : "person-outline"} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: "Home" }} />
        <Tab.Screen name="SellStack" component={SellStackNavigator} options={{ title: "Sell" }} />
        <Tab.Screen name="ChatStack" component={ChatStackNavigator} options={{ title: "Chats" }} />
        <Tab.Screen name="ProfileStack" component={ProfileStackNavigator} options={{ title: "Profile" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
