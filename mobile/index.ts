import { registerRootComponent } from 'expo';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

import './global.css';

import App from './App';

function Root() {
	return (
		<ClerkProvider tokenCache={tokenCache}>
			<App />
		</ClerkProvider>
	);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
