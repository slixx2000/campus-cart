import { Alert, Keyboard, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../lib/styles';
import { fetchPaymentProducts, createPaymentSession, type PaymentProduct } from '../lib/payments';
import { supabase } from '../lib/supabase';

type PaymentScreenProps = {
  navigation: any;
  route: any;
  user: any;
  profile: any;
  openThemedAlert: (title: string, message: string, icon?: keyof typeof MaterialIcons.glyphMap) => void;
};

export function PaymentScreen({ navigation, route, user, profile, openThemedAlert }: PaymentScreenProps) {
  const { colors } = useTheme();
  const { listingId } = route.params || {};

  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PaymentProduct | null>(null);
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('airtel');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    loadProducts();
    if (user?.user_metadata?.full_name) {
      setCustomerName(user.user_metadata.full_name);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchPaymentProducts();
      setProducts(data);
    } catch (error) {
      console.error('[PAYMENT] Failed to load products:', error);
      openThemedAlert('Error', 'Could not load payment options. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const formatPrice = (minor: number): string => {
    return `K${(minor / 100).toFixed(2)}`;
  };

  const handlePurchase = async () => {
    if (!selectedProduct) {
      openThemedAlert('Select a product', 'Please choose a payment option.');
      return;
    }
    if (!phone.trim()) {
      openThemedAlert('Phone required', 'Enter your mobile money number.');
      return;
    }
    if (!customerName.trim()) {
      openThemedAlert('Name required', 'Enter your name for the payment.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const purposeMap: Record<string, 'listing_boost' | 'featured_listing' | 'seller_subscription'> = {
        boost: 'listing_boost',
        featured: 'featured_listing',
        seller_pro: 'seller_subscription',
      };

      const session = await createPaymentSession({
        productId: selectedProduct.id,
        purpose: purposeMap[selectedProduct.kind],
        listingId,
        phone: phone.trim(),
        operator,
        customerName: customerName.trim(),
      });

      if (Platform.OS === 'android') {
        const ussdCode = `*116*${session.providerReference}#`;
        Alert.alert(
          'Payment initiated',
          `Dial ${ussdCode} to complete your ${selectedProduct.name} payment of ${formatPrice(selectedProduct.priceMinor)}.`,
          [
            { text: 'Copy Code', onPress: () => Linking.openURL(`tel:${ussdCode}`) },
            { text: 'OK', style: 'default' },
          ]
        );
      } else {
        openThemedAlert(
          'Payment initiated',
          `Complete the payment prompt on your phone (${session.providerReference}). Amount: ${formatPrice(selectedProduct.priceMinor)}.`
        );
      }
    } catch (error) {
      console.error('[PAYMENT] Purchase error:', error);
      openThemedAlert('Payment failed', error instanceof Error ? error.message : 'Could not start payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (productsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading payment options...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.fg }]}>Upgrade Your Listing</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Choose a promotion to get more visibility for your listing
          </Text>
        </View>

        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.productCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedProduct?.id === product.id ? colors.accent : colors.line,
                borderWidth: selectedProduct?.id === product.id ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedProduct(product)}
          >
            <View style={styles.productIcon}>
              <MaterialIcons
                name={product.kind === 'boost' ? 'trending-up' : product.kind === 'featured' ? 'star' : 'workspace-premium'}
                size={28}
                color={selectedProduct?.id === product.id ? colors.accent : colors.fg}
              />
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.fg }]}>{product.name}</Text>
              <Text style={[styles.productDesc, { color: colors.muted }]}>{product.description}</Text>
              <View style={styles.productMeta}>
                <Text style={[styles.productPrice, { color: colors.accent }]}>{formatPrice(product.priceMinor)}</Text>
                <Text style={[styles.productDuration, { color: colors.muted }]}>{product.durationDays} day{product.durationDays > 1 ? 's' : ''}</Text>
              </View>
            </View>
            {selectedProduct?.id === product.id && (
              <MaterialIcons name="check-circle" size={24} color={colors.accent} />
            )}
          </TouchableOpacity>
        ))}

        {selectedProduct && (
          <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.fg }]}>Payment Details</Text>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>
              Enter your mobile money number to pay for {selectedProduct.name}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.fg }]}>Your Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.fg, borderColor: colors.line }]}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.fg }]}>Mobile Money Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.fg, borderColor: colors.line }]}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, ''))}
                placeholder="971234567"
                keyboardType="phone-pad"
                maxLength={9}
              />
              <Text style={[styles.hint, { color: colors.muted }]}>Zambia number without country code (e.g., 971234567)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.fg }]}>Network</Text>
              <View style={styles.operatorButtons}>
                {['airtel', 'mtn', 'zamtel'].map((op) => (
                  <TouchableOpacity
                    key={op}
                    style={[
                      styles.operatorButton,
                      {
                        backgroundColor: operator === op ? colors.accent : colors.bg,
                        borderColor: operator === op ? colors.accent : colors.line,
                      },
                    ]}
                    onPress={() => setOperator(op)}
                  >
                    <Text style={[styles.operatorButtonText, { color: operator === op ? '#fff' : colors.fg }]}>
                      {op.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handlePurchase}
              disabled={loading}
            >
              <Text style={styles.purchaseButtonText}>
                {loading ? 'Processing...' : `Pay ${formatPrice(selectedProduct.priceMinor)}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  productDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  productDuration: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  formSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
  operatorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  operatorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  operatorButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  purchaseButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});