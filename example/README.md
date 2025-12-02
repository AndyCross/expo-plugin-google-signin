# expo-plugin-google-signin Example

A complete example demonstrating Google Sign-In using Android's Credential Manager API.

## Screenshots

The example app shows:
- A "Sign in with Google" button
- User profile display after sign-in (avatar, name, email)
- ID token display for debugging Auth0 integration
- Error handling with user-friendly messages

## Setup

### 1. Install Dependencies

```bash
cd example
npm install
```

### 2. Configure Your Web Client ID

Edit `app.json` and replace the placeholder with your Google Web Client ID:

```json
{
  "expo": {
    "extra": {
      "googleWebClientId": "YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com"
    }
  }
}
```

To get a Web Client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials of type **Web application**
3. Copy the Client ID

### 3. Build and Run

```bash
# Build the native Android app
npx expo prebuild --clean

# Run on Android device or emulator
npx expo run:android
```

> **Note**: This plugin only works on Android. On iOS, the app will show a message explaining that Google Sign-In via Credential Manager is Android-only.

## What the Example Demonstrates

### Basic Sign-In Flow

```typescript
const result = await signInWithGoogle(WEB_CLIENT_ID);

if (result) {
  console.log('Signed in:', result.displayName);
  console.log('Email:', result.id);
  console.log('ID Token:', result.idToken);
} else {
  console.log('User cancelled');
}
```

### Platform Detection

```typescript
import { isGoogleSignInAvailable } from 'expo-plugin-google-signin';

if (isGoogleSignInAvailable()) {
  // Show Google Sign-In button
} else {
  // Show alternative auth method
}
```

### Error Handling

```typescript
try {
  await signInWithGoogle(webClientId);
} catch (error) {
  switch (error.code) {
    case 'NO_CREDENTIAL':
      // No Google account on device
      break;
    case 'CREDENTIAL_ERROR':
      // General failure
      break;
  }
}
```

## Testing

1. **On a physical Android device**: Works best, as you likely have a Google account signed in
2. **On an Android emulator**: Use an emulator with Google Play Services (Google APIs image) and sign into a Google account first

## Troubleshooting

### "Google Sign-In not available"

- Make sure you're running on Android
- Ensure the app was built with `npx expo prebuild --clean` after adding the plugin

### "No credential available"

- Add a Google account to your device/emulator (Settings → Accounts)

### "Sign-in failed"

- Verify your Web Client ID is correct
- Check that Google Cloud Console is properly configured
- See the main [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for more solutions

