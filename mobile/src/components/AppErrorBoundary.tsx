import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

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
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
          <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Something went wrong</Text>
            <Text style={{ color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 18 }}>
              Campus Cart hit an unexpected error. Try again, and if this keeps happening restart the app.
            </Text>
            <Pressable
              onPress={this.handleRetry}
              style={{ backgroundColor: '#0ea5e9', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Try again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
