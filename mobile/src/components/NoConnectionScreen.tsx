import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../lib/styles';

export function NoConnectionScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.emptyState}>
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <MaterialIcons name="wifi-off" size={64} color="#3b82f6" />
          </View>
        </View>
        <Text style={styles.emptyTitle}>No connection right now</Text>
        <Text style={styles.emptyBody}>
          Check your internet connection and try again. You need an active connection to browse listings.
        </Text>
        {onRetry ? (
          <Pressable style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
