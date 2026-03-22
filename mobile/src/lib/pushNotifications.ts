import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | null {
  const fromEas = Constants?.easConfig?.projectId;
  if (fromEas) return fromEas;

  const fromExtra = (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (fromExtra) return fromExtra;

  return null;
}

export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) {
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
