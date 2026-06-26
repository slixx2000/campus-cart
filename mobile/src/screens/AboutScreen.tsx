import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styles } from '../lib/styles';

export function AboutScreen() {
  const safetyChecklist = [
    'Meet in a public, well-lit location on campus.',
    'Use in-app chat to keep deal context in one place.',
    'Inspect the item before payment and verify condition.',
    'Avoid sending money in advance to unknown sellers.',
  ];

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>How trust works</Text>
        <Text style={styles.noticeBody}>Browsing is open with any email so discovery stays easy.</Text>
        <Text style={styles.noticeBody}>Selling is limited to verified student accounts to reduce scam risk.</Text>
        <Text style={styles.noticeBody}>Look for seller trust signals: Verified Student and Pioneer Seller badges.</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Before every transaction</Text>
        {safetyChecklist.map((item) => (
          <Text key={item} style={styles.statusBody}>• {item}</Text>
        ))}
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperCardTitle}>Launch-stage transparency</Text>
        <Text style={styles.helperText}>Campus Cart only shows trust signals backed by real data. No fake ratings, fake sales counts, or fake reviews.</Text>
      </View>
    </ScrollView>
  );
}
