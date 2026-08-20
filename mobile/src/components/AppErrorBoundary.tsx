import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { radius, text, useTheme } from '../lib/styles';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * The fallback is its own component because the boundary has to be a class
 * (getDerivedStateFromError has no hook equivalent) and classes cannot read the
 * theme context through useTheme. The boundary is mounted inside ThemeProvider
 * — see App.tsx — so the hook is safe here.
 */
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.fg, fontSize: text.xl, fontWeight: '700', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 18 }}>
          CampusCart hit an unexpected error. Try again, and if this keeps happening restart the app.
        </Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.sm,
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('app-error-boundary', error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
