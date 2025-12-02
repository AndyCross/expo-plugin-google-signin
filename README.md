# expo-plugin-google-signin

[![npm version](https://img.shields.io/npm/v/expo-plugin-google-signin.svg)](https://www.npmjs.com/package/expo-plugin-google-signin)
[![CI](https://github.com/YOUR_USERNAME/expo-plugin-google-signin/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/expo-plugin-google-signin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An Expo config plugin that adds native Google Sign-In to Android using the modern [Credential Manager API](https://developer.android.com/identity/sign-in/credential-manager). Includes automatic nonce generation for secure Auth0 token exchange.

## Why This Plugin?

- **Modern API**: Uses Android's Credential Manager instead of the deprecated Google Sign-In SDK
- **One-Tap Experience**: Native bottom sheet UI that users trust
- **Auth0 Ready**: Automatic nonce generation enables secure token exchange flows
- **Zero Config**: Works with Expo's managed workflow via config plugins

## Installation

```bash
npm install expo-plugin-google-signin
# or
yarn add expo-plugin-google-signin
```

## Setup

### 1. Add the Plugin

Add to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["expo-plugin-google-signin", {
        "androidPackage": "com.yourcompany.yourapp"
      }]
    ]
  }
}
```

> **Note**: If `androidPackage` is not provided, it defaults to your app's `android.package` from Expo config.

### 2. Get a Web Client ID

You need a **Web Client ID** from Google Cloud Console (not Android Client ID):

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Create an **OAuth 2.0 Client ID** of type **Web application**
4. Copy the Client ID (ends with `.apps.googleusercontent.com`)

See [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md) for detailed instructions.

### 3. Rebuild Your App

```bash
npx expo prebuild --clean
npx expo run:android
```

## Usage

```typescript
import { signInWithGoogle, isGoogleSignInAvailable } from 'expo-plugin-google-signin';

const WEB_CLIENT_ID = 'your-web-client-id.apps.googleusercontent.com';

async function handleGoogleSignIn() {
  if (!isGoogleSignInAvailable()) {
    console.log('Google Sign-In not available on this platform');
    return;
  }

  try {
    const result = await signInWithGoogle(WEB_CLIENT_ID);
    
    if (result) {
      console.log('Signed in as:', result.displayName);
      console.log('Email:', result.id);
      console.log('ID Token:', result.idToken);
      
      // Use result.idToken for your backend or Auth0
    } else {
      console.log('User cancelled sign-in');
    }
  } catch (error) {
    console.error('Sign-in error:', error.code, error.message);
  }
}
```

## API Reference

### `signInWithGoogle(webClientId: string): Promise<GoogleSignInResult | null>`

Initiates the Google Sign-In flow using Credential Manager.

**Parameters:**
- `webClientId` - Your Web Client ID from Google Cloud Console

**Returns:**
- `GoogleSignInResult` on success
- `null` if user cancelled
- Throws on error

### `isGoogleSignInAvailable(): boolean`

Check if Google Sign-In is available on the current platform.

**Returns:** `true` on Android with the native module loaded, `false` otherwise.

### `GoogleSignInResult`

```typescript
interface GoogleSignInResult {
  idToken: string;           // JWT token with nonce (use for Auth0/backend)
  id: string;                // User's email address
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
  profilePictureUri: string | null;
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `SIGN_IN_CANCELLED` | User cancelled the sign-in flow |
| `NO_CREDENTIAL` | No Google account available on device |
| `CREDENTIAL_ERROR` | Credential Manager error |
| `NO_ACTIVITY` | App not in foreground |

## Auth0 Integration

This plugin is designed to work with Auth0's Native Social Login feature. The ID token includes a nonce that Auth0 requires for secure token exchange.

```typescript
import { signInWithGoogle } from 'expo-plugin-google-signin';

async function signInWithAuth0() {
  const googleResult = await signInWithGoogle(WEB_CLIENT_ID);
  if (!googleResult) return;

  // Exchange Google token for Auth0 token
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: googleResult.idToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      client_id: AUTH0_CLIENT_ID,
      audience: AUTH0_AUDIENCE,
      scope: 'openid profile email',
    }),
  });

  const auth0Token = await response.json();
  // Use auth0Token.access_token for your API calls
}
```

See [docs/AUTH0_INTEGRATION.md](docs/AUTH0_INTEGRATION.md) for complete setup instructions.

## iOS Support

This plugin is **Android only**. For iOS, use [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) for native Sign in with Apple, then exchange the Apple token with Auth0 similarly.

```typescript
import { isGoogleSignInAvailable } from 'expo-plugin-google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

async function handleNativeSignIn() {
  if (Platform.OS === 'android' && isGoogleSignInAvailable()) {
    return signInWithGoogle(WEB_CLIENT_ID);
  } else if (Platform.OS === 'ios') {
    return AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  }
}
```

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## Example

Check out the [example](./example) directory for a complete working app.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for how to release new versions.

## License

MIT

