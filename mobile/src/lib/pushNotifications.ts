import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Expo Go dropped remote push in SDK 53, and touching the push API there throws
 * at startup — which crashed the whole app rather than degrading. Push only ever
 * works in a dev/production build anyway, so in Expo Go this module no-ops and
 * the rest of the app stays usable.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// NOTE: expo-notifications is loaded lazily, never at module scope. In Expo Go
// the *import itself* throws (it calls addPushTokenListener during module init),
// which took the entire app down before the first screen rendered.
let notificationsModule: typeof import('expo-notifications') | null = null;
let handlerConfigured = false;

async function loadNotifications() {
  if (isExpoGo) return null;
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  if (!handlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }
  return notificationsModule;
}

function getProjectId(): string | null {
  const fromEas = Constants?.easConfig?.projectId;
  if (fromEas) return fromEas;

  const fromExtra = (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (fromExtra) return fromExtra;

  return null;
}

export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) {
    return;
  }

  if (!Device.isDevice) {
    return;
  }

  const Notifications = await loadNotifications();
  if (!Notifications) {
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('push-notifications', { event: 'missing-project-id' });
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        is_active: true,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,expo_push_token' }
    );

  if (error) {
    console.warn('push-token-upsert-error', error.message);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0ea5e9',
    });
  }
}
